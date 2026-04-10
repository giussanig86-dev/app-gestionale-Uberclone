/**
 * invoicesRestPlugin — Vite dev-server middleware
 *
 * Espone endpoint REST HTTP per la fatturazione, richiamabili dall'App Gestionale 2
 * o da qualsiasi client esterno durante lo sviluppo.
 *
 * Base URL: http://localhost:5173/api/fatture
 *
 * Endpoints:
 *   GET    /api/fatture                  — lista fatture (query: companyId, status, from, to, costCenter, page, perPage)
 *   GET    /api/fatture/:id              — singola fattura con line items
 *   POST   /api/fatture                  — crea nuova fattura
 *   PUT    /api/fatture/:id/stato        — aggiorna stato { status }
 *   GET    /api/fatture/:id/export       — export (?format=csv|xml)
 */

import type { Plugin } from 'vite'
import { mockInvoices } from '../db/invoices'
import type { Invoice, InvoiceStatus } from '../../types/invoice'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Req = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Res = any

// ─── Store in-memory (persiste durante la sessione dev server) ────────────────
let store: Invoice[] = [...mockInvoices]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setCommonHeaders(res: Res, contentType = 'application/json') {
  res.setHeader('Content-Type', `${contentType}; charset=utf-8`)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('X-Powered-By', 'GestionaleUberClone/1.0')
}

function json(res: Res, status: number, body: unknown) {
  setCommonHeaders(res)
  res.statusCode = status
  res.end(JSON.stringify(body, null, 2))
}

function parseBody(req: Req): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk: unknown) => { raw += String(chunk) })
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}) }
      catch { reject(new Error('JSON non valido')) }
    })
    req.on('error', reject)
  })
}

function makeId() {
  return `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

// ─── Generatori export ────────────────────────────────────────────────────────

function toCsv(invoice: Invoice): string {
  const header = 'Numero Fattura,Data Emissione,Scadenza,Stato,Imponibile,IVA 22%,Totale EUR,Passeggero,Descrizione,Corsa ID'
  const lines = invoice.lineItems.map((li) =>
    [
      invoice.invoiceNumber,
      invoice.issueDate,
      invoice.dueDate,
      invoice.status,
      invoice.subtotal.toFixed(2),
      invoice.vatAmount.toFixed(2),
      invoice.total.toFixed(2),
      `"${li.passengerName}"`,
      `"${li.description.replace(/"/g, '""')}"`,
      li.rideId,
    ].join(',')
  )
  return [header, ...lines].join('\r\n')
}

function escXml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function toXml(invoice: Invoice): string {
  const lines = invoice.lineItems.map((li, i) => `
    <DettaglioLinee>
      <NumeroLinea>${i + 1}</NumeroLinea>
      <Descrizione>${escXml(li.description)}</Descrizione>
      <Quantita>${li.quantity.toFixed(2)}</Quantita>
      <PrezzoUnitario>${li.unitPrice.toFixed(2)}</PrezzoUnitario>
      <AliquotaIVA>${(li.vatRate * 100).toFixed(2)}</AliquotaIVA>
      <PrezzoTotale>${li.total.toFixed(2)}</PrezzoTotale>
      <RiferimentoCorsa>${escXml(li.rideId)}</RiferimentoCorsa>
      <CentroDiCosto>${escXml(li.costCenterId)}</CentroDiCosto>
      <Passeggero>${escXml(li.passengerName)}</Passeggero>
      <Data>${li.date}</Data>
    </DettaglioLinee>`).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<FatturaElettronica versione="FPR12"
  xmlns="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2">
  <FatturaElettronicaHeader>
    <CedentePrestatore>
      <DatiAnagrafici>
        <Anagrafica><Denominazione>NCC Service Srl</Denominazione></Anagrafica>
      </DatiAnagrafici>
    </CedentePrestatore>
    <CessionarioCommittente>
      <DatiAnagrafici>
        <Anagrafica><Denominazione>Azienda Cliente</Denominazione></Anagrafica>
      </DatiAnagrafici>
      <SedeFiscale><IdFiscaleIVA>IT${invoice.companyId.replace('comp-', '').padStart(11, '0')}</IdFiscaleIVA></SedeFiscale>
    </CessionarioCommittente>
  </FatturaElettronicaHeader>
  <FatturaElettronicaBody>
    <DatiGenerali>
      <DatiGeneraliDocumento>
        <TipoDocumento>TD01</TipoDocumento>
        <Divisa>${invoice.currency}</Divisa>
        <Data>${invoice.issueDate}</Data>
        <Numero>${escXml(invoice.invoiceNumber)}</Numero>
        <ImportoTotaleDocumento>${invoice.total.toFixed(2)}</ImportoTotaleDocumento>
        ${invoice.notes ? `<Causale>${escXml(invoice.notes)}</Causale>` : ''}
      </DatiGeneraliDocumento>
    </DatiGenerali>
    <DatiBeniServizi>${lines}
      <DatiRiepilogo>
        <AliquotaIVA>22.00</AliquotaIVA>
        <ImponibileImporto>${invoice.subtotal.toFixed(2)}</ImponibileImporto>
        <Imposta>${invoice.vatAmount.toFixed(2)}</Imposta>
        <EsigibilitaIVA>I</EsigibilitaIVA>
      </DatiRiepilogo>
    </DatiBeniServizi>
    <DatiPagamento>
      <CondizioniPagamento>TP02</CondizioniPagamento>
      <DettaglioPagamento>
        <ModalitaPagamento>${invoice.paymentMethod === 'bonifico' ? 'MP05' : invoice.paymentMethod === 'carta' ? 'MP08' : 'MP19'}</ModalitaPagamento>
        <DataScadenzaPagamento>${invoice.dueDate}</DataScadenzaPagamento>
        <ImportoPagamento>${invoice.total.toFixed(2)}</ImportoPagamento>
        ${invoice.iban ? `<IBAN>${escXml(invoice.iban)}</IBAN>` : ''}
      </DettaglioPagamento>
    </DatiPagamento>
  </FatturaElettronicaBody>
</FatturaElettronica>`
}

// ─── Route handler ────────────────────────────────────────────────────────────

async function handleRequest(req: Req, res: Res): Promise<boolean> {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
  const pathname = url.pathname
  const method = req.method?.toUpperCase() ?? 'GET'

  // CORS preflight
  if (method === 'OPTIONS' && pathname.startsWith('/api/fatture')) {
    setCommonHeaders(res)
    res.statusCode = 204
    res.end()
    return true
  }

  // GET /api/fatture
  if (method === 'GET' && pathname === '/api/fatture') {
    const q = url.searchParams
    let filtered = [...store]

    const companyId = q.get('companyId')
    if (companyId) filtered = filtered.filter((i) => i.companyId === companyId)

    const status = q.get('status') as InvoiceStatus | null
    if (status) filtered = filtered.filter((i) => i.status === status)

    const from = q.get('from')
    if (from) filtered = filtered.filter((i) => i.issueDate >= from)

    const to = q.get('to')
    if (to) filtered = filtered.filter((i) => i.issueDate <= to)

    const costCenter = q.get('costCenter')
    if (costCenter) filtered = filtered.filter((i) =>
      i.lineItems.some((li) => li.costCenterId === costCenter)
    )

    const total = filtered.length
    const page = Math.max(1, parseInt(q.get('page') ?? '1', 10))
    const perPage = Math.min(100, Math.max(1, parseInt(q.get('perPage') ?? '20', 10)))
    const totalPages = Math.ceil(total / perPage)
    const data = filtered.slice((page - 1) * perPage, page * perPage)

    json(res, 200, { data, meta: { total, page, perPage, totalPages } })
    return true
  }

  // GET /api/fatture/:id/export
  const exportMatch = pathname.match(/^\/api\/fatture\/([^/]+)\/export$/)
  if (method === 'GET' && exportMatch) {
    const invoice = store.find((i) => i.id === exportMatch[1])
    if (!invoice) { json(res, 404, { error: 'Fattura non trovata' }); return true }

    const format = url.searchParams.get('format') ?? 'csv'
    if (format === 'xml') {
      setCommonHeaders(res, 'application/xml')
      res.setHeader('Content-Disposition', `attachment; filename="fattura-${invoice.invoiceNumber.replace('/', '-')}.xml"`)
      res.statusCode = 200
      res.end(toXml(invoice))
    } else {
      setCommonHeaders(res, 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="fattura-${invoice.invoiceNumber.replace('/', '-')}.csv"`)
      res.statusCode = 200
      res.end(toCsv(invoice))
    }
    return true
  }

  // PUT /api/fatture/:id/stato
  const statoMatch = pathname.match(/^\/api\/fatture\/([^/]+)\/stato$/)
  if (method === 'PUT' && statoMatch) {
    const idx = store.findIndex((i) => i.id === statoMatch[1])
    if (idx === -1) { json(res, 404, { error: 'Fattura non trovata' }); return true }
    try {
      const body = await parseBody(req) as { status?: InvoiceStatus }
      const validStatuses: InvoiceStatus[] = ['bozza', 'emessa', 'pagata', 'scaduta', 'annullata']
      if (!body.status || !validStatuses.includes(body.status)) {
        json(res, 400, { error: 'Status non valido. Valori ammessi: ' + validStatuses.join(', ') })
        return true
      }
      store[idx] = { ...store[idx], status: body.status }
      json(res, 200, { data: store[idx] })
    } catch {
      json(res, 400, { error: 'Body JSON non valido' })
    }
    return true
  }

  // GET /api/fatture/:id
  const idMatch = pathname.match(/^\/api\/fatture\/([^/]+)$/)
  if (method === 'GET' && idMatch) {
    const invoice = store.find((i) => i.id === idMatch[1])
    if (!invoice) { json(res, 404, { error: 'Fattura non trovata' }); return true }
    json(res, 200, { data: invoice })
    return true
  }

  // POST /api/fatture
  if (method === 'POST' && pathname === '/api/fatture') {
    try {
      const body = await parseBody(req) as Partial<Invoice>
      const now = new Date().toISOString().split('T')[0]
      const newInvoice: Invoice = {
        id: makeId(),
        invoiceNumber: body.invoiceNumber ?? `IMPORT-${Date.now()}`,
        companyId: body.companyId ?? 'comp-001',
        status: body.status ?? 'bozza',
        issueDate: body.issueDate ?? now,
        dueDate: body.dueDate ?? now,
        periodFrom: body.periodFrom ?? now,
        periodTo: body.periodTo ?? now,
        lineItems: body.lineItems ?? [],
        subtotal: body.subtotal ?? 0,
        vatAmount: body.vatAmount ?? 0,
        total: body.total ?? 0,
        currency: 'EUR',
        paymentMethod: body.paymentMethod ?? 'bonifico',
        iban: body.iban,
        notes: body.notes ?? '',
        pdfUrl: body.pdfUrl,
      }
      store.push(newInvoice)
      json(res, 201, { data: newInvoice })
    } catch {
      json(res, 400, { error: 'Body JSON non valido' })
    }
    return true
  }

  return false
}

// ─── Plugin export ────────────────────────────────────────────────────────────

export function invoicesRestPlugin(): Plugin {
  return {
    name: 'invoices-rest-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const handled = await handleRequest(req, res).catch((err) => {
          console.error('[invoicesRestPlugin]', err)
          return false
        })
        if (!handled) next()
      })
    },
  }
}
