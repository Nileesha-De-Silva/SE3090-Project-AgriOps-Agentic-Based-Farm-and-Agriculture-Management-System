import { useState } from 'react';
import { ArrowLeft, Leaf, Shield, Briefcase, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authcontext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const result = await login(username, password);
      const roles = (result.roles || []).map((r) => r?.toLowerCase().trim());

      if (roles.includes('administrator') || roles.includes('admin')) {
        navigate('/users');
      } else if (roles.includes('farmmanager') || roles.includes('manager')) {
        navigate('/workspace');
      } else if (roles.includes('agronomist')) {
        navigate('/analysis');
      } else {
        navigate('/workspace');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function fillRole(u, p = 'ChangeMe123!') {
    setUsername(u);
    setPassword(p);
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <Link className="login-brand" to="/" aria-label="Return to AgriOps home">
          <span className="login-brand-mark">
            <Leaf size={18} aria-hidden="true" />
          </span>
          <span>AgriOps</span>
        </Link>

        <div className="login-heading">
          <p className="login-kicker">Web Operations & Governance Portal</p>
          <h1 id="login-title">Sign in to AgriOps</h1>
          <p>Role-based access control for Administrators, Farm Managers, and Agronomists.</p>
        </div>

        {/* Quick RBAC Role Preset Selector */}
        <div style={{ marginBottom: '1.25rem', padding: '0.75rem', borderRadius: '0.75rem', backgroundColor: 'rgba(236, 253, 245, 0.8)', border: '1px solid #a7f3d0' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065f46', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Quick RBAC Web Personas:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => fillRole('admin')}
              style={{
                padding: '0.4rem 0.5rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '0.5rem',
                backgroundColor: username === 'admin' ? '#047857' : '#ffffff',
                color: username === 'admin' ? '#ffffff' : '#065f46',
                border: '1px solid #10b981',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem'
              }}
            >
              <Shield size={13} />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => fillRole('farm_manager')}
              style={{
                padding: '0.4rem 0.5rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '0.5rem',
                backgroundColor: username === 'farm_manager' ? '#047857' : '#ffffff',
                color: username === 'farm_manager' ? '#ffffff' : '#065f46',
                border: '1px solid #10b981',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem'
              }}
            >
              <Briefcase size={13} />
              <span>Manager</span>
            </button>

            <button
              type="button"
              onClick={() => fillRole('agronomist')}
              style={{
                padding: '0.4rem 0.5rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '0.5rem',
                backgroundColor: username === 'agronomist' ? '#047857' : '#ffffff',
                color: username === 'agronomist' ? '#ffffff' : '#065f46',
                border: '1px solid #10b981',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem'
              }}
            >
              <Sparkles size={13} />
              <span>Agronomist</span>
            </button>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="login-username">
            <span>Username</span>
            <input
              id="login-username"
              name="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              placeholder="e.g. admin, farm_manager, agronomist"
              required
            />
          </label>

          <label htmlFor="login-password">
            <span>Password</span>
            <input
              id="login-password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Enter your password"
              required
            />
          </label>

          {error && <p className="login-error" role="alert">{error}</p>}

          <button className="login-submit" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in to Web Workspace'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
          <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '14px', margin: 0 }}>
            Don't have an account yet?{' '}
            <Link to="/signup" style={{ color: '#34d399', fontWeight: 700, textDecoration: 'underline' }}>
              Sign up for Web Workspace
            </Link>
          </p>
        </div>

        <p className="login-help">
          Field Workers & Farmers: please use the AgriOps Mobile Android Companion.
        </p>
        <Link className="login-back" to="/">
          <ArrowLeft size={15} aria-hidden="true" />
          Back to AgriOps home
        </Link>
      </section>
    </main>
  );
}
