export type Stamp = {
  id: string;
  emoji: string;
  label: string;
};

export const STAMPS: Stamp[] = [
  { id: "great", emoji: "🌟", label: "すごい！" },
  { id: "thankyou", emoji: "🙏", label: "ありがとう！" },
  { id: "ganbare", emoji: "💪", label: "がんばったね！" },
  { id: "perfect", emoji: "💯", label: "かんぺき！" },
  { id: "heart", emoji: "❤️", label: "だいすき！" },
  { id: "fire", emoji: "🔥", label: "もえてるね！" },
  { id: "crown", emoji: "👑", label: "さいこう！" },
  { id: "sparkle", emoji: "✨", label: "キラキラ！" },
];

export function getStampById(id: string): Stamp | undefined {
  return STAMPS.find((s) => s.id === id);
}
