import React, { useState } from 'react';
import {
  Gift,
  CheckCircle2,
  AlertCircle,
  Copy,
  Clock,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Maximize2,
  Coins,
  History,
  ArrowRight,
  UserCheck,
  Check,
  Flame,
  Code2,
  Volume2,
  VolumeX,
  Bell,
  Diamond,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { User, PromoCode, Redemption, InAppNotification } from '../types';
import { InAppNotificationBanner } from './InAppNotificationBanner';
import { FlutterCodeModal } from './FlutterCodeModal';

interface MobileAppViewProps {
  users: User[];
  currentUser: User | null;
  onSelectUser: (user: User) => void;
  availableCodes: PromoCode[];
  userRedemptions: Redemption[];
  onRedeemSuccess: () => void;
}

export const MobileAppView: React.FC<MobileAppViewProps> = ({
  users,
  currentUser,
  onSelectUser,
  availableCodes,
  userRedemptions,
  onRedeemSuccess,
}) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    reward?: number;
    error_code?: string;
    retryAfter?: number;
  } | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'redeem' | 'history'>('redeem');
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // In-app Notification System State
  const [notification, setNotification] = useState<InAppNotification | null>(null);
  const [notificationPosition, setNotificationPosition] = useState<'bottom' | 'top'>('bottom');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showFlutterModal, setShowFlutterModal] = useState(false);

  // Synthesize soft audio chimes
  const playAudioFeedback = (type: 'success' | 'error') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, ctx.currentTime);
        osc.frequency.setValueAtTime(180, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {
      // Audio context silenced or blocked
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 85,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#34d399', '#38bdf8', '#f59e0b', '#a855f7'],
    });
  };

  const handleRedeem = async (codeToRedeem?: string) => {
    const targetCode = (codeToRedeem || code).trim().toUpperCase();
    if (!targetCode || !currentUser) return;

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          code: targetCode,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult({
          success: true,
          message: data.message,
          reward: data.reward,
        });
        setCode('');
        triggerConfetti();
        playAudioFeedback('success');

        // TRIGGER IN-APP SUCCESS SNACKBAR / TOAST
        setNotification({
          id: 'notif_' + Date.now(),
          type: 'success',
          title: 'Reward Claimed!',
          message: data.message,
          rewardItem: data.codeData?.reward_item || `+${data.reward} Free Fire Diamonds 💎`,
          rewardAmount: data.reward,
          durationMs: 5000,
          timestamp: new Date().toISOString(),
          actionLabel: 'View Vault',
        });

        onRedeemSuccess();
      } else {
        const errorMsg = data.message || 'Unable to redeem Free Fire code.';
        setResult({
          success: false,
          message: errorMsg,
          error_code: data.error_code,
          retryAfter: data.retryAfter,
        });
        playAudioFeedback('error');

        // Determine title based on error reason
        let errorTitle = 'Redemption Failed';
        let notifType: 'error' | 'warning' = 'error';

        if (errorMsg.toLowerCase().includes('already')) {
          errorTitle = 'Already Claimed';
          notifType = 'warning';
        } else if (errorMsg.toLowerCase().includes('expired')) {
          errorTitle = 'Event Code Expired';
        } else if (errorMsg.toLowerCase().includes('limit')) {
          errorTitle = 'Server Limit Reached';
        } else if (data.error_code === 'RATE_LIMIT_EXCEEDED') {
          errorTitle = 'Rate Limit Protection';
          notifType = 'warning';
        }

        // TRIGGER IN-APP ERROR SNACKBAR / TOAST
        setNotification({
          id: 'notif_' + Date.now(),
          type: notifType,
          title: errorTitle,
          message: errorMsg,
          durationMs: 5000,
          timestamp: new Date().toISOString(),
          actionLabel: 'Dismiss',
        });
      }
    } catch {
      setResult({
        success: false,
        message: 'Network connection error. Please try again.',
      });
      playAudioFeedback('error');

      setNotification({
        id: 'notif_' + Date.now(),
        type: 'error',
        title: 'Network Error',
        message: 'Could not connect to the Free Fire validation server.',
        durationMs: 4000,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setCode(text.trim().toUpperCase());
      }
    } catch {
      // Clipboard silent fallback
    }
  };

  const handleCopy = (sampleCode: string) => {
    navigator.clipboard.writeText(sampleCode);
    setCopiedCode(sampleCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Quick Notification Testers
  const testSuccessNotification = () => {
    playAudioFeedback('success');
    triggerConfetti();
    setNotification({
      id: 'test_success_' + Date.now(),
      type: 'success',
      title: 'Free Fire Reward Claimed!',
      message: `Success! Added 500 Diamonds 💎 + Victory Emote to ${currentUser?.name}'s Vault.`,
      rewardItem: '500 Diamonds 💎 + Victory Emote 🕺',
      durationMs: 4500,
      timestamp: new Date().toISOString(),
      actionLabel: 'View Vault',
    });
  };

  const testExpiredNotification = () => {
    playAudioFeedback('error');
    setNotification({
      id: 'test_expired_' + Date.now(),
      type: 'error',
      title: 'Event Code Expired',
      message: 'Redemption failed: This Free Fire promotional code has expired. Validity ended.',
      durationMs: 4500,
      timestamp: new Date().toISOString(),
      actionLabel: 'Dismiss',
    });
  };

  const testLimitReachedNotification = () => {
    playAudioFeedback('error');
    setNotification({
      id: 'test_limit_' + Date.now(),
      type: 'error',
      title: 'Redemption Quota Exceeded',
      message: 'Redemption failed: Maximum global server redemption quota reached for this region.',
      durationMs: 4500,
      timestamp: new Date().toISOString(),
      actionLabel: 'Dismiss',
    });
  };

  const testDuplicateNotification = () => {
    playAudioFeedback('error');
    setNotification({
      id: 'test_dup_' + Date.now(),
      type: 'warning',
      title: 'Already Claimed',
      message: `Your Free Fire UID (${currentUser?.gameUid || 'FF_89210491'}) has already redeemed this code.`,
      durationMs: 4500,
      timestamp: new Date().toISOString(),
      actionLabel: 'Dismiss',
    });
  };

  return (
    <div className="py-6 px-4 max-w-7xl mx-auto">
      {/* Top Controls Strip: Free Fire Branding, User Switcher, & Flutter Code Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center text-slate-950 font-black text-xs shadow-sm">
              FF
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Free Fire Redeem Vault & In-App SnackBars
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>In-App SnackBar / Toast System</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400">Instant Free Fire Diamonds & Crates</span>
            <span aria-hidden="true">·</span>
            <span>Zero Ad SDK Bloat</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Flutter Dart Code Trigger */}
          <button
            onClick={() => setShowFlutterModal(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer transition-all"
            title="Inspect Flutter Dart SnackBar Code"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Flutter Dart Code</span>
          </button>

          {/* Active User Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-400 px-2 font-medium">Player:</span>
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => {
                  onSelectUser(u);
                  setResult(null);
                  setNotification(null);
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentUser?.id === u.id
                    ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>{u.name.split(' ')[0]}</span>
                {currentUser?.id === u.id && <UserCheck className="w-3 h-3" />}
              </button>
            ))}
          </div>

          {/* Viewport Frame Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setIsPhoneFrame(true)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1 ${
                isPhoneFrame ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-300'
              }`}
              title="Smartphone Device Preview"
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">Phone Frame</span>
            </button>
            <button
              onClick={() => setIsPhoneFrame(false)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1 ${
                !isPhoneFrame ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-300'
              }`}
              title="Expanded Responsive Canvas"
            >
              <Maximize2 className="w-4 h-4" />
              <span className="hidden sm:inline">Expanded</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Mobile View on Left, In-App Notification Test Studio on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Mobile Phone Frame / Viewport */}
        <div
          className={`${
            isPhoneFrame
              ? 'lg:col-span-5 mx-auto w-full max-w-[420px]'
              : 'lg:col-span-7 w-full'
          } transition-all`}
        >
          <div className="relative rounded-[38px] bg-slate-900 border-4 border-slate-800 shadow-2xl overflow-hidden flex flex-col min-h-[640px]">
            {/* Phone Speaker & Camera Notch */}
            <div className="pt-3 pb-2 px-6 flex justify-between items-center bg-slate-900 border-b border-slate-800/80">
              <span className="text-[11px] font-mono font-medium text-slate-400">9:41</span>
              <div className="w-20 h-4 bg-slate-950 rounded-full mx-auto" />
              <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                <span className="text-[10px]">5G</span>
                <span>100%</span>
              </div>
            </div>

            {/* In-Phone Header */}
            <div className="p-4 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center text-slate-950 font-black text-xs shadow-md">
                  {currentUser?.name.charAt(0) || 'P'}
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5 leading-tight">
                    <span>{currentUser?.name}</span>
                    <span className="text-[10px] text-amber-400 font-mono">
                      [{currentUser?.gameUid || 'FF_89210491'}]
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">{currentUser?.tier}</div>
                </div>
              </div>

              {/* Verified Ad-Free & Audio Toggle */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                    soundEnabled
                      ? 'bg-slate-800 border-slate-700 text-amber-400'
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                  title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
                <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-[10px] font-semibold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Ad-Free</span>
                </div>
              </div>
            </div>

            {/* Mobile Content Area (Contains Floating SnackBar) */}
            <div className="p-5 space-y-4 bg-slate-950 flex-1 relative flex flex-col justify-between">
              {/* Floating In-App SnackBar / Toast Notification */}
              <InAppNotificationBanner
                notification={notification}
                onDismiss={() => setNotification(null)}
                onActionClick={() => {
                  setActiveSubTab('history');
                  setNotification(null);
                }}
                position={notificationPosition}
              />

              <div className="space-y-4">
                {/* Free Fire Vault Balance Card */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-4 shadow-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-400" />
                        <span>Free Fire Diamond Vault</span>
                      </span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-black text-white tracking-tight tabular-nums">
                          {currentUser?.diamonds?.toLocaleString() || currentUser?.balance.toLocaleString()}
                        </span>
                        <span className="text-xs font-bold text-cyan-400 flex items-center gap-0.5">
                          <Diamond className="w-3 h-3" />
                          <span>Diamonds</span>
                        </span>
                      </div>
                    </div>

                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
                      <Diamond className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono">Player ID: {currentUser?.gameUid || 'FF_89210491'}</span>
                    <span className="text-emerald-400 font-semibold">Active Vault</span>
                  </div>
                </div>

                {/* Sub-Navigation Switcher */}
                <div className="grid grid-cols-2 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-medium">
                  <button
                    onClick={() => setActiveSubTab('redeem')}
                    className={`py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeSubTab === 'redeem'
                        ? 'bg-slate-800 text-white font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>Redeem Code</span>
                  </button>
                  <button
                    onClick={() => setActiveSubTab('history')}
                    className={`py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeSubTab === 'history'
                        ? 'bg-slate-800 text-white font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Vault History ({userRedemptions.length})</span>
                  </button>
                </div>

                {/* TAB 1: REDEEM CODE FORM */}
                {activeSubTab === 'redeem' && (
                  <div className="space-y-3.5">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <label className="text-slate-300 font-medium">Free Fire Serial Voucher</label>
                        <button
                          onClick={handlePaste}
                          className="text-cyan-400 hover:text-cyan-300 text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Paste Code</span>
                        </button>
                      </div>

                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          <Flame className="w-4 h-4 text-amber-500" />
                        </div>
                        <input
                          type="text"
                          value={code}
                          onChange={e => setCode(e.target.value.toUpperCase())}
                          onKeyDown={e => e.key === 'Enter' && handleRedeem()}
                          placeholder="e.g. FFIC-DCTS-L5FT"
                          maxLength={19}
                          className="w-full pl-10 pr-10 py-3 bg-slate-900 border border-slate-700/80 rounded-xl text-white font-mono placeholder:text-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all uppercase tracking-wider"
                        />
                        {code && (
                          <button
                            onClick={() => setCode('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Primary Redeem Button */}
                    <button
                      onClick={() => handleRedeem()}
                      disabled={isLoading || !code.trim()}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-105 active:scale-[0.98] text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          <span>Verifying with Server...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-slate-950" />
                          <span>Redeem Free Fire Reward</span>
                        </>
                      )}
                    </button>

                    {/* Quick-Pick Free Fire Voucher Chips */}
                    <div className="pt-1">
                      <span className="text-[11px] font-medium text-slate-400 block mb-2">
                        Tap a Free Fire code to test SnackBars:
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {availableCodes.slice(0, 6).map(pc => {
                          const isExpired = new Date(pc.expires_at) < new Date();
                          const isMaxed = pc.times_used >= pc.max_uses;
                          const isAlreadyClaimed = userRedemptions.some(r => r.code === pc.code);

                          let badge = `+${pc.reward_amount} 💎`;
                          if (!pc.is_active) badge = 'Inactive';
                          else if (isExpired) badge = 'Expired';
                          else if (isMaxed) badge = 'Limit Reached';
                          else if (isAlreadyClaimed) badge = 'Claimed';

                          return (
                            <button
                              key={pc.code}
                              onClick={() => {
                                setCode(pc.code);
                                setResult(null);
                              }}
                              className={`p-2 rounded-xl border text-left transition-all cursor-pointer group ${
                                code === pc.code
                                  ? 'bg-slate-800 border-amber-500'
                                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-mono text-[11px] font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                                  {pc.code}
                                </span>
                                <span
                                  className={`text-[9px] font-semibold px-1 py-0.2 rounded shrink-0 ${
                                    !pc.is_active || isExpired || isMaxed
                                      ? 'bg-rose-500/10 text-rose-400'
                                      : isAlreadyClaimed
                                      ? 'bg-amber-500/10 text-amber-400'
                                      : 'bg-cyan-500/10 text-cyan-400'
                                  }`}
                                >
                                  {badge}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-1 truncate">
                                {pc.description}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: VAULT HISTORY */}
                {activeSubTab === 'history' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Redeemed Free Fire Rewards</span>
                      <span className="font-mono tabular-nums">{userRedemptions.length} claimed</span>
                    </div>

                    {userRedemptions.length === 0 ? (
                      <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800">
                        <Flame className="w-8 h-8 text-amber-500/40 mx-auto mb-2" />
                        <div className="text-xs font-semibold text-slate-300">
                          No Free Fire rewards claimed yet
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Try redeeming FFIC-DCTS-L5FT or FF9M-2GF1-4CBQ above!
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {userRedemptions.map(rdm => (
                          <div
                            key={rdm.id}
                            className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold">
                                💎
                              </div>
                              <div>
                                <div className="font-mono font-bold text-white">{rdm.code}</div>
                                <div className="text-[10px] text-slate-400">
                                  {rdm.reward_item || `+${rdm.reward_amount} Diamonds`}
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="font-mono font-bold text-emerald-400 text-xs">
                                Claimed
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {new Date(rdm.redeemed_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Phone Bar */}
              <div className="pt-2 border-t border-slate-900 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Zero Ads · Instant SnackBar Feedback · Real-Time Vault</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: In-App Notification Test Studio & Explanatory Bench */}
        <div className={isPhoneFrame ? 'lg:col-span-7 space-y-6' : 'lg:col-span-5 space-y-6'}>
          {/* Notification System Controls */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    In-App Notification & SnackBar Lab
                  </h2>
                  <p className="text-xs text-slate-400">
                    Test how success toasts and error snackbars render in real-time
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs">
                <button
                  onClick={() => setNotificationPosition('bottom')}
                  className={`px-2 py-1 rounded text-[11px] font-medium cursor-pointer transition-colors ${
                    notificationPosition === 'bottom'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Flutter Bottom SnackBar (Standard)"
                >
                  Bottom SnackBar
                </button>
                <button
                  onClick={() => setNotificationPosition('top')}
                  className={`px-2 py-1 rounded text-[11px] font-medium cursor-pointer transition-colors ${
                    notificationPosition === 'top'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Floating Top Toast"
                >
                  Top Toast
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              When a user submits a code, the app presents non-intrusive floating feedback. Trigger each edge-case scenario below to preview the in-app notification:
            </p>

            {/* Direct Trigger Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={testSuccessNotification}
                className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 hover:border-emerald-500/60 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 group-hover:text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Success Toast</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    +500 💎
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Confirms reward crediting with confetti and &quot;View Vault&quot; action.
                </p>
              </button>

              <button
                onClick={testExpiredNotification}
                className="p-3 rounded-xl bg-slate-950 border border-rose-500/30 hover:border-rose-500/60 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-400 group-hover:text-rose-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Expired SnackBar</span>
                  </span>
                  <span className="text-[10px] text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                    HTTP 400
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Alerts player that the promotional campaign period has concluded.
                </p>
              </button>

              <button
                onClick={testLimitReachedNotification}
                className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 hover:border-amber-500/60 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 group-hover:text-amber-300 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Limit Reached SnackBar</span>
                  </span>
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    Max Quota
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Informs player that the global redemption allocation is exhausted.
                </p>
              </button>

              <button
                onClick={testDuplicateNotification}
                className="p-3 rounded-xl bg-slate-950 border border-indigo-500/30 hover:border-indigo-500/60 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Already Claimed Toast</span>
                  </span>
                  <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                    Per-UID
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Prevents multiple redemptions on the same Free Fire player UID.
                </p>
              </button>
            </div>
          </div>

          {/* Free Fire Authentic Vouchers Bench */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Free Fire Promo Vouchers (Live Test Suite)</span>
              </h3>
              <span className="text-xs text-slate-400">Click to test instant redemption</span>
            </div>

            <div className="space-y-2">
              {availableCodes.map(c => {
                const isClaimedByCurrent = userRedemptions.some(r => r.code === c.code);
                const isExpired = new Date(c.expires_at) < new Date();
                const isMaxed = c.times_used >= c.max_uses;

                return (
                  <div
                    key={c.code}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-amber-400 tracking-wider">
                          {c.code}
                        </span>
                        <span className="text-slate-500">·</span>
                        <span className="text-cyan-300 font-medium">
                          {c.reward_item || `+${c.reward_amount} 💎`}
                        </span>
                        {isExpired && (
                          <span className="text-[10px] text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded font-semibold">
                            Expired
                          </span>
                        )}
                        {isMaxed && (
                          <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded font-semibold">
                            Quota Full ({c.times_used}/{c.max_uses})
                          </span>
                        )}
                        {isClaimedByCurrent && (
                          <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded font-semibold">
                            Claimed by {currentUser?.name.split(' ')[0]}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {c.description}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleCopy(c.code)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] cursor-pointer transition-colors"
                        title="Copy code to clipboard"
                      >
                        {copiedCode === c.code ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setCode(c.code);
                          setActiveSubTab('redeem');
                          handleRedeem(c.code);
                        }}
                        className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors flex items-center gap-1"
                      >
                        <span>Test Now</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Flutter Code Modal */}
      <FlutterCodeModal
        isOpen={showFlutterModal}
        onClose={() => setShowFlutterModal(false)}
      />
    </div>
  );
};
