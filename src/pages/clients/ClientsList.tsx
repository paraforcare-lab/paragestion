import { useEffect, useState } from 'react';
import { Plus, Search, FileEdit, Trash2, Users, Building2, User, Phone, Mail, MapPin } from 'lucide-react';
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
import { ClientForm } from '@/components/forms/ClientForm';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Client {
  id: number;
  code: string;
  nom: string;
  type: string;
  email: string;
  telephone: string;
  ice: string | null;
  adresse?: string;
  created_at?: string;
}

export function ClientsList() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<number | null>(null);

  const fetchClients = async () => {
    if (!user?.id) {
      console.log('No user logged in');
      setClients([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    console.log('=== FETCHING CLIENTS for user_id:', user.id);
    
    try {
      // Fetch ALL columns
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      console.log('Query result:', { data, error });
      
      if (error) {
        console.error('Supabase error:', error);
        toast.error('Erreur: ' + error.message);
        setClients([]);
        setIsLoading(false);
        return;
      }
      
      if (!data || data.length === 0) {
        console.log('No clients for user_id:', user.id);
        setClients([]);
        setIsLoading(false);
        return;
      }
      
      console.log('Found:', data.length, 'clients', data[0]);
      setClients(data);
    } catch (error: any) {
      console.error('ERROR:', error);
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchClients();
    }
  }, [user?.id]);

  const handleDelete = async () => {
    if (!clientToDelete || !user?.id) return;
    try {
      // Only delete if belongs to this user
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientToDelete)
        .eq('user_id', user.id);
      
      if (error) throw error;
      toast.success('Client supprimé avec succès');
      fetchClients();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleteConfirmOpen(false);
      setClientToDelete(null);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsDialogOpen(true);
  };

  const filteredClients = clients.filter((client) =>
    client.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.telephone?.includes(searchQuery)
  );

  const clientsCount = clients.length;
  const entreprisesCount = clients.filter(c => c.type === 'entreprise').length;
  const particuliersCount = clients.filter(c => c.type === 'particulier').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer le client"
        description="Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible."
      />

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight text-foreground">Clients</h2>
              <p className="text-sm text-muted-foreground">
                Gérez votre base de données clients
              </p>
            </div>
          </div>
        </div>

         <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingClient(null);
        }}>
          <DialogTrigger render={
            <Button className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary hover:to-primary text-white font-bold shadow-lg shadow-primary/30 rounded-xl h-11 px-6">
              <Plus className="mr-2 h-5 w-5" />
              Nouveau Client
            </Button>
          } />
          <DialogContent fullScreen className="bg-gradient-to-br from-background to-muted/20">
            <div className="flex flex-col h-full">
              <DialogHeader className="px-8 py-6 border-b border-border/50 bg-white/50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto w-full">
                  <DialogTitle className="text-2xl font-black text-foreground">
                    {editingClient ? 'Modifier le client' : 'Nouveau Client'}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-muted-foreground">
                    {editingClient 
                      ? `Modification du client ${editingClient.nom}` 
                      : 'Ajoutez un nouveau client à votre base de données'}
                  </DialogDescription>
                </div>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-7xl mx-auto">
                  <div className="bg-white rounded-2xl shadow-lg border border-border/50 p-8">
                    <ClientForm 
                      initialData={editingClient}
                      onSuccess={() => {
                        setIsDialogOpen(false);
                        setEditingClient(null);
                        fetchClients();
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
           placeholder="Rechercher par nom, code, email ou téléphone..."
           className="pl-12 h-12 bg-white border-border/50 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
           value={searchQuery}
           onChange={(e) => setSearchQuery(e.target.value)}
         />
       </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/50 bg-white shadow-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-muted/50 to-muted/30 hover:bg-muted/50 border-b border-border/50">
              <TableHead className="w-[140px] font-bold text-foreground">Code</TableHead>
              <TableHead className="font-bold text-foreground">Client</TableHead>
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
                    <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-muted-foreground font-medium">Chargement des clients...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="bg-muted/50 rounded-full p-4">
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium">
                      {searchQuery ? 'Aucun client trouvé' : 'Aucun client enregistré'}
                    </p>
                    {!searchQuery && (
                      <Button 
                        variant="outline" 
                        className="mt-2"
                        onClick={() => setIsDialogOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter votre premier client
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client, index) => (
                <TableRow 
                  key={client.id} 
                  className="hover:bg-muted/30 transition-colors border-b border-border/30 last:border-0"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TableCell className="font-mono font-bold text-primary">
                    {client.code || `C${client.id}`}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                        client.type === 'entreprise' 
                          ? "bg-gradient-to-br from-primary/10 to-primary/5 text-primary" 
                          : "bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600"
                      )}>
                        {client.type === 'entreprise' ? (
                          <Building2 className="h-5 w-5" />
                        ) : (
                          <User className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{client.nom || '-'}</p>
                        {client.adresse && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {client.adresse}
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
                        client.type === 'entreprise' 
                          ? "bg-primary/10 text-primary border-primary/20" 
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      )}
                    >
                      {client.type === 'entreprise' ? 'Entreprise' : 'Particulier'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {client.email && (
                        <p className="text-sm font-medium text-foreground flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {client.email}
                        </p>
                      )}
                      {client.telephone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          {client.telephone}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm text-muted-foreground">
                      {client.ice || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-all" 
                        onClick={() => handleEdit(client)}
                      >
                        <FileEdit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" 
                        onClick={() => {
                          setClientToDelete(client.id);
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
