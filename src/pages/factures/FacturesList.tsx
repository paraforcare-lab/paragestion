import React, { useEffect, useState, useRef } from 'react';
import { Plus, Search, FileEdit, Trash2, FileText, Download, CheckCircle, Clock, AlertCircle, Ban, Receipt, DollarSign, ArrowLeft } from 'lucide-react';
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
import { FactureForm } from '@/components/forms/FactureForm';
import { FactureDocument } from '@/components/documents/FactureDocument';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Facture {
  id: number;
  numero: string;
  client: { nom: string; nomSociete?: string };
  clientId?: number;
  dateEmission: string;
  dateEcheance?: string;
  montantHt: number;
  montantTva: number;
  montantTtc: number;
  statut: string;
  resteAPayer: number;
  modePaiement?: string;
  lignes?: any[];
}

interface StatutOption {
  value: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const statusOptions: StatutOption[] = [
  { value: 'brouillon', label: 'Brouillon', icon: FileText, color: 'text-slate-600', bgColor: 'bg-slate-100 text-slate-700' },
  { value: 'en_attente', label: 'En attente', icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-100 text-amber-700' },
  { value: 'reste_a_payer', label: 'Reste à payer', icon: AlertCircle, color: 'text-orange-600', bgColor: 'bg-orange-100 text-orange-700' },
  { value: 'payée', label: 'Payée', icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-100 text-emerald-700' },
  { value: 'annulée', label: 'Annulée', icon: Ban, color: 'text-red-600', bgColor: 'bg-red-100 text-red-700' },
];

export function FacturesList() {
  const { user } = useAuth();
  const [factures, setFactures] = useState<Facture[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFacture, setEditingFacture] = useState<Facture | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [factureToDelete, setFactureToDelete] = useState<number | null>(null);
  
  const [printingFacture, setPrintingFacture] = useState<any>(null);
  const [entreprise, setEntreprise] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: printingFacture ? `Facture_${printingFacture.numero}` : 'Facture',
    onAfterPrint: () => setPrintingFacture(null),
  });

  const mapFacture = (f: any) => ({
    ...f,
    numero: f.numero,
    clientId: f.client_id,
    client: f.client,
    dateEmission: f.date_emission,
    dateEcheance: f.date_echeance,
    montantHt: f.montant_ht,
    montantTva: f.montant_tva,
    montantTtc: f.montant_ttc,
    statut: f.statut,
    resteAPayer: f.reste_a_payer,
    modePaiement: f.mode_paiement,
  });

  const fetchFactures = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('factures')
        .select('*, client:clients(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      const mapped = (data || []).map((f: any) => ({
        ...f,
        clientId: f.client_id,
        client: f.client,
        dateEmission: f.date_emission,
        dateEcheance: f.date_echeance,
        montantHt: f.montant_ht,
        montantTva: f.montant_tva,
        montantTtc: f.montant_ttc,
        statut: f.statut,
        resteAPayer: f.reste_a_payer,
        modePaiement: f.mode_paiement,
      }));
      
      setFactures(mapped);
    } catch (error) {
      console.error('Failed to fetch factures', error);
      toast.error('Erreur lors du chargement des factures');
      setFactures([]);
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
      
      // Don't show error if no parametres
      if (!data) {
        console.log('No parametres found');
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
    if (user?.id) {
      fetchFactures();
      fetchEntreprise();
    }
  }, [user?.id]);

  useEffect(() => {
    if (printingFacture && printRef.current) {
      handlePrint();
    }
  }, [printingFacture, handlePrint]);

  const handleDelete = async () => {
    if (!factureToDelete) return;
    
    try {
      const { error } = await supabase.from('factures').delete().eq('id', factureToDelete);
      if (error) throw error;
      toast.success('Facture supprimée avec succès');
      fetchFactures();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleteConfirmOpen(false);
      setFactureToDelete(null);
    }
  };

  const handleEdit = async (facture: Facture) => {
    try {
      // Fetch all needed data - INCLUDING all products for the dropdown
      const [factureResult, clientResult, lignesResult, allProductsResult] = await Promise.all([
        supabase.from('factures').select('*').eq('id', facture.id).single(),
        supabase.from('clients').select('*').eq('id', facture.clientId).single(),
        supabase.from('facture_lignes').select('*').eq('facture_id', facture.id).order('ordre'),
        supabase.from('produits').select('*').eq('user_id', user?.id).order('nom')
      ]);
      
      const { data: factureData, error: fError } = factureResult;
      if (fError) throw fError;
      
      const { data: clientData } = clientResult;
      const { data: lignesData } = lignesResult;
      const { data: allProductsData } = allProductsResult;
      
      // Build products map from ALL products
      const produitsMap: any = {};
      (allProductsData || []).forEach((p: any) => {
        produitsMap[p.id] = p;
      });
      
      // Also map by product IDs in lignes
      (lignesData || []).forEach((l: any) => {
        if (l.produit_id && !produitsMap[l.produit_id]) {
          produitsMap[l.produit_id] = { id: l.produit_id, nom: l.designation };
        }
      });
      
      // Map lignes with product details
      const mappedLignes = (lignesData || []).map((l: any) => {
        const produit = produitsMap[l.produit_id];
        return {
          id: l.id,
          produitId: String(l.produit_id || ''),
          produit: produit,
          reference: l.reference || produit?.reference || '',
          designation: l.designation || l.description || produit?.nom || produit?.designation || '',
          quantite: l.quantite || 1,
          prixUnitaireHt: Number(l.prix_unitaire_ht || l.prix_unitaire || produit?.prix_vente_ht || 0),
          tva: Number(l.tva || produit?.taux_tva || produit?.tva || 20),
          montantHt: Number(l.montant_ht || 0),
          montantTtc: Number(l.montant_ttc || 0),
        };
      });
      
      // Map to camelCase for form
      const mappedData = {
        ...factureData,
        client: clientData,
        clientId: String(factureData?.client_id || ''),
        dateEmission: factureData?.date_emission?.split('T')[0] || new Date().toISOString().split('T')[0],
        dateEcheance: factureData?.date_echeance?.split('T')[0] || '',
        montantHt: Number(factureData?.montant_ht || 0),
        montantTva: Number(factureData?.montant_tva || 0),
        montantTtc: Number(factureData?.montant_ttc || 0),
        statut: factureData?.statut || 'brouillon',
        resteAPayer: Number(factureData?.reste_a_payer || 0),
        modePaiement: factureData?.mode_paiement || 'Virement',
        notes: factureData?.notes || '',
        conditionsPaiement: factureData?.conditions_paiement || '',
        lignes: mappedLignes,
      };
      
      setEditingFacture(mappedData);
      setShowForm(true);
    } catch (error) {
      console.error('Error loading facture:', error);
      toast.error('Erreur lors du chargement de la facture');
    }
  };

  const handleMarkAsPaid = async (id: number) => {
    try {
      const { error } = await supabase
        .from('factures')
        .update({ statut: 'payée', reste_a_payer: 0 })
        .eq('id', id)
        .eq('user_id', user?.id);
      if (error) throw error;
      toast.success('Facture marquée comme payée');
      fetchFactures();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleAnnuler = async (facture: Facture) => {
    try {
      const { data: factureData, error: fetchError } = await supabase
        .from('factures')
        .select('*, client:clients(*)')
        .eq('id', facture.id)
        .single();
      
      if (fetchError || !factureData) throw new Error('Facture non trouvée');

      const { data: lignesData } = await supabase
        .from('facture_lignes')
        .select('*')
        .eq('facture_id', facture.id)
        .order('ordre');

      const year = new Date().getFullYear();
      const { count } = await supabase.from('avoirs').select('*', { count: 'exact', head: true });
      const randomNum = String((count || 0) + 1).padStart(4, '0');
      const numeroAvoir = `AV-${year}-${randomNum}`;

      const { data: avoirData, error: avoirError } = await supabase
        .from('avoirs')
        .insert([{
          user_id: user?.id,
          numero: numeroAvoir,
          facture_id: factureData.id,
          client_id: factureData.client_id,
          date_emission: new Date().toISOString(),
          montant_ht: factureData.montant_ht,
          montant_tva: factureData.montant_tva,
          montant_ttc: factureData.montant_ttc,
          statut: 'émis',
          notes: `Avoir pour annulation de la facture ${factureData.numero}`,
        }])
        .select()
        .single();

      if (avoirError) throw avoirError;

      if (lignesData && lignesData.length > 0) {
        const lignesPayload = lignesData.map((l: any, index: number) => ({
          avoir_id: avoirData.id,
          produit_id: l.produit_id,
          designation: l.description || l.designation || '',
          quantite: l.quantite,
          prix_unitaire_ht: l.prix_unitaire_ht || l.prix_unitaire || 0,
          tva: l.tva,
          montant_ht: l.montant_ht,
          montant_ttc: l.montant_ttc,
          ordre: index,
        }));

        const { error: lignesError } = await supabase.from('avoir_lignes').insert(lignesPayload);
        if (lignesError) throw lignesError;
      }

      const { error: updateError } = await supabase
        .from('factures')
        .update({ statut: 'annulée' })
        .eq('id', facture.id)
        .eq('user_id', user?.id);

      if (updateError) throw updateError;

      toast.success(`Facture annulée. Avoir ${numeroAvoir} créé avec succès !`);
      fetchFactures();
    } catch (error: any) {
      console.error('Error cancelling facture:', error);
      toast.error(error.message || 'Erreur lors de l\'annulation de la facture');
    }
  };

  const handleDownload = async (facture: Facture) => {
    try {
      toast.info('Préparation du PDF...');
      
      // Fetch facture with client AND all products
      const [factureResult, allProductsResult] = await Promise.all([
        supabase.from('factures').select('*, client:clients(*)').eq('id', facture.id).single(),
        supabase.from('produits').select('*').eq('user_id', user?.id).order('nom')
      ]);
      
      const { data: factureData, error } = factureResult;
      if (error) throw error;
      
      const { data: allProductsData } = allProductsResult;
      
      // Fetch lignes
      const { data: lignesData } = await supabase.from('facture_lignes').select('*').eq('facture_id', facture.id).order('ordre');
      
      // Build products map from ALL products (same as edit)
      const produitsMap: any = {};
      (allProductsData || []).forEach((p: any) => {
        produitsMap[p.id] = p;
      });
      
      // Map lignes with product details
      const mappedLignes = (lignesData || []).map((l: any) => {
        const produit = produitsMap[l.produit_id];
        return {
          ...l,
          designation: l.designation || l.description || produit?.nom || produit?.designation || '',
          reference: l.reference || produit?.reference || '',
        };
      });
      
      const mappedFacture = {
        ...factureData,
        numero: factureData.numero,
        clientId: factureData.client_id,
        client: factureData.client,
        dateEmission: factureData.date_emission,
        dateEcheance: factureData.date_echeance,
        montantHt: factureData.montant_ht,
        montantTva: factureData.montant_tva,
        montantTtc: factureData.montant_ttc,
        statut: factureData.statut,
        resteAPayer: factureData.reste_a_payer,
        modePaiement: factureData.mode_paiement,
        lignes: mappedLignes,
      };
      setPrintingFacture(mappedFacture);
    } catch (error) {
      toast.error('Erreur lors du chargement des détails de la facture');
    }
  };

  const handleStatusChange = async (id: number, newStatut: string) => {
    try {
      const { data: facture } = await supabase.from('factures').select('statut').eq('id', id).single();
      
      if (facture?.statut === 'annulée' && newStatut !== 'annulée') {
        const { data: avoir } = await supabase.from('avoirs').select('id').eq('facture_id', id).single();
        if (avoir) {
          await supabase.from('avoir_lignes').delete().eq('avoir_id', avoir.id);
          await supabase.from('avoirs').delete().eq('id', avoir.id);
        }
      }

      const updateData: any = { statut: newStatut };
      if (newStatut === 'payée') {
        updateData.reste_a_payer = 0;
      }
      const { error } = await supabase
        .from('factures')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user?.id);
      if (error) throw error;
      toast.success('Statut mis à jour');
      fetchFactures();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const openNewForm = () => {
    setEditingFacture(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingFacture(null);
  };

  const filteredFactures = factures.filter((facture) =>
    facture.numero?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    facture.client?.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    facture.client?.nomSociete?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusConfig = (statut: string) => {
    return statusOptions.find(s => s.value === statut) || statusOptions[0];
  };

  const totalFactures = factures.length;
  const facturesPayees = factures.filter(f => f.statut === 'payée').length;
  const facturesEnAttente = factures.filter(f => ['en_attente', 'reste_a_payer'].includes(f.statut)).length;
  const totalMontant = filteredFactures.reduce((sum, f) => sum + (f.montantTtc || 0), 0);
  const totalResteAPayer = filteredFactures.reduce((sum, f) => sum + (f.resteAPayer || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer la facture"
        description="Êtes-vous sûr de vouloir supprimer cette facture ? Cette action est irréversible."
      />
      
      {/* Hidden print container */}
      <div style={{ display: 'none' }}>
        {printingFacture && (
          <FactureDocument ref={printRef} facture={printingFacture} entreprise={entreprise} />
        )}
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            {showForm && (
              <Button variant="ghost" size="icon" onClick={closeForm} className="mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
              <Receipt className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight text-foreground">
                {showForm ? (editingFacture ? 'Modifier la facture' : 'Nouvelle Facture') : 'Factures'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {showForm 
                  ? (editingFacture ? `Modification de la facture ${editingFacture.numero}` : 'Créez une nouvelle facture') 
                  : 'Gérez vos factures et suivez les paiements'}
              </p>
            </div>
          </div>
        </div>

        {!showForm && (
          <>
            {/* Stats */}
            <div className="flex items-center gap-4 text-sm">
              <div className="text-center px-4 py-2 rounded-xl bg-gradient-to-r from-muted/50 to-transparent">
                <p className="text-2xl font-black text-foreground">{totalFactures}</p>
                <p className="text-xs text-muted-foreground font-medium">Total</p>
              </div>
              <div className="text-center px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-50/50 to-transparent">
                <p className="text-2xl font-black text-emerald-600">{facturesPayees}</p>
                <p className="text-xs text-muted-foreground font-medium">Payées</p>
              </div>
              <div className="text-center px-4 py-2 rounded-xl bg-gradient-to-r from-amber-50/50 to-transparent">
                <p className="text-2xl font-black text-amber-600">{facturesEnAttente}</p>
                <p className="text-xs text-muted-foreground font-medium">En attente</p>
              </div>
            </div>

            <Button 
              onClick={openNewForm}
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary hover:to-primary text-white font-bold shadow-lg shadow-primary/30 rounded-xl h-11 px-6"
            >
              <Plus className="mr-2 h-5 w-5" />
              Nouvelle Facture
            </Button>
          </>
        )}
      </div>

      {showForm ? (
        /* Form View */
        <div className="bg-white rounded-2xl shadow-lg border border-border/50 p-6">
          <FactureForm
            initialData={editingFacture}
            onSuccess={() => {
              closeForm();
              fetchFactures();
            }}
          />
        </div>
      ) : (
        <>
          {/* Search & Filters */}
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
            
            {/* Quick Stats */}
            <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-white border border-border/50 shadow-sm">
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">{formatCurrency(totalMontant)}</p>
                <p className="text-[10px] text-muted-foreground font-medium">Total TTC</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-sm font-bold text-amber-600">{formatCurrency(totalResteAPayer)}</p>
                <p className="text-[10px] text-muted-foreground font-medium">En attente</p>
              </div>
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
                  <TableHead className="text-right font-bold text-foreground">Montant TTC</TableHead>
                  <TableHead className="text-right font-bold text-foreground">Reste à payer</TableHead>
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
                        <p className="text-muted-foreground font-medium">Chargement des factures...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredFactures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="bg-muted/50 rounded-full p-4">
                          <Receipt className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground font-medium">
                          {searchQuery ? 'Aucune facture trouvée' : 'Aucune facture créée'}
                        </p>
                        {!searchQuery && (
                          <Button 
                            variant="outline" 
                            className="mt-2"
                            onClick={openNewForm}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Créer votre première facture
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFactures.map((facture) => {
                    const status = getStatusConfig(facture.statut);
                    const StatusIcon = status.icon;
                    
                    return (
                      <TableRow 
                        key={facture.id} 
                        className="hover:bg-muted/30 transition-colors border-b border-border/30 last:border-0"
                      >
                        <TableCell>
                          <span className="font-mono font-bold text-primary">{facture.numero}</span>
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold text-foreground">
                            {facture.client?.nom || facture.client?.nomSociete || '-'}
                          </p>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(facture.dateEmission), 'dd MMM yyyy', { locale: fr })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-foreground">{formatCurrency(facture.montantTtc)}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn(
                            "font-semibold",
                            (facture.resteAPayer || 0) > 0 ? "text-amber-600" : "text-emerald-600"
                          )}>
                            {formatCurrency(facture.resteAPayer || 0)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Select
                            value={facture.statut}
                            onValueChange={(val) => handleStatusChange(facture.id, val)}
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
                            {!['payée', 'reste_a_payer'].includes(facture.statut) && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-9 w-9 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all"
                                onClick={() => handleMarkAsPaid(facture.id)}
                                title="Marquer comme payée"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 text-primary hover:text-primary/80 hover:bg-primary/5 rounded-lg transition-all"
                              onClick={() => handleDownload(facture)}
                              title="Télécharger PDF"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                              onClick={() => handleEdit(facture)}
                              title="Modifier"
                            >
                              <FileEdit className="h-4 w-4" />
                            </Button>
                            {facture.statut === 'brouillon' ? (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                onClick={() => {
                                  setFactureToDelete(facture.id);
                                  setDeleteConfirmOpen(true);
                                }}
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            ) : facture.statut !== 'annulée' ? (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                onClick={() => handleAnnuler(facture)}
                                title="Annuler la facture (créer un avoir)"
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
        </>
      )}
    </div>
  );
}
