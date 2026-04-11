import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const depenseSchema = z.object({
  categorie: z.string().min(1, 'La catégorie est requise'),
  description: z.string().min(1, 'La description est requise'),
  montantHt: z.coerce.number().min(0, 'Le montant doit être positif'),
  tva: z.coerce.number().min(0).max(100),
  dateDepense: z.string().min(1, 'La date est requise'),
  modePaiement: z.string().min(1, 'Le mode de paiement est requis'),
  fournisseurId: z.string().optional(),
  notes: z.string().optional(),
});

type DepenseFormValues = z.infer<typeof depenseSchema>;

interface DepenseFormProps {
  initialData?: any;
  onSuccess: () => void;
}

export function DepenseForm({ initialData, onSuccess }: DepenseFormProps) {
  const [fournisseurs, setFournisseurs] = useState<any[]>([]);
  const [parametres, setParametres] = useState<any>(null);

  const form = useForm<DepenseFormValues>({
    resolver: zodResolver(depenseSchema) as any,
    defaultValues: initialData || {
      categorie: 'fournitures',
      description: '',
      montantHt: 0,
      tva: 20,
      dateDepense: new Date().toISOString().split('T')[0],
      modePaiement: 'virement',
      fournisseurId: '',
      notes: '',
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: fournisseursData }, { data: parametresData }] = await Promise.all([
          supabase.from('fournisseurs').select('*').order('nom'),
          supabase.from('parametres').select('*').limit(1)
        ]);
        
        setFournisseurs(fournisseursData || []);
        setParametres(parametresData?.[0] || null);
        
        if (initialData) {
          form.reset({
            ...initialData,
            fournisseurId: initialData.fournisseurId?.toString(),
            dateDepense: initialData.dateDepense ? new Date(initialData.dateDepense).toISOString().split('T')[0] : '',
            montantHt: Number(initialData.montantHt || 0),
            tva: Number(initialData.tva || 20)
          });
        } else if (parametresData?.[0]) {
          form.setValue('notes', parametresData[0].pied_page_defaut || '');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setFournisseurs([]);
      }
    };
    fetchData();
  }, []);

  const onSubmit = async (data: DepenseFormValues) => {
    try {
      const montantHt = Number(data.montantHt);
      const tva = Number(data.tva);
      const montantTva = montantHt * (tva / 100);
      const montantTtc = montantHt + montantTva;

      const payload = {
        ...data,
        montant_ht: Number(data.montantHt),
        montant_tva: Number(montantTva),
        montant_ttc: Number(montantTtc),
        date_depense: new Date(data.dateDepense).toISOString(),
        fournisseur_id: (data.fournisseurId && data.fournisseurId !== 'none') ? Number(data.fournisseurId) : null,
      };
      
      delete (payload as any).montantHt;
      delete (payload as any).montantTva;
      delete (payload as any).montantTtc;
      delete (payload as any).dateDepense;
      delete (payload as any).fournisseurId;
      delete (payload as any).tva;

      if (initialData?.id) {
        const { error } = await supabase.from('depenses').update(payload).eq('id', initialData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('depenses').insert([payload]);
        if (error) throw error;
      }

      toast.success(initialData ? 'Dépense modifiée' : 'Dépense ajoutée');
      onSuccess();
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="categorie"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-semibold">Catégorie *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger className="bg-white border-slate-300">
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="fournitures">Fournitures</SelectItem>
                      <SelectItem value="loyer">Loyer</SelectItem>
                      <SelectItem value="salaires">Salaires</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateDepense"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-semibold">Date de la dépense *</FormLabel>
                  <FormControl>
                    <Input type="date" className="bg-white border-slate-300" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700 font-semibold">Description *</FormLabel>
                <FormControl>
                  <Input placeholder="Achat de matériel, loyer bureau..." className="bg-white border-slate-300" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="montantHt"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700 font-semibold">Montant HT (DH) *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" className="bg-white border-slate-300 font-mono" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tva"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700 font-semibold">TVA (%) *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" className="bg-white border-slate-300 font-mono" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-col justify-end pb-2">
            <div className="bg-slate-100 p-2 rounded border border-slate-200 text-right">
              <span className="text-xs text-slate-500 block uppercase font-bold">Total TTC estimé</span>
              <span className="text-lg font-bold text-slate-800">
                {formatCurrency(Number(form.watch('montantHt') || 0) * (1 + Number(form.watch('tva') || 0) / 100))}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="modePaiement"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700 font-semibold">Mode de paiement *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger className="bg-white border-slate-300">
                      <SelectValue placeholder="Sélectionner un mode" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="espèces">Espèces</SelectItem>
                    <SelectItem value="chèque">Chèque</SelectItem>
                    <SelectItem value="virement">Virement</SelectItem>
                    <SelectItem value="carte">Carte bancaire</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fournisseurId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700 font-semibold">Fournisseur (Optionnel)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger className="bg-white border-slate-300">
                      <SelectValue placeholder="Sélectionner un fournisseur" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {fournisseurs.map((f) => (
                      <SelectItem key={f.id} value={f.id?.toString() || ''}>
                        {f.nomSociete || f.nom || `Fournisseur ${f.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-700 font-semibold">Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Informations complémentaires, n° de facture fournisseur..." 
                  className="bg-white border-slate-300 min-h-[80px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end items-center space-x-4 pt-6 border-t">
          <Button type="button" variant="ghost" onClick={onSuccess} className="text-slate-500 hover:text-slate-700">
            Annuler
          </Button>
          <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white px-8 h-11 font-bold shadow-lg shadow-red-100">
            {initialData ? 'Mettre à jour la dépense' : 'Enregistrer la dépense'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
