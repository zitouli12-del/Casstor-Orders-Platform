"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";
import { 
  History, 
  Calendar, 
  Clock, 
  BarChart3, 
  Search, 
  Wallet
} from "lucide-react";

export default function Home() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  async function getCurrentStoreId() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: store, error } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (error || !store) return null;
    return store.id;
  }

  async function fetchOrders() {
    setLoading(true);
    const storeId = await getCurrentStoreId();
    
    if (storeId) {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setOrders(data);
      }
    }
    
    setLoading(false);
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.name?.toLowerCase().includes(search.toLowerCase()) ||
      order.phone?.includes(search) ||
      order.city?.toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalOrders = orders.length;
  const totalToday = orders.filter((o) => new Date(o.created_at) >= startOfToday).length;
  const totalYesterday = orders.filter((o) => {
    const orderDate = new Date(o.created_at);
    return orderDate >= startOfYesterday && orderDate < endOfYesterday;
  }).length;
  const totalThisMonth = orders.filter((o) => new Date(o.created_at) >= startOfThisMonth).length;

  const totalRevenue = orders.reduce(
    (sum, order) => sum + Number(order.price || 0),
    0
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-400 font-medium bg-[#0f172a]">
        Chargement de l'historique...
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-[#0f172a] min-h-screen text-slate-100 p-2 sm:p-4 md:p-8">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <History className="text-blue-500" size={32} />
            Historique des Commandes
          </h1>
          <p className="text-sm text-slate-400 mt-1">Consultez toutes les commandes enregistrées dans la base de données.</p>
        </div>
        
        <div className="bg-[#1f2937] border border-slate-800 px-5 py-3 rounded-xl flex items-center gap-4 shadow-lg shadow-black/20 self-start md:self-auto">
          <div className="w-10 h-10 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
            <BarChart3 size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Commandes trouvées</p>
            <p className="text-2xl font-black text-white">{filteredOrders.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="bg-[#1f2937] border border-slate-800 p-4 rounded-xl shadow-md">
          <p className="text-xs font-medium text-slate-400 flex items-center gap-2">
            <History size={14} className="text-blue-400" />
            Total Commandes
          </p>
          <p className="text-xl font-bold text-white">{totalOrders}</p>
        </div>
        
        <div className="bg-[#1f2937] border border-blue-500/20 p-4 rounded-xl shadow-md">
          <p className="text-xs font-medium text-blue-400 flex items-center gap-2">
            <Calendar size={14} className="text-blue-400" />
            Aujourd'hui
          </p>
          <p className="text-xl font-bold text-white">{totalToday}</p>
        </div>
        
        <div className="bg-[#1f2937] border border-purple-500/20 p-4 rounded-xl shadow-md">
          <p className="text-xs font-medium text-purple-400 flex items-center gap-2">
            <Clock size={14} className="text-purple-400" />
            Hier
          </p>
          <p className="text-xl font-bold text-white">{totalYesterday}</p>
        </div>
        
        <div className="bg-[#1f2937] border border-emerald-500/20 p-4 rounded-xl shadow-md">
          <p className="text-xs font-medium text-emerald-400 flex items-center gap-2">
            <Calendar size={14} className="text-emerald-400" />
            Ce Mois
          </p>
          <p className="text-xl font-bold text-white">{totalThisMonth}</p>
        </div>
        
        <div className="bg-[#1f2937] border border-yellow-500/20 p-4 rounded-xl shadow-md col-span-2 md:col-span-1 lg:col-span-1">
          <p className="text-xs font-bold text-yellow-400 flex items-center gap-2">
            <Wallet size={14} className="text-yellow-400" />
            CA Total
          </p>
          <p className="text-xl font-black text-white">{totalRevenue} DH</p>
        </div>
      </div>

      <div className="bg-[#1f2937] border border-slate-800 p-5 rounded-xl shadow-xl">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone ou ville..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0f172a] border border-slate-700 text-slate-200 focus:outline-none focus:border-slate-500 text-sm transition-all"
          />
        </div>
      </div>

      <div className="bg-[#1f2937] border border-slate-700 rounded-xl overflow-hidden shadow-xl max-h-[650px] overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#111827] sticky top-0 z-20">
              <th className="border border-slate-700 p-3.5 text-xs font-bold text-slate-400 uppercase">ID</th>
              <th className="border border-slate-700 p-3.5 text-xs font-bold text-slate-400 uppercase">Date & Heure</th>
              <th className="border border-slate-700 p-3.5 text-xs font-bold text-slate-400 uppercase">Client</th>
              <th className="border border-slate-700 p-3.5 text-xs font-bold text-slate-400 uppercase">Téléphone</th>
              <th className="border border-slate-700 p-3.5 text-xs font-bold text-slate-400 uppercase">Ville</th>
              <th className="border border-slate-700 p-3.5 text-xs font-bold text-slate-400 uppercase">Produit</th>
              <th className="border border-slate-700 p-3.5 text-xs font-bold text-slate-400 uppercase">Source</th>
              <th className="border border-slate-700 p-3.5 text-xs font-bold text-slate-400 uppercase">Prix</th>
            </tr>
          </thead>
          <tbody className="text-slate-300 text-sm">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center p-8 text-slate-500">
                  Aucune commande trouvée
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="border border-slate-700 p-3 text-xs text-slate-400">#{order.id}</td>
                  <td className="border border-slate-700 p-3 text-xs text-slate-400">
                    {new Date(order.created_at).toLocaleString("fr-FR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="border border-slate-700 p-3">{order.name}</td>
                  <td className="border border-slate-700 p-3">{order.phone}</td>
                  <td className="border border-slate-700 p-3">{order.city}</td>
                  <td className="border border-slate-700 p-3">{order.product || "-"}</td>
                  <td className="border border-slate-700 p-3">{order.source || "-"}</td>
                  <td className="border border-slate-700 p-3 font-bold text-green-400">{order.price || 0} DH</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}