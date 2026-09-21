import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Kanban, 
  Inbox, 
  Sparkles, 
  Users, 
  FileCheck2, 
  Activity,
  X,
  ChevronLeft
} from 'lucide-react';

export default function Sidebar({ 
  isOpen = true, 
  isMobileOpen = false, 
  onCloseMobile, 
  onToggleDesktop 
}) {
  const pendingApprovals = useSelector((state) => state.cropAnalysis.pendingApprovals);
  const tasks = useSelector((state) => state.tasks.items);
  const verificationCount = tasks.filter((t) => t.status === 'PendingVerification').length;

  const navItems = [
    {
      name: 'Task Kanban Board',
      path: '/',
      icon: Kanban,
      badge: tasks.length,
      badgeColor: 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold',
    },
    {
      name: 'Approval Inbox (HITL)',
      path: '/approvals',
      icon: Inbox,
      badge: pendingApprovals.length,
      badgeColor: pendingApprovals.length > 0 ? 'bg-amber-500 text-white font-bold' : null,
    },
    {
      name: 'AI Crop Analysis',
      path: '/analysis',
      icon: Sparkles,
      badge: 'Agent 2',
      badgeColor: 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-200',
    },
    {
      name: 'Field Workers',
      path: '/workers',
      icon: Users,
      badge: null,
    },
  ];

  const renderNav = (isMobile = false) => (
    <div className="space-y-6">
      {/* Navigation Group */}
      <div>
        <div className="px-3 mb-2.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-emerald-900/70">
          <span>Operations & Tasks</span>
          {!isMobile && onToggleDesktop && (
            <button
              type="button"
              onClick={onToggleDesktop}
              className="p-1 rounded-lg text-emerald-800 hover:bg-emerald-200/70 hover:text-emerald-950 transition-colors"
              title="Collapse Sidebar"
              aria-label="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => {
                  if (isMobile && onCloseMobile) {
                    onCloseMobile();
                  }
                }}
                className={({ isActive }) =>
                  `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white font-bold shadow-md shadow-emerald-700/20 border-l-4 border-emerald-300'
                      : 'text-emerald-950/80 hover:bg-emerald-100/70 hover:text-emerald-950 font-semibold'
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4 transition-colors" />
                  <span>{item.name}</span>
                </div>
                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      item.badgeColor || 'bg-white/20 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Quick Task Status Summary */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-100/80 via-emerald-50 to-teal-100/60 border border-emerald-200/90 shadow-card-green">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-emerald-950">Verification Gate</span>
          <FileCheck2 className="w-4 h-4 text-emerald-700" />
        </div>
        <p className="text-xs text-emerald-900/80 mb-2.5">
          Tasks awaiting photo evidence review:
        </p>
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-emerald-900 font-medium">Pending Review</span>
          <span
            className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
              verificationCount > 0 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'bg-emerald-200/80 text-emerald-900'
            }`}
          >
            {verificationCount}
          </span>
        </div>
      </div>
    </div>
  );

  const renderFooter = () => (
    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950 via-green-950 to-teal-950 border border-emerald-800/80 text-[11px] text-emerald-200/90 space-y-1.5 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5 font-bold text-white">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>AgriOps Autonomy Engine</span>
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-400 agri-badge-pulse"></span>
      </div>
      <p className="text-[10px] text-emerald-300/80 font-mono">
        LangGraph ReAct + Gemini 3.8 Flash
      </p>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar with Smooth Collapse / Expand Animation */}
      <aside
        className={`bg-emerald-50/80 backdrop-blur-md border-r border-emerald-200/90 min-h-[calc(100vh-4rem)] flex-col justify-between hidden md:flex shadow-xs transition-all duration-300 ease-in-out shrink-0 ${
          isOpen
            ? 'w-64 p-4 opacity-100'
            : 'w-0 p-0 opacity-0 overflow-hidden border-r-0 pointer-events-none'
        }`}
      >
        <div className="w-56">
          {renderNav(false)}
        </div>
        <div className="w-56 mt-6">
          {renderFooter()}
        </div>
      </aside>

      {/* Mobile Slide-Out Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-emerald-950/60 backdrop-blur-xs transition-opacity md:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-Out Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-gradient-to-b from-emerald-50/98 via-white/95 to-teal-50/95 backdrop-blur-xl border-r border-emerald-300 p-5 shadow-2xl flex flex-col justify-between md:hidden transition-transform duration-300 ease-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Mobile Drawer Header with AgriOps Logo & Close Button */}
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-emerald-200/80">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4 h-4 text-emerald-100" />
              </div>
              <div>
                <span className="font-extrabold text-base text-emerald-950 block leading-tight">AgriOps</span>
                <span className="text-[10px] text-emerald-700 font-bold block">Navigation Menu</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 rounded-xl bg-emerald-100 text-emerald-900 hover:bg-emerald-200 border border-emerald-300 transition-colors"
              title="Close Menu"
              aria-label="Close sidebar menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {renderNav(true)}
        </div>

        <div className="mt-6">
          {renderFooter()}
        </div>
      </aside>
    </>
  );
}
