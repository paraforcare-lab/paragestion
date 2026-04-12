import { useEffect, useState } from 'react';
import { Plus, Search, MoreHorizontal, FileEdit, Trash2, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ProduitForm } from '@/components/forms/ProduitForm';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { supabase } from '@/lib/supabase';

interface Produit {
  id: number;
  reference: string;
  nom: string;
  marque?: string;
  barcode?: string;
  prixAchatHt: number;
  prixVenteHt: number;
  prixVenteTtc: number;
  tauxTva: number;
  stockActuel: number;
  stockMin: number;
  unite: string;
}

export function ProduitsList() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduit, setEditingProduit] = useState<Produit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [produitToDelete, setProduitToDelete] = useState<number | null>(null);

  const mapProduit = (p: any) => ({
    ...p,
    id: p.id,
    reference: p.reference || '',
    nom: p.designation || p.nom || '',
    designation: p.designation || p.nom || '',
    marque: p.marque || '',
    barcode: p.barcode || '',
    prixVenteHt: Number(p.prix_vente_ht || 0),
    prixAchatHt: Number(p.prix_achat_ht || 0),
    prixVenteTtc: Number(p.prix_vente_ttc || 0),
    prixAchatTtc: Number(p.prix_achat_ttc || 0),
    tauxTva: Number(p.taux_tva || 20),
    stockActuel: Number(p.stock_actuel || 0),
    stockMin: Number(p.stock_min || 0),
    unite: p.unite || '',
  });

  const fetchProduits = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('produits').select('*').order('nom');
      if (error) throw error;
      setProduits((data || []).map(mapProduit));
    } catch (error) {
      console.error('Failed to fetch produits', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!produitToDelete) return;
    try {
      const productId = Number(produitToDelete);
      
      // Delete the product (cascade will handle related records)
      const { error } = await supabase.from('produits').delete().eq('id', productId);
      if (error) throw error;
      
      toast.success('Produit supprimé');
      fetchProduits();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
    } finally {
      setDeleteConfirmOpen(false);
      setProduitToDelete(null);
    }
  };

  const handleEdit = (produit: Produit) => {
    setEditingProduit(produit);
    setIsDialogOpen(true);
  };

  useEffect(() => {
    fetchProduits();
  }, []);

  const filteredProduits = produits.filter((produit) =>
    produit.designation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    produit.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    produit.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    produit.marque?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer le produit"
        description="Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible."
      />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Produits</h2>
          <p className="text-muted-foreground mt-1">
            Gérez votre catalogue de produits et suivez les niveaux de stock.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingProduit(null);
        }}>
          <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90 shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Produit
            </Button>} />
          <DialogContent fullScreen>
            <div className="flex flex-col h-full bg-slate-50/50">
              <DialogHeader className="px-8 py-6 border-b bg-white shadow-sm">
                <div className="max-w-7xl mx-auto w-full">
                  <DialogTitle className="text-2xl font-bold text-slate-900">
                    {editingProduit ? 'Modifier le produit' : 'Ajouter un nouveau produit'}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-slate-500">
                    Remplissez les informations détaillées du produit ci-dessous.
                  </DialogDescription>
                </div>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-7xl mx-auto">
                  <div className="bg-white rounded-xl shadow-sm border p-8">
                    <ProduitForm 
                      initialData={editingProduit}
                      onSuccess={() => {
                        setIsDialogOpen(false);
                        setEditingProduit(null);
                        fetchProduits();
                      }} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="search"
            placeholder="Rechercher par nom ou référence..."
            className="pl-10 bg-white border-slate-200 focus:border-primary focus:ring-primary/20 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-slate-200">
              <TableHead className="w-[120px] font-semibold text-slate-700">Référence</TableHead>
              <TableHead className="font-semibold text-slate-700">Produit / Marque</TableHead>
              <TableHead className="font-semibold text-slate-700">Code-barres</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Prix Achat</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Prix Vente HT</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">TVA</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Prix TTC</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Stock</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="text-slate-500 font-medium">Chargement des produits...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredProduits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                  Aucun produit trouvé.
                </TableCell>
              </TableRow>
            ) : (
              filteredProduits.map((produit) => (
                <TableRow key={produit.id} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                  <TableCell className="font-mono text-xs text-slate-500">{produit.reference}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900">{produit.designation || '-'}</span>
                      {produit.marque && (
                        <span className="text-xs text-slate-500 italic">{produit.marque}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-400">{produit.barcode || '-'}</TableCell>
                  <TableCell className="text-right text-slate-600">{formatCurrency(produit.prixAchatHt)}</TableCell>
                  <TableCell className="text-right text-slate-600">{formatCurrency(produit.prixVenteHt)}</TableCell>
                  <TableCell className="text-right text-slate-500">{produit.tauxTva}%</TableCell>
                  <TableCell className="text-right font-semibold text-primary">{formatCurrency(produit.prixVenteTtc)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {produit.stockActuel <= produit.stockMin && (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                      <Badge 
                        variant={produit.stockActuel <= produit.stockMin ? 'destructive' : 'secondary'}
                        className={produit.stockActuel > produit.stockMin ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}
                      >
                        {produit.stockActuel} {produit.unite}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/5" 
                        onClick={() => handleEdit(produit)}
                      >
                        <FileEdit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50" 
                        onClick={() => {
                          setProduitToDelete(produit.id);
                          setDeleteConfirmOpen(true);
                        }}
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
