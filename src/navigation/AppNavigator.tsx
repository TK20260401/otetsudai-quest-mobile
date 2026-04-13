import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { getSession } from "../lib/session";
import { colors } from "../lib/colors";
import LandingScreen from "../screens/LandingScreen";
import LoginScreen from "../screens/LoginScreen";
import ChildDashboardScreen from "../screens/ChildDashboardScreen";
import ParentDashboardScreen from "../screens/ParentDashboardScreen";

export type RootStackParamList = {
  Landing: undefined;
  Login: undefined;
  ChildDashboard: { childId: string };
  ParentDashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState<
    keyof RootStackParamList | null
  >(null);
  const [initialParams, setInitialParams] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    // 常にランディング画面から開始
    setInitialRoute("Landing");
  }

  if (!initialRoute) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.slateLight,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Landing" component={LandingWrapper} />
        <Stack.Screen name="Login" component={LoginWrapper} />
        <Stack.Screen
          name="ChildDashboard"
          component={ChildDashboardScreen}
          initialParams={initialParams}
        />
        <Stack.Screen
          name="ParentDashboard"
          component={ParentDashboardScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Wrapper for LandingScreen
function LandingWrapper({ navigation }: { navigation: any }) {
  return (
    <LandingScreen
      onSignup={() => navigation.navigate("Login")}
      onLogin={() => navigation.navigate("Login")}
    />
  );
}

// Wrapper to pass navigation to LoginScreen
function LoginWrapper({ navigation }: { navigation: any }) {
  return (
    <LoginScreen
      onLoginSuccess={async () => {
        const session = await getSession();
        if (!session) return;
        if (session.role === "child") {
          navigation.reset({
            index: 0,
            routes: [
              {
                name: "ChildDashboard",
                params: { childId: session.userId },
              },
            ],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: "ParentDashboard" }],
          });
        }
      }}
    />
  );
}
