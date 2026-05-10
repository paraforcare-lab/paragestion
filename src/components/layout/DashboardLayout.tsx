import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DashboardLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Hamburger Button */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setIsMobileOpen(true)}
            className="h-10 w-10 rounded-xl shadow-lg bg-white/90 backdrop-blur-sm border border-border/50"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

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
