import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, AlertTriangle, X, CheckCircle, Upload } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { complianceApi } from '@/mocks/api/complianceApi'
import type { ComplianceAlertSummary, ComplianceDoc } from '@/types'
import { DOC_TYPE_LABELS } from '@/types'
import { DocStatusBadge } from '@/components/ui/Badge'
import { expiryLabel } from '@/utils/documentExpiry'
import { formatDate } from '@/utils/formatters'
import clsx from 'clsx'

export default function CompliancePage() {
  const navigate = useNavigate()
  const [summaries, setSummaries] = useState<ComplianceAlertSummary[]>([])
  const [docs, setDocs] = useState<ComplianceDoc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      complianceApi.getAlertSummary('comp-001'),
      complianceApi.getAll({ companyId: 'comp-001' }),
    ]).then(([s, d]) => {
      setSummaries(s.data)
      setDocs(d.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  const compliant = summaries.filter((s) => s.overallStatus === 'compliant').length
  const warning = summaries.filter((s) => s.overallStatus === 'warning').length
  const nonCompliant = summaries.filter((s) => s.overallStatus === 'non_compliant').length

  const urgentDocs = docs.filter((d) => d.status === 'scaduto' || (d.status === 'in_scadenza' && d.driverId))
  const companyDocs = docs.filter((d) => !d.driverId && !d.vehicleId)
  const vehicleDocs = docs.filter((d) => d.vehicleId && !d.driverId)

  return (
    <div>
      <PageHeader
        title="Compliance Documenti"
        subtitle="Gestione documenti autisti, veicoli e azienda"
        actions={
          <Button onClick={() => navigate('/compliance/upload' as string)}>
            <Upload size={16} /> Carica documento
          </Button>
        }
      />

      {/* Alert banner */}
      {(nonCompliant > 0 || urgentDocs.filter((d) => d.status === 'scaduto').length > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">
              {urgentDocs.filter((d) => d.status === 'scaduto').length} documenti scaduti — azione immediata richiesta
            </p>
            <p className="text-sm text-red-600 mt-0.5">
              {nonCompliant} autist{nonCompliant > 1 ? 'i' : 'a'} con documenti non conformi.
            </p>
          </div>
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard title="Conformi" value={compliant} subtitle="Tutti i documenti validi" icon={CheckCircle} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <StatCard title="In scadenza" value={warning} subtitle="Documenti in scadenza" icon={AlertTriangle} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatCard title="Non conformi" value={nonCompliant} subtitle="Documenti scaduti o mancanti" icon={X} iconColor="text-red-600" iconBg="bg-red-50" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Driver compliance table */}
        <Card className="lg:col-span-2" padding="none">
          <div className="p-5 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Autisti</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Autista</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Stato</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Scaduti</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">In scad.</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Mancanti</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {summaries.map((s) => (
                <tr key={s.driverId} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/compliance/autisti/${s.driverId}`)}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold',
                        s.overallStatus === 'compliant' ? 'bg-emerald-500' :
                        s.overallStatus === 'warning' ? 'bg-amber-500' : 'bg-red-500')}>
                        {s.driverName[0]}
                      </div>
                      <span className="font-medium text-gray-900">{s.driverName}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-center">
                    {s.overallStatus === 'compliant' ? <ShieldCheck size={18} className="text-emerald-500 mx-auto" /> :
                     s.overallStatus === 'warning' ? <AlertTriangle size={18} className="text-amber-500 mx-auto" /> :
                     <X size={18} className="text-red-500 mx-auto" />}
                  </td>
                  <td className="px-3 py-4 text-center">{s.expiredCount > 0 ? <span className="font-bold text-red-600">{s.expiredCount}</span> : <span className="text-gray-400">—</span>}</td>
                  <td className="px-3 py-4 text-center">{s.expiringSoonCount > 0 ? <span className="font-bold text-amber-600">{s.expiringSoonCount}</span> : <span className="text-gray-400">—</span>}</td>
                  <td className="px-3 py-4 text-center">{s.missingCount > 0 ? <span className="font-bold text-gray-600">{s.missingCount}</span> : <span className="text-gray-400">—</span>}</td>
                  <td className="px-5 py-4"><Button variant="ghost" size="sm">Documenti →</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Side: urgent alerts + company docs */}
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" /> Documenti urgenti
            </h3>
            {urgentDocs.length === 0 ? (
              <p className="text-sm text-gray-500">Nessun documento urgente</p>
            ) : (
              <div className="space-y-3">
                {urgentDocs.slice(0, 5).map((doc) => (
                  <div key={doc.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{DOC_TYPE_LABELS[doc.docType]}</p>
                      <p className="text-xs text-gray-500">{expiryLabel(doc.expiryDate)}</p>
                    </div>
                    <DocStatusBadge status={doc.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-900 mb-3">Documenti azienda</h3>
            <div className="space-y-3">
              {companyDocs.map((doc) => (
                <div key={doc.id} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900">{DOC_TYPE_LABELS[doc.docType]}</p>
                    <p className="text-xs text-gray-500">Scade: {formatDate(doc.expiryDate)}</p>
                  </div>
                  <DocStatusBadge status={doc.status} />
                </div>
              ))}
            </div>
          </Card>

          {vehicleDocs.length > 0 && (
            <Card>
              <h3 className="font-semibold text-gray-900 mb-3">Documenti veicoli</h3>
              <div className="space-y-3">
                {vehicleDocs.map((doc) => (
                  <div key={doc.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900">{DOC_TYPE_LABELS[doc.docType]}</p>
                      <p className="text-xs text-gray-500">{expiryLabel(doc.expiryDate)}</p>
                    </div>
                    <DocStatusBadge status={doc.status} />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
