import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <div className="min-w-80 bg-slate-50 font-sans text-slate-800 antialiased">
      <App />
    </div>
  </StrictMode>,
);
