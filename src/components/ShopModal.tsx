import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  SHOP_ITEMS,
  RARITY_COLORS,
  getPurchases,
  purchaseItem,
  equipItem,
  unequipAll,
  type PurchaseRecord,
} from "../lib/shop";
import RpgButton from "./RpgButton";
import CoinKunChat from "./CoinKunChat";
import { PixelShopIcon } from "./PixelIcons";
import { AutoRubyText, RubyText } from "./Ruby";
import { useTheme, type Palette, linkStyles } from "../theme";

type Props = {
  visible: boolean;
  onClose: () => void;
  childId: string;
  walletId: string | null;
  spendingBalance: number;
  onChanged?: () => void;
};

export default function ShopModal({
  visible,
  onClose,
  childId,
  walletId,
  spendingBalance,
  onChanged,
}: Props) {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const insets = useSafeAreaInsets();

  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; tone: "ok" | "err" } | null>(null);

  useEffect(() => {
    if (!visible) return;
    refresh();
  }, [visible, childId]);

  async function refresh() {
    setLoading(true);
    const data = await getPurchases(childId);
    setPurchases(data);
    setLoading(false);
  }

  const ownedMap = useMemo(() => {
    const map = new Map<string, PurchaseRecord>();
    for (const p of purchases) map.set(p.item_id, p);
    return map;
  }, [purchases]);

  async function handleBuy(itemId: string, price: number) {
    if (!walletId) return;
    if (spendingBalance < price) {
      setToast({ msg: "コロが足りないよ", tone: "err" });
      return;
    }
    setBusy(itemId);
    const result = await purchaseItem(childId, walletId, itemId);
    setBusy(null);
    if (result.success) {
      setToast({ msg: "購入したよ！", tone: "ok" });
      await refresh();
      onChanged?.();
    } else {
      setToast({ msg: result.error || "失敗したよ", tone: "err" });
    }
  }

  async function handleEquip(itemId: string) {
    setBusy(itemId);
    await equipItem(childId, itemId);
    setBusy(null);
    await refresh();
    onChanged?.();
  }

  async function handleUnequip() {
    setBusy("unequip");
    await unequipAll(childId);
    setBusy(null);
    await refresh();
    onChanged?.();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <PixelShopIcon size={20} />
            <Text style={styles.headerTitle}>ショップ</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            accessibilityLabel="ショップを閉じる"
            accessibilityRole="button"
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
        {/* WalletDetail.pocketHint と同じパターン:
            親 View で中央寄せ + Text style はテキスト系のみ
            (paddingHorizontal を Text に流すと各 segment に padding が入って巨大隙間が出る) */}
        <View style={styles.subtitleWrap}>
          <RubyText
            parts={["「", ["取引", "とりひき"], `」のコロ: ${spendingBalance.toLocaleString()}コロ`]}
            style={styles.subtitle}
            rubySize={6}
            noWrap
          />
        </View>
        <View style={styles.shopHintWrap}>
          <RubyText
            parts={[
              ["買", "か"],
              "って",
              ["装備", "そうび"],
              "すると、",
              ["名前", "なまえ"],
              "の",
              ["横", "よこ"],
              "に",
              ["称号", "しょうごう"],
              "がつくよ",
            ]}
            style={styles.shopHint}
            rubySize={5}
          />
        </View>

        {toast && (
          <View
            style={[
              styles.toast,
              toast.tone === "ok" ? styles.toastOk : styles.toastErr,
            ]}
          >
            <AutoRubyText
              text={toast.msg}
              style={[
                styles.toastText,
                { color: toast.tone === "ok" ? palette.green : palette.red },
              ]}
              rubySize={6}
            />
          </View>
        )}

        <ScrollView
          contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator
        >
          {loading ? (
            <ActivityIndicator color={palette.primary} style={{ marginTop: 40 }} />
          ) : (
            <>
              {purchases.some((p) => p.is_equipped) && (
                <TouchableOpacity
                  onPress={handleUnequip}
                  disabled={busy === "unequip"}
                  style={styles.unequipBtn}
                  accessibilityLabel="称号を外す"
                  accessibilityRole="button"
                >
                  <AutoRubyText text="称号を外す" style={styles.unequipText} rubySize={5} noWrap />
                </TouchableOpacity>
              )}

              {SHOP_ITEMS.map((item) => {
                const owned = ownedMap.get(item.id);
                const isEquipped = owned?.is_equipped;
                const canAfford = spendingBalance >= item.price;
                const rc = RARITY_COLORS[item.rarity];
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.itemRow,
                      {
                        borderColor: isEquipped ? palette.primary : palette.border,
                      },
                    ]}
                  >
                    <Text style={styles.itemEmoji}>{item.emoji}</Text>
                    <View style={styles.itemInfo}>
                      <AutoRubyText style={[styles.itemLabel, { color: rc.text }]} text={item.label} rubySize={5} noWrap />
                      <AutoRubyText style={styles.itemDesc} text={item.description} rubySize={4} noWrap />
                      <Text style={[styles.itemMeta, { color: rc.text }]}>
                        {item.rarity.toUpperCase()}{"\n"}{item.price}コロ
                      </Text>
                    </View>
                    <View style={styles.itemAction}>
                      {isEquipped ? (
                        <AutoRubyText text={"⭐\n装備中"} style={styles.equippedText} rubySize={5} />
                      ) : owned ? (
                        <RpgButton
                          tier="violet"
                          size="sm"
                          onPress={() => handleEquip(item.id)}
                          disabled={busy === item.id}
                        >
                          装備
                        </RpgButton>
                      ) : (
                        <RpgButton
                          tier={canAfford ? "gold" : "silver"}
                          size="sm"
                          onPress={() => handleBuy(item.id, item.price)}
                          disabled={busy === item.id || !canAfford || !walletId}
                        >
                          {busy === item.id ? "..." : canAfford ? <RubyText parts={[["買", "か"], "う"]} rubySize={5} noWrap /> : <RubyText parts={["コロ", ["不足", "ふそく"]]} rubySize={5} noWrap />}
                        </RpgButton>
                      )}
                    </View>
                  </View>
                );
              })}
            </>
          )}

          <View style={{ marginTop: 12 }}>
            <RpgButton tier="silver" size="md" onPress={onClose}>
              とじる
            </RpgButton>
          </View>
        </ScrollView>
      </View>
      <CoinKunChat role="child" />
    </Modal>
  );
}

function createStyles(p: Palette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: p.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: p.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: p.textStrong,
    },
    closeBtn: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 18,
      borderWidth: 1.5,
      borderColor: p.border,
    },
    closeText: {
      fontSize: 16,
      color: p.textStrong,
    },
    subtitleWrap: {
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 2,
    },
    subtitle: {
      fontSize: 12,
      color: p.textMuted,
    },
    shopHintWrap: {
      alignItems: "center",
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    shopHint: {
      fontSize: 10,
      color: p.textMuted,
    },
    toast: {
      marginHorizontal: 12,
      marginBottom: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1.5,
    },
    toastOk: {
      backgroundColor: p.greenLight,
      borderColor: p.green,
    },
    toastErr: {
      backgroundColor: p.redLight,
      borderColor: p.red,
    },
    toastText: {
      fontSize: 12,
      textAlign: "center",
    },
    unequipBtn: {
      paddingVertical: 8,
      alignItems: "center",
      marginBottom: 4,
    },
    unequipText: {
      ...linkStyles(p).linkTextMuted,
      fontSize: 11,
    },
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderRadius: 12,
      borderWidth: 1.5,
      marginBottom: 8,
      gap: 12,
    },
    itemEmoji: {
      fontSize: 32,
    },
    itemInfo: {
      flex: 1,
      minWidth: 0,
    },
    itemLabel: {
      fontSize: 14,
      fontWeight: "bold",
    },
    itemDesc: {
      fontSize: 10,
      color: p.textMuted,
      marginTop: 1,
    },
    itemMeta: {
      fontSize: 10,
      marginTop: 2,
    },
    itemAction: {
      width: 88,
      alignItems: "center",
    },
    equippedText: {
      fontSize: 10,
      fontWeight: "bold",
      color: p.primary,
      textAlign: "center",
    },
  });
}
