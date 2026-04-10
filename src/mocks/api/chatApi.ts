import type { ChatMessage, DriverRating } from '@/types'
import { mockDrivers } from '../db/drivers'

// ─────────────────────────────────────────────────────────────────────────────
// Store in-memory (persiste durante la sessione browser)
// ─────────────────────────────────────────────────────────────────────────────
const messageStore: Record<string, ChatMessage[]> = {}
const ratingStore: DriverRating[] = []

// Auto-risposte realistiche dell'autista
const DRIVER_AUTOREPLIES = [
  'Sono in arrivo, ci vorrò circa 5 minuti 🚗',
  'Ok, capito. A presto!',
  'Sono già in zona, trovo parcheggio e scendo subito.',
  'In che ingresso ti trovo? 📍',
  'Arrivo tra 2 minuti, sono in fondo alla strada.',
  'Ho visto il messaggio, sto arrivando.',
  'Ok, perfetto. Ti aspetto fuori.',
  'Ci sono quasi, ancora un paio di minuti ⏱️',
]

function makeId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

// Messaggio di sistema automatico all'apertura della chat
function initRideChat(rideId: string, driverName: string) {
  if (messageStore[rideId]) return
  messageStore[rideId] = [
    {
      id: makeId(),
      rideId,
      senderId: 'system',
      senderType: 'system',
      senderName: 'Sistema',
      text: `Chat attivata per questa corsa. Puoi comunicare direttamente con ${driverName}.`,
      timestamp: new Date().toISOString(),
      read: true,
    },
    {
      id: makeId(),
      rideId,
      senderId: 'driver',
      senderType: 'driver',
      senderName: driverName,
      text: 'Salve! Sono il vostro autista. Sono in arrivo al punto di raccolta. 👋',
      timestamp: new Date(Date.now() - 60000).toISOString(),
      read: false,
    },
  ]
}

// ─────────────────────────────────────────────────────────────────────────────
// API pubblica
// ─────────────────────────────────────────────────────────────────────────────
export const chatApi = {
  /** Carica (o inizializza) il thread di una corsa */
  getMessages(rideId: string, driverId: string | null): ChatMessage[] {
    if (!messageStore[rideId]) {
      const driver = driverId ? mockDrivers.find((d) => d.id === driverId) : null
      const driverName = driver ? `${driver.firstName} ${driver.lastName}` : 'Autista'
      initRideChat(rideId, driverName)
    }
    return [...(messageStore[rideId] ?? [])]
  },

  /** Invia un messaggio del passeggero e schedula auto-risposta dell'autista */
  sendMessage(
    rideId: string,
    text: string,
    driverId: string | null,
    passengerName: string,
    onAutoReply: (msg: ChatMessage) => void,
  ): ChatMessage {
    const msg: ChatMessage = {
      id: makeId(),
      rideId,
      senderId: 'passenger',
      senderType: 'passenger',
      senderName: passengerName,
      text,
      timestamp: new Date().toISOString(),
      read: true,
    }
    if (!messageStore[rideId]) messageStore[rideId] = []
    messageStore[rideId].push(msg)

    // Auto-risposta autista dopo 1.5–3.5 secondi
    const delay = 1500 + Math.random() * 2000
    const driver = driverId ? mockDrivers.find((d) => d.id === driverId) : null
    const driverName = driver ? `${driver.firstName} ${driver.lastName}` : 'Autista'
    const replyText = DRIVER_AUTOREPLIES[Math.floor(Math.random() * DRIVER_AUTOREPLIES.length)]

    setTimeout(() => {
      const reply: ChatMessage = {
        id: makeId(),
        rideId,
        senderId: driverId ?? 'driver',
        senderType: 'driver',
        senderName: driverName,
        text: replyText,
        timestamp: new Date().toISOString(),
        read: false,
      }
      messageStore[rideId].push(reply)
      onAutoReply(reply)
    }, delay)

    return msg
  },

  /** Segna tutti i messaggi del driver come letti */
  markRead(rideId: string) {
    (messageStore[rideId] ?? []).forEach((m) => { m.read = true })
  },

  /** Conta messaggi non letti (solo dal driver) */
  unreadCount(rideId: string): number {
    return (messageStore[rideId] ?? []).filter((m) => m.senderType === 'driver' && !m.read).length
  },

  /** Salva valutazione corsa */
  submitRating(rating: Omit<DriverRating, 'createdAt'>): DriverRating {
    const r: DriverRating = { ...rating, createdAt: new Date().toISOString() }
    ratingStore.push(r)
    return r
  },

  /** Recupera rating medi di un autista (weighted: corse recenti contano di più) */
  getDriverRating(driverId: string): number | null {
    const ratings = ratingStore.filter((r) => r.driverId === driverId)
    if (ratings.length === 0) return null
    // peso decrescente: la corsa più recente vale 1.0, le più vecchie scalano
    const now = Date.now()
    let weightedSum = 0; let totalWeight = 0
    ratings.forEach((r, i) => {
      const ageMs = now - new Date(r.createdAt).getTime()
      const ageDays = ageMs / 86400000
      const weight = 1 / (1 + ageDays * 0.01) // decadimento esponenziale lento
      weightedSum += r.overall * weight
      totalWeight += weight
    })
    return Math.round((weightedSum / totalWeight) * 10) / 10
  },
}
