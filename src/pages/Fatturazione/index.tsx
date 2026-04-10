import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Receipt, Download, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { invoicesApi } from '@/mocks/api/invoicesApi'
import type { Invoice, InvoiceStatus } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: 'green' | 'blue' | 'yellow' | 'red' | 'gray' }> = {
  bozza: { label: 'Bozza', color: 'gray' },
  emessa: { label: 'Emessa', color: 'blue' },
  pagata: { label: 'Pagata', color: 'green' },
  scaduta: { label: 'Scaduta', color: 'red' },
  annullata: { label: 'Annullata', color: 'gray' },
}

function exportCSV(invoices: Invoice[]) {
  const rows = invoices.flatMap((inv) =>
    inv.lineItems.map((li) => [inv.invoiceNumber, formatDate(li.date), li.passengerName, li.description, li.unitPrice.toFixed(2), inv.status])
  )
  const csv = ['Numero,Data,Passeggero,Descrizione,Importo,Stato', ...rows.map((r) => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'fatture.csv'; a.click()
  URL.revokeObjectURL(url)
}

export default function FatturazionePage() {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'tutti'>('tutti')

  useEffect(() => {
    invoicesApi.getAll({ companyId: 'comp-001' }).then((r) => setInvoices(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  const filtered = statusFilter === 'tutti' ? invoices : invoices.filter((i) => i.status === statusFilter)
  const totalFatturato = invoices.reduce((s, i) => s + i.total, 0)
  const totalPagato = invoices.filter((i) => i.status === 'pagata').reduce((s, i) => s + i.total, 0)
  const totalScaduto = invoices.filter((i) => i.status === 'scaduta').reduce((s, i) => s + i.total, 0)

  return (
    <div>
      <PageHeader
        title="Fatturazione B2B"
        subtitle={`${invoices.length} fatture`}
        actions={
          <Button variant="outline" size="sm" onClick={() => exportCSV(invoices)}>
            <Download size={14} /> Esporta CSV
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard title="Totale fatturato" value={formatCurrency(totalFatturato)} icon={Receipt} iconColor="text-brand-500" iconBg="bg-brand-50" />
        <StatCard title="Incassato" value={formatCurrency(totalPagato)} icon={CheckCircle} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <StatCard title="Scaduto" value={formatCurrency(totalScaduto)} icon={AlertCircle} iconColor="text-red-600" iconBg="bg-red-50" />
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(['tutti', 'emessa', 'pagata', 'scaduta', 'bozza'] as const).map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${statusFilter === s ? 'bg-brand-500 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
            {s === 'tutti' ? 'Tutte' : STATUS_CONFIG[s as InvoiceStatus]?.label ?? s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Receipt} title="Nessuna fattura" description="Nessuna fattura corrisponde ai filtri selezionati" />
      ) : (
        <Card padding="none">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Numero</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Periodo</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Emissione</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Scadenza</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Totale</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Stato</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((inv) => {
                const cfg = STATUS_CONFIG[inv.status]
                return (
                  <tr key={inv.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/fatturazione/${inv.id}`)}>
                    <td className="px-5 py-4 font-medium text-gray-900">{inv.invoiceNumber}</td>
                    <td className="px-5 py-4 text-gray-600">{formatDate(inv.periodFrom)} — {formatDate(inv.periodTo)}</td>
                    <td className="px-5 py-4 text-gray-600">{formatDate(inv.issueDate)}</td>
                    <td className="px-5 py-4 text-gray-600">{formatDate(inv.dueDate)}</td>
                    <td className="px-5 py-4 text-right font-bold text-gray-900">{formatCurrency(inv.total)}</td>
                    <td className="px-5 py-4"><Badge color={cfg.color} dot>{cfg.label}</Badge></td>
                    <td className="px-5 py-4"><Button variant="ghost" size="sm">Apri</Button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
