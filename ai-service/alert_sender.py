import requests
import os
import time
import json
from datetime import datetime


class AlertSender:
    """Sends detection alerts to the Node.js backend."""

    def __init__(self, backend_url, api_key, cooldown=30):
        self.backend_url = backend_url.rstrip('/')
        self.api_key = api_key
        self.cooldown = cooldown
        self.last_alert_time = {}  # camera_id -> last alert timestamp
        self.snapshots_dir = os.path.join(os.path.dirname(__file__), 'snapshots')
        os.makedirs(self.snapshots_dir, exist_ok=True)

    def can_send_alert(self, camera_id):
        """Check if enough time has passed since the last alert for this camera."""
        last_time = self.last_alert_time.get(camera_id, 0)
        return (time.time() - last_time) >= self.cooldown

    def save_snapshot(self, frame, camera_id):
        """Save frame as JPEG snapshot, return filepath."""
        import cv2
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_%f')
        filename = f"cam{camera_id}_{timestamp}.jpg"
        filepath = os.path.join(self.snapshots_dir, filename)
        cv2.imwrite(filepath, frame)
        return filepath

    def send_alert(self, camera_id, alert_type, confidence, frame, detections=None):
        """
        Send an alert to the Node.js backend.
        
        Args:
            camera_id: MongoDB camera ID
            alert_type: 'motion', 'person', 'intrusion', 'vehicle', 'fire', etc.
            confidence: float 0-1
            frame: numpy array (OpenCV frame)
            detections: list of detection dicts
        
        Returns:
            True if sent successfully
        """
        if not self.can_send_alert(camera_id):
            return False

        try:
            # Save snapshot
            snapshot_path = self.save_snapshot(frame, camera_id)

            # Prepare multipart form data
            url = f"{self.backend_url}/api/alerts"
            
            data = {
                'camera_id': camera_id,
                'type': alert_type,
                'confidence': str(confidence),
            }

            if detections:
                data['objects'] = json.dumps(detections)

            files = {
                'image': ('snapshot.jpg', open(snapshot_path, 'rb'), 'image/jpeg')
            }

            headers = {
                'X-API-Key': self.api_key
            }

            response = requests.post(url, data=data, files=files, headers=headers, timeout=10)

            if response.status_code == 201:
                self.last_alert_time[camera_id] = time.time()
                result = response.json()
                print(f"🚨 Alert sent: {alert_type} (confidence: {confidence:.2f}) → Camera {camera_id}")
                return True
            else:
                print(f"⚠️ Alert send failed: {response.status_code} - {response.text}")
                return False

        except requests.exceptions.ConnectionError:
            print(f"❌ Cannot connect to backend: {self.backend_url}")
            return False
        except Exception as e:
            print(f"❌ Alert send error: {e}")
            return False

    def update_camera_status(self, camera_id, status):
        """Update camera status in the backend."""
        try:
            url = f"{self.backend_url}/api/cameras/{camera_id}/status"
            headers = {
                'Content-Type': 'application/json',
                'X-API-Key': self.api_key
            }
            response = requests.put(url, json={'status': status}, headers=headers, timeout=5)
            return response.status_code == 200
        except Exception as e:
            print(f"⚠️ Status update failed: {e}")
            return False
