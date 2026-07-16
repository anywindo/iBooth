import React from 'react';
import ReactMarkdown from 'react-markdown';
import LegalPageLayout from '../components/LegalPageLayout';
import termsContent from '../assets/legal/terms.md?raw';

export default function TermsScreen() {
  return (
    <LegalPageLayout>
      <ReactMarkdown>{termsContent}</ReactMarkdown>
    </LegalPageLayout>
  );
}
