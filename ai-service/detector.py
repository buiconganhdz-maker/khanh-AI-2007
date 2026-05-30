import cv2
import numpy as np
from ultralytics import YOLO
import time


class MotionDetector:
    """Detects motion using background subtraction (MOG2)."""

    def __init__(self, threshold=5000, history=500, var_threshold=50):
        self.bg_subtractor = cv2.createBackgroundSubtractorMOG2(
            history=history,
            varThreshold=var_threshold,
            detectShadows=True
        )
        self.threshold = threshold
        self.kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))

    def detect(self, frame):
        """
        Returns (motion_detected: bool, motion_area: int, contours: list)
        """
        # Apply background subtraction
        fg_mask = self.bg_subtractor.apply(frame)

        # Remove shadows (shadows are marked as 127 in MOG2)
        _, fg_mask = cv2.threshold(fg_mask, 200, 255, cv2.THRESH_BINARY)

        # Morphological operations to remove noise
        fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, self.kernel)
        fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_CLOSE, self.kernel)
        fg_mask = cv2.dilate(fg_mask, self.kernel, iterations=2)

        # Find contours
        contours, _ = cv2.findContours(
            fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )

        # Calculate total motion area
        motion_area = sum(cv2.contourArea(c) for c in contours)

        # Filter small contours
        significant_contours = [c for c in contours if cv2.contourArea(c) > 500]

        return motion_area > self.threshold, motion_area, significant_contours, fg_mask


class ObjectDetector:
    """Detects and classifies objects using YOLOv8."""

    # Map class names to alert types
    ALERT_MAPPING = {
        'person': 'person',
        'car': 'vehicle',
        'truck': 'vehicle',
        'bus': 'vehicle',
        'motorcycle': 'vehicle',
        'bicycle': 'vehicle',
        'dog': 'motion',
        'cat': 'motion',
        'fire hydrant': 'motion',
        'knife': 'weapon',
        'scissors': 'weapon',
    }

    def __init__(self, model_path='yolov8n.pt', confidence=0.5):
        """
        Initialize YOLO detector.
        model_path: 'yolov8n.pt' (nano, fast), 'yolov8s.pt' (small), 'yolov8m.pt' (medium)
        """
        print(f"🤖 Loading YOLO model: {model_path}")
        self.model = YOLO(model_path)
        self.confidence = confidence
        self.class_names = self.model.names
        print(f"✅ YOLO model loaded. Classes: {len(self.class_names)}")

    def detect(self, frame):
        """
        Run object detection on a frame.
        Returns list of detections: [{name, confidence, bbox: {x, y, w, h}, class_id}]
        """
        results = self.model(frame, conf=self.confidence, verbose=False)
        detections = []

        for result in results:
            boxes = result.boxes
            if boxes is None:
                continue

            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                conf = float(box.conf[0].cpu().numpy())
                cls_id = int(box.cls[0].cpu().numpy())
                name = self.class_names[cls_id]

                detections.append({
                    'name': name,
                    'confidence': round(conf, 3),
                    'bbox': {
                        'x': int(x1),
                        'y': int(y1),
                        'w': int(x2 - x1),
                        'h': int(y2 - y1)
                    },
                    'class_id': cls_id
                })

        return detections

    def get_alert_type(self, detections):
        """Determine the most severe alert type from detections."""
        severity_order = ['weapon', 'fire', 'smoke', 'person', 'vehicle', 'motion']

        alert_types = set()
        for det in detections:
            alert_type = self.ALERT_MAPPING.get(det['name'], 'motion')
            alert_types.add(alert_type)

        for sev in severity_order:
            if sev in alert_types:
                return sev

        return 'motion'
