import cv2
import numpy as np
from datetime import datetime


def draw_detections(frame, detections, color=(0, 255, 0)):
    """Draw bounding boxes and labels on frame."""
    for det in detections:
        bbox = det['bbox']
        x, y, w, h = bbox['x'], bbox['y'], bbox['w'], bbox['h']
        conf = det['confidence']
        name = det['name']

        # Color based on object type
        colors = {
            'person': (0, 255, 0),      # Green
            'car': (255, 165, 0),        # Orange
            'truck': (255, 165, 0),
            'dog': (255, 255, 0),        # Yellow
            'cat': (255, 255, 0),
            'fire': (0, 0, 255),         # Red
            'smoke': (128, 128, 128),    # Gray
        }
        box_color = colors.get(name, color)

        # Draw bounding box
        cv2.rectangle(frame, (x, y), (x + w, y + h), box_color, 2)

        # Draw label background
        label = f"{name} {conf:.0%}"
        (label_w, label_h), _ = cv2.getTextSize(
            label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1
        )
        cv2.rectangle(
            frame,
            (x, y - label_h - 10),
            (x + label_w + 5, y),
            box_color, -1
        )

        # Draw label text
        cv2.putText(
            frame, label,
            (x + 2, y - 5),
            cv2.FONT_HERSHEY_SIMPLEX, 0.5,
            (255, 255, 255), 1, cv2.LINE_AA
        )

    return frame


def draw_motion_contours(frame, contours, color=(0, 0, 255)):
    """Draw motion contour outlines."""
    for contour in contours:
        if cv2.contourArea(contour) > 500:
            x, y, w, h = cv2.boundingRect(contour)
            cv2.rectangle(frame, (x, y), (x + w, y + h), color, 1)
    return frame


def add_timestamp(frame):
    """Add timestamp overlay to frame."""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    h, w = frame.shape[:2]

    # Background bar
    cv2.rectangle(frame, (0, h - 30), (w, h), (0, 0, 0), -1)

    # Text
    cv2.putText(
        frame, timestamp,
        (10, h - 8),
        cv2.FONT_HERSHEY_SIMPLEX, 0.6,
        (255, 255, 255), 1, cv2.LINE_AA
    )
    return frame


def add_status_overlay(frame, camera_name="Camera", fps=0, detections_count=0, motion=False):
    """Add status info overlay to top-left corner."""
    lines = [
        f"CAM: {camera_name}",
        f"FPS: {fps}",
        f"Objects: {detections_count}",
        f"Motion: {'YES' if motion else 'NO'}"
    ]

    y_offset = 25
    for i, line in enumerate(lines):
        color = (0, 0, 255) if 'YES' in line else (0, 255, 0)
        cv2.putText(
            frame, line,
            (10, y_offset + i * 22),
            cv2.FONT_HERSHEY_SIMPLEX, 0.5,
            color, 1, cv2.LINE_AA
        )

    return frame


def frame_to_jpeg(frame, quality=70):
    """Convert frame to JPEG bytes."""
    _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, quality])
    return buffer.tobytes()


def create_placeholder_frame(width=1280, height=720, text="No Camera Signal"):
    """Create a placeholder frame when camera is offline."""
    frame = np.zeros((height, width, 3), dtype=np.uint8)
    frame[:] = (30, 30, 40)  # Dark background

    # Center text
    font = cv2.FONT_HERSHEY_SIMPLEX
    text_size = cv2.getTextSize(text, font, 1.0, 2)[0]
    text_x = (width - text_size[0]) // 2
    text_y = (height + text_size[1]) // 2

    cv2.putText(frame, text, (text_x, text_y), font, 1.0, (100, 100, 100), 2, cv2.LINE_AA)

    return frame
