import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Kanban, 
  Inbox, 
  Sparkles, 
  Users, 
  FileCheck2, 
  Activity
} from 'lucide-react';

export default function Sidebar() {
  const pendingApprovals = useSelector((state) => state.cropAnalysis.pendingApprovals);
  const tasks = useSelector((state) => state.tasks.items);
  const verificationCount = tasks.filter((t) => t.status === 'PendingVerification').length;

  const navItems = [
    {
      name: 'Task Kanban Board',
      path: '/',
      icon: Kanban,
      badge: tasks.length,
      badgeColor: 'bg-slate-200 text-slate-700',
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
      badgeColor: 'bg-emerald-100 text-emerald-800 font-semibold',
    },
    {
      name: 'Field Workers',
      path: '/workers',
      icon: Users,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex">
      <div className="space-y-6">
        
        {/* Navigation Group */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Operations & Tasks
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-900 shadow-sm border border-emerald-200/60 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4 text-slate-500" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge !== null && item.badge !== undefined && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        item.badgeColor || 'bg-slate-100 text-slate-600'
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
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">Verification Gate</span>
            <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <p className="text-xs text-slate-500 mb-2">
            Tasks awaiting photo evidence review:
          </p>
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-600">Pending Review</span>
            <span
              className={`px-2 py-0.5 rounded-md font-bold ${
                verificationCount > 0 ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {verificationCount}
            </span>
          </div>
        </div>

      </div>

      {/* Footer Info */}
      <div className="p-3 rounded-lg bg-emerald-950/5 border border-emerald-900/10 text-[11px] text-slate-500 space-y-1">
        <div className="flex items-center space-x-1.5 font-semibold text-emerald-800">
          <Activity className="w-3.5 h-3.5" />
          <span>AgriOps Autonomy Engine</span>
        </div>
        <p>LangGraph StateGraph + Gemini 3.8 Flash</p>
      </div>

    </aside>
  );
}
