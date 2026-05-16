import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import {
  Plus, FileText, Users, Package, CheckCircle2, TrendingUp, ArrowRight,
  Trash2, ShoppingCart, Box, CreditCard, Sparkles, Bell,
  DollarSign, AlertTriangle, Target, ChevronRight, TrendingDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface Task {
  id: string | number;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

type StockStatus = 'rupture' | 'critique' | 'faible' | 'moyen' | 'stable';

interface InventoryItem {
  id: string;
  name: string;
  reference: string;
  stockActuel: number;
  stockMin: number;
  unite: string;
  status: StockStatus;
  percentage: number;
}

const stockConfig: Record<StockStatus, { label: string; barColor: string; badgeClass: string }> = {
  rupture:  { label: 'Rupture',  barColor: 'bg-red-500',   badgeClass: 'bg-red-500/10 text-red-400 border-red-500/20' },
  critique: { label: 'Critique', barColor: 'bg-red-500',   badgeClass: 'bg-red-500/10 text-red-400 border-red-500/20' },
  faible:   { label: 'Faible',   barColor: 'bg-amber-500', badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  moyen:    { label: 'Moyen',    barColor: 'bg-blue-500',  badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  stable:   { label: 'Stable',   barColor: 'bg-emerald-500', badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
};

function getStockInfo(actuel: number, min: number): { status: StockStatus; percentage: number } {
  if (actuel <= 0) return { status: 'rupture', percentage: 0 };
  const max = Math.max(min * 3, 1);
  const pct = Math.min(100, Math.round((actuel / max) * 100));
  if (actuel <= min) return { status: 'critique', percentage: pct };
  if (actuel <= min * 1.5) return { status: 'faible', percentage: pct };
  if (actuel <= min * 2.5) return { status: 'moyen', percentage: pct };
  return { status: 'stable', percentage: pct };
}

const quickActions = [
  { label: 'Facture',    icon: FileText,     href: '/factures',      iconBg: 'bg-blue-500/10 dark:bg-blue-500/20', iconColor: 'text-blue-600 dark:text-blue-400' },
  { label: 'Devis',      icon: TrendingUp,   href: '/devis',         iconBg: 'bg-violet-500/10 dark:bg-violet-500/20', iconColor: 'text-violet-600 dark:text-violet-400' },
  { label: 'Commande',   icon: ShoppingCart, href: '/bons-commande', iconBg: 'bg-amber-500/10 dark:bg-amber-500/20', iconColor: 'text-amber-600 dark:text-amber-400' },
  { label: 'Livraison',  icon: Box,          href: '/bons-livraison',iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20', iconColor: 'text-emerald-600 dark:text-emerald-400' },
  { label: 'Dépense',    icon: CreditCard,   href: '/depenses',      iconBg: 'bg-rose-500/10 dark:bg-rose-500/20', iconColor: 'text-rose-600 dark:text-rose-400' },
  { label: 'Client',     icon: Users,        href: '/clients',       iconBg: 'bg-indigo-500/10 dark:bg-indigo-500/20', iconColor: 'text-indigo-600 dark:text-indigo-400' },
];

const aiRecommendations = [
  {
    title: 'Optimisation de stock',
    description: '3 produits approchent du seuil critique. Passez une commande groupée pour réduire les coûts.',
    icon: Package,
    action: 'Voir les produits',
    href: '/produits',
  },
  {
    title: 'Relances factures',
    description: '2 factures en attente depuis plus de 30 jours. Envoyez des relances automatiques.',
    icon: FileText,
    action: 'Gérer les relances',
    href: '/factures',
  },
  {
    title: 'Rotation produits',
    description: 'Les produits A, B, C ont une rotation lente. Envisagez une promotion.',
    icon: TrendingUp,
    action: 'Analyser',
    href: '/dashboard',
  },
];

export function Workspace() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const { user } = useAuth();

  const [stats, setStats] = useState({
    invoiced: 0,
    pending: 0,
    clients: 0,
    products: 0,
    monthlyGrowth: 12.5,
  });
  const [changeStats, setChangeStats] = useState({
    invoicedChange: 0,
    invoicedPositive: true,
    clientsChange: 0,
    productsChange: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedRange, setSelectedRange] = useState('6m');
  const [isLoading, setIsLoading] = useState(true);
  const [activeRecoIndex, setActiveRecoIndex] = useState(0);
  const [newClients, setNewClients] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('notifications-enabled') !== 'false';
  });

  const handleToggleNotifications = (checked: boolean) => {
    setNotificationsEnabled(checked);
    localStorage.setItem('notifications-enabled', String(checked));
    window.dispatchEvent(new CustomEvent('notifications-toggle', { detail: { enabled: checked } }));
    toast.success(checked ? 'Notifications activées' : 'Notifications désactivées');
  };

  const fetchData = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      const [factRes, vpRes, depRes, prodRes, cliRes, fourRes, devisRes, bcRes] = await Promise.all([
        supabase.from('factures').select('*').eq('user_id', user.id),
        supabase.from('ventes_passagers').select('*').eq('user_id', user.id),
        supabase.from('depenses').select('*').eq('user_id', user.id),
        supabase.from('produits').select('*').eq('user_id', user.id),
        supabase.from('clients').select('*').eq('user_id', user.id),
        supabase.from('fournisseurs').select('*').eq('user_id', user.id),
        supabase.from('devis').select('*').eq('user_id', user.id),
        supabase.from('bons_commande').select('*').eq('user_id', user.id),
      ]);

      const factures = (factRes.data || []);
      const vp = (vpRes.data || []);
      const depenses = (depRes.data || []);
      const produits = (prodRes.data || []);
      const clients = (cliRes.data || []);

      const allInvoices = [...factures, ...vp];
      const validInvoices = allInvoices.filter((f: any) => f.statut !== 'annulée');
      const totalRevenue = validInvoices.reduce((sum: number, f: any) => sum + Number(f.montant_ttc || 0), 0);

      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      const monthsToShow = selectedRange === '1m' ? 1 : selectedRange === '1y' ? 12 : 6;
      const chartDataCalc: any[] = [];

      for (let i = monthsToShow - 1; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const month = d.getMonth();
        const year = d.getFullYear();
        const monthRevenue = [
          ...factures.filter((f: any) => new Date(f.date_emission).getMonth() === month && new Date(f.date_emission).getFullYear() === year),
          ...vp.filter((v: any) => new Date(v.date).getMonth() === month && new Date(v.date).getFullYear() === year),
        ].reduce((s: number, f: any) => s + Number(f.montant_ttc || 0), 0);
        const monthExpense = depenses.filter((d: any) =>
          new Date(d.date_depense).getMonth() === month && new Date(d.date_depense).getFullYear() === year
        ).reduce((s: number, d: any) => s + Number(d.montant_ttc || 0), 0);
        chartDataCalc.push({
          name: monthNames[month],
          revenue: monthRevenue,
          expenses: monthExpense,
        });
      }

      const periodRevenue = chartDataCalc.reduce((sum, m) => sum + m.revenue, 0);
      const revenueGrowth = chartDataCalc.length >= 2
        ? ((chartDataCalc[chartDataCalc.length - 1].revenue - chartDataCalc[chartDataCalc.length - 2].revenue) / (chartDataCalc[chartDataCalc.length - 2].revenue || 1)) * 100
        : 0;

      const invoicedPrev = chartDataCalc.length >= 2
        ? chartDataCalc[chartDataCalc.length - 2].revenue
        : 0;
      const invoicedCurr = chartDataCalc.length >= 1
        ? chartDataCalc[chartDataCalc.length - 1].revenue
        : 0;

      setStats({
        invoiced: periodRevenue,
        pending: factures.filter((f: any) => f.statut === 'en_attente' || f.statut === 'reste_a_payer').length,
        clients: clients.length,
        products: produits.length,
        monthlyGrowth: revenueGrowth,
      });

      setChangeStats({
        invoicedChange: invoicedPrev > 0 ? ((invoicedCurr - invoicedPrev) / invoicedPrev) * 100 : 0,
        invoicedPositive: invoicedCurr >= invoicedPrev,
        clientsChange: 0,
        productsChange: 0,
      });

      setChartData(chartDataCalc);

      const invItems: InventoryItem[] = (produits || []).map((p: any) => {
        const info = getStockInfo(Number(p.stock_actuel) || 0, Number(p.stock_min) || 1);
        return {
          id: p.id,
          name: p.nom || p.designation || '',
          reference: p.reference || '',
          stockActuel: Number(p.stock_actuel) || 0,
          stockMin: Number(p.stock_min) || 1,
          unite: p.unite || 'pcs',
          ...info,
        };
      }).sort((a, b) => a.percentage - b.percentage).slice(0, 6);

      setInventoryItems(invItems);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentClients = clients.filter((c: any) => {
        const d = c.created_at || c.date_creation;
        return d && new Date(d) >= thirtyDaysAgo;
      });
      setNewClients(recentClients.length);
    } catch (error) {
      console.error('Error fetching workspace data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    fetchData();
  }, [user, selectedRange]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('workspace-changes')
      .on('postgres_changes', { event: '*', schema: 'public', filter: `user_id=eq.${user.id}` }, () => {
        fetchData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, selectedRange]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('workspace-changes-2')
      .on('postgres_changes', { event: '*', schema: 'public', filter: `user_id=eq.${user.id}` }, () => {
        fetchData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const addTask = async () => {
    if (!newTask.trim()) return;
    try {
      const payload = { title: newTask, completed: false, priority: 'medium' };
      const { error } = await supabase.from('tasks').insert([payload]);
      if (error) throw error;
      const { data: tasksData } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      setTasks(tasksData || []);
      setNewTask('');
      toast.success('Tâche ajoutée');
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error("Erreur lors de l'ajout de la tâche");
    }
  };

  const toggleTask = async (id: string | number) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    try {
      await supabase.from('tasks').update({ completed: !task.completed }).eq('id', id);
      setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    } catch (error) {
      console.error('Error toggling task:', error);
      toast.error('Erreur lors de la mise à jour de la tâche');
    }
  };

  const deleteTask = async (id: string | number) => {
    try {
      await supabase.from('tasks').delete().eq('id', id);
      setTasks(tasks.filter(t => t.id !== id));
      toast.info('Tâche supprimée');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Erreur lors de la suppression de la tâche');
    }
  };

  const metrics = [
    {
      label: 'Facturé',
      value: formatCurrency(stats.invoiced),
      icon: DollarSign,
      iconBg: 'bg-blue-500/10 text-blue-400',
      change: {
        value: `${changeStats.invoicedChange >= 0 ? '+' : ''}${changeStats.invoicedChange.toFixed(1)}%`,
        positive: changeStats.invoicedPositive,
        label: 'vs mois dernier',
      },
    },
    {
      label: 'Clients',
      value: String(stats.clients),
      icon: Users,
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      change: {
        value: `+${newClients}`,
        positive: true,
        label: 'nouveaux ce mois',
      },
    },
    {
      label: 'Produits',
      value: String(stats.products),
      icon: Package,
      iconBg: 'bg-amber-500/10 text-amber-400',
      change: {
        value: `${inventoryItems.filter(i => i.status === 'critique' || i.status === 'rupture').length} alerte(s)`,
        positive: inventoryItems.filter(i => i.status === 'critique' || i.status === 'rupture').length === 0,
        label: 'stock critique',
      },
    },
    {
      label: 'Croissance',
      value: `${stats.monthlyGrowth >= 0 ? '+' : ''}${stats.monthlyGrowth.toFixed(1)}%`,
      icon: Target,
      iconBg: stats.monthlyGrowth >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400',
      change: {
        value: `${stats.monthlyGrowth >= 0 ? '+' : ''}${stats.monthlyGrowth.toFixed(1)}%`,
        positive: stats.monthlyGrowth >= 0,
        label: 'vs mois dernier',
      },
    },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-[8px] border p-4" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          <p className="text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>{label}</p>
          {payload.map((entry: any, idx: number) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
              <span style={{ color: 'var(--muted-foreground)' }}>{entry.name === 'revenue' ? 'Revenus' : 'Dépenses'}:</span>
              <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-500">
      {/* 4-Column Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-[8px] bg-card p-5 border border-border"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={cn("h-10 w-10 rounded-[8px] flex items-center justify-center shrink-0", metric.iconBg)}>
                <metric.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">{metric.label}</p>
            <p className="text-2xl font-bold text-card-foreground mt-0.5 tracking-tight">{metric.value}</p>
            {metric.change && (
              <div className="flex items-center gap-2 mt-1.5">
                <span className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-[4px]",
                  metric.change.positive ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"
                )}>
                  {metric.change.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {metric.change.value}
                </span>
                <span className="text-xs text-muted-foreground">{metric.change.label}</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Main Grid: 12-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ============ LEFT COLUMN (7 cols) ============ */}
        <div className="lg:col-span-7 space-y-6">

          {/* Performance Chart */}
          <Card className="shadow-none hover:shadow-none rounded-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-semibold text-card-foreground">Performance de Facturation</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {selectedRange === '1m' ? "Évolution sur les 30 derniers jours" :
                   selectedRange === '1y' ? "Évolution sur les 12 derniers mois" :
                   "Évolution sur les 6 derniers mois"}
                </CardDescription>
              </div>
              <Tabs value={selectedRange} onValueChange={setSelectedRange}>
                <TabsList className="bg-muted dark:bg-white/5 rounded-[4px] p-0.5">
                  <TabsTrigger value="1m" className="text-xs px-3 py-1.5 data-[state=active]:bg-card rounded-[4px]">1M</TabsTrigger>
                  <TabsTrigger value="6m" className="text-xs px-3 py-1.5 data-[state=active]:bg-card rounded-[4px]">6M</TabsTrigger>
                  <TabsTrigger value="1y" className="text-xs px-3 py-1.5 data-[state=active]:bg-card rounded-[4px]">1A</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className={cn("h-[300px] pt-4 transition-opacity duration-300", isLoading && "opacity-40")}>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#267E54" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#267E54" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} dx={-4} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
                  <Area type="monotone" dataKey="revenue" stroke="#267E54" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 5, fill: '#267E54', stroke: 'white', strokeWidth: 2 }} />
                  <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#expenseGrad)" dot={false} activeDot={{ r: 4, fill: '#ef4444', stroke: 'white', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Priority Inventory Management Table */}
          <Card className="shadow-none hover:shadow-none rounded-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-card-foreground">Gestion Prioritaire du Stock</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Produits triés par niveau de stock critique
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="text-xs h-8 bg-transparent border border-white/20 text-white hover:bg-white/10 rounded-sm transition-all duration-200" onClick={() => window.location.href = '/produits'}>
                  Voir tout <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-xs font-medium text-card-foreground h-9 px-5">Produit</TableHead>
                    <TableHead className="text-xs font-medium text-card-foreground h-9">Référence</TableHead>
                    <TableHead className="text-xs font-medium text-card-foreground h-9">Stock</TableHead>
                    <TableHead className="text-xs font-medium text-card-foreground h-9 hidden md:table-cell">Niveau</TableHead>
                    <TableHead className="text-xs font-medium text-card-foreground h-9 text-right pr-5">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-card-foreground/60 text-sm">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-30 text-card-foreground" />
                        Aucun produit en stock
                      </TableCell>
                    </TableRow>
                  ) : (
                    inventoryItems.slice(0, 4).map((item) => {
                      const cfg = stockConfig[item.status];
                      return (
                        <TableRow key={item.id} className="border-border">
                          <TableCell className="py-3.5 px-5">
                            <p className="text-sm font-medium text-card-foreground">{item.name}</p>
                            <p className="text-xs text-card-foreground/70 mt-0.5">
                              {item.stockActuel} / {Math.max(item.stockMin * 3, 1)} {item.unite}
                            </p>
                          </TableCell>
                          <TableCell className="py-3.5">
                            <span className="text-xs text-card-foreground/70 font-mono">{item.reference || '—'}</span>
                          </TableCell>
                          <TableCell className="py-3.5">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-sm font-semibold",
                                item.status === 'rupture' || item.status === 'critique' ? 'text-red-400' :
                                item.status === 'faible' ? 'text-amber-400' : 'text-card-foreground'
                              )}>
                                {item.stockActuel}
                              </span>
                              <span className="text-xs text-card-foreground/70">{item.unite}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3.5 hidden md:table-cell">
                            <div className="w-28">
                              <div className="h-1.5 rounded-full bg-muted dark:bg-white/10 overflow-hidden">
                                <div
                                  className={cn("h-full rounded-full transition-all duration-500", cfg.barColor)}
                                  style={{ width: `${item.percentage}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3.5 text-right pr-5">
                            <span className={cn("inline-block text-xs font-semibold px-2 py-0.5 rounded-[4px] border", cfg.badgeClass)}>
                              {cfg.label}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Stats summary row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-[8px] bg-card p-4 border border-border flex items-center gap-3">
              <div className="h-10 w-10 rounded-[8px] bg-violet-500/10 text-violet-400 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Factures en attente</p>
                <p className="text-lg font-bold text-card-foreground">{stats.pending}</p>
              </div>
            </div>
            <div className="rounded-[8px] bg-card p-4 border border-border flex items-center gap-3">
              <div className="h-10 w-10 rounded-[8px] bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Nouveaux clients</p>
                <p className="text-lg font-bold text-card-foreground">{newClients}</p>
              </div>
            </div>
            <div className="rounded-[8px] bg-card p-4 border border-border flex items-center gap-3">
              <div className="h-10 w-10 rounded-[8px] bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Alertes stock</p>
                <p className="text-lg font-bold text-card-foreground">{inventoryItems.filter(i => i.status === 'critique' || i.status === 'rupture').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ============ RIGHT COLUMN (5 cols) ============ */}
        <div className="lg:col-span-5 space-y-6">

          {/* AI Optimization Card */}
          <div className="rounded-[8px] bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 p-5 card-glow-active">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 rounded-[8px] bg-emerald-500/10 flex items-center justify-center">
                <Sparkles className="h-4.5 w-4.5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-card-foreground">Optimisation IA</h3>
                <p className="text-xs text-muted-foreground">Recommandations intelligentes</p>
              </div>
              <Badge className="ml-auto bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-semibold px-2 py-0.5">
                {activeRecoIndex + 1}/{aiRecommendations.length}
              </Badge>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeRecoIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {(() => {
                  const reco = aiRecommendations[activeRecoIndex];
                  const RecoIcon = reco.icon;
                  return (
                    <div>
                      <div className="flex items-start gap-3 mb-3">
                        <div className="h-8 w-8 rounded-[4px] bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                          <RecoIcon className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-card-foreground">{reco.title}</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed mt-1">{reco.description}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 mt-1 btn-glow-primary"
                        onClick={() => window.location.href = reco.href}
                      >
                        {reco.action} <ArrowRight className="h-3 w-3 ml-1.5" />
                      </Button>
                    </div>
                  );
                })()}
              </motion.div>
            </AnimatePresence>

            <div className="flex gap-1.5 mt-4">
              {aiRecommendations.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveRecoIndex(idx)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    idx === activeRecoIndex ? "w-6 bg-emerald-500" : "w-1.5 bg-emerald-800"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <Card className="shadow-none hover:shadow-none rounded-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-card-foreground">Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-3">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => window.location.href = action.href}
                  className="flex flex-col items-center justify-center p-4 rounded-sm border border-border bg-card"
                >
                  <div className={cn("p-2.5 rounded-sm mb-3", action.iconBg)}>
                    <action.icon className={cn("w-5 h-5", action.iconColor)} />
                  </div>
                  <span className="text-xs font-medium text-foreground">{action.label}</span>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Task Manager */}
          <Card className="shadow-none hover:shadow-none rounded-[8px] overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-card-foreground">Tâches à faire</CardTitle>
                <Badge className="bg-emerald-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-[4px]">
                  {tasks.filter(t => !t.completed).length}
                </Badge>
              </div>
              <div className="flex gap-2 mt-3">
                <Input
                  placeholder="Ajouter une tâche..."
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTask()}
                  className="focus-visible:ring-emerald-500/30 h-9 text-sm rounded-[4px]"
                />
                <Button size="icon" onClick={addTask} className="bg-emerald-600 hover:bg-emerald-700 shrink-0 h-9 w-9 rounded-[4px]">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[320px] overflow-y-auto">
                <AnimatePresence initial={false}>
                  {tasks.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground/60">
                      <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-20 text-muted-foreground" />
                      <p className="text-sm">Tout est à jour !</p>
                    </div>
                  ) : (
                    tasks.map((task) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={cn(
                          "group flex items-center justify-between px-5 py-3 border-b border-border last:border-0",
                          task.completed ? "bg-muted" : ""
                        )}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <button
                            onClick={() => toggleTask(task.id)}
                            className={cn(
                              "h-5 w-5 rounded-[4px] border-2 flex items-center justify-center transition-all shrink-0",
                              task.completed
                                ? "bg-emerald-500 border-emerald-500 text-white"
                                : "border-border"
                            )}
                          >
                            {task.completed && <CheckCircle2 className="h-3 w-3" />}
                          </button>
                          <span className={cn(
                            "text-sm font-medium truncate transition-all",
                            task.completed ? "text-muted-foreground line-through" : "text-card-foreground"
                          )}>
                            {task.title}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0 rounded-[4px]"
                          onClick={() => deleteTask(task.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stat Footer */}
          <div className={cn(
            "rounded-sm border p-4 flex items-center justify-between transition-colors duration-200",
            notificationsEnabled
              ? "bg-emerald-500/10 border-emerald-500/20"
              : "bg-muted border-border"
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-9 w-9 rounded-[8px] flex items-center justify-center transition-colors duration-200",
                  notificationsEnabled ? "bg-emerald-500/10" : "bg-muted"
                )}>
                <Bell className={cn(
                  "h-4.5 w-4.5 transition-colors duration-200",
                  notificationsEnabled ? "text-emerald-400" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <p className={cn(
                  "text-sm font-medium transition-colors duration-200",
                  notificationsEnabled ? "text-card-foreground" : "text-muted-foreground"
                )}>
                  Rappels actifs
                </p>
                <p className="text-xs text-muted-foreground">Notifications en temps réel</p>
              </div>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={handleToggleNotifications}
              className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-muted data-[state=unchecked]:border-[#267E54] dark:data-[state=unchecked]:border-[#2ECC71]"
              thumbClassName="data-[state=unchecked]:bg-[#267E54] dark:data-[state=unchecked]:bg-[#2ECC71]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
