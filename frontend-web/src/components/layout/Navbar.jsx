import { useSelector } from 'react-redux';
import { Bell, Sparkles, Database, ShieldCheck, Activity, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar({ onToggleSidebar, isSidebarOpen = true }) {
  const pendingApprovals = useSelector((state) => state.cropAnalysis.pendingApprovals);
  const approvalCount = pendingApprovals.length;

  return (
    <header className="bg-gradient-to-r from-emerald-950 via-forest-950 to-teal-950 backdrop-blur-md border-b border-emerald-800/80 sticky top-0 z-30 shadow-md shadow-emerald-950/20 text-white">
      {/* Top emerald ambient brandline */}
      <div className="h-1 bg-gradient-to-r from-emerald-500 via-green-400 via-teal-400 to-emerald-500 w-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Brand Logo, System Title & 3 Horizontal Line Notation Button */}
          <div className="flex items-center space-x-2.5 sm:space-x-3.5">
            {/* 3 Horizontal Line Notation (Hamburger Menu) Button */}
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-2 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 hover:text-white border border-emerald-700/80 transition-all flex items-center justify-center shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 group cursor-pointer"
              title={isSidebarOpen ? "Click 3-line notation to collapse sidebar" : "Click 3-line notation to review sidebar"}
              aria-label="Click 3 horizontal lines to review navigation sidebar"
            >
              <Menu className="w-5 h-5 text-emerald-300 group-hover:text-white transition-colors" />
            </button>

            <Link to="/" className="flex items-center space-x-2.5 sm:space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400/30 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-emerald-100" />
              </div>
              <div>
                <div className="flex items-center space-x-2.5">
                  <span className="font-extrabold text-xl text-white tracking-tight">AgriOps</span>
                  <span className="inline-flex items-center space-x-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>Agent 2 Active</span>
                  </span>
                </div>
                <p className="text-[11px] text-emerald-300/80 font-medium hidden sm:block">
                  Autonomous Farm Task & Worker Coordination System
                </p>
              </div>
            </Link>
          </div>

          {/* Status Indicators & Alerts */}
          <div className="flex items-center space-x-3.5">
            
            {/* System Status Badges */}
            <div className="hidden md:flex items-center space-x-2 text-xs">
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-900/60 text-emerald-200 border border-emerald-700/60 shadow-2xs font-medium">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>Backend Core</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>

              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-teal-900/60 text-teal-200 border border-teal-700/60 shadow-2xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>Gemini 3.8 Flash</span>
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
              </div>

              <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-green-900/60 text-green-200 border border-green-700/60 shadow-2xs font-medium">
                <Activity className="w-3.5 h-3.5 text-green-400" />
                <span>Health: 98.4%</span>
              </div>
            </div>

            {/* Approval Inbox Alert Button */}
            <Link
              to="/approvals"
              className={`relative p-2 rounded-xl transition-all ${
                approvalCount > 0
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-sm hover:bg-amber-500/30'
                  : 'text-emerald-300 hover:text-white hover:bg-emerald-900/60 border border-transparent'
              }`}
              title="Pending Manager Approvals"
            >
              <Bell className="w-5 h-5" />
              {approvalCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs shadow-sm ring-2 ring-emerald-950 animate-bounce">
                  {approvalCount}
                </span>
              )}
            </Link>

            {/* User Profile Avatar */}
            <div className="flex items-center space-x-2.5 pl-3 border-l border-emerald-800/80">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center text-xs font-bold ring-2 ring-emerald-400/30 shadow-xs">
                ND
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-xs font-bold text-white leading-none">Nileesha De Silva</p>
                <p className="text-[10px] text-emerald-400 font-semibold leading-none mt-1">Farm Manager</p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
