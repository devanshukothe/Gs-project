import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';  // or './App.css'

import App from './App';
import { AuthProvider } from './contexts/AuthContext'; // Import AuthProvider

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
