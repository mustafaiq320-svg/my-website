
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Critical Error: Root element not found");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err) {
    console.error("Rendering Error:", err);
    rootElement.innerHTML = `
      <div style="height: 100vh; display: flex; align-items: center; justify-content: center; background: #0f0a09; color: white; font-family: sans-serif; text-align: center; padding: 20px;">
        <div>
          <h2 style="color: #ea580c;">عذراً، حدث خطأ في التشغيل</h2>
          <p style="color: #94a3b8;">يرجى التأكد من اتصال الإنترنت أو مراجعة لوحة تحكم المتصفح (Console).</p>
        </div>
      </div>
    `;
  }
}
