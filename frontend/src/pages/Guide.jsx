import { useState, useMemo } from 'react';
import {
  BookOpen, Search, Camera, Bell, BarChart3, Settings, Shield,
  LogIn, UserPlus, Play, Square, Plus, Trash2, Filter, Check,
  Eye, ChevronDown, ArrowRight, Monitor, Cpu, Database, Globe,
  Lock, Key, Info, AlertTriangle, Zap, RefreshCw, MapPin, Mail,
  Send, Users, Clock, TrendingUp, HelpCircle
} from 'lucide-react';
import './Guide.css';

/* ─── Section Data ───────────────────────────────────── */
const SECTIONS = [
  {
    id: 'overview',
    icon: Shield,
    color: '#00d4ff',
    glow: 'rgba(0, 212, 255, 0.15)',
    title: 'Tổng Quan Hệ Thống',
    subtitle: 'Kiến trúc & cách hoạt động',
    content: 'overview',
  },
  {
    id: 'quickstart',
    icon: Zap,
    color: '#22c55e',
    glow: 'rgba(34, 197, 94, 0.15)',
    title: 'Khởi Động Nhanh',
    subtitle: 'Bắt đầu sử dụng trong 3 bước',
    content: 'quickstart',
  },
  {
    id: 'auth',
    icon: LogIn,
    color: '#8b5cf6',
    glow: 'rgba(139, 92, 246, 0.15)',
    title: 'Đăng Nhập & Đăng Ký',
    subtitle: 'Xác thực, OTP, và quản lý phiên',
    content: 'auth',
  },
  {
    id: 'dashboard',
    icon: Monitor,
    color: '#00d4ff',
    glow: 'rgba(0, 212, 255, 0.15)',
    title: 'Dashboard',
    subtitle: 'Tổng quan thời gian thực',
    content: 'dashboard',
  },
  {
    id: 'cameras',
    icon: Camera,
    color: '#f97316',
    glow: 'rgba(249, 115, 22, 0.15)',
    title: 'Quản Lý Camera',
    subtitle: 'Thêm, sửa, xóa & xử lý AI',
    content: 'cameras',
  },
  {
    id: 'alerts',
    icon: Bell,
    color: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.15)',
    title: 'Cảnh Báo',
    subtitle: 'Xem, lọc & xác nhận cảnh báo',
    content: 'alerts',
  },
  {
    id: 'analytics',
    icon: BarChart3,
    color: '#eab308',
    glow: 'rgba(234, 179, 8, 0.15)',
    title: 'Thống Kê & Phân Tích',
    subtitle: 'Biểu đồ và dữ liệu chi tiết',
    content: 'analytics',
  },
  {
    id: 'settings',
    icon: Settings,
    color: '#a78bfa',
    glow: 'rgba(167, 139, 250, 0.15)',
    title: 'Cài Đặt',
    subtitle: 'Camera, người dùng, thông báo & hệ thống',
    content: 'settings',
  },
  {
    id: 'api',
    icon: Globe,
    color: '#22c55e',
    glow: 'rgba(34, 197, 94, 0.15)',
    title: 'API Endpoints',
    subtitle: 'Danh sách API backend & AI service',
    content: 'api',
  },
];

/* ─── Sub-components ─────────────────────────────────── */
function Tip({ type = 'info', icon: Icon = Info, children }) {
  return (
    <div className={`guide-tip ${type}`}>
      <Icon size={16} className="guide-tip-icon" style={{ color: type === 'info' ? '#00d4ff' : type === 'warning' ? '#eab308' : type === 'danger' ? '#ef4444' : '#22c55e' }} />
      <div className="guide-tip-content">{children}</div>
    </div>
  );
}

function Code({ children }) {
  return <span className="guide-code">{children}</span>;
}

function CodeBlock({ children }) {
  return <div className="guide-code-block">{children}</div>;
}

function Badge({ type = 'all', children }) {
  return <span className={`guide-badge ${type}`}>{children}</span>;
}

/* ─── Section Content Components ─────────────────────── */

function OverviewContent() {
  return (
    <>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.7, marginBottom: 16 }}>
        Hệ thống giám sát camera an ninh sử dụng <strong style={{ color: 'var(--text-primary)' }}>AI (YOLOv8)</strong> để
        nhận diện đối tượng theo thời gian thực, phát hiện xâm nhập, phát hiện lửa/khói, và gửi cảnh báo tức thì.
      </p>

      <Tip type="success" icon={Play}>
        <strong>🎯 Chế độ Demo thông minh (Không cần Camera vật lý):</strong>
        <div style={{ marginTop: 6, opacity: 0.9 }}>
          Hệ thống hỗ trợ đọc trực tiếp nguồn video từ file <strong style={{ color: 'var(--text-primary)' }}>MP4</strong> cục bộ giống hệt như một camera RTSP vật lý thật. Nhờ đó, toàn bộ các tính năng AI cốt lõi bao gồm:
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '10px 0' }}>
            <span style={{ background: 'rgba(0, 212, 255, 0.12)', color: 'var(--accent-cyan)', padding: '3px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>🏃‍♂️ Motion Detection</span>
            <span style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#f87171', padding: '3px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>🔥 Fire Detection</span>
            <span style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#a78bfa', padding: '3px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>👤 Person Detection</span>
            <span style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#4ade80', padding: '3px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>🚨 Real-time Alerts</span>
            <span style={{ background: 'rgba(234, 179, 8, 0.12)', color: '#facc15', padding: '3px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>📊 Analytics & Charts</span>
          </div>
          đều hoạt động hoàn toàn tự động và trơn tru. Đây là cách các dự án AI Camera chuyên nghiệp thường áp dụng để <strong>demo, thử nghiệm và tối ưu hóa hệ thống</strong> trước khi kết nối với hệ thống camera RTSP thực tế!
        </div>
      </Tip>

      <div className="architecture-flow">
        <div className="arch-node">
          <div className="arch-node-icon" style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#f97316' }}>
            <Camera size={22} />
          </div>
          <span className="arch-node-label">Camera / Webcam</span>
          <span className="arch-node-sub">Nguồn video</span>
        </div>
        <ArrowRight className="arch-arrow" size={20} />
        <div className="arch-node">
          <div className="arch-node-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
            <Cpu size={22} />
          </div>
          <span className="arch-node-label">AI Service</span>
          <span className="arch-node-sub">Python + YOLOv8</span>
        </div>
        <ArrowRight className="arch-arrow" size={20} />
        <div className="arch-node">
          <div className="arch-node-icon" style={{ background: 'rgba(0, 212, 255, 0.15)', color: '#00d4ff' }}>
            <Globe size={22} />
          </div>
          <span className="arch-node-label">Backend API</span>
          <span className="arch-node-sub">Node.js + Express</span>
        </div>
        <ArrowRight className="arch-arrow" size={20} />
        <div className="arch-node">
          <div className="arch-node-icon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
            <Monitor size={22} />
          </div>
          <span className="arch-node-label">Dashboard</span>
          <span className="arch-node-sub">React + Vite</span>
        </div>
      </div>

      <div className="guide-table-wrapper" style={{ marginTop: 16 }}>
        <table className="guide-table">
          <thead>
            <tr>
              <th>Thành phần</th>
              <th>Công nghệ</th>
              <th>Port</th>
              <th>Mô tả</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span className="feature-name"><Camera size={14} style={{ color: '#f97316' }} /> AI Service</span></td>
              <td>Python, FastAPI, OpenCV, YOLOv8</td>
              <td><Code>8000</Code></td>
              <td>Xử lý video, nhận diện đối tượng, phát hiện bất thường</td>
            </tr>
            <tr>
              <td><span className="feature-name"><Globe size={14} style={{ color: '#00d4ff' }} /> Backend</span></td>
              <td>Node.js, Express, Socket.IO, Mongoose</td>
              <td><Code>5000</Code></td>
              <td>REST API, xác thực JWT, WebSocket, quản lý dữ liệu</td>
            </tr>
            <tr>
              <td><span className="feature-name"><Monitor size={14} style={{ color: '#22c55e' }} /> Frontend</span></td>
              <td>React, Vite, Zustand, Recharts</td>
              <td><Code>5173</Code></td>
              <td>Giao diện web Dashboard thời gian thực</td>
            </tr>
            <tr>
              <td><span className="feature-name"><Database size={14} style={{ color: '#8b5cf6' }} /> Database</span></td>
              <td>MongoDB Atlas</td>
              <td><Code>cloud</Code></td>
              <td>Lưu trữ dữ liệu camera, cảnh báo, người dùng</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

function QuickStartContent() {
  return (
    <>
      <div className="step-list">
        <div className="step-item">
          <span className="step-number">1</span>
          <div className="step-content">
            <h4>Khởi động Backend</h4>
            <p>Chạy server Node.js để kết nối MongoDB và khởi tạo API.</p>
            <CodeBlock>
              cd backend<br />
              npm install<br />
              npm run dev
            </CodeBlock>
          </div>
        </div>
        <div className="step-item">
          <span className="step-number">2</span>
          <div className="step-content">
            <h4>Khởi động AI Service</h4>
            <p>Chạy Python server để xử lý video và nhận diện AI.</p>
            <CodeBlock>
              cd ai-service<br />
              pip install -r requirements.txt<br />
              python main.py
            </CodeBlock>
          </div>
        </div>
        <div className="step-item">
          <span className="step-number">3</span>
          <div className="step-content">
            <h4>Khởi động Frontend</h4>
            <p>Mở giao diện web Dashboard để bắt đầu giám sát.</p>
            <CodeBlock>
              cd frontend<br />
              npm install<br />
              npm run dev
            </CodeBlock>
            <Tip type="success" icon={Zap}>
              Mở trình duyệt tại <strong>http://localhost:5173</strong> để truy cập Dashboard.
            </Tip>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 10 }}>
          <Key size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Thông tin đăng nhập mặc định
        </h4>
        <div className="credentials-box">
          <div className="credential-item">
            <span className="credential-label">Username:</span>
            <span className="credential-value">admin</span>
          </div>
          <div className="credential-item">
            <span className="credential-label">Password:</span>
            <span className="credential-value">admin123</span>
          </div>
          <div className="credential-item">
            <span className="credential-label">Role:</span>
            <Badge type="admin">Admin</Badge>
          </div>
        </div>
      </div>
    </>
  );
}

function AuthContent() {
  return (
    <>
      <div className="guide-table-wrapper">
        <table className="guide-table">
          <thead>
            <tr>
              <th>Chức năng</th>
              <th>Cách sử dụng</th>
              <th>Quyền</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span className="feature-name"><LogIn size={14} style={{ color: '#8b5cf6' }} /> Đăng nhập</span></td>
              <td>Nhập username/email và password tại trang <Code>/login</Code>. Hỗ trợ "Remember Me" 30 ngày.</td>
              <td><Badge type="all">Tất cả</Badge></td>
            </tr>
            <tr>
              <td><span className="feature-name"><UserPlus size={14} style={{ color: '#22c55e' }} /> Đăng ký</span></td>
              <td>Tạo tài khoản tại <Code>/register</Code>. Cần xác minh email qua OTP 6 số.</td>
              <td><Badge type="all">Tất cả</Badge></td>
            </tr>
            <tr>
              <td><span className="feature-name"><Mail size={14} style={{ color: '#f97316' }} /> Xác minh OTP</span></td>
              <td>Nhập mã 6 số được gửi qua email. Có thể nhấn "Resend OTP" để gửi lại.</td>
              <td><Badge type="all">Tất cả</Badge></td>
            </tr>
            <tr>
              <td><span className="feature-name"><Eye size={14} style={{ color: '#00d4ff' }} /> Hiển thị mật khẩu</span></td>
              <td>Nhấn icon 👁 bên phải ô password để hiện/ẩn mật khẩu.</td>
              <td><Badge type="all">Tất cả</Badge></td>
            </tr>
            <tr>
              <td><span className="feature-name"><RefreshCw size={14} style={{ color: '#eab308' }} /> Token tự động</span></td>
              <td>Access Token hết hạn sẽ tự động refresh. Nếu refresh thất bại, chuyển về trang đăng nhập.</td>
              <td><Badge type="all">Tự động</Badge></td>
            </tr>
          </tbody>
        </table>
      </div>

      <Tip type="warning" icon={AlertTriangle}>
        Nếu đăng nhập sai quá <strong>10 lần trong 5 phút</strong>, tài khoản sẽ bị khóa tạm thời. Hãy đợi 5 phút rồi thử lại.
      </Tip>

      <Tip type="info" icon={Lock}>
        Hệ thống sử dụng <strong>CSRF Protection</strong> — mỗi request thay đổi dữ liệu đều yêu cầu CSRF token tự động.
      </Tip>
    </>
  );
}

function DashboardContent() {
  return (
    <>
      <div className="guide-table-wrapper">
        <table className="guide-table">
          <thead>
            <tr>
              <th>Thành phần</th>
              <th>Hiển thị</th>
              <th>Mô tả chi tiết</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span className="feature-name"><Camera size={14} style={{ color: '#00d4ff' }} /> Cameras Online</span></td>
              <td>X / Y</td>
              <td>Số camera đang online trên tổng số camera đã đăng ký</td>
            </tr>
            <tr>
              <td><span className="feature-name"><Bell size={14} style={{ color: '#8b5cf6' }} /> Total Alerts</span></td>
              <td>Số lượng</td>
              <td>Tổng số cảnh báo trong 7 ngày qua</td>
            </tr>
            <tr>
              <td><span className="feature-name"><AlertTriangle size={14} style={{ color: '#f97316' }} /> Unacknowledged</span></td>
              <td>Số lượng</td>
              <td>Cảnh báo chưa được xác nhận xử lý</td>
            </tr>
            <tr>
              <td><span className="feature-name"><TrendingUp size={14} style={{ color: '#22c55e' }} /> Today's Alerts</span></td>
              <td>Số lượng</td>
              <td>Cảnh báo trong ngày hôm nay</td>
            </tr>
            <tr>
              <td><span className="feature-name"><TrendingUp size={14} style={{ color: '#00d4ff' }} /> Alert Trend</span></td>
              <td>Biểu đồ Area</td>
              <td>Xu hướng cảnh báo 7 ngày dạng đồ thị diện tích</td>
            </tr>
            <tr>
              <td><span className="feature-name"><Shield size={14} style={{ color: '#8b5cf6' }} /> Alert Types</span></td>
              <td>Biểu đồ Pie</td>
              <td>Phân bố loại cảnh báo (person, motion, fire...)</td>
            </tr>
            <tr>
              <td><span className="feature-name"><Camera size={14} style={{ color: '#f97316' }} /> Camera Status</span></td>
              <td>Danh sách</td>
              <td>Trạng thái online/offline từng camera</td>
            </tr>
            <tr>
              <td><span className="feature-name"><Clock size={14} style={{ color: '#eab308' }} /> Recent Alerts</span></td>
              <td>Danh sách</td>
              <td>10 cảnh báo mới nhất theo thời gian thực (WebSocket)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Tip type="info" icon={Eye}>
        Badge <strong>AI Engine Online/Offline</strong> ở góc trên cho biết AI service (Python) có đang chạy hay không.
      </Tip>
    </>
  );
}

function CamerasContent() {
  return (
    <>
      <div className="guide-table-wrapper">
        <table className="guide-table">
          <thead>
            <tr>
              <th>Thao tác</th>
              <th>Cách thực hiện</th>
              <th>Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span className="feature-name"><Plus size={14} style={{ color: '#22c55e' }} /> Thêm camera</span></td>
              <td>Nhấn <Code>+ Add Camera</Code></td>
              <td>
                Điền tên, vị trí và chọn <strong>Nguồn video (Video Source)</strong> tương ứng:<br />
                • <strong>Webcam máy tính:</strong> Nhập số <Code>0</Code> (hoặc <Code>1</Code> nếu có nhiều webcam).<br />
                • <strong>Camera IP thật:</strong> Nhập đường dẫn RTSP đầy đủ (ví dụ: <Code>rtsp://admin:12345@192.168.1.100:554/stream1</Code>).<br />
                • <strong>Demo Video File (MP4):</strong> Nhập đường dẫn tuyệt đối đến file MP4 trên máy tính (ví dụ: <Code>D:/khanh/demo_video.mp4</Code>).
              </td>
            </tr>
            <tr>
              <td><span className="feature-name"><Settings size={14} style={{ color: '#a78bfa' }} /> Sửa camera</span></td>
              <td>Nhấn icon ⚙️ trên camera card</td>
              <td>Mở modal chỉnh sửa tên, URL nguồn, vị trí camera.</td>
            </tr>
            <tr>
              <td><span className="feature-name"><Trash2 size={14} style={{ color: '#ef4444' }} /> Xóa camera</span></td>
              <td>Nhấn icon 🗑️ trên camera card</td>
              <td>Xác nhận xóa → Camera bị xóa khỏi hệ thống.</td>
            </tr>
            <tr>
              <td><span className="feature-name"><Play size={14} style={{ color: '#00d4ff' }} /> Bắt đầu AI</span></td>
              <td>Nhấn <Code>▶ Start AI</Code></td>
              <td>Gửi request đến AI service để bắt đầu xử lý video từ camera. Cần AI service đang chạy.</td>
            </tr>
            <tr>
              <td><span className="feature-name"><Square size={14} style={{ color: '#ef4444' }} /> Dừng AI</span></td>
              <td>Nhấn <Code>■ Stop</Code></td>
              <td>Dừng xử lý AI cho camera. Video stream sẽ ngừng.</td>
            </tr>
            <tr>
              <td><span className="feature-name"><RefreshCw size={14} style={{ color: '#eab308' }} /> Làm mới</span></td>
              <td>Nhấn <Code>↻ Refresh</Code></td>
              <td>Cập nhật lại trạng thái tất cả camera từ server.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Tip type="success" icon={Zap}>
        Khi camera đang online, bạn sẽ thấy <strong>video stream trực tiếp</strong> trên camera card. Chấm xanh/đỏ cho biết trạng thái.
      </Tip>

      <Tip type="info" icon={Play}>
        <strong>🎥 Sử dụng file MP4 làm Camera ảo để Demo:</strong> Để thử nghiệm đầy đủ các tính năng AI của hệ thống (Motion, Fire, Person, Alerts, Analytics) mà không cần lắp đặt camera IP vật lý, hãy tải một file video MP4 (có chứa hình ảnh người, chuyển động hoặc ngọn lửa tùy ý) và nhập đường dẫn file đó làm nguồn Video. AI Service sẽ tự động giải mã video, phân tích từng khung hình và <strong>tự động lặp lại video (loop)</strong> khi phát hết, mang lại trải nghiệm live stream và phát hiện cảnh báo liên tục hoàn hảo!
      </Tip>

      <Tip type="warning" icon={AlertTriangle}>
        <strong>Chú ý:</strong> Nếu dùng Webcam, đảm bảo không có ứng dụng nào khác đang sử dụng Webcam đó. Nếu dùng Camera IP thực tế, hãy chắc chắn rằng máy chủ chạy AI Service có thể kết nối ping được tới địa chỉ IP của camera.
      </Tip>
    </>
  );
}

function AlertsContent() {
  return (
    <>
      <div className="guide-table-wrapper">
        <table className="guide-table">
          <thead>
            <tr>
              <th>Chức năng</th>
              <th>Cách sử dụng</th>
              <th>Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span className="feature-name"><Bell size={14} style={{ color: '#ef4444' }} /> Xem cảnh báo</span></td>
              <td>Trang <Code>/alerts</Code></td>
              <td>Hiển thị danh sách cảnh báo với loại, mức độ, camera, độ tin cậy và thời gian.</td>
            </tr>
            <tr>
              <td><span className="feature-name"><Filter size={14} style={{ color: '#00d4ff' }} /> Lọc cảnh báo</span></td>
              <td>Nhấn <Code>🔍 Filters</Code></td>
              <td>
                Lọc theo loại: motion, person, intrusion, vehicle, fire, smoke, weapon.<br />
                Lọc theo trạng thái: Tất cả, Chưa xác nhận, Đã xác nhận.
              </td>
            </tr>
            <tr>
              <td><span className="feature-name"><Check size={14} style={{ color: '#22c55e' }} /> Xác nhận</span></td>
              <td>Nhấn <Code>✓ Acknowledge</Code></td>
              <td>Đánh dấu cảnh báo đã xử lý. Chuyển trạng thái sang "Done".</td>
            </tr>
            <tr>
              <td><span className="feature-name"><Eye size={14} style={{ color: '#8b5cf6' }} /> Xem chi tiết</span></td>
              <td>Click vào cảnh báo bất kỳ</td>
              <td>Mở panel chi tiết hiển thị ảnh chụp (snapshot) và danh sách đối tượng phát hiện cùng độ tin cậy.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h4 style={{ fontSize: '0.88rem', color: 'var(--text-primary)', margin: '16px 0 10px' }}>
        Mức độ cảnh báo (Severity)
      </h4>
      <div className="guide-table-wrapper">
        <table className="guide-table">
          <thead>
            <tr>
              <th>Mức độ</th>
              <th>Màu sắc</th>
              <th>Ý nghĩa</th>
              <th>Ví dụ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span className="badge badge-critical" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '4px 10px', borderRadius: 6, fontSize: '0.78rem' }}>Critical</span></td>
              <td>🔴 Đỏ</td>
              <td>Nguy hiểm cao, cần xử lý ngay</td>
              <td>Phát hiện vũ khí, xâm nhập vùng cấm</td>
            </tr>
            <tr>
              <td><span style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316', padding: '4px 10px', borderRadius: 6, fontSize: '0.78rem' }}>High</span></td>
              <td>🟠 Cam</td>
              <td>Quan trọng, cần chú ý</td>
              <td>Phát hiện lửa, khói</td>
            </tr>
            <tr>
              <td><span style={{ background: 'rgba(234,179,8,0.15)', color: '#eab308', padding: '4px 10px', borderRadius: 6, fontSize: '0.78rem' }}>Medium</span></td>
              <td>🟡 Vàng</td>
              <td>Bình thường</td>
              <td>Phát hiện người, xe</td>
            </tr>
            <tr>
              <td><span style={{ background: 'rgba(0,212,255,0.15)', color: '#00d4ff', padding: '4px 10px', borderRadius: 6, fontSize: '0.78rem' }}>Low</span></td>
              <td>🔵 Xanh</td>
              <td>Thông tin tham khảo</td>
              <td>Motion detection thông thường</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Tip type="info" icon={Bell}>
        Cảnh báo mới sẽ hiển thị dưới dạng <strong>Toast notification</strong> ở góc phải màn hình theo thời gian thực qua WebSocket.
      </Tip>
    </>
  );
}

function AnalyticsContent() {
  return (
    <>
      <div className="guide-table-wrapper">
        <table className="guide-table">
          <thead>
            <tr>
              <th>Biểu đồ</th>
              <th>Loại</th>
              <th>Dữ liệu hiển thị</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span className="feature-name"><TrendingUp size={14} style={{ color: '#00d4ff' }} /> Daily Alert Trend</span></td>
              <td>Area Chart</td>
              <td>Xu hướng cảnh báo theo ngày</td>
            </tr>
            <tr>
              <td><span className="feature-name"><BarChart3 size={14} style={{ color: '#8b5cf6' }} /> Alerts by Type</span></td>
              <td>Bar Chart</td>
              <td>Số lượng cảnh báo theo loại (person, motion, fire...)</td>
            </tr>
            <tr>
              <td><span className="feature-name"><Clock size={14} style={{ color: '#eab308' }} /> Detections by Hour</span></td>
              <td>Bar Chart</td>
              <td>Phân bố phát hiện theo giờ trong ngày (0:00-23:00)</td>
            </tr>
            <tr>
              <td><span className="feature-name"><Shield size={14} style={{ color: '#22c55e' }} /> Object Distribution</span></td>
              <td>Horizontal Bar</td>
              <td>Phân bố loại đối tượng được phát hiện</td>
            </tr>
            <tr>
              <td><span className="feature-name"><Camera size={14} style={{ color: '#f97316' }} /> Alerts by Camera</span></td>
              <td>Bar Chart</td>
              <td>So sánh số cảnh báo giữa các camera</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Tip type="success" icon={TrendingUp}>
        Sử dụng nút <strong>7 Days / 14 Days / 30 Days</strong> ở góc phải để thay đổi khoảng thời gian phân tích.
      </Tip>

      <h4 style={{ fontSize: '0.88rem', color: 'var(--text-primary)', margin: '16px 0 10px' }}>
        Summary Cards
      </h4>
      <div className="guide-table-wrapper">
        <table className="guide-table">
          <thead>
            <tr>
              <th>Card</th>
              <th>Ý nghĩa</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span className="feature-name"><BarChart3 size={14} style={{ color: '#00d4ff' }} /> Total Alerts</span></td>
              <td>Tổng cảnh báo trong khoảng thời gian đã chọn</td>
            </tr>
            <tr>
              <td><span className="feature-name"><Shield size={14} style={{ color: '#8b5cf6' }} /> Total Detections</span></td>
              <td>Tổng số lần phát hiện đối tượng</td>
            </tr>
            <tr>
              <td><span className="feature-name"><TrendingUp size={14} style={{ color: '#f97316' }} /> Avg Alerts/Day</span></td>
              <td>Trung bình cảnh báo mỗi ngày</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

function SettingsContent() {
  return (
    <>
      <div className="guide-table-wrapper">
        <table className="guide-table">
          <thead>
            <tr>
              <th>Tab</th>
              <th>Chức năng</th>
              <th>Quyền</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span className="feature-name"><Camera size={14} style={{ color: '#f97316' }} /> Cameras</span></td>
              <td>
                Thêm camera mới (tên, video source, vị trí). Xem danh sách camera đã đăng ký. Xóa camera.
              </td>
              <td><Badge type="all">Tất cả</Badge></td>
            </tr>
            <tr>
              <td><span className="feature-name"><Users size={14} style={{ color: '#8b5cf6' }} /> Users</span></td>
              <td>
                Tạo tài khoản mới (username, email, password, role). Xem thông tin tài khoản hiện tại. Đổi avatar.
              </td>
              <td><Badge type="admin">Admin</Badge></td>
            </tr>
            <tr>
              <td><span className="feature-name"><Bell size={14} style={{ color: '#eab308' }} /> Notifications</span></td>
              <td>
                Cấu hình Email (SMTP) và Telegram bot. Cần thiết lập trong file <Code>.env</Code> của backend.
              </td>
              <td><Badge type="admin">Admin</Badge></td>
            </tr>
            <tr>
              <td><span className="feature-name"><Shield size={14} style={{ color: '#22c55e' }} /> System</span></td>
              <td>
                Thông tin hệ thống (tech stack), và các API endpoint đang sử dụng.
              </td>
              <td><Badge type="all">Tất cả</Badge></td>
            </tr>
          </tbody>
        </table>
      </div>

      <Tip type="info" icon={Mail}>
        Để bật thông báo Email, thêm cấu hình SMTP vào <Code>backend/.env</Code>:<br />
        <CodeBlock>
          SMTP_HOST=smtp.gmail.com<br />
          SMTP_PORT=587<br />
          SMTP_USER=your-email@gmail.com<br />
          SMTP_PASS=your-app-password
        </CodeBlock>
      </Tip>

      <Tip type="info" icon={Send}>
        Để bật Telegram, thêm vào <Code>backend/.env</Code>:<br />
        <CodeBlock>
          TELEGRAM_BOT_TOKEN=your-bot-token<br />
          TELEGRAM_CHAT_ID=your-chat-id
        </CodeBlock>
      </Tip>
    </>
  );
}

function APIContent() {
  return (
    <>
      <h4 style={{ fontSize: '0.88rem', color: 'var(--text-primary)', margin: '0 0 10px' }}>
        <Lock size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
        Authentication API — <Code>POST /api/auth/*</Code>
      </h4>
      <div className="guide-table-wrapper" style={{ marginBottom: 20 }}>
        <table className="guide-table">
          <thead>
            <tr>
              <th>Method</th>
              <th>Endpoint</th>
              <th>Mô tả</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><Badge type="optional">POST</Badge></td><td><Code>/api/auth/login</Code></td><td>Đăng nhập, nhận access + refresh token</td></tr>
            <tr><td><Badge type="optional">POST</Badge></td><td><Code>/api/auth/register</Code></td><td>Đăng ký tài khoản mới</td></tr>
            <tr><td><Badge type="optional">POST</Badge></td><td><Code>/api/auth/verify-otp</Code></td><td>Xác minh OTP email</td></tr>
            <tr><td><Badge type="optional">POST</Badge></td><td><Code>/api/auth/resend-otp</Code></td><td>Gửi lại mã OTP</td></tr>
            <tr><td><Badge type="optional">POST</Badge></td><td><Code>/api/auth/refresh</Code></td><td>Làm mới access token</td></tr>
            <tr><td><Badge type="optional">POST</Badge></td><td><Code>/api/auth/logout</Code></td><td>Đăng xuất phiên hiện tại</td></tr>
            <tr><td><Badge type="optional">POST</Badge></td><td><Code>/api/auth/logout-all</Code></td><td>Đăng xuất tất cả phiên</td></tr>
            <tr><td><Badge type="all">GET</Badge></td><td><Code>/api/auth/me</Code></td><td>Lấy thông tin user hiện tại</td></tr>
            <tr><td><Badge type="required">PUT</Badge></td><td><Code>/api/auth/change-password</Code></td><td>Đổi mật khẩu</td></tr>
            <tr><td><Badge type="all">GET</Badge></td><td><Code>/api/auth/sessions</Code></td><td>Liệt kê phiên đăng nhập</td></tr>
            <tr><td><Badge type="required">DELETE</Badge></td><td><Code>/api/auth/sessions/:id</Code></td><td>Thu hồi phiên cụ thể</td></tr>
            <tr><td><Badge type="all">GET</Badge></td><td><Code>/api/auth/csrf</Code></td><td>Lấy CSRF cookie</td></tr>
            <tr><td><Badge type="required">PUT</Badge></td><td><Code>/api/auth/avatar</Code></td><td>Upload avatar (multipart/form-data)</td></tr>
          </tbody>
        </table>
      </div>

      <h4 style={{ fontSize: '0.88rem', color: 'var(--text-primary)', margin: '0 0 10px' }}>
        <Camera size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
        Camera API — <Code>/api/cameras</Code>
      </h4>
      <div className="guide-table-wrapper" style={{ marginBottom: 20 }}>
        <table className="guide-table">
          <thead>
            <tr>
              <th>Method</th>
              <th>Endpoint</th>
              <th>Mô tả</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><Badge type="all">GET</Badge></td><td><Code>/api/cameras</Code></td><td>Danh sách camera</td></tr>
            <tr><td><Badge type="all">GET</Badge></td><td><Code>/api/cameras/:id</Code></td><td>Chi tiết 1 camera</td></tr>
            <tr><td><Badge type="optional">POST</Badge></td><td><Code>/api/cameras</Code></td><td>Tạo camera mới</td></tr>
            <tr><td><Badge type="required">PUT</Badge></td><td><Code>/api/cameras/:id</Code></td><td>Cập nhật camera</td></tr>
            <tr><td><Badge type="required">DELETE</Badge></td><td><Code>/api/cameras/:id</Code></td><td>Xóa camera</td></tr>
            <tr><td><Badge type="optional">POST</Badge></td><td><Code>/api/cameras/:id/zones</Code></td><td>Cấu hình vùng giám sát</td></tr>
          </tbody>
        </table>
      </div>

      <h4 style={{ fontSize: '0.88rem', color: 'var(--text-primary)', margin: '0 0 10px' }}>
        <Bell size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
        Alerts & Detections API
      </h4>
      <div className="guide-table-wrapper" style={{ marginBottom: 20 }}>
        <table className="guide-table">
          <thead>
            <tr>
              <th>Method</th>
              <th>Endpoint</th>
              <th>Mô tả</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><Badge type="all">GET</Badge></td><td><Code>/api/alerts?page=1&limit=20</Code></td><td>Danh sách cảnh báo (có phân trang, filter)</td></tr>
            <tr><td><Badge type="required">PUT</Badge></td><td><Code>/api/alerts/:id/acknowledge</Code></td><td>Xác nhận cảnh báo</td></tr>
            <tr><td><Badge type="all">GET</Badge></td><td><Code>/api/alerts/stats?days=7</Code></td><td>Thống kê cảnh báo</td></tr>
            <tr><td><Badge type="all">GET</Badge></td><td><Code>/api/detections?page=1</Code></td><td>Danh sách phát hiện</td></tr>
            <tr><td><Badge type="all">GET</Badge></td><td><Code>/api/detections/stats?days=7</Code></td><td>Thống kê phát hiện</td></tr>
          </tbody>
        </table>
      </div>

      <h4 style={{ fontSize: '0.88rem', color: 'var(--text-primary)', margin: '0 0 10px' }}>
        <Cpu size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
        AI Service API — <Code>http://localhost:8000</Code>
      </h4>
      <div className="guide-table-wrapper">
        <table className="guide-table">
          <thead>
            <tr>
              <th>Method</th>
              <th>Endpoint</th>
              <th>Mô tả</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><Badge type="all">GET</Badge></td><td><Code>/health</Code></td><td>Kiểm tra trạng thái AI service</td></tr>
            <tr><td><Badge type="optional">POST</Badge></td><td><Code>/start-camera/:id</Code></td><td>Bắt đầu xử lý AI cho camera</td></tr>
            <tr><td><Badge type="optional">POST</Badge></td><td><Code>/stop-camera/:id</Code></td><td>Dừng xử lý AI</td></tr>
            <tr><td><Badge type="all">GET</Badge></td><td><Code>/status</Code></td><td>Trạng thái tất cả camera đang xử lý</td></tr>
            <tr><td><Badge type="all">GET</Badge></td><td><Code>/stream/:id</Code></td><td>Video stream MJPEG</td></tr>
            <tr><td><Badge type="all">GET</Badge></td><td><Code>/snapshot/:id</Code></td><td>Ảnh chụp nhanh camera</td></tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ─── Content Renderer ───────────────────────────────── */
const CONTENT_MAP = {
  overview: OverviewContent,
  quickstart: QuickStartContent,
  auth: AuthContent,
  dashboard: DashboardContent,
  cameras: CamerasContent,
  alerts: AlertsContent,
  analytics: AnalyticsContent,
  settings: SettingsContent,
  api: APIContent,
};

/* ═══════════════════════════════════════════════════════
   Main Guide Page
   ═══════════════════════════════════════════════════════ */
export default function GuidePage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [openSections, setOpenSections] = useState(
    Object.fromEntries(SECTIONS.map(s => [s.id, true]))
  );

  const toggleSection = (id) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredSections = useMemo(() => {
    let result = SECTIONS;

    // Filter by tab
    if (activeTab !== 'all') {
      result = result.filter(s => s.id === activeTab);
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.subtitle.toLowerCase().includes(q)
      );
    }

    return result;
  }, [search, activeTab]);

  return (
    <div className="page-content guide-page">
      <div className="page-header">
        <div>
          <h1>Hướng Dẫn Sử Dụng</h1>
          <p className="subtitle">Bảng cách dùng chi tiết cho AI Camera Security System</p>
        </div>
      </div>

      {/* Search */}
      <div className="guide-search">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Tìm kiếm hướng dẫn... (vd: camera, đăng nhập, API)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Quick Nav Tabs */}
      <div className="guide-tabs">
        <button
          className={`guide-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <BookOpen size={14} /> Tất cả
        </button>
        {SECTIONS.map(s => (
          <button
            key={s.id}
            className={`guide-tab ${activeTab === s.id ? 'active' : ''}`}
            onClick={() => setActiveTab(s.id)}
          >
            <s.icon size={14} /> {s.title}
          </button>
        ))}
      </div>

      {/* Sections */}
      {filteredSections.length === 0 ? (
        <div className="glass-card guide-empty">
          <HelpCircle size={48} />
          <p>Không tìm thấy hướng dẫn phù hợp với "{search}"</p>
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setActiveTab('all'); }}>
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        filteredSections.map(section => {
          const ContentComponent = CONTENT_MAP[section.content];
          const isOpen = openSections[section.id];

          return (
            <div key={section.id} className="guide-section glass-card" id={`guide-${section.id}`}>
              <div className="section-header" onClick={() => toggleSection(section.id)}>
                <div className="section-icon" style={{ background: section.glow, color: section.color }}>
                  <section.icon size={20} />
                </div>
                <div>
                  <div className="section-title">{section.title}</div>
                  <div className="section-subtitle">{section.subtitle}</div>
                </div>
                <ChevronDown size={18} className={`section-chevron ${isOpen ? 'open' : ''}`} />
              </div>

              {isOpen && ContentComponent && (
                <div style={{ paddingTop: 4 }}>
                  <ContentComponent />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
