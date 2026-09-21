import { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
    setMobileSidebarOpen((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-100/70 via-emerald-50/60 to-teal-100/60 flex flex-col relative selection:bg-emerald-300 selection:text-emerald-950">
      {/* Ambient background decoration */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-45">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-emerald-300/60 blur-3xl"></div>
        <div className="absolute top-1/2 -right-20 h-96 w-96 rounded-full bg-teal-300/50 blur-3xl"></div>
        <div className="absolute -bottom-20 left-10 h-80 w-80 rounded-full bg-lime-300/40 blur-3xl"></div>
      </div>

      <Navbar onToggleSidebar={handleToggleSidebar} isSidebarOpen={sidebarOpen} />
      <div className="relative z-10 flex flex-1 max-w-7xl w-full mx-auto">
        <Sidebar 
          isOpen={sidebarOpen} 
          isMobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          onToggleDesktop={() => setSidebarOpen((prev) => !prev)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}

