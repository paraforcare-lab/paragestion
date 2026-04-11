import { useEffect, useRef } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Building2, User, Mail, Phone, MapPin, CreditCard, Save, Loader2 } from 'lucide-react';

const clientSchema = z.object({
  nom: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères' }),
  type: z.enum(['particulier', 'entreprise']),
  contact: z.string().optional().or(z.literal('')),
  email: z.string().optional().or(z.literal('')),
  telephone: z.string().optional().or(z.literal('')),
  adresse: z.string().optional().or(z.literal('')),
  ville: z.string().optional().or(z.literal('')),
  ice: z.string().optional().or(z.literal('')),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientFormProps {
  initialData?: any;
  onSuccess?: () => void;
}

export function ClientForm({ initialData, onSuccess }: ClientFormProps) {
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      nom: '',
      type: 'entreprise',
      contact: '',
      email: '',
      telephone: '',
      adresse: '',
      ville: '',
      ice: '',
    },
  });

  const formRef = useRef<HTMLFormElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (initialData?.id && !isInitialized.current) {
      form.reset({
        nom: initialData.nom || '',
        type: initialData.type || 'entreprise',
        contact: initialData.contact || '',
        email: initialData.email || '',
        telephone: initialData.telephone || '',
        adresse: initialData.adresse || '',
        ville: initialData.ville || '',
        ice: initialData.ice || '',
      });
      isInitialized.current = true;
    } else if (!initialData?.id && !isInitialized.current) {
      form.reset({
        nom: '',
        type: 'entreprise',
        contact: '',
        email: '',
        telephone: '',
        adresse: '',
        ville: '',
        ice: '',
      });
      isInitialized.current = true;
    }
    
    return () => {
      isInitialized.current = false;
    };
  }, [initialData, form]);

  const isEntreprise = form.watch('type') === 'entreprise';

  async function onSubmit(data: ClientFormValues) {
    try {
      const isEditing = initialData?.id;
      const url = isEditing ? `/api/clients/${initialData.id}` : '/api/clients';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
      }

      toast.success(isEditing ? 'Client modifié avec succès' : 'Client créé avec succès');
      isInitialized.current = false;
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'enregistrement du client');
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Type Selection */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold">Type de client</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 rounded-xl border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/10">
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="entreprise">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span>Entreprise</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="particulier">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-emerald-600" />
                        <span>Particulier</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nom"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold">
                  {isEntreprise ? 'Nom de la société *' : 'Nom complet *'}
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder={isEntreprise ? 'Tech Solutions SARL' : 'Ahmed Benali'} 
                    className="h-12 rounded-xl border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/10"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Mail className="h-4 w-4 text-primary" />
            Informations de contact
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-muted-foreground">Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="email"
                        placeholder="contact@exemple.com" 
                        className="h-12 pl-12 rounded-xl border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/10"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telephone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-muted-foreground">Téléphone</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="+212 6 00 00 00 00" 
                        className="h-12 pl-12 rounded-xl border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/10"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Address */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            Adresse
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="adresse"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="text-sm font-medium text-muted-foreground">Adresse complète</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-4 h-4 w-4 text-muted-foreground" />
                      <Textarea 
                        placeholder="123 Rue Exemple, Quartier..." 
                        className="min-h-[80px] pl-12 rounded-xl border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ville"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-muted-foreground">Ville</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Casablanca" 
                      className="h-12 rounded-xl border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/10"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Enterprise-specific fields */}
        {isEntreprise && (
          <div className="space-y-4 p-4 rounded-2xl bg-gradient-to-r from-primary/5 to-transparent border border-primary/10">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CreditCard className="h-4 w-4 text-primary" />
              Informations fiscales (Entreprise)
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-muted-foreground">ICE</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="15 chiffres" 
                        className="h-12 rounded-xl border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/10 font-mono"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-muted-foreground">Personne de contact</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nom du responsable" 
                        className="h-12 rounded-xl border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/10"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end pt-6 border-t border-border/50">
          <Button 
            type="submit"
            disabled={form.formState.isSubmitting}
            className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary hover:to-primary text-white font-bold px-8 h-12 rounded-xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300"
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                {initialData?.id ? 'Modifier le client' : 'Enregistrer le client'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
