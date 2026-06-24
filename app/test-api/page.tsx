"use client";

export default function TestApiPage() {
  const testApi = async () => {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "pk_live_4ae75094f51f46a3b96b6147aa265ade",
      },
      body: JSON.stringify({
        product: "Test Product",
        name: "Ayoub",
        phone: "0612345678",
        city: "Casablanca",
        address: "Maarif",
        color: "Noir",
        size: "XL",
        price: 250,
      }),
    });

    const data = await res.json();

    console.log(data);
    alert(JSON.stringify(data, null, 2));
  };

  return (
    <div className="p-10">
      <button
        onClick={testApi}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Test API
      </button>
    </div>
  );
}