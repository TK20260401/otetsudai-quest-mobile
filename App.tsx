import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./src/navigation/AppNavigator";
import { AppAlertProvider } from "./src/components/AppAlert";
import { ThemeProvider } from "./src/theme";

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider initial="dungeon">
        <AppAlertProvider>
          <StatusBar style="dark" />
          <AppNavigator />
        </AppAlertProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
