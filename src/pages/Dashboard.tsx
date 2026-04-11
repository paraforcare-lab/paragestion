import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  CreditCard, 
  Activity, 
  FileText, 
  Users, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle, 
  PieChart, 
  Stethoscope,
  Pill,
  ShieldCheck,
  Clock,
  ChevronRight,
  Plus,
  Receipt,
  Building2,
  HeartPulse
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

interface Stats {
  clientsCount: number;
  facturesCount: number;
  produitsCount: number;
  totalRevenue: number;
  unpaidRevenue: number;
  totalDepenses: number;
  profit: number;
  totalTvaCollectee: number;
  totalTvaDeductible: number;
  tvaNet: number;
  ventesHT: number;
  totalCOGS: number;
  stockValueHT: number;
  monthlyData: any[];
  lowStockProduits: any[];
  recentFactures: any[];
}

interface KPICardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  color: string;
  gradient: string;
}

function KPICard({ title, value, subtitle, icon: Icon, trend, trendUp, color, gradient }: KPICardProps) {
  return (
    <Card className={cn(
      "relative overflow-hidden border-0 shadow-lg transition-all duration-500 hover:shadow-xl hover:-translate-y-1",
      "group"
    )}>
      {/* Background Gradient */}
      <div className={cn("absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity", gradient)} />
      
      {/* Icon Background */}
      <div className={cn("absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity")}>
        <Icon className="h-24 w-24" style={{ color }} />
      </div>
      
      <CardHeader className="relative pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="text-[11px] uppercase tracking-widest font-bold opacity-70">
            {title}
          </CardDescription>
          <div 
            className="p-2 rounded-xl shadow-md"
            style={{ 
              backgroundColor: `${color}15`,
              color 
            }}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative">
        <CardTitle className="text-3xl font-black tracking-tight mb-2">
          {value}
        </CardTitle>
        
        <div className="flex items-center justify-between">
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
              trendUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
            )}>
              {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              <span>{trend}</span>
            </div>
          )}
          
          <p className="text-xs text-muted-foreground font-medium">{subtitle}</p>
        </div>
      </CardContent>
      
      {/* Bottom Accent Line */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1 opacity-60 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: color }}
      />
    </Card>
  );
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [{ data: factures }, { data: ventesPassagers }, { data: depenses }, { data: produits }, { data: clients }, { data: recentFactures }] = await Promise.all([
          supabase.from('factures').select('*').in('statut', ['payée', 'reste_a_payer', 'annulée']),
          supabase.from('ventes_passagers').select('*'),
          supabase.from('depenses').select('*'),
          supabase.from('produits').select('*'),
          supabase.from('clients').select('*'),
          supabase.from('factures').select('*, client:clients(*)').order('date_emission', { ascending: false }).limit(5)
        ]);

        const tvaFactures = (factures || []).reduce((sum, f) => {
          const val = Number(f.montant_tva || 0);
          return sum + (f.statut === 'annulée' ? -val : val);
        }, 0);
        const tvaVP = (ventesPassagers || []).reduce((sum, vp) => sum + Number(vp.montant_tva || 0), 0);
        const totalTvaCollectee = tvaFactures + tvaVP;

        const tvaDepenses = (depenses || []).reduce((sum, d) => sum + Number(d.montant_tva || 0), 0);
        const totalTvaDeductible = tvaDepenses;
        const tvaNet = totalTvaCollectee - totalTvaDeductible;

        const ventesHT = (factures || []).reduce((sum, f) => {
          const val = Number(f.montant_ht || 0);
          return sum + (f.statut === 'annulée' ? -val : val);
        }, 0) + (ventesPassagers || []).reduce((sum, vp) => sum + Number(vp.montant_ht || 0), 0);

        const cogsFactures = (factures || []).reduce((sum, f) => {
          const val = Number(f.cogs || 0);
          return sum + (f.statut === 'annulée' ? -val : val);
        }, 0);
        const cogsVP = (ventesPassagers || []).reduce((sum, vp) => sum + Number(vp.cogs || 0), 0);
        const totalCOGS = cogsFactures + cogsVP;

        const totalDepensesHT = (depenses || []).reduce((sum, d) => sum + Number(d.montant_ht || 0), 0);
        const profit = ventesHT - totalCOGS - totalDepensesHT;

        const totalRevenue = (factures || []).reduce((sum, f) => {
          const val = Number(f.montant_ttc || 0);
          return sum + (f.statut === 'annulée' ? -val : val);
        }, 0) + (ventesPassagers || []).reduce((sum, vp) => sum + Number(vp.montant_ttc || 0), 0);

        const unpaidRevenue = (factures || []).filter(f => f.statut === 'reste_a_payer').reduce((sum, f) => sum + Number(f.reste_a_payer || 0), 0);

        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const month = d.getMonth();
          const year = d.getFullYear();

          const monthFactures = (factures || []).filter(f => {
            const fDate = new Date(f.date_emission);
            return fDate.getMonth() === month && fDate.getFullYear() === year;
          });

          const monthVP = (ventesPassagers || []).filter(vp => {
            const vpDate = new Date(vp.date);
            return vpDate.getMonth() === month && vpDate.getFullYear() === year;
          });

          const monthDepenses = (depenses || []).filter(d => {
            const dDate = new Date(d.date_depense);
            return dDate.getMonth() === month && dDate.getFullYear() === year;
          });

          monthlyData.push({
            name: monthNames[month],
            revenue: monthFactures.reduce((sum, f) => {
              const val = Number(f.montant_ttc || 0);
              return sum + (f.statut === 'annulée' ? -val : val);
            }, 0) + monthVP.reduce((sum, vp) => sum + Number(vp.montant_ttc || 0), 0),
            expenses: monthDepenses.reduce((sum, d) => sum + Number(d.montant_ttc || 0), 0)
          });
        }

        const lowStockProduits = (produits || [])
          .filter(p => Number(p.stock_actuel) <= Number(p.stock_min))
          .slice(0, 5);

        setStats({
          clientsCount: clients?.length || 0,
          facturesCount: (factures || []).filter(f => f.statut === 'payée' || f.statut === 'reste_a_payer').length,
          produitsCount: produits?.length || 0,
          totalRevenue,
          unpaidRevenue,
          totalDepenses: (depenses || []).reduce((sum, d) => sum + Number(d.montant_ttc), 0),
          profit,
          totalTvaCollectee,
          totalTvaDeductible,
          tvaNet,
          ventesHT,
          totalCOGS,
          stockValueHT: 0,
          monthlyData,
          lowStockProduits,
          recentFactures: recentFactures || []
        });
      } catch (error) {
        console.error('Failed to fetch stats', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-16 w-16 border-4 border-primary/20 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <HeartPulse className="h-6 w-6 text-primary animate-pulse" />
            </div>
          </div>
          <div className="space-y-2 text-center">
            <p className="text-lg font-semibold text-foreground">Chargement des données...</p>
            <p className="text-sm text-muted-foreground">Préparation de votre tableau de bord</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
              <Stethoscope className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              Tableau de Bord
            </h1>
          </div>
          <p className="text-muted-foreground ml-1">
            Bienvenue sur ParaCare - Votre système de gestion parapharmaceutique
          </p>
        </div>
        
        {/* Stock Value Card */}
        <div className="flex items-center gap-4 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-4 rounded-2xl border border-primary/10 shadow-sm">
          <div className="p-3 rounded-xl bg-primary/10">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Valeur du Stock (HT)</p>
            <p className="text-2xl font-black text-primary">
              {stats ? formatCurrency(stats.stockValueHT) : formatCurrency(0)}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <KPICard
          title="Chiffre d'affaires"
          value={stats ? formatCurrency(stats.totalRevenue) : formatCurrency(0)}
          subtitle="Revenus totaux TTC"
          icon={DollarSign}
          trend="+12.5%"
          trendUp={true}
          color="oklch(0.52 0.15 195)"
          gradient="bg-gradient-to-br from-primary/20 to-transparent"
        />
        
        <KPICard
          title="Créances Clients"
          value={stats ? formatCurrency(stats.unpaidRevenue) : formatCurrency(0)}
          subtitle="Factures en attente"
          icon={CreditCard}
          trend="En attente"
          trendUp={false}
          color="oklch(0.75 0.12 85)"
          gradient="bg-gradient-to-br from-amber-500/20 to-transparent"
        />
        
        <KPICard
          title="Dépenses Totales"
          value={stats ? formatCurrency(stats.totalDepenses) : formatCurrency(0)}
          subtitle="Sorties mensuelles"
          icon={Activity}
          trend="Mensuel"
          trendUp={false}
          color="oklch(0.55 0.2 25)"
          gradient="bg-gradient-to-br from-red-500/20 to-transparent"
        />
        
        <KPICard
          title="Bénéfice Net"
          value={stats ? formatCurrency(stats.profit) : formatCurrency(0)}
          subtitle="Marge bénéficiaire"
          icon={ShieldCheck}
          trend={stats?.profit && stats.profit > 0 ? "Rentable" : "Déficit"}
          trendUp={stats?.profit && stats.profit > 0}
          color="oklch(0.65 0.12 155)"
          gradient="bg-gradient-to-br from-emerald-500/20 to-transparent"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Revenue Chart */}
        <Card className="lg:col-span-4 border-0 shadow-lg overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Analyse des Flux
              </CardTitle>
              <CardDescription>Évolution mensuelle des recettes et dépenses</CardDescription>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gradient-to-r from-primary to-primary/60" />
                <span className="text-muted-foreground font-medium">Recettes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gradient-to-r from-red-400 to-red-500" />
                <span className="text-muted-foreground font-medium">Dépenses</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats?.monthlyData || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.52 0.15 195)" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="oklch(0.52 0.15 195)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.55 0.2 25)" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="oklch(0.55 0.2 25)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.92 0.01 250)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: 'oklch(0.5 0.03 250)' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: 'oklch(0.5 0.03 250)' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      background: 'white'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    name="Recettes" 
                    stroke="oklch(0.52 0.15 195)" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expenses" 
                    name="Dépenses" 
                    stroke="oklch(0.55 0.2 25)" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorExpenses)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="lg:col-span-3 border-0 shadow-lg overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Factures Récentes
              </CardTitle>
              <CardDescription>Dernières transactions</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-primary font-semibold hover:bg-primary/5">
              <Link to="/factures" className="flex items-center gap-1">
                Tout voir
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.recentFactures && stats.recentFactures.length > 0 ? (
                stats.recentFactures.map((facture, i) => (
                  <div 
                    key={facture.id} 
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-all duration-200 group cursor-pointer"
                  >
                    <div className={cn(
                      "h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-110 shadow-sm",
                      facture.statut === 'payée' ? "bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600" :
                      facture.statut === 'reste_a_payer' ? "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600" :
                      "bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600"
                    )}>
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate text-foreground">
                        {facture.client?.nom || 'Client Passager'}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="font-mono">{facture.numero}</span>
                        <span>•</span>
                        <span>{new Date(facture.dateEmission).toLocaleDateString('fr-FR')}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-foreground">{formatCurrency(facture.montantTtc)}</p>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[10px] h-5 px-2 font-bold border-0",
                          facture.statut === 'payée' ? "bg-emerald-100 text-emerald-700" :
                          facture.statut === 'reste_a_payer' ? "bg-blue-100 text-blue-700" :
                          "bg-amber-100 text-amber-700"
                        )}
                      >
                        {facture.statut === 'payée' ? 'Payée' : 
                         facture.statut === 'reste_a_payer' ? 'Partiel' : 'En attente'}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-4 mb-3">
                    <FileText className="h-8 w-8 text-primary/50" />
                  </div>
                  <p className="text-sm text-muted-foreground">Aucune facture récente</p>
                  <Link to="/factures" className="mt-2 text-xs text-primary font-semibold hover:underline">
                    Créer votre première facture
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Actions Rapides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Nouvelle Facture', icon: FileText, color: 'primary', bg: 'bg-primary/10', link: '/factures' },
                { label: 'Vente Rapide', icon: ShoppingCart, color: 'emerald-500', bg: 'bg-emerald-50', link: '/ventes-passagers' },
                { label: 'Nouvelle Dépense', icon: CreditCard, color: 'red-500', bg: 'bg-red-50', link: '/depenses' },
                { label: 'Ajouter Client', icon: Users, color: 'amber-500', bg: 'bg-amber-50', link: '/clients' },
              ].map((action) => (
                <Link 
                  key={action.label} 
                  to={action.link} 
                  className={cn(
                    "flex flex-col items-center gap-3 p-4 rounded-2xl border border-transparent",
                    "hover:border-border hover:bg-muted/30 transition-all duration-300 group"
                  )}
                >
                  <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110", action.bg)}>
                    <action.icon className={cn("h-6 w-6", `text-${action.color}`)} />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground text-center group-hover:text-foreground transition-colors">
                    {action.label}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stock Alerts */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Alertes Stock
            </CardTitle>
            {stats?.lowStockProduits && stats.lowStockProduits.length > 0 && (
              <Badge variant="destructive" className="animate-pulse bg-amber-500">
                {stats.lowStockProduits.length} produit{stats.lowStockProduits.length > 1 ? 's' : ''}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.lowStockProduits && stats.lowStockProduits.length > 0 ? (
                stats.lowStockProduits.slice(0, 4).map((produit) => (
                  <div 
                    key={produit.id} 
                    className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-50/50 to-transparent border border-amber-100 hover:from-amber-50 hover:border-amber-200 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded-lg shadow-sm border border-amber-100">
                        <Pill className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{produit?.nom || '-'}</p>
                        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                          Réf: {produit.reference}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-amber-600">
                        {produit.stockActuel} {produit.unite}
                      </p>
                      <p className="text-[10px] text-amber-500/70 font-semibold uppercase">Stock bas</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-4 mb-3">
                    <ShieldCheck className="h-8 w-8 text-emerald-600" />
                  </div>
                  <p className="text-sm font-semibold text-emerald-600">Stock optimal</p>
                  <p className="text-xs text-muted-foreground">Tous vos produits sont bien approvisionnés</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TVA Summary */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 px-6 py-4 border-b border-primary/10 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <PieChart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Récapitulatif Fiscal (TVA)</h3>
            <p className="text-xs text-muted-foreground">TVA collectée, déductible et solde</p>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">TVA Collectée</p>
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              </div>
              <p className="text-2xl font-black text-foreground">
                {stats ? Number(stats.totalTvaCollectee).toFixed(2) : '0.00'} <span className="text-sm font-medium text-muted-foreground">MAD</span>
              </p>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full w-[70%]" />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">TVA Déductible</p>
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-2xl font-black text-foreground">
                {stats ? Number(stats.totalTvaDeductible).toFixed(2) : '0.00'} <span className="text-sm font-medium text-muted-foreground">MAD</span>
              </p>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full w-[45%]" />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Solde TVA</p>
                <Badge className={cn(
                  "font-bold",
                  (stats?.tvaNet || 0) > 0 
                    ? "bg-red-100 text-red-700 hover:bg-red-100" 
                    : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                )}>
                  {(stats?.tvaNet || 0) > 0 ? "À Payer" : "Crédit"}
                </Badge>
              </div>
              <p className={cn(
                "text-2xl font-black",
                (stats?.tvaNet || 0) > 0 ? "text-red-600" : "text-emerald-600"
              )}>
                {stats ? Math.abs(stats.tvaNet).toFixed(2) : '0.00'} <span className="text-sm font-medium text-muted-foreground">MAD</span>
              </p>
              <p className="text-xs text-muted-foreground">Calculé sur la période en cours</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Clients', value: stats?.clientsCount || 0, icon: Users, color: 'primary' },
          { label: 'Produits', value: stats?.produitsCount || 0, icon: Package, color: 'emerald-500' },
          { label: 'Factures', value: stats?.facturesCount || 0, icon: FileText, color: 'amber-500' },
          { label: 'Fournisseurs', value: 0, icon: Building2, color: 'purple-500' },
        ].map((stat, i) => (
          <Link 
            key={stat.label} 
            to={stat.label === 'Clients' ? '/clients' : stat.label === 'Produits' ? '/produits' : stat.label === 'Factures' ? '/factures' : '/fournisseurs'}
            className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-card to-muted/30 border border-border/50 hover:border-primary/20 hover:shadow-md transition-all duration-300 group"
          >
            <div className={cn(
              "p-2.5 rounded-xl",
              `bg-${stat.color}/10`
            )}>
              <stat.icon className={cn("h-5 w-5", `text-${stat.color}`)} />
            </div>
            <div>
              <p className="text-2xl font-black text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
