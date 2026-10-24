import React, { useState } from 'react';
import {
  Plus,
  Wand2,
  Trash2,
  Power,
  Copy,
  Check,
  Calendar,
  Layers,
  Search,
} from 'lucide-react';
import { PromoCode } from '../types';

interface VoucherManagerProps {
  codes: PromoCode[];
  onRefresh: () => void;
}

export const VoucherManager: React.FC<VoucherManagerProps> = ({ codes, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Generator form state
  const [genCount, setGenCount] = useState(1);
  const [genReward, setGenReward] = useState(100);
  const [genMaxUses, setGenMaxUses] = useState(20);
  const [genDaysValid, setGenDaysValid] = useState(30);

  // Custom code modal state
  const [customCode, setCustomCode] = useState('');
  const [customReward, setCustomReward] = useState(100);
  const [customMaxUses, setCustomMaxUses] = useState(50);
  const [customDescription, setCustomDescription] = useState('');
  const [customCategory, setCustomCategory] = useState<PromoCode['category']>('partnership');
  const [customError, setCustomError] = useState('');

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleActive = async (code: string) => {
    try {
      const res = await fetch(`/api/codes/${code}/toggle`, { method: 'PATCH' });
      if (res.ok) onRefresh();
    } catch {
      // Network error handling
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`Are you sure you want to delete promo code "${code}"?`)) return;
    try {
      const res = await fetch(`/api/codes/${code}`, { method: 'DELETE' });
      if (res.ok) onRefresh();
    } catch {
      // Network error handling
    }
  };

  const handleGenerateCodes = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/codes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: genCount,
          reward_amount: genReward,
          max_uses: genMaxUses,
          daysValid: genDaysValid,
          description: `Cryptographic Batch: ${genReward} pts`,
        }),
      });
      if (res.ok) {
        onRefresh();
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCode.trim()) {
      setCustomError('Code is required.');
      return;
    }

    setIsCreatingCustom(true);
    setCustomError('');

    try {
      const res = await fetch('/api/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: customCode.trim().toUpperCase(),
          reward_amount: customReward,
          max_uses: customMaxUses,
          description: customDescription || 'Custom campaign code',
          category: customCategory,
          expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowCreateModal(false);
        setCustomCode('');
        setCustomDescription('');
        onRefresh();
      } else {
        setCustomError(data.message || 'Failed to create code.');
      }
    } catch {
      setCustomError('Network error creating code.');
    } finally {
      setIsCreatingCustom(false);
    }
  };

  const filteredCodes = codes.filter(c => {
    const matchesSearch =
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'all' || c.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="py-6 px-4 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Voucher & Promo Code Manager
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
            <span>{codes.length} Registered Codes</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400">
              {codes.filter(c => c.is_active).length} Active Campaigns
            </span>
            <span aria-hidden="true">·</span>
            <span>Cryptographic Security Formats</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Code</span>
          </button>
        </div>
      </div>

      {/* High-Entropy Generator Banner (Security Step 4) */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Cryptographic Code Generator (8–12 Char Entropy)
              </h2>
              <p className="text-xs text-slate-400">
                Generates unpredictable codes formatted like <code className="text-emerald-400 font-mono">X9K2-7LMQ-91VP</code> to eliminate sequential guessing.
              </p>
            </div>
          </div>
        </div>

        {/* Generator Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Batch Count</label>
            <select
              value={genCount}
              onChange={e => setGenCount(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value={1}>1 Code</option>
              <option value={3}>3 Codes</option>
              <option value={5}>5 Codes</option>
              <option value={10}>10 Codes</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Reward Credits</label>
            <select
              value={genReward}
              onChange={e => setGenReward(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value={50}>50 Credits</option>
              <option value={100}>100 Credits</option>
              <option value={250}>250 Credits</option>
              <option value={500}>500 Credits</option>
              <option value={1000}>1,000 Credits</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Max Redemptions</label>
            <select
              value={genMaxUses}
              onChange={e => setGenMaxUses(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value={5}>5 Uses (Exclusive)</option>
              <option value={20}>20 Uses</option>
              <option value={50}>50 Uses</option>
              <option value={200}>200 Uses</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Validity Period</label>
            <select
              value={genDaysValid}
              onChange={e => setGenDaysValid(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value={7}>7 Days</option>
              <option value={30}>30 Days</option>
              <option value={90}>90 Days</option>
              <option value={365}>1 Year</option>
            </select>
          </div>

          <div className="col-span-2 sm:col-span-4 lg:col-span-1 flex items-end">
            <button
              onClick={handleGenerateCodes}
              disabled={isGenerating}
              className="w-full py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Wand2 className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Generating...' : 'Generate Batch'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search code or description..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto w-full sm:w-auto">
          {['all', 'freefire', 'welcome', 'seasonal', 'vip', 'partnership', 'test'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 text-xs font-medium rounded-lg capitalize whitespace-nowrap cursor-pointer transition-colors ${
                filterCategory === cat
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table of Promo Codes */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Promo Code</th>
                <th className="py-3.5 px-4 font-semibold">Reward</th>
                <th className="py-3.5 px-4 font-semibold">Usage & Quota</th>
                <th className="py-3.5 px-4 font-semibold">Expiration</th>
                <th className="py-3.5 px-4 font-semibold">Category</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCodes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No promo codes match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCodes.map(c => {
                  const isExpired = new Date(c.expires_at) < new Date();
                  const isMaxed = c.times_used >= c.max_uses;
                  const usagePercent = Math.min(100, Math.round((c.times_used / c.max_uses) * 100));

                  return (
                    <tr key={c.code} className="hover:bg-slate-800/30 transition-colors">
                      {/* Code */}
                      <td className="py-3 px-4 font-mono font-bold text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400">{c.code}</span>
                          <button
                            onClick={() => handleCopy(c.code)}
                            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Copy code"
                          >
                            {copiedCode === c.code ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans font-normal truncate max-w-[200px]">
                          {c.description}
                        </div>
                      </td>

                      {/* Reward */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-200 tabular-nums">
                        +{c.reward_amount}
                      </td>

                      {/* Usage */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isMaxed ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                          <span className="font-mono text-slate-300 tabular-nums text-[11px]">
                            {c.times_used} / {c.max_uses}
                          </span>
                        </div>
                      </td>

                      {/* Expiration */}
                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span className={isExpired ? 'text-rose-400 font-medium' : ''}>
                            {new Date(c.expires_at).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        {isExpired && (
                          <span className="text-[10px] text-rose-400 block">Expired</span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 capitalize text-slate-400 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3 h-3 text-slate-500" />
                          <span>{c.category}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                            !c.is_active
                              ? 'text-slate-500'
                              : isExpired
                              ? 'text-rose-400'
                              : isMaxed
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              !c.is_active
                                ? 'bg-slate-600'
                                : isExpired
                                ? 'bg-rose-500'
                                : isMaxed
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                          {!c.is_active
                            ? 'Disabled'
                            : isExpired
                            ? 'Expired'
                            : isMaxed
                            ? 'Exhausted'
                            : 'Active'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleActive(c.code)}
                            title={c.is_active ? 'Deactivate code' : 'Activate code'}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              c.is_active
                                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.code)}
                            title="Delete promo code"
                            className="p-1.5 rounded-lg border border-slate-800 hover:border-rose-500/50 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CREATE CUSTOM PROMO CODE */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Create Custom Promo Code</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustom} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Code Identifier</label>
                <input
                  type="text"
                  value={customCode}
                  onChange={e => setCustomCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SUMMER2026"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Reward Credits</label>
                  <input
                    type="number"
                    min="1"
                    value={customReward}
                    onChange={e => setCustomReward(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Max Uses</label>
                  <input
                    type="number"
                    min="1"
                    value={customMaxUses}
                    onChange={e => setCustomMaxUses(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Category</label>
                <select
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value as PromoCode['category'])}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="freefire">Free Fire</option>
                  <option value="welcome">Welcome</option>
                  <option value="seasonal">Seasonal</option>
                  <option value="vip">VIP</option>
                  <option value="partnership">Partnership</option>
                  <option value="test">Test</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Description</label>
                <input
                  type="text"
                  value={customDescription}
                  onChange={e => setCustomDescription(e.target.value)}
                  placeholder="e.g. 100 bonus credits for campaign"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {customError && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {customError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCustom}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isCreatingCustom ? 'Saving...' : 'Create Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
