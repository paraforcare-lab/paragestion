import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { NotificationsProvider } from './contexts/NotificationsContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { LoginPage } from './pages/auth/LoginPage'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { Workspace } from './pages/Workspace'
import { Dashboard } from './pages/Dashboard'
import VentesPassagers from './pages/ventes-passagers/VentesPassagers'
import { ClientsList } from './pages/clients/ClientsList'
import { FournisseursList } from './pages/fournisseurs/FournisseursList'
import { ProduitsList } from './pages/produits/ProduitsList'
import { FacturesList } from './pages/factures/FacturesList'
import { AvoirsList } from './pages/avoirs/AvoirsList'
import { DevisList } from './pages/devis/DevisList'
import { BonsCommandeList } from './pages/bons-commande/BonsCommandeList'
import { BonsLivraisonList } from './pages/bons-livraison/BonsLivraisonList'
import { DepensesList } from './pages/depenses/DepensesList'
import { Parametres } from './pages/parametres/Parametres'
import { ImportExport } from './pages/ImportExport'
import { DatabaseManager } from './pages/DatabaseManager'
import { SqlEditor } from './pages/SqlEditor'
import { TransactionsList } from './pages/transactions/TransactionsList'
import { Toaster } from '@/components/ui/sonner'
import i18n from './lib/i18n'

function RtlSynchronizer() {
  useEffect(() => {
    const saved = localStorage.getItem('pg_language') || 'fr';
    const dir = saved.startsWith('ar') ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;

    const handleLanguageChanged = (lng: string) => {
      document.documentElement.dir = lng.startsWith('ar') ? 'rtl' : 'ltr';
    };

    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, []);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
      <NotificationsProvider>
      <Router>
        <RtlSynchronizer />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Workspace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="clients" element={<ClientsList />} />
              <Route path="fournisseurs" element={<FournisseursList />} />
              <Route path="produits" element={<ProduitsList />} />
              <Route path="factures" element={<FacturesList />} />
              <Route path="ventes-passagers" element={<VentesPassagers />} />
              <Route path="avoirs" element={<AvoirsList />} />
              <Route path="devis" element={<DevisList />} />
              <Route path="bons-commande" element={<BonsCommandeList />} />
              <Route path="bons-livraison" element={<BonsLivraisonList />} />
              <Route path="depenses" element={<DepensesList />} />
              <Route path="parametres" element={<Parametres />} />
              <Route path="import-export" element={<ImportExport />} />
              <Route path="database" element={<DatabaseManager />} />
              <Route path="sql-editor" element={<SqlEditor />} />
              <Route path="transactions" element={<TransactionsList />} />
              <Route path="*" element={<div className="p-8 text-center text-muted-foreground">Page en cours de développement</div>} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <Toaster />
      </NotificationsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
