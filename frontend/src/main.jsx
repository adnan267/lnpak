import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { ConsultationProvider } from './context/ConsultationContext';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <CurrencyProvider>
          <AuthProvider>
            <ConsultationProvider>
              <App />
            </ConsultationProvider>
          </AuthProvider>
        </CurrencyProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
);
