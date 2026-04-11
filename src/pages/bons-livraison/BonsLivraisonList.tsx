import { useEffect, useState, useRef } from 'react';
import { Plus, Search, FileEdit, Trash2, Download, Truck, Package, Clock, CheckCircle, Ban } from 'lucide-react';
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
import { BonLivraisonForm } from '@/components/forms/BonLivraisonForm';
import { useReactToPrint } from 'react-to-print';
import { BonLivraisonDocument } from '@/components/documents/BonLivraisonDocument';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface BonLivraison {
  id: number;
  numero: string;
  fournisseur: { nom: string; nomSociete?: string };
  date: string;
  dateLivraison?: string;
  statut: string;
  montantTtc?: number;
}

export function BonsLivraisonList() {
  const { user } = useAuth();
  const [bons, setBons] = useState<BonLivraison[]>([]);
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
    documentTitle: selectedBon ? `Bon_Livraison_${selectedBon.numero}` : 'Bon_Livraison',
  });

  const mapBonLivraison = (b: any) => ({
    ...b,
    numero: b.numero,
    fournisseurId: b.fournisseur_id,
    date: b.date,
    dateLivraison: b.date_livraison,
    montantTtc: b.montant_ttc,
    statut: b.statut,
  });

  const fetchBons = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('bons_livraison').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setBons(Array.isArray(data) ? (data || []).map(mapBonLivraison) : []);
    } catch (error) {
      console.error('Failed to fetch bons de livraison', error);
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
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.warn('Error fetching parametres:', error);
      }
      
      if (data) {
        if (data.logo_url === 'image.png' || !data.logo_url?.startsWith('http')) {
          data.logo_url = '';
        }
        setEntreprise({
          nomEntreprise: data.nom_societe || data.nom || '',
          adresse: data.adresse || '',
          ville: data.ville || '',
          telephone: data.telephone || '',
          email: data.email || '',
          ice: data.ice || '',
          logoUrl: data.logo_url || '',
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

  const mapBon = (b: any) => ({
    ...b,
    numero: b.numero,
    fournisseurId: b.fournisseur_id,
    date: b.date,
    dateLivraison: b.date_livraison,
    montantTtc: b.montant_ttc,
    statut: b.statut,
  });

  const handleDelete = async () => {
    if (!bonToDelete) return;
    
    try {
      const { error } = await supabase.from('bons_livraison').delete().eq('id', bonToDelete);
      if (error) throw error;
      toast.success('Bon de livraison supprimé');
      fetchBons();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleteConfirmOpen(false);
      setBonToDelete(null);
    }
  };

  const handleEdit = async (bon: BonLivraison) => {
    try {
      const { data, error } = await supabase.from('bons_livraison').select('*').eq('id', bon.id).single();
      if (error) throw error;
      
      const dateStr = data.date_livraison || data.date;
      data.dateEmission = dateStr ? dateStr.split('T')[0] : '';
      data.fournisseurId = data.fournisseur_id?.toString();
      
      setEditingBon(data);
      setIsDialogOpen(true);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du chargement du bon de livraison');
    }
  };

  const handleDownload = async (bon: any) => {
    try {
      toast.info('Préparation du PDF...');
const { data, error } = await supabase.from('bons_livraison').select('*, fournisseur:fournisseurs(*)').eq('id', bon.id).single();
      if (error) throw error;
      
      const mappedBon = {
        ...data,
        numero: data.numero,
        fournisseurId: data.fournisseur_id,
        fournisseur: data.fournisseur,
        date: data.date,
        dateLivraison: data.date_livraison,
        montantHt: data.montant_ht,
        montantTva: data.montant_tva,
        montantTtc: data.montant_ttc,
        statut: data.statut,
      };
       
      setSelectedBon(null);
      setTimeout(() => {
        setSelectedBon(mappedBon);
        setTimeout(() => {
          handlePrint();
        }, 300);
      }, 100);
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error(error.message || 'Erreur lors du téléchargement');
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const { error } = await supabase.from('bons_livraison').update({ statut: newStatus }).eq('id', id);
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
    { value: 'en_attente', label: 'En attente', icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-100 text-amber-700' },
    { value: 'livré', label: 'Livré', icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-100 text-emerald-700' },
    { value: 'annulé', label: 'Annulé', icon: Ban, color: 'text-red-600', bgColor: 'bg-red-100 text-red-700' },
  ];

  const getStatusConfig = (statut: string) => {
    return statusOptions.find(s => s.value === statut) || statusOptions[0];
  };

  const totalBons = bons.length;
  const bonsLivres = bons.filter(b => ['livré', 'livrée'].includes(b.statut)).length;
  const bonsEnAttente = bons.filter(b => b.statut === 'en_attente').length;
  const totalMontant = bons.reduce((sum, b) => sum + (b.montantTtc || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer le bon de livraison"
        description="Êtes-vous sûr de vouloir supprimer ce bon de livraison ? Cette action est irréversible."
      />
      
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <BonLivraisonDocument ref={componentRef} bon={selectedBon} entreprise={entreprise} />
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
              <Truck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight text-foreground">Bons de Livraison</h2>
              <p className="text-sm text-muted-foreground">
                Gérez les livraisons de vos fournisseurs
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
            <p className="text-2xl font-black text-emerald-600">{bonsLivres}</p>
            <p className="text-xs text-muted-foreground font-medium">Livrés</p>
          </div>
          <div className="text-center px-4 py-2 rounded-xl bg-gradient-to-r from-amber-50/50 to-transparent">
            <p className="text-2xl font-black text-amber-600">{bonsEnAttente}</p>
            <p className="text-xs text-muted-foreground font-medium">En attente</p>
          </div>
          <div className="text-center px-4 py-2 rounded-xl bg-gradient-to-r from-primary/10 to-transparent">
            <p className="text-2xl font-black text-primary">{formatCurrency(totalMontant)}</p>
            <p className="text-xs text-muted-foreground font-medium">Total TTC</p>
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
                    {editingBon ? 'Modifier le bon de livraison' : 'Nouveau Bon de Livraison'}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-muted-foreground">
                    {editingBon 
                      ? `Modification du bon ${editingBon.numero}` 
                      : 'Créez un nouveau bon de livraison pour vos fournisseurs'}
                  </DialogDescription>
                </div>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-7xl mx-auto">
                  <div className="bg-white rounded-2xl shadow-lg border border-border/50 p-8">
                    <BonLivraisonForm
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
              <TableHead className="text-right font-bold text-foreground">Montant</TableHead>
              <TableHead className="text-center font-bold text-foreground">Statut</TableHead>
              <TableHead className="text-right font-bold text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-muted-foreground font-medium">Chargement...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredBons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="bg-muted/50 rounded-full p-4">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium">
                      {searchQuery ? 'Aucun bon trouvé' : 'Aucun bon de livraison créé'}
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
                        {(() => {
                          try {
                            const dateStr = bon.dateLivraison || bon.date;
                            if (!dateStr) return '-';
                            const date = new Date(dateStr);
                            if (isNaN(date.getTime())) return '-';
                            return format(date, 'dd MMM yyyy', { locale: fr });
                          } catch {
                            return '-';
                          }
                        })()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-bold text-foreground">{formatCurrency(bon.montantTtc || 0)}</span>
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
                        {bon.statut === 'en_attente' ? (
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
