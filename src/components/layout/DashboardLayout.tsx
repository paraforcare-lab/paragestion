import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Menu, Search, Bell, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

const routeMeta: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Espace de Travail', subtitle: 'Bienvenue sur ParaGestion' },
  '/dashboard': { title: 'Tableau de Bord', subtitle: 'Analyse et rapports financiers' },
  '/factures': { title: 'Factures', subtitle: 'Gestion des factures clients' },
  '/devis': { title: 'Devis', subtitle: 'Gestion des devis' },
  '/ventes-passagers': { title: 'Ventes Passagers', subtitle: 'Ventes au comptoir' },
  '/avoirs': { title: 'Avoirs', subtitle: 'Notes de crédit et avoirs' },
  '/bons-livraison': { title: 'Bons de Livraison', subtitle: 'Suivi des livraisons' },
  '/bons-commande': { title: 'Bons de Commande', subtitle: 'Gestion des commandes' },
  '/depenses': { title: 'Dépenses', subtitle: 'Suivi des dépenses' },
  '/clients': { title: 'Clients', subtitle: 'Gestion du portefeuille client' },
  '/fournisseurs': { title: 'Fournisseurs', subtitle: 'Gestion des fournisseurs' },
  '/produits': { title: 'Produits', subtitle: 'Gestion du catalogue' },
  '/parametres': { title: 'Paramètres', subtitle: "Configuration de l'application" },
  '/import-export': { title: 'Import / Export', subtitle: 'Transfert de données' },
  '/transactions': { title: 'Transactions', subtitle: 'Historique des opérations' },
};

export function DashboardLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const currentRoute = routeMeta[location.pathname] || { title: 'ParaGestion', subtitle: '' };
  const userInitial = user?.email?.charAt(0)?.toUpperCase() || 'P';
  const displayName = user?.email?.split('@')[0] || 'ParaGestion';

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Hamburger */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setIsMobileOpen(true)}
            className="h-10 w-10 rounded-[6px] bg-white/90 backdrop-blur-sm border border-slate-200"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Header */}
        <header className="bg-white border-b border-slate-100 px-6 lg:px-8 py-4 shrink-0">
          <div className="flex items-center justify-between gap-6">
            {/* Left: Title & Status */}
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-slate-800 tracking-tight">
                {currentRoute.title}
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {currentRoute.subtitle && <>{currentRoute.subtitle} - </>}
                <span className="text-emerald-600 font-medium">Système actif</span>
              </p>
            </div>

            {/* Center: Search */}
            <div className="hidden md:flex flex-1 max-w-lg">
              <div className="relative w-full group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-slate-500 transition-colors pointer-events-none" />
                <input
                  type="text"
                  placeholder="Rechercher produits, commandes..."
                  className="w-full h-10 pl-10 pr-4 rounded-[4px] bg-slate-50 border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition-all duration-200 hover:bg-slate-100 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Right: Actions & Profile */}
            <div className="flex items-center gap-4 shrink-0">
              {/* Notification Bell */}
              <button className="relative p-2 rounded-full hover:bg-slate-100 transition-colors">
                <Bell className="h-5 w-5 text-slate-500" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 border-2 border-white" />
              </button>

              {/* Vertical Divider */}
              <div className="w-px h-8 bg-slate-200" />

              {/* User Profile */}
              <div className="flex items-center gap-3 cursor-pointer group">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                    {displayName}
                  </p>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    ADMINISTRATEUR
                  </p>
                </div>
                <Avatar className="h-9 w-9 border-2 border-emerald-100 group-hover:border-emerald-300 transition-colors">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} />
                  <AvatarFallback className={cn(
                    "bg-emerald-50 text-emerald-700 font-bold text-sm",
                    "group-hover:bg-emerald-100 transition-colors"
                  )}>
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors hidden sm:block" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
