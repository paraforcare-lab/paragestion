import { useEffect, useState, useRef } from 'react';
import { Search, FileText, Download, Trash2, RotateCcw, Receipt } from 'lucide-react';
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
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import { FactureDocument } from '@/components/documents/FactureDocument';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Avoir {
  id: number;
  numero: string;
  factureId: number;
  facture: { numero: string; statut: string };
  clientId: number;
  client: { nom: string; nomSociete?: string };
  dateEmission: string;
  montantHt: number;
  montantTva: number;
  montantTtc: number;
  statut: string;
}

export function AvoirsList() {
  const { user } = useAuth();
  const [avoirs, setAvoirs] = useState<Avoir[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [avoirToDelete, setAvoirToDelete] = useState<number | null>(null);
  
  const [printingAvoir, setPrintingAvoir] = useState<any>(null);
  const [entreprise, setEntreprise] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: printingAvoir ? `Avoir_${printingAvoir.numero}` : 'Avoir',
    onAfterPrint: () => setPrintingAvoir(null),
  });

  const mapAvoir = (a: any) => ({
    ...a,
    id: a.id,
    numero: a.numero || '',
    factureId: a.facture_id,
    clientId: a.client_id,
    client: a.client,
    facture: a.facture,
    dateEmission: a.date_emission,
    montantHt: Number(a.montant_ht || a.montantHt || 0),
    montantTva: Number(a.montant_tva || a.montantTva || 0),
    montantTtc: Number(a.montant_ttc || a.montantTtc || 0),
    statut: a.statut || 'en_attente',
  });

  const fetchAvoirs = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('avoirs')
        .select('*, facture:factures(*), client:clients(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAvoirs(Array.isArray(data) ? (data || []).map(mapAvoir) : []);
    } catch (error) {
      console.error('Failed to fetch avoirs', error);
      toast.error('Erreur lors du chargement des avoirs');
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
      
      if (error && error.code !== 'PGRST116') throw error;
      setEntreprise(data || null);
    } catch (error) {
      console.error('Failed to fetch entreprise settings', error);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchAvoirs();
      fetchEntreprise();
    }
  }, [user?.id]);

  useEffect(() => {
    if (printingAvoir && printRef.current) {
      handlePrint();
    }
  }, [printingAvoir, handlePrint]);

  const handleDownload = async (avoir: Avoir) => {
    try {
      toast.info('Préparation du PDF...');
      
      const { data: lignesData } = await supabase.from('avoir_lignes').select('*').eq('avoir_id', avoir.id).order('ordre');
      
      const adaptedData = {
        id: avoir.id,
        numero: avoir.numero,
        client: avoir.client,
        clientId: avoir.clientId,
        dateEmission: avoir.dateEmission,
        dateEcheance: avoir.dateEmission,
        montantHt: avoir.montantHt,
        montantTva: avoir.montantTva,
        montantTtc: avoir.montantTtc,
        montant_ht: avoir.montantHt,
        montant_tva: avoir.montantTva,
        montant_ttc: avoir.montantTtc,
        lignes: (lignesData || []).map((l: any) => ({
          designation: l.designation || '',
          quantite: l.quantite,
          prixUnitaireHt: l.prix_unitaire_ht,
          prix_unitaire_ht: l.prix_unitaire_ht,
          tva: l.tva,
          montantHt: l.montant_ht,
          montant_ht: l.montant_ht,
          montantTtc: l.montant_ttc,
          montant_ttc: l.montant_ttc,
        })),
        statut: avoir.statut,
        isAvoir: true,
        type: 'AVOIR',
        numeroFactureOriginale: avoir.facture?.numero || '',
      };
      
      setPrintingAvoir(adaptedData);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur lors du chargement des détails de l\'avoir');
    }
  };

  const handleDelete = async () => {
    if (!avoirToDelete) return;
    try {
      const { error } = await supabase.from('avoirs').delete().eq('id', avoirToDelete);
      if (error) throw error;
      toast.success('Avoir supprimé');
      fetchAvoirs();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleteConfirmOpen(false);
      setAvoirToDelete(null);
    }
  };

  const filteredAvoirs = (avoirs || []).filter((avoir) => {
    const search = searchQuery.toLowerCase();
    return (
      avoir.numero?.toLowerCase().includes(search) ||
      avoir.facture?.numero?.toLowerCase().includes(search) ||
      avoir.client?.nom?.toLowerCase().includes(search) ||
      avoir.client?.nomSociete?.toLowerCase().includes(search)
    );
  });

  const totalAvoirs = filteredAvoirs.reduce((sum, a) => sum + a.montantTtc, 0);
  const avoirsCount = filteredAvoirs.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer l'avoir"
        description="Êtes-vous sûr de vouloir supprimer cet avoir ? Cette action est irréversible."
      />
      <div style={{ display: 'none' }}>
        {printingAvoir && (
          <FactureDocument ref={printRef} facture={printingAvoir} entreprise={entreprise} />
        )}
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-500/5">
              <RotateCcw className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight text-foreground">Avoirs</h2>
              <p className="text-sm text-muted-foreground">
                Gérez les avoirs liés aux factures annulées
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div className="text-center px-4 py-2 rounded-xl bg-gradient-to-r from-muted/50 to-transparent">
            <p className="text-2xl font-black text-foreground">{avoirsCount}</p>
            <p className="text-xs text-muted-foreground font-medium">Total</p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="text-center px-4 py-2 rounded-xl bg-gradient-to-r from-orange-50/50 to-transparent">
            <p className="text-2xl font-black text-orange-600">{formatCurrency(totalAvoirs)}</p>
            <p className="text-xs text-muted-foreground font-medium">Montant Total</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Rechercher par numéro, facture ou client..."
            className="pl-12 h-12 bg-white border-border/50 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-muted/30 to-transparent py-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="h-5 w-5 text-primary" />
            Liste des Avoirs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 border-b border-border/50">
                <TableHead className="font-bold">Numéro</TableHead>
                <TableHead className="font-bold">Facture d'origine</TableHead>
                <TableHead className="font-bold">Client</TableHead>
                <TableHead className="font-bold">Date</TableHead>
                <TableHead className="text-right font-bold">Montant HT</TableHead>
                <TableHead className="text-right font-bold">TVA</TableHead>
                <TableHead className="text-right font-bold">Montant TTC</TableHead>
                <TableHead className="text-center font-bold">Statut</TableHead>
                <TableHead className="text-right font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <p className="text-muted-foreground font-medium">Chargement des avoirs...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredAvoirs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="bg-muted/50 rounded-full p-4">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground font-medium">
                        {searchQuery ? 'Aucun avoir trouvé' : 'Aucun avoir créé'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAvoirs.map((avoir) => (
                  <TableRow key={avoir.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <span className="font-mono font-bold text-primary">{avoir.numero || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono bg-orange-50 border-orange-200 text-orange-700">
                        {avoir.facture?.numero || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-foreground">
                        {avoir.client?.nom || avoir.client?.nomSociete || '-'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {avoir.dateEmission ? format(new Date(avoir.dateEmission), 'dd MMM yyyy', { locale: fr }) : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(avoir.montantHt)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(avoir.montantTva)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-red-600">
                      {formatCurrency(avoir.montantTtc)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 font-medium">
                        {avoir.statut}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                          onClick={() => handleDownload(avoir)}
                          title="Télécharger PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          onClick={() => {
                            setAvoirToDelete(avoir.id);
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
        </CardContent>
      </Card>
    </div>
  );
}
