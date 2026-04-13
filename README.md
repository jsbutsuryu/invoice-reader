# 伝票 AI 読み取りツール（Gemini版 — 完全無料）

伝票・領収書・請求書の画像をAIで自動解析し、Excel/JSON形式で出力できるWebアプリです。

## 技術スタック

- **フロントエンド**: Next.js 15 (App Router)
- **AI**: Google Gemini 2.0 Flash（無料枠: 1,500リクエスト/日）
- **Excel出力**: xlsx ライブラリ
- **ホスティング**: Vercel（無料）

---

## デプロイ手順

### 1. Gemini APIキーを取得（無料）

1. https://aistudio.google.com にアクセス
2. Googleアカウントでログイン
3. 「Get API key」→「Create API key」をクリック
4. 表示されたキー（AIza...）をコピーして保管

### 2. GitHubにプッシュ

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/あなたのユーザー名/invoice-reader.git
git push -u origin main
```

### 3. Vercelにデプロイ

1. https://vercel.com にアクセスしてGitHubでログイン
2. 「Add New Project」→ リポジトリを選択
3. 「Environment Variables」に以下を追加：
   - Name: `GEMINI_API_KEY`
   - Value: `AIzaxxxxxxxxx`（取得したAPIキー）
4. 「Deploy」ボタンをクリック
5. デプロイ完了後、発行されたURLを共有する

---

## ローカル起動

```bash
cp .env.local.example .env.local
# .env.local にGemini APIキーを記入

npm install
npm run dev
# → http://localhost:3000 で起動
```

---

## 料金

- **Gemini API**: 完全無料（1,500リクエスト/日、毎日リセット）
- **Vercel**: 無料プランで十分
- **合計: 0円**
