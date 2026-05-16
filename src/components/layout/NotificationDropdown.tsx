import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bell, BellOff, CheckCheck, Clock, AlertTriangle, X } from 'lucide-react'
import { useNotifications, Notification } from '@/contexts/NotificationsContext'
import { cn } from '@/lib/utils'

const typeConfig: Record<string, { icon: typeof Bell; bg: string; dot: string }> = {
  warning: { icon: AlertTriangle, bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400', dot: 'bg-amber-500' },
  error: { icon: X, bg: 'bg-red-500/10 border-red-500/20 text-red-400', dot: 'bg-red-500' },
  success: { icon: CheckCheck, bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', dot: 'bg-emerald-500' },
  info: { icon: Bell, bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400', dot: 'bg-blue-500' },
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

  return         <span className="text-xs text-muted-foreground">{label}</span>
}

interface NotificationDropdownProps {
  open: boolean
  onClose: () => void
  enabled: boolean
}

export function NotificationDropdown({ open, onClose, enabled }: NotificationDropdownProps) {
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
        <div className="bg-popover rounded-[12px] shadow-xl border border-border overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Bell className={cn(
                  "h-5 w-5 transition-colors",
                    enabled ? "text-popover-foreground" : "text-muted-foreground"
                )} />
                {enabled && unreadCount > 0 && (
                  <span className={cn(
                    "absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full border-2 border-popover flex items-center justify-center text-[8px] font-bold text-white",
                    hasHighPriority ? 'bg-red-500' : 'bg-emerald-500'
                  )}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-popover-foreground">Notifications</h3>
                <p className="text-[10px] text-muted-foreground font-medium">
                  {!enabled
                    ? 'Désactivées'
                    : unreadCount > 0
                      ? `${unreadCount} non ${unreadCount > 1 ? 'lues' : 'lue'}`
                      : 'Tout est à jour'}
                </p>
              </div>
            </div>
            {enabled && unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 px-2.5 py-1.5 rounded-[6px] transition-colors flex items-center gap-1.5"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Tout lu
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
            {!enabled ? (
              <div className="p-8 text-center">
                <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <BellOff className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-popover-foreground">Notifications désactivées</p>
                <p className="text-xs text-muted-foreground mt-1">Activez-les dans les paramètres</p>
              </div>
            ) : loading ? (
              <div className="p-8 text-center">
                <div className="flex justify-center mb-3">
                  <div className="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                </div>
                <p className="text-sm text-muted-foreground">Chargement...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <Bell className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-popover-foreground">Aucune notification</p>
                <p className="text-xs text-muted-foreground mt-1">Les alertes apparaîtront ici</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((n) => {
                  const config = typeConfig[n.type] || typeConfig.info
                  const Icon = getTypeIcon(n.type)
                  return (
                    <div
                      key={n.id}
                      className={cn(
                        "px-5 py-3.5 transition-colors relative group",
                        !n.is_read ? 'bg-muted' : 'hover:bg-muted/50'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "mt-0.5 h-8 w-8 rounded-[10px] border-border border flex items-center justify-center shrink-0",
                          config.bg
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn(
                              "text-sm leading-snug",
                              !n.is_read ? 'font-bold text-popover-foreground' : 'text-muted-foreground'
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
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <TimeAgo date={n.created_at} />
                            {!n.is_read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  markAsRead(n.id)
                                }}
                                className="ml-auto text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                Marquer lu
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

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
          {enabled && notifications.length > 0 && (
            <div className="px-5 py-3 border-t border-border bg-muted/50">
              <p className="text-[10px] text-muted-foreground font-medium text-center">
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
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('notifications-enabled') !== 'false'
  })
  const { unreadCount, notifications, fetchNotifications } = useNotifications()
  const bellRef = useRef<HTMLButtonElement>(null)

  const hasHighPriority = notifications.some(n => !n.is_read && (n.type === 'error' || n.type === 'warning'))

  useEffect(() => {
    function handleToggle(e: Event) {
      const detail = (e as CustomEvent).detail
      setNotificationsEnabled(detail.enabled)
      if (detail.enabled) {
        fetchNotifications()
      }
    }
    window.addEventListener('notifications-toggle', handleToggle)
    return () => window.removeEventListener('notifications-toggle', handleToggle)
  }, [fetchNotifications])

  return (
    <div className="relative">
      <button
        ref={bellRef}
        onClick={() => {
          setDropdownOpen(!dropdownOpen)
          if (!dropdownOpen && notificationsEnabled) fetchNotifications()
        }}
        className={cn(
          "relative p-2 rounded-[10px] transition-all duration-200",
            dropdownOpen
              ? 'bg-emerald-500/10 text-emerald-400'
              : notificationsEnabled
                ? 'hover:bg-muted text-muted-foreground hover:text-popover-foreground'
                : 'text-muted-foreground/50 hover:text-muted-foreground cursor-pointer'
        )}
        aria-label={notificationsEnabled ? `Notifications${unreadCount > 0 ? `, ${unreadCount} non lues` : ''}` : 'Notifications désactivées'}
      >
        {notificationsEnabled ? (
          <Bell className="h-5 w-5" />
        ) : (
          <BellOff className="h-5 w-5" />
        )}
        {notificationsEnabled && unreadCount > 0 && (
          <>
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
        enabled={notificationsEnabled}
      />
    </div>
  )
}
