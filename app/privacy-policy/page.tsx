export default function PrivacyPolicyPage() {
  return (
    <main
      dir="ltr"
      className="min-h-screen bg-white px-6 py-12 text-gray-900"
    >
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-3xl font-bold">
          Politique de confidentialité
        </h1>

        <p className="mb-10 text-sm text-gray-500">
          Dernière mise à jour : 15 août 2026
        </p>

        <section className="space-y-8 leading-8">
          <div>
            <h2 className="mb-3 text-xl font-semibold">
              1. Introduction
            </h2>

            <p>
              Casstor accorde une grande importance à la protection
              de la vie privée de ses utilisateurs. Cette politique
              explique comment nous collectons, utilisons et
              protégeons les informations personnelles dans le cadre
              de nos services.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-semibold">
              2. Informations collectées
            </h2>

            <p>
              Nous pouvons collecter les informations fournies par
              les utilisateurs lors de l'utilisation de nos services,
              notamment le nom, le numéro de téléphone, l'adresse,
              les informations relatives aux commandes et les
              informations nécessaires à la livraison.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-semibold">
              3. Utilisation des informations
            </h2>

            <p>
              Les informations collectées sont utilisées notamment
              pour gérer les commandes, contacter les clients,
              organiser les livraisons, améliorer nos services et
              permettre le fonctionnement des fonctionnalités de
              communication de la plateforme.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-semibold">
              4. WhatsApp
            </h2>

            <p>
              Casstor peut utiliser WhatsApp Business et
              l'API WhatsApp Cloud pour envoyer et recevoir des
              messages liés aux commandes et à la communication
              avec les clients.
            </p>

            <p className="mt-3">
              Les informations WhatsApp sont utilisées uniquement
              dans le cadre des services proposés par la plateforme
              et conformément aux politiques applicables de Meta
              et de WhatsApp.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-semibold">
              5. Protection des données
            </h2>

            <p>
              Nous mettons en place des mesures techniques et
              organisationnelles appropriées afin de protéger les
              informations personnelles contre tout accès,
              modification, utilisation ou divulgation non autorisés.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-semibold">
              6. Partage des informations
            </h2>

            <p>
              Les informations peuvent être partagées avec des
              prestataires nécessaires à la fourniture de nos
              services, notamment les sociétés de livraison et
              les fournisseurs de services de communication,
              uniquement lorsque cela est nécessaire à l'exécution
              des services demandés.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-semibold">
              7. Conservation des données
            </h2>

            <p>
              Nous conservons les informations personnelles pendant
              la durée nécessaire à la fourniture de nos services,
              à la gestion des commandes et au respect de nos
              obligations légales et réglementaires.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-semibold">
              8. Droits des utilisateurs
            </h2>

            <p>
              Les utilisateurs peuvent demander l'accès, la
              rectification ou la suppression de leurs informations
              personnelles, conformément aux lois et réglementations
              applicables.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-semibold">
              9. Nous contacter
            </h2>

            <p>
              Pour toute question concernant cette politique de
              confidentialité ou le traitement de vos données
              personnelles, vous pouvez nous contacter via les
              coordonnées disponibles sur la plateforme Casstor.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-semibold">
              10. Modification de cette politique
            </h2>

            <p>
              Nous pouvons mettre à jour cette politique de
              confidentialité lorsque cela est nécessaire.
              Toute modification sera publiée sur cette page.
            </p>
          </div>
        </section>

        <div className="mt-12 border-t pt-6 text-sm text-gray-500">
          © {new Date().getFullYear()} Casstor. Tous droits réservés.
        </div>
      </div>
    </main>
  );
}