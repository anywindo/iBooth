import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './src/App.jsx';

const rootElement = document.getElementById('app');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
