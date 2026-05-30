import os
import threading
import time
import json
from contextlib import asynccontextmanager

import cv2
import uvicorn
from dotenv import load_dotenv
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException, Body
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from detector import MotionDetector, ObjectDetector
from camera_stream import CameraStream
from alert_sender import AlertSender
from zone_detector import ZoneDetector
from utils import (
    draw_detections, draw_motion_contours,
    add_timestamp, add_status_overlay,
    frame_to_jpeg, create_placeholder_frame
)

load_dotenv()

# ─── Configuration ────────────────────────────────────────
BACKEND_URL = os.getenv('NODE_BACKEND_URL', 'http://localhost:5000')
API_KEY = os.getenv('API_KEY', 'ai_service_internal_key_2024')
DETECTION_CONFIDENCE = float(os.getenv('DETECTION_CONFIDENCE', '0.5'))
ALERT_COOLDOWN = int(os.getenv('ALERT_COOLDOWN', '30'))
MOTION_THRESHOLD = int(os.getenv('MOTION_THRESHOLD', '5000'))
FPS_LIMIT = int(os.getenv('FPS_LIMIT', '15'))

# ─── Global state ─────────────────────────────────────────
cameras = {}           # camera_id -> CameraStream
processing_threads = {}  # camera_id -> threading.Thread
processing_active = {}   # camera_id -> bool

motion_detector = MotionDetector(threshold=MOTION_THRESHOLD)
object_detector = None  # Lazy-loaded
alert_sender = AlertSender(BACKEND_URL, API_KEY, cooldown=ALERT_COOLDOWN)
zone_detector = ZoneDetector()

# Latest annotated frame per camera (for MJPEG streaming)
latest_frames = {}
latest_detections = {}


def get_object_detector():
    """Lazy-load the YOLO model (heavy)."""
    global object_detector
    if object_detector is None:
        object_detector = ObjectDetector(
            model_path='yolov8n.pt',
            confidence=DETECTION_CONFIDENCE
        )
    return object_detector


def process_camera(camera_id, camera_info):
    """Main processing loop for a camera."""
    global processing_active, latest_frames, latest_detections

    source = camera_info.get('source', '0')
    camera_name = camera_info.get('name', f'Camera {camera_id}')

    stream = CameraStream(source=source, fps_limit=FPS_LIMIT)
    cameras[camera_id] = stream

    if not stream.start():
        print(f"❌ Failed to start camera: {camera_id}")
        alert_sender.update_camera_status(camera_id, 'error')
        return

    alert_sender.update_camera_status(camera_id, 'online')
    detector = get_object_detector()

    # Local motion detector per camera
    cam_motion = MotionDetector(threshold=MOTION_THRESHOLD)

    print(f"🎬 Processing started: {camera_name} ({camera_id})")

    frame_skip = 0
    while processing_active.get(camera_id, False):
        ret, frame = stream.read()
        if not ret:
            time.sleep(0.1)
            continue

        frame_skip += 1
        annotated = frame.copy()

        # Motion detection every frame
        motion_detected, motion_area, contours, _ = cam_motion.detect(frame)

        if motion_detected:
            draw_motion_contours(annotated, contours)

        # Object detection every 3rd frame (for performance)
        detections = []
        if motion_detected and frame_skip % 3 == 0:
            detections = detector.detect(frame)
            latest_detections[camera_id] = detections

            if detections:
                draw_detections(annotated, detections)

                # Check zone intrusion
                intrusions = zone_detector.check_intrusion(camera_id, detections)

                # Determine alert type
                alert_type = detector.get_alert_type(detections)
                if intrusions:
                    alert_type = 'intrusion'

                # Calculate max confidence
                max_confidence = max(d['confidence'] for d in detections)

                # Send alert
                alert_sender.send_alert(
                    camera_id=camera_id,
                    alert_type=alert_type,
                    confidence=max_confidence,
                    frame=frame,
                    detections=detections
                )

        # Draw zones
        zone_detector.draw_zones(annotated, camera_id)

        # Add overlays
        add_timestamp(annotated)
        add_status_overlay(
            annotated,
            camera_name=camera_name,
            fps=stream.fps_actual,
            detections_count=len(detections),
            motion=motion_detected
        )

        # Store annotated frame for streaming
        latest_frames[camera_id] = annotated

    # Cleanup
    stream.stop()
    alert_sender.update_camera_status(camera_id, 'offline')
    print(f"🛑 Processing stopped: {camera_name}")


# ─── FastAPI App ──────────────────────────────────────────

@asynccontextmanager
async def lifespan(app):
    print("""
╔══════════════════════════════════════════╗
║   🤖 AI Camera Security - AI Service    ║
║   📹 OpenCV + YOLOv8                    ║
║   🔗 Backend: {backend}
╚══════════════════════════════════════════╝
    """.format(backend=BACKEND_URL))
    yield
    # Cleanup on shutdown
    for cam_id in list(processing_active.keys()):
        processing_active[cam_id] = False
    for cam_id, stream in cameras.items():
        stream.stop()


app = FastAPI(title="AI Camera Security - AI Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "cameras_active": len([c for c in processing_active.values() if c]),
        "model_loaded": object_detector is not None
    }


@app.post("/start-camera/{camera_id}")
async def start_camera(camera_id: str, source: str = "0", name: str = "Camera"):
    """Start processing a camera source."""
    if camera_id in processing_active and processing_active[camera_id]:
        print(f"🔄 Camera {camera_id} is already running. Stopping first to apply new source/restart...")
        processing_active[camera_id] = False
        # Wait a short moment for thread/stream cleanup
        time.sleep(1.2)

    processing_active[camera_id] = True

    camera_info = {
        'source': source,
        'name': name
    }

    thread = threading.Thread(
        target=process_camera,
        args=(camera_id, camera_info),
        daemon=True
    )
    thread.start()
    processing_threads[camera_id] = thread

    return {"message": f"Camera {camera_id} started and initialized", "source": source}


@app.post("/stop-camera/{camera_id}")
async def stop_camera(camera_id: str):
    """Stop processing a camera."""
    if camera_id not in processing_active:
        raise HTTPException(404, "Camera not found")

    processing_active[camera_id] = False

    return {"message": f"Camera {camera_id} stopping"}


@app.get("/stream/{camera_id}")
async def video_stream(camera_id: str):
    """MJPEG video stream for a camera."""
    def generate():
        while True:
            frame = latest_frames.get(camera_id)
            if frame is not None:
                jpeg = frame_to_jpeg(frame, quality=60)
                yield (
                    b'--frame\r\n'
                    b'Content-Type: image/jpeg\r\n\r\n' + jpeg + b'\r\n'
                )
            else:
                # Send placeholder
                placeholder = create_placeholder_frame(text=f"Camera {camera_id} - Waiting...")
                jpeg = frame_to_jpeg(placeholder)
                yield (
                    b'--frame\r\n'
                    b'Content-Type: image/jpeg\r\n\r\n' + jpeg + b'\r\n'
                )
            time.sleep(1.0 / FPS_LIMIT)

    return StreamingResponse(
        generate(),
        media_type='multipart/x-mixed-replace; boundary=frame'
    )


@app.get("/snapshot/{camera_id}")
async def snapshot(camera_id: str):
    """Get current frame as JPEG image."""
    frame = latest_frames.get(camera_id)
    if frame is None:
        frame = create_placeholder_frame()

    jpeg = frame_to_jpeg(frame, quality=85)
    return StreamingResponse(
        iter([jpeg]),
        media_type='image/jpeg'
    )


@app.get("/detections/{camera_id}")
async def get_detections(camera_id: str):
    """Get latest detections for a camera."""
    return {
        "camera_id": camera_id,
        "detections": latest_detections.get(camera_id, []),
        "processing": processing_active.get(camera_id, False)
    }


@app.get("/status")
async def status():
    """Get status of all cameras."""
    statuses = {}
    for cam_id in set(list(processing_active.keys()) + list(cameras.keys())):
        stream = cameras.get(cam_id)
        statuses[cam_id] = {
            "processing": processing_active.get(cam_id, False),
            "stream_info": stream.info if stream else None,
            "latest_detections": len(latest_detections.get(cam_id, []))
        }
    return {"cameras": statuses}


@app.post("/zones/{camera_id}")
async def set_zones(camera_id: str, zones: list = Body(...)):
    """Set intrusion detection zones for a camera."""
    zone_detector.set_zones(camera_id, zones)
    return {"message": f"Zones set for camera {camera_id}", "count": len(zones)}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        workers=1
    )
