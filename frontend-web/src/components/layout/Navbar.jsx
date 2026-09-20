import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Bell, Sparkles, Database, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const pendingApprovals = useSelector((state) => state.cropAnalysis.pendingApprovals);
  const approvalCount = pendingApprovals.length;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Brand Logo & System Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-green-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
              <Sparkles className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">AgriOps</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Agent 2 Active
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Farm Task & Worker Management System
              </p>
            </div>
          </div>

          {/* Status Indicators & Alerts */}
          <div className="flex items-center space-x-4">
            
            {/* System Status Badges */}
            <div className="hidden md:flex items-center space-x-2 text-xs">
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                <Database className="w-3.5 h-3.5 text-blue-600" />
                <span>Backend Core</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>

              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>Gemini 3.8 Flash</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
            </div>

            {/* Approval Inbox Alert Button */}
            <Link
              to="/approvals"
              className={`relative p-2 rounded-lg transition-colors ${
                approvalCount > 0
                  ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
              title="Pending Manager Approvals"
            >
              <Bell className="w-5 h-5" />
              {approvalCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-amber-500 text-white font-bold text-xs shadow-sm ring-2 ring-white animate-bounce">
                  {approvalCount}
                </span>
              )}
            </Link>

            {/* User Profile Avatar */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-semibold">
                ND
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-xs font-semibold text-slate-800 leading-none">Nileesha De Silva</p>
                <p className="text-[10px] text-slate-500 leading-none mt-1">Farm Manager</p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
