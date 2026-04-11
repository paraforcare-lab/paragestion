import { useEffect, useState, useRef } from 'react';
import { Search, FileText, Download, Trash2 } from 'lucide-react';
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

interface Avoir {
  id: number;
  numero: string;
  facture: { numero: string; statut: string };
  client: { nom: string; nomSociete?: string };
  dateEmission: string;
  montantTtc: number;
  statut: string;
}

export function AvoirsList() {
  const [avoirs, setAvoirs] = useState<Avoir[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [avoirToDelete, setAvoirToDelete] = useState<number | null>(null);
  
  // Printing state
  const [printingAvoir, setPrintingAvoir] = useState<any>(null);
  const [entreprise, setEntreprise] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: printingAvoir ? `Avoir_${printingAvoir.numero}` : 'Avoir',
    onAfterPrint: () => setPrintingAvoir(null),
  });

  const fetchAvoirs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/avoirs');
      const data = await res.json();
      setAvoirs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch avoirs', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEntreprise = async () => {
    try {
      const res = await fetch('/api/parametres');
      const data = await res.json();
      setEntreprise(data);
    } catch (error) {
      console.error('Failed to fetch entreprise settings', error);
    }
  };

  useEffect(() => {
    fetchAvoirs();
    fetchEntreprise();
  }, []);

  useEffect(() => {
    if (printingAvoir && printRef.current) {
      handlePrint();
    }
  }, [printingAvoir, handlePrint]);

  const handleDownload = async (avoir: Avoir) => {
    try {
      toast.info('Préparation du PDF...');
      const res = await fetch(`/api/avoirs/${avoir.id}`);
      const data = await res.json();
      
      // Adapt Avoir data to FactureDocument format
      const adaptedData = {
        ...data,
        isAvoir: true,
        type: 'AVOIR'
      };
      
      setPrintingAvoir(adaptedData);
    } catch (error) {
      toast.error('Erreur lors du chargement des détails de l\'avoir');
    }
  };

  const handleDelete = async () => {
    if (!avoirToDelete) return;
    try {
      const res = await fetch(`/api/avoirs/${avoirToDelete}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la suppression');
      }
      toast.success('Avoir supprimé');
      fetchAvoirs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    } finally {
      setDeleteConfirmOpen(false);
      setAvoirToDelete(null);
    }
  };

  const filteredAvoirs = (avoirs || []).filter((avoir) =>
    avoir.numero?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    avoir.facture?.numero?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    avoir.client?.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    avoir.client?.nomSociete?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
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

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Avoirs</h2>
          <p className="text-muted-foreground">
            Consultez les avoirs générés suite aux annulations de factures.
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher un avoir ou une facture..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Numéro</TableHead>
              <TableHead>Facture d'origine</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date d'émission</TableHead>
              <TableHead className="text-right">Montant TTC</TableHead>
              <TableHead className="text-center">Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Chargement des avoirs...
                </TableCell>
              </TableRow>
            ) : filteredAvoirs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Aucun avoir trouvé.
                </TableCell>
              </TableRow>
            ) : (
              filteredAvoirs.map((avoir) => (
                <TableRow key={avoir.id}>
                  <TableCell className="font-medium">{avoir.numero}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {avoir.facture?.numero || '-'}
                    </Badge>
                  </TableCell>
                  <TableCell>{avoir.client?.nom || avoir.client?.nomSociete || '-'}</TableCell>
                  <TableCell>
                    {format(new Date(avoir.dateEmission), 'dd MMM yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell className="text-right font-medium text-red-600">
                    {formatCurrency(avoir.montantTtc)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                      {avoir.statut}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-blue-600 hover:text-blue-700"
                        onClick={() => handleDownload(avoir)}
                        title="Télécharger PDF"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => {
                          setAvoirToDelete(avoir.id);
                          setDeleteConfirmOpen(true);
                        }}
                        disabled={avoir.facture?.statut !== 'payée' && avoir.facture?.statut !== 'reste_a_payer'}
                        title={avoir.facture?.statut !== 'payée' && avoir.facture?.statut !== 'reste_a_payer' ? "Impossible de supprimer si la facture n'est pas payée" : "Supprimer"}
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
