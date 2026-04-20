import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Svg, { Rect, Defs, LinearGradient, Stop } from "react-native-svg";
import CharacterSvg from "./CharacterSvg";
import WalletBalanceAnimation from "./WalletBalanceAnimation";
import { useTheme, type Palette } from "../theme";
import { PixelDoorIcon, PixelCoinIcon, PixelHouseIcon } from "./PixelIcons";

type Props = {
  title: string;
  userName?: string;
  level?: number;
  hp?: number;       // 0-100
  mp?: number;       // 0-10
  exp?: number;      // 0-100
  gold?: number;     // total coin balance
  pendingCount?: number;
  onLogout?: () => void;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
};

export default function GameStatusHeader({
  title,
  userName,
  level = 1,
  hp = 0,
  mp = 0,
  exp = 0,
  gold,
  pendingCount,
  onLogout,
  onBack,
  rightSlot,
}: Props) {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  return (
    <View style={styles.root}>
      {/* 上部ゴールド装飾バー */}
      <Svg width="100%" height={6} viewBox="0 0 400 6" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="ghs-top" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#8A5200" />
            <Stop offset="30%" stopColor="#FFA623" />
            <Stop offset="50%" stopColor="#FFE066" />
            <Stop offset="70%" stopColor="#FFA623" />
            <Stop offset="100%" stopColor="#8A5200" />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={400} height={4} fill="url(#ghs-top)" />
        <Rect x={0} y={4} width={400} height={1} fill="#6B3E00" opacity={0.7} />
        <Rect x={2} y={1} width={3} height={3} fill="#E74C3C" />
        <Rect x={395} y={1} width={3} height={3} fill="#E74C3C" />
      </Svg>

      {/* 名前行 */}
      <View style={styles.nameRow}>
        <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{title}</Text>
        {pendingCount !== undefined && pendingCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pendingCount}</Text>
          </View>
        ) : null}
        {gold !== undefined ? (
          <View style={styles.goldChip}>
            <PixelCoinIcon size={12} />
            <WalletBalanceAnimation value={gold} textStyle={styles.goldText} />
          </View>
        ) : null}
      </View>

      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityLabel="もどる">
            <PixelHouseIcon size={18} />
            <Text style={styles.backText}>もどる</Text>
          </TouchableOpacity>
        ) : null}

        {/* ミニキャラ + Lvバッジ */}
        <View style={styles.characterWrap}>
          <View style={styles.characterBg}>
            <CharacterSvg level={level} mood="active" size={40} />
          </View>
          <View style={styles.lvBadge}>
            <Text style={styles.lvText}>Lv.{level}</Text>
          </View>
        </View>

        {/* ゲージ */}
        <View style={styles.middle}>
          <View style={styles.gauges}>
            <MiniGauge label="HP" value={hp} color1="#E74C3C" color2="#8A2218" gid="hp" />
            <MiniGauge label="MP" value={Math.min(100, mp * 10)} color1="#3498DB" color2="#164E72" gid="mp" />
            <MiniGauge label="EX" value={exp} color1="#FFD700" color2="#8A5200" gid="ex" />
          </View>
        </View>

        {/* 右: アクション */}
        <View style={styles.right}>
          <View style={styles.rightRow}>
            {rightSlot}
            {onLogout ? (
              <TouchableOpacity onPress={onLogout} style={styles.logoutBtn} accessibilityLabel="ログアウト">
                <PixelDoorIcon size={12} />
                <Text style={styles.logoutText}>ログアウト</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

function MiniGauge({
  label,
  value,
  color1,
  color2,
  gid,
}: {
  label: string;
  value: number;
  color1: string;
  color2: string;
  gid: string;
}) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <View style={miniStyles.row}>
      <Text style={[miniStyles.label, { color: color1 }]}>{label}</Text>
      <View style={miniStyles.barWrap}>
        <Svg width="100%" height={6} viewBox="0 0 100 6" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id={`ghs-${gid}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={color1} />
              <Stop offset="100%" stopColor={color2} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={100} height={6} rx={2} fill="#1A0F2E" />
          <Rect x={0} y={0} width={pct} height={6} rx={2} fill={`url(#ghs-${gid})`} />
          <Rect x={0} y={0} width={pct} height={2} rx={1} fill="#ffffff" opacity={0.3} />
        </Svg>
      </View>
    </View>
  );
}

function createStyles(palette: Palette) {
  return StyleSheet.create({
    root: {
      marginBottom: 12,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: `${palette.primary}99`,
      backgroundColor: palette.surface,
      overflow: "hidden",
      shadowColor: palette.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 5,
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 10,
      paddingTop: 8,
      paddingBottom: 2,
      gap: 8,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingTop: 2,
      paddingBottom: 8,
      gap: 8,
    },
    iconBtn: {
      width: 28,
      height: 28,
      alignItems: "center",
      justifyContent: "center",
    },
    backBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: palette.primary,
      backgroundColor: palette.background,
    },
    backText: {
      fontSize: 16,
      fontWeight: "bold",
      color: palette.textMuted,
    },
    characterWrap: {
      position: "relative",
    },
    characterBg: {
      width: 48,
      height: 48,
      borderRadius: 8,
      backgroundColor: `${palette.surfaceMuted}B3`,
      borderWidth: 1,
      borderColor: `${palette.primary}55`,
      alignItems: "center",
      justifyContent: "center",
    },
    lvBadge: {
      position: "absolute",
      bottom: -4,
      right: -4,
      backgroundColor: palette.primary,
      borderRadius: 6,
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderWidth: 1,
      borderColor: palette.accent,
    },
    lvText: {
      fontSize: 9,
      fontWeight: "800",
      color: palette.black,
    },
    middle: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: 16,
      fontWeight: "bold",
      color: palette.accent,
      flexShrink: 1,
    },
    badge: {
      backgroundColor: palette.red,
      borderRadius: 8,
      paddingHorizontal: 6,
      paddingVertical: 1,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: "700",
      color: "#ffffff",
    },
    gauges: {
      marginTop: 4,
      gap: 2,
    },
    right: {
      alignItems: "flex-end",
      gap: 4,
    },
    goldChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: `${palette.primary}26`,
      borderWidth: 1,
      borderColor: `${palette.primary}80`,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    goldText: {
      fontSize: 11,
      fontWeight: "700",
      color: palette.accent,
    },
    rightRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    logoutBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      paddingHorizontal: 6,
      paddingVertical: 4,
    },
    logoutText: {
      fontSize: 10,
      color: palette.textMuted,
    },
  });
}

const miniStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  label: {
    fontSize: 8,
    fontWeight: "800",
    width: 18,
  },
  barWrap: {
    flex: 1,
    height: 6,
  },
});
