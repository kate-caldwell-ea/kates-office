import { useState } from 'react';
import useAuthStore from '../store/useAuthStore';

export default function Login() {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, error, clearError } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim() || isSubmitting) return;
    setIsSubmitting(true);
    await login(password);
    setIsSubmitting(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
            borderRadius: '16px',
            marginBottom: '16px',
            fontSize: '36px'
          }}>✦</div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#ffffff', margin: '0 0 8px 0' }}>
            Kate's Office
          </h1>
          <p style={{ color: '#9ca3af', margin: 0, fontSize: '14px' }}>Enter password to continue</p>
        </div>

        <div style={{
          background: '#12121a',
          borderRadius: '16px',
          border: '1px solid #252533',
          padding: '32px'
        }}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                marginBottom: '16px',
                padding: '12px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px',
                color: '#f87171',
                fontSize: '14px'
              }}>
                {error}
                <button type="button" onClick={clearError} style={{
                  float: 'right', background: 'none', border: 'none', color: '#f87171', cursor: 'pointer'
                }}>✕</button>
              </div>
            )}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#9ca3af', marginBottom: '8px' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#0a0a0f',
                  border: '1px solid #252533',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px',
                background: isSubmitting ? '#0d9488' : 'linear-gradient(135deg, #14b8a6, #0d9488)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: isSubmitting ? 'wait' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
