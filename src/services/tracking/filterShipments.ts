export function filterShipments({
  shipments,
  search,
  status,
  provider,
  date,
}: {
  shipments: any[];
  search: string;
  status: string;
  provider: string;
  date: string;
}) {
  const today = new Date();

  return shipments.filter((shipment) => {
    // ==========================
    // Search
    // ==========================
    const searchValue = search.trim().toLowerCase();

    const matchesSearch =
      !searchValue ||
      shipment.orders?.name?.toLowerCase().includes(searchValue) ||
      shipment.orders?.phone?.toLowerCase().includes(searchValue) ||
      shipment.orders?.city?.toLowerCase().includes(searchValue) ||
      shipment.tracking_number?.toLowerCase().includes(searchValue);

    // ==========================
    // Status
    // ==========================
    const matchesStatus =
      status === "all" ||
      shipment.shipping_status === status;

    // ==========================
    // Provider
    // ==========================
    const matchesProvider =
      provider === "all" ||
      shipment.provider === provider;

    // ==========================
    // Date
    // ==========================
    let matchesDate = true;

    if (date !== "all") {
      const shipmentDate = new Date(shipment.updated_at);

      switch (date) {
        case "today":
          matchesDate =
            shipmentDate.toDateString() ===
            today.toDateString();
          break;

        case "yesterday": {
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);

          matchesDate =
            shipmentDate.toDateString() ===
            yesterday.toDateString();
          break;
        }

        case "week": {
          const weekAgo = new Date(today);
          weekAgo.setDate(today.getDate() - 7);

          matchesDate = shipmentDate >= weekAgo;
          break;
        }

        case "month":
          matchesDate =
            shipmentDate.getMonth() === today.getMonth() &&
            shipmentDate.getFullYear() ===
              today.getFullYear();
          break;
      }
    }

    return (
      matchesSearch &&
      matchesStatus &&
      matchesProvider &&
      matchesDate
    );
  });
}