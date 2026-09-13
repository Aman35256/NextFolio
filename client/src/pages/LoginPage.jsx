import { useEffect, useState } from 'react';
import { Mail, Lock, User as UserIcon, ArrowLeft, KeyRound } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useResumeStore } from '../store';
import Button from '../components/Button';
import Input from '../components/Input';
import logo from '../assets/NextFolioLogo.png';
import { API_URL, getApiErrorMessage } from '../lib/api';
import { HAS_GOOGLE_OAUTH, getGoogleAuthErrorMessage, getGoogleLoginPreflightError } from '../lib/googleAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { token, setAuth } = useResumeStore();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpMessage, setOtpMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    if (token) navigate('/', { replace: true });
  }, [token, navigate]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const resetOtpFlow = () => {
    setOtpSent(false);
    setOtp('');
    setOtpMessage('');
  };

  const processBackendAuth = async (endpoint, payload) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Authentication failed');
      setAuth({ token: data.token, user: data.user });
      navigate('/');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isLogin) {
      if (otpSent) handleVerifyOtp();
      else handleRequestOtp();
      return;
    }

    processBackendAuth(`${API_URL}/auth/login`, formData);
  };

  const handleRequestOtp = async () => {
    setError('');
    setOtpMessage('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/otp/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: 'signup',
          email: formData.email,
          name: formData.name,
          password: formData.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP');
      setOtpSent(true);
      setOtpMessage(
        data.devOtp
          ? `${data.message} (Development OTP: ${data.devOtp})`
          : data.message || 'OTP sent to your email. Please check your inbox.'
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: 'signup',
          email: formData.email,
          otp,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'OTP verification failed');
      setAuth({ token: data.token, user: data.user });
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      processBackendAuth(`${API_URL}/auth/google`, { accessToken: tokenResponse.access_token });
    },
    onError: (googleError) => setError(getGoogleAuthErrorMessage(googleError)),
    onNonOAuthError: (googleError) => setError(getGoogleAuthErrorMessage(googleError))
  });

  const startGoogleLogin = () => {
    const preflightError = getGoogleLoginPreflightError();
    if (preflightError) {
      setError(preflightError);
      return;
    }

    handleGoogleLogin();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="absolute top-4 left-4">
        <button 
          onClick={() => navigate('/')}
          className="text-gray-500 hover:text-indigo-600 flex items-center gap-2 p-2 rounded-lg hover:bg-indigo-50 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Builder
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="group relative mx-auto mt-6 w-fit" tabIndex={0} aria-label="NextFolio logo">
          <img
            src={logo}
            alt="Nextfolio"
            className="h-24 w-80 rounded-2xl bg-white object-cover p-2 shadow-sm"
          />
          <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-3 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 px-3 py-2 text-xs font-bold uppercase tracking-wide text-white opacity-0 shadow-xl shadow-indigo-500/30 ring-1 ring-white/40 transition-opacity duration-200 group-hover:opacity-100 group-focus:opacity-100">
            BUILD TODAY. IMPRESS TOMORROW.
          </span>
        </div>
        <h3 className="mt-2 text-center text-xl font-bold text-gray-900">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h3>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isLogin ? 'Log in to continue building your portfolio' : 'Sign up to build your amazing digital resume'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-gray-100">
          
          {HAS_GOOGLE_OAUTH && (
            <>
              <button
                onClick={startGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors mb-6 font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <div className="relative flex items-center mb-6">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">or</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>
            </>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center">
              {error}
            </div>
          )}

          {otpMessage && (
            <div className="mb-4 p-3 bg-indigo-50 text-indigo-700 text-sm rounded-lg border border-indigo-100 text-center">
              {otpMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <Input 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  className="pl-10" 
                  placeholder="Full Name" 
                  required 
                />
              </div>
            )}
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <Input 
                name="email" 
                type="email" 
                value={formData.email} 
                onChange={handleChange} 
                className="pl-10" 
                placeholder="Email Address" 
                required 
              />
            </div>

            {!otpSent && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10"
                  placeholder="Password"
                  required
                />
              </div>
            )}

            {!isLogin && otpSent && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  name="otp"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="pl-10"
                  placeholder="Enter 6-digit OTP"
                  required
                />
              </div>
            )}

            <Button type="submit" variant="primary" className="w-full py-3 mt-2" disabled={loading}>
              {loading
                ? 'Processing...'
                : isLogin
                  ? 'Log In'
                  : otpSent ? 'Verify Email & Create Account' : 'Send Verification OTP'}
            </Button>

            {!isLogin && otpSent && (
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={loading}
                className="w-full text-sm font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
              >
                Resend OTP
              </button>
            )}
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); resetOtpFlow(); }}
              className="text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
