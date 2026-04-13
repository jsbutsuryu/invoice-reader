import './globals.css'

export const metadata = {
  title: '伝票 AI 読み取りツール',
  description: '伝票・領収書・請求書の画像をAIで自動解析し、Excel/JSON出力できるツール',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
