import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '../components/AppShell';
import { Button } from '../components/Button.jsx';
import { useAuthStore } from '../store/authStore';
import { useStore } from '../core/useStore';

export default function AuthScreen({ navigate }) {
  const [view, setView] = useState('login'); // 'login', 'register', 'forgot-password'
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const showToast = useStore((store) => store.showToast);
  
  const { login, register, forgotPassword } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (view === 'login') {
      const result = await login({ email, password });
      if (result.success) {
        showToast('Logged in successfully!', 'success');
        navigate('/profile', { replace: true });
      } else {
        showToast(result.error, 'error');
      }
    } else if (view === 'register') {
      if (password !== passwordConfirmation) {
        showToast('Passwords do not match', 'error');
        setIsLoading(false);
        return;
      }
      const result = await register({ name, email, password, password_confirmation: passwordConfirmation });
      if (result.success) {
        showToast('Account created successfully!', 'success');
        navigate('/profile', { replace: true });
      } else {
        showToast(result.error, 'error');
      }
    } else if (view === 'forgot-password') {
      const result = await forgotPassword(email);
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
      menu={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button
            type="button"
            variant={view === 'login' || view === 'forgot-password' ? 'primary' : 'ghost'}
            onClick={() => setView('login')}
            style={{ minWidth: '96px', justifyContent: 'center' }}
          >
            Log In
          </Button>
          <Button
            type="button"
            variant={view === 'register' ? 'primary' : 'ghost'}
            onClick={() => setView('register')}
            style={{ minWidth: '96px', justifyContent: 'center' }}
          >
            Sign Up
          </Button>
        </div>
      }
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
            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <AnimatePresence mode="wait">
                {renderForm()}
              </AnimatePresence>
              
              <div style={{ marginTop: '2rem' }}>
                <Button type="submit" style={{ width: '100%' }} disabled={isLoading}>
                  {isLoading ? 'Please wait...' : (
                    view === 'login' ? 'Log In' : 
                    view === 'register' ? 'Sign Up' : 'Email Password Reset Link'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
