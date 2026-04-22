import { useEffect, useState } from 'react';
import { Plus, Search, FileEdit, Trash2, Truck, Building2, User, Mail, Phone, MapPin } from 'lucide-react';
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
import { FournisseurForm } from '@/components/forms/FournisseurForm';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Fournisseur {
  id: number;
  code: string;
  nom: string;
  nomSociete?: string;
  type: string;
  email: string;
  telephone: string;
  ice: string | null;
  adresse?: string;
  ville?: string;
}

export function FournisseursList() {
  const { user } = useAuth();
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFournisseur, setEditingFournisseur] = useState<Fournisseur | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fournisseurToDelete, setFournisseurToDelete] = useState<number | null>(null);

const fetchFournisseurs = async () => {
    if (!user?.id) {
      setFournisseurs([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    console.log('=== Starting fetch for user:', user.id);
    
    const currentUserId = user.id;
    
    try {
      // Fetch ALL columns
      const result = await supabase
        .from('fournisseurs')
        .select('*')
        .eq('user_id', currentUserId);
      
      console.log('Query result:', result);
      
      if (result.error) {
        console.error('Query error:', result.error);
        toast.error('Error: ' + result.error.message);
        setFournisseurs([]);
        setIsLoading(false);
        return;
      }
      
      let data = result.data || [];
      console.log('Fetched:', data.length, 'records', data[0]);
      
      setFournisseurs(data);
    } catch (error: any) {
      console.error('Catch error:', error);
      setFournisseurs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!fournisseurToDelete || !user?.id) return;
    try {
      // Only delete if belongs to this user
      const { error } = await supabase
        .from('fournisseurs')
        .delete()
        .eq('id', fournisseurToDelete)
        .eq('user_id', user.id);
      
      if (error) throw error;
      toast.success('Fournisseur supprimé avec succès');
      fetchFournisseurs();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleteConfirmOpen(false);
      setFournisseurToDelete(null);
    }
  };

  const handleEdit = (fournisseur: Fournisseur) => {
    setEditingFournisseur(fournisseur);
    setIsDialogOpen(true);
  };

  useEffect(() => {
    if (user?.id) {
      fetchFournisseurs();
    }
  }, [user?.id]);

  const filteredFournisseurs = fournisseurs.filter((fournisseur) => {
    const nom = fournisseur.nom || fournisseur.nomSociete || '';
    return (
      nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (fournisseur.code && fournisseur.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (fournisseur.email && fournisseur.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (fournisseur.telephone && fournisseur.telephone.includes(searchQuery))
    );
  });

  const fournisseursCount = fournisseurs.length;
  const entreprisesCount = fournisseurs.filter(f => f.type === 'entreprise').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer le fournisseur"
        description="Êtes-vous sûr de vouloir supprimer ce fournisseur ? Cette action est irréversible."
      />

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5">
              <Truck className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight text-foreground">Fournisseurs</h2>
              <p className="text-sm text-muted-foreground">
                Gérez vos partenaires et fournisseurs
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 text-sm">
          <div className="text-center">
            <p className="text-2xl font-black text-foreground">{fournisseursCount}</p>
            <p className="text-xs text-muted-foreground font-medium">Total</p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="text-center">
            <p className="text-2xl font-black text-purple-600">{entreprisesCount}</p>
            <p className="text-xs text-muted-foreground font-medium">Entreprises</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingFournisseur(null);
        }}>
          <DialogTrigger render={
            <Button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold shadow-lg shadow-purple-500/30 rounded-xl h-11 px-6">
              <Plus className="mr-2 h-5 w-5" />
              Nouveau Fournisseur
            </Button>
          } />
          <DialogContent fullScreen className="bg-gradient-to-br from-background to-muted/20">
            <div className="flex flex-col h-full">
              <DialogHeader className="px-8 py-6 border-b border-border/50 bg-white/50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto w-full">
                  <DialogTitle className="text-2xl font-black text-foreground">
                    {editingFournisseur ? 'Modifier le fournisseur' : 'Nouveau Fournisseur'}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-muted-foreground">
                    {editingFournisseur 
                      ? `Modification du fournisseur ${editingFournisseur.nom || editingFournisseur.nomSociete}` 
                      : 'Ajoutez un nouveau fournisseur à votre base de données'}
                  </DialogDescription>
                </div>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-7xl mx-auto">
                  <div className="bg-white rounded-2xl shadow-lg border border-border/50 p-8">
                    <FournisseurForm 
                      initialData={editingFournisseur}
                      onSuccess={() => {
                        setIsDialogOpen(false);
                        setEditingFournisseur(null);
                        fetchFournisseurs();
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
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Rechercher par nom, code ou email..."
          className="pl-12 h-12 bg-white border-border/50 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/50 bg-white shadow-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-muted/50 to-muted/30 hover:bg-muted/50 border-b border-border/50">
              <TableHead className="w-[140px] font-bold text-foreground">Code</TableHead>
              <TableHead className="font-bold text-foreground">Fournisseur</TableHead>
              <TableHead className="font-bold text-foreground">Type</TableHead>
              <TableHead className="font-bold text-foreground">Contact</TableHead>
              <TableHead className="font-bold text-foreground">ICE</TableHead>
              <TableHead className="text-right font-bold text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="h-8 w-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                    <p className="text-muted-foreground font-medium">Chargement des fournisseurs...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredFournisseurs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="bg-muted/50 rounded-full p-4">
                      <Truck className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium">
                      {searchQuery ? 'Aucun fournisseur trouvé' : 'Aucun fournisseur enregistré'}
                    </p>
                    {!searchQuery && (
                      <Button 
                        variant="outline" 
                        className="mt-2"
                        onClick={() => setIsDialogOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter votre premier fournisseur
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredFournisseurs.map((fournisseur) => (
                <TableRow 
                  key={fournisseur.id} 
                  className="hover:bg-muted/30 transition-colors border-b border-border/30 last:border-0"
                >
                  <TableCell className="font-mono font-bold text-purple-600">
                    {fournisseur.code || `F${fournisseur.id}`}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                        fournisseur.type === 'entreprise' 
                          ? "bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600" 
                          : "bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600"
                      )}>
                        {fournisseur.type === 'entreprise' ? (
                          <Building2 className="h-5 w-5" />
                        ) : (
                          <User className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{fournisseur.nom || fournisseur.nomSociete || '-'}</p>
                        {fournisseur.adresse && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {fournisseur.ville || fournisseur.adresse}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className={cn(
                        "font-semibold rounded-lg",
                        fournisseur.type === 'entreprise' 
                          ? "bg-purple-50 text-purple-700 border-purple-200" 
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      )}
                    >
                      {fournisseur.type === 'entreprise' ? 'Entreprise' : 'Particulier'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {fournisseur.email && (
                        <p className="text-sm font-medium text-foreground flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {fournisseur.email}
                        </p>
                      )}
                      {fournisseur.telephone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          {fournisseur.telephone}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm text-muted-foreground">
                      {fournisseur.ice || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-all" 
                        onClick={() => handleEdit(fournisseur)}
                      >
                        <FileEdit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" 
                        onClick={() => {
                          setFournisseurToDelete(fournisseur.id);
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
