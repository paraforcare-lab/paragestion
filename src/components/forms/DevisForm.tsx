import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const ligneSchema = z.object({
  produitId: z.string().optional(),
  reference: z.string().optional(),
  designation: z.string().min(1, 'La désignation est requise'),
  quantite: z.number().min(0.01, 'La quantité doit être supérieure à 0'),
  prixUnitaireHt: z.number().min(0, 'Le prix doit être positif'),
  tva: z.number().min(0, 'La TVA doit être positive'),
});

const devisSchema = z.object({
  clientId: z.string().min(1, 'Le client est requis'),
  dateEmission: z.string().min(1, 'La date d\'émission est requise'),
  dateValidite: z.string().min(1, 'La date de validité est requise'),
  statut: z.string().min(1, 'Le statut est requis'),
  modePaiement: z.string().optional(),
  notes: z.string().optional(),
  lignes: z.array(ligneSchema).min(1, 'Au moins une ligne est requise'),
});

type DevisFormValues = z.infer<typeof devisSchema>;

interface DevisFormProps {
  initialData?: any;
  onSuccess: () => void;
}

export function DevisForm({ initialData, onSuccess }: DevisFormProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [produits, setProduits] = useState<any[]>([]);
  const [parametres, setParametres] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<DevisFormValues>({
    resolver: zodResolver(devisSchema),
    defaultValues: initialData || {
      clientId: '',
      dateEmission: new Date().toISOString().split('T')[0],
      dateValidite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +30 days
      statut: 'brouillon',
      modePaiement: 'Virement',
      notes: '',
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
      try {
        const [clientsRes, produitsRes, parametresRes] = await Promise.all([
          fetch('/api/clients'),
          fetch('/api/produits'),
          fetch('/api/parametres'),
        ]);
        const clientsData = await clientsRes.json();
        const produitsData = await produitsRes.json();
        const parametresData = await parametresRes.json();
        
        setClients(clientsData);
        setProduits(produitsData);
        setParametres(parametresData);

        if (initialData) {
          form.reset({
            ...initialData,
            clientId: initialData.clientId?.toString(),
            dateEmission: initialData.dateEmission ? new Date(initialData.dateEmission).toISOString().split('T')[0] : '',
            dateValidite: initialData.dateValidite ? new Date(initialData.dateValidite).toISOString().split('T')[0] : '',
            lignes: initialData.lignes?.map((l: any) => ({
              ...l,
              produitId: l.produitId?.toString(),
              prixUnitaireHt: Number(l.prixUnitaireHt || 0),
              quantite: Number(l.quantite || 0),
              tva: Number(l.tva || 0),
              montantHt: Number(l.montantHt || 0),
              montantTtc: Number(l.montantTtc || 0)
            })) || []
          });
        } else if (parametresData) {
          form.setValue('notes', parametresData.piedPageDefaut || '');
        }
      } catch (error) {
        toast.error('Erreur lors du chargement des données');
      }
    };
    fetchData();
  }, []);

  const watchLignes = form.watch('lignes');

  // Calculate totals
  const totals = watchLignes.reduce(
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

  const onSubmit = async (data: DevisFormValues) => {
    setIsLoading(true);
    try {
      // Prepare data for API
      const payload = {
        clientId: data.clientId === 'none' ? null : parseInt(data.clientId),
        dateEmission: new Date(data.dateEmission).toISOString(),
        dateValidite: new Date(data.dateValidite).toISOString(),
        statut: data.statut,
        modePaiement: data.modePaiement,
        notes: data.notes,
        montantHt: Number(totals.ht),
        montantTva: Number(totals.tva),
        montantTtc: Number(totals.ttc),
        lignes: data.lignes.map((ligne, index) => {
          const mht = Number(ligne.quantite || 0) * Number(ligne.prixUnitaireHt || 0);
          const mtva = mht * (Number(ligne.tva || 0) / 100);
          const mttc = mht + mtva;
          return {
            produit_id: (ligne.produitId && ligne.produitId !== 'none') ? parseInt(ligne.produitId) : null,
            reference: ligne.reference,
            designation: ligne.designation,
            quantite: Number(ligne.quantite || 0),
            prix_unitaire: Number(ligne.prixUnitaireHt || 0),
            tva: Number(ligne.tva || 0),
            montant_ht: mht,
            montant_ttc: mttc,
            ordre: index,
          };
        }),
      };

      const url = initialData ? `/api/devis/${initialData.id}` : '/api/devis';
      const method = initialData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Erreur lors de l\'enregistrement');

      toast.success(initialData ? 'Devis modifié' : 'Devis créé');
      onSuccess();
    } catch (error) {
      toast.error('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProduitSelect = (index: number, produitId: string) => {
    const produit = produits.find((p) => p.id.toString() === produitId);
    if (produit) {
      form.setValue(`lignes.${index}.produitId`, produit.id.toString());
      form.setValue(`lignes.${index}.reference`, produit.reference || '');
      form.setValue(`lignes.${index}.designation`, produit.nom || '');
      form.setValue(`lignes.${index}.prixUnitaireHt`, Number(produit.prixVenteHt));
      form.setValue(`lignes.${index}.tva`, Number(produit.tva));
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="text-slate-700 font-semibold">Client *</Label>
            <Select
              value={form.watch('clientId') || ""}
              onValueChange={(val) => form.setValue('clientId', val)}
            >
              <SelectTrigger className="bg-white border-slate-300">
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
            <Label className="text-slate-700 font-semibold">Date d'émission *</Label>
            <Input type="date" className="bg-white border-slate-300" {...form.register('dateEmission')} />
            {form.formState.errors.dateEmission && (
              <p className="text-xs text-red-500 font-medium">{form.formState.errors.dateEmission.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 font-semibold">Date de validité</Label>
            <Input type="date" className="bg-white border-slate-300" {...form.register('dateValidite')} />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 font-semibold">Statut *</Label>
            <Select
              value={form.watch('statut') || ""}
              onValueChange={(val) => form.setValue('statut', val)}
            >
              <SelectTrigger className="bg-white border-slate-300">
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="brouillon">Brouillon</SelectItem>
                <SelectItem value="envoyé">Envoyé</SelectItem>
                <SelectItem value="accepté">Accepté</SelectItem>
                <SelectItem value="refusé">Refusé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 font-semibold">Mode de paiement suggéré</Label>
            <Select
              value={form.watch('modePaiement') || ""}
              onValueChange={(val) => form.setValue('modePaiement', val)}
            >
              <SelectTrigger className="bg-white border-slate-300">
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
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-lg font-bold text-slate-800">Lignes du devis</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
            onClick={() =>
              append({ designation: '', quantite: 1, prixUnitaireHt: 0, tva: 20 })
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une ligne
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="p-3 text-left font-semibold text-slate-600">Produit</th>
                <th className="p-3 text-left font-semibold text-slate-600">Désignation *</th>
                <th className="p-3 text-right font-semibold text-slate-600 w-24">Qté *</th>
                <th className="p-3 text-right font-semibold text-slate-600 w-32">Prix HT *</th>
                <th className="p-3 text-right font-semibold text-slate-600 w-24">TVA % *</th>
                <th className="p-3 text-right font-semibold text-slate-600 w-32">Total HT</th>
                <th className="p-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fields.map((field, index) => {
                const ligne = watchLignes[index];
                const totalHt = (ligne?.quantite || 0) * (ligne?.prixUnitaireHt || 0);

                return (
                  <tr key={field.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-2">
                      <Select
                        value={form.watch(`lignes.${index}.produitId`) || ""}
                        onValueChange={(val) => handleProduitSelect(index, val)}
                      >
                        <SelectTrigger className="h-9 bg-white border-slate-200">
                          <SelectValue placeholder="Choisir..." />
                        </SelectTrigger>
                        <SelectContent>
                          {produits.map((p) => (
                            <SelectItem key={p.id} value={p.id.toString()}>
                              {p.nom || '-'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2">
                      <Input
                        className="h-9 bg-white border-slate-200"
                        {...form.register(`lignes.${index}.designation`)}
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        step="0.01"
                        className="h-9 text-right bg-white border-slate-200"
                        {...form.register(`lignes.${index}.quantite`, { valueAsNumber: true })}
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        step="0.01"
                        className="h-9 text-right bg-white border-slate-200"
                        {...form.register(`lignes.${index}.prixUnitaireHt`, { valueAsNumber: true })}
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        step="0.01"
                        className="h-9 text-right bg-white border-slate-200"
                        {...form.register(`lignes.${index}.tva`, { valueAsNumber: true })}
                      />
                    </td>
                    <td className="p-2 text-right font-semibold text-slate-700 align-middle">
                      {formatCurrency(totalHt)}
                    </td>
                    <td className="p-2 text-center align-middle">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
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
        <div className="flex-1">
          <div className="space-y-2">
            <Label className="text-slate-700 font-semibold">Notes</Label>
            <Textarea 
              {...form.register('notes')} 
              placeholder="Notes pour le client..." 
              className="min-h-[100px] bg-white border-slate-300"
            />
          </div>
        </div>

        <div className="w-full md:w-80">
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4 shadow-sm">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Total HT</span>
              <span className="font-bold text-slate-800">{formatCurrency(totals.ht)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Total TVA</span>
              <span className="font-bold text-slate-800">{formatCurrency(totals.tva)}</span>
            </div>
            <div className="h-px bg-slate-200 my-2" />
            <div className="flex justify-between items-center">
              <span className="text-slate-900 font-bold text-lg">Total TTC</span>
              <span className="text-2xl font-black text-blue-600">{formatCurrency(totals.ttc)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end items-center space-x-4 pt-6 border-t">
        <Button type="button" variant="ghost" onClick={() => onSuccess()} className="text-slate-500 hover:text-slate-700">
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-11 font-bold shadow-lg shadow-blue-100">
          {isLoading ? 'Enregistrement...' : 'Enregistrer le devis'}
        </Button>
      </div>
    </form>
  );
}
