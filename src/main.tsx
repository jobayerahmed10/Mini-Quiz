import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Uncaught React Exception:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetAndReload = () => {
    try {
      localStorage.removeItem('miniquiz_questions_cache');
      localStorage.removeItem('miniquiz_exams_cache');
      sessionStorage.clear();
    } catch {}
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0D172A',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          fontFamily: "'Hind Siliguri', system-ui, sans-serif"
        }}>
          <div style={{
            maxWidth: '400px',
            backgroundColor: '#1E293B',
            borderRadius: '24px',
            padding: '28px',
            border: '1px solid #334155',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              fontSize: '28px'
            }}>
              ⚠️
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '8px', color: '#ffffff' }}>
              অ্যাপ ওপেন করতে সমস্যা হচ্ছে
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '20px' }}>
              মোবাইল ডাটা বা কানেকশনে সাময়িক বিঘ্ন ঘটে থাকতে পারে। অনুগ্রহ করে পেজটি রিফ্রেশ করুন অথবা নিচের বাটনে ক্লিক করুন।
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={this.handleReload}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '14px',
                  backgroundColor: '#0b705c',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                পুনরায় রিফ্রেশ করুন
              </button>
              <button
                onClick={this.handleResetAndReload}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '14px',
                  backgroundColor: '#334155',
                  color: '#cbd5e1',
                  fontWeight: '700',
                  fontSize: '12px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                ক্যাশ মেমোরি রিসেট করে লোড করুন
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Register Service Worker for PWA & Fast Mobile Data Caching
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration note:', err);
    });
  });
}

// Prevent unhandled promise rejections from crashing the mobile screen
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.warn('Mobile Data network/promise warning caught gracefully:', event.reason);
  });
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>,
);

