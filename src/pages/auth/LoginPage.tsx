import React, { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { LogIn, Loader2, ShieldCheck, HeartPulse, Eye, EyeOff } from 'lucide-react'

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message === 'Invalid login credentials') {
          toast.error('Email ou mot de passe incorrect');
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success('Connexion réussie. Bienvenue sur ParaGestion!');
      navigate('/');
    } catch (error: any) {
      toast.error('Une erreur est survenue lors de la connexion');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-[6px] bg-emerald-500 mb-4">
            <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-800">
            ParaGestion
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Système de Gestion Parapharmaceutique
          </p>
        </div>

        {/* Login Card */}
        <div className="border border-slate-200 bg-white rounded-[6px] p-8">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-slate-800">Connexion</h2>
            <p className="text-sm text-slate-500 mt-1">
              Accédez à votre espace de travail
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Adresse email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="h-11 bg-white border-slate-200 rounded-[4px] focus:border-slate-300 shadow-none text-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Mot de passe
                </Label>
                <a href="#" className="text-xs text-emerald-600 font-medium hover:underline">
                  Mot de passe oublié ?
                </a>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="h-11 pr-11 bg-white border-slate-200 rounded-[4px] focus:border-slate-300 shadow-none text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                className="rounded-[4px] border-slate-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
              />
              <label
                htmlFor="remember"
                className="text-sm text-slate-500 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Se souvenir de moi
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-[4px] shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Se connecter
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Sécurisé</span>
              </div>
              <div className="flex items-center gap-2">
                <HeartPulse className="h-4 w-4 text-emerald-500" />
                <span>Pharmacy Ready</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          &copy; 2026 ParaGestion. Gestion Parapharmaceutique Premium.
        </p>
      </div>
    </div>
  );
}
