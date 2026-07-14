import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/Button.jsx';
import { AppShell } from '../components/AppShell.jsx';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { resetPassword, user } = useAuthStore();

  useEffect(() => {
    // If not authenticated, they shouldn't be here (Supabase logs them in via recovery link)
    if (!user) {
      // Maybe they haven't loaded yet, let it be for now.
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== passwordConfirmation) {
      setStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    setIsLoading(true);
    setStatus(null);

    const result = await resetPassword({ password });

    setIsLoading(false);
    
    if (result.success) {
      setStatus({ type: 'success', message: 'Password has been reset successfully. You can now log in.' });
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } else {
      setStatus({ type: 'error', message: result.error });
    }
  };

  return (
    <AppShell title="Reset Password" showBackButton={true} onBack={() => navigate('/')}>
      <div style={{ maxWidth: '400px', margin: '4rem auto', width: '100%' }}>
        <div style={{
          background: 'var(--panel)',
          borderRadius: '16px',
          padding: '2rem',
          border: '1px solid var(--line)'
        }}>
          <h2 style={{ margin: '0 0 1.5rem 0' }}>Create New Password</h2>
          
          {status && (
            <div style={{ 
              padding: '1rem', 
              borderRadius: '8px', 
              marginBottom: '1.5rem',
              background: status.type === 'success' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)',
              color: status.type === 'success' ? '#2ecc71' : '#e74c3c',
              border: `1px solid ${status.type === 'success' ? 'rgba(46, 204, 113, 0.3)' : 'rgba(231, 76, 60, 0.3)'}`
            }}>
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Email</label>
              <input 
                type="email" 
                value={user?.email || 'Loading...'} 
                disabled
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--line)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>New Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--text)' }}
                required 
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Confirm New Password</label>
              <input 
                type="password" 
                value={passwordConfirmation} 
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--text)' }}
                required 
              />
            </div>
            
            <div style={{ marginTop: '1rem' }}>
              <Button type="submit" style={{ width: '100%' }} disabled={isLoading}>
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
