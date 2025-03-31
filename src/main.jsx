import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter for routing
import App from './App';
import './index.css'; // Optional global styles (if needed)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App /> {/* App handles all the routes */}
    </BrowserRouter>
  </React.StrictMode>
);
