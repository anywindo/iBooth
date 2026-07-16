import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './LegalPageLayout.css';

export default function LegalPageLayout({ children }) {
  const navigate = useNavigate();

  return (
    <motion.div
      className="legal-page-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="legal-header">
        <button onClick={() => navigate(-1)} className="legal-back-button">
          <ArrowLeft size={16} /> Back
        </button>
      </div>
      <div className="legal-content">
        {children}
      </div>
    </motion.div>
  );
}
