import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ScrollView,
} from "react-native";
import { useTheme, type Palette } from "../theme";
import { RubyText } from "./Ruby";
import { PixelCartIcon, PixelPiggyIcon, PixelChartIcon, PixelCoinIcon, PixelCrossIcon } from "./PixelIcons";
import * as Haptics from "expo-haptics";
import type { Wallet } from "../lib/types";

export type PotType = "spending" | "saving" | "invest";

type Props = {
  visible: boolean;
  onClose: () => void;
  wallet: Wallet | null;
  onConfirm: (from: PotType, to: PotType, amount: number) => Promise<void>;
};

type PotMeta = {
  key: PotType;
  labelParts: any[];
  Icon: (props: { size?: number }) => React.JSX.Element;
  bg: keyof Palette;
  border: keyof Palette;
  text: keyof Palette;
};

const POTS: PotMeta[] = [
  { key: "spending", labelParts: [["取", "とり"], ["引", "ひき"]], Icon: PixelCartIcon, bg: "walletSpendBg", border: "walletSpendBorder", text: "walletSpendText" },
  { key: "saving",   labelParts: [["金", "きん"], ["庫", "こ"]], Icon: PixelPiggyIcon, bg: "walletSaveBg",  border: "walletSaveBorder",  text: "walletSaveText" },
  { key: "invest",   labelParts: [["錬", "れん"], ["成", "せい"]], Icon: PixelChartIcon, bg: "walletInvestBg", border: "walletInvestBorder", text: "walletInvestText" },
];

function balanceOf(wallet: Wallet | null, key: PotType): number {
  if (!wallet) return 0;
  if (key === "spending") return wallet.spending_balance;
  if (key === "saving") return wallet.saving_balance;
  return wallet.invest_balance;
}

export default function WalletTransferModal({ visible, onClose, wallet, onConfirm }: Props) {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [from, setFrom] = useState<PotType | null>(null);
  const [to, setTo] = useState<PotType | null>(null);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      setFrom(null);
      setTo(null);
      setAmount("");
      setError(null);
      setSubmitting(false);
    }
  }, [visible]);

  const fromBalance = balanceOf(wallet, from || "spending");
  const amountNum = parseInt(amount.replace(/[^0-9]/g, ""), 10) || 0;

  async function handleConfirmWith(amt: number) {
    if (!from || !to || from === to || amt <= 0 || amt > fromBalance || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(from, to, amt);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onClose();
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setError(e?.message || "うつすのに しっぱいしました");
      setSubmitting(false);
    }
  }

  const presets = from
    ? [100, 500, 1000].filter((v) => v <= fromBalance).concat(fromBalance > 0 ? [fromBalance] : [])
    : [];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.overlay}>
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
              <TouchableWithoutFeedback>
                <View style={styles.card}>
          <TouchableOpacity
            onPress={onClose}
            accessibilityLabel="とじる"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.closeBtnTopRight}
          >
            <PixelCrossIcon size={20} />
          </TouchableOpacity>
          <View style={styles.header}>
            <PixelCoinIcon size={20} />
            <RubyText style={styles.title} parts={["おかねを ", ["移", "うつ"], "す"]} rubySize={6} />
          </View>

          {/* どこから */}
          <RubyText style={styles.section} parts={["どこから?"]} rubySize={5} />
          <View style={styles.potRow}>
            {POTS.map((pot) => {
              const selected = from === pot.key;
              const bal = balanceOf(wallet, pot.key);
              return (
                <TouchableOpacity
                  key={pot.key}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setFrom(pot.key);
                    if (to === pot.key) setTo(null);
                    setAmount("");
                    setError(null);
                  }}
                  disabled={bal <= 0}
                  style={[
                    styles.potBtn,
                    { backgroundColor: palette[pot.bg], borderColor: palette[pot.border] },
                    selected && { borderWidth: 3, borderColor: palette.accent },
                    bal <= 0 && { opacity: 0.4 },
                  ]}
                  accessibilityLabel={`から ${pot.key}`}
                  accessibilityRole="button"
                >
                  <pot.Icon size={20} />
                  <RubyText style={[styles.potLabel, { color: palette[pot.text] }]} parts={pot.labelParts} rubySize={5} />
                  <Text style={[styles.potBalance, { color: palette[pot.text] }]}>{bal.toLocaleString()}円</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* どこへ */}
          {from && (
            <>
              <RubyText style={styles.section} parts={["どこへ?"]} rubySize={5} />
              <View style={styles.potRow}>
                {POTS.map((pot) => {
                  const selected = to === pot.key;
                  const disabled = pot.key === from;
                  return (
                    <TouchableOpacity
                      key={pot.key}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setTo(pot.key);
                        setError(null);
                      }}
                      disabled={disabled}
                      style={[
                        styles.potBtn,
                        { backgroundColor: palette[pot.bg], borderColor: palette[pot.border] },
                        selected && { borderWidth: 3, borderColor: palette.accent },
                        disabled && { opacity: 0.3 },
                      ]}
                      accessibilityLabel={`へ ${pot.key}`}
                      accessibilityRole="button"
                    >
                      <pot.Icon size={20} />
                      <RubyText style={[styles.potLabel, { color: palette[pot.text] }]} parts={pot.labelParts} rubySize={5} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* いくら */}
          {from && to && (
            <>
              <RubyText style={styles.section} parts={["いくら?"]} rubySize={5} />
              <View style={styles.presetRow}>
                {presets.map((v) => (
                  <TouchableOpacity
                    key={v}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                      setAmount(String(v));
                      setError(null);
                      handleConfirmWith(v);
                    }}
                    style={[styles.presetBtn, amountNum === v && { backgroundColor: palette.accent, borderColor: palette.accentDark }]}
                  >
                    <Text style={[styles.presetText, amountNum === v && { color: palette.white }]}>
                      {v === fromBalance ? "ぜんぶ" : `${v}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.amountRow}>
                <TextInput
                  value={amount}
                  onChangeText={(v) => { setAmount(v.replace(/[^0-9]/g, "")); setError(null); }}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={palette.textPlaceholder}
                  style={styles.amountInput}
                  maxLength={7}
                  returnKeyType="done"
                  onFocus={() => {
                    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250);
                  }}
                  onSubmitEditing={Keyboard.dismiss}
                />
                <Text style={styles.amountUnit}>円</Text>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                    Keyboard.dismiss();
                    handleConfirmWith(amountNum);
                  }}
                  style={styles.kbDoneBtn}
                  accessibilityLabel="この金額で 移す"
                  accessibilityRole="button"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.kbDoneText}>OK</Text>
                </TouchableOpacity>
              </View>
              {amountNum > fromBalance && (
                <RubyText style={styles.errorText} parts={[`${fromBalance.toLocaleString()}円までだよ`]} rubySize={5} />
              )}
            </>
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}
                </View>
              </TouchableWithoutFeedback>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function createStyles(p: Palette) {
  return StyleSheet.create({
    flex1: { flex: 1 },
    overlay: { flex: 1, backgroundColor: p.overlay },
    scrollContent: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 16, paddingBottom: 32 },
    card: { width: "100%", maxWidth: 420, backgroundColor: p.surface, borderRadius: 14, borderWidth: 2, borderColor: p.primary, padding: 16, gap: 8, position: "relative" as const },
    closeBtnTopRight: {
      position: "absolute" as const,
      top: 8,
      right: 8,
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: p.surfaceMuted,
      zIndex: 10,
    },
    header: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
    title: { fontSize: 16, fontWeight: "700", color: p.textStrong, flex: 1 },
    section: { fontSize: 12, fontWeight: "700", color: p.textBase, marginTop: 6 },
    potRow: { flexDirection: "row", gap: 6 },
    potBtn: { flex: 1, alignItems: "center", paddingVertical: 10, paddingHorizontal: 4, borderRadius: 10, borderWidth: 2, gap: 2 },
    potLabel: { fontSize: 12, fontWeight: "700" },
    potBalance: { fontSize: 11, fontWeight: "600", marginTop: 2 },
    presetRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
    presetBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: p.border, backgroundColor: p.surfaceMuted },
    presetText: { fontSize: 12, fontWeight: "700", color: p.textBase },
    amountRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
    amountInput: { flex: 1, fontSize: 18, fontWeight: "700", color: p.textStrong, backgroundColor: p.surfaceMuted, borderWidth: 1, borderColor: p.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, textAlign: "right" },
    amountUnit: { fontSize: 16, fontWeight: "700", color: p.textBase },
    kbDoneBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: p.primaryDark, backgroundColor: p.primary },
    kbDoneText: { fontSize: 13, fontWeight: "800", color: p.white },
    errorText: { fontSize: 11, color: p.red, marginTop: 4 },
    actions: { flexDirection: "row", gap: 8, marginTop: 12 },
    cancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: p.border, backgroundColor: p.surfaceMuted, alignItems: "center" },
    cancelText: { fontSize: 13, fontWeight: "700", color: p.textMuted },
    confirmBtn: { flex: 2, paddingVertical: 10, borderRadius: 8, borderWidth: 2, borderColor: p.primaryDark, backgroundColor: p.primary, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
    confirmText: { fontSize: 14, fontWeight: "800", color: p.white },
  });
}
