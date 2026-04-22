import React, { useEffect, useState, useCallback } from "react";
import { ActivityIndicator, View, Alert } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { getSession, clearSession } from "../lib/session";
import { useTheme } from "../theme";
import LandingScreen from "../screens/LandingScreen";
import LoginScreen from "../screens/LoginScreen";
import ChildDashboardScreen from "../screens/ChildDashboardScreen";
import ParentDashboardScreen from "../screens/ParentDashboardScreen";
import WalletDetailScreen from "../screens/WalletDetailScreen";
import SpendRequestScreen from "../screens/SpendRequestScreen";
import InvestScreen from "../screens/InvestScreen";
import {
  WelcomeScreen,
  NicknameScreen,
  PinSetupScreen,
  BackupWordsScreen,
} from "../screens/onboarding";
import {
  signInAnonymously,
  createChildAccount,
  loginAsUser,
} from "../services/auth";

export type RootStackParamList = {
  Landing: undefined;
  Login: undefined;
  ChildLogin: undefined;
  ParentLogin: undefined;
  // Onboarding
  Welcome: undefined;
  Nickname: undefined;
  PinSetup: undefined;
  BackupWords: { backupWords: string[] };
  // Main
  ChildDashboard: { childId: string };
  ParentDashboard: undefined;
  WalletDetail: { childId: string; walletId: string };
  SpendRequest: { childId: string; walletId: string; spendingBalance: number };
  Invest: { childId: string; walletId: string; investBalance: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { palette } = useTheme();
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
    // 毎回Landingから開始する。セッションが残っていてもTOP画面に戻す。
    setInitialRoute("Landing");
  }

  if (!initialRoute) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: palette.surfaceMuted,
        }}
      >
        <ActivityIndicator size="large" color={palette.primary} />
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
        {/* Onboarding */}
        <Stack.Screen name="Welcome" component={WelcomeWrapper} />
        <Stack.Screen name="Nickname" component={NicknameWrapper} />
        <Stack.Screen name="PinSetup" component={PinSetupWrapper} />
        <Stack.Screen name="BackupWords" component={BackupWordsWrapper} />
        {/* Auth */}
        <Stack.Screen name="Login" component={LoginWrapper} />
        <Stack.Screen name="ChildLogin" component={ChildLoginWrapper} />
        <Stack.Screen name="ParentLogin" component={ParentLoginWrapper} />
        {/* Main */}
        <Stack.Screen
          name="ChildDashboard"
          component={ChildDashboardScreen}
          initialParams={initialParams}
        />
        <Stack.Screen
          name="ParentDashboard"
          component={ParentDashboardScreen}
        />
        <Stack.Screen
          name="WalletDetail"
          component={WalletDetailScreen}
        />
        <Stack.Screen
          name="SpendRequest"
          component={SpendRequestScreen}
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="Invest"
          component={InvestScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ── Landing ──
function LandingWrapper({ navigation }: { navigation: any }) {
  return (
    <LandingScreen
      onSignup={() => navigation.navigate("Welcome")}
      onLogin={() => navigation.navigate("ChildLogin")}
      onParentLogin={() => navigation.navigate("ParentLogin")}
    />
  );
}

// ── Onboarding Wrappers ──

// オンボーディング中のニックネーム・PINを一時保持
let _onboardNickname = "";
let _onboardPin = "";

function WelcomeWrapper({ navigation }: { navigation: any }) {
  return (
    <WelcomeScreen
      onNext={() => navigation.navigate("Nickname")}
      onRecover={() => {
        // TODO: RecoverAccountScreen に遷移
        Alert.alert("ふっきゅう", "アカウントふっきゅう機能は準備中です");
      }}
    />
  );
}

function NicknameWrapper({ navigation }: { navigation: any }) {
  return (
    <NicknameScreen
      onNext={(nickname) => {
        _onboardNickname = nickname;
        navigation.navigate("PinSetup");
      }}
      onBack={() => navigation.goBack()}
    />
  );
}

function PinSetupWrapper({ navigation }: { navigation: any }) {
  const handlePinSet = useCallback(async (pin: string) => {
    _onboardPin = pin;
    try {
      // 1. Anonymous Auth でサインイン
      const { error: anonError } = await signInAnonymously();
      if (anonError) throw anonError;

      // 2. Edge Function でアカウント作成
      const result = await createChildAccount(_onboardNickname, _onboardPin);

      // 3. セッション保存
      await loginAsUser(
        { id: result.userId, role: "child", name: _onboardNickname },
        result.familyId,
        undefined // authId はSupabase sessionから自動取得
      );

      // 4. バックアップあいことば画面へ
      navigation.navigate("BackupWords", {
        backupWords: result.backupWords,
      });
    } catch (err: any) {
      Alert.alert("エラー", err.message || "アカウントの作成に失敗しました");
    }
  }, [navigation]);

  return (
    <PinSetupScreen
      onNext={handlePinSet}
      onBack={() => navigation.goBack()}
    />
  );
}

function BackupWordsWrapper({ navigation, route }: { navigation: any; route: any }) {
  const backupWords: string[] = route.params?.backupWords ?? [];

  const handleConfirm = useCallback(async () => {
    const session = await getSession();
    if (!session) return;
    // ダッシュボードへ直行（スタックをリセット）
    navigation.reset({
      index: 0,
      routes: [
        {
          name: "ChildDashboard",
          params: { childId: session.userId },
        },
      ],
    });
  }, [navigation]);

  return (
    <BackupWordsScreen
      words={backupWords}
      onConfirm={handleConfirm}
      onBack={() => navigation.goBack()}
    />
  );
}

// ── Login Wrappers ──

function makeLoginSuccess(navigation: any) {
  return async () => {
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
  };
}

function LoginWrapper({ navigation }: { navigation: any }) {
  return (
    <LoginScreen
      onLoginSuccess={makeLoginSuccess(navigation)}
    />
  );
}

function ChildLoginWrapper({ navigation }: { navigation: any }) {
  return (
    <LoginScreen
      mode="child"
      onLoginSuccess={makeLoginSuccess(navigation)}
      onBack={() => navigation.goBack()}
    />
  );
}

function ParentLoginWrapper({ navigation }: { navigation: any }) {
  return (
    <LoginScreen
      mode="parent"
      onLoginSuccess={makeLoginSuccess(navigation)}
      onBack={() => navigation.goBack()}
    />
  );
}
