
// This file can be used for application-wide constants.
export {};

// --- Loyalty Reward Tiers (every 50 points) ---
export type RewardOption = { name: string; description?: string };
export type RewardTier = {
  points: number;
  name: string;              // default display name
  description: string;
  options?: RewardOption[];  // user can choose one option
  estValueUSD?: number;      // perceived value (for reference)
};

export const REWARD_TIERS: RewardTier[] = [
  { points: 50,  name: "Espresso Shot", description: "Free 2oz espresso shot", options: [
    { name: "2oz Espresso" }, { name: "Sticker" }
  ]},
  { points: 100, name: "Brewed Coffee", description: "Free brewed coffee", options: [
    { name: "Brewed Coffee" }, { name: "2 Stickers" }
  ]},
  { points: 150, name: "Bakery Bite", description: "Free pastry or bagel", options: [
    { name: "Pastry" }, { name: "Bagel" }
  ]},
  { points: 200, name: "Latte/Specialty", description: "Free latte or specialty drink", options: [
    { name: "Latte" }, { name: "Specialty Drink" }
  ]},
  { points: 250, name: "2.5oz Sampler", description: "Free 2.5oz coffee sampler bag" },
  { points: 300, name: "Coffee + Bagel", description: "Free brewed coffee + bagel combo", options: [
    { name: "Coffee+Bagel" }, { name: "Free Mug" }
  ]},
  { points: 350, name: "Double Shot Bonus", description: "Free double-shot add-on" },
  { points: 400, name: "Drink + Pastry Combo", description: "Free specialty drink + pastry combo" },
  { points: 450, name: "12oz Beans", description: "Free 12oz bag of beans" },
  { points: 500, name: "Bigfoot Bundle", description: "Latte + pastry + sticker pack" },
  { points: 550, name: "Sticker Pack", description: "Sticker pack (2-3 designs)" },
  { points: 600, name: "C&O Mug", description: "Free C&O mug" },
  { points: 650, name: "Upgrade Week", description: "Free size upgrades for a week" },
  { points: 700, name: "Merch Discount", description: "Get $10 off any merch" },
  { points: 750, name: "Beans & Brew", description: "12oz beans + brewed coffee" },
  { points: 800, name: "Ultimate: Free Latte", description: "Special 800-point reward: free latte", options: [
    { name: "Free Latte (Ultimate)" }
  ]},
];

// --- Levels (lifetime points) ---
export type Level = {
  name: string;
  minPoints: number;
  perks: string[];
};

export const LEVELS: Level[] = [
  { name: "Beanling", minPoints: 0, perks: ["Welcome bonus +10 pts"] },
  { name: "Daily Drip", minPoints: 200, perks: ["1 Double-Points Day / month"] },
  { name: "Latte Legend", minPoints: 500, perks: ["Birthday month free drink", "+5 bonus pts every 5th visit"] },
  { name: "Espresso Elite", minPoints: 1000, perks: ["Early access to seasonal drinks", "Random +20 pts drops"] },
  { name: "Bigfoot Boss", minPoints: 2000, perks: ["Free size upgrades", "VIP events & merch perks"] },
];
