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
import InviteParentScreen from "../screens/InviteParentScreen";
import AdminScreen from "../screens/AdminScreen";
import {
  WelcomeScreen,
  NicknameScreen,
  PinSetupScreen,
  BackupWordsScreen,
  RecoverAccountScreen,
} from "../screens/onboarding";
import {
  signInAnonymously,
  createChildAccount,
  recoverAccount,
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
  RecoverAccount: undefined;
  InviteParent: undefined;
  Admin: undefined;
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
        <Stack.Screen name="RecoverAccount" component={RecoverAccountWrapper} />
        <Stack.Screen name="InviteParent" component={InviteParentWrapper} />
        {/* Admin */}
        <Stack.Screen name="Admin" component={AdminWrapper} />
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
      onRecover={() => navigation.navigate("RecoverAccount")}
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
  const creatingRef = React.useRef(false);
  const handlePinSet = useCallback(async (pin: string) => {
    if (creatingRef.current) return;
    creatingRef.current = true;
    _onboardPin = pin;
    try {
      // 1. Anonymous Auth でサインイン
      const { data: anonData, error: anonError } = await signInAnonymously();
      if (anonError) throw anonError;

      // セッション確立を待つ
      const token = anonData.session?.access_token;
      if (!token) throw new Error("Anonymous Auth のセッションが取得できませんでした");

      // 2. Edge Function でアカウント作成（トークンを明示的に渡す）
      const result = await createChildAccount(_onboardNickname, _onboardPin, token);

      // 3. セッション保存
      await loginAsUser(
        { id: result.userId, role: "child", name: _onboardNickname },
        result.familyId,
        undefined
      );

      // 4. バックアップあいことば画面へ
      navigation.navigate("BackupWords", {
        backupWords: result.backupWords,
      });
    } catch (err: any) {
      Alert.alert("エラー", err.message || "アカウントの作成に失敗しました");
    } finally {
      creatingRef.current = false;
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
    // バックアップ確認後 → 招待画面へ
    navigation.navigate("InviteParent");
  }, [navigation]);

  return (
    <BackupWordsScreen
      words={backupWords}
      onConfirm={handleConfirm}
      onBack={() => navigation.goBack()}
    />
  );
}

// ── Recover Account ──

function RecoverAccountWrapper({ navigation }: { navigation: any }) {
  const handleRecover = useCallback(async (words: string[], newPin: string) => {
    // 1. Anonymous Auth
    const { data: anonData, error: anonError } = await signInAnonymously();
    if (anonError) throw anonError;
    const token = anonData.session?.access_token;
    if (!token) throw new Error("セッションが取得できませんでした");

    // 2. Edge Function で復旧
    const result = await recoverAccount(words, newPin, token);

    // 3. セッション保存
    await loginAsUser(
      { id: result.userId, role: result.role as "child", name: result.userName },
      result.familyId,
      undefined
    );

    // 4. ダッシュボードへ
    navigation.reset({
      index: 0,
      routes: [
        {
          name: "ChildDashboard",
          params: { childId: result.userId },
        },
      ],
    });
  }, [navigation]);

  return (
    <RecoverAccountScreen
      onRecover={handleRecover}
      onBack={() => navigation.goBack()}
    />
  );
}

// ── Invite Parent ──

function InviteParentWrapper({ navigation }: { navigation: any }) {
  const goToDashboard = useCallback(async () => {
    const session = await getSession();
    if (!session) return;
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
    <InviteParentScreen
      onBack={() => navigation.goBack()}
      onSkip={goToDashboard}
    />
  );
}

// ── Admin ──

function AdminWrapper({ navigation }: { navigation: any }) {
  const handleLoginAs = useCallback(
    async (userId: string, familyId: string, role: string, name: string) => {
      if (role === "child") {
        navigation.reset({
          index: 0,
          routes: [{ name: "ChildDashboard", params: { childId: userId } }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: "ParentDashboard" }],
        });
      }
    },
    [navigation]
  );

  const handleLogout = useCallback(async () => {
    await clearSession();
    navigation.reset({ index: 0, routes: [{ name: "Landing" }] });
  }, [navigation]);

  return (
    <AdminScreen
      onLoginAs={handleLoginAs}
      onLogout={handleLogout}
    />
  );
}

// ── Login Wrappers ──

function makeLoginSuccess(navigation: any) {
  return async () => {
    const session = await getSession();
    if (!session) return;
    if (session.role === "admin") {
      navigation.reset({
        index: 0,
        routes: [{ name: "Admin" }],
      });
    } else if (session.role === "child") {
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
