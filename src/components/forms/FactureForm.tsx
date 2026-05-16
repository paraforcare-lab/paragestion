import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { updateStockAndNotify, ensureLowStockNotifications } from '@/lib/notifications'

const ligneSchema = z.object({
  produitId: z.string().optional(),
  reference: z.string().optional(),
  designation: z.string().min(1, 'La désignation est requise'),
  quantite: z.number().min(0.01, 'La quantité doit être supérieure à 0'),
  prixUnitaireHt: z.number().min(0, 'Le prix doit être positif'),
  tva: z.number().min(0, 'La TVA doit être positive'),
});

const factureSchema = z.object({
  clientId: z.string().min(1, 'Le client est requis'),
  dateEmission: z.string().min(1, 'La date d\'émission est requise'),
  dateEcheance: z.string().optional(),
  statut: z.string().min(1, 'Le statut est requis'),
  modePaiement: z.string().optional(),
  notes: z.string().optional(),
  conditionsPaiement: z.string().optional(),
  resteAPayer: z.number().min(0, 'Le reste à payer doit être positif').optional(),
  lignes: z.array(ligneSchema).min(1, 'Au moins une ligne est requise'),
});

type FactureFormValues = z.infer<typeof factureSchema>;

interface FactureFormProps {
  initialData?: any;
  onSuccess: () => void;
}

export function FactureForm({ initialData, onSuccess }: FactureFormProps) {
  const { user } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [produits, setProduits] = useState<any[]>([]);
  const [parametres, setParametres] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FactureFormValues>({
    resolver: zodResolver(factureSchema),
    defaultValues: initialData || {
      clientId: '',
      dateEmission: new Date().toISOString().split('T')[0],
      dateEcheance: '',
      statut: 'brouillon',
      modePaiement: 'Virement',
      notes: '',
      conditionsPaiement: '',
      resteAPayer: 0,
      lignes: [
        {
          designation: '',
          quantite: 1,
          prixUnitaireHt: 0,
          tva: 20,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lignes',
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      
      try {
        const [{ data: clientsData }, { data: produitsData }, { data: parametresData }] = await Promise.all([
          supabase.from('clients').select('*').eq('user_id', user.id).order('nom'),
          supabase.from('produits').select('*').eq('user_id', user.id).order('nom'),
          supabase.from('parametres').select('*').eq('user_id', user.id).limit(1)
        ]);
        
        setClients(clientsData || []);
        setProduits(produitsData || []);
        setParametres(parametresData?.[0] || null);
        
        if (initialData) {
          form.reset({
            ...initialData,
            clientId: initialData.clientId?.toString() || '',
            dateEmission: initialData.dateEmission ? new Date(initialData.dateEmission).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            dateEcheance: initialData.dateEcheance ? new Date(initialData.dateEcheance).toISOString().split('T')[0] : '',
            lignes: initialData.lignes?.map((l: any) => ({
              ...l,
              produitId: l.produitId?.toString() || '',
            })) || [],
          });
        } else if (parametresData?.[0]) {
          form.setValue('conditionsPaiement', parametresData[0].conditions_paiement_defaut || '');
          form.setValue('notes', parametresData[0].pied_page_defaut || '');
        }
      } catch (error) {
        toast.error('Erreur lors du chargement des données');
      }
    };
    fetchData();
  }, []);

  const watchLignes = form.watch('lignes');
  const watchStatut = form.watch('statut');
  const watchResteAPayer = form.watch('resteAPayer');
  const watchModePaiement = form.watch('modePaiement');

  // Calculate totals
  const baseTotals = watchLignes.reduce(
    (acc, ligne) => {
      const montantHt = (ligne.quantite || 0) * (ligne.prixUnitaireHt || 0);
      const montantTva = montantHt * ((ligne.tva || 0) / 100);
      return {
        ht: acc.ht + montantHt,
        tva: acc.tva + montantTva,
        ttc: acc.ttc + montantHt + montantTva,
      };
    },
    { ht: 0, tva: 0, ttc: 0 }
  );

  const droitTimbre = (watchModePaiement === 'Espèces' && (parametres?.activerDroitTimbre !== false)) ? baseTotals.ttc * 0.0025 : 0;
  const totals = {
    ...baseTotals,
    ttc: baseTotals.ttc + droitTimbre,
    droitTimbre,
  };

  // Update reste à payer when total changes or status changes
  useEffect(() => {
    if (!initialData) {
      // For new invoice, reste à payer is total TTC
      form.setValue('resteAPayer', totals.ttc);
    } else if (watchStatut === 'payée') {
      form.setValue('resteAPayer', 0);
    }
  }, [totals.ttc, watchStatut, initialData]);

  const onSubmit = async (data: FactureFormValues) => {
    setIsLoading(true);
    try {
      // Generate invoice number: FAC-2026-0001
      const year = new Date().getFullYear();
      const randomNum = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
      const invoiceNum = `FAC-${year}-${randomNum}`;

      const payload = {
        client_id: data.clientId === 'none' ? null : Number(data.clientId),
        date_emission: new Date(data.dateEmission).toISOString(),
        date_echeance: data.dateEcheance ? new Date(data.dateEcheance).toISOString() : null,
        numero: invoiceNum,
        statut: data.statut || 'brouillon',
        mode_paiement: data.modePaiement || 'Virement',
        notes: data.notes || '',
        conditions_paiement: data.conditionsPaiement || '',
        montant_ht: Number(totals.ht) || 0,
        montant_tva: Number(totals.tva) || 0,
        montant_ttc: Number(totals.ttc) || 0,
        reste_a_payer: data.statut === 'payée' ? 0 : (Number(data.resteAPayer) || Number(totals.ttc) || 0),
      };

      let factureId = initialData?.id;

      if (!factureId) {
        // Create new facture
        const { data: newFacture, error } = await supabase.from('factures').insert([{ ...payload, user_id: user?.id }]).select().single();
        if (error) throw error;
        factureId = newFacture.id;
      } else {
        // Update existing facture - filter by user_id to prevent updating wrong records
        const { error } = await supabase.from('factures').update(payload).eq('id', factureId).eq('user_id', user?.id);
        if (error) throw error;
        
        // Delete old lignes
        await supabase.from('facture_lignes').delete().eq('facture_id', factureId);
      }

      // Insert lignes
      const lignesPayload = (data.lignes || []).map((ligne: any, index: number) => ({
        facture_id: Number(factureId),
        produit_id: ligne.produitId ? Number(ligne.produitId) : null,
        designation: ligne.designation || 'Article sans désignation',
        quantite: Number(ligne.quantite) || 1,
        prix_unitaire_ht: Number(ligne.prixUnitaireHt) || 0,
        tva: Number(ligne.tva) || 20,
        montant_ht: Number(ligne.prixUnitaireHt || 0) * Number(ligne.quantite || 1) || 0,
        montant_ttc: (Number(ligne.prixUnitaireHt || 0) * Number(ligne.quantite || 1)) * (1 + Number(ligne.tva || 20) / 100) || 0,
        ordre: index,
      }));

      if (lignesPayload.length > 0) {
        const { error: lignesError } = await supabase.from('facture_lignes').insert(lignesPayload);
        if (lignesError) throw lignesError;
      }

      // Update stock for active invoices
      const activeStatuses = ['payée', 'reste_a_payer'];
      if (activeStatuses.includes(data.statut)) {
        const changedIds: (number | string)[] = [];
        for (const ligne of lignesPayload) {
          if (ligne.produit_id) {
            await updateStockAndNotify(user?.id, ligne.produit_id, -Number(ligne.quantite));
            changedIds.push(ligne.produit_id);
          }
        }
        await ensureLowStockNotifications(user?.id, changedIds);
      }

      toast.success(initialData ? 'Facture modifiée' : 'Facture créée');
      onSuccess();
    } catch (error: any) {
      console.error('Facture save error:', error);
      toast.error(error.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProduitSelect = (index: number, produitId: string) => {
    const produit = produits.find((p) => p.id.toString() === produitId);
    if (produit) {
      form.setValue(`lignes.${index}.produitId`, produit.id.toString());
      form.setValue(`lignes.${index}.reference`, produit.reference || '');
      form.setValue(`lignes.${index}.designation`, produit.designation || produit.nom || '');
      form.setValue(`lignes.${index}.prixUnitaireHt`, Number(produit.prixVenteHt || produit.prix_vente_ht || 0));
      form.setValue(`lignes.${index}.tva`, Number(produit.tauxTva || produit.tva || 20));
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <div className="dark:bg-slate-900/40 dark:border-white/10 bg-slate-50 p-4 rounded-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="dark:text-slate-400 text-slate-700 font-semibold">Client *</Label>
            <Select
              value={form.watch('clientId') || ""}
              onValueChange={(val) => form.setValue('clientId', val)}
            >
              <SelectTrigger className="dark:bg-slate-950/50 dark:border-white/10 bg-white border-slate-300">
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.nom || client.nomSociete || '-'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.clientId && (
              <p className="text-xs text-red-500 font-medium">{form.formState.errors.clientId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="dark:text-slate-400 text-slate-700 font-semibold">Date d'émission *</Label>
            <Input type="date" className="dark:bg-slate-950/50 dark:border-white/10 dark:focus:border-[#267E54] bg-white border-slate-300" {...form.register('dateEmission')} />
            {form.formState.errors.dateEmission && (
              <p className="text-xs text-red-500 font-medium">{form.formState.errors.dateEmission.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="dark:text-slate-400 text-slate-700 font-semibold">Date d'échéance</Label>
            <Input type="date" className="dark:bg-slate-950/50 dark:border-white/10 dark:focus:border-[#267E54] bg-white border-slate-300" {...form.register('dateEcheance')} />
          </div>

          <div className="space-y-2">
            <Label className="dark:text-slate-400 text-slate-700 font-semibold">Statut *</Label>
            <Select
              value={form.watch('statut') || ""}
              onValueChange={(val) => form.setValue('statut', val)}
            >
              <SelectTrigger className="dark:bg-slate-950/50 dark:border-white/10 bg-white border-slate-300">
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="brouillon">Brouillon</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="payée">Payée</SelectItem>
                <SelectItem value="reste_a_payer">Reste à payer</SelectItem>
                <SelectItem value="annulée">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="dark:text-slate-400 text-slate-700 font-semibold">Mode de paiement</Label>
            <Select
              value={form.watch('modePaiement') || ""}
              onValueChange={(val) => form.setValue('modePaiement', val)}
            >
              <SelectTrigger className="dark:bg-slate-950/50 dark:border-white/10 bg-white border-slate-300">
                <SelectValue placeholder="Sélectionner un mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Virement">Virement</SelectItem>
                <SelectItem value="Chèque">Chèque</SelectItem>
                <SelectItem value="Espèces">Espèces</SelectItem>
                <SelectItem value="Carte">Carte Bancaire</SelectItem>
                <SelectItem value="Effet">Effet de commerce</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between border-b dark:border-white/10 pb-2">
          <h3 className="text-lg font-bold dark:text-card-foreground text-slate-800">Lignes de facture</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="dark:border-white/10 dark:text-muted-foreground dark:hover:bg-white/5 border-purple-200 text-purple-700 hover:bg-purple-50"
            onClick={() =>
              append({ designation: '', quantite: 1, prixUnitaireHt: 0, tva: 20 })
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une ligne
          </Button>
        </div>

        <div className="border dark:border-white/10 border-slate-200 rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b dark:border-white/10">
              <tr>
                <th className="p-3 text-left font-semibold dark:text-muted-foreground text-slate-600">Produit</th>
                <th className="p-3 text-left font-semibold dark:text-muted-foreground text-slate-600">Désignation *</th>
                <th className="p-3 text-right font-semibold dark:text-muted-foreground text-slate-600 w-24">Qté *</th>
                <th className="p-3 text-right font-semibold dark:text-muted-foreground text-slate-600 w-32">Prix HT *</th>
                <th className="p-3 text-right font-semibold dark:text-muted-foreground text-slate-600 w-24">TVA % *</th>
                <th className="p-3 text-right font-semibold dark:text-muted-foreground text-slate-600 w-32">Total HT</th>
                <th className="p-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-white/10 divide-slate-100">
              {fields.map((field, index) => {
                const ligne = watchLignes[index];
                const totalHt = (ligne?.quantite || 0) * (ligne?.prixUnitaireHt || 0);
                const selectedProductId = form.watch(`lignes.${index}.produitId`);
                const selectedProduct = selectedProductId ? produits.find(p => p.id.toString() === selectedProductId) : null;
                const displayText = selectedProduct ? (selectedProduct.nom || selectedProduct.reference || '-') : (ligne?.designation || '');

                return (
                  <tr key={field.id}>
                    <td className="p-2">
                      <Select
                        value={selectedProductId || ""}
                        onValueChange={(val) => handleProduitSelect(index, val)}
                      >
                        <SelectTrigger className="h-9 dark:bg-slate-950/50 dark:border-white/10 bg-white border-slate-200">
                          {selectedProductId ? (
                            <span className={!selectedProduct ? 'text-orange-500' : ''}>
                              {displayText}
                            </span>
                          ) : (
                            <SelectValue placeholder="Choisir..." />
                          )}
                        </SelectTrigger>
                        <SelectContent className="max-h-[400px] overflow-y-auto">
                          {produits.map((p) => (
                            <SelectItem key={p.id} value={p.id.toString()}>
                              {p.nom || p.reference || '-'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2">
                      <Input
                        className="h-9 dark:bg-slate-950/50 dark:border-white/10 dark:focus:border-[#267E54] bg-white border-slate-200"
                        {...form.register(`lignes.${index}.designation`)}
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        step="0.01"
                        className="h-9 text-right dark:bg-slate-950/50 dark:border-white/10 dark:focus:border-[#267E54] bg-white border-slate-200"
                        {...form.register(`lignes.${index}.quantite`, { valueAsNumber: true })}
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        step="0.01"
                        className="h-9 text-right dark:bg-slate-950/50 dark:border-white/10 dark:focus:border-[#267E54] bg-white border-slate-200"
                        {...form.register(`lignes.${index}.prixUnitaireHt`, { valueAsNumber: true })}
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        step="0.01"
                        className="h-9 text-right dark:bg-slate-950/50 dark:border-white/10 dark:focus:border-[#267E54] bg-white border-slate-200"
                        {...form.register(`lignes.${index}.tva`, { valueAsNumber: true })}
                      />
                    </td>
                    <td className="p-2 text-right font-semibold dark:text-card-foreground text-slate-700 align-middle">
                      {formatCurrency(totalHt)}
                    </td>
                    <td className="p-2 text-center align-middle">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 dark:text-muted-foreground dark:hover:text-red-400 dark:hover:bg-red-500/10 text-red-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {form.formState.errors.lignes && (
          <p className="text-sm text-red-500 font-medium">{form.formState.errors.lignes.message}</p>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="dark:text-slate-400 text-slate-700 font-semibold">Notes</Label>
            <Textarea 
              {...form.register('notes')} 
              placeholder="Notes pour le client..." 
              className="min-h-[100px] dark:bg-slate-950/50 dark:border-white/10 dark:focus:border-[#267E54] bg-white border-slate-300"
            />
          </div>
          <div className="space-y-2">
            <Label className="dark:text-slate-400 text-slate-700 font-semibold">Conditions de paiement</Label>
            <Textarea 
              {...form.register('conditionsPaiement')} 
              placeholder="Ex: Paiement à 30 jours..." 
              className="min-h-[100px] dark:bg-slate-950/50 dark:border-white/10 dark:focus:border-[#267E54] bg-white border-slate-300"
            />
          </div>
        </div>

        <div className="w-full md:w-80">
          <div className="dark:bg-slate-900/60 dark:border-white/10 bg-slate-50 p-6 rounded-sm border border-slate-200 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="dark:text-muted-foreground text-slate-500 font-medium">Total HT</span>
              <span className="font-bold dark:text-card-foreground text-slate-800">{formatCurrency(totals.ht)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="dark:text-muted-foreground text-slate-500 font-medium">Total TVA</span>
              <span className="font-bold dark:text-card-foreground text-slate-800">{formatCurrency(totals.tva)}</span>
            </div>
            {totals.droitTimbre > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="dark:text-muted-foreground text-slate-500 font-medium">Droit de Timbre (0.25%)</span>
                <span className="font-bold dark:text-card-foreground text-slate-800">{formatCurrency(totals.droitTimbre)}</span>
              </div>
            )}
            <div className="h-px dark:bg-white/10 bg-slate-200 my-2" />
            <div className="flex justify-between items-center">
              <span className="dark:text-card-foreground text-slate-900 font-bold text-lg">Total TTC</span>
              <span className="text-2xl font-black text-[#267E54]">{formatCurrency(totals.ttc)}</span>
            </div>
            
            {watchStatut !== 'payée' && (
              <div className="pt-4 border-t dark:border-white/10 border-slate-200">
                <Label className="dark:text-slate-400 text-slate-700 font-semibold mb-2 block">Reste à payer (DH)</Label>
                <Input
                  type="number"
                  step="0.01"
                  className="dark:bg-slate-950/50 dark:border-white/10 dark:focus:border-[#267E54] bg-white border-slate-300 font-bold text-red-600"
                  {...form.register('resteAPayer', { valueAsNumber: true })}
                />
                <p className="text-[10px] dark:text-muted-foreground text-slate-500 mt-1">
                  Ajustez manuellement si un acompte a été versé.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end items-center space-x-4 pt-6 border-t dark:border-white/10">
        <Button type="button" variant="ghost" onClick={() => onSuccess()} className="dark:text-muted-foreground dark:hover:text-card-foreground text-slate-500 hover:text-slate-700">
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-6 h-10 rounded-sm shadow-none">
          {isLoading ? 'Enregistrement...' : 'Enregistrer la facture'}
        </Button>
      </div>
    </form>
  );
}
