import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Terminal,
  RotateCcw,
  Clock,
  KeyRound,
  FileCode,
  Layers,
} from 'lucide-react';

export const SecurityInspector: React.FC = () => {
  const [isSimulatingBot, setIsSimulatingBot] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState<
    { attempt: number; code: string; status: number; message: string; timestamp: string }[]
  >([]);
  const [isResettingLimit, setIsResettingLimit] = useState(false);

  const runBotSimulation = async () => {
    setIsSimulatingBot(true);
    setSimulationLogs([]);

    const guessCodes = [
      'GUESS01',
      'RANDOM99',
      'TESTER12',
      'DISCOUNT20',
      'FREEMONEY',
      'BOT_STRIKE_6',
      'BOT_STRIKE_7',
    ];

    const logs: typeof simulationLogs = [];

    for (let i = 0; i < guessCodes.length; i++) {
      const code = guessCodes[i];
      try {
        const res = await fetch('/api/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'usr_alex_01',
            code,
            bypassRateLimit: false, // strictly test rate limiter
          }),
        });

        const data = await res.json();
        logs.push({
          attempt: i + 1,
          code,
          status: res.status,
          message:
            res.status === 429
              ? `BLOCKED (429 Rate Limit Exceeded: Retry in ${data.retryAfter || 60}s)`
              : data.message || `HTTP ${res.status}`,
          timestamp: new Date().toLocaleTimeString(),
        });
        setSimulationLogs([...logs]);
      } catch {
        logs.push({
          attempt: i + 1,
          code,
          status: 500,
          message: 'Connection failed',
          timestamp: new Date().toLocaleTimeString(),
        });
        setSimulationLogs([...logs]);
      }

      // Small 150ms delay to show fast bot attack
      await new Promise(r => setTimeout(r, 150));
    }

    setIsSimulatingBot(false);
  };

  const handleResetRateLimit = async () => {
    setIsResettingLimit(true);
    try {
      await fetch('/api/rate-limit/reset', { method: 'POST' });
      setSimulationLogs([]);
    } finally {
      setIsResettingLimit(false);
    }
  };

  return (
    <div className="py-6 px-4 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white tracking-tight">
          Security & Anti-Exploit Architecture
        </h1>
        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
          <span>Rate-Limiting Defense</span>
          <span aria-hidden="true">·</span>
          <span>Entropy & Cryptography</span>
          <span aria-hidden="true">·</span>
          <span className="text-emerald-400">Atomic Database Transactions</span>
        </div>
      </div>

      {/* Grid: Rate Limiter Tester & Format Complexity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Rate Limit Test Lab */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Rate-Limit Brute Force Defense</h2>
                  <p className="text-xs text-slate-400">Configured: Max 5 attempts / 60 seconds per IP</p>
                </div>
              </div>

              <button
                onClick={handleResetRateLimit}
                disabled={isResettingLimit}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                title="Reset cooldown window"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Cooldown</span>
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Without rate limiting, malicious scripts run dictionary generators to guess valid promo codes at thousands of requests per minute. Test the live protection below:
            </p>

            <div className="flex gap-3 pt-1">
              <button
                onClick={runBotSimulation}
                disabled={isSimulatingBot}
                className="py-2.5 px-4 bg-rose-500 hover:bg-rose-400 active:scale-[0.98] text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-rose-500/10 disabled:opacity-50"
              >
                <Zap className={`w-3.5 h-3.5 ${isSimulatingBot ? 'animate-bounce' : ''}`} />
                <span>{isSimulatingBot ? 'Firing Bot Attack...' : 'Simulate Bot Attack (7 Rapid Guesses)'}</span>
              </button>
            </div>

            {/* Live Attack Terminal */}
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pb-2 border-b border-slate-800">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Real-Time Request Monitor</span>
                </span>
                <span>{simulationLogs.length} Events</span>
              </div>

              {simulationLogs.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 font-mono">
                  Press &quot;Simulate Bot Attack&quot; to test the sliding window firewall.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 font-mono text-xs">
                  {simulationLogs.map(log => (
                    <div
                      key={log.attempt}
                      className={`p-2 rounded-lg flex items-center justify-between gap-2 text-[11px] ${
                        log.status === 429
                          ? 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
                          : log.status === 200
                          ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-900/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-slate-500">#{log.attempt}</span>
                        <span className="font-bold">{log.code}</span>
                        <span className="text-slate-400">→</span>
                        <span className="truncate">{log.message}</span>
                      </div>
                      <span className="shrink-0 text-[10px] opacity-70">{log.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Ad-Free Privacy Audit Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Ad-Free & Privacy Verification</h3>
                <p className="text-xs text-slate-400">Zero third-party monetization or tracker bloat</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  ✓
                </div>
                <div>
                  <div className="font-semibold text-white">0 Ad SDKs</div>
                  <div className="text-[11px] text-slate-400">No AdMob, Unity, or AppLovin</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  ✓
                </div>
                <div>
                  <div className="font-semibold text-white">0 User Trackers</div>
                  <div className="text-[11px] text-slate-400">No invasive behavioral profiling</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  ✓
                </div>
                <div>
                  <div className="font-semibold text-white">Fast Mobile Render</div>
                  <div className="text-[11px] text-slate-400">No heavy banner DOM re-layouts</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  ✓
                </div>
                <div>
                  <div className="font-semibold text-white">Zero Battery Drain</div>
                  <div className="text-[11px] text-slate-400">No background video ad caching</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Code Entropy & Server Architecture */}
        <div className="lg:col-span-6 space-y-6">
          {/* Format Complexity & Entropy */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Format Complexity & Code Entropy</h3>
                <p className="text-xs text-slate-400">Mathematical difference between vulnerable & secure codes</p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {/* Weak code pattern */}
              <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-rose-300">Vulnerable: CODE1, BONUS50</span>
                  <span className="text-[10px] text-rose-400 font-semibold uppercase">Trivial to Guess</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Short or sequential patterns have low entropy (&lt;10,000 possibilities). Attackers can discover active codes within minutes using basic wordlists.
                </p>
              </div>

              {/* Secure code pattern */}
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-emerald-300">Secure: X9K2-7LMQ-91VP</span>
                  <span className="text-[10px] text-emerald-400 font-semibold uppercase">1.15 × 10¹⁸ Combinations</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Using 12 alphanumeric characters excluding ambiguous glyphs (<code className="text-white font-mono">0, O, 1, I</code>) yields 32¹² combinations. At 5 guesses/minute, guessing 1 code would take billions of years.
                </p>
              </div>
            </div>
          </div>

          {/* Database Atomic Transaction Walkthrough */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <FileCode className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Atomic Transaction Logic (Node & SQL)</h3>
                <p className="text-xs text-slate-400">Preventing race conditions when multiple users redeem concurrently</p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5 font-mono text-[11px] text-slate-300 space-y-2 overflow-x-auto">
              <div className="text-slate-500">// 1. ATOMIC TRANSACTION: Increment usage and credit user</div>
              <div>
                <span className="text-amber-400">await</span> db.query(<span className="text-emerald-300">&apos;BEGIN&apos;</span>);
              </div>
              <div>
                <span className="text-amber-400">await</span> db.query(
                <span className="text-emerald-300">&apos;UPDATE promo_codes SET times_used = times_used + 1 WHERE code = $1&apos;</span>,
                [cleanCode]
                );
              </div>
              <div>
                <span className="text-amber-400">await</span> db.query(
                <span className="text-emerald-300">&apos;INSERT INTO redemptions (user_id, code, redeemed_at) VALUES ($1, $2, NOW())&apos;</span>,
                [userId, cleanCode]
                );
              </div>
              <div>
                <span className="text-amber-400">await</span> db.query(
                <span className="text-emerald-300">&apos;UPDATE users SET balance = balance + $1 WHERE id = $2&apos;</span>,
                [promoData.reward_amount, userId]
                );
              </div>
              <div>
                <span className="text-amber-400">await</span> db.query(<span className="text-emerald-300">&apos;COMMIT&apos;</span>);
              </div>
            </div>

            <div className="text-xs text-slate-400 leading-relaxed">
              If an error occurs or connection drops mid-flight, a <code className="text-white font-mono">ROLLBACK</code> is triggered. The code usage and balance increment are strictly guaranteed never to become desynchronized.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
