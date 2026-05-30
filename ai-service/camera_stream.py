import cv2
import threading
import time
import numpy as np
from collections import deque


class CameraStream:
    """Thread-safe camera stream reader with MJPEG output support."""

    def __init__(self, source=0, fps_limit=15):
        """
        source: int (webcam index) or str (RTSP URL)
        """
        self.source = int(source) if str(source).isdigit() else source
        self.fps_limit = fps_limit
        self.frame = None
        self.ret = False
        self.running = False
        self.lock = threading.Lock()
        self.cap = None
        self.fps_actual = 0
        self.frame_count = 0
        self._thread = None
        self.frame_buffer = deque(maxlen=5)

    def start(self):
        """Start the camera capture thread."""
        if self.running:
            return True

        self.cap = cv2.VideoCapture(self.source)
        if not self.cap.isOpened():
            # If the webcam index (integer) failed to open, try falling back to index 0
            if isinstance(self.source, int) and self.source != 0:
                print(f"⚠️ Cannot open webcam index {self.source}. Attempting automatic fallback to webcam index 0...")
                self.source = 0
                self.cap = cv2.VideoCapture(self.source)
                if self.cap.isOpened():
                    print("✅ Automatic fallback to webcam index 0 successful!")
                else:
                    print(f"❌ Cannot open camera source: {self.source}")
                    return False
            else:
                print(f"❌ Cannot open camera source: {self.source}")
                return False

        # Set camera properties for better performance
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

        self.running = True
        self._thread = threading.Thread(target=self._capture_loop, daemon=True)
        self._thread.start()

        print(f"📹 Camera started: {self.source}")
        return True

    def _capture_loop(self):
        """Background thread to continuously read frames."""
        frame_delay = 1.0 / self.fps_limit
        fps_timer = time.time()
        fps_count = 0

        while self.running:
            start = time.time()
            ret, frame = self.cap.read()

            if not ret:
                print(f"⚠️ Camera read failed: {self.source}")
                time.sleep(1)
                # Try to reconnect
                self.cap.release()
                self.cap = cv2.VideoCapture(self.source)
                continue

            with self.lock:
                self.frame = frame
                self.ret = True
                self.frame_count += 1
                self.frame_buffer.append(frame.copy())

            fps_count += 1
            if time.time() - fps_timer >= 1.0:
                self.fps_actual = fps_count
                fps_count = 0
                fps_timer = time.time()

            # FPS limiting
            elapsed = time.time() - start
            if elapsed < frame_delay:
                time.sleep(frame_delay - elapsed)

    def read(self):
        """Read the latest frame (thread-safe)."""
        with self.lock:
            if self.frame is not None:
                return True, self.frame.copy()
            return False, None

    def stop(self):
        """Stop the camera capture."""
        self.running = False
        if self._thread:
            self._thread.join(timeout=5)
        if self.cap:
            self.cap.release()
        print(f"📹 Camera stopped: {self.source}")

    def get_mjpeg_frame(self):
        """Get the current frame as JPEG bytes for MJPEG streaming."""
        with self.lock:
            if self.frame is None:
                return None
            _, jpeg = cv2.imencode('.jpg', self.frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
            return jpeg.tobytes()

    def is_active(self):
        return self.running and self.ret

    @property
    def info(self):
        if self.cap and self.cap.isOpened():
            return {
                'source': str(self.source),
                'width': int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
                'height': int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
                'fps': self.fps_actual,
                'frames': self.frame_count,
                'active': self.is_active()
            }
        return {'source': str(self.source), 'active': False}
