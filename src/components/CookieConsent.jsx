import React, { useState, useEffect } from 'react';
import { Cookie } from 'lucide-react';
import { Button } from './Button';
import Dialog from './Dialog';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasConsented = window.localStorage.getItem('ibooth-cookie-consent');
    if (!hasConsented) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    window.localStorage.setItem('ibooth-cookie-consent', 'true');
    setIsVisible(false);
  };

  const handleDecline = () => {
    window.localStorage.setItem('ibooth-cookie-consent', 'false');
    setIsVisible(false);
  };

  const footer = (
    <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
      <Button onClick={handleDecline} style={{ flex: 1, background: 'transparent', color: 'var(--text-h)', border: '1px solid var(--border)' }}>
        Decline
      </Button>
      <Button onClick={handleAccept} style={{ flex: 1, background: 'var(--accent)', color: '#fff' }}>
        Accept All
      </Button>
    </div>
  );

  const title = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <Cookie size={24} color="var(--accent)" />
      <span>Cookie Settings</span>
    </div>
  );

  return (
    <Dialog
      isOpen={isVisible}
      onClose={() => {}}
      title={title}
      footer={footer}
      size="md"
      closeOnOverlayClick={false}
      showCloseButton={false}
    >
      <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text)', lineHeight: '1.5' }}>
        We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
      </p>
    </Dialog>
  );
}
