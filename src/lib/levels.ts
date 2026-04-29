/**
 * レベルアップシステム — 育成キャラクター
 *
 * 累計獲得額に基づくランク。
 * 人型キャラクターが装備を纏って成長していく。
 */

export type Level = {
  level: number;
  title: string;
  icon: string;
  minAmount: number;
  character: string;
  appearance: string;
  greeting: string;
  greetingActive: string;
  greetingLonely: string;
};

export const LEVELS: Level[] = [
  {
    level: 1, title: "[駆|か]け[出|だ]し[冒険者|ぼうけんしゃ]", icon: "🗡️", minAmount: 0,
    character: "👶",
    appearance: "[布|ぬの]の[服|ふく]",
    greeting: "[冒険|ぼうけん]、[始|はじ]めるよ！",
    greetingActive: "やったー！クエスト[楽|たの]しい！",
    greetingLonely: "いっしょに [冒険|ぼうけん] しようよ〜",
  },
  {
    level: 2, title: "[見習|みなら]い[騎士|きし]", icon: "🛡️", minAmount: 1000,
    character: "🧒",
    appearance: "[革|かわ]の[鎧|よろい]",
    greeting: "お[手伝|てつだ]い、まかせて！",
    greetingActive: "[今日|きょう]も [頑張|がんば]るぞ！",
    greetingLonely: "クエスト、ないのかな…？",
  },
  {
    level: 3, title: "クエストナイト", icon: "⚔️", minAmount: 3000,
    character: "🧑",
    appearance: "[鉄|てつ]の[鎧|よろい]",
    greeting: "[一人前|いちにんまえ]の [騎士|きし] だ！",
    greetingActive: "[次|つぎ]のクエストも クリアするぞ！",
    greetingLonely: "たまには クエストに [出|で]かけたいな…",
  },
  {
    level: 4, title: "シルバーマスター", icon: "🥈", minAmount: 5000,
    character: "🧝",
    appearance: "[銀|ぎん]の[鎧|よろい]＋マント",
    greeting: "みんなの [力|ちから]に なりたい！",
    greetingActive: "[銀|ぎん]の [力|ちから]が みなぎる！",
    greetingLonely: "マントが ほこりを かぶってきた…",
  },
  {
    level: 5, title: "ゴールドマスター", icon: "🥇", minAmount: 10000,
    character: "🦸",
    appearance: "[金|きん]の[鎧|よろい]＋[英雄|えいゆう]のマント",
    greeting: "[伝説|でんせつ]は ここから [始|はじ]まる！",
    greetingActive: "[金色|きんいろ]に [輝|かがや]いてるよ！",
    greetingLonely: "[英雄|えいゆう]も [休|やす]みは [必要|ひつよう]だけど…",
  },
  {
    level: 6, title: "プラチナヒーロー", icon: "💎", minAmount: 30000,
    character: "🧙",
    appearance: "[輝|かがや]く [鎧|よろい]＋[賢者|けんじゃ]の[杖|つえ]",
    greeting: "[王国|おうこく]の [平和|へいわ]は まかせろ！",
    greetingActive: "[杖|つえ]の [力|ちから]が あふれてる！",
    greetingLonely: "[杖|つえ]の [光|ひかり]が [弱|よわ]まってきた…",
  },
  {
    level: 7, title: "[伝説|でんせつ]の[勇者|ゆうしゃ]", icon: "👑", minAmount: 50000,
    character: "👑",
    appearance: "[王冠|おうかん]＋[聖剣|せいけん]",
    greeting: "[世界|せかい]を [救|すく]った [伝説|でんせつ]の [勇者|ゆうしゃ]！",
    greetingActive: "[伝説|でんせつ]は まだまだ [続|つづ]く！",
    greetingLonely: "[勇者|ゆうしゃ]も たまには さみしいんだ…",
  },
];

export function getCurrentLevel(totalEarned: number): Level {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (totalEarned >= level.minAmount) {
      current = level;
    } else {
      break;
    }
  }
  return current;
}

export function getLevelProgress(totalEarned: number) {
  const current = getCurrentLevel(totalEarned);
  const currentIndex = LEVELS.indexOf(current);
  const next =
    currentIndex < LEVELS.length - 1 ? LEVELS[currentIndex + 1] : null;

  if (!next) {
    return { current, next: null, progress: 100, remaining: 0 };
  }

  const range = next.minAmount - current.minAmount;
  const earned = totalEarned - current.minAmount;
  const progress = Math.min(Math.round((earned / range) * 100), 100);
  const remaining = next.minAmount - totalEarned;

  return { current, next, progress, remaining };
}
