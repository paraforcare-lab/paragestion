import { useEffect, useState, useRef } from 'react';
import { Plus, Search, FileEdit, Trash2, Download, ShoppingCart, Package, FileText, Clock, CheckCircle, Ban, Truck, Send } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { toast } from 'sonner';
import { BonCommandeForm } from '@/components/forms/BonCommandeForm';
import { useReactToPrint } from 'react-to-print';
import { BonCommandeDocument } from '@/components/documents/BonCommandeDocument';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface BonCommande {
  id: number;
  numero: string;
  fournisseurId: number;
  fournisseur: { nom: string; nomSociete?: string };
  dateCommande: string;
  dateLivraisonPrevue?: string;
  montantHt: number;
  montantTva: number;
  montantTtc: number;
  statut: string;
  lignes?: any[];
}

export function BonsCommandeList() {
  const { user } = useAuth();
  const [bons, setBons] = useState<BonCommande[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBon, setEditingBon] = useState<any | null>(null);
  const [entreprise, setEntreprise] = useState<any>(null);
  const [selectedBon, setSelectedBon] = useState<any>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bonToDelete, setBonToDelete] = useState<number | null>(null);

  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: selectedBon ? `Bon_Commande_${selectedBon.numero}` : 'Bon_Commande',
  });

  const mapBonCommande = (b: any) => ({
    ...b,
    id: b.id,
    numero: b.numero || '',
    fournisseurId: b.fournisseur_id,
    fournisseur: b.fournisseur,
    dateCommande: b.date_commande,
    dateLivraisonPrevue: b.date_livraison_prevue,
    montantHt: Number(b.montant_ht || 0),
    montantTva: Number(b.montant_tva || 0),
    montantTtc: Number(b.montant_ttc || 0),
    statut: b.statut || 'brouillon',
  });

  const fetchBons = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bons_commande')
        .select('*, fournisseur:fournisseurs(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setBons(Array.isArray(data) ? (data || []).map(mapBonCommande) : []);
    } catch (error) {
      console.error('Failed to fetch bons de commande', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

const fetchEntreprise = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('parametres')
        .select('*')
        .eq('user_id', String(user.id))
        .single();
      
      if (!data) {
        setEntreprise(null);
        return;
      }
      
      if (error && error.code !== 'PGRST116') {
        console.warn('Error:', error);
      }
      
      if (data) {
        const cleanLogoUrl = !data.logo_url || data.logo_url === 'image.png' || !data.logo_url.startsWith('http') 
          ? '' 
          : data.logo_url;
        setEntreprise({
          nomEntreprise: data.nom_societe || data.nom || '',
          adresse: data.adresse || '',
          ville: data.ville || '',
          telephone: data.telephone || '',
          email: data.email || '',
          ice: data.ice || '',
          logoUrl: cleanLogoUrl,
          couleurPrincipale: data.couleur_principale || '#267E54'
        });
      }
    } catch (error) {
      console.warn('Failed to fetch entreprise:', error);
    }
  };

  useEffect(() => {
    fetchBons();
    fetchEntreprise();
  }, [user]);

  const handleDelete = async () => {
    if (!bonToDelete) return;
    
    try {
      const { error } = await supabase.from('bons_commande').delete().eq('id', bonToDelete);
      if (error) throw error;
      toast.success('Bon de commande supprimé');
      fetchBons();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleteConfirmOpen(false);
      setBonToDelete(null);
    }
  };

  const handleEdit = async (bon: BonCommande) => {
    try {
      const { data: bonData, error } = await supabase
        .from('bons_commande')
        .select('*, fournisseur:fournisseurs(*)')
        .eq('id', bon.id)
        .single();
      
      if (error) throw error;

      const { data: lignesData } = await supabase
        .from('bon_commande_lignes')
        .select('*')
        .eq('bon_commande_id', bon.id)
        .order('ordre');

      const mappedData = {
        ...bonData,
        fournisseurId: bonData.fournisseur_id?.toString() || '',
        dateCommande: bonData.date_commande?.split('T')[0] || '',
        dateLivraisonPrevue: bonData.date_livraison_prevue?.split('T')[0] || '',
        lignes: (lignesData || []).map((l: any) => ({
          produitId: l.produit_id?.toString() || '',
          designation: l.designation || '',
          quantite: Number(l.quantite || 1),
          prixUnitaireHt: Number(l.prix_unitaire_ht || 0),
          tva: Number(l.tva || 20),
          montantHt: Number(l.montant_ht || 0),
          montantTtc: Number(l.montant_ttc || 0),
        })),
      };
      
      setEditingBon(mappedData);
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Error loading bon:', error);
      toast.error('Erreur lors du chargement du bon de commande');
    }
  };

  const handleDownload = async (bon: BonCommande) => {
    try {
      toast.info('Préparation du PDF...');
      
      const { data: bonData, error } = await supabase
        .from('bons_commande')
        .select('*, fournisseur:fournisseurs(*)')
        .eq('id', bon.id)
        .single();
      
      if (error) throw error;
      
      const { data: lignesData } = await supabase
        .from('bon_commande_lignes')
        .select('*')
        .eq('bon_commande_id', bon.id)
        .order('ordre');
      
      const mappedBon = {
        ...bonData,
        numero: bonData.numero,
        fournisseurId: bonData.fournisseur_id,
        fournisseur: bonData.fournisseur,
        dateCommande: bonData.date_commande,
        dateLivraisonPrevue: bonData.date_livraison_prevue,
        montantHt: bonData.montant_ht,
        montantTva: bonData.montant_tva,
        montantTtc: bonData.montant_ttc,
        statut: bonData.statut,
        lignes: (lignesData || []).map((l: any) => ({
          designation: l.designation || '',
          reference: l.reference || '',
          quantite: l.quantite,
          prixUnitaireHt: l.prix_unitaire_ht,
          prix_unitaire_ht: l.prix_unitaire_ht,
          tva: l.tva,
          montantHt: l.montant_ht,
          montant_ht: l.montant_ht,
          montantTtc: l.montant_ttc,
          montant_ttc: l.montant_ttc,
        })),
      };
      setSelectedBon(mappedBon);
      setTimeout(() => handlePrint(), 100);
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bons_commande')
        .update({ statut: newStatus })
        .eq('id', id)
        .eq('user_id', user?.id);
      
      if (error) throw error;
      toast.success('Statut mis à jour');
      fetchBons();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const filteredBons = bons.filter((bon) =>
    bon.numero?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bon.fournisseur?.nomSociete?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bon.fournisseur?.nom?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusOptions = [
    { value: 'brouillon', label: 'Brouillon', icon: FileText, color: 'text-slate-600', bgColor: 'bg-slate-100 text-slate-700' },
    { value: 'envoyé', label: 'Envoyé', icon: Send, color: 'text-blue-600', bgColor: 'bg-blue-100 text-blue-700' },
    { value: 'confirmé', label: 'Confirmé', icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-100 text-emerald-700' },
    { value: 'livré', label: 'Livré', icon: Truck, color: 'text-purple-600', bgColor: 'bg-purple-100 text-purple-700' },
    { value: 'annulé', label: 'Annulé', icon: Ban, color: 'text-red-600', bgColor: 'bg-red-100 text-red-700' },
  ];

  const getStatusConfig = (statut: string) => {
    return statusOptions.find(s => s.value === statut) || statusOptions[0];
  };

  const totalBons = bons.length;
  const bonsConfirmes = bons.filter(b => ['confirmé', 'livré'].includes(b.statut)).length;
  const bonsEnAttente = bons.filter(b => ['brouillon', 'envoyé'].includes(b.statut)).length;
  const totalMontant = filteredBons.reduce((sum, b) => sum + (b.montantTtc || b.montant_ttc || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer le bon de commande"
        description="Êtes-vous sûr de vouloir supprimer ce bon de commande ? Cette action est irréversible."
      />
      
      <div className="hidden">
        <BonCommandeDocument ref={componentRef} bon={selectedBon} entreprise={entreprise} />
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
              <ShoppingCart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight text-foreground">Bons de Commande</h2>
              <p className="text-sm text-muted-foreground">
                Gérez vos commandes auprès des fournisseurs
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="text-center px-4 py-2 rounded-xl bg-gradient-to-r from-muted/50 to-transparent">
            <p className="text-2xl font-black text-foreground">{totalBons}</p>
            <p className="text-xs text-muted-foreground font-medium">Total</p>
          </div>
          <div className="text-center px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-50/50 to-transparent">
            <p className="text-2xl font-black text-emerald-600">{bonsConfirmes}</p>
            <p className="text-xs text-muted-foreground font-medium">Confirmés</p>
          </div>
          <div className="text-center px-4 py-2 rounded-xl bg-gradient-to-r from-amber-50/50 to-transparent">
            <p className="text-2xl font-black text-amber-600">{bonsEnAttente}</p>
            <p className="text-xs text-muted-foreground font-medium">En attente</p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="text-center px-4 py-2 rounded-xl bg-gradient-to-r from-primary/10 to-transparent">
            <p className="text-2xl font-black text-primary">{formatCurrency(totalMontant)}</p>
            <p className="text-xs text-muted-foreground font-medium">Montant Total</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingBon(null);
        }}>
          <DialogTrigger render={
            <Button className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary hover:to-primary text-white font-bold shadow-lg shadow-primary/30 rounded-xl h-11 px-6">
              <Plus className="mr-2 h-5 w-5" />
              Nouveau Bon
            </Button>
          } />
          <DialogContent fullScreen className="bg-gradient-to-br from-background to-muted/20">
            <div className="flex flex-col h-full">
              <DialogHeader className="px-8 py-6 border-b border-border/50 bg-white/50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto w-full">
                  <DialogTitle className="text-2xl font-black text-foreground">
                    {editingBon ? 'Modifier le bon de commande' : 'Nouveau Bon de Commande'}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-muted-foreground">
                    {editingBon 
                      ? `Modification du bon ${editingBon.numero}` 
                      : 'Créez un nouveau bon de commande pour vos fournisseurs'}
                  </DialogDescription>
                </div>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-7xl mx-auto">
                  <div className="bg-white rounded-2xl shadow-lg border border-border/50 p-8">
                    <BonCommandeForm
                      initialData={editingBon}
                      onSuccess={() => {
                        setIsDialogOpen(false);
                        setEditingBon(null);
                        fetchBons();
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
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher par numéro ou fournisseur..."
            className="pl-12 h-12 bg-white border-border/50 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/50 bg-white shadow-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-muted/50 to-muted/30 hover:bg-muted/50 border-b border-border/50">
              <TableHead className="w-[160px] font-bold text-foreground">Numéro</TableHead>
              <TableHead className="font-bold text-foreground">Fournisseur</TableHead>
              <TableHead className="font-bold text-foreground">Date</TableHead>
              <TableHead className="font-bold text-foreground">Livraison</TableHead>
              <TableHead className="text-right font-bold text-foreground">Montant</TableHead>
              <TableHead className="text-center font-bold text-foreground">Statut</TableHead>
              <TableHead className="text-right font-bold text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-muted-foreground font-medium">Chargement...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredBons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="bg-muted/50 rounded-full p-4">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium">
                      {searchQuery ? 'Aucun bon trouvé' : 'Aucun bon de commande créé'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredBons.map((bon) => {
                const status = getStatusConfig(bon.statut);
                const StatusIcon = status.icon;
                
                return (
                  <TableRow 
                    key={bon.id} 
                    className="hover:bg-muted/30 transition-colors border-b border-border/30 last:border-0"
                  >
                    <TableCell>
                      <span className="font-mono font-bold text-primary">{bon.numero}</span>
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-foreground">
                        {bon.fournisseur?.nom || bon.fournisseur?.nomSociete || '-'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(bon.dateCommande || bon.date), 'dd MMM yyyy', { locale: fr })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {bon.dateLivraisonPrevue ? format(new Date(bon.dateLivraisonPrevue), 'dd MMM yyyy', { locale: fr }) : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-bold text-foreground">{formatCurrency(bon.montantTtc)}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Select
                        value={bon.statut}
                        onValueChange={(val) => handleStatusChange(bon.id, val)}
                      >
                        <SelectTrigger className="h-8 w-[140px] mx-auto bg-transparent border-none shadow-none focus:ring-0 p-0">
                          <SelectValue>
                            <Badge className={cn("gap-1.5 font-semibold rounded-lg", status.bgColor)}>
                              <StatusIcon className={cn("h-3.5 w-3.5", status.color)} />
                              {status.label}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map(opt => {
                            const OptIcon = opt.icon;
                            return (
                              <SelectItem key={opt.value} value={opt.value}>
                                <div className="flex items-center gap-2">
                                  <OptIcon className={cn("h-4 w-4", opt.color)} />
                                  <span>{opt.label}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-primary hover:text-primary/80 hover:bg-primary/5 rounded-lg transition-all"
                          onClick={() => handleDownload(bon)}
                          title="Télécharger PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                          onClick={() => handleEdit(bon)}
                          title="Modifier"
                        >
                          <FileEdit className="h-4 w-4" />
                        </Button>
                        {bon.statut === 'brouillon' ? (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            onClick={() => {
                              setBonToDelete(bon.id);
                              setDeleteConfirmOpen(true);
                            }}
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : bon.statut !== 'annulé' ? (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            onClick={() => handleStatusChange(bon.id, 'annulé')}
                            title="Annuler"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
