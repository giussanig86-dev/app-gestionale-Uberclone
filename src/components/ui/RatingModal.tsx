import { useState } from 'react'
import { Star } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'
import { chatApi } from '@/mocks/api/chatApi'
import { useToasts } from '@/store/AppContext'
import clsx from 'clsx'

interface RatingModalProps {
  open: boolean
  onClose: () => void
  rideId: string
  driverId: string
  driverName: string
  passengerId: string
}

const CRITERIA = [
  { key: 'punctuality' as const, label: 'Puntualità' },
  { key: 'cleanliness' as const, label: 'Pulizia veicolo' },
  { key: 'courtesy' as const, label: 'Cortesia' },
]

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={24}
            className={clsx(
              'transition-colors',
              (hover || value) >= n ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
            )}
          />
        </button>
      ))}
    </div>
  )
}

export default function RatingModal({
  open,
  onClose,
  rideId,
  driverId,
  driverName,
  passengerId,
}: RatingModalProps) {
  const { success } = useToasts()
  const [overall, setOverall] = useState(0)
  const [punctuality, setPunctuality] = useState(0)
  const [cleanliness, setCleanliness] = useState(0)
  const [courtesy, setCourtesy] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const criteriaSetters = { punctuality: setPunctuality, cleanliness: setClean, courtesy: setCourtesy }

  function setClean(v: number) { setCleanliness(v) }

  const handleSubmit = async () => {
    if (overall === 0) return
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 600)) // simula invio
    chatApi.submitRating({
      rideId,
      driverId,
      passengerId,
      overall,
      punctuality: punctuality || overall,
      cleanliness: cleanliness || overall,
      courtesy: courtesy || overall,
      comment,
    })
    success(`Grazie per la valutazione di ${driverName}!`)
    setSubmitting(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={`Valuta ${driverName}`} size="sm">
      <div className="space-y-5">
        {/* Overall */}
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-3">Valutazione complessiva</p>
          <div className="flex justify-center">
            <StarPicker value={overall} onChange={setOverall} />
          </div>
          {overall > 0 && (
            <p className="text-sm font-medium text-gray-700 mt-2">
              {['', 'Pessimo', 'Scarso', 'Nella media', 'Buono', 'Eccellente'][overall]}
            </p>
          )}
        </div>

        {/* Criteri dettagliati */}
        <div className="space-y-3 border-t border-gray-100 pt-4">
          {CRITERIA.map(({ key, label }) => {
            const val = key === 'punctuality' ? punctuality : key === 'cleanliness' ? cleanliness : courtesy
            const setter = key === 'punctuality' ? setPunctuality : key === 'cleanliness' ? setCleanliness : setCourtesy
            return (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{label}</span>
                <StarPicker value={val} onChange={setter} />
              </div>
            )
          })}
        </div>

        {/* Commento */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Aggiungi un commento (facoltativo)..."
          rows={2}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
        />

        <div className="flex gap-3 justify-end pt-1">
          <Button variant="outline" onClick={onClose}>Salta</Button>
          <Button
            loading={submitting}
            disabled={overall === 0}
            onClick={handleSubmit}
          >
            Invia valutazione
          </Button>
        </div>
      </div>
    </Modal>
  )
}
