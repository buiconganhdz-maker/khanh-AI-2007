import cv2
import numpy as np


class ZoneDetector:
    """Detects objects entering restricted zones (polygon areas)."""

    def __init__(self):
        self.zones = {}  # camera_id -> list of zone polygons

    def set_zones(self, camera_id, zones):
        """
        Set zones for a camera.
        zones: list of dicts with 'name', 'points' [{x, y}, ...], 'active'
        """
        self.zones[camera_id] = []
        for zone in zones:
            if not zone.get('active', True):
                continue
            points = np.array(
                [[p['x'], p['y']] for p in zone['points']],
                dtype=np.int32
            )
            self.zones[camera_id].append({
                'name': zone.get('name', 'Zone'),
                'points': points,
                'color': zone.get('color', '#ff0000')
            })

    def check_intrusion(self, camera_id, detections):
        """
        Check if any detected objects are inside restricted zones.
        Returns list of intrusion events.
        """
        if camera_id not in self.zones:
            return []

        intrusions = []
        for det in detections:
            bbox = det['bbox']
            # Use center-bottom point of bounding box (feet position)
            center_x = bbox['x'] + bbox['w'] // 2
            bottom_y = bbox['y'] + bbox['h']
            point = (center_x, bottom_y)

            for zone in self.zones[camera_id]:
                # Check if point is inside zone polygon
                result = cv2.pointPolygonTest(zone['points'], point, False)
                if result >= 0:  # Inside or on edge
                    intrusions.append({
                        'object': det['name'],
                        'confidence': det['confidence'],
                        'zone': zone['name'],
                        'bbox': det['bbox'],
                        'point': {'x': center_x, 'y': bottom_y}
                    })
                    break  # One zone match is enough per detection

        return intrusions

    def draw_zones(self, frame, camera_id, alpha=0.3):
        """Draw zone overlays on the frame."""
        if camera_id not in self.zones:
            return frame

        overlay = frame.copy()
        for zone in self.zones[camera_id]:
            # Parse hex color
            color_hex = zone['color'].lstrip('#')
            color_bgr = tuple(int(color_hex[i:i + 2], 16) for i in (4, 2, 0))

            # Fill polygon with transparency
            cv2.fillPoly(overlay, [zone['points']], color_bgr)

            # Draw border
            cv2.polylines(frame, [zone['points']], True, color_bgr, 2)

            # Draw zone name
            centroid = zone['points'].mean(axis=0).astype(int)
            cv2.putText(
                frame, zone['name'],
                (centroid[0] - 20, centroid[1]),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2
            )

        # Blend overlay
        cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)
        return frame

    def get_zones(self, camera_id):
        """Get zones for a camera."""
        return self.zones.get(camera_id, [])

    def has_zones(self, camera_id):
        """Check if camera has any active zones."""
        return camera_id in self.zones and len(self.zones[camera_id]) > 0
