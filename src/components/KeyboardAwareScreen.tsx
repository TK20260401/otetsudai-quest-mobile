import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
} from "react-native";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  keyboardVerticalOffset?: number;
};

/**
 * 全画面共通のキーボード対応ラッパー
 * - iOS: behavior="padding" でキーボード分を押し上げ
 * - Android: behavior="height"
 * - keyboardShouldPersistTaps="handled" でキーボード表示中もボタンをタップ可能
 * - keyboardDismissMode="interactive" でスクロールドラッグでキーボードを閉じる
 */
export default function KeyboardAwareScreen({
  children,
  style,
  keyboardVerticalOffset = 0,
}: Props) {
  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        bounces={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
