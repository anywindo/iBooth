import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield } from 'lucide-react';
import { Button } from './Button';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasConsented = window.localStorage.getItem('ibooth-cookie-consent');
    if (!hasConsented) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    window.localStorage.setItem('ibooth-cookie-consent', 'true');
    setIsVisible(false);
  };

  const handleDecline = () => {
    // Usually same action for strict UI, or you can record false
    window.localStorage.setItem('ibooth-cookie-consent', 'false');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="cookie-consent-wrapper"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          <div className="cookie-consent-content">
            <div className="cookie-consent-text">
              <div className="cookie-consent-title">
                <Shield size={20} className="cookie-icon" />
                <span>We value your privacy</span>
              </div>
              <p>
                We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
              </p>
            </div>
            <div className="cookie-consent-actions">
              <Button onClick={handleDecline} style={{ background: 'transparent', color: 'var(--text-h)', border: '1px solid var(--border)' }}>
                Decline
              </Button>
              <Button onClick={handleAccept} style={{ background: 'var(--accent)', color: '#fff' }}>
                Accept All
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
