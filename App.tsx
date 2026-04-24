import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
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

  return (
    <SafeAreaProvider>
      <AccessibilityProvider initial={initial}>
        <ThemeProvider initial="dungeon">
          <AppAlertProvider>
            <StatusBar style="dark" />
            <AppNavigator />
          </AppAlertProvider>
        </ThemeProvider>
      </AccessibilityProvider>
    </SafeAreaProvider>
  );
}
