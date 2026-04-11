import { useEffect } from 'react';
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
import { toast } from 'sonner';

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
});

type ProduitFormValues = z.infer<typeof produitSchema>;

interface ProduitFormProps {
  initialData?: any;
  onSuccess?: () => void;
}

export function ProduitForm({ initialData, onSuccess }: ProduitFormProps) {
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
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  async function onSubmit(data: ProduitFormValues) {
    try {
      const prixVenteTtc = data.prixVenteHt * (1 + data.tauxTva / 100);
      const prixAchatTtc = data.prixAchatHt * (1 + data.tauxTva / 100);

      const payload = {
        ...data,
        prixVenteTtc,
        prixAchatTtc,
      };

      const url = initialData?.id ? `/api/produits/${initialData.id}` : '/api/produits';
      const method = initialData?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || 'Erreur lors de la sauvegarde');
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

        <div className="flex justify-end pt-6 border-t mt-6">
          <Button type="submit" className="bg-primary hover:bg-primary/90 text-white px-8 h-11 font-bold shadow-md">
            Enregistrer le produit
          </Button>
        </div>
      </form>
    </Form>
  );
}
