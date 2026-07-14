import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '../components/AppShell';
import { useAuthStore } from '../store/authStore';
import { useStore } from '../core/useStore';
import { User, Settings, Image as ImageIcon } from 'lucide-react';
import aboutImage from '../assets/about.png';

function CollapsibleSection({ title, note, noteClassName = "section-note", headingClassName = "section-heading", children, defaultCollapsed = false }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  return (
    <section className="panel-section">
      <div
        className={headingClassName}
        onClick={() => setCollapsed(!collapsed)}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', userSelect: 'none' }}
      >
        <span style={{
          marginRight: '8px',
          transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
          transition: 'transform 0.15s ease',
          display: 'inline-block',
          fontSize: '10px'
        }}>▼</span>
        <h2 className="panel-title" style={{ flex: 1, margin: 0 }}>{title}</h2>
        {note && <span className={noteClassName}>{note}</span>}
      </div>
      <div style={{ display: collapsed ? 'none' : 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
        {children}
      </div>
    </section>
  );
}

export default function ProfileScreen({ navigate }) {
  const { user, updateProfile, updatePassword } = useAuthStore();
  const [helpMenuOpen, setHelpMenuOpen] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const menu = (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button className="menu-dropdown-button" onClick={() => navigate('/editor')}>Editor</button>
      <button className="menu-dropdown-button" onClick={() => navigate('/catalog')}>Catalog</button>
      <div className="menu-dropdown" onMouseLeave={() => setHelpMenuOpen(false)}>
        <button className="menu-dropdown-button" onPointerDown={() => setHelpMenuOpen(!helpMenuOpen)}>Help</button>
        {helpMenuOpen && (
          <div className="menu-dropdown-content" onClick={() => setHelpMenuOpen(false)}>
            <button className="menu-dropdown-item" onClick={() => setShowAboutModal(true)}>
              About iBooth
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'settings'

  // Profile state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileStatus, setProfileStatus] = useState(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // User Strips state
  const [userStrips, setUserStrips] = useState([]);
  const [isLoadingStrips, setIsLoadingStrips] = useState(true);

  const fetchTemplatesMethod = useStore((store) => store.fetchTemplates);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');

      // Fetch user's strips
      const fetchStrips = async () => {
        setIsLoadingStrips(true);
        try {
          const response = await fetchTemplatesMethod(user.id);
          if (response.success) {
            setUserStrips(response.data);
          }
        } catch (error) {
          console.error("Failed to fetch strips", error);
        } finally {
          setIsLoadingStrips(false);
        }
      };

      fetchStrips();
    }
  }, [user, fetchTemplatesMethod]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileStatus(null);

    const result = await updateProfile({ name, email });

    setIsUpdatingProfile(false);
    if (result.success) {
      setProfileStatus({ type: 'success', message: 'Profile updated successfully.' });
      setTimeout(() => setProfileStatus(null), 3000);
    } else {
      setProfileStatus({ type: 'error', message: result.error });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordStatus(null);

    const result = await updatePassword({
      current_password: currentPassword,
      password: newPassword,
      password_confirmation: confirmPassword
    });

    setIsUpdatingPassword(false);
    if (result.success) {
      setPasswordStatus({ type: 'success', message: 'Password updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordStatus(null), 3000);
    } else {
      setPasswordStatus({ type: 'error', message: result.error });
    }
  };

  const renderContent = () => {
    if (activeTab === 'profile') {
      return (
        <motion.div
          key="profile"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="profile-page"
        >
          <div className="profile-overview-card">
            {/* <h2 className="profile-section-title">Overview</h2> */}
            <div className="profile-identity">
              {/* <div className="profile-avatar">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div> */}
              <div>
                <div className="profile-identity-name">{user?.name}</div>
                <div className="profile-identity-email">{user?.email}</div>
              </div>
            </div>
          </div>

          <div className="profile-strips-section">
            <div className="profile-section-head">
              <h2 className="profile-section-title">Your Strips</h2>
              <span className="profile-strip-count">{userStrips.length} {userStrips.length === 1 ? 'Strip' : 'Strips'}</span>
            </div>

            {isLoadingStrips ? (
              <div className="profile-empty-state">Loading your strips...</div>
            ) : userStrips.length > 0 ? (
              <div className="profile-strips-grid">
                {userStrips.map((strip) => (
                  <article key={strip.id} className="catalog-card profile-strip-card">
                    <div className="catalog-preview profile-strip-preview">
                      {(strip.frame_image_url || strip.frameImage) ? (
                        <img
                          src={strip.frame_image_url || strip.frameImage}
                          alt={strip.name}
                          className="profile-strip-image"
                        />
                      ) : (
                        <div className="catalog-preview-empty">
                          <ImageIcon size={24} />
                          No Preview
                        </div>
                      )}
                    </div>
                    <div className="catalog-card-body">
                      <div>
                        <h3 title={strip.name}>{strip.name}</h3>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="profile-empty-state profile-empty-card">
                <ImageIcon size={48} />
                <div className="profile-empty-title">No strips yet</div>
                <div className="profile-empty-copy">
                  Your saved photo strips will appear here. Go to the editor to create one!
                </div>
              </div>
            )}
          </div>
        </motion.div>
      );
    }

    if (activeTab === 'settings') {
      return (
        <motion.div
          key="settings"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="profile-page profile-settings-page"
        >
          <div className="profile-settings-card">
            <h2 className="profile-section-title">Profile Information</h2>
            <p className="profile-settings-copy">
              Update your account's profile information and email address.
            </p>
            
            {profileStatus && (
              <div className={`profile-status-message ${profileStatus.type}`}>
                {profileStatus.message}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="profile-settings-form">
              <div className="profile-field">
                <label className="profile-field-label">Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="profile-field-input"
                  required 
                />
              </div>
              <div className="profile-field">
                <label className="profile-field-label">Email</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="profile-field-input"
                  required 
                />
              </div>
              <div className="profile-form-actions">
                <button 
                  type="submit" 
                  className="auth-button"
                  disabled={isUpdatingProfile}
                >
                  {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          <div className="profile-settings-card">
            <h2 className="profile-section-title">Update Password</h2>
            <p className="profile-settings-copy">
              Ensure your account is using a long, random password to stay secure.
            </p>
            
            {passwordStatus && (
              <div className={`profile-status-message ${passwordStatus.type}`}>
                {passwordStatus.message}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="profile-settings-form">
              <div className="profile-field">
                <label className="profile-field-label">Current Password</label>
                <input 
                  type="password" 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="profile-field-input"
                  required 
                />
              </div>
              <div className="profile-field">
                <label className="profile-field-label">New Password</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="profile-field-input"
                  required 
                />
              </div>
              <div className="profile-field">
                <label className="profile-field-label">Confirm Password</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="profile-field-input"
                  required 
                />
              </div>
              <div className="profile-form-actions">
                <button 
                  type="submit" 
                  className="auth-button"
                  disabled={isUpdatingPassword}
                >
                  {isUpdatingPassword ? 'Saving...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      );
    }
  };

  return (
    <AppShell
      title="My Account"
      showBackButton={true}
      onBack={() => navigate('/')}
      menu={menu}
    >
      <main className="editor-layout" style={{ gridTemplateColumns: '300px 1fr' }}>
        <aside className="panel">
          <CollapsibleSection title="ACCOUNT" note="Manage profile" defaultCollapsed={false}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div
                onClick={() => setActiveTab('profile')}
                style={{
                  cursor: 'pointer',
                  opacity: activeTab === 'profile' ? 1 : 0.6,
                  transition: 'opacity 0.2s ease'
                }}
              >
                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={16} /> Profile
                </strong>
                <br />View your info and strips.
              </div>
              <hr style={{ width: '100%', border: 'none', borderTop: '1px solid var(--line)', margin: '4px 0' }} />
              <div
                onClick={() => setActiveTab('settings')}
                style={{
                  cursor: 'pointer',
                  opacity: activeTab === 'settings' ? 1 : 0.6,
                  transition: 'opacity 0.2s ease'
                }}
              >
                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Settings size={16} /> Settings
                </strong>
                <br />Edit email and password.
              </div>
            </div>
          </CollapsibleSection>
        </aside>

        <section className="workspace" style={{ padding: '2rem', overflowY: 'auto' }}>
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </section>
      </main>

      {showAboutModal && (
        <div
          onClick={() => setShowAboutModal(false)}
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
          <img
            onClick={(e) => e.stopPropagation()}
            src={aboutImage}
            alt="About iBooth"
            style={{ width: '800px', maxWidth: '90vw', height: 'auto', display: 'block', objectFit: 'contain' }}
          />
        </div>
      )}
    </AppShell>
  );
}
