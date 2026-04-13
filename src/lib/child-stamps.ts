/** 子ども返信用リアクションスタンプ */
export type ChildStamp = {
  id: string;
  emoji: string;
  label: string;
};

export const CHILD_STAMPS: ChildStamp[] = [
  { id: "thanks", emoji: "😊", label: "ありがとう！" },
  { id: "try_harder", emoji: "💪", label: "もっとがんばる！" },
  { id: "yay", emoji: "🎉", label: "やったー！" },
  { id: "next_time", emoji: "😅", label: "つぎはもっとがんばる…" },
  { id: "love", emoji: "❤️", label: "だいすき！" },
  { id: "roger", emoji: "🫡", label: "りょうかい！" },
];

export function getChildStampById(id: string): ChildStamp | undefined {
  return CHILD_STAMPS.find((s) => s.id === id);
}
