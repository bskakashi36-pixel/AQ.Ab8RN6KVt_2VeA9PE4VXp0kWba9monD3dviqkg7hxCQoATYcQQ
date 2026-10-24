import React from 'react';
import { Gift, RotateCcw } from 'lucide-react';

interface HeaderProps {
  activeTab: 'mobile' | 'manager' | 'security' | 'audit';
  setActiveTab: (tab: 'mobile' | 'manager' | 'security' | 'audit') => void;
  onResetDemo: () => void;
  isResetting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onResetDemo,
  isResetting,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single element) */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Gift className="w-4 h-4" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
            RedeemPulse
          </span>
        </div>

        {/* Zone 2: Navigation Links (Clean single-line text) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => setActiveTab('mobile')}
            className={`whitespace-nowrap hover:text-white transition-colors cursor-pointer py-1 ${
              activeTab === 'mobile' ? 'text-white border-b-2 border-emerald-400' : ''
            }`}
          >
            Redeem App
          </button>
          <button
            onClick={() => setActiveTab('manager')}
            className={`whitespace-nowrap hover:text-white transition-colors cursor-pointer py-1 ${
              activeTab === 'manager' ? 'text-white border-b-2 border-emerald-400' : ''
            }`}
          >
            Voucher Manager
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`whitespace-nowrap hover:text-white transition-colors cursor-pointer py-1 ${
              activeTab === 'security' ? 'text-white border-b-2 border-emerald-400' : ''
            }`}
          >
            Security & Rate Limits
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`whitespace-nowrap hover:text-white transition-colors cursor-pointer py-1 ${
              activeTab === 'audit' ? 'text-white border-b-2 border-emerald-400' : ''
            }`}
          >
            Database & Logs
          </button>
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onResetDemo}
            disabled={isResetting}
            title="Reset database to starter codes and balances"
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-lg transition-all hover:text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>
    </header>
  );
};
