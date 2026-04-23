import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Share,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  Linking,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import { useTheme, type Palette } from "../theme";
import { rf } from "../lib/responsive";
import RpgButton from "../components/RpgButton";
import { RubyText } from "../components/Ruby";
import RpgCard from "../components/RpgCard";
import { supabase } from "../lib/supabase";
import { getSession } from "../lib/session";

type Props = {
  onBack: () => void;
  onSkip: () => void;
};

type MessageTone = "casual" | "polite" | "fun";

const TONE_LABELS: Record<MessageTone, string> = {
  casual: "やさしい",
  polite: "ていねい",
  fun: "シンプル",
};


function buildMessage(words: string[], tone: MessageTone): string {
  const wordsStr = words.join("  ");
  switch (tone) {
    case "casual":
      return (
        `おうちのひとへ\n` +
        `「ジョブサガ」をはじめたよ！\n` +
        `いっしょにみてくれる？\n\n` +
        `あいことば: ${wordsStr}\n\n` +
        `アプリをひらいて「おやとしてさんかする」からあいことばをいれてね`
      );
    case "polite":
      return (
        `【ジョブサガ／親御さま向け招待】\n` +
        `お手伝い（仕事）とお金の勉強をはじめました。\n` +
        `労働の対価として、おこづかいを受け取る体験を通じて、\n` +
        `金融リテラシーを身につけるアプリです。\n\n` +
        `合言葉: ${wordsStr}\n\n` +
        `アプリを開いて「親として参加する」から合言葉を入力してください。`
      );
    case "fun":
      return (
        `ジョブサガに参加してください。\n\n` +
        `合言葉: ${wordsStr}`
      );
  }
}

export default function InviteParentScreen({ onBack, onSkip }: Props) {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  const [inviteWords, setInviteWords] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTone, setSelectedTone] = useState<MessageTone>("polite");
  const [editedMessage, setEditedMessage] = useState<string>("");

  useEffect(() => {
    fetchInviteWords();
  }, []);

  async function fetchInviteWords() {
    try {
      const session = await getSession();
      if (!session?.familyId) throw new Error("セッションが見つかりません");

      const { data, error } = await supabase
        .from("otetsudai_families")
        .select("invite_words")
        .eq("id", session.familyId)
        .single();

      if (error) throw error;
      setInviteWords(data.invite_words ?? []);
    } catch (err: any) {
      Alert.alert("エラー", err.message || "あいことばの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  // トーン変更時にテンプレを再生成
  useEffect(() => {
    if (inviteWords) {
      setEditedMessage(buildMessage(inviteWords, selectedTone));
    }
  }, [selectedTone, inviteWords]);

  const getMsg = useCallback(() => editedMessage, [editedMessage]);

  const handleShareLINE = useCallback(async () => {
    const url = `https://line.me/R/share?text=${encodeURIComponent(getMsg())}`;
    await Linking.openURL(url);
  }, [getMsg]);

  const handleShareEmail = useCallback(async () => {
    const subject = encodeURIComponent("ジョブサガへの招待");
    const body = encodeURIComponent(getMsg());
    await Linking.openURL(`mailto:?subject=${subject}&body=${body}`);
  }, [getMsg]);

  const handleShareSMS = useCallback(async () => {
    const sep = Platform.OS === "ios" ? "&" : "?";
    await Linking.openURL(`sms:${sep}body=${encodeURIComponent(getMsg())}`);
  }, [getMsg]);

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(getMsg());
    Alert.alert("コピーしました", "メッセージをコピーしました");
  }, [getMsg]);

  const handleShareOther = useCallback(async () => {
    try {
      await Share.share({ message: getMsg() });
    } catch {
      // cancelled
    }
  }, [getMsg]);

  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  if (!inviteWords || inviteWords.length === 0) {
    return (
      <View
        style={[
          styles.screen,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 },
        ]}
      >
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          accessibilityLabel="もどる"
          accessibilityRole="button"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backArrow}>{"\u2190"}</Text>
        </TouchableOpacity>
        <View style={styles.centered}>
          <RubyText style={styles.errorText} parts={[["合言葉", "あいことば"], "が ", ["見", "み"], "つかりませんでした"]} rubySize={6} />
        </View>
      </View>
    );
  }

  const qrData = JSON.stringify({ type: "otetsudai-invite", words: inviteWords });

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 },
      ]}
    >
      <TouchableOpacity
        onPress={onBack}
        style={styles.backButton}
        accessibilityLabel="もどる"
        accessibilityRole="button"
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.backArrow}>{"\u2190"}</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <RubyText style={styles.title} parts={["おうちの", ["人", "ひと"], "を よぼう！"]} rubySize={8} />
        <RubyText style={styles.subtitle} parts={["おうちの", ["人", "ひと"], "にこの", ["画面", "がめん"], "を", ["見", "み"], "せるか メッセージを", ["送", "おく"], "ってね"]} rubySize={6} />

        {/* あいことばカード */}
        <RpgCard tier="gold" variant="compact" style={styles.wordsCard}>
          <RubyText style={styles.sectionLabel} parts={[["合言葉", "あいことば"]]} rubySize={5} />
          <View style={styles.wordsRow}>
            {inviteWords.map((word, i) => (
              <View key={i} style={styles.wordChip}>
                <Text style={styles.wordText}>{word}</Text>
              </View>
            ))}
          </View>
        </RpgCard>

        {/* QRコード */}
        <RpgCard tier="silver" variant="compact" style={styles.qrCard}>
          <Text style={styles.sectionLabel}>QRコード</Text>
          <RubyText style={styles.qrHint} parts={["おうちの", ["人", "ひと"], "のスマホで ", ["読", "よ"], "み", ["取", "と"], "ってね"]} rubySize={5} />
          <View style={styles.qrWrap}>
            <View style={styles.qrBackground}>
              <QRCode
                value={qrData}
                size={160}
                backgroundColor="#FFFFFF"
                color={palette.primaryDark}
              />
            </View>
          </View>
        </RpgCard>

        {/* テキストシェア */}
        <RpgCard tier="silver" variant="compact" style={styles.shareCard}>
          <RubyText style={styles.sectionLabel} parts={["メッセージで ", ["送", "おく"], "る"]} rubySize={5} />

          <View style={styles.toneRow}>
            {(["casual", "polite", "fun"] as MessageTone[]).map((tone) => (
              <TouchableOpacity
                key={tone}
                onPress={() => setSelectedTone(tone)}
                style={[
                  styles.toneChip,
                  selectedTone === tone && styles.toneChipActive,
                ]}
                accessibilityLabel={TONE_LABELS[tone]}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedTone === tone }}
              >
                <Text
                  style={[
                    styles.toneText,
                    selectedTone === tone && styles.toneTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {TONE_LABELS[tone]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.previewInput}
            value={editedMessage}
            onChangeText={setEditedMessage}
            multiline
            textAlignVertical="top"
            placeholderTextColor={palette.textPlaceholder}
            accessibilityLabel="送信メッセージを編集"
          />

          <View style={styles.shareRow}>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShareLINE} accessibilityLabel="LINEで送る">
              <Text style={styles.shareBtnLabel}>LINE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShareEmail} accessibilityLabel="メールで送る">
              <Text style={styles.shareBtnLabel}>メール</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShareSMS} accessibilityLabel="SMSで送る">
              <Text style={styles.shareBtnLabel}>SMS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn} onPress={handleCopy} accessibilityLabel="コピーする">
              <Text style={styles.shareBtnLabel}>コピー</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShareOther} accessibilityLabel="その他の方法で送る">
              <RubyText style={styles.shareBtnLabel} parts={[["他", "ほか"]]} rubySize={4} />
            </TouchableOpacity>
          </View>
        </RpgCard>

        {/* スキップ */}
        <TouchableOpacity
          onPress={onSkip}
          style={styles.skipLink}
          accessibilityLabel="あとでやる"
          accessibilityRole="button"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <RubyText style={styles.skipText} parts={["あとで よぶ"]} rubySize={5} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function createStyles(p: Palette) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: p.backgroundLanding,
      paddingHorizontal: 20,
    },
    backButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    backArrow: {
      fontSize: rf(24),
      color: p.primaryDark,
      fontWeight: "bold",
    },
    scrollContent: {
      alignItems: "center",
      paddingBottom: 32,
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    errorText: {
      fontSize: rf(16),
      color: p.textMuted,
      textAlign: "center",
    },
    title: {
      fontSize: rf(18),
      fontWeight: "800",
      color: p.primaryDark,
      marginBottom: 8,
      textAlign: "center",
    },
    subtitle: {
      fontSize: rf(14),
      color: p.primary,
      marginBottom: 20,
      textAlign: "center",
      lineHeight: rf(22),
    },
    // あいことばカード
    wordsCard: {
      width: "100%",
      marginBottom: 16,
    },
    sectionLabel: {
      fontSize: rf(13),
      fontWeight: "bold",
      color: p.textMuted,
      marginBottom: 10,
      textAlign: "center",
      letterSpacing: 1,
    },
    wordsRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 12,
      marginBottom: 14,
      flexWrap: "wrap",
    },
    wordChip: {
      backgroundColor: p.white,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: p.borderStrong,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    wordText: {
      fontSize: rf(18),
      fontWeight: "bold",
      color: p.primaryDark,
      letterSpacing: 1,
    },
    copyButton: {
      alignSelf: "center",
      paddingVertical: 8,
      paddingHorizontal: 16,
      minHeight: 44,
      justifyContent: "center",
    },
    copyButtonText: {
      fontSize: rf(13),
      color: p.primary,
      fontWeight: "600",
      textDecorationLine: "underline",
    },
    // QR
    qrCard: {
      width: "100%",
      marginBottom: 16,
    },
    qrHint: {
      fontSize: rf(10),
      color: p.textMuted,
      textAlign: "center",
      marginBottom: 12,
    },
    qrWrap: {
      alignItems: "center",
    },
    qrBackground: {
      backgroundColor: "#FFFFFF",
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: p.border,
    },
    // シェア
    shareCard: {
      width: "100%",
      marginBottom: 20,
    },
    toneRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 6,
      marginBottom: 14,
    },
    toneChip: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: p.surfaceMuted,
      borderWidth: 1.5,
      borderColor: "transparent",
      minHeight: 44,
    },
    toneChipActive: {
      borderColor: p.primary,
      backgroundColor: p.white,
    },
    toneEmoji: {
      fontSize: rf(16),
    },
    toneText: {
      fontSize: rf(12),
      color: p.textMuted,
      fontWeight: "600",
    },
    toneTextActive: {
      color: p.primaryDark,
    },
    previewInput: {
      backgroundColor: p.white,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: p.border,
      padding: 14,
      marginBottom: 14,
      fontSize: rf(13),
      color: "#1a1a1a",
      lineHeight: rf(20),
      minHeight: 120,
    },
    shareRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 4,
    },
    shareBtn: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: p.surfaceMuted,
      borderWidth: 1,
      borderColor: p.border,
      minHeight: 44,
    },
    shareBtnIcon: {
      fontSize: 20,
      marginBottom: 4,
    },
    shareBtnLabel: {
      fontSize: 9,
      color: p.textStrong,
      fontWeight: "600",
      textAlign: "center",
    },
    // スキップ
    skipLink: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      minHeight: 44,
      justifyContent: "center",
    },
    skipText: {
      fontSize: rf(13),
      color: p.textMuted,
      textDecorationLine: "underline",
    },
  });
}
