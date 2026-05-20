import React, { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { LanguageSelector } from '@/components/layout/LanguageSelector'
import { toast } from 'sonner'
import {
  Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, ShieldCheck, HeartPulse,
  Sun, Moon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Reads the persisted theme (`pg_theme`) and resolves it to a concrete
 * 'light' | 'dark' value. This mirrors the boot script in index.html and the
 * Parametres page implementation so the login page toggle stays in sync with
 * the rest of the app (single source of truth: localStorage `pg_theme` +
 * `.dark` class on <html>).
 */
function resolveInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem('pg_theme') as 'light' | 'dark' | 'system' | null
  if (stored === 'dark') return 'dark'
  if (stored === 'light') return 'light'
  // 'system' or unset → follow OS preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function LoginPage() {
  const { t, i18n } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => resolveInitialTheme())
  const { user } = useAuth()
  const navigate = useNavigate()

  // Keep <html class="dark"> + localStorage in sync with the toggle. We write
  // the explicit value ('light' or 'dark') instead of 'system' so the user's
  // explicit choice persists everywhere (Parametres reads the same key).
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('pg_theme', theme)
  }, [theme])

  if (user) {
    return <Navigate to="/" replace />
  }

  const isRtl = i18n.language?.startsWith('ar')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        // Map the Supabase generic "Invalid login credentials" string to a
        // localized message; surface any other server-side message verbatim
        // (translating arbitrary backend strings is out of scope).
        const msg = error.message === 'Invalid login credentials'
          ? t('auth.toast_invalid')
          : error.message
        toast.error(msg)
        return
      }
      toast.success(t('auth.toast_success'))
      navigate('/')
    } catch {
      toast.error(t('auth.toast_error'))
    } finally {
      setLoading(false)
    }
  }

  const isDark = theme === 'dark'

  return (
    <div
      className="min-h-screen flex flex-col mx-4"
      style={{
        // Light mode keeps the original soft teal radial wash. Dark mode uses
        // the same deep navy palette as the dashboard (#0F172A) with a subtle
        // emerald-tinted center to echo the brand accent without becoming
        // "starry".
        background: isDark
          ? 'radial-gradient(ellipse at center, #112033 0%, #0B1222 70%)'
          : 'radial-gradient(ellipse at center, #f0fdfa 0%, #ffffff 70%)',
      }}
    >
      {/* ── Top-right controls (theme toggle + language selector) ─────────
        Position-fixed to the PHYSICAL top-right corner of the viewport in
        every language (FR/EN/AR). We use `right-*` (not the logical
        `end-*`) because the user wants the controls pinned to the screen's
        right edge regardless of the active text direction.

        We also force `dir="ltr"` on this container so the LanguageSelector's
        internal dropdown panel — which anchors with logical `end-0` — opens
        leftward into the viewport in every language. Without this override,
        on Arabic (RTL) pages the panel would interpret `end-0` as
        "anchor to left of trigger" and overflow off the screen's right edge. */}
      <div
        dir="ltr"
        className="fixed top-4 right-4 sm:top-6 sm:right-6 lg:top-8 lg:right-8 z-50 flex items-center gap-2"
      >
        {/* Theme toggle — same visual rhythm (height, radius, border, shadow)
            as the LanguageSelector trigger so the two controls read as a
            unified pair. The icon swaps with a smooth scale+rotate transition. */}
        <button
          type="button"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          aria-label={isDark ? t('parametres.appearance.light_mode') : t('parametres.appearance.dark_mode')}
          title={isDark ? t('parametres.appearance.light_mode') : t('parametres.appearance.dark_mode')}
          className={cn(
            'group relative flex items-center justify-center h-[34px] w-[34px] cursor-pointer',
            'rounded-[10px] border transition-all duration-200',
            'bg-white dark:bg-[#0b1222]',
            'border-slate-200 dark:border-white/8',
            'shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3)]',
            'hover:border-slate-300 dark:hover:border-white/15',
            'hover:shadow-[0_2px_8px_rgba(15,23,42,0.06)] dark:hover:shadow-[0_2px_8px_rgba(0,0,0,0.4)]',
          )}
        >
          {/* Sun is shown in dark mode (click to go light); moon in light mode. */}
          {isDark ? (
            <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 group-hover:rotate-45" />
          ) : (
            <Moon className="h-4 w-4 text-slate-600 transition-transform duration-300 group-hover:-rotate-12" />
          )}
        </button>

        <LanguageSelector />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-100 dark:border-white/10 shadow-[0_20px_50px_rgba(8,112,184,0.07)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-8 md:p-10">
          {/* Logo + headline */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-[0_4px_12px_rgba(16,185,129,0.3)] mb-4">
              <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('auth.login_title')}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('auth.login_subtitle')}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field — uses logical start/ps so the icon flips in RTL. */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-slate-500 dark:text-slate-300">
                {t('auth.email_label')}
              </Label>
              <div className="relative">
                <Mail className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  // Email addresses are always LTR by convention even on RTL pages.
                  dir="ltr"
                  placeholder={t('auth.email_placeholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="h-11 ps-11 bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/10 rounded-[4px] focus:bg-white dark:focus:bg-white/[0.06] focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-0 shadow-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 caret-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-slate-500 dark:text-slate-300">
                {t('auth.password_label')}
              </Label>
              <div className="relative">
                <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  // Passwords are always LTR. Native password masking dots are
                  // direction-neutral, but keeping this explicit prevents any
                  // user-typed mixed-script content from flipping.
                  dir="ltr"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="h-11 ps-11 pe-11 bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/10 rounded-[4px] focus:bg-white dark:focus:bg-white/[0.06] focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-0 shadow-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 caret-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t('auth.password_label') : t('auth.password_label')}
                  className="absolute end-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                className="rounded-[4px] border-slate-300 dark:border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 h-4 w-4"
              />
              <label
                htmlFor="remember"
                className="text-sm text-slate-500 dark:text-slate-300 leading-none cursor-pointer select-none"
              >
                {t('auth.remember_me')}
              </label>
            </div>

            {/* Submit Button — ArrowRight is mirrored in RTL so it visually
                points to the "go forward" direction of the active script. */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-[4px] shadow-[0_4px_14px_rgba(16,185,129,0.35)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t('auth.signing_in')}
                </>
              ) : (
                <>
                  {t('auth.sign_in')}
                  <ArrowRight className={`ms-2 h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
                </>
              )}
            </Button>
          </form>

          {/* Trust badges */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/10">
            <div className="flex items-center justify-center gap-8 text-xs text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                {t('auth.badge_secure')}
              </span>
              <span className="flex items-center gap-1.5">
                <HeartPulse className="h-3.5 w-3.5 text-emerald-500" />
                {t('auth.badge_pharmacy')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="pb-6 text-center text-xs text-slate-400 dark:text-slate-500 font-light">
        {t('auth.footer_copyright', { year: new Date().getFullYear() })}
      </p>
    </div>
  )
}
