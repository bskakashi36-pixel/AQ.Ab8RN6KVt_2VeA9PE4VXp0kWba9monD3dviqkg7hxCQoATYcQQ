export interface PromoCode {
  code: string;
  reward_amount: number;
  reward_type?: 'diamonds' | 'credits' | 'loot_crate' | 'bundle' | 'emote';
  reward_item?: string;
  game?: string;
  max_uses: number;
  times_used: number;
  expires_at: string;
  is_active: boolean;
  description: string;
  category: 'freefire' | 'welcome' | 'seasonal' | 'vip' | 'partnership' | 'test';
  created_at: string;
}

export interface Redemption {
  id: string;
  user_id: string;
  user_name: string;
  code: string;
  reward_amount: number;
  reward_item?: string;
  redeemed_at: string;
  ip_address: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  balance: number;
  diamonds?: number;
  gameUid?: string;
  tier: string;
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  ip: string;
  type: string;
  details: string;
}

export interface SystemStats {
  totalCodes: number;
  activeCodes: number;
  totalRedemptions: number;
  totalCreditsDistributed: number;
}

export interface InAppNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  rewardItem?: string;
  rewardAmount?: number;
  durationMs?: number;
  timestamp: string;
  actionLabel?: string;
}
