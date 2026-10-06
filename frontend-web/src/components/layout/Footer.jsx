import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { useAuth } from '../../contexts/authcontext';

const productLinks = [
  { href: '/#features', label: 'Features' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#who', label: "Who it's for" },
];

const supportLinks = [
  { href: 'mailto:support@agriops.local', label: 'Help Center' },
  { href: 'mailto:support@agriops.local', label: 'Contact us' },
  { href: '/api/health', label: 'System status' },
];

const legalLinks = [
  { href: '/#privacy', label: 'Privacy Policy' },
  { href: '/#terms', label: 'Terms of Service' },
];

function FooterLinkGroup({ title, links }) {
  return (
    <nav className="site-footer-group" aria-label={title}>
      <h2>{title}</h2>
      <div>
        {links.map((link) => <a key={link.label} href={link.href}>{link.label}</a>)}
      </div>
    </nav>
  );
}

export default function Footer() {
  const { user } = useAuth();
  const workspacePath = user ? '/workspace' : '/login';
  const actionLabel = user ? 'Open workspace' : 'Sign in';

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-top">
          <div className="site-footer-brand">
            <Link to="/" className="site-footer-logo" aria-label="AgriOps home">
              <span className="site-footer-logo-mark"><Leaf size={17} aria-hidden="true" /></span>
              <span>AgriOps</span>
            </Link>
            <p>A shared workspace for planning, fieldwork and supplies.</p>
            <Link className="site-footer-cta" to={workspacePath}>{actionLabel}</Link>
          </div>

          <FooterLinkGroup title="Product" links={productLinks} />
          <FooterLinkGroup title="Support" links={supportLinks} />
          <FooterLinkGroup title="Legal" links={legalLinks} />
        </div>

        <div className="site-footer-bottom">
          <p>© {new Date().getFullYear()} AgriOps. All rights reserved.</p>
          <p>Photos on Unsplash by <a href="https://unsplash.com/photos/W5FdAcHp7l8" target="_blank" rel="noreferrer">Illiya Vjestica</a> and <a href="https://unsplash.com/photos/xDwEa2kaeJA" target="_blank" rel="noreferrer">Tim Mossholder</a></p>
        </div>
      </div>
    </footer>
  );
}
