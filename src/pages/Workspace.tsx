import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  FileText, 
  Users, 
  Package, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  ArrowRight,
  Search,
  Calendar as CalendarIcon,
  Filter,
  MoreVertical,
  Trash2,
  Edit2,
  ShoppingCart,
  Box,
  CreditCard,
  Bell,
  Sparkles,
  ChevronRight,
  Receipt
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Task {
  id: string | number;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
}

export function Workspace() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    invoiced: 0,
    pending: 0,
    clients: 0,
    products: 0,
    monthlyGrowth: 12.5
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [lowStockProduits, setLowStockProduits] = useState<any[]>([]);
const [selectedRange, setSelectedRange] = useState('6m');
  const [isLoading, setIsLoading] = useState(true);
  const [entreprise, setEntreprise] = useState<any>(null);

const fetchData = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      
      // Filter by user_id explicitly
      const [factRes, vpRes, depRes, prodRes, cliRes, fourRes, devisRes, bcRes] = await Promise.all([
        supabase.from('factures').select('*').eq('user_id', user.id),
        supabase.from('ventes_passagers').select('*').eq('user_id', user.id),
        supabase.from('depenses').select('*').eq('user_id', user.id),
        supabase.from('produits').select('*').eq('user_id', user.id),
        supabase.from('clients').select('*').eq('user_id', user.id),
        supabase.from('fournisseurs').select('*').eq('user_id', user.id),
        supabase.from('devis').select('*').eq('user_id', user.id),
        supabase.from('bons_commande').select('*').eq('user_id', user.id)
      ]);

        const factures = (factRes.data || []);
        const vp = (vpRes.data || []);
        const depenses = (depRes.data || []);
        const produits = (prodRes.data || []);
        const clients = (cliRes.data || []);
        const fournisseurs = (fourRes.data || []);
        const devis = (devisRes.data || []);
        const bc = (bcRes.data || []);

        console.log('User:', user.id);
        console.log('Factures:', factures.length, factures);
        console.log('VP:', vp.length);
        console.log('Depenses:', depenses.length);
        
        const allInvoices = [...factures, ...vp];
        const validInvoices = allInvoices.filter((f: any) => f.statut !== 'annulée');
        const totalRevenue = validInvoices.reduce((sum: number, f: any) => sum + Number(f.montant_ttc || 0), 0);
        
const totalExpenses = depenses.reduce((sum: number, d: any) => sum + Number(d.montant_ttc || 0), 0);
        
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        
        // Determine number of months based on selectedRange
        const monthsToShow = selectedRange === '1m' ? 1 : selectedRange === '1y' ? 12 : 6;
        const chartDataCalc: any[] = [];
        
        for (let i = monthsToShow - 1; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const month = d.getMonth();
          const year = d.getFullYear();
          const monthRevenue = [
            ...factures.filter((f: any) => new Date(f.date_emission).getMonth() === month && new Date(f.date_emission).getFullYear() === year),
            ...vp.filter((v: any) => new Date(v.date).getMonth() === month && new Date(v.date).getFullYear() === year)
          ].reduce((s: number, f: any) => s + Number(f.montant_ttc || 0), 0);
          const monthExpense = depenses.filter((d: any) => new Date(d.date_depense).getMonth() === month && new Date(d.date_depense).getFullYear() === year).reduce((s: number, d: any) => s + Number(d.montant_ttc || 0), 0);
          chartDataCalc.push({
            name: monthNames[month],
            revenue: monthRevenue,
            expenses: monthExpense
          });
        }

        // Calculate stats for selected period only
        const periodRevenue = chartDataCalc.reduce((sum, m) => sum + m.revenue, 0);
        const periodExpenses = chartDataCalc.reduce((sum, m) => sum + m.expenses, 0);
        
        const revenueGrowth = chartDataCalc.length >= 2 
          ? ((chartDataCalc[chartDataCalc.length - 1].revenue - chartDataCalc[chartDataCalc.length - 2].revenue) / (chartDataCalc[chartDataCalc.length - 2].revenue || 1)) * 100 
          : 0;

        setStats({
          invoiced: periodRevenue,
          pending: factures.filter((f: any) => f.statut === 'en_attente' || f.statut === 'reste_a_payer').length,
          clients: clients.length,
          products: produits.length,
          monthlyGrowth: revenueGrowth
        });

        setChartData(chartDataCalc);
        setLowStockProduits((produits || []).filter((p: any) => Number(p.stock_actuel) <= Number(p.stock_min))).slice(0, 5);
        setTasks([]);
        
        console.log('Fetching data - user:', user?.id);
        console.log('Factures:', factures?.length);
        console.log('VP:', vp?.length);
        console.log('Depenses:', depenses?.length);
        
        const combined = [
          ...(factures || []).filter(f => f.date_emission || f.created_at).map((f: any) => ({ ...f, type: 'Facture', date: f.date_emission || f.created_at, label: f.numero })),
          ...(devis || []).filter(d => d.date_emission || d.created_at).map((d: any) => ({ ...d, type: 'Devis', date: d.date_emission || d.created_at, label: d.numero })),
          ...(bc || []).filter(b => b.date_commande || b.created_at).map((b: any) => ({ ...b, type: 'Commande', date: b.date_commande || b.created_at, label: b.numero })),
          ...(vp || []).filter(v => v.date || v.created_at).map((v: any) => ({ ...v, type: 'Vente Passager', date: v.date || v.created_at, label: v.numero })),
          ...(depenses || []).filter(e => e.date_depense || e.created_at).map((e: any) => ({ ...e, type: 'Dépense', date: e.date_depense || e.created_at, label: e.reference || e.numero || `DEP-${e.id}` }))
        ].sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateB - dateA;
        }).slice(0, 4);

        console.log('Combined (last 4):', combined);
        setRecentActivity(combined);

        if (user?.id) {
          const { data: params } = await supabase
            .from('parametres')
            .select('*')
            .eq('user_id', String(user.id))
            .single();
          
          if (params) {
            setEntreprise(params);
          }
        }
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedRange]);

  useEffect(() => {
    if (!user?.id) return;
    
    const channel = supabase
      .channel('workspace-changes')
      .on('postgres_changes', { event: '*', schema: 'public', filter: `user_id=eq.${user.id}` }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const addTask = async () => {
    if (!newTask.trim()) return;
    
    try {
      const payload = {
        title: newTask,
        completed: false,
        priority: 'medium'
      };
      
      const { error } = await supabase.from('tasks').insert([payload]);
      if (error) throw error;
      
      const { data: tasksData } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      setTasks(tasksData || []);
      setNewTask('');
      toast.success('Tâche ajoutée');
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Erreur lors de l\'ajout de la tâche');
    }
  };

  const toggleTask = async (id: string | number) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    try {
      const { error } = await supabase.from('tasks').update({ completed: !task.completed }).eq('id', id);
      if (error) throw error;

      setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    } catch (error) {
      console.error('Error toggling task:', error);
      toast.error('Erreur lors de la mise à jour de la tâche');
    }
  };

  const deleteTask = async (id: string | number) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;

      setTasks(tasks.filter(t => t.id !== id));
      toast.info('Tâche supprimée');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Erreur lors de la suppression de la tâche');
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Top Navigation / Search Bar - REMOVED Search and Notification as requested */}
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#267E54] to-[#1e6643] flex items-center justify-center text-white font-bold shadow-md">
            {entreprise?.nomSociete?.charAt(0)?.toUpperCase() || 'P'}
          </div>
        </div>
      </div>

      {/* Hero Welcome Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#267E54] to-[#1e6643] p-8 text-white shadow-2xl">
        <div className="relative z-10">
          <Badge className="bg-white/20 hover:bg-white/30 text-white border-none mb-4">
            <Sparkles className="mr-1 h-3 w-3" /> Bienvenue sur ParaCare
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">Bonjour !</h1>
          <p className="text-white/80 text-lg max-w-xl">
            Bienvenue{entreprise?.nomSociete ? `, ${entreprise.nomSociete}` : ''}. Vous avez {stats.pending} factures en attente de paiement ce mois-ci.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button className="bg-white text-[#267E54] hover:bg-white/90" onClick={() => window.location.href = '/factures'}>
              <Plus className="mr-2 h-4 w-4" /> Créer une Facture
            </Button>
            <Button variant="secondary" className="bg-white/10 hover:bg-white/20 border-none text-white" onClick={() => window.location.href = '/dashboard'}>
              Voir les Rapports
            </Button>
          </div>
        </div>
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 h-96 w-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 h-64 w-64 bg-black/10 rounded-full blur-2xl"></div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Stats & Chart */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Facturé', value: stats.invoiced, icon: TrendingUp, color: 'blue', suffix: 'DH' },
              { label: 'Clients', value: stats.clients, icon: Users, color: 'green', suffix: '' },
              { label: 'Produits', value: stats.products, icon: Package, color: 'orange', suffix: '' },
              { label: 'Croissance', value: stats.monthlyGrowth > 0 ? `+${parseFloat(stats.monthlyGrowth.toFixed(1))}` : parseFloat(stats.monthlyGrowth.toFixed(1)), icon: Sparkles, color: stats.monthlyGrowth >= 0 ? 'green' : 'red', suffix: '%' },
            ].map((stat, i) => (
              <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center mb-4",
                    `bg-${stat.color}-50 text-${stat.color}-600`
                  )}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">
                    {stat.suffix === 'DH' ? formatCurrency(stat.value) : stat.value}{stat.suffix !== 'DH' ? stat.suffix : ''}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Performance Chart */}
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Performance de Facturation</CardTitle>
                <CardDescription>
                  {selectedRange === '1m' ? "Évolution de votre chiffre d'affaires sur les 30 derniers jours." :
                   selectedRange === '1y' ? "Évolution de votre chiffre d'affaires sur les 12 derniers mois." :
                   "Évolution de votre chiffre d'affaires sur les 6 derniers mois."}
                </CardDescription>
              </div>
              <Tabs value={selectedRange} onValueChange={setSelectedRange}>
                <TabsList className="bg-gray-100">
                  <TabsTrigger value="1m">1 mois</TabsTrigger>
                  <TabsTrigger value="6m">6 mois</TabsTrigger>
                  <TabsTrigger value="1y">1 an</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className={cn("h-[300px] mt-4 transition-opacity duration-300", isLoading && "opacity-40")}>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#267E54" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#267E54" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} tickFormatter={(v) => `${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(v: number) => [formatCurrency(v), 'Total']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#267E54" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                  <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fillOpacity={0.1} fill="#ef4444" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Transactions Link Card */}
          <Card className="border-none shadow-lg overflow-hidden bg-gradient-to-br from-[#267E54] to-[#1e6643] text-white cursor-pointer hover:opacity-95 transition-opacity" onClick={() => window.location.href = '/transactions'}>
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Receipt className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-lg font-bold">Transactions</p>
                  <p className="text-white/70 text-sm">Voir toutes vos opérations</p>
                </div>
              </div>
              <ChevronRight className="h-8 w-8" />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Tasks & Quick Actions */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Quick Actions Grid */}
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle>Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {[
                { label: 'Facture', icon: FileText, href: '/factures', color: 'blue' },
                { label: 'Devis', icon: TrendingUp, href: '/devis', color: 'purple' },
                { label: 'Commande', icon: ShoppingCart, href: '/bons-commande', color: 'orange' },
                { label: 'Livraison', icon: Box, href: '/bons-livraison', color: 'green' },
                { label: 'Dépense', icon: CreditCard, href: '/depenses', color: 'red' },
                { label: 'Client', icon: Users, href: '/clients', color: 'indigo' },
              ].map((action, i) => (
                <Button 
                  key={i} 
                  variant="outline" 
                  className="h-auto py-4 flex flex-col gap-2 hover:border-[#267E54] hover:bg-[#267E54]/5 transition-all"
                  onClick={() => window.location.href = action.href}
                >
                  <action.icon className={cn("h-5 w-5", `text-${action.color}-600`)} />
                  <span className="text-xs font-medium">{action.label}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Task Manager */}
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Tâches à faire</CardTitle>
                <Badge className="bg-[#267E54]">{tasks.filter(t => !t.completed).length}</Badge>
              </div>
              <div className="flex gap-2 mt-4">
                <Input 
                  placeholder="Ajouter une tâche..." 
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTask()}
                  className="bg-white border-gray-200 focus-visible:ring-[#267E54]"
                />
                <Button size="icon" onClick={addTask} className="bg-[#267E54] hover:bg-[#1e6643] shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[450px] overflow-y-auto">
                <AnimatePresence initial={false}>
                  {tasks.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-10" />
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
                          "group flex items-center justify-between p-4 border-b last:border-0 transition-colors",
                          task.completed ? "bg-gray-50/50" : "hover:bg-gray-50/30"
                        )}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <button 
                            onClick={() => toggleTask(task.id)}
                            className={cn(
                              "h-5 w-5 rounded-md border flex items-center justify-center transition-all shrink-0",
                              task.completed ? "bg-[#267E54] border-[#267E54] text-white" : "border-gray-300 hover:border-[#267E54]"
                            )}
                          >
                            {task.completed && <CheckCircle2 className="h-3 w-3" />}
                          </button>
                          <span className={cn(
                            "text-sm font-medium truncate transition-all",
                            task.completed ? "text-muted-foreground line-through" : "text-gray-700"
                          )}>
                            {task.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => deleteTask(task.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          {/* Stock Alerts */}
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-red-500" />
                Alertes Stock Faible
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lowStockProduits.length > 0 ? (
                  lowStockProduits.map((produit: any) => (
                    <div key={produit.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50/50 border border-red-100">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{produit.nom || produit.designation}</p>
                        <p className="text-xs text-muted-foreground">Réf: {produit.reference}</p>
                      </div>
                      <Badge variant="destructive" className="shrink-0">
                        {produit.stock_actuel} {produit.unite}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p className="text-xs">Stock optimal</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Tips / Help */}
          <Card className="border-none shadow-sm bg-gradient-to-br from-blue-600 to-blue-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h4 className="font-bold">Conseil du jour</h4>
              </div>
              <p className="text-sm text-blue-50 leading-relaxed">
                Saviez-vous que vous pouvez transformer un Devis en Facture en un seul clic depuis la liste des devis ?
              </p>
              <Button variant="link" className="text-white p-0 mt-4 h-auto font-bold hover:no-underline group">
                En savoir plus <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
