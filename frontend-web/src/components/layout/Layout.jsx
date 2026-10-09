import { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    if (window.matchMedia?.('(max-width: 1023px)').matches) {
      setMobileSidebarOpen((prev) => !prev);
      return;
    }
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div className={`app-shell ${sidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'} ${mobileSidebarOpen ? 'mobile-sidebar-open' : ''}`}>
      {/* Ambient background decoration */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-45">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-emerald-300/60 blur-3xl"></div>
        <div className="absolute top-1/2 -right-20 h-96 w-96 rounded-full bg-teal-300/50 blur-3xl"></div>
        <div className="absolute -bottom-20 left-10 h-80 w-80 rounded-full bg-lime-300/40 blur-3xl"></div>
      </div>

      <Navbar onToggleSidebar={handleToggleSidebar} isSidebarOpen={sidebarOpen} />
      <div className="app-body">
        <Sidebar 
          isOpen={sidebarOpen} 
          isMobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          onToggleDesktop={() => setSidebarOpen((prev) => !prev)}
        />
        <div className="app-content">
          <main className="app-main">
            <div className="content-container">{children}</div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}

