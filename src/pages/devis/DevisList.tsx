import { useEffect, useState, useRef } from 'react';
import { Plus, Search, FileEdit, Trash2, Download, ArrowRightLeft, FileText, Send, CheckCircle, Ban, XCircle, Package } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { DevisForm } from '@/components/forms/DevisForm';
import { DevisDocument } from '@/components/documents/DevisDocument';
import { useReactToPrint } from 'react-to-print';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Devis {
  id: number;
  numero: string;
  client: { nom: string; nomSociete?: string };
  dateEmission: string;
  montantTtc: number;
  statut: string;
}

export function DevisList() {
  const { user } = useAuth();
  const [devisList, setDevisList] = useState<Devis[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDevis, setEditingDevis] = useState<any | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [devisToDelete, setDevisToDelete] = useState<number | null>(null);

  const [printingDevis, setPrintingDevis] = useState<any>(null);
  const [entreprise, setEntreprise] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: printingDevis ? `Devis_${printingDevis.numero}` : 'Devis',
    onAfterPrint: () => setPrintingDevis(null),
  });

  const mapDevis = (d: any) => ({
    ...d,
    id: d.id,
    numero: d.numero,
    clientId: d.client_id,
    client: d.client,
    dateEmission: d.date_emission,
    dateValidite: d.date_validite,
    montantHt: d.montant_ht,
    montantTva: d.montant_tva,
    montantTtc: d.montant_ttc,
    statut: d.statut,
    lignes: d.lignes || [],
  });

  const fetchDevis = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('devis')
        .select('*, client:clients(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setDevisList(Array.isArray(data) ? (data || []).map(mapDevis) : []);
    } catch (error) {
      console.error('Failed to fetch devis', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEntreprise = async () => {
    if (!user?.id) return;
    
    try {
      // parametres has user_id as TEXT, so use string comparison
      const { data, error } = await supabase
        .from('parametres')
        .select('*')
        .eq('user_id', String(user.id))
        .single();
      
      // Don't show error if no parametres - just use defaults
      if (!data) {
        console.log('No parametres found for user');
        setEntreprise(null);
        return;
      }
      
      if (error && error.code !== 'PGRST116') {
        console.warn('Error fetching parametres:', error);
      }
      
      if (data) {
        const cleanLogoUrl = !data.logo_url || data.logo_url === 'image.png' || !data.logo_url.startsWith('http') 
          ? '' 
          : data.logo_url;
        setEntreprise({
          nomEntreprise: data.nom_societe || data.nom || '',
          adresse: data.adresse || '',
          ville: data.ville || '',
          codePostal: data.code_postale || '',
          telephone: data.telephone || '',
          email: data.email || '',
          ice: data.ice || '',
          rc: data.rc || '',
          ifNumber: data.if_number || '',
          patentes: data.tp_patente || '',
          cnss: data.cnss || '',
          capitalSocial: data.capital_social || '',
          formeJuridique: data.forme_juridique || '',
          logoUrl: cleanLogoUrl,
          couleurPrincipale: data.couleur_principale || '#267E54',
banque: data.banque || '',
          rib: data.rib || '',
          swift: data.swift || '',
        });
      } else {
        // No parametres yet - use defaults
        setEntreprise(null);
      }
    } catch (error) {
      console.warn('Failed to fetch entreprise:', error);
    }
  };

  useEffect(() => {
    fetchDevis();
    fetchEntreprise();
  }, [user]);

  useEffect(() => {
    if (printingDevis && printRef.current) {
      handlePrint();
    }
  }, [printingDevis, handlePrint]);

  const handleConvertToFacture = async (id: number) => {
    try {
      const { data: devis, error: fetchError } = await supabase.from('devis').select('*').eq('id', id).single();
      if (fetchError || !devis) throw new Error('Devis not found');

      const { data: devisLignes } = await supabase.from('devis_lignes').select('*').eq('devis_id', id);

      let year = new Date().getFullYear();
      const { count } = await supabase.from('factures').select('*', { count: 'exact', head: true });
      const randomNum = String((count || 0) + 1).padStart(4, '0');
      const numero = `FAC-${year}-${randomNum}`;
      
      const payload = {
        user_id: user?.id,
        client_id: devis.client_id,
        date_emission: new Date().toISOString(),
        date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        montant_ht: devis.montant_ht,
        montant_tva: devis.montant_tva,
        montant_ttc: devis.montant_ttc,
        statut: 'en_attente',
        reste_a_payer: devis.montant_ttc,
        devis_id: id,
        numero: numero,
      };
      
      const { data: newFacture, error: insertError } = await supabase.from('factures').insert([payload]).select().single();
      if (insertError) throw insertError;

      if (devisLignes && devisLignes.length > 0) {
        const lignesPayload = devisLignes.map((l: any, index: number) => ({
          facture_id: newFacture.id,
          produit_id: l.produit_id,
          reference: l.reference,
          designation: l.designation,
          quantite: l.quantite,
          prix_unitaire_ht: l.prix_unitaire_ht,
          tva: l.tva,
          montant_ht: l.montant_ht,
          montant_ttc: l.montant_ttc,
          ordre: index,
        }));
        const { error: lignesError } = await supabase.from('facture_lignes').insert(lignesPayload);
        if (lignesError) {
          await supabase.from('factures').delete().eq('id', newFacture.id);
          throw lignesError;
        }
      }
      
      await supabase.from('devis').update({ statut: 'converti' }).eq('id', id).eq('user_id', user?.id);
      
      toast.success('Devis converti en facture avec succès !');
      fetchDevis();
    } catch (error: any) {
      console.error('Conversion error:', error);
      toast.error(error?.message || 'Erreur lors de la conversion');
    }
  };

  const handleDelete = async () => {
    if (!devisToDelete) return;
    
    try {
      const { error } = await supabase.from('devis').delete().eq('id', devisToDelete);
      if (error) throw error;
      toast.success('Devis supprimé');
      fetchDevis();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleteConfirmOpen(false);
      setDevisToDelete(null);
    }
  };

  const handleEdit = async (devis: Devis) => {
    try {
      const { data, error } = await supabase.from('devis').select('*').eq('id', devis.id).single();
      if (error) throw error;
      
      // Fetch lignes
      const { data: lignesData } = await supabase.from('devis_lignes').select('*').eq('devis_id', devis.id).order('ordre');
      
      const mappedData = {
        ...data,
        clientId: data.client_id?.toString() || '',
        dateEmission: data.date_emission?.split('T')[0] || '',
        dateValidite: data.date_validite?.split('T')[0] || '',
        lignes: (lignesData || []).map((l: any) => ({
          produitId: l.produit_id?.toString() || '',
          designation: l.designation || '',
          prixUnitaireHt: Number(l.prix_unitaire_ht || 0),
          quantite: Number(l.quantite || 1),
          tva: Number(l.tva || 20),
          montantHt: Number(l.montant_ht || 0),
          montantTtc: Number(l.montant_ttc || 0),
        })),
      };
      
      setEditingDevis(mappedData);
      setIsDialogOpen(true);
    } catch (error) {
      toast.error('Erreur lors du chargement du devis');
    }
  };

  const handleDownload = async (devis: Devis) => {
    try {
      toast.info('Préparation du PDF...');
      const { data, error } = await supabase.from('devis').select('*, client:clients(*)').eq('id', devis.id).single();
      if (error) throw error;
      
      const mappedDevis = {
        ...data,
        numero: data.numero,
        clientId: data.client_id,
        client: data.client,
        dateEmission: data.date_emission,
        dateValidite: data.date_validite,
        montantHt: data.montant_ht,
        montantTva: data.montant_tva,
        montantTtc: data.montant_ttc,
        statut: data.statut,
      };
      setPrintingDevis(mappedDevis);
    } catch (error) {
      toast.error('Erreur lors du chargement des détails du devis');
    }
  };

  const handleStatusChange = async (id: number, newStatut: string) => {
    try {
      const { error } = await supabase
        .from('devis')
        .update({ statut: newStatut })
        .eq('id', id)
        .eq('user_id', user?.id);
      if (error) throw error;
      toast.success('Statut mis à jour');
      fetchDevis();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const filteredDevis = devisList.filter((devis) =>
    devis.numero?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    devis.client?.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    devis.client?.nomSociete?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusOptions = [
    { value: 'brouillon', label: 'Brouillon', icon: FileText, color: 'text-slate-600', bgColor: 'bg-slate-100 text-slate-700' },
    { value: 'envoyé', label: 'Envoyé', icon: Send, color: 'text-blue-600', bgColor: 'bg-blue-100 text-blue-700' },
    { value: 'accepté', label: 'Accepté', icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-100 text-emerald-700' },
    { value: 'refusé', label: 'Refusé', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100 text-red-700' },
    { value: 'converti', label: 'Converti', icon: ArrowRightLeft, color: 'text-purple-600', bgColor: 'bg-purple-100 text-purple-700' },
  ];

  const getStatusConfig = (statut: string) => {
    return statusOptions.find(s => s.value === statut) || statusOptions[0];
  };

  const totalDevis = devisList.length;
  const devisAcceptes = devisList.filter(d => d.statut === 'accepté').length;
  const devisEnAttente = devisList.filter(d => ['brouillon', 'envoyé'].includes(d.statut)).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer le devis"
        description="Êtes-vous sûr de vouloir supprimer ce devis ? Cette action est irréversible."
      />
      
      <div style={{ display: 'none' }}>
        {printingDevis && (
          <DevisDocument ref={printRef} devis={printingDevis} entreprise={entreprise} />
        )}
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight text-foreground">Devis</h2>
              <p className="text-sm text-muted-foreground">
                Gérez vos devis et convertissez-les en factures
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="text-center px-4 py-2 rounded-xl bg-gradient-to-r from-muted/50 to-transparent">
            <p className="text-2xl font-black text-foreground">{totalDevis}</p>
            <p className="text-xs text-muted-foreground font-medium">Total</p>
          </div>
          <div className="text-center px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-50/50 to-transparent">
            <p className="text-2xl font-black text-emerald-600">{devisAcceptes}</p>
            <p className="text-xs text-muted-foreground font-medium">Acceptés</p>
          </div>
          <div className="text-center px-4 py-2 rounded-xl bg-gradient-to-r from-amber-50/50 to-transparent">
            <p className="text-2xl font-black text-amber-600">{devisEnAttente}</p>
            <p className="text-xs text-muted-foreground font-medium">En attente</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingDevis(null);
        }}>
          <DialogTrigger render={
            <Button className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary hover:to-primary text-white font-bold shadow-lg shadow-primary/30 rounded-xl h-11 px-6">
              <Plus className="mr-2 h-5 w-5" />
              Nouveau Devis
            </Button>
          } />
          <DialogContent fullScreen className="bg-gradient-to-br from-background to-muted/20">
            <div className="flex flex-col h-full">
              <DialogHeader className="px-8 py-6 border-b border-border/50 bg-white/50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto w-full">
                  <DialogTitle className="text-2xl font-black text-foreground">
                    {editingDevis ? 'Modifier le devis' : 'Nouveau Devis'}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-muted-foreground">
                    {editingDevis 
                      ? `Modification du devis ${editingDevis.numero}` 
                      : 'Créez un nouveau devis pour vos clients'}
                  </DialogDescription>
                </div>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-7xl mx-auto">
                  <div className="bg-white rounded-2xl shadow-lg border border-border/50 p-8">
                    <DevisForm
                      initialData={editingDevis}
                      onSuccess={() => {
                        setIsDialogOpen(false);
                        setEditingDevis(null);
                        fetchDevis();
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
            placeholder="Rechercher par numéro ou client..."
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
              <TableHead className="w-[160px] font-bold text-foreground">Numéro</TableHead>
              <TableHead className="font-bold text-foreground">Client</TableHead>
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
            ) : filteredDevis.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="bg-muted/50 rounded-full p-4">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium">
                      {searchQuery ? 'Aucun devis trouvé' : 'Aucun devis créé'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredDevis.map((devis) => {
                const status = getStatusConfig(devis.statut);
                const StatusIcon = status.icon;
                
                return (
                  <TableRow 
                    key={devis.id} 
                    className="hover:bg-muted/30 transition-colors border-b border-border/30 last:border-0"
                  >
                    <TableCell>
                      <span className="font-mono font-bold text-primary">{devis.numero}</span>
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-foreground">
                        {devis.client?.nom || devis.client?.nomSociete || '-'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(devis.dateEmission), 'dd MMM yyyy', { locale: fr })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-bold text-foreground">{formatCurrency(devis.montantTtc)}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Select
                        value={devis.statut}
                        onValueChange={(val) => handleStatusChange(devis.id, val)}
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
                        {devis.statut !== 'converti' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all"
                            title="Convertir en facture"
                            onClick={() => handleConvertToFacture(devis.id)}
                          >
                            <ArrowRightLeft className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-primary hover:text-primary/80 hover:bg-primary/5 rounded-lg transition-all"
                          onClick={() => handleDownload(devis)}
                          title="Télécharger PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                          onClick={() => handleEdit(devis)}
                          title="Modifier"
                        >
                          <FileEdit className="h-4 w-4" />
                        </Button>
                        {devis.statut === 'brouillon' ? (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            onClick={() => {
                              setDevisToDelete(devis.id);
                              setDeleteConfirmOpen(true);
                            }}
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : !['refusé', 'converti'].includes(devis.statut) ? (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            onClick={() => handleStatusChange(devis.id, 'refusé')}
                            title="Refuser"
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
