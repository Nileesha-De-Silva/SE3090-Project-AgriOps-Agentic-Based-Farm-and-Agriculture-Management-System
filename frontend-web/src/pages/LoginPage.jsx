import { useState } from 'react';
import { ArrowLeft, Leaf } from 'lucide-react';
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

      if (result.roles.includes('Administrator')) {
        navigate('/users');
      } else if (result.roles.includes('FarmManager')) {
        navigate('/analytics');
      } else {
        navigate('/farms');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
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
          <p className="login-kicker">Farm operations workspace</p>
          <h1 id="login-title">Sign in to AgriOps</h1>
          <p>Use your AgriOps account to access your farm workspace.</p>
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
              placeholder="Enter your username"
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
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="login-help">Access is managed by your farm administrator.</p>
        <Link className="login-back" to="/">
          <ArrowLeft size={15} aria-hidden="true" />
          Back to AgriOps home
        </Link>
      </section>
    </main>
  );
}
