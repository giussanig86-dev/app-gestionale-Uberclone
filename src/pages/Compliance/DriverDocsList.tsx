import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Upload, FileText, Download, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { DocStatusBadge } from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import Modal from '@/components/ui/Modal'
import { complianceApi } from '@/mocks/api/complianceApi'
import { mockDrivers } from '@/mocks/db/drivers'
import type { ComplianceDoc, DocType } from '@/types'
import { DOC_TYPE_LABELS, DOC_ALERT_DAYS } from '@/types'
import { expiryLabel, daysUntilExpiry } from '@/utils/documentExpiry'
import { formatDate } from '@/utils/formatters'
import { useToasts } from '@/store/AppContext'
import clsx from 'clsx'

const ALL_DOC_TYPES: DocType[] = [
  'patente_guida', 'autorizzazione_ncc', 'licenza_taxi', 'idoneita_psicofisica',
  'certificato_penale', 'corso_formazione_ncc', 'durc'
]

export default function DriverDocsPage() {
  const { driverId } = useParams<{ driverId: string }>()
  const navigate = useNavigate()
  const { success, error: showError } = useToasts()
  const [docs, setDocs] = useState<ComplianceDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadModal, setUploadModal] = useState(false)
  const [uploadForm, setUploadForm] = useState({ docType: 'patente_guida' as DocType, docNumber: '', issuedBy: '', issueDate: '', expiryDate: '', notes: '' })
  const [uploading, setUploading] = useState(false)

  const driver = mockDrivers.find((d) => d.id === driverId)

  const loadDocs = () => {
    if (!driverId) return
    complianceApi.getAll({ driverId }).then((r) => setDocs(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { loadDocs() }, [driverId])

  if (loading) return <PageLoader />
  if (!driver) return <div className="text-center py-16 text-gray-500">Autista non trovato</div>

  const docMap: Record<DocType, ComplianceDoc | undefined> = {} as Record<DocType, ComplianceDoc | undefined>
  docs.forEach((d) => { docMap[d.docType] = d })

  const handleUpload = async () => {
    if (!uploadForm.docNumber || !uploadForm.expiryDate) {
      showError('Compila tutti i campi obbligatori')
      return
    }
    setUploading(true)
    try {
      await complianceApi.upload({
        driverId: driverId!,
        companyId: 'comp-001',
        docType: uploadForm.docType,
        docNumber: uploadForm.docNumber,
        issuedBy: uploadForm.issuedBy,
        issueDate: uploadForm.issueDate || new Date().toISOString().split('T')[0],
        expiryDate: uploadForm.expiryDate,
        alertDaysBefore: DOC_ALERT_DAYS[uploadForm.docType],
        notes: uploadForm.notes,
        uploadedBy: 'emp-001',
      })
      success('Documento caricato con successo')
      setUploadModal(false)
      setLoading(true)
      loadDocs()
    } catch {
      showError('Errore durante il caricamento')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title={`Documenti — ${driver.firstName} ${driver.lastName}`}
        breadcrumbs={[{ label: 'Compliance', to: '/compliance' }, { label: `${driver.firstName} ${driver.lastName}` }]}
        actions={
          <Button onClick={() => setUploadModal(true)}>
            <Upload size={16} /> Carica documento
          </Button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Validi', count: docs.filter((d) => d.status === 'valido').length, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'In scadenza', count: docs.filter((d) => d.status === 'in_scadenza').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Scaduti/Mancanti', count: docs.filter((d) => d.status === 'scaduto' || d.status === 'mancante').length, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className={clsx('p-2 rounded-lg', item.bg)}>
              <item.icon size={18} className={item.color} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{item.count}</p>
              <p className="text-xs text-gray-500">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Document cards */}
      <div className="space-y-3">
        {ALL_DOC_TYPES.map((docType) => {
          const doc = docMap[docType]
          const days = doc ? daysUntilExpiry(doc.expiryDate) : null
          return (
            <Card key={docType}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={clsx('p-2 rounded-lg mt-0.5', !doc ? 'bg-gray-100' : doc.status === 'valido' ? 'bg-emerald-50' : doc.status === 'in_scadenza' ? 'bg-amber-50' : 'bg-red-50')}>
                    <FileText size={16} className={!doc ? 'text-gray-400' : doc.status === 'valido' ? 'text-emerald-600' : doc.status === 'in_scadenza' ? 'text-amber-600' : 'text-red-600'} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{DOC_TYPE_LABELS[docType]}</p>
                    {doc ? (
                      <>
                        <p className="text-xs text-gray-500 mt-0.5">N. {doc.docNumber} · Rilasciato da: {doc.issuedBy}</p>
                        <p className={clsx('text-xs font-medium mt-1', days !== null && days < 0 ? 'text-red-600' : days !== null && days <= (DOC_ALERT_DAYS[docType] ?? 30) ? 'text-amber-600' : 'text-gray-500')}>
                          {expiryLabel(doc.expiryDate)}
                        </p>
                        {doc.notes && <p className="text-xs text-gray-400 mt-1 italic">{doc.notes}</p>}
                      </>
                    ) : (
                      <p className="text-xs text-gray-400 mt-0.5">Documento non caricato</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {doc ? (
                    <>
                      <DocStatusBadge status={doc.status} />
                      {doc.fileUrl && (
                        <Button variant="ghost" size="sm"><Download size={14} /></Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => { setUploadForm((f) => ({ ...f, docType })); setUploadModal(true) }}>
                        Aggiorna
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={() => { setUploadForm((f) => ({ ...f, docType })); setUploadModal(true) }}>
                      <Upload size={14} /> Carica
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Upload modal */}
      <Modal open={uploadModal} onClose={() => setUploadModal(false)} title="Carica Documento" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo documento</label>
            <select value={uploadForm.docType} onChange={(e) => setUploadForm((f) => ({ ...f, docType: e.target.value as DocType }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              {ALL_DOC_TYPES.map((t) => <option key={t} value={t}>{DOC_TYPE_LABELS[t]}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numero documento *</label>
              <input value={uploadForm.docNumber} onChange={(e) => setUploadForm((f) => ({ ...f, docNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="es. MI2345678A" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ente emittente</label>
              <input value={uploadForm.issuedBy} onChange={(e) => setUploadForm((f) => ({ ...f, issuedBy: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="es. MCTC Milano" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data emissione</label>
              <input type="date" value={uploadForm.issueDate} onChange={(e) => setUploadForm((f) => ({ ...f, issueDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data scadenza *</label>
              <input type="date" value={uploadForm.expiryDate} onChange={(e) => setUploadForm((f) => ({ ...f, expiryDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <textarea value={uploadForm.notes} onChange={(e) => setUploadForm((f) => ({ ...f, notes: e.target.value }))} rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-brand-400 transition-colors cursor-pointer">
            <Upload size={24} className="text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Trascina il file qui o <span className="text-brand-600 font-medium">sfoglia</span></p>
            <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG · max 10 MB</p>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setUploadModal(false)}>Annulla</Button>
            <Button loading={uploading} onClick={handleUpload}>Salva documento</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
