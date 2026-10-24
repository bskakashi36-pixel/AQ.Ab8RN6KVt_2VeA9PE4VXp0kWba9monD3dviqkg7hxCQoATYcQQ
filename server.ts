import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface PromoCode {
  code: string;
  reward_amount: number;
  reward_type?: 'diamonds' | 'credits' | 'loot_crate' | 'bundle' | 'emote';
  reward_item?: string;
  game?: string;
  max_uses: number;
  times_used: number;
  expires_at: string; // ISO string
  is_active: boolean;
  description: string;
  category: 'freefire' | 'welcome' | 'seasonal' | 'vip' | 'partnership' | 'test';
  created_at: string;
}

interface Redemption {
  id: string;
  user_id: string;
  user_name: string;
  code: string;
  reward_amount: number;
  reward_item?: string;
  redeemed_at: string;
  ip_address: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  balance: number;
  diamonds?: number;
  gameUid?: string;
  tier: string;
}

// In-Memory Database store with atomic safety
class RedeemDatabase {
  private promoCodes: Map<string, PromoCode> = new Map();
  private redemptions: Redemption[] = [];
  private users: Map<string, User> = new Map();
  private rateLimitMap: Map<string, { count: number; resetAt: number }> = new Map();
  private securityEvents: { id: string; timestamp: string; ip: string; type: string; details: string }[] = [];

  constructor() {
    this.seed();
  }

  seed() {
    this.promoCodes.clear();
    this.redemptions = [];
    this.users.clear();
    this.rateLimitMap.clear();
    this.securityEvents = [];

    // Seed Users with Free Fire Game UIDs & Vaults
    const initialUsers: User[] = [
      {
        id: 'usr_alex_01',
        name: 'Alex Rivera',
        email: 'alex.rivera@example.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        balance: 150,
        diamonds: 850,
        gameUid: 'FF_89210491',
        tier: 'Heroic Tier',
      },
      {
        id: 'usr_jordan_02',
        name: 'Jordan Lee',
        email: 'jordan.lee@example.com',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
        balance: 45,
        diamonds: 240,
        gameUid: 'FF_93817264',
        tier: 'Diamond Tier',
      },
      {
        id: 'usr_sarah_03',
        name: 'Sarah Chen',
        email: 'sarah.chen@example.com',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
        balance: 0,
        diamonds: 50,
        gameUid: 'FF_10293847',
        tier: 'Gold Tier',
      },
    ];

    initialUsers.forEach(u => this.users.set(u.id, u));

    // Seed Promo Codes
    const futureDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    const pastDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();

    const initialCodes: PromoCode[] = [
      // Authentic Free Fire Serial Voucher Codes
      {
        code: 'FFIC-DCTS-L5FT',
        reward_amount: 500,
        reward_type: 'diamonds',
        reward_item: '500 Diamonds 💎 + Victory Emote 🕺',
        game: 'Free Fire MAX',
        max_uses: 200,
        times_used: 12,
        expires_at: futureDate,
        is_active: true,
        description: 'Free Fire Champions Cup Special Reward',
        category: 'freefire',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        code: 'FF9M-2GF1-4CBQ',
        reward_amount: 350,
        reward_type: 'loot_crate',
        reward_item: 'Dragon AK Weapon Loot Crate 🔫 + 350 💎',
        game: 'Free Fire MAX',
        max_uses: 150,
        times_used: 44,
        expires_at: futureDate,
        is_active: true,
        description: 'Megalodon Alpha & Dragon AK Weapon Crate',
        category: 'freefire',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        code: 'FFBC-T7P7-N2P2',
        reward_amount: 250,
        reward_type: 'bundle',
        reward_item: 'Arctic Blue Bundle 👕 + 250 💎',
        game: 'Free Fire MAX',
        max_uses: 100,
        times_used: 6,
        expires_at: futureDate,
        is_active: true,
        description: 'Exclusive Arctic Blue Character Outfit Set',
        category: 'freefire',
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        code: 'FREE-FIRE-2026',
        reward_amount: 1000,
        reward_type: 'diamonds',
        reward_item: '1,000 Diamonds 💎 + Season Elite Pass 🎫',
        game: 'Free Fire MAX',
        max_uses: 50,
        times_used: 9,
        expires_at: futureDate,
        is_active: true,
        description: 'Grand Annual Free Fire Celebration Bundle',
        category: 'freefire',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        code: 'FF-EXPIRED-CODE',
        reward_amount: 100,
        reward_type: 'diamonds',
        reward_item: '100 Free Fire Diamonds (Expired)',
        game: 'Free Fire MAX',
        max_uses: 100,
        times_used: 18,
        expires_at: pastDate,
        is_active: true,
        description: 'Test code: Free Fire expired event voucher',
        category: 'freefire',
        created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        code: 'FF-MAXED-LIMIT',
        reward_amount: 500,
        reward_type: 'diamonds',
        reward_item: '500 Free Fire Diamonds (Exhausted)',
        game: 'Free Fire MAX',
        max_uses: 5,
        times_used: 5,
        expires_at: futureDate,
        is_active: true,
        description: 'Test code: Free Fire regional server quota reached',
        category: 'freefire',
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
      // Standard vouchers
      {
        code: 'BONUS50',
        reward_amount: 50,
        reward_type: 'credits',
        reward_item: '50 Platform Credits 🪙',
        max_uses: 100,
        times_used: 14,
        expires_at: futureDate,
        is_active: true,
        description: 'Starter 50 credits voucher for all members',
        category: 'welcome',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        code: 'GIFT2026',
        reward_amount: 250,
        reward_type: 'credits',
        reward_item: '250 Seasonal Reward Credits 🎁',
        max_uses: 50,
        times_used: 8,
        expires_at: futureDate,
        is_active: true,
        description: 'Celebration 2026 seasonal reward credits',
        category: 'seasonal',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        code: 'VIP1000',
        reward_amount: 1000,
        reward_type: 'credits',
        reward_item: '1,000 High-Roller VIP Credits 👑',
        max_uses: 10,
        times_used: 3,
        expires_at: futureDate,
        is_active: true,
        description: 'Exclusive 1,000 credit high-tier voucher',
        category: 'vip',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        code: 'X9K2-7LMQ-91VP',
        reward_amount: 500,
        reward_type: 'diamonds',
        reward_item: '500 Diamonds 💎 (Cryptographic Serial)',
        max_uses: 25,
        times_used: 0,
        expires_at: futureDate,
        is_active: true,
        description: 'High-entropy unpredictable cryptographic voucher',
        category: 'partnership',
        created_at: new Date().toISOString(),
      },
    ];

    initialCodes.forEach(c => this.promoCodes.set(c.code, c));

    // Seed prior redemptions for Alex
    this.redemptions.push({
      id: 'rdm_init_001',
      user_id: 'usr_alex_01',
      user_name: 'Alex Rivera',
      code: 'BONUS50',
      reward_amount: 50,
      redeemed_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      ip_address: '192.168.1.101',
    });
  }

  // Rate Limiting check: 5 attempts per 60 seconds per IP
  checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetInSec: number } {
    const now = Date.now();
    const WINDOW_MS = 60 * 1000;
    const MAX_REQUESTS = 5;

    const record = this.rateLimitMap.get(ip);
    if (!record || now > record.resetAt) {
      this.rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
      return { allowed: true, remaining: MAX_REQUESTS - 1, resetInSec: 60 };
    }

    if (record.count >= MAX_REQUESTS) {
      const resetInSec = Math.ceil((record.resetAt - now) / 1000);
      this.logSecurityEvent(ip, 'RATE_LIMIT_BLOCKED', `Exceeded ${MAX_REQUESTS} requests/min limit. Blocked.`);
      return { allowed: false, remaining: 0, resetInSec };
    }

    record.count += 1;
    return {
      allowed: true,
      remaining: MAX_REQUESTS - record.count,
      resetInSec: Math.ceil((record.resetAt - now) / 1000),
    };
  }

  clearRateLimit(ip: string) {
    this.rateLimitMap.delete(ip);
  }

  logSecurityEvent(ip: string, type: string, details: string) {
    this.securityEvents.unshift({
      id: 'sec_' + crypto.randomUUID().slice(0, 8),
      timestamp: new Date().toISOString(),
      ip,
      type,
      details,
    });
    if (this.securityEvents.length > 50) this.securityEvents.pop();
  }

  getSecurityEvents() {
    return this.securityEvents;
  }

  getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  getAllPromoCodes(): PromoCode[] {
    return Array.from(this.promoCodes.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  getPromoCode(code: string): PromoCode | undefined {
    return this.promoCodes.get(code.trim().toUpperCase());
  }

  savePromoCode(promo: PromoCode) {
    this.promoCodes.set(promo.code, promo);
  }

  deletePromoCode(code: string): boolean {
    return this.promoCodes.delete(code.trim().toUpperCase());
  }

  togglePromoStatus(code: string): PromoCode | null {
    const promo = this.promoCodes.get(code.trim().toUpperCase());
    if (!promo) return null;
    promo.is_active = !promo.is_active;
    return promo;
  }

  getRedemptions(userId?: string): Redemption[] {
    if (userId) {
      return this.redemptions
        .filter(r => r.user_id === userId)
        .sort((a, b) => new Date(b.redeemed_at).getTime() - new Date(a.redeemed_at).getTime());
    }
    return [...this.redemptions].sort(
      (a, b) => new Date(b.redeemed_at).getTime() - new Date(a.redeemed_at).getTime()
    );
  }

  // ATOMIC REDEMPTION TRANSACTION
  // Returns validation error or success with updated state
  atomicRedeem(userId: string, rawCode: string, ip: string): {
    status: number;
    success: boolean;
    message: string;
    codeData?: PromoCode;
    user?: User;
    reward?: number;
    redemption?: Redemption;
  } {
    const cleanCode = rawCode.trim().toUpperCase();

    // 0. Check User
    const user = this.users.get(userId);
    if (!user) {
      return { status: 400, success: false, message: 'User identifier not found.' };
    }

    // 1. Fetch Promo Code
    const promo = this.promoCodes.get(cleanCode);
    if (!promo || !promo.is_active) {
      this.logSecurityEvent(ip, 'INVALID_CODE_ATTEMPT', `User ${userId} attempted invalid/inactive code: ${cleanCode}`);
      return {
        status: 404,
        success: false,
        message: 'Invalid or deactivated voucher code. Please check spelling.',
      };
    }

    // 2. Check Expiration
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      this.logSecurityEvent(ip, 'EXPIRED_CODE_ATTEMPT', `User ${userId} attempted expired code: ${cleanCode}`);
      return {
        status: 400,
        success: false,
        message: 'This voucher code has expired.',
      };
    }

    // 3. Check Global Redemption Limit
    if (promo.times_used >= promo.max_uses) {
      this.logSecurityEvent(ip, 'MAX_LIMIT_REACHED', `User ${userId} attempted fully redeemed code: ${cleanCode}`);
      return {
        status: 400,
        success: false,
        message: 'Code redemption limit has already been reached.',
      };
    }

    // 4. Check If This User Already Redeemed It
    const alreadyClaimed = this.redemptions.some(
      r => r.user_id === userId && r.code === cleanCode
    );
    if (alreadyClaimed) {
      this.logSecurityEvent(ip, 'DUPLICATE_CLAIM_ATTEMPT', `User ${userId} tried re-claiming code: ${cleanCode}`);
      return {
        status: 400,
        success: false,
        message: 'You have already redeemed this voucher code.',
      };
    }

    // 5. ATOMIC COMMIT
    promo.times_used += 1;
    user.balance += promo.reward_amount;
    if (promo.reward_type === 'diamonds' || promo.category === 'freefire') {
      user.diamonds = (user.diamonds || 0) + promo.reward_amount;
    }

    const rewardItemLabel = promo.reward_item || `+${promo.reward_amount} Credits`;

    const newRedemption: Redemption = {
      id: 'rdm_' + crypto.randomUUID().slice(0, 8),
      user_id: user.id,
      user_name: user.name,
      code: cleanCode,
      reward_amount: promo.reward_amount,
      reward_item: rewardItemLabel,
      redeemed_at: new Date().toISOString(),
      ip_address: ip,
    };
    this.redemptions.unshift(newRedemption);

    this.logSecurityEvent(
      ip,
      'SUCCESSFUL_REDEMPTION',
      `User ${user.name} successfully redeemed ${cleanCode} (${rewardItemLabel})`
    );

    return {
      status: 200,
      success: true,
      message: `Success! Added ${rewardItemLabel} to ${user.name}'s Vault.`,
      reward: promo.reward_amount,
      user: { ...user },
      codeData: { ...promo },
      redemption: newRedemption,
    };
  }
}

const db = new RedeemDatabase();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Helper to extract client IP
  const getClientIp = (req: Request): string => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.socket.remoteAddress || '127.0.0.1';
  };

  // 1. GET ALL USERS (for account switcher)
  app.get('/api/users', (_req: Request, res: Response) => {
    res.json({ success: true, users: db.getAllUsers() });
  });

  // 2. GET USER PROFILE & BALANCE
  app.get('/api/users/:userId', (req: Request, res: Response) => {
    const user = db.getUser(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const redemptions = db.getRedemptions(user.id);
    res.json({ success: true, user, redemptions });
  });

  // 3. POST /api/redeem (The core secure endpoint matching blueprint Step 2)
  app.post('/api/redeem', (req: Request, res: Response) => {
    const ip = getClientIp(req);
    const { userId, code, bypassRateLimit } = req.body;

    // Rate Limiting Check (unless explicitly bypassed for demo unit test)
    if (!bypassRateLimit) {
      const rate = db.checkRateLimit(ip);
      res.setHeader('X-RateLimit-Limit', '5');
      res.setHeader('X-RateLimit-Remaining', rate.remaining.toString());
      res.setHeader('X-RateLimit-Reset', rate.resetInSec.toString());

      if (!rate.allowed) {
        return res.status(429).json({
          success: false,
          error_code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many redemption attempts from this IP. Please wait ${rate.resetInSec}s before retrying.`,
          retryAfter: rate.resetInSec,
        });
      }
    }

    if (!userId || !code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Missing voucher code or user identifier.',
      });
    }

    const result = db.atomicRedeem(userId, code, ip);
    return res.status(result.status).json(result);
  });

  // 4. RESET RATE LIMIT (For testing UI convenience)
  app.post('/api/rate-limit/reset', (req: Request, res: Response) => {
    const ip = getClientIp(req);
    db.clearRateLimit(ip);
    res.json({ success: true, message: 'Rate limit reset for current client IP.' });
  });

  // 5. GET ALL PROMO CODES
  app.get('/api/codes', (_req: Request, res: Response) => {
    const codes = db.getAllPromoCodes();
    res.json({ success: true, codes });
  });

  // 6. CREATE PROMO CODE
  app.post('/api/codes', (req: Request, res: Response) => {
    const { code, reward_amount, max_uses, expires_at, description, category } = req.body;
    if (!code || !reward_amount || !max_uses) {
      return res.status(400).json({ success: false, message: 'Missing required code parameters.' });
    }

    const cleanCode = String(code).trim().toUpperCase();
    if (db.getPromoCode(cleanCode)) {
      return res.status(409).json({ success: false, message: 'A voucher with this code already exists.' });
    }

    const newCode: PromoCode = {
      code: cleanCode,
      reward_amount: Number(reward_amount),
      max_uses: Number(max_uses),
      times_used: 0,
      expires_at: expires_at || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true,
      description: description || 'Custom voucher',
      category: category || 'partnership',
      created_at: new Date().toISOString(),
    };

    db.savePromoCode(newCode);
    res.status(201).json({ success: true, code: newCode });
  });

  // 7. GENERATE HIGH-ENTROPY COMPLEX CODES (Security Best Practice Step 4)
  app.post('/api/codes/generate', (req: Request, res: Response) => {
    const { count = 1, reward_amount = 100, max_uses = 10, daysValid = 30, description = 'Auto-generated secure code' } = req.body;
    const generated: PromoCode[] = [];

    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // exclude ambiguous 0, O, 1, I
    const genChunk = (len: number) => {
      let str = '';
      const bytes = crypto.randomBytes(len);
      for (let i = 0; i < len; i++) {
        str += chars[bytes[i] % chars.length];
      }
      return str;
    };

    const countToGen = Math.min(Math.max(1, Number(count)), 10);
    const expiresAt = new Date(Date.now() + Number(daysValid) * 24 * 60 * 60 * 1000).toISOString();

    for (let i = 0; i < countToGen; i++) {
      const codeStr = `${genChunk(4)}-${genChunk(4)}-${genChunk(4)}`;
      const newPromo: PromoCode = {
        code: codeStr,
        reward_amount: Number(reward_amount),
        max_uses: Number(max_uses),
        times_used: 0,
        expires_at: expiresAt,
        is_active: true,
        description,
        category: 'partnership',
        created_at: new Date().toISOString(),
      };
      db.savePromoCode(newPromo);
      generated.push(newPromo);
    }

    res.status(201).json({ success: true, generated });
  });

  // 8. TOGGLE CODE ACTIVE STATUS
  app.patch('/api/codes/:code/toggle', (req: Request, res: Response) => {
    const updated = db.togglePromoStatus(req.params.code);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Code not found' });
    }
    res.json({ success: true, code: updated });
  });

  // 9. DELETE CODE
  app.delete('/api/codes/:code', (req: Request, res: Response) => {
    const success = db.deletePromoCode(req.params.code);
    if (!success) {
      return res.status(404).json({ success: false, message: 'Code not found' });
    }
    res.json({ success: true, message: 'Code removed' });
  });

  // 10. GET AUDIT LOG & REDEMPTIONS
  app.get('/api/redemptions', (_req: Request, res: Response) => {
    const redemptions = db.getRedemptions();
    const securityEvents = db.getSecurityEvents();
    res.json({ success: true, redemptions, securityEvents });
  });

  // 11. STATS OVERVIEW
  app.get('/api/stats', (_req: Request, res: Response) => {
    const codes = db.getAllPromoCodes();
    const redemptions = db.getRedemptions();
    const activeCodes = codes.filter(c => c.is_active);
    const totalCreditsDistributed = redemptions.reduce((acc, r) => acc + r.reward_amount, 0);

    res.json({
      success: true,
      stats: {
        totalCodes: codes.length,
        activeCodes: activeCodes.length,
        totalRedemptions: redemptions.length,
        totalCreditsDistributed,
      },
    });
  });

  // 12. RESET DEMO DATA
  app.post('/api/reset-demo', (_req: Request, res: Response) => {
    db.seed();
    res.json({ success: true, message: 'Demo database reset to initial state.' });
  });

  // Mount Vite or static build
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
