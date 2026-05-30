# 🛡️ AI Camera Security System

Real-time AI-powered camera surveillance with motion detection, object recognition, and anomaly alerts.

## Architecture

```
Camera/Webcam → Python AI Service (OpenCV + YOLOv8)
                        ↓
                Node.js Backend (Express + Socket.IO)
                        ↓
                React Dashboard (Real-time UI)
```

## Quick Start

### 1. Backend (Node.js)
```bash
cd backend
npm install
npm run dev
```

### 2. AI Service (Python)
```bash
cd ai-service
pip install -r requirements.txt
python main.py
```

### 3. Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

## Default Credentials
- **Admin**: admin / admin123

## Tech Stack
| Service | Technology |
|---------|-----------|
| AI Processing | Python, FastAPI, OpenCV, YOLOv8 |
| Backend API | Node.js, Express, Socket.IO, Mongoose |
| Frontend | React, Vite, Zustand, Recharts |
| Database | MongoDB Atlas |
