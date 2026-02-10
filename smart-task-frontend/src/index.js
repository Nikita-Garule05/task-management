import React from 'react';
import ReactDOM from 'react-dom/client';
import "bootstrap/dist/css/bootstrap.min.css";
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { initAuthFromStorage } from "./auth/authService";
import { setupInterceptors } from "./api/interceptors";

try {
  const t = window.localStorage.getItem("stm_theme_v1");
  const theme = t === "dark" || t === "light" ? t : "light";
  if (!t) window.localStorage.setItem("stm_theme_v1", theme);
  document.documentElement.setAttribute("data-bs-theme", theme);
} catch {
  document.documentElement.setAttribute("data-bs-theme", "light");
}

initAuthFromStorage();
setupInterceptors();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
