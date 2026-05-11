import React, { useEffect, useState, useMemo } from 'react'
import {
  Plus, Search, FileEdit, Trash2, Package, AlertTriangle,
  ChevronLeft, ChevronRight, ImageIcon
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner'
import { ProduitForm } from '@/components/forms/ProduitForm'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface Produit {
  id: number;
  reference: string;
  nom: string;
  designation?: string;
  marque?: string;
  barcode?: string;
  prixAchatHt: number;
  prixVenteHt: number;
  prixVenteTtc: number;
  tauxTva: number;
  stockActuel: number;
  stockMin: number;
  unite: string;
  imageUrl?: string;
  image_url?: string;
}

const ITEMS_PER_PAGE = 10;

export function ProduitsList() {
  const { user } = useAuth();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduit, setEditingProduit] = useState<Produit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [produitToDelete, setProduitToDelete] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

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
    imageUrl: p.image_url || p.imageUrl || undefined,
  });

  const fetchProduits = async () => {
    if (!user?.id) {
      setProduits([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('produits')
        .select('*')
        .eq('user_id', user.id)
        .order('nom');

      if (error) {
        toast.error('Erreur: ' + error.message);
        setProduits([]);
        setIsLoading(false);
        return;
      }

      const mapped = (data || []).map(mapProduit);
      setProduits(mapped);
    } catch (error) {
      console.error('ERROR:', error);
      setProduits([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchProduits();
    }
  }, [user?.id]);

  const handleDelete = async () => {
    if (!produitToDelete || !user?.id) return;
    try {
      const productId = Number(produitToDelete);

      const { error } = await supabase
        .from('produits')
        .delete()
        .eq('id', productId)
        .eq('user_id', user.id);

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

  const openNewForm = () => {
    setEditingProduit(null);
    setIsDialogOpen(true);
  };

  const filteredProduits = useMemo(() => {
    if (!searchQuery.trim()) return produits;
    const query = searchQuery.toLowerCase();
    return produits.filter((produit) =>
      produit.designation?.toLowerCase().includes(query) ||
      produit.reference?.toLowerCase().includes(query) ||
      produit.barcode?.toLowerCase().includes(query) ||
      produit.marque?.toLowerCase().includes(query)
    );
  }, [produits, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredProduits.length / ITEMS_PER_PAGE));
  const paginatedProduits = filteredProduits.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const produitsCount = produits.length;
  const lowStockCount = produits.filter(p => p.stockActuel <= p.stockMin).length;
  const stockValue = produits.reduce((sum, p) => sum + (p.stockActuel * p.prixAchatHt), 0);
  const avgMargin = produitsCount > 0
    ? produits.reduce((sum, p) => {
        const margin = p.prixVenteHt > 0 ? ((p.prixVenteHt - p.prixAchatHt) / p.prixVenteHt) * 100 : 0;
        return sum + margin;
      }, 0) / produitsCount
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer le produit"
        description="Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible."
      />

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-[6px] bg-amber-50 border border-amber-200/50">
            <Package className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Produits</h2>
            <p className="text-sm text-muted-foreground">
              Gérez votre catalogue de produits et suivez les niveaux de stock
            </p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingProduit(null);
        }}>
          <DialogTrigger render={
            <Button
              onClick={openNewForm}
              className="bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-[4px] h-10 px-5 shadow-none"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Produit
            </Button>
          } />
          <DialogContent fullScreen>
            <div className="flex flex-col h-full">
              <DialogHeader className="px-8 py-6 border-b border-border/50 bg-white/50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto w-full">
                  <DialogTitle className="text-2xl font-black text-foreground">
                    {editingProduit ? 'Modifier le produit' : 'Nouveau Produit'}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-muted-foreground">
                    {editingProduit
                      ? `Modification du produit ${editingProduit.designation || editingProduit.nom}`
                      : 'Ajoutez un nouveau produit à votre catalogue'}
                  </DialogDescription>
                </div>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-7xl mx-auto">
                  <div className="rounded-[6px] border border-slate-200 bg-white p-8">
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Table */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Rechercher par nom, référence, marque..."
              className="pl-9 h-10 bg-white border-slate-200 rounded-[4px] focus:border-slate-300 shadow-none text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Table */}
          <Card className="border border-slate-200 shadow-none rounded-[6px] overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-100">
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 w-[60px]"></TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Réf.</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Produit</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Prix Achat</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Prix Vente HT</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">TVA</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Prix TTC</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 text-right">Stock</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-48 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="h-8 w-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                          <p className="text-sm text-muted-foreground font-medium">Chargement des produits...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paginatedProduits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-48 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="bg-slate-50 rounded-[6px] p-4 border border-slate-100">
                            <Package className="h-8 w-8 text-slate-300" />
                          </div>
                          <p className="text-sm text-slate-500 font-medium">
                            {searchQuery ? 'Aucun produit trouvé' : 'Aucun produit enregistré'}
                          </p>
                          {!searchQuery && (
                            <Button
                              variant="outline"
                              className="rounded-[4px] text-sm"
                              onClick={openNewForm}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Ajouter votre premier produit
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedProduits.map((produit) => (
                      <TableRow
                        key={produit.id}
                        className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                      >
                        <TableCell className="px-4 py-5">
                          {produit.imageUrl ? (
                            <img
                              src={produit.imageUrl}
                              alt={produit.designation || ''}
                              className="h-9 w-9 rounded-[4px] object-cover border border-slate-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-[4px] bg-slate-100 flex items-center justify-center border border-dashed border-slate-200">
                              <ImageIcon className="h-4 w-4 text-slate-300" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-5">
                          <span className="text-xs font-mono text-slate-400">
                            {produit.reference || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-800">
                              {produit.designation || '-'}
                            </span>
                            {produit.marque && (
                              <span className="text-[11px] text-slate-400 italic">{produit.marque}</span>
                            )}
                            {produit.barcode && (
                              <span className="text-[10px] font-mono text-slate-300 mt-0.5">
                                {produit.barcode}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-5">
                          <span className="text-sm text-slate-500">
                            {formatCurrency(produit.prixAchatHt)}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-5">
                          <span className="text-sm text-slate-500">
                            {formatCurrency(produit.prixVenteHt)}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-5">
                          <span className="text-xs text-slate-400">{produit.tauxTva}%</span>
                        </TableCell>
                        <TableCell className="px-4 py-5">
                          <span className="text-sm font-semibold text-emerald-600">
                            {formatCurrency(produit.prixVenteTtc)}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {produit.stockActuel <= produit.stockMin && (
                              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                            )}
                            <span className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium",
                              produit.stockActuel <= produit.stockMin
                                ? "bg-rose-50 text-rose-700 border border-rose-200/50"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                            )}>
                              {produit.stockActuel} {produit.unite}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-5 text-right">
                          <div className="flex justify-end gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-[4px]"
                              onClick={() => handleEdit(produit)}
                              title="Modifier"
                            >
                              <FileEdit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-[4px]"
                              onClick={() => {
                                setProduitToDelete(produit.id);
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

            {!isLoading && paginatedProduits.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                <p className="text-xs text-slate-400">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredProduits.length)} sur {filteredProduits.length}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-[4px] text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-8 min-w-[32px] rounded-[4px] text-sm font-medium",
                        page === currentPage
                          ? "bg-slate-100 text-slate-800"
                          : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                      )}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-[4px] text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column - Summary */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border border-slate-200 shadow-none rounded-[6px]">
            <CardHeader className="px-4 py-4 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold text-slate-700">Aperçu du Catalogue</CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-4 space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-9 w-9 rounded-[6px] bg-amber-50 border border-amber-200/50 shrink-0">
                  <Package className="h-4 w-4 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500">Total produits</p>
                  <p className="text-lg font-bold text-slate-800">{produitsCount}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-xs text-slate-500">Stock faible</span>
                  </div>
                  <span className={cn(
                    "text-sm font-semibold",
                    lowStockCount > 0 ? "text-rose-600" : "text-emerald-600"
                  )}>
                    {lowStockCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Valeur du stock</span>
                  <span className="text-sm font-semibold text-slate-700">{formatCurrency(stockValue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Marge moyenne</span>
                  <span className={cn(
                    "text-sm font-semibold",
                    avgMargin >= 0 ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {avgMargin.toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
