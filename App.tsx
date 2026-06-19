import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./src/navigation/AppNavigator";
import { AppAlertProvider } from "./src/components/AppAlert";
import { ThemeProvider } from "./src/theme";
import {
  AccessibilityProvider,
  loadSavedAccessibility,
  applyGlobalTextScaling,
} from "./src/accessibility";

applyGlobalTextScaling();

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [initial, setInitial] = useState<Parameters<typeof AccessibilityProvider>[0]["initial"]>({});

  useEffect(() => {
    loadSavedAccessibility().then((saved) => {
      setInitial(saved);
      setLoaded(true);
    });
  }, []);

  if (!loaded) return null;

  // 注: onStartShouldSetResponderCapture を root に置くと
  // GestureHandlerRootView 配下の TouchableOpacity の onPress が発火しなくなる
  // ケースがある。AccessibilityToggle のボタンが効かなくなる原因。
  // 自動ログアウトのタッチ検知は AppNavigator 側に委譲するため、ここでは外す。
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
    </GestureHandlerRootView>
  );
}
