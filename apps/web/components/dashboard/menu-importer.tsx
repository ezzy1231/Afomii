'use client'

import { useState } from 'react'
import { FileText, ImagePlus, LoaderCircle, Plus, Trash2, Upload } from 'lucide-react'
import { importMenuItems } from '@/app/dashboard/actions'

const CATEGORIES = ['Appetizers', 'Mains', 'Grills', 'Drinks', 'Desserts', 'General']

type DraftItem = { key: string; name: string; price: string; category: string }
type PDFDocument = {
  numPages: number
  getPage: (page: number) => Promise<{
    getTextContent: () => Promise<{ items: Array<{ str?: string; transform?: number[] }> }>
    getViewport: (options: { scale: number }) => { width: number; height: number }
    render: (options: { canvas: HTMLCanvasElement; canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => { promise: Promise<void> }
  }>
}

const MAX_BYTES = 12 * 1024 * 1024
const MAX_PDF_PAGES = 6

function newKey() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
}

function parseMenuText(rawText: string): DraftItem[] {
  const rows: DraftItem[] = []
  let category = 'General'
  const priceAtEnd = /^(.*?)(?:\s*(?:ETB|Birr|Br\.?))?\s+([\d]{1,3}(?:[, ]\d{3})*(?:\.\d{1,2})?)\s*(?:ETB|Birr|Br\.?)?$/i

  for (const rawLine of rawText.split(/\r?\n/)) {
    const line = rawLine.replace(/[•|]/g, ' ').replace(/\s+/g, ' ').trim()
    if (!line) continue
    const heading = CATEGORIES.find((value) => value.toLowerCase() === line.toLowerCase())
    if (heading) {
      category = heading
      continue
    }
    const match = line.match(priceAtEnd)
    if (!match) continue
    const name = match[1].replace(/[-–—:]+$/g, '').trim()
    const price = Number(match[2].replace(/[ ,]/g, ''))
    if (name.length < 2 || !Number.isFinite(price) || price > 1_000_000) continue
    rows.push({ key: newKey(), name, price: String(price), category })
  }
  return rows.slice(0, 100)
}

async function readPDF(file: File, languages: string[], onProgress: (message: string) => void) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
  const bytes = new Uint8Array(await file.arrayBuffer())
  const pdfDocument = await pdfjs.getDocument({ data: bytes }).promise as unknown as PDFDocument
  if (pdfDocument.numPages > MAX_PDF_PAGES) throw new Error(`This PDF has ${pdfDocument.numPages} pages. Use a PDF with ${MAX_PDF_PAGES} pages or fewer.`)

  const pages: Array<{ page: Awaited<ReturnType<PDFDocument['getPage']>>; text: string }> = []
  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
    onProgress(`Reading PDF page ${pageNumber} of ${pdfDocument.numPages}…`)
    const page = await pdfDocument.getPage(pageNumber)
    const content = await page.getTextContent()
    const lines: Array<{ y: number; text: string }> = []
    for (const item of content.items) {
      const text = item.str?.trim()
      if (!text) continue
      const y = item.transform?.[5]
      if (typeof y !== 'number') {
        lines.push({ y: Number.NaN, text })
        continue
      }
      const line = lines.find((candidate) => Number.isFinite(candidate.y) && Math.abs(candidate.y - y) <= 2)
      if (line) line.text += ` ${text}`
      else lines.push({ y, text })
    }
    pages.push({ page, text: lines.sort((a, b) => b.y - a.y).map((line) => line.text).join('\n') })
  }

  const digitalText = pages.map((page) => page.text).join('\n')
  if (digitalText.replace(/\s/g, '').length >= 24) return digitalText

  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker(languages, 1, {
    logger: (event) => {
      if (event.status === 'recognizing text') onProgress(`Reading menu text… ${Math.round(event.progress * 100)}%`)
    },
  })
  try {
    const recognized: string[] = []
    for (let index = 0; index < pages.length; index += 1) {
      onProgress(`Scanning PDF page ${index + 1} of ${pages.length}…`)
      const page = pages[index].page
      const viewport = page.getViewport({ scale: 2 })
      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Could not prepare the PDF page for scanning.')
      await page.render({ canvas, canvasContext: context, viewport }).promise
      const result = await worker.recognize(canvas)
      recognized.push(result.data.text)
      canvas.width = 0
      canvas.height = 0
    }
    return recognized.join('\n')
  } finally {
    await worker.terminate()
  }
}

async function readImage(file: File, languages: string[], onProgress: (message: string) => void) {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker(languages, 1, {
    logger: (event) => {
      if (event.status === 'recognizing text') onProgress(`Reading menu text… ${Math.round(event.progress * 100)}%`)
    },
  })
  try {
    return (await worker.recognize(file)).data.text
  } finally {
    await worker.terminate()
  }
}

export function MenuImporter({ branchId, onImported }: { branchId: string | null; onImported: () => Promise<void> }) {
  const [items, setItems] = useState<DraftItem[]>([])
  const [working, setWorking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState('')
  const [language, setLanguage] = useState('eng')
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  async function convert(file?: File) {
    if (!file) return
    setMessage(null)
    setItems([])
    if (file.size > MAX_BYTES) {
      setMessage({ ok: false, text: 'Choose a file under 12 MB.' })
      return
    }
    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    const isImage = file.type.startsWith('image/') && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
    if (!isPDF && !isImage) {
      setMessage({ ok: false, text: 'Use a PDF, JPG, PNG, or WebP menu file.' })
      return
    }

    setWorking(true)
    setProgress('Preparing file…')
    try {
      const languages = language.split('+')
      const text = isPDF ? await readPDF(file, languages, setProgress) : await readImage(file, languages, setProgress)
      const parsed = parseMenuText(text)
      setItems(parsed)
      setMessage(parsed.length
        ? { ok: true, text: `Found ${parsed.length} possible menu items. Review every name and price before saving.` }
        : { ok: false, text: 'No item-and-price pairs were detected. Try a clearer file or add items manually.' })
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Could not read this menu file.' })
    } finally {
      setWorking(false)
      setProgress('')
    }
  }

  async function save() {
    if (!branchId || !items.length || saving) return
    setSaving(true)
    setMessage(null)
    const result = await importMenuItems(branchId, items.map(({ name, price, category }) => ({ name, price: Number(price), category })))
    setMessage({ ok: result.ok, text: result.message })
    if (result.ok) {
      setItems([])
      await onImported()
    }
    setSaving(false)
  }

  return (
    <section className="glass rounded-2xl p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ember/12 text-ember"><FileText className="size-5" /></span>
        <div>
          <h2 className="text-lg font-bold text-app-fg">Import from PDF or photo</h2>
          <p className="mt-1 text-sm text-app-muted">We extract likely item names and prices into a draft you can correct before adding.</p>
        </div>
      </div>

      <label className="mt-4 flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-app-border bg-app-input/50 px-4 text-sm font-semibold text-app-fg hover:border-ember/50">
        {working ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}
        {working ? progress || 'Reading menu…' : 'Choose PDF or menu photo'}
        <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp,.pdf" className="sr-only" disabled={working} onChange={(event) => { void convert(event.target.files?.[0]); event.currentTarget.value = '' }} />
      </label>
      <label className="mt-3 block text-xs font-semibold text-app-muted">OCR language
        <select value={language} onChange={(event) => setLanguage(event.target.value)} disabled={working} className="ml-2 min-h-9 rounded-lg border border-app-border bg-app-input px-3 text-xs font-medium text-app-fg">
          <option value="eng">English</option>
          <option value="amh">Amharic</option>
          <option value="eng+amh">English + Amharic</option>
        </select>
      </label>
      <p className="mt-2 text-xs text-app-muted">Up to 12 MB and 6 PDF pages. Processing happens in your browser; the source file is not uploaded or saved.</p>

      {items.length > 0 && (
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-app-fg">Review extracted items</h3>
            <button type="button" onClick={() => setItems((rows) => [...rows, { key: newKey(), name: '', price: '', category: 'General' }])} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-3 text-xs font-semibold text-ember hover:bg-ember/10"><Plus className="size-3.5" /> Add row</button>
          </div>
          {items.map((item) => (
            <div key={item.key} className="grid gap-2 rounded-xl border border-app-border p-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(100px,.5fr)_minmax(130px,.7fr)_40px]">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-app-muted">Name<input value={item.name} onChange={(event) => setItems((rows) => rows.map((row) => row.key === item.key ? { ...row, name: event.target.value } : row))} className="mt-1 min-h-10 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm font-medium normal-case tracking-normal text-app-fg" /></label>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-app-muted">Price (ETB)<input type="number" min="0" step="0.01" value={item.price} onChange={(event) => setItems((rows) => rows.map((row) => row.key === item.key ? { ...row, price: event.target.value } : row))} className="mt-1 min-h-10 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm font-medium normal-case tracking-normal text-app-fg" /></label>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-app-muted">Category<select value={item.category} onChange={(event) => setItems((rows) => rows.map((row) => row.key === item.key ? { ...row, category: event.target.value } : row))} className="mt-1 min-h-10 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm font-medium normal-case tracking-normal text-app-fg">{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
              <button type="button" onClick={() => setItems((rows) => rows.filter((row) => row.key !== item.key))} aria-label={`Remove ${item.name || 'menu item'}`} className="mt-4 flex size-10 items-center justify-center rounded-lg text-app-muted hover:bg-danger/10 hover:text-danger"><Trash2 className="size-4" /></button>
            </div>
          ))}
          <button type="button" onClick={() => void save()} disabled={!branchId || saving || items.some((item) => item.name.trim().length < 2 || !item.price || Number(item.price) < 0)} className="min-h-11 w-full rounded-xl bg-ember px-5 text-sm font-semibold text-on-accent disabled:opacity-50">
            {saving ? 'Adding items…' : `Add ${items.length} item${items.length === 1 ? '' : 's'} to this branch`}
          </button>
        </div>
      )}

      {message && <p role="status" aria-live="polite" className={`mt-4 rounded-xl border px-4 py-3 text-sm ${message.ok ? 'border-success/25 bg-success/10 text-success' : 'border-danger/25 bg-danger/10 text-danger'}`}>{message.text}</p>}
      {!items.length && <p className="mt-3 flex items-center gap-2 text-xs text-app-muted"><ImagePlus className="size-3.5" /> Extracted content stays editable until you add it to the menu.</p>}
    </section>
  )
}
