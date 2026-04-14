import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { AutoRubyText } from "./Ruby";
import { useTheme, type Palette } from "../theme";
import { rf } from "../lib/responsive";

type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
};

type AlertState = {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AlertButton[];
};

type AppAlertContextType = {
  alert: (title: string, message?: string, buttons?: AlertButton[]) => void;
};

const AppAlertContext = createContext<AppAlertContextType>({
  alert: () => {},
});

export function useAppAlert() {
  return useContext(AppAlertContext);
}

export function AppAlertProvider({ children }: { children: React.ReactNode }) {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette, width), [palette]);

  const [state, setState] = useState<AlertState>({
    visible: false,
    title: "",
    buttons: [],
  });

  const alert = useCallback(
    (title: string, message?: string, buttons?: AlertButton[]) => {
      setState({
        visible: true,
        title,
        message,
        buttons: buttons || [{ text: "OK" }],
      });
    },
    []
  );

  const handlePress = useCallback((button: AlertButton) => {
    setState((prev) => ({ ...prev, visible: false }));
    button.onPress?.();
  }, []);

  const handleDismiss = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <AppAlertContext.Provider value={{ alert }}>
      {children}
      <Modal
        visible={state.visible}
        transparent
        animationType="fade"
        onRequestClose={handleDismiss}
      >
        <View style={styles.overlay}>
          <View style={styles.card}>
            <AutoRubyText
              text={state.title}
              style={styles.title}
              rubySize={7}
            />
            {state.message ? (
              <AutoRubyText
                text={state.message}
                style={styles.message}
                rubySize={7}
              />
            ) : null}
            <View
              style={[
                styles.buttonRow,
                state.buttons.length === 1 && styles.buttonRowSingle,
              ]}
            >
              {state.buttons.map((btn, i) => {
                const isCancel = btn.style === "cancel";
                const isDestructive = btn.style === "destructive";
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.button,
                      isCancel && styles.buttonCancel,
                      isDestructive && styles.buttonDestructive,
                      !isCancel && !isDestructive && styles.buttonDefault,
                      state.buttons.length === 1 && styles.buttonFull,
                    ]}
                    onPress={() => handlePress(btn)}
                  >
                    <AutoRubyText
                      text={btn.text}
                      style={[
                        styles.buttonText,
                        isCancel && styles.buttonTextCancel,
                        isDestructive && styles.buttonTextDestructive,
                      ]}
                      rubySize={6}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </AppAlertContext.Provider>
  );
}

const { width } = Dimensions.get("window");

function createStyles(p: Palette, width: number) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "center",
      alignItems: "center",
      padding: 32,
    },
    card: {
      backgroundColor: p.white,
      borderRadius: 18,
      padding: 24,
      width: Math.min(width - 64, 340),
      alignItems: "center",
      shadowColor: p.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    title: {
      fontSize: rf(18),
      fontWeight: "bold",
      color: p.textStrong,
      textAlign: "center",
      marginBottom: 8,
    },
    message: {
      fontSize: rf(14),
      color: p.textMuted,
      textAlign: "center",
      lineHeight: rf(22),
      marginBottom: 20,
    },
    buttonRow: {
      flexDirection: "row",
      gap: 10,
      width: "100%",
    },
    buttonRowSingle: {
      justifyContent: "center",
    },
    button: {
      flex: 1,
      borderRadius: 12,
      paddingVertical: 13,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonFull: {
      flex: undefined,
      paddingHorizontal: 32,
    },
    buttonDefault: {
      backgroundColor: p.primary,
    },
    buttonCancel: {
      backgroundColor: p.surfaceMuted,
      borderWidth: 1,
      borderColor: p.border,
    },
    buttonDestructive: {
      backgroundColor: p.redLight,
      borderWidth: 1,
      borderColor: p.walletSpendBorder,
    },
    buttonText: {
      fontSize: rf(15),
      fontWeight: "bold",
      color: p.white,
    },
    buttonTextCancel: {
      color: p.textMuted,
      fontWeight: "600",
    },
    buttonTextDestructive: {
      color: p.red,
      fontWeight: "bold",
    },
  });
}
