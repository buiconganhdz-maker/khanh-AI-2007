# Hướng Dẫn Triển Khai Hệ Thống AI Camera Lên Render.com 🚀

Tài liệu này hướng dẫn chi tiết cách đưa dự án **AI Camera Security** (gồm Node.js Backend, React Frontend và Python AI Service) lên môi trường internet bằng dịch vụ **Render.com**.

---

## 📌 Kiến Trúc Triển Khai Trên Cloud

Hệ thống của chúng ta gồm 3 thành phần chính:
1. **Frontend (React + Vite)**: Triển khai dưới dạng **Static Site** (Miễn phí trên Render).
2. **Backend (Node.js + Express)**: Triển khai dưới dạng **Web Service** (Miễn phí trên Render).
3. **Database (MongoDB)**: Sử dụng **MongoDB Atlas Cloud** (Đã cấu hình sẵn trong dự án).
4. **AI Service (Python + YOLOv8)**: 
   * > [!IMPORTANT]
   * > **Lưu ý đặc biệt về AI Service**: 
   * > - Gói miễn phí của Render chỉ hỗ trợ tối đa **512MB RAM**, trong khi thư viện PyTorch, YOLOv8 và OpenCV cần tối thiểu **1.2GB - 2GB RAM** để khởi chạy. Nếu deploy trực tiếp lên Render Free, dịch vụ sẽ bị lỗi crash tràn bộ nhớ (Out of Memory).
   * > - Khi chạy trên Cloud, AI Service **không thể truy cập Webcam `0`** hoặc **file MP4 trên máy tính cá nhân** của bạn trừ khi được truyền tải qua các giao thức mạng (như RTSP công khai).
   * > - **Giải pháp tối ưu**: Triển khai **Frontend + Backend** lên Render Cloud, còn **AI Service** chạy cục bộ tại máy tính của bạn (Edge AI) hoặc một máy chủ VPS có GPU/RAM lớn (như DigitalOcean, AWS EC2), sau đó kết nối thông qua URL ngrok hoặc IP tĩnh.

---

## Bước 1: Chuẩn Bị Source Code Lên GitHub

Render kết nối trực tiếp với GitHub để tự động build & deploy mỗi khi bạn push code mới.

1. Khởi tạo Git tại thư mục gốc của dự án (`d:\Users\khanh\Desktop\khanh`):
   ```bash
   git init
   ```
2. Tạo file `.gitignore` ở thư mục gốc (nếu chưa có) để loại bỏ thư mục nặng:
   ```text
   node_modules/
   .env
   __pycache__/
   *.pt
   snapshots/
   dist/
   ```
3. Commit toàn bộ code lên Git:
   ```bash
   git add .
   git commit -m "Prepare for cloud deployment"
   ```
4. Tạo một Repo mới trên **GitHub** (để chế độ Private hoặc Public) và push code lên:
   ```bash
   git remote add origin <đường-dẫn-repo-github>
   git branch -M main
   git push -u origin main
   ```

---

## Bước 2: Triển Khai Node.js Backend (Web Service)

1. Đăng nhập vào [Render.com](https://render.com) bằng tài khoản GitHub của bạn.
2. Nhấn nút **New +** ở góc phải -> Chọn **Web Service**.
3. Chọn Repository dự án bạn vừa push lên.
4. Cấu hình các thông số sau:
   * **Name**: `ai-camera-backend` (hoặc tên tùy chọn)
   * **Region**: Chọn vùng gần Việt Nam nhất (ví dụ: `Singapore` hoặc `Oregon`)
   * **Branch**: `main`
   * **Root Directory**: `backend` (Rất quan trọng - để Render hiểu thư mục chứa Node.js)
   * **Runtime**: `Node`
   * **Build Command**: `npm install`
   * **Start Command**: `node server.js`
   * **Instance Type**: Chọn **Free** (Miễn phí)
5. Cấu hình **Environment Variables** (Biến môi trường) bằng cách nhấn vào mục **Advanced** -> Thêm các biến sau:
   * `MONGODB_URI`: *Dán đường dẫn kết nối MongoDB Atlas của bạn*
   * `PORT`: `5000`
   * `JWT_SECRET`: *Tạo một chuỗi ngẫu nhiên bảo mật (ví dụ: `jwt_secret_key_2026_xyz`)*
   * `JWT_REFRESH_SECRET`: *Tạo một chuỗi ngẫu nhiên bảo mật khác*
   * `API_KEY`: `ai_service_internal_key_2024` (Khóa kết nối nội bộ với AI Service)
   * `NODE_ENV`: `production`
6. Bấm **Create Web Service**. 
   * *Render sẽ tiến hành build và cấp cho bạn một URL có dạng: `https://ai-camera-backend.onrender.com`.*

---

## Bước 3: Triển Khai React Frontend (Static Site)

Trước khi deploy Frontend, chúng ta cần cấu hình để nó trỏ các API Request về URL Backend vừa tạo ở trên thay vì `localhost:5000`.

### 1. Cập nhật URL API trong file `frontend/src/api.js`:
Mở file [api.js](file:///d:/Users/khanh/Desktop/khanh/frontend/src/api.js) và đổi các hằng số URL API thành linh hoạt:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const AI_URL = import.meta.env.VITE_AI_URL || 'http://localhost:8000';
```
*(Hãy commit và push thay đổi này lên GitHub).*

### 2. Tạo Static Site trên Render:
1. Tại Dashboard của Render, nhấn **New +** -> Chọn **Static Site**.
2. Chọn Repository dự án của bạn.
3. Cấu hình các thông số:
   * **Name**: `ai-camera-dashboard`
   * **Root Directory**: `frontend`
   * **Build Command**: `npm run build`
   * **Publish Directory**: `dist` (Thư mục chứa file HTML/JS sau khi build)
4. Nhấn **Advanced** -> Thêm các biến môi trường:
   * `VITE_API_URL`: `https://ai-camera-backend.onrender.com/api` (URL của Web Service Node.js ở Bước 2)
   * `VITE_AI_URL`: Đường dẫn tới máy chủ chạy AI Service (Nếu chạy local thì điền IP local hoặc URL ngrok của bạn, ví dụ: `https://xxxx.ngrok-free.app`).
5. Bấm **Create Static Site**.
   * *Render sẽ tự động build và cấp cho bạn URL truy cập Dashboard, ví dụ: `https://ai-camera-dashboard.onrender.com`.*

---

## Bước 4: Cấu Hình Kết Nối Với AI Service (Local hoặc Cloud VPS)

Vì AI Service chạy cục bộ trên máy tính của bạn để đọc camera vật lý, bạn cần tạo một đường truyền an toàn từ Backend (trên Cloud Render) kết nối về máy tính cá nhân của bạn.

### Giải pháp sử dụng **Ngrok** (Miễn phí & Cực nhanh):
1. Tải và cài đặt **ngrok** trên máy tính của bạn từ [ngrok.com](https://ngrok.com).
2. Chạy AI Service cục bộ (`python main.py` chạy trên port `8000`).
3. Mở một terminal mới và chạy lệnh tạo đường truyền ngrok tới port `8000`:
   ```bash
   ngrok http 8000
   ```
4. Ngrok sẽ cấp cho bạn một đường dẫn công khai có dạng:
   `https://a1b2-34-56-78.ngrok-free.app`
5. **Cập nhật lại cấu hình**:
   * Vào **Render** -> Chọn **Web Service (Backend)** -> Vào phần **Environment Variables** -> Thêm hoặc cập nhật biến:
     * `AI_SERVICE_URL` hoặc cấu hình tương ứng trỏ về URL ngrok đó.
   * Vào **Render** -> Chọn **Static Site (Frontend)** -> Cập nhật biến `VITE_AI_URL` trỏ về URL ngrok đó.

Giờ đây, dù hệ thống Frontend và Backend chạy trên internet toàn cầu (Render), chúng vẫn có thể gửi lệnh điều khiển và nhận luồng video stream trực tiếp từ máy tính cá nhân/camera tại nhà của bạn một cách mượt mà và bảo mật! 🚀
