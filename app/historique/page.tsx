"use client";

import HistoriqueHeader from "@/src/components/Historique/HistoriqueHeader";
import HistoriqueDashboardCards from "@/src/components/Historique/HistoriqueDashboardCards";
import HistoriqueSearchBar from "@/src/components/Historique/HistoriqueSearchBar";
import HistoriqueOrdersTable from "@/src/components/Historique/HistoriqueOrdersTable";
import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";

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
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 font-medium">Chargement de l'historique...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 space-y-6">
      <HistoriqueHeader totalResults={filteredOrders.length} />

      <HistoriqueDashboardCards
        totalOrders={totalOrders}
        totalToday={totalToday}
        totalYesterday={totalYesterday}
        totalThisMonth={totalThisMonth}
        totalRevenue={totalRevenue}
      />

      <HistoriqueSearchBar
        value={search}
        onChange={setSearch}
      />

      <HistoriqueOrdersTable orders={filteredOrders} />
    </div>
  );
}