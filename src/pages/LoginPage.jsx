import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password);
      navigate('/');
    } catch (err) {
      const msgs = {
        'auth/user-not-found': 'No account with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/email-already-in-use': 'Email already registered.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/invalid-email': 'Invalid email address.',
      };
      setError(msgs[err.code] || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 20,
    }}>
      {/* Glow orb */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,255,136,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            marginBottom: 8,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'var(--accent)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 800, color: '#050508',
            }}>M</div>
            <span style={{
              fontFamily: 'var(--font-sans)', fontWeight: 800,
              fontSize: 22, letterSpacing: '-0.5px',
            }}>
              Milkyway<span style={{ color: 'var(--accent)' }}>.</span>
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
            SUPER ROULETTE AUTOMATION
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ border: '1px solid var(--border-lit)' }}>
          {/* Tab toggle */}
          <div style={{
            display: 'flex', background: 'var(--bg-raised)',
            borderRadius: 'var(--radius-sm)', padding: 3, marginBottom: 24,
          }}>
            {['login'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '7px 0', border: 'none', cursor: 'pointer',
                borderRadius: 'var(--radius-sm)',
                background: mode === m ? 'var(--bg-hover)' : 'transparent',
                color: mode === m ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                letterSpacing: 1, textTransform: 'uppercase',
                transition: 'all 0.15s',
                boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
              }}>
                {m}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="input" type="email" required
                placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="input" type="password" required
                placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div style={{
                padding: '8px 12px', marginBottom: 14,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 'var(--radius-sm)', color: 'var(--danger)',
                fontFamily: 'var(--font-mono)', fontSize: 11,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit" className="btn btn-primary w-full btn-lg"
              style={{ justifyContent: 'center' }} disabled={loading}
            >
              {loading
                ? <span className="spin" style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #050508', borderTopColor: 'transparent', borderRadius: '50%' }} />
                : mode === 'login' ? '→ SIGN IN' : '→ CREATE ACCOUNT'
              }
            </button>
          </form>
        </div>

        <p style={{
          textAlign: 'center', marginTop: 20,
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--text-muted)', letterSpacing: 1,
        }}>
          MILKYWAY WEB v2.0 — SECURE SESSION
        </p>
      </div>
    </div>
  );
}
