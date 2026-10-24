import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { MobileAppView } from './components/MobileAppView';
import { VoucherManager } from './components/VoucherManager';
import { SecurityInspector } from './components/SecurityInspector';
import { DatabaseAuditView } from './components/DatabaseAuditView';
import { User, PromoCode, Redemption, SecurityEvent, SystemStats } from './types';
import { ShieldCheck, Gift, Coins, Layers, CheckCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'mobile' | 'manager' | 'security' | 'audit'>('mobile');
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = useCallback(async () => {
    try {
      const [usersRes, codesRes, redemptionsRes, statsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/codes'),
        fetch('/api/redemptions'),
        fetch('/api/stats'),
      ]);

      const [usersData, codesData, redemptionsData, statsData] = await Promise.all([
        usersRes.json(),
        codesRes.json(),
        redemptionsRes.json(),
        statsRes.json(),
      ]);

      if (usersData.success) {
        setUsers(usersData.users);
        setCurrentUser(prev => {
          if (!prev) return usersData.users[0] || null;
          return usersData.users.find((u: User) => u.id === prev.id) || usersData.users[0];
        });
      }

      if (codesData.success) {
        setCodes(codesData.codes);
      }

      if (redemptionsData.success) {
        setRedemptions(redemptionsData.redemptions);
        setSecurityEvents(redemptionsData.securityEvents || []);
      }

      if (statsData.success) {
        setStats(statsData.stats);
      }
    } catch {
      // Offline or loading error fallback
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/reset-demo', { method: 'POST' });
      if (res.ok) {
        await loadData();
        showToast('Demo data and voucher statuses reset successfully!');
      }
    } finally {
      setIsResetting(false);
    }
  };

  const userRedemptions = currentUser
    ? redemptions.filter(r => r.user_id === currentUser.id)
    : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetDemo={handleResetDemo}
        isResetting={isResetting}
      />

      {/* Quick Global Metrics Bar */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-emerald-400" />
              <strong className="text-white font-mono">{stats?.activeCodes || 0}</strong> Active Codes
            </span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <strong className="text-white font-mono">{stats?.totalRedemptions || 0}</strong> Redeemed
            </span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span className="flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <strong className="text-white font-mono">{stats?.totalCreditsDistributed?.toLocaleString() || 0}</strong> Credits Distributed
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ad-Free · Atomic SQL Safety · Rate-Limit Protected</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'mobile' && (
          <MobileAppView
            users={users}
            currentUser={currentUser}
            onSelectUser={setCurrentUser}
            availableCodes={codes}
            userRedemptions={userRedemptions}
            onRedeemSuccess={loadData}
          />
        )}

        {activeTab === 'manager' && (
          <VoucherManager codes={codes} onRefresh={loadData} />
        )}

        {activeTab === 'security' && <SecurityInspector />}

        {activeTab === 'audit' && (
          <DatabaseAuditView
            codes={codes}
            redemptions={redemptions}
            users={users}
            securityEvents={securityEvents}
          />
        )}
      </main>

      {/* Subtle Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">RedeemPulse</span>
            <span>—</span>
            <span>Production-grade ad-free voucher architecture & server API</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Server-Authoritative</span>
            <span>·</span>
            <span>PostgreSQL & Node.js Compatible</span>
            <span>·</span>
            <span>Zero Third-Party Ad Bloat</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
