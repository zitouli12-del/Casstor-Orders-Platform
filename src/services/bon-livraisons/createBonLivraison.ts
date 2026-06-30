export async function createBonLivraison(
  provider: string,
  selectedIds: number[]
) {
  console.log("FETCH START");

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

  console.log("STATUS =", response.status);

  const data = await response.json();

  console.log("DATA =", data);

  return data;
}