"use client";

import {
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  Package,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/src/lib/supabase";
import { normalizeColor } from "@/src/lib/colors";

import AddStockProductModal, {
  StockVariantForm,
} from "@/src/components/stock/AddStockProductModal";

type StockProduct = {
  id: number;
  store_id: number;
  name: string;
  created_at: string;
};

type StockVariant = {
  id: number;
  product_id: number;
  color: string;
  color_key: string | null;
  size: string;
  image_url: string;
  quantity: number;
  purchase_price: number;
  created_at: string;
  updated_at: string;
};

type ProductWithVariants = StockProduct & {
  variants: StockVariant[];
  totalQuantity: number;
  totalValue: number;
};

type EditingValues = {
  color: string;
  size: string;
  quantity: string;
  purchase_price: string;
};

export default function StockPage() {
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [variants, setVariants] = useState<StockVariant[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [expandedProducts, setExpandedProducts] = useState<number[]>(
    []
  );

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // =========================================================
  // VARIANT EDITING
  // =========================================================

  const [editingVariantId, setEditingVariantId] = useState<
    number | null
  >(null);

  const [editingValues, setEditingValues] =
    useState<EditingValues>({
      color: "",
      size: "",
      quantity: "",
      purchase_price: "",
    });

  const [savingVariantId, setSavingVariantId] =
    useState<number | null>(null);

  const [deletingVariantId, setDeletingVariantId] =
    useState<number | null>(null);

  // =========================================================
  // IMAGE EDITING
  // =========================================================

  const [changingImageVariantId, setChangingImageVariantId] =
    useState<number | null>(null);

  // =========================================================
  // LOAD STOCK
  // =========================================================

  useEffect(() => {
    fetchStock();
  }, []);

  async function fetchStock() {
    try {
      setLoading(true);

      const {
        data: productsData,
        error: productsError,
      } = await supabase
        .from("stock_products")
        .select("*")
        .order("created_at", { ascending: false });

      if (productsError) throw productsError;

      const {
        data: variantsData,
        error: variantsError,
      } = await supabase
        .from("stock_variants")
        .select("*")
        .order("created_at", { ascending: true });

      if (variantsError) throw variantsError;

      setProducts(productsData || []);
      setVariants(variantsData || []);
    } catch (error) {
      console.error("Erreur chargement stock:", error);
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // PRODUCTS + VARIANTS
  // =========================================================

  const productsWithVariants =
    useMemo<ProductWithVariants[]>(() => {
      return products.map((product) => {
        const productVariants = variants.filter(
          (variant) => variant.product_id === product.id
        );

        const totalQuantity = productVariants.reduce(
          (total, variant) =>
            total + Number(variant.quantity || 0),
          0
        );

        const totalValue = productVariants.reduce(
          (total, variant) =>
            total +
            Number(variant.quantity || 0) *
              Number(variant.purchase_price || 0),
          0
        );

        return {
          ...product,
          variants: productVariants,
          totalQuantity,
          totalValue,
        };
      });
    }, [products, variants]);

  // =========================================================
  // SEARCH
  // =========================================================

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return productsWithVariants;
    }

    return productsWithVariants.filter((product) => {
      const productMatch = product.name
        .toLowerCase()
        .includes(query);

      const variantMatch = product.variants.some(
        (variant) =>
          variant.color.toLowerCase().includes(query) ||
          variant.size.toLowerCase().includes(query)
      );

      return productMatch || variantMatch;
    });
  }, [productsWithVariants, search]);

  // =========================================================
  // STATISTICS
  // =========================================================

  const totalProducts = productsWithVariants.length;

  const totalVariants = variants.length;

  const totalQuantity = productsWithVariants.reduce(
    (total, product) => total + product.totalQuantity,
    0
  );

  const totalValue = productsWithVariants.reduce(
    (total, product) => total + product.totalValue,
    0
  );

  // =========================================================
  // HELPERS
  // =========================================================

  function toggleProduct(productId: number) {
    setExpandedProducts((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    );
  }

  function formatMoney(value: number) {
    return `${value.toLocaleString("fr-FR")} DH`;
  }

  // =========================================================
  // START EDIT
  // =========================================================

  function startEditVariant(variant: StockVariant) {
    setEditingVariantId(variant.id);

    setEditingValues({
      color: variant.color,
      size: variant.size,
      quantity: String(variant.quantity),
      purchase_price: String(variant.purchase_price),
    });
  }

  // =========================================================
  // CANCEL EDIT
  // =========================================================

  function cancelEditVariant() {
    setEditingVariantId(null);

    setEditingValues({
      color: "",
      size: "",
      quantity: "",
      purchase_price: "",
    });
  }

  // =========================================================
  // SAVE VARIANT
  // =========================================================

  async function saveVariant(variantId: number) {
    try {
      setSavingVariantId(variantId);

      const color = editingValues.color.trim();
      const size = editingValues.size.trim();

      const quantity = Number(editingValues.quantity);

      const purchasePrice = Number(
        editingValues.purchase_price
      );

      if (!color) {
        throw new Error("La couleur est obligatoire.");
      }

      if (!size) {
        throw new Error("La taille est obligatoire.");
      }

      if (!Number.isInteger(quantity) || quantity < 0) {
        throw new Error(
          "La quantité doit être un nombre entier supérieur ou égal à 0."
        );
      }

      if (!Number.isFinite(purchasePrice) || purchasePrice < 0) {
        throw new Error("Le prix d'achat est invalide.");
      }

      const { error } = await supabase
        .from("stock_variants")
        .update({
          color,
          color_key: normalizeColor(color),
          size,
          quantity,
          purchase_price: purchasePrice,
          updated_at: new Date().toISOString(),
        })
        .eq("id", variantId);

      if (error) throw error;

      cancelEditVariant();

      await fetchStock();
    } catch (error) {
      console.error(
        "Erreur modification variant:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de la modification."
      );
    } finally {
      setSavingVariantId(null);
    }
  }

  // =========================================================
  // STORAGE IMAGE PATH
  // =========================================================

  function getStockImagePath(imageUrl: string) {
    const marker =
      "/storage/v1/object/public/stock-images/";

    const index = imageUrl.indexOf(marker);

    if (index === -1) {
      return null;
    }

    return decodeURIComponent(
      imageUrl.slice(index + marker.length)
    );
  }

  // =========================================================
  // CHANGE VARIANT IMAGE
  // =========================================================

  async function changeVariantImage(
    variant: StockVariant,
    file: File
  ) {
    try {
      setChangingImageVariantId(variant.id);

      // -------------------------------------------------------
      // VALIDATION
      // -------------------------------------------------------

      if (!file.type.startsWith("image/")) {
        throw new Error(
          "Veuillez sélectionner une image valide."
        );
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error(
          "L'image ne doit pas dépasser 5 MB."
        );
      }

      // -------------------------------------------------------
      // CURRENT USER
      // -------------------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        throw new Error("Utilisateur non connecté.");
      }

      // -------------------------------------------------------
      // STORE
      // -------------------------------------------------------

      const {
        data: store,
        error: storeError,
      } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (storeError) throw storeError;

      if (!store) {
        throw new Error(
          "Aucun magasin trouvé pour cet utilisateur."
        );
      }

      // -------------------------------------------------------
      // FILE EXTENSION
      // -------------------------------------------------------

      const extension =
        file.name
          .split(".")
          .pop()
          ?.toLowerCase() || "jpg";

      // -------------------------------------------------------
      // NEW STORAGE PATH
      // -------------------------------------------------------

      const newPath =
        `${store.id}/${variant.product_id}/${crypto.randomUUID()}.${extension}`;

      // -------------------------------------------------------
      // UPLOAD NEW IMAGE
      // -------------------------------------------------------

      const {
        error: uploadError,
      } = await supabase.storage
        .from("stock-images")
        .upload(newPath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // -------------------------------------------------------
      // PUBLIC URL
      // -------------------------------------------------------

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("stock-images")
        .getPublicUrl(newPath);

      // -------------------------------------------------------
      // UPDATE DATABASE
      // -------------------------------------------------------

      const {
        error: updateError,
      } = await supabase
        .from("stock_variants")
        .update({
          image_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", variant.id);

      // -------------------------------------------------------
      // IF DB UPDATE FAILED
      // DELETE NEW IMAGE
      // -------------------------------------------------------

      if (updateError) {
        await supabase.storage
          .from("stock-images")
          .remove([newPath]);

        throw updateError;
      }

      // -------------------------------------------------------
      // DELETE OLD IMAGE
      // -------------------------------------------------------

      if (variant.image_url) {
        const oldPath = getStockImagePath(
          variant.image_url
        );

        if (oldPath) {
          const {
            error: deleteOldError,
          } = await supabase.storage
            .from("stock-images")
            .remove([oldPath]);

          if (deleteOldError) {
            console.warn(
              "Nouvelle image enregistrée, mais l'ancienne image n'a pas pu être supprimée:",
              deleteOldError
            );
          }
        }
      }

      // -------------------------------------------------------
      // REFRESH STOCK
      // -------------------------------------------------------

      await fetchStock();
    } catch (error) {
      console.error(
        "Erreur changement image:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Impossible de modifier l'image."
      );
    } finally {
      setChangingImageVariantId(null);
    }
  }

  // =========================================================
  // DELETE VARIANT
  // =========================================================

  async function deleteVariant(variant: StockVariant) {
    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer la variante "${variant.color} / ${variant.size}" ?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingVariantId(variant.id);

      // -------------------------------------------------------
      // DELETE DB ROW
      // -------------------------------------------------------

      const { error } = await supabase
        .from("stock_variants")
        .delete()
        .eq("id", variant.id);

      if (error) throw error;

      // -------------------------------------------------------
      // DELETE IMAGE FROM STORAGE
      // -------------------------------------------------------

      if (variant.image_url) {
        const imagePath = getStockImagePath(
          variant.image_url
        );

        if (imagePath) {
          const {
            error: storageError,
          } = await supabase.storage
            .from("stock-images")
            .remove([imagePath]);

          if (storageError) {
            console.warn(
              "Variant supprimée, mais l'image n'a pas pu être supprimée:",
              storageError
            );
          }
        }
      }

      if (editingVariantId === variant.id) {
        cancelEditVariant();
      }

      await fetchStock();
    } catch (error) {
      console.error(
        "Erreur suppression variant:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de la suppression."
      );
    } finally {
      setDeletingVariantId(null);
    }
  }

  // =========================================================
  // ADD PRODUCT
  // =========================================================

  async function handleAddProduct(
    name: string,
    variants: StockVariantForm[]
  ) {
    try {
      setIsAdding(true);

      // -------------------------------------------------------
      // CURRENT USER
      // -------------------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        throw new Error("Utilisateur non connecté.");
      }

      // -------------------------------------------------------
      // STORE
      // -------------------------------------------------------

      const {
        data: store,
        error: storeError,
      } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (storeError) throw storeError;

      if (!store) {
        throw new Error(
          "Aucun magasin trouvé pour cet utilisateur."
        );
      }

      // -------------------------------------------------------
      // CREATE PRODUCT
      // -------------------------------------------------------

      const {
        data: product,
        error: productError,
      } = await supabase
        .from("stock_products")
        .insert({
          store_id: store.id,
          name: name.trim(),
        })
        .select(
          "id, store_id, name, created_at"
        )
        .single();

      if (productError) throw productError;

      if (!product) {
        throw new Error(
          "Impossible de créer le modèle."
        );
      }

      const uploadedPaths: string[] = [];

      const variantRows: {
        product_id: number;
        color: string;
        color_key: string | null;
        size: string;
        image_url: string;
        quantity: number;
        purchase_price: number;
      }[] = [];

      try {
        // -----------------------------------------------------
        // UPLOAD IMAGES
        // -----------------------------------------------------

        for (const variant of variants) {
          if (!variant.imageFile) {
            throw new Error(
              `La photo est obligatoire pour ${variant.color} ${variant.size}.`
            );
          }

          const file = variant.imageFile;

          const extension =
            file.name
              .split(".")
              .pop()
              ?.toLowerCase() || "jpg";

          const filePath =
            `${store.id}/${product.id}/${crypto.randomUUID()}.${extension}`;

          const {
            error: uploadError,
          } = await supabase.storage
            .from("stock-images")
            .upload(filePath, file, {
              cacheControl: "3600",
              upsert: false,
            });

          if (uploadError) {
            throw uploadError;
          }

          uploadedPaths.push(filePath);

          const {
            data: { publicUrl },
          } = supabase.storage
            .from("stock-images")
            .getPublicUrl(filePath);

          const normalizedColor = normalizeColor(
            variant.color
          );

          variantRows.push({
            product_id: product.id,
            color: variant.color.trim(),
            color_key: normalizedColor,
            size: variant.size.trim(),
            image_url: publicUrl,
            quantity:
              Number(variant.quantity) || 0,
            purchase_price:
              Number(variant.purchase_price) || 0,
          });
        }

        // -----------------------------------------------------
        // INSERT VARIANTS
        // -----------------------------------------------------

        const {
          error: variantsError,
        } = await supabase
          .from("stock_variants")
          .insert(variantRows);

        if (variantsError) {
          throw variantsError;
        }

        // -----------------------------------------------------
        // CLOSE MODAL
        // -----------------------------------------------------

        setIsAddModalOpen(false);

        // -----------------------------------------------------
        // REFRESH
        // -----------------------------------------------------

        await fetchStock();
      } catch (innerError) {
        // -----------------------------------------------------
        // CLEANUP UPLOADED IMAGES
        // -----------------------------------------------------

        if (uploadedPaths.length > 0) {
          await supabase.storage
            .from("stock-images")
            .remove(uploadedPaths);
        }

        // -----------------------------------------------------
        // CLEANUP PRODUCT
        // -----------------------------------------------------

        await supabase
          .from("stock_products")
          .delete()
          .eq("id", product.id);

        throw innerError;
      }
    } catch (error) {
      console.error(
        "Erreur lors de l'ajout du modèle:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue."
      );
    } finally {
      setIsAdding(false);
    }
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="space-y-6">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Stock
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Gérez votre stock et suivez sa valeur.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600"
        >
          <Package size={18} />
          Ajouter un modèle
        </button>
      </div>

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Modèles"
          value={totalProducts.toLocaleString("fr-FR")}
          description="Produits en stock"
        />

        <StatCard
          title="Variantes"
          value={totalVariants.toLocaleString("fr-FR")}
          description="Couleur + taille"
        />

        <StatCard
          title="Quantité totale"
          value={`${totalQuantity.toLocaleString(
            "fr-FR"
          )} P`}
          description="Pièces disponibles"
        />

        <StatCard
          title="Valeur du stock"
          value={formatMoney(totalValue)}
          description="Prix d'achat"
        />
      </div>

      {/* =====================================================
          INVENTAIRE
      ===================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* SEARCH */}

        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Inventaire
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              {totalProducts} modèle
              {totalProducts !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Rechercher modèle, couleur, taille..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>

        {/* LOADING */}

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <div className="text-sm font-medium text-slate-500">
              Chargement du stock...
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Package
                size={24}
                className="text-slate-400"
              />
            </div>

            <p className="text-sm font-semibold text-slate-700">
              Aucun stock
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Ajoutez votre premier modèle pour commencer.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px] text-left">
              {/* =================================================
                  TABLE HEADER
              ================================================= */}

              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90">
                  <th className="w-14 px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                    #
                  </th>

                  <th className="w-24 px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                    Photo
                  </th>

                  <th className="min-w-[190px] px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                    Modèle
                  </th>

                  <th className="min-w-[150px] px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                    Couleur
                  </th>

                  <th className="min-w-[120px] px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                    Taille
                  </th>

                  <th className="min-w-[130px] px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                    Quantité
                  </th>

                  <th className="min-w-[150px] px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                    Prix d'achat
                  </th>

                  <th className="min-w-[160px] px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                    Valeur
                  </th>

                  <th className="w-24 px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>

              {/* =================================================
                  TABLE BODY
              ================================================= */}

              <tbody>
                {filteredProducts.map(
                  (product, index) => {
                    const expanded =
                      expandedProducts.includes(
                        product.id
                      );

                    return (
                      <ProductRows
                        key={product.id}
                        product={product}
                        index={index}
                        expanded={expanded}
                        onToggle={() =>
                          toggleProduct(product.id)
                        }
                        formatMoney={formatMoney}
                        editingVariantId={
                          editingVariantId
                        }
                        editingValues={
                          editingValues
                        }
                        setEditingValues={
                          setEditingValues
                        }
                        savingVariantId={
                          savingVariantId
                        }
                        deletingVariantId={
                          deletingVariantId
                        }
                        changingImageVariantId={
                          changingImageVariantId
                        }
                        onStartEdit={
                          startEditVariant
                        }
                        onCancelEdit={
                          cancelEditVariant
                        }
                        onSaveVariant={
                          saveVariant
                        }
                        onDeleteVariant={
                          deleteVariant
                        }
                        onChangeImage={
                          changeVariantImage
                        }
                      />
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =====================================================
          ADD PRODUCT MODAL
      ===================================================== */}

      <AddStockProductModal
        isOpen={isAddModalOpen}
        onClose={() =>
          setIsAddModalOpen(false)
        }
        onAdd={handleAddProduct}
        isAdding={isAdding}
      />
    </div>
  );
}

/* ===========================================================
   PRODUCT ROWS
=========================================================== */

function ProductRows({
  product,
  index,
  expanded,
  onToggle,
  formatMoney,
  editingVariantId,
  editingValues,
  setEditingValues,
  savingVariantId,
  deletingVariantId,
  changingImageVariantId,
  onStartEdit,
  onCancelEdit,
  onSaveVariant,
  onDeleteVariant,
  onChangeImage,
}: {
  product: ProductWithVariants;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  formatMoney: (value: number) => string;

  editingVariantId: number | null;

  editingValues: EditingValues;

  setEditingValues: React.Dispatch<
    React.SetStateAction<EditingValues>
  >;

  savingVariantId: number | null;
  deletingVariantId: number | null;
  changingImageVariantId: number | null;

  onStartEdit: (variant: StockVariant) => void;
  onCancelEdit: () => void;
  onSaveVariant: (variantId: number) => void;
  onDeleteVariant: (variant: StockVariant) => void;

  onChangeImage: (
    variant: StockVariant,
    file: File
  ) => void;
}) {
  const firstVariant = product.variants[0];

  return (
    <>
      {/* =====================================================
          MODEL HEADER
      ===================================================== */}

      <tr className="border-b border-slate-200 bg-white">
        <td colSpan={9} className="p-0">
          <button
            type="button"
            onClick={onToggle}
            className="flex w-full items-center gap-5 px-5 py-5 text-left transition-colors hover:bg-orange-50/40"
          >
            {/* # */}

            <div className="w-8 shrink-0 text-sm font-semibold text-slate-400">
              {index + 1}
            </div>

            {/* PHOTO */}

            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {firstVariant?.image_url ? (
                <img
                  src={firstVariant.image_url}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-orange-50 text-orange-500">
                  <Package size={22} />
                </div>
              )}
            </div>

            {/* MODEL */}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-base font-bold text-slate-900">
                  {product.name}
                </p>

                <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600">
                  {product.variants.length} variante
                  {product.variants.length !== 1
                    ? "s"
                    : ""}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                <span className="text-slate-500">
                  Quantité totale :
                  <strong className="ml-1.5 font-bold text-slate-900">
                    {product.totalQuantity.toLocaleString(
                      "fr-FR"
                    )}{" "}
                    P
                  </strong>
                </span>

                <span className="text-slate-500">
                  Valeur totale :
                  <strong className="ml-1.5 font-bold text-slate-900">
                    {formatMoney(
                      product.totalValue
                    )}
                  </strong>
                </span>
              </div>
            </div>

            {/* EXPAND */}

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition-colors">
              {expanded ? (
                <ChevronDown size={20} />
              ) : (
                <ChevronRight size={20} />
              )}
            </div>
          </button>
        </td>
      </tr>

      {/* =====================================================
          VARIANTS HEADER
      ===================================================== */}

      {expanded && (
        <tr className="border-b border-slate-200 bg-slate-50">
          <td className="w-14 px-5 py-3" />

          <td className="w-24 px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Photo
          </td>

          <td className="min-w-[190px] px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Modèle
          </td>

          <td className="min-w-[150px] px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Couleur
          </td>

          <td className="min-w-[120px] px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Taille
          </td>

          <td className="min-w-[130px] px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Quantité
          </td>

          <td className="min-w-[150px] px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Prix d'achat
          </td>

          <td className="min-w-[160px] px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Valeur
          </td>

          <td className="w-24 px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Actions
          </td>
        </tr>
      )}

      {/* =====================================================
          VARIANTS
      ===================================================== */}

      {expanded &&
        product.variants.map((variant) => {
          const isEditing =
            editingVariantId === variant.id;

          const isChangingImage =
            changingImageVariantId === variant.id;

          const variantValue =
            Number(variant.quantity || 0) *
            Number(variant.purchase_price || 0);

          return (
            <tr
              key={variant.id}
              className="border-b border-slate-100 bg-white transition-colors hover:bg-slate-50"
            >
              {/* EMPTY # */}

              <td className="px-5 py-5" />

              {/* =================================================
                  PHOTO
              ================================================= */}

              <td className="px-5 py-5">
                <label
                  title="Changer la photo"
                  className={`group relative block h-14 w-14 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${
                    isChangingImage
                      ? "cursor-wait"
                      : "cursor-pointer"
                  }`}
                  onClick={(event) => {
                    event.stopPropagation();
                  }}
                >
                  {/* IMAGE */}

                  {variant.image_url ? (
                    <img
                      src={variant.image_url}
                      alt={`${product.name} ${variant.color} ${variant.size}`}
                      className={`h-full w-full object-cover transition-transform duration-200 ${
                        !isChangingImage
                          ? "group-hover:scale-105"
                          : ""
                      }`}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-300">
                      <Package size={18} />
                    </div>
                  )}

                  {/* HOVER OVERLAY */}

                  {!isChangingImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <Camera
                        size={19}
                        className="text-white"
                      />
                    </div>
                  )}

                  {/* LOADING */}

                  {isChangingImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/55">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    </div>
                  )}

                  {/* FILE INPUT */}

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isChangingImage}
                    onChange={(event) => {
                      event.stopPropagation();

                      const file =
                        event.target.files?.[0];

                      if (!file) {
                        return;
                      }

                      onChangeImage(
                        variant,
                        file
                      );

                      // Allow selecting
                      // the same image again
                      event.currentTarget.value =
                        "";
                    }}
                  />
                </label>
              </td>

              {/* =================================================
                  MODEL
              ================================================= */}

              <td className="px-5 py-5">
                <span className="text-sm font-semibold text-slate-500">
                  {product.name}
                </span>
              </td>

              {/* =================================================
                  COULEUR
              ================================================= */}

              <td className="px-5 py-5">
                {isEditing ? (
                  <input
                    type="text"
                    value={editingValues.color}
                    onChange={(event) =>
                      setEditingValues(
                        (current) => ({
                          ...current,
                          color: event.target.value,
                        })
                      )
                    }
                    onClick={(event) =>
                      event.stopPropagation()
                    }
                    className="h-10 w-full min-w-[120px] rounded-xl border border-orange-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none ring-2 ring-orange-100"
                  />
                ) : (
                  <span className="inline-flex min-h-9 items-center rounded-xl bg-slate-50 px-3.5 text-sm font-bold text-slate-700 ring-1 ring-slate-200">
                    {variant.color}
                  </span>
                )}
              </td>

              {/* =================================================
                  TAILLE
              ================================================= */}

              <td className="px-5 py-5">
                {isEditing ? (
                  <input
                    type="text"
                    value={editingValues.size}
                    onChange={(event) =>
                      setEditingValues(
                        (current) => ({
                          ...current,
                          size: event.target.value,
                        })
                      )
                    }
                    onClick={(event) =>
                      event.stopPropagation()
                    }
                    className="h-10 w-24 rounded-xl border border-orange-300 bg-white px-3 text-center text-sm font-bold text-slate-700 outline-none ring-2 ring-orange-100"
                  />
                ) : (
                  <span className="inline-flex h-9 min-w-[58px] items-center justify-center rounded-xl bg-slate-50 px-3 text-sm font-bold text-slate-800 ring-1 ring-slate-200">
                    {variant.size}
                  </span>
                )}
              </td>

              {/* =================================================
                  QUANTITÉ
              ================================================= */}

              <td className="px-5 py-5 text-right">
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editingValues.quantity}
                    onChange={(event) =>
                      setEditingValues(
                        (current) => ({
                          ...current,
                          quantity:
                            event.target.value,
                        })
                      )
                    }
                    onClick={(event) =>
                      event.stopPropagation()
                    }
                    className="ml-auto h-10 w-28 rounded-xl border border-orange-300 bg-white px-3 text-right text-sm font-bold text-slate-700 outline-none ring-2 ring-orange-100"
                  />
                ) : (
                  <span className="text-[15px] font-bold text-slate-900">
                    {Number(
                      variant.quantity || 0
                    ).toLocaleString("fr-FR")}{" "}
                    P
                  </span>
                )}
              </td>

              {/* =================================================
                  PRIX D'ACHAT
              ================================================= */}

              <td className="px-5 py-5 text-right">
                {isEditing ? (
                  <div className="flex items-center justify-end gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        editingValues.purchase_price
                      }
                      onChange={(event) =>
                        setEditingValues(
                          (current) => ({
                            ...current,
                            purchase_price:
                              event.target.value,
                          })
                        )
                      }
                      onClick={(event) =>
                        event.stopPropagation()
                      }
                      className="h-10 w-28 rounded-xl border border-orange-300 bg-white px-3 text-right text-sm font-bold text-slate-700 outline-none ring-2 ring-orange-100"
                    />

                    <span className="text-xs font-bold text-slate-400">
                      DH
                    </span>
                  </div>
                ) : (
                  <span className="text-[15px] font-bold text-slate-900">
                    {formatMoney(
                      Number(
                        variant.purchase_price || 0
                      )
                    )}
                  </span>
                )}
              </td>

              {/* =================================================
                  VALEUR
              ================================================= */}

              <td className="px-5 py-5 text-right">
                <span className="text-[15px] font-bold text-slate-900">
                  {formatMoney(variantValue)}
                </span>
              </td>

              {/* =================================================
                  ACTIONS
              ================================================= */}

              <td className="px-5 py-5">
                <div className="flex items-center justify-end gap-2">
                  {isEditing ? (
                    <>
                      {/* SAVE */}

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();

                          onSaveVariant(
                            variant.id
                          );
                        }}
                        disabled={
                          savingVariantId ===
                          variant.id
                        }
                        title="Enregistrer"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-green-200 bg-green-50 text-green-600 transition-colors hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingVariantId ===
                        variant.id ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-green-300 border-t-green-600" />
                        ) : (
                          <Check size={17} />
                        )}
                      </button>

                      {/* CANCEL */}

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();

                          onCancelEdit();
                        }}
                        disabled={
                          savingVariantId ===
                          variant.id
                        }
                        title="Annuler"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-50"
                      >
                        <X size={17} />
                      </button>
                    </>
                  ) : (
                    <>
                      {/* EDIT */}

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();

                          onStartEdit(
                            variant
                          );
                        }}
                        disabled={
                          deletingVariantId ===
                          variant.id ||
                          changingImageVariantId ===
                            variant.id
                        }
                        title="Modifier"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Pencil size={16} />
                      </button>

                      {/* DELETE */}

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();

                          onDeleteVariant(
                            variant
                          );
                        }}
                        disabled={
                          deletingVariantId ===
                            variant.id ||
                          changingImageVariantId ===
                            variant.id
                        }
                        title="Supprimer"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-white text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingVariantId ===
                        variant.id ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-500" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
    </>
  );
}

/* ===========================================================
   STAT CARD
=========================================================== */

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}