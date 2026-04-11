import { useEffect, useState } from 'react';
import { Plus, Search, FileEdit, Trash2 } from 'lucide-react';
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
} from '@/components/ui/dialog';
import { DepenseForm } from '@/components/forms/DepenseForm';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { supabase } from '@/lib/supabase';

interface Depense {
  id: number;
  reference: string;
  categorie: string;
  description: string;
  montantTtc: number;
  dateDepense: string;
  modePaiement: string;
  fournisseur?: { nomSociete: string };
}

export function DepensesList() {
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepense, setEditingDepense] = useState<any | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [depenseToDelete, setDepenseToDelete] = useState<number | null>(null);

  const fetchDepenses = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('depenses').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setDepenses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch depenses', error);
      setDepenses([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepenses();
  }, []);

  const handleDelete = async () => {
    if (!depenseToDelete) return;
    
    try {
      const { error } = await supabase.from('depenses').delete().eq('id', depenseToDelete);
      if (error) throw error;
      toast.success('Dépense supprimée');
      fetchDepenses();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleteConfirmOpen(false);
      setDepenseToDelete(null);
    }
  };

  const handleEdit = (depense: any) => {
    // Format data for the form
    const formattedDepense = {
      ...depense,
      dateDepense: depense.dateDepense ? depense.dateDepense.split('T')[0] : '',
      fournisseurId: depense.fournisseurId ? depense.fournisseurId.toString() : 'none',
      tva: depense.montantHt > 0 ? (depense.montantTva / depense.montantHt) * 100 : 0,
    };
    setEditingDepense(formattedDepense);
    setIsDialogOpen(true);
  };

  const filteredDepenses = depenses.filter((depense) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      (depense.description?.toLowerCase() || '').includes(query) ||
      (depense.categorie?.toLowerCase() || '').includes(query) ||
      (depense.reference?.toLowerCase() || '').includes(query) ||
      (depense.fournisseur?.nomSociete?.toLowerCase() || '').includes(query)
    );
  });

  const getCategorieBadge = (categorie: string) => {
    switch (categorie) {
      case 'fournitures':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Fournitures</Badge>;
      case 'loyer':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Loyer</Badge>;
      case 'salaires':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Salaires</Badge>;
      case 'marketing':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Marketing</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Autre</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer la dépense"
        description="Êtes-vous sûr de vouloir supprimer cette dépense ? Cette action est irréversible."
      />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dépenses</h2>
          <p className="text-muted-foreground">
            Suivez et gérez les dépenses de votre entreprise.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingDepense(null);
        }}>
          <DialogTrigger render={<Button className="bg-[#267E54] hover:bg-[#1e6643]">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Dépense
            </Button>} />
          <DialogContent fullScreen>
            <div className="flex flex-col h-full">
              <DialogHeader className="px-6 py-4 border-b">
                <DialogTitle>
                  {editingDepense ? 'Modifier la dépense' : 'Ajouter une dépense'}
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto p-6 bg-white">
                <div className="max-w-7xl mx-auto">
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
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher une dépense..."
            className="pl-8 h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Référence</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Fournisseur</TableHead>
              <TableHead className="text-right">Montant TTC</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Chargement des dépenses...
                </TableCell>
              </TableRow>
            ) : filteredDepenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Aucune dépense trouvée.
                </TableCell>
              </TableRow>
            ) : (
              filteredDepenses.map((depense) => (
                <TableRow key={depense.id}>
                  <TableCell>
                    {format(new Date(depense.dateDepense), 'dd MMM yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell className="font-medium">{depense.reference}</TableCell>
                  <TableCell>{depense.description}</TableCell>
                  <TableCell>{getCategorieBadge(depense.categorie)}</TableCell>
                  <TableCell>{(depense.fournisseur as any)?.nomSociete || (depense.fournisseur as any)?.nom || '-'}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(depense.montantTtc)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleEdit(depense)}
                      >
                        <FileEdit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => {
                          setDepenseToDelete(depense.id);
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
