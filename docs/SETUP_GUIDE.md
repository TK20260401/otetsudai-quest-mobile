# おこづかいクエスト モバイル版 — ローカル動作検証ガイド

## 必要な環境

| 項目 | バージョン | 備考 |
|------|-----------|------|
| Node.js | **v22.x** | v24は非対応。`node -v` で確認 |
| npm | 10.x | Node.js に同梱 |
| スマートフォン | iOS 15+ / Android 10+ | Expo Go アプリが必要 |
| Wi-Fi | Mac とスマホが同一ネットワーク | LAN接続に必要 |

### Node.js v22 のインストール（Mac）

```bash
# Homebrew でインストール
brew install node@22

# パスを通す（ターミナルを開くたびに必要、または .zshrc に追記）
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"

# 確認
node -v   # → v22.x.x と表示されればOK
```

### Expo Go アプリのインストール

- **iPhone**: App Store で「Expo Go」を検索してインストール
- **Android**: Google Play で「Expo Go」を検索してインストール

---

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/TK20260401/20260401-Project-Blueprint.git
cd 20260401-Project-Blueprint/otetsudai-quest-mobile
```

### 2. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、Supabase の接続情報を入力：

```bash
cp .env.example .env
```

`.env` を編集：
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyXXXXXXXXXX
```

> **値はプロジェクト管理者（菊池）に確認してください。**
> Slack の #otetsudai-quest チャンネル、または直接連絡。

### 3. 依存パッケージのインストール

```bash
npm install
```

### 4. 開発サーバーの起動

```bash
npx expo start --lan
```

> **注意**: Node v24 を使っている場合は以下のようにフルパスで実行：
> ```bash
> /opt/homebrew/opt/node@22/bin/npx expo start --lan
> ```

### 5. スマホで接続

1. ターミナルに QR コードが表示される
2. **iPhone**: カメラアプリで QR コードをスキャン → Expo Go が開く
3. **Android**: Expo Go アプリ内の「Scan QR Code」で読み取り

---

## テスト用アカウント

| 画面 | ログイン方法 |
|------|-------------|
| 子ども画面 | 家族選択 → メンバー選択（PIN なしなら即ログイン） |
| 親画面 | 家族選択 → 親メンバー選択 |
| 管理者画面 | 「管理者ログイン」→ メール + パスワード |

> テスト用の家族・メンバーは Supabase 上に作成済み。
> 管理者アカウントの認証情報はプロジェクト管理者に確認。

---

## トラブルシューティング

### `sh: expo: command not found`
Node v22 のパスが通っていません。以下を実行：
```bash
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
```

### `Port 8081 is running this app in another window`
既に Expo が起動しています。`Y` を押して別ポートで起動するか、
既存のプロセスを停止してから再起動：
```bash
kill $(lsof -ti:8081)
npx expo start --lan
```

### スマホから接続できない（タイムアウト）
- Mac とスマホが **同じ Wi-Fi** に接続されているか確認
- Mac の **ファイアウォール** を一時的にオフにする
  - システム設定 → ネットワーク → ファイアウォール
- それでもダメなら `--tunnel` モードで起動：
  ```bash
  npx expo start --tunnel
  ```

### バンドルが 0% で止まる
Node v24 を使っている可能性が高いです。Node v22 に切り替えてください。

### `xcrun simctl` エラー
Xcode コマンドラインツールの問題ですが、**実機テストには影響しません**。無視してOK。

---

## 開発サーバーの操作

| キー | 動作 |
|------|------|
| `r` | アプリをリロード |
| `m` | メニュー表示 |
| `j` | デバッガーを開く |
| `Ctrl + C` | サーバー停止 |
