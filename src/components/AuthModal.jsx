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
      if (password !== passwordConfirmation) {
        setFormError('Passwords do not match');
        setIsLoading(false);
        return;
      }
      const result = await register({ name, email, password, password_confirmation: passwordConfirmation });
      if (result.success) {
        showToast('Account created successfully!', 'success');
        onClose();
      } else {
        setFormError(result.error);
        showToast(result.error, 'error');
      }
    } else if (view === 'forgot-password') {
      const result = await forgotPassword(email);
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
