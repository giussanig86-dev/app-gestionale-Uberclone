import { useEffect, useRef, useState } from 'react'
import { X, Send, Phone, MessageCircle } from 'lucide-react'
import { chatApi } from '@/mocks/api/chatApi'
import type { ChatMessage } from '@/types'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import clsx from 'clsx'

interface ChatDrawerProps {
  open: boolean
  onClose: () => void
  rideId: string
  driverId: string | null
  driverName: string
  passengerName: string
  onCallRequest: () => void
}

function formatMsgTime(ts: string) {
  try { return format(parseISO(ts), 'HH:mm', { locale: it }) } catch { return '' }
}

function groupByDate(messages: ChatMessage[]): { dateLabel: string; msgs: ChatMessage[] }[] {
  const groups: Record<string, ChatMessage[]> = {}
  messages.forEach((m) => {
    const key = m.timestamp.split('T')[0]
    if (!groups[key]) groups[key] = []
    groups[key].push(m)
  })
  return Object.entries(groups).map(([date, msgs]) => ({
    dateLabel: format(parseISO(date), 'EEEE d MMMM', { locale: it }),
    msgs,
  }))
}

export default function ChatDrawer({
  open,
  onClose,
  rideId,
  driverId,
  driverName,
  passengerName,
  onCallRequest,
}: ChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [driverTyping, setDriverTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Carica messaggi quando si apre
  useEffect(() => {
    if (!open) return
    const msgs = chatApi.getMessages(rideId, driverId)
    setMessages(msgs)
    chatApi.markRead(rideId)
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [open, rideId, driverId])

  // Scroll automatico al fondo
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, driverTyping])

  const handleSend = () => {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setInput('')

    const msg = chatApi.sendMessage(rideId, text, driverId, passengerName, (reply) => {
      setDriverTyping(false)
      setMessages((prev) => [...prev, reply])
      chatApi.markRead(rideId)
    })
    setMessages((prev) => [...prev, msg])

    // Mostra "sta scrivendo..." durante il delay dell'auto-risposta
    setTimeout(() => setDriverTyping(true), 400)
    setSending(false)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const groups = groupByDate(messages)

  return (
    <>
      {/* Backdrop */}
      {open && <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />}

      {/* Drawer */}
      <div className={clsx(
        'fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300',
        open ? 'translate-x-0' : 'translate-x-full'
      )}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-brand-900 text-white flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center font-bold text-sm flex-shrink-0">
            {driverName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{driverName}</p>
            <p className="text-xs text-brand-300">
              {driverTyping ? (
                <span className="flex items-center gap-1">
                  <span className="flex gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1 h-1 bg-brand-300 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </span>
                  sta scrivendo...
                </span>
              ) : (
                'Autista'
              )}
            </p>
          </div>
          <button
            onClick={onCallRequest}
            className="p-2 rounded-full hover:bg-brand-800 transition-colors"
            title="Avvia chiamata"
          >
            <Phone size={18} />
          </button>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-brand-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-gray-50">
          {groups.map(({ dateLabel, msgs }) => (
            <div key={dateLabel}>
              {/* Date separator */}
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 capitalize">{dateLabel}</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {msgs.map((msg) => {
                if (msg.senderType === 'system') {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full max-w-xs text-center">
                        {msg.text}
                      </span>
                    </div>
                  )
                }

                const isOwn = msg.senderType === 'passenger'
                return (
                  <div key={msg.id} className={clsx('flex mb-1', isOwn ? 'justify-end' : 'justify-start')}>
                    {!isOwn && (
                      <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">
                        {driverName[0]}
                      </div>
                    )}
                    <div className={clsx(
                      'max-w-[75%] rounded-2xl px-3.5 py-2.5 shadow-sm',
                      isOwn
                        ? 'bg-brand-500 text-white rounded-tr-sm'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                    )}>
                      <p className="text-sm leading-relaxed break-words">{msg.text}</p>
                      <p className={clsx('text-[10px] mt-1 text-right', isOwn ? 'text-brand-200' : 'text-gray-400')}>
                        {formatMsgTime(msg.timestamp)}
                        {isOwn && <span className="ml-1">{msg.read ? '✓✓' : '✓'}</span>}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}

          {/* Typing indicator bubble */}
          {driverTyping && (
            <div className="flex justify-start mb-1">
              <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">
                {driverName[0]}
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick replies */}
        <div className="flex gap-2 px-4 pt-2 pb-1 bg-white overflow-x-auto flex-shrink-0 scrollbar-hide">
          {['Dove sei?', 'Sto arrivando', 'Aspettami 2 min', 'Ok, grazie!'].map((q) => (
            <button
              key={q}
              onClick={() => { setInput(q); inputRef.current?.focus() }}
              className="text-xs whitespace-nowrap px-3 py-1.5 bg-gray-100 hover:bg-brand-50 hover:text-brand-700 text-gray-600 rounded-full border border-gray-200 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 px-4 py-3 bg-white border-t border-gray-200 flex-shrink-0">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Scrivi un messaggio..."
            className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className={clsx(
              'w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0',
              input.trim() ? 'bg-brand-500 text-white hover:bg-brand-600' : 'bg-gray-200 text-gray-400'
            )}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </>
  )
}

/** Badge con contatore messaggi non letti */
export function ChatButton({
  rideId,
  driverId,
  onClick,
}: {
  rideId: string
  driverId: string | null
  onClick: () => void
}) {
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    // Inizializza chat e conta non letti
    chatApi.getMessages(rideId, driverId)
    setUnread(chatApi.unreadCount(rideId))
    const interval = setInterval(() => setUnread(chatApi.unreadCount(rideId)), 2000)
    return () => clearInterval(interval)
  }, [rideId, driverId])

  return (
    <button
      onClick={onClick}
      className="relative flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
    >
      <MessageCircle size={16} />
      Chat
      {unread > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
          {unread}
        </span>
      )}
    </button>
  )
}
