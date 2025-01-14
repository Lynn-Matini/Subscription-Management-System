// frontend/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AppProvider } from './context/AppContext'; // Import the provider

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppProvider>
      {' '}
      {/* Wrap your App with the Provider */}
      <App />
    </AppProvider>
  </React.StrictMode>
);
