export async function createBonLivraison(
  provider: string,
  selectedIds: number[]
) {
  const response = await fetch(
    "/api/bon-livraisons/create",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        provider,
        selectedIds,
      }),
    }
  );

  return response.json();
}