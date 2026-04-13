export type Family = {
  id: string;
  name: string;
  created_at: string;
};

export type User = {
  id: string;
  family_id: string;
  role: "admin" | "parent" | "child";
  name: string;
  pin: string | null;
  icon: string;
  display_order: number;
  created_at: string;
};

export type Task = {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  reward_amount: number;
  recurrence: "once" | "daily" | "weekly";
  assigned_child_id: string | null;
  is_active: boolean;
  created_by: string;
  proposal_status: "pending" | "approved" | "rejected";
  proposed_reward: number | null;
  proposal_message: string | null;
  price_change_comment: string | null;
  is_special: boolean;
  special_difficulty: number | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

export type TaskLog = {
  id: string;
  task_id: string;
  child_id: string;
  status: "pending" | "approved" | "rejected" | "settled";
  completed_at: string;
  approved_at: string | null;
  approved_by: string | null;
  settled_at: string | null;
  approval_stamp: string | null;
  approval_message: string | null;
  reject_reason: string | null;
  child_reaction_stamp: string | null;
  child_reaction_message: string | null;
  child_reaction_at: string | null;
  task?: Task;
  child?: User;
};

export type Wallet = {
  id: string;
  child_id: string;
  spending_balance: number;
  saving_balance: number;
  invest_balance: number;
  save_ratio: number;
  invest_ratio: number;
  split_ratio: number;
  updated_at: string;
};

export type Transaction = {
  id: string;
  wallet_id: string;
  type: "earn" | "spend" | "save" | "invest";
  amount: number;
  description: string | null;
  task_log_id: string | null;
  created_at: string;
};

export type SpendRequest = {
  id: string;
  child_id: string;
  wallet_id: string;
  amount: number;
  purpose: string;
  status: "pending" | "approved" | "rejected";
  reject_reason: string | null;
  payment_status: "pending_payment" | "paid" | null;
  payment_method: "paypay" | "b43" | "linepay" | "cash" | "other" | null;
  paid_at: string | null;
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
  child?: User;
};

export type FamilySettings = {
  id: string;
  family_id: string;
  special_quest_enabled: boolean;
  special_quest_star1_enabled: boolean;
  special_quest_star2_enabled: boolean;
  special_quest_star3_enabled: boolean;
  updated_at: string;
};

export type Badge = {
  id: string;
  child_id: string;
  badge_type: string;
  earned_at: string;
};

export type SavingGoal = {
  id: string;
  child_id: string;
  title: string;
  target_amount: number;
  is_achieved: boolean;
  created_at: string;
};

export type StockPrice = {
  id: string;
  symbol: string;
  name: string;
  name_ja: string | null;
  name_kana: string | null;
  category: "index" | "jp_stock" | "us_stock";
  icon: string;
  description_kids: string;
  price: number;
  price_jpy: number;
  change_percent: number;
  currency: "JPY" | "USD";
  is_preset: boolean;
  updated_at: string;
};

export type InvestOrder = {
  id: string;
  child_id: string;
  wallet_id: string;
  symbol: string;
  name: string;
  amount: number;
  order_type: "buy" | "sell";
  status: "pending" | "approved" | "rejected" | "executed";
  executed_price: number | null;
  executed_shares: number | null;
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
};

export type Session = {
  userId: string;
  familyId: string | null;
  role: "admin" | "parent" | "child";
  name: string;
  authId?: string;
};
