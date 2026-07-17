import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '../components/AppShell';
import { Button } from '../components/Button.jsx';
import { useAuthStore } from '../store/authStore';
import { useStore } from '../core/useStore';
import { Turnstile } from '@marsidev/react-turnstile';

export default function AuthScreen({ navigate }) {
  const location = useLocation();
  const [view, setView] = useState(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('view') === 'register') return 'register';
    if (location.state?.view === 'register') return 'register';
    return 'login';
  });
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const showToast = useStore((store) => store.showToast);
  
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  
  const { login, register, forgotPassword } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (view === 'login') {
      if (siteKey && !captchaToken) {
        showToast('Please wait for Turnstile to verify you.', 'error');
        setIsLoading(false);
        return;
      }
      const result = await login({ email, password, captchaToken });
      if (result.success) {
        showToast('Logged in successfully!', 'success');
        navigate('/profile', { replace: true });
      } else {
        showToast(result.error, 'error');
      }
    } else if (view === 'register') {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      
      if (!passwordRegex.test(password)) {
        showToast('Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.', 'error');
        setIsLoading(false);
        return;
      }
      
      if (password !== passwordConfirmation) {
        showToast('Passwords do not match', 'error');
        setIsLoading(false);
        return;
      }
      
      if (!termsAccepted || !privacyAccepted) {
        showToast('Please read and accept both the Terms of Service and Privacy Policy to continue.', 'error');
        setIsLoading(false);
        return;
      }
      
      if (siteKey && !captchaToken) {
        showToast('Please wait for Turnstile to verify you.', 'error');
        setIsLoading(false);
        return;
      }
      
      const result = await register({ name, email, password, password_confirmation: passwordConfirmation, captchaToken });
      if (result.success) {
        if (result.requiresEmailConfirmation) {
          showToast('Please check your email (including spam folder) to confirm your account before logging in.', 'success');
          setView('login');
        } else {
          showToast('Account created successfully!', 'success');
          navigate('/profile', { replace: true });
        }
      } else {
        showToast(result.error, 'error');
      }
    } else if (view === 'forgot-password') {
      const result = await forgotPassword({ email });
      if (result.success) {
        showToast(result.message || 'Password reset link sent to your email.', 'success');
      } else {
        showToast(result.error, 'error');
      }
    }
    
    setIsLoading(false);
  };

  const authInputStyle = {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.28)',
    background: 'rgba(15, 15, 15, 0.26)',
    color: '#ffffff',
    boxSizing: 'border-box',
    backdropFilter: 'blur(6px)',
  };

  const backgroundTint = view === 'register'
    ? 'rgba(34, 197, 94, 0.10)'
    : view === 'forgot-password'
      ? 'rgba(239, 68, 68, 0.10)'
      : 'rgba(59, 130, 246, 0.10)';

  const renderForm = () => {
    if (view === 'forgot-password') {
      return (
        <motion.div
          key="forgot-password"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          style={{ maxWidth: '400px', width: '100%' }}
        >
          <h2 style={{ margin: '0 0 1.5rem 0', color: '#ffffff' }}>Reset Password</h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.82)', marginBottom: '1.5rem', fontSize: '14px' }}>
            Forgot your password? No problem. Just let us know your email address and we will email you a password reset link.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#ffffff' }}>Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                style={authInputStyle}
                required 
              />
            </div>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        key={view}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        style={{ maxWidth: '400px', width: '100%' }}
      >
        <h2 style={{ margin: '0 0 1.5rem 0', color: '#ffffff' }}>{view === 'register' ? 'Create Account' : 'Welcome Back'}</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {view === 'register' && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#ffffff' }}>Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                style={authInputStyle}
                required 
              />
            </div>
          )}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#ffffff' }}>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              style={authInputStyle}
              required 
            />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontWeight: 600, color: '#ffffff' }}>Password</label>
              {view === 'login' && (
                <span 
                  onClick={() => setView('forgot-password')} 
                  style={{ color: 'rgba(255, 255, 255, 0.78)', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Forgot password?
                </span>
              )}

            </div>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              style={authInputStyle}
              required 
            />
          </div>
          {view === 'register' && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#ffffff' }}>Confirm Password</label>
                <input 
                  type="password" 
                  value={passwordConfirmation} 
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  style={authInputStyle}
                  required 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff', fontSize: '14px', cursor: 'pointer', fontWeight: 'normal' }}>
                  <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} required style={{ cursor: 'pointer', width: 'auto', height: 'auto', margin: 0, padding: 0 }} />
                  <span>I have read and agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Terms of Service</a></span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff', fontSize: '14px', cursor: 'pointer', fontWeight: 'normal' }}>
                  <input type="checkbox" checked={privacyAccepted} onChange={(e) => setPrivacyAccepted(e.target.checked)} required style={{ cursor: 'pointer', width: 'auto', height: 'auto', margin: 0, padding: 0 }} />
                  <span>I have read and agree to the <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Privacy Policy</a></span>
                </label>
                <div style={{ marginTop: '0.5rem', fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>
                  Note: The confirmation email may end up in your spam or junk folder.
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <AppShell
      title="Authentication"
      showBackButton={true}
      onBack={() => navigate('/')}
      hideAuthButton={true}
    >
      <main>
        <section
          className="workspace"
          style={{
            padding: '2rem',
            overflowY: 'auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 'calc(100vh - 50px)',
            backgroundImage: `linear-gradient(${backgroundTint}, ${backgroundTint}), linear-gradient(rgba(0, 0, 0, 0.52), rgba(0, 0, 0, 0.52)), url('/mainsite_bg.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div style={{ width: '100%', maxWidth: '400px', color: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2rem', background: 'rgba(15, 15, 15, 0.4)', padding: '0.35rem', borderRadius: '12px', backdropFilter: 'blur(6px)' }}>
              <Button
                type="button"
                variant={view === 'login' || view === 'forgot-password' ? 'primary' : 'ghost'}
                onClick={() => setView('login')}
                style={{ flex: 1, justifyContent: 'center', padding: '0.5rem' }}
              >
                Log In
              </Button>
              <Button
                type="button"
                variant={view === 'register' ? 'primary' : 'ghost'}
                onClick={() => setView('register')}
                style={{ flex: 1, justifyContent: 'center', padding: '0.5rem' }}
              >
                Sign Up
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <AnimatePresence mode="wait">
                {renderForm()}
              </AnimatePresence>
              
              {(view === 'login' || view === 'register') && siteKey && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                  <Turnstile 
                    siteKey={siteKey}
                    onSuccess={(token) => setCaptchaToken(token)}
                    options={{
                      theme: 'dark',
                    }}
                  />
                </div>
              )}
              
              <div style={{ marginTop: '2rem' }}>
                <Button type="submit" style={{ width: '100%' }} disabled={isLoading}>
                  {isLoading ? 'Please wait...' : (
                    view === 'login' ? 'Log In' : 
                    view === 'register' ? 'Sign Up' : 'Email Password Reset Link'
                  )}
                </Button>
              </div>

              {(view === 'login' || view === 'register') && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                    <span style={{ padding: '0 10px', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Or continue with</span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                  </div>
                  <Button 
                    type="button" 
                    onClick={async () => {
                      const result = await useAuthStore.getState().signInWithGoogle();
                      if (!result.success) {
                        showToast(result.error, 'error');
                      }
                    }}
                    style={{ 
                      background: 'rgba(255,255,255,0.1)', 
                      color: '#fff', 
                      border: '1px solid rgba(255,255,255,0.2)', 
                      width: '100%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      gap: '8px',
                      backdropFilter: 'blur(6px)'
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </Button>
                </>
              )}
            </form>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
