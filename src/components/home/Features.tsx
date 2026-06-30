export default function Features() {
  const features = [
    {
      icon: "📥",
      title: "Réception Automatique",
      description:
        "Recevez automatiquement toutes vos commandes depuis vos Landing Pages grâce à votre API Casstor Orders.",
    },
    {
      icon: "✅",
      title: "Confirmation",
      description:
        "Confirmez rapidement vos commandes et gérez leur statut depuis une seule interface.",
    },
    {
      icon: "🚚",
      title: "Expédition",
      description:
        "Expédiez vos colis vers Ozon et vos futurs transporteurs en quelques clics.",
    },
    {
      icon: "📄",
      title: "Bon de Livraison",
      description:
        "Créez automatiquement vos bons de livraison et imprimez-les instantanément.",
    },
    {
      icon: "🏪",
      title: "Multi Stores",
      description:
        "Gérez plusieurs boutiques avec des API indépendantes depuis un seul compte.",
    },
    {
      icon: "🔐",
      title: "API Sécurisée",
      description:
        "Chaque boutique possède sa propre clé API afin de garantir une isolation complète des données.",
    },
  ];

  return (
    <section className="py-24">

      <div className="mx-auto max-w-7xl px-6">

        {/* Title */}

        <div className="mx-auto mb-16 max-w-3xl text-center">

          <h2 className="text-4xl font-bold">
            Pourquoi choisir Casstor Orders ?
          </h2>

          <p className="mt-5 text-lg text-slate-400">
            Une plateforme conçue pour simplifier la gestion
            quotidienne de vos commandes e-commerce.
          </p>

        </div>

        {/* Cards */}

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">

          {features.map((feature) => (

            <div
              key={feature.title}
              className="
                group
                rounded-2xl
                border
                border-slate-800
                bg-slate-900/60
                p-8
                backdrop-blur
                transition-all
                duration-300
                hover:-translate-y-2
                hover:border-cyan-400
                hover:shadow-2xl
                hover:shadow-cyan-500/10
              "
            >

              <div className="mb-5 text-5xl">
                {feature.icon}
              </div>

              <h3 className="text-2xl font-semibold">
                {feature.title}
              </h3>

              <p className="mt-5 leading-7 text-slate-400">
                {feature.description}
              </p>

            </div>

          ))}

        </div>

      </div>

    </section>
  );
}