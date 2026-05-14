import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../App';
import '@styles/global.css';

const rootElement = document.getElementById('app');

if (!rootElement) {
  throw new Error('Popup root element not found');
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
