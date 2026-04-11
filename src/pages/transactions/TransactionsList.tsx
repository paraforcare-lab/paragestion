import { useEffect, useState } from 'react';
import { FileText, TrendingUp, ShoppingCart, Truck, CreditCard, DollarSign, Receipt, Download, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useReactToPrint } from 'react-to-print';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface Transaction {
  id: number;
  type: 'facture' | 'devis' | 'commande' | 'livraison' | 'depense' | 'vente';
  numero: string;
  client?: { nom: string; nomSociete?: string };
  fournisseur?: { nom: string; nomSociete?: string };
  date: string;
  montantHt: number;
  montantTva: number;
  montantTtc: number;
  statut: string;
}

export function TransactionsList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllTransactions();
  }, []);

  useEffect(() => {
    let filtered = transactions;
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.numero?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.client?.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.client?.nomSociete?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.fournisseur?.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.fournisseur?.nomSociete?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === typeFilter);
    }
    setFilteredTransactions(filtered);
  }, [transactions, searchQuery, typeFilter]);

  const fetchAllTransactions = async () => {
    setIsLoading(true);
    try {
      const [{ data: factures }, { data: devis }, { data: commandes }, { data: livraisons }, { data: depenses }, { data: ventes }] = await Promise.all([
        supabase.from('factures').select('*'),
        supabase.from('devis').select('*'),
        supabase.from('bons_commande').select('*'),
        supabase.from('bons_livraison').select('*'),
        supabase.from('depenses').select('*'),
        supabase.from('ventes_passagers').select('*'),
      ]);

      const allTransactions: Transaction[] = [];

      // Factures
      if (Array.isArray(factures)) {
        allTransactions.push(...factures.map((f: any) => ({
          id: f.id,
          type: 'facture' as const,
          numero: f.numero,
          client: f.client,
          date: f.date_emission || f.date,
          montantHt: f.montant_ht || 0,
          montantTva: f.montant_tva || 0,
          montantTtc: f.montant_ttc || 0,
          statut: f.statut,
        })));
      }

      // Devis
      if (Array.isArray(devis)) {
        allTransactions.push(...devis.map((d: any) => ({
          id: d.id,
          type: 'devis' as const,
          numero: d.numero,
          client: d.client,
          date: d.dateEmission || d.date,
          montantHt: d.montantHt || 0,
          montantTva: d.montantTva || 0,
          montantTtc: d.montantTtc || 0,
          statut: d.statut,
        })));
      }

      // Bons Commande
      if (Array.isArray(commandes)) {
        allTransactions.push(...commandes.map((c: any) => ({
          id: c.id,
          type: 'commande' as const,
          numero: c.numero,
          fournisseur: c.fournisseur,
          date: c.date_commande || c.date,
          montantHt: c.montant_ht || 0,
          montantTva: c.montant_tva || 0,
          montantTtc: c.montant_ttc || 0,
          statut: c.statut,
        })));
      }

      // Bons Livraison
      if (Array.isArray(livraisons)) {
        allTransactions.push(...livraisons.map((l: any) => ({
          id: l.id,
          type: 'livraison' as const,
          numero: l.numero,
          client: l.client,
          fournisseur: l.fournisseur,
          date: l.date_livraison || l.date,
          montantHt: l.montant_ht || 0,
          montantTva: l.montant_tva || 0,
          montantTtc: l.montant_ttc || 0,
          statut: l.statut,
        })));
      }

      // Dépenses
      if (Array.isArray(depenses)) {
        allTransactions.push(...depenses.map((d: any) => ({
          id: d.id,
          type: 'depense' as const,
          numero: d.reference || d.numero || `DEP-${d.id}`,
          date: d.date_depense || d.date,
          montantHt: d.montant_ht || 0,
          montantTva: d.montant_tva || 0,
          montantTtc: d.montant_ttc || 0,
          statut: d.statut,
        })));
      }

      // Ventes Passagers
      if (Array.isArray(ventes)) {
        allTransactions.push(...ventes.map((v: any) => ({
          id: v.id,
          type: 'vente' as const,
          numero: v.numero,
          date: v.date,
          montantHt: v.montant_ht || 0,
          montantTva: v.montant_tva || 0,
          montantTtc: v.montant_ttc || 0,
          statut: 'payée',
        })));
      }

      // Sort by date descending
      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(allTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Erreur lors du chargement des transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'facture': return <FileText className="h-4 w-4" />;
      case 'devis': return <TrendingUp className="h-4 w-4" />;
      case 'commande': return <ShoppingCart className="h-4 w-4" />;
      case 'livraison': return <Truck className="h-4 w-4" />;
      case 'depense': return <CreditCard className="h-4 w-4" />;
      case 'vente': return <DollarSign className="h-4 w-4" />;
      default: return <Receipt className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'facture': return 'bg-blue-50 text-blue-600';
      case 'devis': return 'bg-purple-50 text-purple-600';
      case 'commande': return 'bg-orange-50 text-orange-600';
      case 'livraison': return 'bg-green-50 text-green-600';
      case 'depense': return 'bg-red-50 text-red-600';
      case 'vente': return 'bg-emerald-50 text-emerald-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'facture': return 'Facture';
      case 'devis': return 'Devis';
      case 'commande': return 'Commande';
      case 'livraison': return 'Livraison';
      case 'depense': return 'Dépense';
      case 'vente': return 'Vente';
      default: return type;
    }
  };

  const getNavigationPath = (type: string, id: number) => {
    switch (type) {
      case 'facture': return `/factures`;
      case 'devis': return `/devis`;
      case 'commande': return `/bons-commande`;
      case 'livraison': return `/bons-livraison`;
      case 'depense': return `/depenses`;
      case 'vente': return `/ventes-passagers`;
      default: return '/';
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd MMM yyyy', { locale: fr });
    } catch {
      return '-';
    }
  };

  const typeOptions = [
    { value: 'all', label: 'Tous les types' },
    { value: 'facture', label: 'Factures' },
    { value: 'devis', label: 'Devis' },
    { value: 'commande', label: 'Bons de Commande' },
    { value: 'livraison', label: 'Bons de Livraison' },
    { value: 'depense', label: 'Dépenses' },
    { value: 'vente', label: 'Ventes' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
              <Receipt className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight text-foreground">Transactions</h2>
              <p className="text-sm text-muted-foreground">
                Historique de toutes vos transactions
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="text-center px-4 py-2 rounded-xl bg-gradient-to-r from-muted/50 to-transparent">
            <p className="text-2xl font-black text-foreground">{filteredTransactions.length}</p>
            <p className="text-xs text-muted-foreground font-medium">Total</p>
          </div>
          <div className="text-center px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-50/50 to-transparent">
            <p className="text-2xl font-black text-emerald-600">
              {formatCurrency(filteredTransactions.reduce((sum, t) => sum + (t.montantTtc || 0), 0))}
            </p>
            <p className="text-xs text-muted-foreground font-medium">Montant Total</p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher par numéro, client..."
            className="pl-12 h-12 bg-white border-border/50 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {typeOptions.map(opt => (
            <Button
              key={opt.value}
              variant={typeFilter === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter(opt.value)}
              className={cn(
                typeFilter === opt.value && "bg-primary text-white"
              )}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/50 bg-white shadow-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-muted/50 to-muted/30 hover:bg-muted/50 border-b border-border/50">
              <TableHead className="font-bold text-foreground">Type</TableHead>
              <TableHead className="w-[140px] font-bold text-foreground">Numéro</TableHead>
              <TableHead className="font-bold text-foreground">Client/Fournisseur</TableHead>
              <TableHead className="font-bold text-foreground">Date</TableHead>
              <TableHead className="text-right font-bold text-foreground">Montant HT</TableHead>
              <TableHead className="text-right font-bold text-foreground">TVA</TableHead>
              <TableHead className="text-right font-bold text-foreground">Montant TTC</TableHead>
              <TableHead className="text-center font-bold text-foreground">Statut</TableHead>
              <TableHead className="text-right font-bold text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-muted-foreground font-medium">Chargement des transactions...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="bg-muted/50 rounded-full p-4">
                      <Receipt className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium">
                      {searchQuery || typeFilter !== 'all' ? 'Aucune transaction trouvée' : 'Aucune transaction enregistrée'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((transaction) => (
                <TableRow 
                  key={`${transaction.type}-${transaction.id}`}
                  className="hover:bg-muted/30 transition-colors border-b border-border/30 last:border-0"
                >
                  <TableCell>
                    <Badge className={cn("gap-1.5 font-semibold rounded-lg", getTypeColor(transaction.type))}>
                      {getTypeIcon(transaction.type)}
                      {getTypeLabel(transaction.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono font-bold text-primary">{transaction.numero}</span>
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-foreground">
                      {transaction.client?.nom || transaction.client?.nomSociete || 
                       transaction.fournisseur?.nom || transaction.fournisseur?.nomSociete || '-'}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(transaction.date)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium text-foreground">{formatCurrency(transaction.montantHt)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium text-muted-foreground">{formatCurrency(transaction.montantTva)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-bold text-foreground">{formatCurrency(transaction.montantTtc)}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="capitalize">
                      {transaction.statut?.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-primary hover:bg-primary/5"
                      onClick={() => window.location.href = getNavigationPath(transaction.type, transaction.id)}
                    >
                      <Receipt className="h-4 w-4 mr-1" />
                      Voir
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
