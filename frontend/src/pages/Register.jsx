import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Eye, EyeOff, Loader2, Mail, User, Lock, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../store';
import { authAPI } from '../api';
import toast from 'react-hot-toast';
import './Login.css';

export default function RegisterPage() {
  const [step, setStep] = useState('register'); // 'register' | 'otp'
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState(null);
  const { register, verifyOTP, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) {
      return toast.error('All fields are required');
    }
    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }

    const result = await register({
      username: form.username,
      email: form.email,
      password: form.password
    });

    if (result.success) {
      setUserId(result.userId);
      setStep('otp');
      toast.success('OTP sent to your email!');
    } else {
      toast.error(result.error);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      return toast.error('Enter 6-digit OTP code');
    }

    const result = await verifyOTP(userId, otp);
    if (result.success) {
      toast.success('Email verified! Welcome!');
      navigate('/');
    } else {
      toast.error(result.error);
    }
  };

  const handleResendOTP = async () => {
    try {
      await authAPI.resendOTP({ userId });
      toast.success('New OTP sent!');
    } catch (err) {
      toast.error('Failed to resend OTP');
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
              {step === 'register' ? 'Create Account' : 'Verify Email'}
            </h1>
            <p className="login-subtitle">
              {step === 'register'
                ? 'Join AI Camera Security System'
                : `Enter the 6-digit OTP sent to ${form.email}`}
            </p>
          </div>

          {step === 'register' ? (
            <form onSubmit={handleRegister} className="login-form">
              <div className="input-group">
                <label htmlFor="reg-username">Username</label>
                <div className="input-icon-wrapper">
                  <User size={16} className="input-icon" />
                  <input id="reg-username" type="text" className="input input-with-icon"
                    placeholder="Choose a username" value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })} autoFocus />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="reg-email">Email</label>
                <div className="input-icon-wrapper">
                  <Mail size={16} className="input-icon" />
                  <input id="reg-email" type="email" className="input input-with-icon"
                    placeholder="your@email.com" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="reg-password">Password</label>
                <div className="password-wrapper">
                  <input id="reg-password" type={showPassword ? 'text' : 'password'}
                    className="input" placeholder="Min 6 characters"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })} />
                  <button type="button" className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="reg-confirm">Confirm Password</label>
                <input id="reg-confirm" type="password" className="input"
                  placeholder="Repeat password" value={form.confirmPassword}
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })} />
              </div>

              <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
                {loading ? <Loader2 size={18} className="spin" /> : <ArrowRight size={18} />}
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="login-form">
              <div className="otp-input-group">
                <input type="text" className="input otp-input" maxLength={6}
                  placeholder="000000" value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  autoFocus />
              </div>

              <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
                {loading ? <Loader2 size={18} className="spin" /> : <CheckCircle size={18} />}
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>

              <button type="button" className="resend-btn" onClick={handleResendOTP}>
                Didn't receive code? <span>Resend OTP</span>
              </button>
            </form>
          )}

          <div className="login-footer">
            <p>Already have an account? <Link to="/login" className="auth-link">Sign In</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
