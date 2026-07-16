import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useStore } from '../core/useStore';
import { Button } from './Button.jsx';

export default function AuthModal({ onClose, initialView = 'login' }) {
  const [view, setView] = useState(initialView); // 'login', 'register', 'forgot-password'
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [formError, setFormError] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const showToast = useStore((store) => store.showToast);
  
  const { login, register, forgotPassword } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError('');

    if (view === 'login') {
      const result = await login({ email, password });
      if (result.success) {
        showToast('Logged in successfully!', 'success');
        onClose();
      } else {
        setFormError(result.error || 'Invalid login credentials. Please sign up if you do not have an account.');
        showToast(result.error, 'error');
      }
    } else if (view === 'register') {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      
      if (!passwordRegex.test(password)) {
        setFormError('Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.');
        setIsLoading(false);
        return;
      }
      
      if (password !== passwordConfirmation) {
        setFormError('Passwords do not match');
        setIsLoading(false);
        return;
      }
      
      if (!termsAccepted || !privacyAccepted) {
        setFormError('Please read and accept both the Terms of Service and Privacy Policy to continue.');
        setIsLoading(false);
        return;
      }
      
      const result = await register({ name, email, password, password_confirmation: passwordConfirmation });
      if (result.success) {
        if (result.requiresEmailConfirmation) {
          showToast('Please check your email to confirm your account before logging in.', 'success');
          setView('login');
        } else {
          showToast('Account created successfully!', 'success');
          onClose();
        }
      } else {
        setFormError(result.error);
        showToast(result.error, 'error');
      }
    } else if (view === 'forgot-password') {
      const result = await forgotPassword({ email });
      if (result.success) {
        showToast(result.message || 'Password reset link sent to your email.', 'success');
      } else {
        setFormError(result.error || 'Failed to send reset link.');
        showToast(result.error, 'error');
      }
    }
    
    setIsLoading(false);
  };

  const renderForm = () => {
    if (view === 'forgot-password') {
      return (
        <>
          {formError && (
            <div style={{ padding: '0.75rem', background: 'var(--danger-light, #fee2e2)', color: 'var(--danger, #dc2626)', borderRadius: '6px', fontSize: '14px', marginBottom: '1rem', border: '1px solid var(--danger, #dc2626)' }}>
              {formError}
            </div>
          )}
          <p style={{ marginBottom: '1rem', color: '#666', fontSize: '14px' }}>
            Forgot your password? No problem. Just let us know your email address and we will email you a password reset link.
          </p>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
              required 
            />
          </div>
        </>
      );
    }

    return (
      <>
        {formError && (
          <div style={{ padding: '0.75rem', background: 'var(--danger-light, #fee2e2)', color: 'var(--danger, #dc2626)', borderRadius: '6px', fontSize: '14px', marginBottom: '1rem', border: '1px solid var(--danger, #dc2626)' }}>
            {formError}
          </div>
        )}
        {view === 'register' && (
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
              required 
            />
          </div>
        )}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
            required 
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
            required 
          />
        </div>
        {view === 'register' && (
          <>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Confirm Password</label>
              <input 
                type="password" 
                value={passwordConfirmation} 
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                required 
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '14px', cursor: 'pointer', fontWeight: 'normal' }}>
                <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} required style={{ cursor: 'pointer', width: 'auto', height: 'auto', margin: 0, padding: 0 }} />
                <span>I have read and agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Terms of Service</a></span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '14px', cursor: 'pointer', fontWeight: 'normal' }}>
                <input type="checkbox" checked={privacyAccepted} onChange={(e) => setPrivacyAccepted(e.target.checked)} required style={{ cursor: 'pointer', width: 'auto', height: 'auto', margin: 0, padding: 0 }} />
                <span>I have read and agree to the <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Privacy Policy</a></span>
              </label>
            </div>
          </>
        )}
      </>
    );
  };

  const getTitle = () => {
    if (view === 'login') return 'Log In';
    if (view === 'register') return 'Sign Up';
    return 'Reset Password';
  };

  const getButtonText = () => {
    if (view === 'login') return 'Log In';
    if (view === 'register') return 'Sign Up';
    return 'Email Password Reset Link';
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(3px)'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        style={{
          background: '#fff',
          padding: '2rem',
          borderRadius: '12px',
          width: '400px',
          maxWidth: '90vw',
          color: '#333'
        }}
      >
        <h2 style={{ marginTop: 0 }}>{getTitle()}</h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {renderForm()}
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <Button type="button" onClick={onClose} style={{ background: '#eee', color: '#333' }}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Please wait...' : getButtonText()}
            </Button>
          </div>

          {(view === 'login' || view === 'register') && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
                <span style={{ padding: '0 10px', color: '#6b7280', fontSize: '14px' }}>Or continue with</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
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
                  background: '#fff', 
                  color: '#333', 
                  border: '1px solid #d1d5db', 
                  width: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '8px'
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

        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', fontSize: '14px' }}>
          {view === 'login' && (
            <>
              <div>
                Don't have an account?{' '}
                <span onClick={() => setView('register')} style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}>Sign up</span>
              </div>
              <span onClick={() => setView('forgot-password')} style={{ color: 'var(--text-secondary)', cursor: 'pointer', textDecoration: 'underline' }}>Forgot your password?</span>
            </>
          )}
          {view === 'register' && (
            <div>
              Already have an account?{' '}
              <span onClick={() => setView('login')} style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}>Log in</span>
            </div>
          )}
          {view === 'forgot-password' && (
            <span onClick={() => setView('login')} style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}>
              Back to login
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
