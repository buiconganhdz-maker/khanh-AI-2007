import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../store';
import { authAPI } from '../api';
import toast from 'react-hot-toast';
import './Login.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // OTP verification flow (if email not verified)
  const [otpMode, setOtpMode] = useState(false);
  const [otpUserId, setOtpUserId] = useState(null);
  const [otpEmail, setOtpEmail] = useState('');
  const [otp, setOtp] = useState('');

  const { login, verifyOTP, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please enter username and password');
      return;
    }

    const result = await login({ username, password, rememberMe });
    if (result.success) {
      toast.success('Welcome back!');
      navigate('/');
    } else if (result.requiresVerification) {
      // Email not verified — show OTP input
      setOtpMode(true);
      setOtpUserId(result.userId);
      setOtpEmail(result.email);
      toast('Please verify your email first', { icon: '📧' });
    } else if (result.lockedUntil) {
      toast.error(result.error);
    } else {
      toast.error(result.error);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Enter 6-digit code');

    const result = await verifyOTP(otpUserId, otp);
    if (result.success) {
      toast.success('Email verified! Welcome!');
      navigate('/');
    } else {
      toast.error(result.error);
    }
  };

  const handleResendOTP = async () => {
    try {
      await authAPI.resendOTP({ userId: otpUserId });
      toast.success('New OTP sent!');
    } catch (err) {
      toast.error('Failed to resend');
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="bg-orb orb-1"></div>
        <div className="bg-orb orb-2"></div>
        <div className="bg-orb orb-3"></div>
        <div className="grid-overlay"></div>
      </div>

      <div className="login-container">
        <div className="login-card">
          <div className="login-logo">
            <div className="login-logo-icon">
              <Shield size={32} />
            </div>
            <h1 className="login-title">
              {otpMode ? 'Verify Email' : 'AI Camera Security'}
            </h1>
            <p className="login-subtitle">
              {otpMode
                ? `Enter the OTP sent to ${otpEmail}`
                : 'Real-time AI Surveillance System'}
            </p>
          </div>

          {!otpMode ? (
            <form onSubmit={handleSubmit} className="login-form">
              <div className="input-group">
                <label htmlFor="username">Username or Email</label>
                <input id="username" type="text" className="input"
                  placeholder="Enter your username or email"
                  value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
              </div>

              <div className="input-group">
                <label htmlFor="password">Password</label>
                <div className="password-wrapper">
                  <input id="password" type={showPassword ? 'text' : 'password'}
                    className="input" placeholder="Enter your password"
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <label className="remember-me">
                <input type="checkbox" checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)} />
                <span className="checkmark"></span>
                <span>Remember me for 30 days</span>
              </label>

              <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
                {loading ? <Loader2 size={18} className="spin" /> : null}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="login-form">
              <div className="otp-input-group">
                <input type="text" className="input otp-input" maxLength={6}
                  placeholder="000000" value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} autoFocus />
              </div>

              <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
                {loading ? <Loader2 size={18} className="spin" /> : <CheckCircle size={18} />}
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>

              <button type="button" className="resend-btn" onClick={handleResendOTP}>
                Didn't receive code? <span>Resend OTP</span>
              </button>

              <button type="button" className="resend-btn" onClick={() => setOtpMode(false)}>
                ← Back to login
              </button>
            </form>
          )}

          <div className="login-footer">
            {!otpMode && (
              <p>Don't have an account? <Link to="/register" className="auth-link">Sign Up</Link></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
