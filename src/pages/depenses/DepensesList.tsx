import { useEffect, useState } from 'react';
import { Plus, Search, FileEdit, Trash2, Receipt, Wallet, TrendingUp } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { DepenseForm } from '@/components/forms/DepenseForm';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Depense {
  id: number;
  reference: string;
  categorie: string;
  description: string;
  montantHt: number;
  montantTva: number;
  montantTtc: number;
  dateDepense: string;
  modePaiement: string;
  fournisseurId: number;
  fournisseur?: { nom: string; nomSociete?: string };
}

export function DepensesList() {
  const { user } = useAuth();
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepense, setEditingDepense] = useState<any | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [depenseToDelete, setDepenseToDelete] = useState<number | null>(null);

  const mapDepense = (d: any) => ({
    ...d,
    id: d.id,
    reference: d.reference || '',
    categorie: d.categorie || 'autre',
    description: d.description || '',
    montantHt: Number(d.montant_ht || d.montantHt || 0),
    montantTva: Number(d.montant_tva || d.montantTva || 0),
    montantTtc: Number(d.montant_ttc || d.montantTtc || 0),
    dateDepense: d.date_depense,
    modePaiement: d.mode_paiement || 'virement',
    fournisseurId: d.fournisseur_id,
    fournisseur: d.fournisseur,
  });

  const fetchDepenses = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('depenses')
        .select('*, fournisseur:fournisseurs(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setDepenses(Array.isArray(data) ? (data || []).map(mapDepense) : []);
    } catch (error) {
      console.error('Failed to fetch depenses', error);
      toast.error('Erreur lors du chargement des dépenses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchDepenses();
    }
  }, [user?.id]);

  const handleDelete = async () => {
    if (!depenseToDelete) return;
    
    try {
      const { error } = await supabase.from('depenses').delete().eq('id', depenseToDelete);
      if (error) throw error;
      toast.success('Dépense supprimée');
      fetchDepenses();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleteConfirmOpen(false);
      setDepenseToDelete(null);
    }
  };

  const handleEdit = async (depense: Depense) => {
    try {
      const { data: depenseData, error } = await supabase
        .from('depenses')
        .select('*, fournisseur:fournisseurs(*)')
        .eq('id', depense.id)
        .single();
      
      if (error) throw error;

      const mappedData = {
        ...depenseData,
        description: depenseData.description || '',
        reference: depenseData.reference || '',
        dateDepense: depenseData.date_depense?.split('T')[0] || '',
        fournisseurId: depenseData.fournisseur_id?.toString() || 'none',
        montantHt: Number(depenseData.montant_ht || 0),
        tva: Number(depenseData.tva || 20),
      };
      
      setEditingDepense(mappedData);
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Error loading depense:', error);
      toast.error('Erreur lors du chargement de la dépense');
    }
  };

  const filteredDepenses = depenses.filter((depense) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      (depense.description?.toLowerCase() || '').includes(query) ||
      (depense.categorie?.toLowerCase() || '').includes(query) ||
      (depense.reference?.toLowerCase() || '').includes(query) ||
      (depense.fournisseur?.nomSociete?.toLowerCase() || '').includes(query) ||
      (depense.fournisseur?.nom?.toLowerCase() || '').includes(query)
    );
  });

  const getCategorieBadge = (categorie: string) => {
    const configs: Record<string, { bg: string; text: string; label: string }> = {
      fournitures: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Fournitures' },
      loyer: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Loyer' },
      salaires: { bg: 'bg-green-100', text: 'text-green-800', label: 'Salaires' },
      marketing: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Marketing' },
      autre: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Autre' },
    };
    const config = configs[categorie] || configs.autre;
    return (
      <Badge className={cn("font-medium rounded-lg", config.bg, config.text)}>
        {config.label}
      </Badge>
    );
  };

  const getModeBadge = (mode: string) => {
    const configs: Record<string, { bg: string; text: string }> = {
      'espèces': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      'chéque': { bg: 'bg-indigo-100', text: 'text-indigo-800' },
      'virement': { bg: 'bg-cyan-100', text: 'text-cyan-800' },
      'carte': { bg: 'bg-pink-100', text: 'text-pink-800' },
      'autre': { bg: 'bg-gray-100', text: 'text-gray-800' },
    };
    const config = configs[mode.toLowerCase()] || configs.autre;
    return (
      <span className={cn("text-xs px-2 py-1 rounded-full font-medium", config.bg, config.text)}>
        {mode.charAt(0).toUpperCase() + mode.slice(1)}
      </span>
    );
  };

  const totalDepenses = filteredDepenses.reduce((sum, d) => sum + d.montantTtc, 0);
  const depensesCount = filteredDepenses.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer la dépense"
        description="Êtes-vous sûr de vouloir supprimer cette dépense ? Cette action est irréversible."
      />

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-red-500/10 to-red-500/5">
              <Wallet className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight text-foreground">Dépenses</h2>
              <p className="text-sm text-muted-foreground">
                Suivez et gérez les dépenses de votre entreprise
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="text-center px-4 py-2 rounded-xl bg-gradient-to-r from-muted/50 to-transparent">
            <p className="text-2xl font-black text-foreground">{depensesCount}</p>
            <p className="text-xs text-muted-foreground font-medium">Total</p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="text-center px-4 py-2 rounded-xl bg-gradient-to-r from-red-50/50 to-transparent">
            <p className="text-2xl font-black text-red-600">{formatCurrency(totalDepenses)}</p>
            <p className="text-xs text-muted-foreground font-medium">Montant Total</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingDepense(null);
        }}>
          <DialogTrigger render={
            <Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold shadow-lg shadow-red-500/30 rounded-xl h-11 px-6">
              <Plus className="mr-2 h-5 w-5" />
              Nouvelle Dépense
            </Button>
          } />
          <DialogContent fullScreen className="bg-gradient-to-br from-background to-muted/20">
            <div className="flex flex-col h-full">
              <DialogHeader className="px-8 py-6 border-b border-border/50 bg-white/50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto w-full">
                  <DialogTitle className="text-2xl font-black text-foreground">
                    {editingDepense ? 'Modifier la dépense' : 'Nouvelle Dépense'}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-muted-foreground">
                    {editingDepense 
                      ? `Modification de la dépense ${editingDepense.reference}` 
                      : 'Enregistrez une nouvelle dépense'}
                  </DialogDescription>
                </div>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-7xl mx-auto">
                  <div className="bg-white rounded-2xl shadow-lg border border-border/50 p-8">
                    <DepenseForm
                      initialData={editingDepense}
                      onSuccess={() => {
                        setIsDialogOpen(false);
                        setEditingDepense(null);
                        fetchDepenses();
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Rechercher par description, catégorie, référence..."
            className="pl-12 h-12 bg-white border-border/50 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/50 bg-white shadow-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-muted/50 to-muted/30 hover:bg-muted/50 border-b border-border/50">
              <TableHead className="font-bold text-foreground">Date</TableHead>
              <TableHead className="font-bold text-foreground">Référence</TableHead>
              <TableHead className="font-bold text-foreground">Description</TableHead>
              <TableHead className="font-bold text-foreground">Catégorie</TableHead>
              <TableHead className="font-bold text-foreground">Fournisseur</TableHead>
              <TableHead className="font-bold text-foreground">Paiement</TableHead>
              <TableHead className="text-right font-bold text-foreground">Montant HT</TableHead>
              <TableHead className="text-right font-bold text-foreground">Montant TTC</TableHead>
              <TableHead className="text-right font-bold text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="h-8 w-8 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                    <p className="text-muted-foreground font-medium">Chargement des dépenses...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredDepenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="bg-muted/50 rounded-full p-4">
                      <Receipt className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium">
                      {searchQuery ? 'Aucune dépense trouvée' : 'Aucune dépense enregistrée'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredDepenses.map((depense) => (
                <TableRow 
                  key={depense.id} 
                  className="hover:bg-muted/30 transition-colors border-b border-border/30 last:border-0"
                >
                  <TableCell>
                    <span className="text-sm font-medium text-foreground">
                      {depense.dateDepense ? format(new Date(depense.dateDepense), 'dd MMM yyyy', { locale: fr }) : '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono font-semibold text-primary">
                      {depense.reference || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-foreground max-w-[200px] truncate">
                      {depense.description || '-'}
                    </p>
                  </TableCell>
                  <TableCell>
                    {getCategorieBadge(depense.categorie)}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-foreground">
                      {depense.fournisseur?.nomSociete || depense.fournisseur?.nom || '-'}
                    </p>
                  </TableCell>
                  <TableCell>
                    {getModeBadge(depense.modePaiement)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-semibold text-foreground">
                      {formatCurrency(depense.montantHt)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-bold text-red-600">
                      {formatCurrency(depense.montantTtc)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                        onClick={() => handleEdit(depense)}
                        title="Modifier"
                      >
                        <FileEdit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        onClick={() => {
                          setDepenseToDelete(depense.id);
                          setDeleteConfirmOpen(true);
                        }}
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
