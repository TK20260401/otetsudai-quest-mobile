import React from "react";
import { View, Text, StyleSheet } from "react-native";

type Props = {
  kanji: string;
  ruby: string;
  style?: any;
  rubySize?: number;
};

/**
 * 漢字の上にルビ（ふりがな）を表示するコンポーネント
 * インラインで使えるように inline-flex 相当にする
 */
export default function Ruby({ kanji, ruby, style, rubySize = 8 }: Props) {
  return (
    <View style={styles.container}>
      <Text style={[styles.ruby, { fontSize: rubySize }]}>{ruby}</Text>
      <Text style={style}>{kanji}</Text>
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
}: {
  parts: (string | [string, string])[];
  style?: any;
  rubySize?: number;
}) {
  return (
    <View style={styles.textRow}>
      {parts.map((part, i) =>
        typeof part === "string" ? (
          <Text key={i} style={style}>
            {part}
          </Text>
        ) : (
          <Ruby key={i} kanji={part[0]} ruby={part[1]} style={style} rubySize={rubySize} />
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
}: {
  text: string;
  style?: any;
  rubySize?: number;
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
  return <RubyText parts={parts} style={style} rubySize={rubySize} />;
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  ruby: {
    color: "#888",
    lineHeight: 10,
    marginBottom: -2,
  },
  textRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
});
