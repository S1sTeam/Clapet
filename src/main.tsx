import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

// Prevent default context menu outside custom handlers
document.addEventListener('contextmenu', e => e.preventDefault());

// Disable F12 / DevTools shortcuts
document.addEventListener('keydown', e => {
  if (
    e.key === 'F12' ||
    ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C'))
  ) {
    e.preventDefault();
  }
});

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
