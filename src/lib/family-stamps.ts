/** ファミリースタンプリレー用スタンプ（親⇔子・兄弟間共通） */
export type FamilyStamp = {
  id: string;
  emoji: string;
  label: string;
};

export const FAMILY_STAMPS: FamilyStamp[] = [
  { id: "cheer", emoji: "📣", label: "がんばれ！" },
  { id: "thanks", emoji: "🙏", label: "ありがとう！" },
  { id: "great", emoji: "🌟", label: "すごいね！" },
  { id: "love", emoji: "❤️", label: "だいすき！" },
  { id: "muscle", emoji: "💪", label: "ファイト！" },
  { id: "highfive", emoji: "🙌", label: "やったね！" },
  { id: "hug", emoji: "🤗", label: "ぎゅっ！" },
  { id: "salute", emoji: "🫡", label: "りょうかい！" },
];

export function getFamilyStampById(id: string): FamilyStamp | undefined {
  return FAMILY_STAMPS.find((s) => s.id === id);
}
