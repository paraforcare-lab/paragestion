import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { NotificationBell } from './NotificationBell';
import { Button } from '@/components/ui/button';
import { Menu, User, Settings, LogOut, Stethoscope } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export function DashboardLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Desktop Header */}
        <header className="hidden lg:flex h-16 items-center justify-between px-6 border-b bg-white/80 backdrop-blur-xl shrink-0 z-30 shadow-sm">
          <div className="flex items-center">
            <span className="font-black text-xl text-foreground">Para<span className="text-primary">Care</span></span>
          </div>
          
          <div className="flex items-center gap-2">
            <NotificationBell />
            
            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-1.5 pr-4 rounded-xl hover:bg-muted/50 transition-all"
              >
                <Avatar className="h-9 w-9 border-2 border-primary/20 shadow-sm">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="text-right hidden xl:block">
                  <p className="text-sm font-bold leading-none">{user?.email?.split('@')[0]}</p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Administrateur</p>
                </div>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-border/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
                      <p className="font-bold text-sm">{user?.email}</p>
                      <p className="text-xs text-muted-foreground">Administrateur du système</p>
                    </div>
                    <div className="p-2">
                      <button 
                        onClick={() => { setShowUserMenu(false); navigate('/parametres'); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-all text-left"
                      >
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Paramètres</span>
                      </button>
                      <button 
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-all text-left text-red-600"
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="text-sm font-medium">Se déconnecter</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="lg:hidden flex h-16 items-center px-4 border-b bg-white/80 backdrop-blur-xl shrink-0 z-30 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileOpen(true)}
            className="text-muted-foreground h-10 w-10"
          >
            <Menu className="h-6 w-6" />
          </Button>
          
          <div className="ml-3 flex items-center gap-2">
            <div className="relative">
              <div className="bg-gradient-to-br from-primary to-primary/80 p-2 rounded-xl shadow-lg shadow-primary/30">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm">
                <div className="absolute inset-0.5 bg-emerald-400 rounded-full animate-pulse" />
              </div>
            </div>
            <span className="font-black text-xl text-foreground">Para<span className="text-primary">Care</span></span>
          </div>
          
          <div className="ml-auto flex items-center gap-1">
            <NotificationBell />
            <Avatar className="h-8 w-8 border-2 border-primary/20">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} />
              <AvatarFallback className="bg-primary/10 text-primary">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
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
