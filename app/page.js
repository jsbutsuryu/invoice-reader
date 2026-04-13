'use client'
import { useState, useRef, useCallback } from 'react'
import * as XLSX from 'xlsx'

const TABS = ['structured', 'json']
const TAB_LABELS = { structured: '構造化データ', json: 'JSON' }

function fmt(n) {
  if (n == null) return '-'
  return Number(n).toLocaleString('ja-JP')
}

export default function Home() {
  const [image, setImage] = useState(null)
  const [status, setStatus] = useState(null)
  const [data, setData] = useState(null)
  const [activeTab, setActiveTab] = useState('structured')
  const [drag, setDrag] = useState(false)
  const fileRef = useRef()

  const handleFile = useCallback((file) => {
    if (!file) return
    const mimeType = file.type || 'image/jpeg'
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target.result
      const base64 = dataUrl.split(',')[1]
      setImage({ src: dataUrl, base64, mimeType })
      setStatus(null)
      setData(null)
    }
    reader.readAsDataURL(file)
  }, [])

  const onDrop = (e) => {
    e.preventDefault()
    setDrag(false)
    handleFile(e.dataTransfer.files[0])
  }

  const analyze = async () => {
    if (!image) return
    setStatus('loading')
    setData(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: image.base64, mimeType: image.mimeType })
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || '解析失敗')
      setData(json.data)
      setStatus(null)
    } catch (e) {
      setStatus({ error: e.message })
    }
  }

  const reset = () => {
    setImage(null)
    setStatus(null)
    setData(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const downloadJson = () => {
    if (!data) return
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `invoice_${data.invoice_number || 'data'}.json`
    a.click()
  }

  const downloadExcel = () => {
    if (!data) return
    const d = data
    const rows = [
      ['伝票AI読み取りデータ'],
      [],
      ['【基本情報】'],
      ['書類種別', d.document_type || ''],
      ['伝票番号', d.invoice_number || ''],
      ['日付', d.date || ''],
      ['支払期限', d.due_date || ''],
      ['発行者', d.issuer?.name || ''],
      ['発行者住所', d.issuer?.address || ''],
      ['発行者TEL', d.issuer?.tel || ''],
      ['発行者Email', d.issuer?.email || ''],
      ['宛先', d.recipient?.name || ''],
      ['宛先住所', d.recipient?.address || ''],
      ['支払方法', d.payment_method || ''],
      ['備考', d.notes || ''],
      [],
      ['【明細】'],
      ['品名', '数量', '単位', '単価', '金額'],
      ...(d.items || []).map(it => [
        it.description || '', it.quantity ?? '', it.unit || '', it.unit_price ?? '', it.amount ?? ''
      ]),
      [],
      ['', '', '', '小計', d.subtotal ?? ''],
      ['', '', '', `消費税（${d.tax_rate ?? '-'}%）`, d.tax_amount ?? ''],
      ['', '', '', '合計', d.total ?? ''],
    ]
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 22 }, { wch: 10 }, { wch: 8 }, { wch: 16 }, { wch: 16 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '伝票データ')
    XLSX.writeFile(wb, `invoice_${d.invoice_number || 'data'}.xlsx`)
  }

  const headerFields = data ? [
    ['書類種別', data.document_type],
    ['伝票番号', data.invoice_number],
    ['日付', data.date],
    ['支払期限', data.due_date],
    ['発行者', data.issuer?.name],
    ['発行者住所', data.issuer?.address],
    ['発行者TEL', data.issuer?.tel],
    ['発行者Email', data.issuer?.email],
    ['宛先', data.recipient?.name],
    ['宛先住所', data.recipient?.address],
    ['支払方法', data.payment_method],
    ['備考', data.notes],
  ].filter(([, v]) => v) : []

  return (
    <div className="container">
      <header className="site-header">
        <div className="tag">Gemini 2.0 Flash — 完全無料・外部公開版</div>
        <h1>伝票 AI 読み取りツール</h1>
        <p>伝票・領収書・請求書の画像をアップロードするだけで、データを自動抽出してExcel / JSON形式で出力します</p>
      </header>

      {!image ? (
        <div
          className={`upload-zone${drag ? ' drag' : ''}`}
          onDragOver={e => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={e => handleFile(e.target.files[0])}
          />
          <div className="upload-icon">📄</div>
          <h2>画像をドロップ、またはクリックして選択</h2>
          <p>対応形式: JPG, PNG, WEBP / 1ファイルずつ</p>
        </div>
      ) : (
        <div className="preview-wrap">
          <img className="preview-img" src={image.src} alt="伝票プレビュー" />
        </div>
      )}

      {image && (
        <div className="action-bar">
          <button className="btn btn-primary" onClick={analyze} disabled={status === 'loading'}>
            {status === 'loading' ? '解析中...' : 'AIで解析する ↗'}
          </button>
          <button className="btn btn-sm" onClick={reset}>やり直す</button>
        </div>
      )}

      {status === 'loading' && (
        <div className="status-box status-loading">
          <div className="spinner" />
          <span>AIが伝票を解析中です。しばらくお待ちください...</span>
        </div>
      )}
      {status?.error && (
        <div className="status-box status-error">
          ⚠ {status.error}
        </div>
      )}

      {data && (
        <div>
          <div className="tabs">
            {TABS.map(t => (
              <button
                key={t}
                className={`tab-btn${activeTab === t ? ' active' : ''}`}
                onClick={() => setActiveTab(t)}
              >
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>

          {activeTab === 'structured' && (
            <>
              <p className="section-label">基本情報</p>
              <div className="data-grid">
                {headerFields.map(([label, value]) => (
                  <div className="data-card" key={label}>
                    <div className="label">{label}</div>
                    <div className="value">{value}</div>
                  </div>
                ))}
              </div>

              <p className="section-label">明細</p>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>品名</th>
                      <th>数量</th>
                      <th>単位</th>
                      <th className="align-right">単価</th>
                      <th className="align-right">金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.items || []).map((it, i) => (
                      <tr key={i}>
                        <td>{it.description || '-'}</td>
                        <td>{it.quantity ?? '-'}</td>
                        <td>{it.unit || '-'}</td>
                        <td className="align-right">{fmt(it.unit_price)}</td>
                        <td className="align-right">{fmt(it.amount)}</td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td colSpan={4} className="align-right" style={{ color: 'var(--text-muted)', fontSize: 12 }}>小計</td>
                      <td className="align-right">{fmt(data.subtotal)}</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="align-right" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        消費税（{data.tax_rate ?? '-'}%）
                      </td>
                      <td className="align-right">{fmt(data.tax_amount)}</td>
                    </tr>
                    <tr className="total-row">
                      <td colSpan={4} className="align-right" style={{ fontSize: 14 }}>合計</td>
                      <td className="align-right" style={{ fontSize: 16 }}>
                        {fmt(data.total)} {data.currency || ''}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'json' && (
            <div className="json-box">{JSON.stringify(data, null, 2)}</div>
          )}

          <div className="export-bar">
            <button className="btn btn-primary btn-sm" onClick={downloadExcel}>
              Excel でダウンロード
            </button>
            <button className="btn btn-sm" onClick={downloadJson}>
              JSON でダウンロード
            </button>
            <button className="reset-link" onClick={reset}>別の伝票を読み取る</button>
          </div>
        </div>
      )}

      <footer className="site-footer">
        <p>Powered by Google Gemini 2.0 Flash × Next.js × Vercel</p>
      </footer>
    </div>
  )
}
