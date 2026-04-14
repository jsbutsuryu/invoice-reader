import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'nodejs'
export const maxDuration = 30

const PROMPT = `この伝票・領収書・請求書の画像を解析し、以下のJSON形式で情報を抽出してください。
コードブロックやマークダウンは使わず、JSONのみを返してください。

{
  "document_type": "伝票種別（請求書/領収書/納品書など）",
  "invoice_number": "伝票番号",
  "date": "日付（YYYY-MM-DD形式）",
  "due_date": "支払期限（あれば）",
  "issuer": {
    "name": "発行者名",
    "address": "住所",
    "tel": "電話番号",
    "email": "メール"
  },
  "recipient": {
    "name": "宛先名",
    "address": "住所"
  },
  "items": [
    {
      "description": "品名・摘要",
      "quantity": 0,
      "unit": "単位",
      "unit_price": 0,
      "amount": 0
    }
  ],
  "subtotal": 0,
  "tax_rate": 10,
  "tax_amount": 0,
  "total": 0,
  "currency": "JPY",
  "payment_method": "支払方法",
  "notes": "備考・摘要"
}

読み取れない項目はnullにしてください。`

export async function POST(request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ error: 'GEMINI_API_KEY が設定されていません' }, { status: 500 })
    }

    const { imageBase64, mimeType } = await request.json()

    if (!imageBase64 || !mimeType) {
      return Response.json({ error: '画像データが不正です' }, { status: 400 })
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(mimeType)) {
      return Response.json({ error: '対応していない画像形式です' }, { status: 400 })
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

    const result = await model.generateContent([
      PROMPT,
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
    ])

    const text = result.response.text()
    const clean = text.replace(/```json|```/g, '').trim()
    const data = JSON.parse(clean)

    return Response.json({ data })
  } catch (e) {
    console.error(e)
    return Response.json({ error: e.message || '解析に失敗しました' }, { status: 500 })
  }
}
