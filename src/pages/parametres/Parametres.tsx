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
import { toast } from 'sonner';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Building2, 
  CreditCard, 
  Palette, 
  Save, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  FileText, 
  Hash,
  Landmark,
  CheckCircle2
} from 'lucide-react';

interface ParametresFormValues {
  nomSociete: string;
  adresse: string;
  ville: string;
  codePostal: string;
  telephone: string;
  email: string;
  siteWeb: string;
  ice: string;
  rc: string;
  ifNumber: string;
  tpPatente: string;
  cnss: string;
  capitalSocial: string;
  formeJuridique: string;
  banque: string;
  rib: string;
  swift: string;
  logoUrl: string;
  couleurPrincipale: string;
  conditionsPaiementDefaut: string;
  piedPageDefaut: string;
  activerDroitTimbre: boolean;
}

const parametresSchema = z.object({
  nomSociete: z.string().min(2, 'Le nom est requis'),
  adresse: z.string().min(5, 'L\'adresse est requise'),
  ville: z.string().min(2, 'La ville est requise'),
  codePostal: z.string().min(4, 'Le code postal est requis'),
  telephone: z.string().min(8, 'Le téléphone est requis'),
  email: z.string().email('Email invalide'),
  siteWeb: z.string(),
  ice: z.string(),
  rc: z.string(),
  ifNumber: z.string(),
  tpPatente: z.string(),
  cnss: z.string(),
  capitalSocial: z.string(),
  formeJuridique: z.string(),
  banque: z.string(),
  rib: z.string(),
  swift: z.string(),
  logoUrl: z.string(),
  couleurPrincipale: z.string(),
  conditionsPaiementDefaut: z.string(),
  piedPageDefaut: z.string(),
  activerDroitTimbre: z.boolean(),
});

export function Parametres() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [parametresId, setParametresId] = useState<string | null>(null);
  const [isModified, setIsModified] = useState(false);
  
  const form = useForm<ParametresFormValues>({
    resolver: zodResolver(parametresSchema),
    defaultValues: {
      nomSociete: '',
      adresse: '',
      ville: '',
      codePostal: '',
      telephone: '',
      email: '',
      siteWeb: '',
      ice: '',
      rc: '',
      ifNumber: '',
      tpPatente: '',
      cnss: '',
      capitalSocial: '',
      formeJuridique: '',
      banque: '',
      rib: '',
      swift: '',
      logoUrl: '',
      couleurPrincipale: '#267E54',
      conditionsPaiementDefaut: '',
      piedPageDefaut: '',
      activerDroitTimbre: true,
    },
  });

  const STORAGE_KEY = 'sf_params_modified';

  useEffect(() => {
    const subscription = form.watch(() => {
      if (!isLoading) {
        setIsModified(true);
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
      }
    });
    return () => subscription.unsubscribe();
  }, [form, isLoading]);

  useEffect(() => {
    const fetchParametres = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      
      try {
        console.log('Fetching parametres for user:', user.id);
        const { data, error } = await supabase
          .from('parametres')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        console.log('Fetch result:', { data, error });
        
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching parametres:', error);
        }
        
        if (data) {
          console.log('Setting form with data:', data);
          setParametresId(data.id);
          form.reset({
            nomSociete: data.nom_societe || data.nom || '',
            adresse: data.adresse || '',
            ville: data.ville || '',
            codePostal: data.code_postale || data.codePostale || '',
            telephone: data.telephone || '',
            email: data.email || '',
            siteWeb: data.site_web || data.siteWeb || '',
            ice: data.ice || '',
            rc: data.rc || '',
            ifNumber: data.if_number || data.ifNumber || '',
            tpPatente: data.tp_patente || data.tpPatente || '',
            cnss: data.cnss || '',
            capitalSocial: data.capital_social || data.capitalSocial || '',
            formeJuridique: data.forme_juridique || data.formeJuridique || '',
            banque: data.banque || '',
            rib: data.rib || '',
            swift: data.swift || '',
            logoUrl: data.logo_url || '',
            couleurPrincipale: data.couleur_principale || '#267E54',
            conditionsPaiementDefaut: data.conditions_paiement_defaut || '',
            piedPageDefaut: data.pied_page_defaut || '',
            activerDroitTimbre: data.activer_droit_timbre !== undefined ? data.activer_droit_timbre : true,
          });
        }
      } catch (error) {
        console.error('Failed to fetch parametres', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchParametres();
  }, [form, user]);

  async function onSubmit(data: ParametresFormValues) {
    if (!user?.id) {
      toast.error('Vous devez être connecté pour enregistrer les paramètres');
      return;
    }
    
    setIsSaving(true);
    try {
      const fields = {
        user_id: user.id,
        nom_societe: data.nomSociete,
        nom: data.nomSociete,
        adresse: data.adresse,
        ville: data.ville,
        code_postale: data.codePostal,
        telephone: data.telephone,
        email: data.email,
        site_web: data.siteWeb,
        ice: data.ice,
        rc: data.rc,
        if_number: data.ifNumber,
        tp_patente: data.tpPatente,
        cnss: data.cnss,
        capital_social: data.capitalSocial,
        forme_juridique: data.formeJuridique,
        banque: data.banque,
        rib: data.rib,
        swift: data.swift,
        logo_url: data.logoUrl,
        couleur_principale: data.couleurPrincipale,
        conditions_paiement_defaut: data.conditionsPaiementDefaut,
        pied_page_defaut: data.piedPageDefaut,
        activer_droit_timbre: data.activerDroitTimbre,
      };

      console.log('Saving parametres for user:', user.id);
      console.log('Record ID:', parametresId);

      let result, error;
      if (parametresId) {
        const response = await supabase
          .from('parametres')
          .update(fields)
          .eq('id', parametresId)
          .select()
          .single();
        result = response.data;
        error = response.error;
      } else {
        const response = await supabase
          .from('parametres')
          .insert([{ ...fields, user_id: user.id }])
          .select()
          .single();
        result = response.data;
        error = response.error;
        if (result) setParametresId(result.id);
      }

      console.log('Save result:', { result, error });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      localStorage.removeItem(STORAGE_KEY);
      setIsModified(false);
      toast.success('Paramètres enregistrés avec succès');
    } catch (err: any) {
      console.error('Error saving parametres:', err);
      toast.error(`Erreur: ${err.message || 'Impossible de sauvegarder'}`);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-foreground">Paramètres de l'entreprise</h2>
            <p className="text-sm text-muted-foreground">
              Ces informations apparaîtront sur vos factures et devis
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {isModified && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-2 rounded-full">
                  <FileText className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-amber-800">Modifications non enregistrées</p>
                  <p className="text-sm text-amber-600">Veuillez enregistrer vos changements avant d'exporter</p>
                </div>
              </div>
              <Button type="submit" size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
                Enregistrer
              </Button>
            </div>
          )}
          <div className="bg-muted/50 p-4 md:p-6 rounded-xl md:rounded-2xl space-y-4 md:space-y-6">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 rounded-xl md:rounded-2xl">
                <TabsTrigger 
                  value="general" 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-semibold"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Informations</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="fiscal" 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-semibold"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Fiscalité</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="personalisation" 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-semibold"
                >
                  <Palette className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">Personnalisation</span>
                </TabsTrigger>
              </TabsList>

              {/* General Tab */}
              <TabsContent value="general" className="mt-6 md:mt-8">
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-muted/30 to-muted/10 border-b border-border/30 rounded-t-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Informations de l'entreprise</CardTitle>
                      <CardDescription>Coordonnées et informations légales</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="nomSociete"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-semibold">Nom de la société *</FormLabel>
                          <FormControl>
                            <Input className="h-11 bg-white border-border/50 focus:border-primary" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="formeJuridique"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-semibold">Forme Juridique</FormLabel>
                          <FormControl>
                            <Input placeholder="ex: SARL, SARL AU" className="h-11 bg-white border-border/50 focus:border-primary" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="capitalSocial"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-semibold">Capital Social</FormLabel>
                          <FormControl>
                            <Input placeholder="ex: 100 000 DH" className="h-11 bg-white border-border/50 focus:border-primary" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-semibold">Email *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input type="email" className="pl-10 h-11 bg-white border-border/50 focus:border-primary" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="telephone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-semibold">Téléphone *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-10 h-11 bg-white border-border/50 focus:border-primary" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="siteWeb"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-semibold">Site Web</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="https://..." className="pl-10 h-11 bg-white border-border/50 focus:border-primary" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="adresse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-semibold">Adresse *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-10 h-11 bg-white border-border/50 focus:border-primary" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="codePostal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-semibold">Code Postal *</FormLabel>
                          <FormControl>
                            <Input className="h-11 bg-white border-border/50 focus:border-primary" {...field} />
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
                          <FormLabel className="text-foreground font-semibold">Ville *</FormLabel>
                          <FormControl>
                            <Input className="h-11 bg-white border-border/50 focus:border-primary" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Fiscal Tab */}
            <TabsContent value="fiscal" className="mt-6 md:mt-8 space-y-6">
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-muted/30 to-muted/10 border-b border-border/30 rounded-t-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Identifiants Fiscaux & Légaux</CardTitle>
                      <CardDescription>ICE, RC, IF, patente et CNSS</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="ice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-semibold">ICE</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-10 h-11 bg-white border-border/50 focus:border-primary font-mono" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="rc"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-semibold">Registre de Commerce (RC)</FormLabel>
                          <FormControl>
                            <Input className="h-11 bg-white border-border/50 focus:border-primary" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="ifNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-semibold">Identifiant Fiscal (IF)</FormLabel>
                          <FormControl>
                            <Input className="h-11 bg-white border-border/50 focus:border-primary font-mono" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tpPatente"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-semibold">Taxe Professionnelle</FormLabel>
                          <FormControl>
                            <Input className="h-11 bg-white border-border/50 focus:border-primary" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cnss"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-semibold">N° CNSS</FormLabel>
                          <FormControl>
                            <Input className="h-11 bg-white border-border/50 focus:border-primary font-mono" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-muted/30 to-muted/10 border-b border-border/30 rounded-t-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Landmark className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Coordonnées Bancaires</CardTitle>
                      <CardDescription>Informations pour les virements</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="banque"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-semibold">Nom de la banque</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="ex: Attijariwafa Bank" className="pl-10 h-11 bg-white border-border/50 focus:border-primary" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="swift"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-semibold">Code SWIFT / BIC</FormLabel>
                          <FormControl>
                            <Input className="h-11 bg-white border-border/50 focus:border-primary font-mono uppercase" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="rib"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-semibold">RIB</FormLabel>
                        <FormControl>
                          <Input placeholder="000000000000000000000000" className="h-11 bg-white border-border/50 focus:border-primary font-mono" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-muted/30 to-muted/10 border-b border-border/30 rounded-t-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Options de Facturation</CardTitle>
                      <CardDescription>Configuration des factures</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <FormField
                    control={form.control}
                    name="activerDroitTimbre"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between p-4 rounded-xl border border-border/50 bg-gradient-to-r from-muted/20 to-transparent">
                        <div className="space-y-0.5 flex-1">
                          <FormLabel className="text-base font-semibold cursor-pointer">Droit de Timbre (0.25%)</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Appliquer automatiquement le droit de timbre pour les paiements en espèces.
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-primary"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Personalization Tab */}
            <TabsContent value="personalisation" className="mt-6 md:mt-8 space-y-6">
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-muted/30 to-muted/10 border-b border-border/30 rounded-t-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Palette className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Apparence</CardTitle>
                      <CardDescription>Personnalisez le logo et les couleurs</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="couleurPrincipale"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-semibold">Couleur Principale</FormLabel>
                          <FormControl>
                            <div className="flex gap-3">
                              <Input 
                                type="color" 
                                className="w-14 h-11 p-1 rounded-lg cursor-pointer" 
                                value={field.value || '#267E54'}
                                onChange={(e) => field.onChange(e.target.value)}
                              />
                              <Input 
                                className="flex-1 h-11 bg-white border-border/50 focus:border-primary font-mono uppercase" 
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
                      name="logoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-semibold">URL du Logo</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/logo.png" className="h-11 bg-white border-border/50 focus:border-primary" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
                    <p className="text-sm text-muted-foreground mb-3">Aperçu de la couleur:</p>
                    <div 
                      className="h-12 rounded-lg w-48"
                      style={{ backgroundColor: form.watch('couleurPrincipale') || '#267E54' }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-muted/30 to-muted/10 border-b border-border/30 rounded-t-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Contenu des Documents</CardTitle>
                      <CardDescription>Texte par défaut pour vos factures</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <FormField
                    control={form.control}
                    name="conditionsPaiementDefaut"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-semibold">Conditions de paiement par défaut</FormLabel>
                        <FormControl>
                          <Input placeholder="ex: Paiement à la réception sous 30 jours" className="h-11 bg-white border-border/50 focus:border-primary" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="piedPageDefaut"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-semibold">Pied de page par défaut</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="ex: Merci de votre confiance. ParaGestion - Votre système de gestion parapharmaceutique." 
                            className="min-h-[80px] bg-white border-border/50 focus:border-primary" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
</Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex justify-end pt-6">
            <Button 
              type="submit" 
              disabled={isSaving}
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary hover:to-primary text-white font-bold shadow-lg shadow-primary/30 rounded-xl h-12 px-8"
            >
              {isSaving ? (
                <>
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Enregistrer les modifications
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
