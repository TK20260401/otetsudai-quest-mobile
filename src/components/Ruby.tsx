import React from "react";
import { View, Text, StyleSheet, type TextStyle } from "react-native";
import { useTheme } from "../theme";
import { useAccessibility } from "../accessibility";

/**
 * ルビ表示の状態は `AccessibilityContext` に統合されている。
 * このフックは後方互換のための薄いファサード。
 */
export function useRuby() {
  const { rubyVisible, setRubyVisible } = useAccessibility();
  return { rubyVisible, setRubyVisible };
}

/**
 * 後方互換の空ラッパー。新規コードは `AccessibilityProvider` を直接使うこと。
 * 古い App.tsx が `<RubyProvider>` を使い続けていても壊れないように残す。
 */
export function RubyProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/** @deprecated AccessibilityContext に移行済み。呼び出し不要。 */
export async function loadSavedRubyVisible(): Promise<boolean> {
  return true;
}

type Props = {
  kanji: string;
  ruby: string;
  style?: any;
  rubySize?: number;
};

/**
 * ルビ付きテキストのレイアウト方針:
 *
 * - ルビ文字は漢字の真上に近接配置（密着しすぎず離れすぎず）
 * - 呼び出し元のstyleにlineHeightがあっても、ルビ内部では
 *   fontSize * 1.1 に強制してルビ-漢字間の隙間を統一
 * - ルビ無しセグメントにはpaddingTopでルビ領域分の高さを確保
 * - 全セグメントのベースラインを揃える
 */

/**
 * styleからlineHeightを除去し、fontSizeに scale を掛け直す。
 * fontScale（アクセシビリティ）が大きいほど漢字サイズも比例拡大。
 * color が呼び出し元で未指定の場合は defaultColor（palette.textStrong 相当）を
 * フォールバックで入れる。ダーク移行時に呼び出し元の color 漏れで背景に沈む
 * 事故を予防するための防御。
 */
function tightStyle(style: any, defaultColor: string, scale: number): TextStyle {
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  if (!flat) return { color: defaultColor, includeFontPadding: false } as TextStyle;
  const { lineHeight: _lh, color: c, fontSize: fs, ...rest } = flat;
  return {
    ...rest,
    color: c ?? defaultColor,
    includeFontPadding: false,
    ...(typeof fs === "number" ? { fontSize: fs * scale } : {}),
  } as TextStyle;
}

/** ルビと漢字の間隔 — 全サイズ統一（iOS検証済み） */
function rubyGap(_rubySize: number): number {
  return -2;
}

/** ルビテキストのスタイル — palette.rubyColor を使いダーク/ライト両対応
 *  marginBottom: -2 で漢字に密着（iOS検証済み。lineHeight/translateYは効かない） */
function rubyStyle(size: number, color: string): TextStyle {
  return {
    fontSize: size,
    color,
    textAlign: "center",
    marginBottom: -1,
    includeFontPadding: false,
  } as TextStyle;
}

/** 単体ルビコンポーネント（既存API互換） */
export default function Ruby({ kanji, ruby, style, rubySize = 8 }: Props) {
  const { palette } = useTheme();
  const { rubyVisible, fontScaleValue } = useAccessibility();
  const baseColor = palette.textStrong;
  const rubyColor = palette.rubyColor;
  const scaledRuby = rubySize * fontScaleValue;
  const gap = rubyGap(scaledRuby);
  return (
    <View style={layoutStyles.center}>
      {rubyVisible ? (
        <Text
          style={rubyStyle(scaledRuby, rubyColor)}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          allowFontScaling
          maxFontSizeMultiplier={1.3}
        >
          {ruby}
        </Text>
      ) : (
        <Text style={[rubyStyle(scaledRuby, rubyColor), { opacity: 0 }]} numberOfLines={1}>.</Text>
      )}
      <Text
        style={[tightStyle(style, baseColor, fontScaleValue), { marginTop: gap }]}
        allowFontScaling
        maxFontSizeMultiplier={1.3}
      >
        {kanji}
      </Text>
    </View>
  );
}

/**
 * テキスト中にルビ付き漢字を含む文を構築するヘルパー
 * 使用例: <RubyText style={...} parts={[["親", "おや"], "からの", ["報酬", "ほうしゅう"]]} />
 */
export function RubyText({
  parts,
  style,
  rubySize = 8,
  noWrap = false,
  rubyColor,
}: {
  parts: (string | [string, string])[];
  style?: any;
  rubySize?: number;
  /** true にすると flexWrap を無効化し、単一行に収める（はみ出し要素は切り詰め） */
  noWrap?: boolean;
  /** ルビ文字の色を明示指定（デフォルトはpalette.textMuted） */
  rubyColor?: string;
}) {
  const { palette } = useTheme();
  const { rubyVisible, fontScaleValue } = useAccessibility();
  const scaledRuby = rubySize * fontScaleValue;
  const tight = tightStyle(style, palette.textStrong, fontScaleValue);
  const rs = rubyStyle(scaledRuby, rubyColor ?? palette.rubyColor);
  const hiddenRs = [rs, { opacity: 0 }];
  const gap = rubyGap(scaledRuby);
  return (
    <View style={noWrap ? layoutStyles.textRowNoWrap : layoutStyles.textRow}>
      {parts.map((part, i) =>
        typeof part === "string" ? (
          <View key={i} style={layoutStyles.center}>
            <Text style={hiddenRs} numberOfLines={1} allowFontScaling maxFontSizeMultiplier={1.3}>
              .
            </Text>
            <Text
              style={[tight, { marginTop: gap }]}
              numberOfLines={noWrap ? 1 : undefined}
              adjustsFontSizeToFit={noWrap}
              minimumFontScale={noWrap ? 0.7 : undefined}
              allowFontScaling
              maxFontSizeMultiplier={1.3}
            >
              {part}
            </Text>
          </View>
        ) : (
          <View key={i} style={layoutStyles.center}>
            <Text
              style={rubyVisible ? rs : hiddenRs}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
              allowFontScaling
              maxFontSizeMultiplier={1.3}
            >
              {rubyVisible ? part[1] : "."}
            </Text>
            <Text
              style={[tight, { marginTop: gap }]}
              numberOfLines={noWrap ? 1 : undefined}
              adjustsFontSizeToFit={noWrap}
              minimumFontScale={noWrap ? 0.7 : undefined}
              allowFontScaling
              maxFontSizeMultiplier={1.3}
            >
              {part[0]}
            </Text>
          </View>
        )
      )}
    </View>
  );
}

/**
 * マーカー記法 "[漢字|よみ]" を含むテキストをルビ付きで表示
 * 例: "[駆|か]け[出|だ]し" → 駆(か)け出(だ)し
 */
export function RubyStr({
  text,
  style,
  rubySize = 8,
  noWrap = false,
}: {
  text: string;
  style?: any;
  rubySize?: number;
  noWrap?: boolean;
}) {
  if (!text) return null;
  const parts: (string | [string, string])[] = [];
  const regex = /\[([^\]|]+)\|([^\]]+)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push([match[1], match[2]]);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return <RubyText parts={parts} style={style} rubySize={rubySize} noWrap={noWrap} />;
}

// 漢字→読みの辞書（お手伝い系の頻出漢字 + UI用語）
const RUBY_DICT: [string, string][] = [
  ["全部盛", "ぜんぶも"], ["全部", "ぜんぶ"], ["自分", "じぶん"], ["今日", "きょう"], ["今度", "こんど"],
  ["今", "いま"], ["一度", "いちど"], ["一部", "いちぶ"], ["一回", "いっかい"],
  ["毎日", "まいにち"], ["毎週", "まいしゅう"], ["毎月", "まいつき"], ["金額", "きんがく"], ["残高", "ざんだか"], ["残", "のこ"],
  ["最新", "さいしん"], ["最高", "さいこう"], ["最大", "さいだい"], ["最近", "さいきん"],
  ["最終", "さいしゅう"], ["以上", "いじょう"], ["以下", "いか"], ["名前", "なまえ"],
  ["気持", "きも"], ["目標達成", "もくひょうたっせい"], ["目標", "もくひょう"],
  ["達成済", "たっせいず"], ["達成", "たっせい"], ["提案", "ていあん"], ["報酬", "ほうしゅう"], ["撤退", "てったい"],
  ["冒険団", "ぼうけんだん"], ["冒険", "ぼうけん"], ["団員", "だんいん"], ["履歴", "りれき"], ["入力", "にゅうりょく"], ["表示", "ひょうじ"],
  ["確認", "かくにん"], ["失敗", "しっぱい"], ["成長", "せいちょう"], ["成功", "せいこう"], ["現金", "げんきん"],
  ["貯金目標", "ちょきんもくひょう"], ["貯金", "ちょきん"], ["貯蓄", "ちょちく"], ["貯", "た"],
  ["投資", "とうし"], ["銘柄", "めいがら"], ["価格", "かかく"], ["値段", "ねだん"],
  ["更新", "こうしん"], ["承認待", "しょうにんま"], ["承認済", "しょうにんずみ"], ["承認", "しょうにん"], ["済", "ず"],
  ["申請", "しんせい"], ["削除", "さくじょ"], ["追加", "ついか"], ["登録", "とうろく"],
  ["設定", "せってい"], ["変更", "へんこう"], ["送信", "そうしん"], ["受信", "じゅしん"],
  ["完了", "かんりょう"], ["開始", "かいし"], ["終了", "しゅうりょう"], ["合計", "ごうけい"],
  ["回", "かい"], ["円", "えん"], ["件", "けん"], ["分", "ふん"], ["秒", "びょう"], ["年", "ねん"],
  ["月", "つき"], ["日", "にち"], ["人", "ひと"], ["個", "こ"], ["枚", "まい"],
  ["冊", "さつ"], ["株", "かぶ"], ["店", "みせ"], ["数", "かず"], ["別", "べつ"],
  ["次", "つぎ"], ["前", "まえ"], ["中", "ちゅう"], ["上", "あ"],
  ["使", "つか"], ["作", "つく"], ["決", "き"], ["始", "はじ"],
  ["待", "ま"], ["持", "も"], ["送", "おく"], ["届", "とど"], ["選", "えら"],
  ["考", "かんが"], ["足", "た"], ["頑張", "がんば"], ["稼", "かせ"], ["増", "ふ"],
  ["育", "そだ"], ["売", "う"], ["直", "なお"], ["読", "よ"], ["押", "お"],
  ["見", "み"], ["聞", "き"], ["伝", "つた"], ["相談", "そうだん"], ["挑戦", "ちょうせん"],
  ["親", "おや"], ["子", "こ"], ["家族", "かぞく"], ["家", "いえ"],
  // 金 の複合語: ["金", "かね"] より前に置いて優先マッチ
  ["金貨", "きんか"], ["金庫", "きんこ"], ["錬金術", "れんきんじゅつ"],
  ["金", "かね"], ["財布", "さいふ"],
  ["食器洗", "しょっきあら"], ["食器", "しょっき"], ["洗濯物", "せんたくもの"],
  ["洗濯", "せんたく"], ["洗車", "せんしゃ"], ["掃除機", "そうじき"], ["掃除", "そうじ"],
  ["片付", "かたづ"], ["整理整頓", "せいりせいとん"], ["床", "ゆか"], ["窓拭", "まどふ"],
  ["風呂", "ふろ"], ["浴室", "よくしつ"], ["玄関", "げんかん"], ["台拭", "だいふ"],
  ["布団", "ふとん"], ["拭", "ふ"],
  ["手伝", "てつだ"], ["料理", "りょうり"], ["配膳", "はいぜん"], ["箸並", "はしなら"],
  ["箸", "はし"], ["夕食", "ゆうしょく"], ["朝食", "ちょうしょく"], ["昼食", "ちゅうしょく"],
  ["夕飯", "ゆうはん"],
  ["芝刈", "しばか"], ["草取", "くさと"], ["草", "くさ"], ["雑草", "ざっそう"],
  ["水", "みず"], ["花", "はな"], ["植物", "しょくぶつ"], ["庭", "にわ"],
  ["落", "お"], ["葉", "は"], ["雪", "ゆき"],
  ["買", "か"], ["物", "もの"], ["靴揃", "くつそろ"], ["靴並", "くつなら"], ["靴", "くつ"],
  ["新聞", "しんぶん"], ["郵便", "ゆうびん"], ["手紙", "てがみ"], ["車", "くるま"],
  ["肩", "かた"], ["犬", "いぬ"], ["猫", "ねこ"], ["散歩", "さんぽ"],
  ["宿題", "しゅくだい"], ["勉強", "べんきょう"], ["読書", "どくしょ"], ["本", "ほん"],
  ["時間割", "じかんわり"], ["学校", "がっこう"], ["準備", "じゅんび"],
  ["着替", "きが"], ["服", "ふく"], ["歯磨", "はみが"], ["歯", "は"],
  ["分別", "ぶんべつ"], ["乾", "かわ"], ["収納", "しゅうのう"], ["取", "と"],
  ["込", "こ"], ["出", "だ"], ["燃", "も"], ["長", "なが"], ["基本", "きほん"],
  ["会社", "かいしゃ"], ["願", "ねが"], ["何", "なに"], ["方", "かた"],
  ["菓子", "かし"], ["他", "ほか"], ["書", "か"], ["変", "か"], ["好", "す"],
  ["大", "おお"], ["夢", "ゆめ"], ["叶", "かな"], ["新", "あたら"], ["初", "はじ"],
  ["誰", "だれ"], ["入", "い"], ["番号", "ばんごう"], ["画面", "がめん"],
  ["認", "みと"], ["貯金箱", "ちょきんばこ"], ["並", "なら"], ["記録", "きろく"],
  ["右下", "みぎした"], ["話", "はなし"], ["教", "おし"], ["迷", "まよ"],
  ["集", "あつ"], ["続", "つづ"], ["皿洗", "さらあら"], ["皿", "さら"], ["世話", "せわ"], ["終", "お"],
  ["洗", "あら"],
  // Phase 1追加: 管理・UI・法務系（重複エントリ除去済み）
  ["管理者", "かんりしゃ"], ["管理", "かんり"], ["利用規約", "りようきやく"],
  ["丁寧", "ていねい"], ["最後", "さいご"], ["理由", "りゆう"],
  ["保存", "ほぞん"], ["作成", "さくせい"], ["編集", "へんしゅう"],
  ["難易度", "なんいど"], ["簡単", "かんたん"], ["普通", "ふつう"], ["難", "むずか"],
  ["繰", "く"], ["返", "かえ"], ["全員", "ぜんいん"], ["割合", "わりあい"],
  ["値下", "ねさ"], ["値上", "ねあ"], ["必須", "ひっす"],
  ["却下", "きゃっか"], ["許可", "きょか"], ["期間", "きかん"], ["期限", "きげん"],
  ["装備", "そうび"], ["特別", "とくべつ"], ["権限", "けんげん"], ["購入", "こうにゅう"], ["称号", "しょうごう"],
  // ルビは漢字部分のみに付与 (送り仮名は okurigana なのでルビ対象外)
  // 例: 赤ちゃん → 赤(あか)ちゃん / 孵る → 孵(かえ)る / 幸せ → 幸(しあわ)せ
  ["図鑑", "ずかん"], ["卵", "たまご"], ["孵", "かえ"], ["幸", "しあわ"], ["匹", "ひき"], ["赤", "あか"],
  // ペット管理画面用追加
  ["大人", "おとな"], ["一緒", "いっしょ"], ["付", "つ"], ["猫", "ねこ"],
  // 点検中(長い) を 点検 より前に置く (最長一致優先)
  ["点検中", "てんけんちゅう"], ["点検", "てんけん"],
  ["返事", "へんじ"], ["解放", "かいほう"], ["獲得", "かくとく"], ["台所", "だいどころ"],
  ["磨", "みが"], ["覚", "おぼ"], ["保", "たも"], ["詳", "くわ"],
  ["進化", "しんか"], ["上手", "うま"], ["閉", "と"],
  // 投資/世界観: 宝箱(たからばこ) は宝(たから)より長いので前に配置（最長一致優先）
  ["宝箱", "たからばこ"], ["宝", "たから"], ["欲", "ほ"],
  // 投資銘柄関連: 大冒険(だいぼうけん) は大/冒険より前に配置（最長一致優先）
  ["大冒険", "だいぼうけん"], ["江戸", "えど"], ["精鋭", "せいえい"],
  ["商会", "しょうかい"], ["勇者", "ゆうしゃ"], ["魔法陣", "まほうじん"],
  ["錬成", "れんせい"], ["気", "き"],
  // 団長(だんちょう): 長(なが) と分解されないよう専用エントリ追加
  ["団長", "だんちょう"],
  // 通貨ラベル: 海(うみ)/向(む) で「海の向こうのコロ」表現
  ["海", "うみ"], ["向", "む"],
  // 投資銘柄(2026-04-30 走査結果)
  ["魔術師", "まじゅつし"], ["王国", "おうこく"], ["王", "おう"],
  ["神殿", "しんでん"], ["術師", "じゅつし"], ["車王", "くるまおう"],
  // 物知り大図鑑: 図鑑(ずかん) より前に置いて 大図鑑 を優先マッチ
  ["大図鑑", "だいずかん"], ["物知", "ものし"],
  // 電話の塔 / 大通信塔
  ["電話", "でんわ"], ["塔", "とう"], ["通信", "つうしん"], ["交換", "こうかん"],
  // 鉄道
  ["鉄道", "てつどう"],
  // 黄金商会(銀行 → 世界観名称) / 大宝庫(8306.T)
  ["黄金", "おうごん"], ["大宝庫", "だいほうこ"], ["宝庫", "ほうこ"],
  // 錬成の基本 説明文(InvestScreen 空状態)
  ["主人", "しゅじん"], ["大繁盛", "だいはんじょう"], ["繁盛", "はんじょう"],
  ["急", "いそ"], ["手放", "てばな"], ["仕入", "しい"],
  // ロケットシティ系 米国株名/説明文 用
  ["稲妻", "いなずま"], ["果物", "くだもの"], ["魔法", "まほう"],
  ["世界", "せかい"], ["森", "もり"], ["旅", "たび"],
  ["巨人", "きょじん"], ["探検", "たんけん"], ["頭脳", "ずのう"],
  ["甘", "あま"], ["飲", "の"], ["味", "あじ"],
  ["休", "やす"], ["連続", "れんぞく"], ["楽", "たの"], ["今週", "こんしゅう"], ["記録", "きろく"],
  ["東京", "とうきょう"], ["日本", "にほん"], ["有名", "ゆうめい"], ["多", "おお"],
  ["運営", "うんえい"], ["音楽", "おんがく"], ["一番", "いちばん"], ["銀行", "ぎんこう"],
  ["電車", "でんしゃ"], ["携帯電話", "けいたいでんわ"], ["電気自動車", "でんきじどうしゃ"],
  ["飛行機", "ひこうき"], ["検索", "けんさく"], ["走", "はし"], ["菓子", "かし"],
  ["自動車", "じどうしゃ"],
  // プリセットクエスト mainTitle 用
  ["討伐", "とうばつ"], ["泡", "あわ"], ["油汚", "あぶらよご"],
  ["衣類", "いるい"], ["平定", "へいてい"], ["計画", "けいかく"],
  ["発動", "はつどう"], ["大作戦", "だいさくせん"], ["作戦", "さくせん"],
  ["魔物", "まもの"], ["排除", "はいじょ"], ["任務", "にんむ"],
  ["開運", "かいうん"], ["門", "もん"],
  ["騎士団", "きしだん"], ["整列", "せいれつ"],
  ["部屋", "へや"], ["魔王", "まおう"],
  ["結界", "けっかい"], ["守護", "しゅご"],
  ["相棒", "あいぼう"], ["巡回", "じゅんかい"],
  ["知識", "ちしき"], ["結晶", "けっしょう"], ["収集", "しゅうしゅう"],
  ["見習", "みなら"],
  ["虫歯", "むしば"], ["撃退", "げきたい"],
  ["朝", "あさ"],
  // 2026-04-30 第3弾追加: 魔法屋/工房/国/泉/魔導書/秘薬
  // 魔導書(まどうしょ) は 魔導(まどう) より長いので前に配置（最長一致優先）
  ["魔導書", "まどうしょ"], ["魔導", "まどう"],
  // 魔法屋(まほうや) は 魔法(まほう) より長いので前に配置
  ["魔法屋", "まほうや"],
  ["工房", "こうぼう"], ["国", "くに"], ["泉", "いずみ"], ["秘薬", "ひやく"],
  // 銘柄(BA/MSFT) ひらがな実体の漢字化対応:
  // BA: そらとぶ工房 → 空飛ぶ工房, MSFT: まどの魔導書 → 窓の魔導書
  ["空", "そら"], ["飛", "と"], ["窓", "まど"],
  // amountHint カテゴリ別メッセージ用
  ["必要", "ひつよう"], ["高", "たか"],
  // リクエストモーダル例 (日本株)
  ["任天堂", "にんてんどう"],
  // SPYD 理由ハイブリッド「毎月コロがもらえるアメリカのお宝の詰め合わせ」用
  ["詰", "つ"], ["合", "あ"],
].sort((a, b) => b[0].length - a[0].length) as [string, string][];

// ひらがな→漢字の逆引き辞書（ひらがなテキストを漢字＋ルビに変換）
// 1文字の読みは過剰マッチするため除外（2文字以上のみ）
const REVERSE_DICT: [string, string, string][] = RUBY_DICT
  .filter(([, reading]) => reading.length >= 2)
  .map(([kanji, reading]) => [reading, kanji, reading] as [string, string, string])
  .sort((a, b) => b[0].length - a[0].length);

/**
 * テキスト（漢字 or ひらがな混在）を辞書ベースで自動ルビ変換して表示
 * 1. まず漢字にマッチ → ルビ付き表示
 * 2. 次にひらがなにマッチ → 漢字＋ルビに変換
 */
export function AutoRubyText({
  text,
  style,
  rubySize = 8,
  noWrap = false,
  rubyColor,
}: {
  text: string;
  style?: any;
  rubySize?: number;
  noWrap?: boolean;
  /** ルビ文字色を明示指定（明るい背景上で視認性を確保したい時に使用） */
  rubyColor?: string;
}) {
  if (!text) return null;
  const parts: (string | [string, string])[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    let matched = false;
    // 漢字マッチ（既に漢字で書かれているテキスト）
    for (const [kanji, reading] of RUBY_DICT) {
      if (remaining.startsWith(kanji)) {
        parts.push([kanji, reading]);
        remaining = remaining.slice(kanji.length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      // ひらがなマッチ（ひらがなテキストを漢字に変換）
      for (const [reading, kanji, ruby] of REVERSE_DICT) {
        if (remaining.startsWith(reading)) {
          parts.push([kanji, ruby]);
          remaining = remaining.slice(reading.length);
          matched = true;
          break;
        }
      }
    }
    if (!matched) {
      if (parts.length > 0 && typeof parts[parts.length - 1] === "string") {
        parts[parts.length - 1] = (parts[parts.length - 1] as string) + remaining[0];
      } else {
        parts.push(remaining[0]);
      }
      remaining = remaining.slice(1);
    }
  }
  return <RubyText parts={parts} style={style} rubySize={rubySize} noWrap={noWrap} rubyColor={rubyColor} />;
}

const layoutStyles = StyleSheet.create({
  textRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  textRowNoWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    flexWrap: "nowrap",
    flexShrink: 1,
  },
  center: {
    alignItems: "center",
  },
});
