import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  FileText,
  Leaf,
  LineChart,
  Menu,
  Package,
  ShieldCheck,
  Sparkles,
  Sprout,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/authcontext';
import Footer from '../components/layout/Footer';

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#who', label: 'Who it’s for' },
];

const capabilities = [
  { icon: Sprout, title: 'Farm and crop planning', text: 'Organize farms, fields, crops and growing seasons so everyone works from the same plan.' },
  { icon: ClipboardCheck, title: 'Tasks and crop analysis', text: 'Coordinate work, track progress and review crop-analysis recommendations alongside the tasks they relate to.' },
  { icon: Package, title: 'Inventory and supplies', text: 'Track stock, record receipts and usage, manage suppliers and review reorder recommendations.' },
  { icon: BarChart3, title: 'Analytics and accountability', text: 'Review operational information, approval decisions and activity records in one place.' },
];

const steps = [
  { icon: FileText, title: 'Record farm information', text: 'Teams log fields, tasks, stock and activity as work happens.' },
  { icon: Sparkles, title: 'Review AI suggestions', text: 'AI looks across the records and suggests what may need attention.' },
  { icon: ShieldCheck, title: 'Approve authorized actions', text: 'The right person reviews each important suggestion before anything changes.' },
  { icon: LineChart, title: 'Track the outcome', text: 'Decisions and results are recorded so the team can see what happened next.' },
];

const roles = [
  { title: 'Farmers', text: 'View farm information and stock availability.' },
  { title: 'Workers', text: 'Follow assigned tasks and record permitted field or stock activities.' },
  { title: 'Managers', text: 'Coordinate operations, manage supplies and review recommendations.' },
  { title: 'Administrators', text: 'Manage accounts and access.' },
];

function Logo({ light = false }) {
  return (
    <span className={`home-logo ${light ? 'home-logo-light' : ''}`}>
      <span className="home-logo-mark"><Leaf size={17} aria-hidden="true" /></span>
      AgriOps
    </span>
  );
}

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const workspacePath = '/workspace';
  const authPath = user ? workspacePath : '/login';
  const authLabel = user ? 'Open workspace' : 'Sign in';
  const ctaLabel = user ? 'Open workspace' : 'Sign in to AgriOps';

  useEffect(() => {
    document.title = 'AgriOps — Farm planning, fieldwork and supplies in one workspace';
  }, []);

  return (
    <div className="home-page">
      <a className="home-skip-link" href="#home-main">Skip to content</a>

      <header className="home-header">
        <nav className="home-nav" aria-label="Main navigation">
          <Link to="/" aria-label="AgriOps home"><Logo light /></Link>
          <div className="home-nav-links">
            {navLinks.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
          </div>
          <Link className="home-header-cta" to={authPath}>{authLabel}</Link>
          <button className="home-menu-button" type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>
        {menuOpen && (
          <div className="home-mobile-menu">
            {navLinks.map((link) => <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>{link.label}</a>)}
            <Link to={authPath} onClick={() => setMenuOpen(false)}>{authLabel}</Link>
          </div>
        )}
      </header>

      <main id="home-main">
        <section className="home-hero" id="top">
          <img src="/images/agriops-hero.jpg" alt="Green rolling farmland with grazing sheep at sunset" fetchPriority="high" />
          <div className="home-hero-overlay" aria-hidden="true" />
          <div className="home-section-inner home-hero-content">
            <div className="home-hero-copy">
              <p className="home-eyebrow home-eyebrow-light">Farm and agriculture management</p>
              <h1>Your farm. Your team. One connected workspace.</h1>
              <p className="home-hero-description">Plan farm activities, coordinate fieldwork, track supplies and review AI recommendations—all in one place.</p>
              <div className="home-hero-actions">
                <Link className="home-button home-button-mint" to={authPath}>{ctaLabel} <ArrowRight size={17} aria-hidden="true" /></Link>
                <a className="home-button home-button-outline" href="#features">Explore the platform</a>
              </div>
            </div>
          </div>
        </section>

        <section className="home-purpose home-section-inner">
          <h2>Bring everyday farm operations together.</h2>
          <div className="home-purpose-copy">
            <p>On many farms, important information lives in notebooks, spreadsheets, group chats and people’s memories. It works—until someone needs to know what was done, what’s running low or what should happen next.</p>
            <p>AgriOps brings that information into one shared workspace. Plans, tasks, stock and decisions sit side by side, so the team can see what needs attention and agree on the next step.</p>
          </div>
        </section>

        <section className="home-capabilities" id="features">
          <div className="home-section-inner">
            <p className="home-eyebrow">Features</p>
            <h2>Four connected capabilities</h2>
            <div className="home-capability-grid">
              {capabilities.map(({ icon: Icon, title, text }) => (
                <article className="home-capability-card" key={title}>
                  <span className="home-icon-tile"><Icon size={25} aria-hidden="true" /></span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="home-process" id="how-it-works">
          <div className="home-section-inner">
            <p className="home-eyebrow home-eyebrow-light">How it works</p>
            <h2>AI recommendations. Human decisions.</h2>
            <p className="home-process-intro">AI helps by analysing records and suggesting what may need attention. Authorized people review important decisions before anything is changed.</p>
            <ol className="home-step-grid">
              {steps.map(({ icon: Icon, title, text }, index) => (
                <li className="home-step-card" key={title}>
                  <div className="home-step-top"><Icon size={25} aria-hidden="true" /><span>Step {index + 1}</span></div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </li>
              ))}
            </ol>
            <figure className="home-inventory-example">
              <figcaption>Example: inventory</figcaption>
              <blockquote>When supplies run low, an inventory recommendation can be reviewed by a manager. Approval creates a purchase request; stock changes only when goods are received.</blockquote>
            </figure>
          </div>
        </section>

        <section className="home-team home-section-inner" id="who">
          <div className="home-team-image"><img src="/images/agriops-team.jpg" alt="Field workers harvesting produce in rows" loading="lazy" /></div>
          <div className="home-team-copy">
            <p className="home-eyebrow">Who it’s for</p>
            <h2>Designed for the whole farm team</h2>
            <dl className="home-role-list">
              {roles.map((role) => <div key={role.title}><dt>{role.title}</dt><dd>{role.text}</dd></div>)}
            </dl>
            <p className="home-team-note">The web workspace supports planning and oversight, while the mobile app supports work in the field.</p>
          </div>
        </section>

        <section className="home-final-cta home-section-inner">
          <div>
            <h2>Keep your farm moving, together.</h2>
            <p>Bring planning, fieldwork and supplies into one shared view.</p>
            <Link className="home-button home-button-forest" to={authPath}>{ctaLabel} <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
