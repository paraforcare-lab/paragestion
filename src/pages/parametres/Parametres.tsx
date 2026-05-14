import { useEffect, useState, useMemo, useRef } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
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
  CheckCircle2,
  Sun,
  Moon,
  Monitor,
  Upload,
  ImageIcon,
  Check
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
  watermarkText: string;
  activerFiligrane: boolean;
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
  watermarkText: z.string(),
  activerFiligrane: z.boolean(),
});

export function Parametres() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  const [parametresId, setParametresId] = useState<string | null>(null);
  const [isModified, setIsModified] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('pg_theme') as 'light' | 'dark' | 'system') || 'system';
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
      watermarkText: 'ParaGestion',
      activerFiligrane: true,
    },
  });

  const errors = form.formState.errors;

  const tabErrors = useMemo(() => ({
    general: ['nomSociete', 'adresse', 'ville', 'codePostal', 'telephone', 'email', 'siteWeb', 'formeJuridique', 'capitalSocial'].some(f => errors[f]),
    fiscal: ['ice', 'rc', 'ifNumber', 'tpPatente', 'cnss', 'banque', 'rib', 'swift', 'activerDroitTimbre'].some(f => errors[f]),
    personalisation: ['couleurPrincipale', 'logoUrl', 'conditionsPaiementDefaut', 'piedPageDefaut', 'watermarkText', 'activerFiligrane'].some(f => errors[f]),
  }), [errors]);

  const STORAGE_KEY = 'sf_params_modified';

  useEffect(() => {
    const subscription = form.watch(() => {
      if (!isLoading && !isSavingRef.current) {
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
          .select('id,user_id,nom_societe,nom,adresse,ville,code_postale,telephone,email,site_web,ice,rc,if_number,tp_patente,cnss,capital_social,forme_juridique,logo_url,couleur_principale,banque,rib,swift,devise,conditions_paiement_defaut,pied_page_defaut,activer_droit_timbre,watermark_text,activer_filigrane,created_at,updated_at')
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
            codePostal: data.code_postale || '',
            telephone: data.telephone || '',
            email: data.email || '',
            siteWeb: data.site_web || '',
            ice: data.ice || '',
            rc: data.rc || '',
            ifNumber: data.if_number || '',
            tpPatente: data.tp_patente || '',
            cnss: data.cnss || '',
            capitalSocial: data.capital_social || '',
            formeJuridique: data.forme_juridique || '',
            banque: data.banque || '',
            rib: data.rib || '',
            swift: data.swift || '',
            logoUrl: data.logo_url || '',
            couleurPrincipale: data.couleur_principale || '#267E54',
            conditionsPaiementDefaut: data.conditions_paiement_defaut || '',
            piedPageDefaut: data.pied_page_defaut || '',
            activerDroitTimbre: data.activer_droit_timbre !== undefined ? data.activer_droit_timbre : true,
            watermarkText: data.watermark_text || 'ParaGestion',
            activerFiligrane: data.activer_filigrane !== undefined ? data.activer_filigrane : JSON.parse(localStorage.getItem('pg_watermark') || 'true'),
          });
          setLogoPreview(null);
        }
      } catch (error) {
        console.error('Failed to fetch parametres', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchParametres();
  }, [form, user]);

  useEffect(() => {
    const applyTheme = (mode: 'light' | 'dark' | 'system') => {
      const root = document.documentElement;
      if (mode === 'dark') {
        root.classList.add('dark');
      } else if (mode === 'light') {
        root.classList.remove('dark');
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', prefersDark);
      }
      localStorage.setItem('pg_theme', mode);
    };

    applyTheme(themeMode);

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle('dark', e.matches);
      };
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [themeMode]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('pg_watermark', JSON.stringify(form.watch('activerFiligrane')));
    }
  }, [form.watch('activerFiligrane'), isLoading]);

  useEffect(() => {
    setLogoError(false);
  }, [form.watch('logoUrl'), logoPreview]);

  const onInvalid = (formErrors: any) => {
    const fieldNames = Object.keys(formErrors)
    const tabs: string[] = []
    if (fieldNames.some(f => ['nomSociete', 'adresse', 'ville', 'codePostal', 'telephone', 'email', 'siteWeb', 'formeJuridique', 'capitalSocial'].includes(f))) tabs.push('Informations')
    if (fieldNames.some(f => ['ice', 'rc', 'ifNumber', 'tpPatente', 'cnss', 'banque', 'rib', 'swift', 'activerDroitTimbre'].includes(f))) tabs.push('Fiscalité')
    if (fieldNames.some(f => ['couleurPrincipale', 'logoUrl', 'conditionsPaiementDefaut', 'piedPageDefaut', 'watermarkText', 'activerFiligrane'].includes(f))) tabs.push('Personnalisation')

    const first = tabs[0]
    if (first === 'Informations') setActiveTab('general')
    else if (first === 'Fiscalité') setActiveTab('fiscal')
    else if (first === 'Personnalisation') setActiveTab('personalisation')

    toast.error(`Validation échouée dans : ${tabs.join(', ')}. Corrigez les champs en rouge.`)
  }

  async function onSubmit(data: ParametresFormValues) {
    if (!user?.id) {
      toast.error('Vous devez être connecté pour enregistrer les paramètres');
      return;
    }
    
    setIsSaving(true);
    isSavingRef.current = true;
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
        watermark_text: data.watermarkText,
        activer_filigrane: data.activerFiligrane,
      };

      localStorage.setItem('pg_watermark', JSON.stringify(data.activerFiligrane));

      console.log('Saving parametres for user:', user.id);
      console.log('Record ID:', parametresId);

      let result, error;
      if (parametresId) {
        const response = await supabase
          .from('parametres')
          .update(fields)
          .eq('id', parametresId)
          .select('id,user_id,nom_societe,nom,adresse,ville,code_postale,telephone,email,site_web,ice,rc,if_number,tp_patente,cnss,capital_social,forme_juridique,logo_url,couleur_principale,banque,rib,swift,devise,conditions_paiement_defaut,pied_page_defaut,activer_droit_timbre,watermark_text,activer_filigrane,created_at,updated_at')
          .single();
        result = response.data;
        error = response.error;
      } else {
        const response = await supabase
          .from('parametres')
          .insert([{ ...fields, user_id: user.id }])
          .select('id,user_id,nom_societe,nom,adresse,ville,code_postale,telephone,email,site_web,ice,rc,if_number,tp_patente,cnss,capital_social,forme_juridique,logo_url,couleur_principale,banque,rib,swift,devise,conditions_paiement_defaut,pied_page_defaut,activer_droit_timbre,watermark_text,activer_filigrane,created_at,updated_at')
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
      form.reset(result);
      toast.success('Paramètres enregistrés avec succès');
    } catch (err: any) {
      console.error('Error saving parametres:', err);
      toast.error(`Erreur: ${err.message || 'Impossible de sauvegarder'}`);
    } finally {
      setIsSaving(false);
      isSavingRef.current = false;
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
          <div className="flex items-center justify-center h-10 w-10 rounded-[6px] bg-indigo-50 border border-indigo-200/50">
            <Building2 className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Paramètres de l'entreprise</h2>
            <p className="text-sm text-muted-foreground">
              Ces informations apparaîtront sur vos factures et devis
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
          {isModified && (
            <div className="bg-amber-50 border border-amber-200 rounded-[6px] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-2 rounded-full">
                  <FileText className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-amber-800">Modifications non enregistrées</p>
                  <p className="text-sm text-amber-600">Veuillez enregistrer vos modifications</p>
                </div>
              </div>
              <Button type="submit" size="sm" disabled={isSaving} className="bg-amber-500 hover:bg-amber-600 text-white rounded-[4px]">
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          )}
          <div className="bg-muted/50 p-4 md:p-6 rounded-[6px] space-y-4 md:space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 rounded-[6px]">
                <TabsTrigger
                  value="general"
                  className="rounded-[4px] data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:text-indigo-600 font-semibold relative"
                >
                  {tabErrors.general && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />}
                  <Building2 className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Informations</span>
                </TabsTrigger>
                <TabsTrigger
                  value="fiscal"
                  className="rounded-[4px] data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:text-indigo-600 font-semibold relative"
                >
                  {tabErrors.fiscal && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />}
                  <FileText className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Fiscalité</span>
                </TabsTrigger>
                <TabsTrigger
                  value="personalisation"
                  className="rounded-[4px] data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:text-indigo-600 font-semibold relative"
                >
                  {tabErrors.personalisation && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />}
                  <Palette className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">Personnalisation</span>
                </TabsTrigger>
              </TabsList>

              {/* General Tab */}
              <TabsContent value="general" className="mt-6 md:mt-8">
              <Card className="border border-slate-200 shadow-none rounded-[6px]">
                <CardHeader className="border-b border-slate-100 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-8 w-8 rounded-[4px] bg-indigo-50 border border-indigo-200/50">
                      <Building2 className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold text-slate-700">Informations de l'entreprise</CardTitle>
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
              <Card className="border border-slate-200 shadow-none rounded-[6px]">
                <CardHeader className="border-b border-slate-100 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-8 w-8 rounded-[4px] bg-indigo-50 border border-indigo-200/50">
                      <FileText className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold text-slate-700">Identifiants Fiscaux & Légaux</CardTitle>
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

              <Card className="border border-slate-200 shadow-none rounded-[6px]">
                <CardHeader className="border-b border-slate-100 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-8 w-8 rounded-[4px] bg-indigo-50 border border-indigo-200/50">
                      <Landmark className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold text-slate-700">Coordonnées Bancaires</CardTitle>
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

              <Card className="border border-slate-200 shadow-none rounded-[6px]">
                <CardHeader className="border-b border-slate-100 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-8 w-8 rounded-[4px] bg-indigo-50 border border-indigo-200/50">
                      <CreditCard className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold text-slate-700">Options de Facturation</CardTitle>
                      <CardDescription>Configuration des factures</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <FormField
                    control={form.control}
                    name="activerDroitTimbre"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between p-4 rounded-[6px] border border-slate-200 bg-slate-50/30">
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
              <Card className="border border-slate-200 shadow-none rounded-[6px]">
                <CardHeader className="border-b border-slate-100 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-8 w-8 rounded-[4px] bg-indigo-50 border border-indigo-200/50">
                      <Palette className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold text-slate-700">Apparence</CardTitle>
                      <CardDescription>Personnalisez le logo et les couleurs</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-8">
                  {/* Theme Selection Cards */}
                  <div className="space-y-3">
                    <FormLabel className="text-foreground font-semibold">Thème</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Light Mode */}
                      <div
                        onClick={() => setThemeMode('light')}
                        className={`relative cursor-pointer rounded-[6px] border-2 p-4 transition-all hover:shadow-md ${
                          themeMode === 'light'
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="h-20 rounded-[4px] bg-gradient-to-b from-white to-slate-50 border border-slate-200 flex items-center justify-center">
                            <div className="w-full px-3 space-y-1.5">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="h-2 w-2 rounded-full bg-slate-300" />
                                <div className="h-2 w-2 rounded-full bg-slate-300" />
                                <div className="h-2 w-2 rounded-full bg-slate-300" />
                                <div className="ml-auto h-2 w-8 rounded bg-slate-300" />
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-slate-200" />
                              <div className="h-1.5 w-3/4 rounded-full bg-slate-200" />
                              <div className="h-1.5 w-1/2 rounded-full bg-slate-200" />
                              <div className="h-1.5 w-full rounded-full bg-slate-200" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Sun className="h-4 w-4 text-amber-500" />
                              <span className="text-sm font-medium text-foreground">Light Mode</span>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              themeMode === 'light' ? 'border-primary bg-primary' : 'border-slate-300'
                            }`}>
                              {themeMode === 'light' && <Check className="h-3 w-3 text-white" />}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Dark Mode */}
                      <div
                        onClick={() => setThemeMode('dark')}
                        className={`relative cursor-pointer rounded-[6px] border-2 p-4 transition-all hover:shadow-md ${
                          themeMode === 'dark'
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="h-20 rounded-[4px] bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center">
                            <div className="w-full px-3 space-y-1.5">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="h-2 w-2 rounded-full bg-slate-600" />
                                <div className="h-2 w-2 rounded-full bg-slate-600" />
                                <div className="h-2 w-2 rounded-full bg-slate-600" />
                                <div className="ml-auto h-2 w-8 rounded bg-slate-600" />
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-slate-700" />
                              <div className="h-1.5 w-3/4 rounded-full bg-slate-700" />
                              <div className="h-1.5 w-1/2 rounded-full bg-slate-700" />
                              <div className="h-1.5 w-full rounded-full bg-slate-700" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Moon className="h-4 w-4 text-indigo-400" />
                              <span className="text-sm font-medium text-foreground">Dark Mode</span>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              themeMode === 'dark' ? 'border-primary bg-primary' : 'border-slate-300'
                            }`}>
                              {themeMode === 'dark' && <Check className="h-3 w-3 text-white" />}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* System Preferences */}
                      <div
                        onClick={() => setThemeMode('system')}
                        className={`relative cursor-pointer rounded-[6px] border-2 p-4 transition-all hover:shadow-md ${
                          themeMode === 'system'
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="h-20 rounded-[4px] bg-gradient-to-b from-slate-100 to-slate-200 border border-slate-300 flex items-center justify-center">
                            <div className="w-full px-3 space-y-1.5">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="h-2 w-2 rounded-full bg-slate-400" />
                                <div className="h-2 w-2 rounded-full bg-slate-400" />
                                <div className="h-2 w-2 rounded-full bg-slate-400" />
                                <div className="ml-auto flex gap-1">
                                  <div className="h-2 w-2 rounded-full bg-slate-400" />
                                  <div className="h-2 w-2 rounded-full bg-slate-400" />
                                </div>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-slate-300" />
                              <div className="h-1.5 w-3/4 rounded-full bg-slate-300" />
                              <div className="h-1.5 w-1/2 rounded-full bg-slate-300" />
                              <div className="h-1.5 w-full rounded-full bg-slate-300" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Monitor className="h-4 w-4 text-slate-500" />
                              <span className="text-sm font-medium text-foreground">Système</span>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              themeMode === 'system' ? 'border-primary bg-primary' : 'border-slate-300'
                            }`}>
                              {themeMode === 'system' && <Check className="h-3 w-3 text-white" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Color Accent Picker */}
                  <FormField
                    control={form.control}
                    name="couleurPrincipale"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-semibold">Couleur d'accent</FormLabel>
                        <FormControl>
                          <div className="flex gap-3">
                            <Input
                              type="color"
                              className="w-14 h-11 p-1 rounded-[6px] cursor-pointer"
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

                  <Separator />

                  {/* Logo Management */}
                  <div className="space-y-3">
                    <FormLabel className="text-foreground font-semibold">Logo</FormLabel>
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Logo Preview */}
                      <div className="flex-shrink-0">
                        <div className="w-36 h-36 rounded-[6px] border-2 border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-center overflow-hidden">
                          {(form.watch('logoUrl') || logoPreview) && !logoError ? (
                            <img
                              src={logoPreview || form.watch('logoUrl')}
                              alt="Logo"
                              className="w-full h-full object-contain p-2"
                              onError={() => setLogoError(true)}
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              <ImageIcon className="h-10 w-10" />
                              <span className="text-xs font-medium">No Logo</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Upload and URL Controls */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="h-10 rounded-[4px] border-slate-200"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Modifier le logo
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  const dataUrl = ev.target?.result as string;
                                  setLogoPreview(dataUrl);
                                  form.setValue('logoUrl', dataUrl);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="logoUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm text-muted-foreground">URL du logo</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://example.com/logo.png"
                                  className="h-11 bg-white border-border/50 focus:border-primary"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e.target.value);
                                    setLogoPreview(null);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 shadow-none rounded-[6px]">
                <CardHeader className="border-b border-slate-100 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-8 w-8 rounded-[4px] bg-indigo-50 border border-indigo-200/50">
                      <FileText className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold text-slate-700">Contenu des Documents</CardTitle>
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

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="activerFiligrane"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-4 rounded-[6px] border border-slate-200 bg-slate-50/30">
                          <div className="space-y-0.5 flex-1">
                            <FormLabel className="text-base font-semibold cursor-pointer">Filigrane</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Activer le filigrane sur les documents PDF
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

                    <FormField
                      control={form.control}
                      name="watermarkText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={`text-foreground font-semibold ${!form.watch('activerFiligrane') ? 'text-muted-foreground' : ''}`}>
                            Texte du filigrane
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="ParaGestion"
                              className={`h-11 bg-white border-border/50 focus:border-primary transition-all ${
                                !form.watch('activerFiligrane') ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              disabled={!form.watch('activerFiligrane')}
                              {...field}
                            />
                          </FormControl>
                          <p className="text-sm text-muted-foreground">Ce texte apparaîtra en arrière-plan de tous vos documents PDF.</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
</Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex justify-end pt-6">
            <Button 
              type="submit" 
              disabled={isSaving}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-[4px] h-10 px-6 shadow-none"
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
