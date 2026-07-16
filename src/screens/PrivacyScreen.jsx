import React from 'react';
import ReactMarkdown from 'react-markdown';
import LegalPageLayout from '../components/LegalPageLayout';
import privacyContent from '../assets/legal/privacy.md?raw';

export default function PrivacyScreen() {
  return (
    <LegalPageLayout>
      <ReactMarkdown>{privacyContent}</ReactMarkdown>
    </LegalPageLayout>
  );
}
