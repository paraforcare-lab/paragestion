import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2, ShoppingCart, DollarSign, Package, Receipt, CreditCard, X, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface VentePassager {
  id: string;
  numero: string;
  date: string;
  montantHt: number;
  montantTva: number;
  montantTtc: number;
  lignes: any[];
}

interface Produit {
  id: string;
  nom: string;
  designation?: string;
  reference: string;
  prixVenteHt: number;
  prix_vente_ht?: number;
  tauxTva: number;
  tva?: number;
  stockActuel: number;
  stock_actuel?: number;
  prixAchatHt: number;
  prix_achat_ht?: number;
}

export default function VentesPassagers() {
  const [ventes, setVentes] = useState<VentePassager[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // New Vente State
  const [selectedProduitId, setSelectedProduitId] = useState('');
  const [quantite, setQuantite] = useState(1);
  const [panier, setPanier] = useState<any[]>([]);

  useEffect(() => {
    fetchVentes();
    fetchProduits();
  }, []);

  const fetchVentes = async () => {
    try {
      const { data, error } = await supabase.from('ventes_passagers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setVentes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast.error('Erreur lors du chargement des ventes');
      setVentes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProduits = async () => {
    try {
      const { data, error } = await supabase.from('produits').select('*').gt('stock_actuel', 0).order('nom');
      if (error) throw error;
      setProduits(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Erreur lors du chargement des produits');
      setProduits([]);
    }
  };

  const addToPanier = () => {
    if (!selectedProduitId) {
      toast.error('Veuillez sélectionner un produit');
      return;
    }

    const produit = produits.find(p => p.id?.toString() === selectedProduitId || p.id === parseInt(selectedProduitId));
    if (!produit) return;

    const stock = produit.stockActuel ?? produit.stock_actuel ?? 0;
    if (stock < quantite) {
      toast.error('Stock insuffisant');
      return;
    }

    const existingIndex = panier.findIndex(item => item.produitId === produit.id);
    if (existingIndex >= 0) {
      setPanier(panier.map((item, idx) => 
        idx === existingIndex 
          ? { ...item, quantite: item.quantite + quantite } 
          : item
      ));
    } else {
      const puHt = Number(produit.prixVenteHt ?? produit.prix_vente_ht ?? 0);
      const tvaRate = Number(produit.tauxTva ?? produit.tva ?? 20);
      const mht = puHt * quantite;
      const mtva = mht * (tvaRate / 100);
      const mttc = mht + mtva;

      setPanier([...panier, {
        produitId: produit.id,
        designation: produit.nom ?? produit.designation ?? 'Produit',
        quantite,
        prixUnitaireHt: puHt,
        tva: tvaRate,
        montantHt: mht,
        montantTva: mtva,
        montantTtc: mttc,
        prixAchatHt: produit.prixAchatHt ?? produit.prix_achat_ht ?? 0
      }]);
    }
    setSelectedProduitId('');
    setQuantite(1);
    toast.success('Produit ajouté au panier');
  };

  const removeFromPanier = (index: number) => {
    setPanier(panier.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (panier.length === 0) {
      toast.error('Le panier est vide');
      return;
    }

    const totalHt = panier.reduce((sum, item) => sum + item.montantHt, 0);
    const totalTva = panier.reduce((sum, item) => sum + item.montantTva, 0);
    const totalTtc = panier.reduce((sum, item) => sum + item.montantTtc, 0);
    const totalCogs = panier.reduce((sum, item) => sum + (Number(item.prixAchatHt || 0) * item.quantite), 0);

    try {
      const payload = {
        montant_ht: totalHt,
        montant_tva: totalTva,
        montant_ttc: totalTtc,
        cogs: totalCogs,
        date: new Date().toISOString(),
        lignes: panier
      };

      const { error } = await supabase.from('ventes_passagers').insert([payload]);
      if (error) throw error;
      
      toast.success('Vente enregistrée avec succès');
      setIsDialogOpen(false);
      setPanier([]);
      fetchVentes();
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('ventes_passagers').delete().eq('id', id);
      if (error) throw error;
      toast.success('Vente supprimée');
      fetchVentes();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const filteredVentes = ventes.filter(v => 
    v.numero?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalVentes = ventes.reduce((sum, v) => sum + (v.montantTtc || 0), 0);
  const todayVentes = ventes.filter(v => {
    const today = new Date().toDateString();
    return new Date(v.date).toDateString() === today;
  }).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
              <ShoppingBag className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight text-foreground">Ventes Passagers</h2>
              <p className="text-sm text-muted-foreground">Gérez vos ventes directes sans facture nominative</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 text-sm">
          <div className="text-center">
            <p className="text-2xl font-black text-emerald-600">{todayVentes}</p>
            <p className="text-xs text-muted-foreground font-medium">Aujourd'hui</p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="text-center">
            <p className="text-2xl font-black text-foreground">{formatCurrency(totalVentes)}</p>
            <p className="text-xs text-muted-foreground font-medium">Total TTC</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/30 rounded-xl h-11 px-6">
              <Plus className="mr-2 h-5 w-5" />
              Nouvelle Vente
            </Button>
          } />
          <DialogContent className="max-w-4xl bg-gradient-to-br from-background to-muted/20">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
                  <ShoppingCart className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">Nouvelle Vente Passager</DialogTitle>
                  <p className="text-sm text-muted-foreground">Ajoutez des produits au panier</p>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Product Selection */}
              <div className="grid grid-cols-12 gap-4 items-end">
                <div className="col-span-5 space-y-2">
                  <Label className="text-sm font-semibold">Produit</Label>
                  <Select value={selectedProduitId} onValueChange={setSelectedProduitId}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Sélectionner un produit" />
                    </SelectTrigger>
                    <SelectContent>
                      {produits.filter(p => (p.stockActuel ?? p.stock_actuel ?? 0) > 0).map(p => (
                        <SelectItem key={p.id} value={p.id?.toString() || ''}>
                          <div className="flex items-center justify-between w-full">
                            <span>{p.nom || p.designation || 'Produit'}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              Stock: {(p.stockActuel ?? p.stock_actuel ?? 0)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label className="text-sm font-semibold">Quantité</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    value={quantite} 
                    onChange={(e) => setQuantite(Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-12 rounded-xl text-center font-bold"
                  />
                </div>
                <div className="col-span-5">
                  <Button 
                    onClick={addToPanier} 
                    className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary hover:to-primary text-white font-bold rounded-xl"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Ajouter au panier
                  </Button>
                </div>
              </div>

              {/* Cart */}
              <div className="rounded-2xl border border-border/50 bg-white shadow-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-muted/50 to-muted/30">
                    <TableRow className="border-b border-border/50">
                      <TableHead className="font-bold">Désignation</TableHead>
                      <TableHead className="text-right font-bold">Qté</TableHead>
                      <TableHead className="text-right font-bold">PU HT</TableHead>
                      <TableHead className="text-right font-bold">TVA</TableHead>
                      <TableHead className="text-right font-bold">Total TTC</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {panier.map((item, index) => (
                      <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium">{item.designation}</TableCell>
                        <TableCell className="text-right font-bold">{item.quantite}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.prixUnitaireHt)}</TableCell>
                        <TableCell className="text-right">{item.tva}%</TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">{formatCurrency(item.montantTtc)}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            onClick={() => removeFromPanier(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {panier.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2">
                            <ShoppingCart className="h-10 w-10 text-muted-foreground/50" />
                            <p className="text-muted-foreground font-medium">Panier vide</p>
                            <p className="text-xs text-muted-foreground">Ajoutez des produits ci-dessus</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              {panier.length > 0 && (
                <div className="flex justify-end">
                  <div className="flex items-center gap-8 p-4 bg-gradient-to-r from-emerald-50/50 to-transparent rounded-2xl border border-emerald-100">
                    <div className="text-right">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total HT</p>
                      <p className="text-lg font-bold">{formatCurrency(panier.reduce((sum, i) => sum + i.montantHt, 0))}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">TVA</p>
                      <p className="text-lg font-bold">{formatCurrency(panier.reduce((sum, i) => sum + i.montantTva, 0))}</p>
                    </div>
                    <div className="text-right border-l border-border pl-8">
                      <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Total TTC</p>
                      <p className="text-2xl font-black text-emerald-600">{formatCurrency(panier.reduce((sum, i) => sum + i.montantTtc, 0))}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                className="rounded-xl h-11"
              >
                Annuler
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={panier.length === 0}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl h-11 shadow-lg shadow-emerald-500/30"
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Valider la vente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Rechercher une vente..."
          className="pl-12 h-12 bg-white border-border/50 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Sales Table */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-muted/30 to-transparent">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Historique des Ventes
            </CardTitle>
            <span className="text-sm text-muted-foreground">{filteredVentes.length} vente(s)</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 border-b border-border/50">
                <TableHead className="font-bold">N° Vente</TableHead>
                <TableHead className="font-bold">Date</TableHead>
                <TableHead className="text-right font-bold">Montant HT</TableHead>
                <TableHead className="text-right font-bold">TVA</TableHead>
                <TableHead className="text-right font-bold">Montant TTC</TableHead>
                <TableHead className="text-right font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <p className="text-muted-foreground font-medium">Chargement des ventes...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredVentes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-muted/50 rounded-full p-4">
                        <Receipt className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground font-medium">Aucune vente enregistrée</p>
                      <Button 
                        variant="outline" 
                        className="mt-2"
                        onClick={() => setIsDialogOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Créer votre première vente
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredVentes.map((vente) => (
                  <TableRow key={vente.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <span className="font-mono font-bold text-primary">{vente.numero}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {new Date(vente.date).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(vente.montantHt)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatCurrency(vente.montantTva)}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-600">{formatCurrency(vente.montantTtc)}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        onClick={() => handleDelete(vente.id?.toString())}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
