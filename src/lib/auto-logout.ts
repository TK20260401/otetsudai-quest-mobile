/**
 * 無操作タイマーによる自動ログアウト
 * 30分間操作がなければセッションをクリアしてランディングへ戻す
 */
import { AppState, type AppStateStatus } from "react-native";
import { clearSession } from "./session";
import { resetSampleFamily } from "./sample-reset";

const TIMEOUT_MS = 30 * 60 * 1000; // 30分

let timer: ReturnType<typeof setTimeout> | null = null;
let logoutCallback: (() => void) | null = null;
let backgroundAt: number | null = null;

function resetTimer() {
  if (timer) clearTimeout(timer);
  if (!logoutCallback) return;
  timer = setTimeout(doLogout, TIMEOUT_MS);
}

async function doLogout() {
  timer = null;
  resetSampleFamily().catch(() => {});
  await clearSession();
  logoutCallback?.();
  logoutCallback = null;
}

function handleAppStateChange(state: AppStateStatus) {
  if (state === "background" || state === "inactive") {
    backgroundAt = Date.now();
  } else if (state === "active" && backgroundAt) {
    const elapsed = Date.now() - backgroundAt;
    backgroundAt = null;
    if (elapsed >= TIMEOUT_MS) {
      doLogout();
    } else {
      resetTimer();
    }
  }
}

/** ログイン後に呼ぶ。onLogoutはランディングへnavigation.resetするコールバック */
export function startAutoLogout(onLogout: () => void) {
  logoutCallback = onLogout;
  backgroundAt = null;
  resetTimer();
  AppState.addEventListener("change", handleAppStateChange);
}

/** ログアウト時・画面遷移時にタイマーを停止 */
export function stopAutoLogout() {
  if (timer) clearTimeout(timer);
  timer = null;
  logoutCallback = null;
  backgroundAt = null;
}

/** ユーザー操作があったらタイマーをリセット（タッチイベントから呼ぶ） */
export function touchActivity() {
  if (logoutCallback) resetTimer();
}
