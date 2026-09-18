// Keep this first: it migrates localStorage before `import App` below causes the
// zustand store to hydrate from it. See src/bootstrap.js.
import './bootstrap';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '../css/styles.css';
import { createNotificationChannel, requestNotificationPermission } from './plugins/localNotifications';

createNotificationChannel();
requestNotificationPermission();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
