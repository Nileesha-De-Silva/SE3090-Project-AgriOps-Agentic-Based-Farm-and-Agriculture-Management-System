import { useState } from 'react';
import { ArrowLeft, Leaf, Shield, Briefcase, Sparkles, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authcontext';

const WEB_ROLES = [
  {
    id: 'FarmManager',
    title: 'Farm Manager',
    icon: Briefcase,
    description: 'Farm operations, task scheduling, worker management & HITL approvals.',
    badge: 'Operations & Labor',
  },
  {
    id: 'Agronomist',
    title: 'Agronomist',
    icon: Sparkles,
    description: 'Crop health diagnostics, disease analysis & agronomic planning.',
    badge: 'Crop & Science',
  },
  {
    id: 'Administrator',
    title: 'Administrator',
    icon: Shield,
    description: 'Full platform administration, user management & system audit logs.',
    badge: 'Security & Access',
  },
];

export default function SignUpPage() {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [roleName, setRoleName] = useState('FarmManager');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your password.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        username: username.trim(),
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        contactNumber: contactNumber.trim() || null,
        roleName,
      };

      const result = await register(payload);
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
      setError(err.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" style={{ maxWidth: '620px' }} aria-labelledby="signup-title">
        <Link className="login-brand" to="/" aria-label="Return to AgriOps home">
          <span className="login-brand-mark">
            <Leaf size={18} aria-hidden="true" />
          </span>
          <span>AgriOps</span>
        </Link>

        <div className="login-heading" style={{ marginTop: '32px' }}>
          <p className="login-kicker">Web Operations & Governance Portal</p>
          <h1 id="signup-title" style={{ fontSize: 'clamp(26px, 5vw, 36px)' }}>Create an Account</h1>
          <p>Register as a certified Administrator, Farm Manager, or Agronomist.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} style={{ marginTop: '28px', gap: '18px' }}>
          {/* Select Web Dashboard Role */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255, 255, 255, 0.85)', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Select Web Dashboard Role <span style={{ color: '#34d399' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
              {WEB_ROLES.map((role) => {
                const Icon = role.icon;
                const isSelected = roleName === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setRoleName(role.id)}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      textAlign: 'left',
                      backgroundColor: isSelected ? 'rgba(5, 150, 105, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      border: isSelected ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Icon size={16} style={{ color: isSelected ? '#34d399' : '#9ca3af' }} />
                        <span style={{ fontSize: '13px', fontWeight: 700 }}>{role.title}</span>
                      </div>
                      {isSelected && <CheckCircle2 size={16} style={{ color: '#34d399' }} />}
                    </div>
                    <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.35, margin: 0 }}>
                      {role.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Username & Full Name */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <label htmlFor="signup-username">
              <span>Username <span style={{ color: '#34d399' }}>*</span></span>
              <input
                id="signup-username"
                name="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                placeholder="e.g. nileesha_ops"
                required
              />
            </label>

            <label htmlFor="signup-fullname">
              <span>Full Name <span style={{ color: '#34d399' }}>*</span></span>
              <input
                id="signup-fullname"
                name="fullName"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                autoComplete="name"
                placeholder="e.g. Nileesha De Silva"
                required
              />
            </label>
          </div>

          {/* Email & Contact Number */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <label htmlFor="signup-email">
              <span>Email Address <span style={{ color: '#34d399' }}>*</span></span>
              <input
                id="signup-email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                placeholder="e.g. nileesha@agriops.local"
                required
              />
            </label>

            <label htmlFor="signup-contact">
              <span>Contact Number</span>
              <input
                id="signup-contact"
                name="contactNumber"
                type="tel"
                value={contactNumber}
                onChange={(event) => setContactNumber(event.target.value)}
                autoComplete="tel"
                placeholder="e.g. +94771234567"
              />
            </label>
          </div>

          {/* Password & Confirm Password */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <label htmlFor="signup-password">
              <span>Password (min. 8 chars) <span style={{ color: '#34d399' }}>*</span></span>
              <input
                id="signup-password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="Enter a secure password"
                minLength={8}
                required
              />
            </label>

            <label htmlFor="signup-confirm-password">
              <span>Confirm Password <span style={{ color: '#34d399' }}>*</span></span>
              <input
                id="signup-confirm-password"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="Repeat password"
                minLength={8}
                required
              />
            </label>
          </div>

          {error && <p className="login-error" role="alert">{error}</p>}

          <button className="login-submit" type="submit" disabled={submitting}>
            {submitting ? 'Creating your account…' : `Sign up as ${WEB_ROLES.find((r) => r.id === roleName)?.title || 'User'}`}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', paddingTop: '18px', borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
          <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '14px', margin: 0 }}>
            Already registered?{' '}
            <Link to="/login" style={{ color: '#34d399', fontWeight: 700, textDecoration: 'underline' }}>
              Sign in with your credentials
            </Link>
          </p>
        </div>

        <p className="login-help" style={{ marginTop: '16px' }}>
          Field Workers & Farmers: Field labor accounts are provisioned for the Mobile Android App.
        </p>

        <Link className="login-back" to="/">
          <ArrowLeft size={15} aria-hidden="true" />
          Back to AgriOps home
        </Link>
      </section>
    </main>
  );
}
