
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.log("Salamatuk: Initializing app...");

const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("Salamatuk: App mount requested.");
  } catch (err) {
    console.error("Salamatuk: Render error", err);
    rootElement.innerHTML = `
      <div style="height:100vh; display:flex; align-items:center; justify-content:center; background:#0f0a09; color:#ea580c; text-align:center; padding:20px; font-family:sans-serif; direction:rtl;">
        <div>
          <h1 style="font-size: 24px; margin-bottom: 10px;">عذراً، حدث خطأ أثناء التشغيل</h1>
          <p style="color:#94a3b8; font-size: 16px;">يرجى محاولة تحديث الصفحة أو التحقق من اتصال الإنترنت.</p>
          <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #ea580c; color: white; border: none; border-radius: 8px; cursor: pointer;">تحديث الصفحة</button>
        </div>
      </div>
    `;
  }
} else {
  console.error("Salamatuk: Critical Error - Root element not found in DOM.");
}
