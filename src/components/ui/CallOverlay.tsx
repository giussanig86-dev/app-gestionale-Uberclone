import { useEffect, useRef, useState } from 'react'
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import clsx from 'clsx'

type CallState = 'connecting' | 'ringing' | 'active' | 'ended'

interface CallOverlayProps {
  open: boolean
  onClose: () => void
  driverName: string
  driverPhone: string   // tel: link per chiamata reale su mobile
  vehiclePlate: string
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function CallOverlay({
  open,
  onClose,
  driverName,
  driverPhone,
  vehiclePlate,
}: CallOverlayProps) {
  const [state, setState] = useState<CallState>('connecting')
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(false)
  const [speakerOn, setSpeakerOn] = useState(true)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!open) { setState('connecting'); setDuration(0); return }

    // Simula: connecting → ringing (1s) → active (3s)
    const t1 = setTimeout(() => setState('ringing'), 1000)
    const t2 = setTimeout(() => setState('active'), 3500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [open])

  useEffect(() => {
    if (state === 'active') {
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [state])

  const handleHangUp = () => {
    setState('ended')
    if (timerRef.current) clearInterval(timerRef.current)
    setTimeout(onClose, 1500)
  }

  if (!open) return null

  const stateLabel: Record<CallState, string> = {
    connecting: 'Connessione in corso...',
    ringing: 'Chiamata in corso...',
    active: formatDuration(duration),
    ended: 'Chiamata terminata',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="relative w-full max-w-sm mx-4 rounded-3xl overflow-hidden bg-gradient-to-b from-brand-900 to-brand-950 shadow-2xl">

        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute border border-white rounded-full"
              style={{
                width: `${(i + 1) * 120}px`,
                height: `${(i + 1) * 120}px`,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                animation: state === 'ringing' || state === 'active'
                  ? `ping ${1.5 + i * 0.3}s cubic-bezier(0,0,0.2,1) infinite`
                  : 'none',
              }}
            />
          ))}
        </div>

        <div className="relative p-8 flex flex-col items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className={clsx(
              'w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white',
              state === 'active' ? 'bg-emerald-500' : 'bg-brand-600',
            )}>
              {driverName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            {(state === 'ringing') && (
              <span className="absolute inset-0 rounded-full bg-brand-400 animate-ping opacity-40" />
            )}
          </div>

          {/* Info */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">{driverName}</h2>
            <p className="text-brand-300 text-sm mt-1">{vehiclePlate}</p>
            <p className={clsx(
              'text-sm font-medium mt-2 tabular-nums',
              state === 'active' ? 'text-emerald-400' :
              state === 'ended' ? 'text-red-400' : 'text-brand-200'
            )}>
              {stateLabel[state]}
            </p>
          </div>

          {/* Pulsante chiamata reale (mobile) */}
          {state !== 'ended' && (
            <a
              href={`tel:${driverPhone}`}
              className="text-xs text-brand-300 hover:text-white underline underline-offset-2 transition-colors"
            >
              Apri telefono → {driverPhone}
            </a>
          )}

          {/* Controlli */}
          {state !== 'ended' && (
            <div className="flex items-center gap-6 mt-2">
              {/* Mute */}
              <button
                onClick={() => setMuted((m) => !m)}
                className={clsx(
                  'w-14 h-14 rounded-full flex items-center justify-center transition-all',
                  muted ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
                )}
              >
                {muted ? <MicOff size={22} /> : <Mic size={22} />}
              </button>

              {/* Hang up */}
              <button
                onClick={handleHangUp}
                className="w-18 h-18 w-[72px] h-[72px] rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg shadow-red-900/40 active:scale-95"
              >
                <PhoneOff size={28} />
              </button>

              {/* Speaker */}
              <button
                onClick={() => setSpeakerOn((s) => !s)}
                className={clsx(
                  'w-14 h-14 rounded-full flex items-center justify-center transition-all',
                  speakerOn ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-amber-500 text-white'
                )}
              >
                {speakerOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
              </button>
            </div>
          )}

          {state === 'ended' && (
            <div className="flex flex-col items-center gap-2">
              <PhoneOff size={36} className="text-red-400" />
              <p className="text-brand-300 text-sm">Durata: {formatDuration(duration)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
