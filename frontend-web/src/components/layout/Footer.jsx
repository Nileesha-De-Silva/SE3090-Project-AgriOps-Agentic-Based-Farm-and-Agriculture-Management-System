import { Link } from 'react-router-dom';
import { 
  Sprout, 
  ExternalLink, 
  ShieldCheck, 
  Database, 
  Cpu, 
  Layers, 
  CheckCircle2, 
  BookOpen, 
  Activity, 
  Clock 
} from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-emerald-950 via-forest-950 to-teal-950 text-white border-t border-emerald-800/80 relative z-20 mt-auto shadow-2xl">
      {/* Top Emerald Gradient Glow Line */}
      <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-400 via-green-400 to-emerald-500 w-full" />

      {/* Main Footer Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          
          {/* Column 1: System Branding & Architecture Overview */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400/30">
                <Sprout className="w-5 h-5 text-emerald-100" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg tracking-tight text-white flex items-center gap-2">
                  AgriOps <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">v2.4.0</span>
                </h3>
                <p className="text-xs text-emerald-300/80 font-medium">Autonomous Farm Task Coordination</p>
              </div>
            </div>

            <p className="text-xs text-emerald-200/70 leading-relaxed">
              Enterprise agentic agriculture platform orchestrating dynamic agronomic diagnosis, Human-in-the-Loop approval dossiers, and real-time field worker dispatch.
            </p>

            {/* Live Model & Engine Telemetry Badges */}
            <div className="pt-1 flex flex-col gap-2 text-xs">
              <div className="flex items-center space-x-2 text-emerald-300 bg-emerald-900/60 px-3 py-1.5 rounded-lg border border-emerald-800/70 w-fit">
                <Cpu className="w-3.5 h-3.5 text-teal-400" />
                <span className="font-medium">Gemini 3.8 Flash • LangGraph ReAct</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-300 bg-emerald-900/60 px-3 py-1.5 rounded-lg border border-emerald-800/70 w-fit">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-medium">SQLite WAL Database Audit Trail</span>
              </div>
            </div>
          </div>

          {/* Column 2: Standalone Multi-Tab Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Multi-Tab Workspaces</span>
            </h4>
            <p className="text-[11px] text-emerald-300/60">
              Open independent browser tabs for multi-screen farm operations:
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="/tasks/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between py-1 px-2.5 rounded-lg bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-800/40 hover:border-emerald-600/60 text-emerald-200 hover:text-white transition-all"
                  title="Open Create Task in a new browser tab"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 group-hover:scale-125 transition-transform" />
                    <span>Create Agronomic Task</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400 group-hover:text-emerald-200 transition-colors" />
                </a>
              </li>
              <li>
                <a
                  href="/approvals"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between py-1 px-2.5 rounded-lg bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-800/40 hover:border-emerald-600/60 text-emerald-200 hover:text-white transition-all"
                  title="Open Pending Approvals Dossiers in a new browser tab"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 group-hover:scale-125 transition-transform" />
                    <span>HITL Approval Inbox</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400 group-hover:text-amber-200 transition-colors" />
                </a>
              </li>
              <li>
                <a
                  href="/analysis"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between py-1 px-2.5 rounded-lg bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-800/40 hover:border-emerald-600/60 text-emerald-200 hover:text-white transition-all"
                  title="Open AI Multimodal Crop Analysis in a new browser tab"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 group-hover:scale-125 transition-transform" />
                    <span>Crop Disease Diagnosis</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-teal-400 group-hover:text-teal-200 transition-colors" />
                </a>
              </li>
              <li>
                <a
                  href="/workers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between py-1 px-2.5 rounded-lg bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-800/40 hover:border-emerald-600/60 text-emerald-200 hover:text-white transition-all"
                  title="Open Field Worker Roster in a new browser tab"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-400 group-hover:scale-125 transition-transform" />
                    <span>Workforce Directory</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-lime-400 group-hover:text-lime-200 transition-colors" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Agronomic Standards & Verification Safeguards */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Agronomic Protocols</span>
            </h4>
            <div className="space-y-2.5 text-xs text-emerald-200/80">
              <div className="p-2.5 rounded-lg bg-emerald-900/30 border border-emerald-800/50 space-y-1">
                <div className="flex items-center gap-1.5 text-white font-semibold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ICAR & USDA Integrated Pest Mgmt.</span>
                </div>
                <p className="text-[11px] text-emerald-300/70">
                  Dosages and interventions grounded in validated agricultural research handbooks.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-900/30 border border-emerald-800/50 space-y-1">
                <div className="flex items-center gap-1.5 text-white font-semibold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                  <span>Dual-Key HITL Safety Threshold</span>
                </div>
                <p className="text-[11px] text-emerald-300/70">
                  Chemical sprays & high-severity treatments require verified manager authorization.
                </p>
              </div>
            </div>
          </div>

          {/* Column 4: Operational Status & System Telemetry */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Realtime Farm Operations</span>
            </h4>

            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-900/50 to-teal-900/50 border border-emerald-700/60 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-200/80 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>ReAct Agent Core:</span>
                </span>
                <span className="font-bold text-emerald-300">Operational</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-200/80 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                  <span>Field Dispatch Engine:</span>
                </span>
                <span className="font-bold text-teal-300">Active (98.4%)</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-200/80 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-green-400" />
                  <span>Sync Interval:</span>
                </span>
                <span className="font-medium text-white">Live Realtime</span>
              </div>

              <div className="pt-1.5 border-t border-emerald-800/60">
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-300/80">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Station Alpha • Sector 4 Grid</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright, Author Credit & Quick Navigation Links */}
        <div className="mt-10 pt-6 border-t border-emerald-800/60 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-emerald-300/80">
          <div className="flex items-center space-x-2">
            <span>© {currentYear} AgriOps Farm Management System.</span>
            <span className="hidden sm:inline text-emerald-700">•</span>
            <span className="text-white font-medium">SE3090 Component 2</span>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/" className="hover:text-white transition-colors">
              Kanban Board
            </Link>
            <span className="text-emerald-700">•</span>
            <Link to="/approvals" className="hover:text-white transition-colors">
              Approvals
            </Link>
            <span className="text-emerald-700">•</span>
            <Link to="/analysis" className="hover:text-white transition-colors">
              Crop Analysis
            </Link>
            <span className="text-emerald-700">•</span>
            <Link to="/workers" className="hover:text-white transition-colors">
              Workers
            </Link>
          </div>

          <div className="text-[11px] text-emerald-400/90 font-medium">
            Designed for Nileesha De Silva • Enterprise Agronomic Operations
          </div>
        </div>
      </div>
    </footer>
  );
}
