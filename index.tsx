
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Signals index.html that the module started loading successfully
if (typeof (window as any)._onAppReady === 'function') {
  (window as any)._onAppReady();
}

const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    const root = ReactDOM.createRoot(rootElement);
    // Using a simpler mount to ensure better compatibility with all environments
    root.render(<App />);
    console.log("Salamatuk: Root mount successful.");
  } catch (err) {
    console.error("Salamatuk: Render fatal error", err);
    rootElement.innerHTML = `
      <div style="height:100vh; display:flex; align-items:center; justify-content:center; background:#0f0a09; color:#ea580c; text-align:center; padding:20px; direction:rtl;">
        <div>
          <h1 style="font-weight:900;">خطأ في النظام</h1>
          <p style="color:#64748b;">حدثت مشكلة تقنية أثناء تشغيل التطبيق.</p>
          <button onclick="location.reload()" style="margin-top:20px; padding:10px 30px; background:#ea580c; color:white; border:none; border-radius:10px; cursor:pointer;">إعادة تحميل</button>
        </div>
      </div>
    `;
  }
}
