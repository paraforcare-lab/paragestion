import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Sparkles,
  Stethoscope,
  LayoutDashboard, 
  BarChart3, 
  CreditCard, 
  FileText, 
  ShoppingCart, 
  Package, 
  Users, 
  Building2, 
  Box, 
  Settings,
  RefreshCw,
  Database,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Receipt,
  ClipboardList,
  Truck,
  DollarSign,
  HeartPulse,
  FileCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navigationGroups = [
  {
    id: 'general',
    title: 'Tableau de Bord',
    items: [
      { name: 'Espace de Travail', href: '/', icon: Sparkles },
      { name: 'Tableau de Bord', href: '/dashboard', icon: LayoutDashboard },
    ]
  },
  {
    id: 'vente',
    title: 'Ventes',
    items: [
      { name: 'Factures', href: '/factures', icon: FileText },
      { name: 'Devis', href: '/devis', icon: FileCheck },
      { name: 'Ventes Passagers', href: '/ventes-passagers', icon: ShoppingCart },
      { name: 'Avoirs', href: '/avoirs', icon: Receipt },
    ]
  },
  {
    id: 'achat',
    title: 'Achats',
    items: [
      { name: 'Bons de Commande', href: '/bons-commande', icon: ClipboardList },
      { name: 'Bons de Livraison', href: '/bons-livraison', icon: Truck },
      { name: 'Dépenses', href: '/depenses', icon: DollarSign },
    ]
  },
  {
    id: 'contacts',
    title: 'Contacts',
    items: [
      { name: 'Clients', href: '/clients', icon: Users },
      { name: 'Fournisseurs', href: '/fournisseurs', icon: Building2 },
    ]
  },
  {
    id: 'stock',
    title: 'Stock',
    items: [
      { name: 'Produits', href: '/produits', icon: Package },
    ]
  },
  {
    id: 'systeme',
    title: 'Système',
    items: [
      { name: 'Paramètres', href: '/parametres', icon: Settings },
      { name: 'Import / Export', href: '/import-export', icon: Database },
    ]
  }
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ isCollapsed, onToggle, isMobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);
  
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('sidebar-groups-collapsed');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('sidebar-groups-collapsed', JSON.stringify(collapsedGroups));
  }, [collapsedGroups]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      setShowTopShadow(scrollTop > 0);
      setShowBottomShadow(scrollTop + clientHeight < scrollHeight - 5);
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, []);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
    setTimeout(handleScroll, 300);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onMobileClose}
        />
      )}

      <div className={cn(
        "flex flex-col h-full transition-all duration-300 ease-out relative z-50 bg-background",
        isCollapsed ? "w-20" : "w-64",
        "fixed lg:relative inset-y-0 left-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Toggle Button (Desktop) */}
        <Button
          variant="secondary"
          size="icon"
          onClick={onToggle}
          className={cn(
            "hidden lg:flex absolute -right-3 top-20 h-8 w-8 rounded-full bg-white shadow-lg border border-border hover:bg-primary hover:text-white transition-all duration-200 z-50"
          )}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>

        {/* Close Button (Mobile) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMobileClose}
          className="lg:hidden absolute right-4 top-4 text-muted-foreground hover:bg-muted z-50"
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Logo Section */}
        <div className={cn(
          "flex h-20 items-center shrink-0 transition-all duration-300 border-b border-border/50",
          isCollapsed ? "justify-center px-4" : "px-6"
        )}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="bg-gradient-to-br from-primary to-primary/80 p-2.5 rounded-xl shadow-lg shadow-primary/30">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm">
                <div className="absolute inset-0.5 bg-emerald-400 rounded-full animate-pulse" />
              </div>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col leading-none animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="text-xl font-black text-foreground">Para<span className="text-primary">Care</span></span>
                <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-widest mt-1">Management</span>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Menu Content */}
        <div className="relative flex-1 flex flex-col min-h-0">
          {/* Top Shadow */}
          <div className={cn(
            "absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none transition-opacity",
            showTopShadow ? "opacity-100" : "opacity-0"
          )} />
          
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto py-4 px-3 sidebar-scroll"
          >
            <nav className="space-y-6">
              {navigationGroups.map((group) => {
                const isGroupCollapsed = collapsedGroups[group.id];
                return (
                  <div key={group.id} className="space-y-1">
                    {!isCollapsed && (
                      <button
                        onClick={() => toggleGroup(group.id)}
                        className="flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest hover:text-primary transition-colors group"
                      >
                        <span>{group.title}</span>
                        {isGroupCollapsed ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronUp className="h-3 w-3" />
                        )}
                      </button>
                    )}
                    
                    {(!isGroupCollapsed || isCollapsed) && (
                      <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                        {group.items.map((item) => {
                          const isActive = location.pathname === item.href || 
                                          (item.href !== '/' && location.pathname.startsWith(item.href));
                          return (
                            <Link
                              key={item.name}
                              to={item.href}
                              onClick={onMobileClose}
                              title={isCollapsed ? item.name : undefined}
                              className={cn(
                                isActive 
                                  ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary font-bold border-l-[3px] border-primary' 
                                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                                'group flex items-center rounded-xl px-3 py-2.5 text-sm transition-all duration-200 relative',
                                isCollapsed ? "justify-center" : ""
                              )}
                            >
                              <item.icon
                                className={cn(
                                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary',
                                  isCollapsed ? "h-6 w-6" : "mr-3 h-5 w-5",
                                  'flex-shrink-0 transition-all duration-200 group-hover:scale-110'
                                )}
                                aria-hidden="true"
                              />
                              {!isCollapsed && <span className="truncate">{item.name}</span>}
                              

                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
          
          {/* Bottom Shadow */}
          <div className={cn(
            "absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none transition-opacity",
            showBottomShadow ? "opacity-100" : "opacity-0"
          )} />
        </div>

        {/* User Profile & Logout */}
        <div className="border-t border-border/50 p-4 shrink-0 bg-gradient-to-t from-background to-background">
          <div className={cn(
            "flex items-center",
            isCollapsed ? "justify-center" : "gap-3"
          )}>
            <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-md">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold">
                <UserIcon className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">
                  {user?.email?.split('@')[0]}
                </p>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                  Administrateur
                </p>
              </div>
            )}
          </div>
          
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className={cn(
              "w-full mt-3 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-all duration-200 font-semibold rounded-xl",
              isCollapsed ? "px-0 justify-center" : "px-3"
            )}
          >
            <LogOut className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
            {!isCollapsed && <span className="font-medium">Se déconnecter</span>}
          </Button>
        </div>
      </div>
    </>
  );
}
