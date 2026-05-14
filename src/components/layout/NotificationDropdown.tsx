import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CheckCheck, Clock, AlertTriangle, X } from 'lucide-react'
import { useNotifications, Notification } from '@/contexts/NotificationsContext'
import { cn } from '@/lib/utils'

const typeConfig: Record<string, { icon: typeof Bell; bg: string; dot: string }> = {
  warning: { icon: AlertTriangle, bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  error: { icon: X, bg: 'bg-red-50 border-red-200', dot: 'bg-red-500' },
  success: { icon: CheckCheck, bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  info: { icon: Bell, bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
}

function getTypeIcon(type: Notification['type']) {
  return typeConfig[type]?.icon || Bell
}

function TimeAgo({ date }: { date: string }) {
  const [label, setLabel] = useState('')

  useEffect(() => {
    const update = () => {
      const now = Date.now()
      const then = new Date(date).getTime()
      const diff = now - then
      const mins = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)

      if (mins < 1) setLabel("À l'instant")
      else if (mins < 60) setLabel(`Il y a ${mins} min`)
      else if (hours < 24) setLabel(`Il y a ${hours}h`)
      else if (days < 7) setLabel(`Il y a ${days}j`)
      else setLabel(new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }))
    }

    update()
    const interval = setInterval(update, 30000)
    return () => clearInterval(interval)
  }, [date])

  return <span className="text-xs text-slate-400">{label}</span>
}

interface NotificationDropdownProps {
  open: boolean
  onClose: () => void
}

export function NotificationDropdown({ open, onClose }: NotificationDropdownProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const hasHighPriority = notifications.some(n => !n.is_read && (n.type === 'error' || n.type === 'warning'))

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={ref}
        className="absolute right-0 top-full mt-2 z-50 w-[420px] max-w-[calc(100vw-2rem)] origin-top-right animate-scale-in"
      >
        <div className="bg-white rounded-[12px] shadow-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Bell className="h-5 w-5 text-slate-600" />
                {unreadCount > 0 && (
                  <span className={cn(
                    "absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white",
                    hasHighPriority ? 'bg-red-500' : 'bg-emerald-500'
                  )}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                <p className="text-[10px] text-slate-400 font-medium">
                  {unreadCount > 0
                    ? `${unreadCount} non ${unreadCount > 1 ? 'lues' : 'lue'}`
                    : 'Tout est à jour'}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2.5 py-1.5 rounded-[6px] transition-colors flex items-center gap-1.5"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Tout lu
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-8 text-center">
                <div className="flex justify-center mb-3">
                  <div className="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                </div>
                <p className="text-sm text-slate-400">Chargement...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <Bell className="h-6 w-6 text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-600">Aucune notification</p>
                <p className="text-xs text-slate-400 mt-1">Les alertes apparaîtront ici</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((n) => {
                  const config = typeConfig[n.type] || typeConfig.info
                  const Icon = getTypeIcon(n.type)
                  return (
                    <div
                      key={n.id}
                      className={cn(
                        "px-5 py-3.5 transition-colors relative group",
                        !n.is_read ? 'bg-slate-50/80' : 'hover:bg-slate-50/50'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={cn(
                          "mt-0.5 h-8 w-8 rounded-[10px] border flex items-center justify-center shrink-0",
                          config.bg
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn(
                              "text-sm leading-snug",
                              !n.is_read ? 'font-bold text-slate-800' : 'text-slate-600'
                            )}>
                              {n.title}
                            </p>
                            {!n.is_read && (
                              <span className={cn(
                                "mt-1 h-2 w-2 rounded-full shrink-0",
                                config.dot
                              )} />
                            )}
                          </div>
                          {n.message && (
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5">
                            <Clock className="h-3 w-3 text-slate-300" />
                            <TimeAgo date={n.created_at} />
                            {!n.is_read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  markAsRead(n.id)
                                }}
                                className="ml-auto text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                Marquer lu
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Link if present */}
                      {n.link && (
                        <Link
                          to={n.link}
                          onClick={() => markAsRead(n.id)}
                          className="absolute inset-0 z-10"
                          aria-label={n.title}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
              <p className="text-[10px] text-slate-400 font-medium text-center">
                {notifications.length} notification{notifications.length > 1 ? 's' : ''} au total
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export function NotificationBell() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { unreadCount, notifications, fetchNotifications } = useNotifications()
  const bellRef = useRef<HTMLButtonElement>(null)

  const hasHighPriority = notifications.some(n => !n.is_read && (n.type === 'error' || n.type === 'warning'))

  return (
    <div className="relative">
      <button
        ref={bellRef}
        onClick={() => {
          setDropdownOpen(!dropdownOpen)
          if (!dropdownOpen) fetchNotifications()
        }}
        className={cn(
          "relative p-2 rounded-[10px] transition-all duration-200",
          dropdownOpen
            ? 'bg-emerald-50 text-emerald-600'
            : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'
        )}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} non lues` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <>
            {/* Pulsing ring */}
            {hasHighPriority && (
              <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 animate-ping rounded-full bg-red-400 opacity-60" />
            )}
            <span className={cn(
              "absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white",
              hasHighPriority ? 'bg-red-500' : 'bg-emerald-500'
            )}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        )}
      </button>

      <NotificationDropdown
        open={dropdownOpen}
        onClose={() => setDropdownOpen(false)}
      />
    </div>
  )
}
