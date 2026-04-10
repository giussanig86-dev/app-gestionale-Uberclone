import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Printer, Send } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { invoicesApi } from '@/mocks/api/invoicesApi'
import { mockCompanies } from '@/mocks/db/companies'
import type { Invoice } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { useToasts } from '@/store/AppContext'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const { success } = useToasts()

  useEffect(() => {
    if (!id) return
    invoicesApi.getById(id).then((r) => setInvoice(r.data)).finally(() => setLoading(false))
  }, [id])

  if (loading) return <PageLoader />
  if (!invoice) return <div className="text-center py-16 text-gray-500">Fattura non trovata</div>

  const company = mockCompanies[0]
  const costCenterBreakdown = invoice.lineItems.reduce<Record<string, number>>((acc, li) => {
    const cc = company.costCenters.find((c) => c.id === li.costCenterId)
    const key = cc?.name ?? li.costCenterId
    acc[key] = (acc[key] ?? 0) + li.total
    return acc
  }, {})
  const pieData = Object.entries(costCenterBreakdown).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))

  const statusColors = { bozza: 'gray', emessa: 'blue', pagata: 'green', scaduta: 'red', annullata: 'gray' } as const

  const markAsPaid = async () => {
    if (!id) return
    const r = await invoicesApi.update(id, { status: 'pagata' })
    setInvoice(r.data)
    success('Fattura segnata come pagata')
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title={`Fattura ${invoice.invoiceNumber}`}
        breadcrumbs={[{ label: 'Fatturazione', to: '/fatturazione' }, { label: invoice.invoiceNumber }]}
        actions={
          <div className="flex gap-2 no-print">
            {invoice.status === 'emessa' && <Button size="sm" variant="secondary" onClick={markAsPaid}>Segna pagata</Button>}
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              <Printer size={14} /> Stampa
            </Button>
            <Button size="sm" onClick={() => success('Fattura inviata via PEC')}>
              <Send size={14} /> Invia PEC
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Header info */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <p className="text-xs text-gray-500 mb-1">Numero fattura</p>
            <p className="text-xl font-bold text-gray-900">{invoice.invoiceNumber}</p>
            <div className="mt-2"><Badge color={statusColors[invoice.status]} dot>{invoice.status}</Badge></div>
          </Card>
          <Card>
            <p className="text-xs text-gray-500 mb-1">Periodo</p>
            <p className="font-semibold text-gray-900">{formatDate(invoice.periodFrom)} — {formatDate(invoice.periodTo)}</p>
            <p className="text-xs text-gray-500 mt-1">Emessa il {formatDate(invoice.issueDate)} · Scade {formatDate(invoice.dueDate)}</p>
          </Card>
          <Card>
            <p className="text-xs text-gray-500 mb-1">Totale</p>
            <p className="text-2xl font-bold text-brand-700">{formatCurrency(invoice.total)}</p>
            <p className="text-xs text-gray-500 mt-1">di cui IVA {formatCurrency(invoice.vatAmount)}</p>
          </Card>
        </div>

        {/* Line items */}
        <Card padding="none">
          <div className="p-5 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Dettaglio corse</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Data</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Descrizione</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Passeggero</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Imp. netto</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">IVA</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Totale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoice.lineItems.map((li) => (
                <tr key={li.rideId}>
                  <td className="px-5 py-3 text-gray-600">{formatDate(li.date)}</td>
                  <td className="px-5 py-3 text-gray-800">{li.description}</td>
                  <td className="px-5 py-3 text-gray-600">{li.passengerName}</td>
                  <td className="px-5 py-3 text-right text-gray-800">{formatCurrency(li.unitPrice)}</td>
                  <td className="px-5 py-3 text-right text-gray-500">{Math.round(li.vatRate * 100)}%</td>
                  <td className="px-5 py-3 text-right font-medium text-gray-900">{formatCurrency(li.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr>
                <td colSpan={5} className="px-5 py-3 text-right font-semibold text-gray-700">Imponibile</td>
                <td className="px-5 py-3 text-right font-semibold text-gray-900">{formatCurrency(invoice.subtotal)}</td>
              </tr>
              <tr>
                <td colSpan={5} className="px-5 py-3 text-right font-semibold text-gray-700">IVA 22%</td>
                <td className="px-5 py-3 text-right font-semibold text-gray-900">{formatCurrency(invoice.vatAmount)}</td>
              </tr>
              <tr>
                <td colSpan={5} className="px-5 py-3 text-right font-bold text-gray-900 text-base">Totale fattura</td>
                <td className="px-5 py-3 text-right font-bold text-brand-700 text-lg">{formatCurrency(invoice.total)}</td>
              </tr>
            </tfoot>
          </table>
        </Card>

        {/* Cost center chart */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Ripartizione per centro di costo</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {pieData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(val: number) => formatCurrency(val)} />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Dati pagamento</h3>
            <div className="space-y-3 text-sm">
              <Row label="Metodo" value={invoice.paymentMethod === 'bonifico' ? 'Bonifico bancario' : invoice.paymentMethod} />
              {invoice.iban && <Row label="IBAN" value={invoice.iban} />}
              <Row label="Scadenza pagamento" value={formatDate(invoice.dueDate)} />
              {invoice.notes && <div className="pt-3 border-t border-gray-100"><p className="text-gray-500 text-xs">{invoice.notes}</p></div>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  )
}
