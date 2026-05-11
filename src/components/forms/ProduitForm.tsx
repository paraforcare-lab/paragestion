import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { ImageUpload } from '@/components/ui/ImageUpload'

const produitSchema = z.object({
  reference: z.string().optional(),
  nom: z.string().min(2, { message: 'Le nom est requis.' }),
  description: z.string().optional(),
  marque: z.string().optional(),
  barcode: z.string().optional(),
  prixVenteHt: z.coerce.number().min(0),
  prixAchatHt: z.coerce.number().min(0),
  tauxTva: z.coerce.number().min(0).max(100),
  stockActuel: z.coerce.number().int(),
  stockMin: z.coerce.number().int().optional(),
  unite: z.string().optional(),
  imageUrl: z.string().optional(),
});

type ProduitFormValues = z.infer<typeof produitSchema>;

interface ProduitFormProps {
  initialData?: any;
  onSuccess?: () => void;
}

export function ProduitForm({ initialData, onSuccess }: ProduitFormProps) {
  const { user } = useAuth();
  const form = useForm<ProduitFormValues>({
    resolver: zodResolver(produitSchema) as any,
    defaultValues: {
      reference: initialData?.reference || '',
      nom: initialData?.nom || '',
      marque: initialData?.marque || '',
      barcode: initialData?.barcode || '',
      description: initialData?.description || '',
      prixVenteHt: initialData?.prixVenteHt || 0,
      prixAchatHt: initialData?.prixAchatHt || 0,
      tauxTva: initialData?.tauxTva || initialData?.tva || 20,
      stockActuel: initialData?.stockActuel || 0,
      stockMin: initialData?.stockMin || 5,
      unite: initialData?.unite || 'unité',
      imageUrl: initialData?.imageUrl || initialData?.image_url || '',
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  async function onSubmit(data: ProduitFormValues) {
    try {
      const prixVenteHT = Number(data.prixVenteHt) || 0;
      const prixAchatHT = Number(data.prixAchatHt) || 0;
      const tauxTVA = Number(data.tauxTva) || 20;
      const prixVenteTTC = prixVenteHT * (1 + tauxTVA / 100);
      const prixAchatTTC = prixAchatHT * (1 + tauxTVA / 100);
      const stockActuel = Number(data.stockActuel) || 0;
      const stockMin = Number(data.stockMin) || 5;

       const payload = {
         reference: data.reference?.trim() || null,
         nom: data.nom?.trim() || null,
         designation: data.nom?.trim() || null,
         marque: data.marque?.trim() || null,
         barcode: data.barcode?.trim() || null,
         description: data.description?.trim() || null,
         prix_vente_ht: prixVenteHT,
         prix_vente_ttc: prixVenteTTC,
         prix_achat_ht: prixAchatHT,
         prix_achat_ttc: prixAchatTTC,
         taux_tva: tauxTVA,
         stock_actuel: stockActuel,
         stock_min: stockMin,
         unite: data.unite?.trim() || 'unité',
         image_url: data.imageUrl || null,
       };

      let result;
      if (initialData?.id) {
        result = await supabase.from('produits').update(payload).eq('id', initialData.id).select();
      } else {
        result = await supabase.from('produits').insert([{ ...payload, user_id: user?.id }]).select();
      }

      if (result.error) {
        console.error('Supabase error:', result.error);
        throw new Error(result.error.message);
      }

      toast.success('Produit enregistré avec succès');
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'enregistrement du produit');
      console.error(error);
    }
  }

   return (
     <Form {...form}>
       <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="md:col-span-1 space-y-4">
             <FormField
               control={form.control}
               name="imageUrl"
               render={({ field }) => (
                 <FormItem>
                   <FormControl>
                     <ImageUpload
                       value={field.value || undefined}
                       onChange={field.onChange}
                       label="Image du produit"
                     />
                   </FormControl>
                   <FormMessage />
                 </FormItem>
               )}
             />
           </div>
           <div className="md:col-span-2 space-y-4">
         <div className="grid grid-cols-2 gap-4">
           <FormField
             control={form.control}
             name="reference"
             render={({ field }) => (
               <FormItem>
                 <FormLabel>Référence</FormLabel>
                 <FormControl>
                   <Input placeholder="REF-001" {...field} />
                 </FormControl>
                 <FormMessage />
               </FormItem>
             )}
           />

           <FormField
             control={form.control}
             name="barcode"
             render={({ field }) => (
               <FormItem>
                 <FormLabel>Code-barres (EAN)</FormLabel>
                 <FormControl>
                   <Input placeholder="6111234567890" {...field} />
                 </FormControl>
                 <FormMessage />
               </FormItem>
             )}
           />
         </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom du produit</FormLabel>
                <FormControl>
                  <Input placeholder="Ordinateur Portable" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="marque"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marque / Laboratoire</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Vichy, Bioderma..." {...field} />
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Description détaillée..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="prixAchatHt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prix Achat HT</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="prixVenteHt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prix Vente HT</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tauxTva"
            render={({ field }) => (
              <FormItem>
                <FormLabel>TVA (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="stockActuel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock Actuel</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stockMin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock Minimum</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unite"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unité</FormLabel>
                <FormControl>
                  <Input placeholder="pièce, kg, litre..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
         </div>
           </div>
         </div>

         <div className="flex justify-end pt-6 border-t mt-6">
           <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 h-10 rounded-[4px] shadow-none">
             Enregistrer le produit
           </Button>
         </div>
       </form>
     </Form>
   );
 }
