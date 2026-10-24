import React, { useState } from 'react';
import {
  Database,
  Download,
  Search,
  Shield,
  Layers,
  Users,
  Clock,
  Coins,
  CheckCircle,
} from 'lucide-react';
import { PromoCode, Redemption, User, SecurityEvent } from '../types';

interface DatabaseAuditViewProps {
  codes: PromoCode[];
  redemptions: Redemption[];
  users: User[];
  securityEvents: SecurityEvent[];
}

export const DatabaseAuditView: React.FC<DatabaseAuditViewProps> = ({
  codes,
  redemptions,
  users,
  securityEvents,
}) => {
  const [activeTable, setActiveTable] = useState<'redemptions' | 'codes' | 'users' | 'security'>(
    'redemptions'
  );
  const [search, setSearch] = useState('');

  const exportJSON = () => {
    const data = {
      promo_codes: codes,
      redemptions: redemptions,
      users: users,
      security_events: securityEvents,
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `redeempulse_db_export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="py-6 px-4 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <span>Database Schema & Live Audit Trail</span>
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
            <span>Relational Schema</span>
            <span aria-hidden="true">·</span>
            <span>Zero Data Inconsistency</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400">Real-Time Event Stream</span>
          </div>
        </div>

        <button
          onClick={exportJSON}
          className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Database JSON</span>
        </button>
      </div>

      {/* Table Selector Tabs */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTable('redemptions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTable === 'redemptions'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>redemptions ({redemptions.length})</span>
          </button>
          <button
            onClick={() => setActiveTable('codes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTable === 'codes'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>promo_codes ({codes.length})</span>
          </button>
          <button
            onClick={() => setActiveTable('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTable === 'users'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>users ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveTable('security')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTable === 'security'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-rose-400" />
            <span>security_events ({securityEvents.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter current table..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Table 1: Redemptions */}
      {activeTable === 'redemptions' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Redemption ID</th>
                  <th className="py-3 px-4 font-semibold">User</th>
                  <th className="py-3 px-4 font-semibold">Voucher Code</th>
                  <th className="py-3 px-4 font-semibold">Amount</th>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {redemptions
                  .filter(
                    r =>
                      r.code.toLowerCase().includes(search.toLowerCase()) ||
                      r.user_name.toLowerCase().includes(search.toLowerCase()) ||
                      r.id.toLowerCase().includes(search.toLowerCase())
                  )
                  .map(r => (
                    <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-4 text-slate-400">{r.id}</td>
                      <td className="py-2.5 px-4 text-white font-sans">{r.user_name}</td>
                      <td className="py-2.5 px-4 text-emerald-400 font-bold">{r.code}</td>
                      <td className="py-2.5 px-4 text-slate-200 tabular-nums">+{r.reward_amount}</td>
                      <td className="py-2.5 px-4 text-slate-400 font-sans">
                        {new Date(r.redeemed_at).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">{r.ip_address}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Table 2: Promo Codes */}
      {activeTable === 'codes' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">code (VARCHAR UNIQUE)</th>
                  <th className="py-3 px-4 font-semibold">reward_amount (INT)</th>
                  <th className="py-3 px-4 font-semibold">times_used / max_uses</th>
                  <th className="py-3 px-4 font-semibold">expires_at (TIMESTAMP)</th>
                  <th className="py-3 px-4 font-semibold">is_active (BOOLEAN)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {codes
                  .filter(c => c.code.toLowerCase().includes(search.toLowerCase()))
                  .map(c => (
                    <tr key={c.code} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-4 text-emerald-400 font-bold">{c.code}</td>
                      <td className="py-2.5 px-4 text-slate-200 tabular-nums">{c.reward_amount}</td>
                      <td className="py-2.5 px-4 text-slate-300 tabular-nums">
                        {c.times_used} / {c.max_uses}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400 font-sans">
                        {new Date(c.expires_at).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.is_active
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {c.is_active ? 'TRUE' : 'FALSE'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Table 3: Users */}
      {activeTable === 'users' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">id (VARCHAR)</th>
                  <th className="py-3 px-4 font-semibold">name</th>
                  <th className="py-3 px-4 font-semibold">email</th>
                  <th className="py-3 px-4 font-semibold">balance (INT)</th>
                  <th className="py-3 px-4 font-semibold">tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-[11px]">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors font-mono">
                    <td className="py-2.5 px-4 text-slate-400">{u.id}</td>
                    <td className="py-2.5 px-4 text-white font-sans font-medium">{u.name}</td>
                    <td className="py-2.5 px-4 text-slate-400">{u.email}</td>
                    <td className="py-2.5 px-4 text-emerald-400 font-bold tabular-nums">
                      {u.balance.toLocaleString()} credits
                    </td>
                    <td className="py-2.5 px-4 text-slate-300 font-sans">{u.tier}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Table 4: Security Events */}
      {activeTable === 'security' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Event ID</th>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">IP</th>
                  <th className="py-3 px-4 font-semibold">Security Type</th>
                  <th className="py-3 px-4 font-semibold">Diagnostic Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {securityEvents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      No security incidents logged yet.
                    </td>
                  </tr>
                ) : (
                  securityEvents.map(evt => (
                    <tr key={evt.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-4 text-slate-500">{evt.id}</td>
                      <td className="py-2.5 px-4 text-slate-400">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400">{evt.ip}</td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            evt.type.includes('BLOCKED') || evt.type.includes('DUPLICATE')
                              ? 'bg-rose-500/10 text-rose-400'
                              : evt.type.includes('SUCCESS')
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {evt.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-300 font-sans">{evt.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
