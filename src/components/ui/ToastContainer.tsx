import { useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useToasts } from '@/store/AppContext'
import clsx from 'clsx'

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const colors = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
}

function Toast({ id, type, message }: { id: string; type: keyof typeof icons; message: string }) {
  const { removeToast } = useToasts()
  const Icon = icons[type]

  useEffect(() => {
    const t = setTimeout(() => removeToast(id), 4000)
    return () => clearTimeout(t)
  }, [id, removeToast])

  return (
    <div className={clsx('flex items-start gap-3 px-4 py-3 rounded-lg border shadow-md', colors[type])}>
      <Icon size={18} className="flex-shrink-0 mt-0.5" />
      <p className="text-sm font-medium flex-1">{message}</p>
      <button onClick={() => removeToast(id)} className="flex-shrink-0 opacity-60 hover:opacity-100">
        <X size={16} />
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const { toasts } = useToasts()
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((t) => (
        <Toast key={t.id} {...t} />
      ))}
    </div>
  )
}
