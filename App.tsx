import { useCallback, useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./src/navigation/AppNavigator";
import { AppAlertProvider } from "./src/components/AppAlert";
import { ThemeProvider } from "./src/theme";
import {
  AccessibilityProvider,
  loadSavedAccessibility,
  applyGlobalTextScaling,
} from "./src/accessibility";
import { touchActivity } from "./src/lib/auto-logout";

applyGlobalTextScaling();

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [initial, setInitial] = useState<Parameters<typeof AccessibilityProvider>[0]["initial"]>({});

  // タッチイベントをキャプチャして自動ログアウトタイマーをリセット
  // onStartShouldSetResponderCapture は false を返すので子要素の操作を妨げない
  const handleTouch = useCallback(() => {
    touchActivity();
    return false;
  }, []);

  useEffect(() => {
    loadSavedAccessibility().then((saved) => {
      setInitial(saved);
      setLoaded(true);
    });
  }, []);

  if (!loaded) return null;

  return (
    <View style={{ flex: 1 }} onStartShouldSetResponderCapture={handleTouch}>
      <SafeAreaProvider>
        <AccessibilityProvider initial={initial}>
          <ThemeProvider initial="forest">
            <AppAlertProvider>
              <StatusBar style="dark" />
              <AppNavigator />
            </AppAlertProvider>
          </ThemeProvider>
        </AccessibilityProvider>
      </SafeAreaProvider>
    </View>
  );
}
