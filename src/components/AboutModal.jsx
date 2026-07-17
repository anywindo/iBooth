import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../core/useStore.js';
import { Button } from './Button.jsx';
import { X } from 'lucide-react';
import logoLight from '../assets/ibootlogo-cb.png';
import logoDark from '../assets/ibootlogo-cw.png';

export function AboutModal({ onClose }) {
  const theme = useStore((store) => store.theme);
  const isDark = theme === 'dark';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(5px)'
        }}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            backgroundColor: isDark ? '#12161b' : '#fbfbf7',
            color: isDark ? '#fbfbf7' : '#12161b',
            padding: '40px',
            borderRadius: '24px',
            boxShadow: isDark 
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.7)' 
              : '0 25px 50px -12px rgba(0, 0, 0, 0.2)',
            maxWidth: '90vw',
            width: '440px',
            position: 'relative'
          }}
        >
          <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
            <Button
              variant="ghost"
              onClick={onClose}
              style={{
                width: '36px', height: '36px', padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <X size={20} />
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <img
              src={isDark ? logoDark : logoLight}
              alt="iBooth Logo"
              style={{ width: '200px', height: 'auto', marginBottom: '32px', objectFit: 'contain' }}
            />
            
            <h2 style={{ margin: '0 0 12px 0', fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em' }}>
              About iBooth
            </h2>
            
            <p style={{ margin: '0 0 16px 0', fontSize: '15px', lineHeight: 1.6, opacity: 0.8 }}>
              iBooth is a completely free photobooth app built for creating,
              capturing, and printing photo strip experiences.
            </p>
            
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', lineHeight: 1.6, opacity: 0.6 }}>
              This app may still feel buggy or slow in some places.
            </p>

            <div style={{ fontSize: '14px', opacity: 0.7 }}>
              Part of{' '}
              <motion.a
                href="https://arwndoprtma.space"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -1 }}
                style={{
                  display: 'inline-block',
                  color: isDark ? '#60a5fa' : '#2563eb',
                  textDecoration: 'none',
                  fontWeight: 500
                }}
              >
                arwndoprtma.space
              </motion.a>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
