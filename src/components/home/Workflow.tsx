export default function Workflow() {
  const steps = [
    {
      icon: "🌐",
      title: "Landing Page",
      description: "Votre site e-commerce",
    },
    {
      icon: "🔑",
      title: "API Casstor",
      description: "Réception automatique",
    },
    {
      icon: "✅",
      title: "Confirmation",
      description: "Validez les commandes",
    },
    {
      icon: "🚚",
      title: "Shipping",
      description: "Expédition transporteur",
    },
    {
      icon: "📄",
      title: "Bon de Livraison",
      description: "Création du BL",
    },
    {
      icon: "📦",
      title: "Livraison",
      description: "Commande livrée",
    },
  ];

  return (
    <section className="py-24">

      <div className="mx-auto max-w-7xl px-6">

        <div className="mb-16 text-center">

          <h2 className="text-4xl font-bold">
            Comment ça fonctionne ?
          </h2>

          <p className="mt-4 text-slate-400">
            Casstor Orders automatise tout votre workflow,
            de la réception de la commande jusqu'à la livraison.
          </p>

        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">

          {steps.map((step, index) => (
            <div
              key={step.title}
              className="flex items-center"
            >

              <div className="w-52 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center backdrop-blur transition duration-300 hover:border-cyan-400 hover:-translate-y-1">

                <div className="mb-4 text-5xl">
                  {step.icon}
                </div>

                <h3 className="text-lg font-semibold">
                  {step.title}
                </h3>

                <p className="mt-3 text-sm text-slate-400">
                  {step.description}
                </p>

              </div>

              {index !== steps.length - 1 && (
                <div className="mx-4 hidden text-3xl text-cyan-400 lg:block">
                  →
                </div>
              )}

            </div>
          ))}

        </div>

      </div>

    </section>
  );
}