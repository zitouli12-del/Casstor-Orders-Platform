"use client";

import {
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  Package,
  Pencil,
  Plus,
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

type NewVariantValues = {
  color: string;
  size: string;
  quantity: string;
  purchase_price: string;
};

type StockFilter = "all" | "low" | "out";

function getVariantQuantity(variant: StockVariant) {
  return Number(variant.quantity || 0);
}

function isLowStockVariant(variant: StockVariant) {
  const quantity = getVariantQuantity(variant);
  return quantity > 0 && quantity <= 5;
}

function isOutOfStockVariant(variant: StockVariant) {
  return getVariantQuantity(variant) === 0;
}

function getSizeSortRank(size: string) {
  const normalized = size
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  const ranks: Record<string, number> = {
    XXS: 10,
    XS: 20,
    S: 30,
    M: 40,
    L: 50,
    XL: 60,
    "2XL": 70,
    XXL: 70,
    "3XL": 80,
    XXXL: 80,
    "4XL": 90,
    "5XL": 100,
    "6XL": 110,
  };

  if (normalized in ranks) {
    return ranks[normalized];
  }

  const numericSize = Number(normalized);
  if (Number.isFinite(numericSize)) {
    return 1000 + numericSize;
  }

  return 10000;
}

function compareStockVariants(
  first: StockVariant,
  second: StockVariant
) {
  const firstColor = (first.color_key || first.color)
    .trim()
    .toLowerCase();

  const secondColor = (second.color_key || second.color)
    .trim()
    .toLowerCase();

  const colorComparison = firstColor.localeCompare(
    secondColor,
    "fr",
    { sensitivity: "base", numeric: true }
  );

  if (colorComparison !== 0) {
    return colorComparison;
  }

  const sizeRankComparison =
    getSizeSortRank(first.size) -
    getSizeSortRank(second.size);

  if (sizeRankComparison !== 0) {
    return sizeRankComparison;
  }

  return first.size.localeCompare(second.size, "fr", {
    sensitivity: "base",
    numeric: true,
  });
}

export default function StockPage() {
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [variants, setVariants] = useState<StockVariant[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [stockFilter, setStockFilter] =
    useState<StockFilter>("all");

  const [expandedProducts, setExpandedProducts] = useState<number[]>(
    []
  );

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // =========================================================
  // ADD VARIANT
  // =========================================================

  const [addVariantProduct, setAddVariantProduct] =
    useState<StockProduct | null>(null);

  const [newVariantValues, setNewVariantValues] =
    useState<NewVariantValues>({
      color: "",
      size: "",
      quantity: "0",
      purchase_price: "",
    });

  const [newVariantImage, setNewVariantImage] =
    useState<File | null>(null);

  const [isAddingVariant, setIsAddingVariant] =
    useState(false);

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

    return productsWithVariants
      .map((product) => {
        const productMatch =
          !query ||
          product.name.toLowerCase().includes(query);

        const visibleVariants = product.variants
          .filter((variant) => {
            const variantMatch =
              productMatch ||
              variant.color.toLowerCase().includes(query) ||
              variant.size.toLowerCase().includes(query);

            if (!variantMatch) {
              return false;
            }

            if (stockFilter === "low") {
              return isLowStockVariant(variant);
            }

            if (stockFilter === "out") {
              return isOutOfStockVariant(variant);
            }

            return true;
          })
          .sort(compareStockVariants);

        if (visibleVariants.length === 0) {
          return null;
        }

        const visibleQuantity = visibleVariants.reduce(
          (total, variant) =>
            total + getVariantQuantity(variant),
          0
        );

        const visibleValue = visibleVariants.reduce(
          (total, variant) =>
            total +
            getVariantQuantity(variant) *
              Number(variant.purchase_price || 0),
          0
        );

        return {
          ...product,
          variants: visibleVariants,
          totalQuantity: visibleQuantity,
          totalValue: visibleValue,
        };
      })
      .filter(
        (product): product is ProductWithVariants =>
          product !== null
      );
  }, [productsWithVariants, search, stockFilter]);

  // =========================================================
  // STATISTICS
  // =========================================================

  const totalProducts = productsWithVariants.length;

  const totalVariants = variants.length;

  const lowStockVariants = variants.filter(
    isLowStockVariant
  ).length;

  const outOfStockVariants = variants.filter(
    isOutOfStockVariant
  ).length;

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
  // WHATSAPP-COMPATIBLE STOCK IMAGE
  // =========================================================

  async function convertStockImageToJpeg(
    file: File
  ): Promise<File> {
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

    const objectUrl = URL.createObjectURL(file);

    try {
      const image = await new Promise<HTMLImageElement>(
        (resolve, reject) => {
          const img = new Image();

          img.onload = () => resolve(img);

          img.onerror = () =>
            reject(
              new Error(
                "Impossible de lire cette image."
              )
            );

          img.src = objectUrl;
        }
      );

      if (!image.naturalWidth || !image.naturalHeight) {
        throw new Error(
          "Dimensions de l'image invalides."
        );
      }

      const maxDimension = 2400;
      const scale = Math.min(
        1,
        maxDimension /
          Math.max(
            image.naturalWidth,
            image.naturalHeight
          )
      );

      const width = Math.max(
        1,
        Math.round(image.naturalWidth * scale)
      );

      const height = Math.max(
        1,
        Math.round(image.naturalHeight * scale)
      );

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error(
          "Impossible de préparer l'image."
        );
      }

      // JPEG does not support transparency. A white background
      // keeps transparent PNG/WebP images visually clean.
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);

      const jpegBlob = await new Promise<Blob>(
        (resolve, reject) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(
                  new Error(
                    "Impossible de convertir l'image en JPEG."
                  )
                );

                return;
              }

              resolve(blob);
            },
            "image/jpeg",
            0.9
          );
        }
      );

      if (jpegBlob.size > 5 * 1024 * 1024) {
        throw new Error(
          "L'image convertie dépasse 5 MB. Veuillez utiliser une image plus légère."
        );
      }

      const baseName =
        file.name.replace(/\.[^/.]+$/, "") ||
        "stock-image";

      return new File(
        [jpegBlob],
        `${baseName}.jpg`,
        {
          type: "image/jpeg",
          lastModified: Date.now(),
        }
      );
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
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
      // CONVERT TO WHATSAPP-COMPATIBLE JPEG
      // -------------------------------------------------------

      const uploadFile =
        await convertStockImageToJpeg(file);

      // -------------------------------------------------------
      // NEW STORAGE PATH
      // -------------------------------------------------------

      const newPath =
        `${store.id}/${variant.product_id}/${crypto.randomUUID()}.jpg`;

      // -------------------------------------------------------
      // UPLOAD NEW IMAGE
      // -------------------------------------------------------

      const {
        error: uploadError,
      } = await supabase.storage
        .from("stock-images")
        .upload(newPath, uploadFile, {
          cacheControl: "3600",
          contentType: "image/jpeg",
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
  // ADD VARIANT
  // =========================================================

  function openAddVariantModal(product: StockProduct) {
    setAddVariantProduct(product);
    setNewVariantValues({
      color: "",
      size: "",
      quantity: "0",
      purchase_price: "",
    });
    setNewVariantImage(null);
  }

  function closeAddVariantModal() {
    if (isAddingVariant) return;

    setAddVariantProduct(null);
    setNewVariantValues({
      color: "",
      size: "",
      quantity: "0",
      purchase_price: "",
    });
    setNewVariantImage(null);
  }

  async function handleAddVariant() {
    if (!addVariantProduct) return;

    let uploadedPath: string | null = null;

    try {
      setIsAddingVariant(true);

      const color = newVariantValues.color.trim();
      const size = newVariantValues.size.trim();
      const quantity = Number(newVariantValues.quantity);
      const purchasePrice = Number(
        newVariantValues.purchase_price
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

      if (!newVariantImage) {
        throw new Error("La photo est obligatoire.");
      }

      const normalizedColor = normalizeColor(color);

      const duplicateVariant = variants.some((variant) => {
        if (variant.product_id !== addVariantProduct.id) {
          return false;
        }

        const existingColorKey =
          variant.color_key || normalizeColor(variant.color);

        const sameColor = normalizedColor
          ? existingColorKey === normalizedColor
          : variant.color.trim().toLowerCase() ===
            color.toLowerCase();

        const sameSize =
          variant.size.trim().toLowerCase() ===
          size.toLowerCase();

        return sameColor && sameSize;
      });

      if (duplicateVariant) {
        throw new Error(
          "Cette variante existe déjà pour ce modèle."
        );
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        throw new Error("Utilisateur non connecté.");
      }

      const {
        data: store,
        error: storeError,
      } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (storeError) throw storeError;

      if (!store || store.id !== addVariantProduct.store_id) {
        throw new Error(
          "Ce modèle n'appartient pas au magasin actif."
        );
      }

      const uploadFile = await convertStockImageToJpeg(
        newVariantImage
      );

      const filePath =
        `${store.id}/${addVariantProduct.id}/${crypto.randomUUID()}.jpg`;

      uploadedPath = filePath;

      const { error: uploadError } = await supabase.storage
        .from("stock-images")
        .upload(filePath, uploadFile, {
          cacheControl: "3600",
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("stock-images")
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from("stock_variants")
        .insert({
          product_id: addVariantProduct.id,
          color,
          color_key: normalizedColor,
          size,
          image_url: publicUrl,
          quantity,
          purchase_price: purchasePrice,
        });

      if (insertError) throw insertError;

      // From this point the DB row owns the uploaded image.
      // Do not remove it if a later UI refresh ever fails.
      uploadedPath = null;

      setExpandedProducts((current) =>
        current.includes(addVariantProduct.id)
          ? current
          : [...current, addVariantProduct.id]
      );

      setAddVariantProduct(null);
      setNewVariantValues({
        color: "",
        size: "",
        quantity: "0",
        purchase_price: "",
      });
      setNewVariantImage(null);

      await fetchStock();
    } catch (error) {
      if (uploadedPath) {
        await supabase.storage
          .from("stock-images")
          .remove([uploadedPath]);
      }

      console.error("Erreur ajout variante:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Impossible d'ajouter la variante."
      );
    } finally {
      setIsAddingVariant(false);
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

          const uploadFile =
            await convertStockImageToJpeg(file);

          const filePath =
            `${store.id}/${product.id}/${crypto.randomUUID()}.jpg`;

          const {
            error: uploadError,
          } = await supabase.storage
            .from("stock-images")
            .upload(filePath, uploadFile, {
              cacheControl: "3600",
              contentType: "image/jpeg",
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
              {filteredProducts.length} modèle
              {filteredProducts.length !== 1 ? "s" : ""}
              {stockFilter !== "all" || search.trim()
                ? ` affiché${
                    filteredProducts.length !== 1
                      ? "s"
                      : ""
                  }`
                : ""}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setStockFilter("all")}
                className={`inline-flex h-8 items-center rounded-lg border px-3 text-xs font-bold transition-colors ${
                  stockFilter === "all"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Tous
                <span className="ml-1.5 opacity-70">
                  {totalVariants}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStockFilter("low")}
                className={`inline-flex h-8 items-center rounded-lg border px-3 text-xs font-bold transition-colors ${
                  stockFilter === "low"
                    ? "border-amber-300 bg-amber-50 text-amber-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Stock faible
                <span className="ml-1.5 opacity-70">
                  {lowStockVariants}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStockFilter("out")}
                className={`inline-flex h-8 items-center rounded-lg border px-3 text-xs font-bold transition-colors ${
                  stockFilter === "out"
                    ? "border-red-300 bg-red-50 text-red-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Rupture
                <span className="ml-1.5 opacity-70">
                  {outOfStockVariants}
                </span>
              </button>
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
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100"
              />
            </div>
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

              <thead className="sticky top-0 z-30 bg-slate-50">
                <tr className="border-b border-slate-200 bg-slate-50/95 shadow-[0_1px_0_rgba(148,163,184,0.16)]">
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
                        onAddVariant={() =>
                          openAddVariantModal(product)
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
          ADD VARIANT MODAL
      ===================================================== */}

      {addVariantProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAddVariantModal();
            }
          }}
        >
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Ajouter une variante
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {addVariantProduct.name}
                </p>
              </div>

              <button
                type="button"
                onClick={closeAddVariantModal}
                disabled={isAddingVariant}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-50"
                title="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Couleur
                  </span>
                  <input
                    type="text"
                    value={newVariantValues.color}
                    onChange={(event) =>
                      setNewVariantValues((current) => ({
                        ...current,
                        color: event.target.value,
                      }))
                    }
                    placeholder="Ex. Bleu marine"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Taille
                  </span>
                  <input
                    type="text"
                    value={newVariantValues.size}
                    onChange={(event) =>
                      setNewVariantValues((current) => ({
                        ...current,
                        size: event.target.value,
                      }))
                    }
                    placeholder="Ex. 3XL"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Quantité
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={newVariantValues.quantity}
                    onChange={(event) =>
                      setNewVariantValues((current) => ({
                        ...current,
                        quantity: event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Prix d'achat
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newVariantValues.purchase_price}
                      onChange={(event) =>
                        setNewVariantValues((current) => ({
                          ...current,
                          purchase_price: event.target.value,
                        }))
                      }
                      placeholder="0"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 pr-12 text-sm font-semibold text-slate-700 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      DH
                    </span>
                  </div>
                </label>
              </div>

              <label className="block space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Photo
                </span>
                <div className="flex min-h-24 items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-orange-500 shadow-sm ring-1 ring-slate-200">
                    <Camera size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        setNewVariantImage(
                          event.target.files?.[0] || null
                        )
                      }
                      className="block w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-orange-50 file:px-3 file:py-2 file:text-xs file:font-bold file:text-orange-600 hover:file:bg-orange-100"
                    />
                    <p className="mt-2 truncate text-xs text-slate-400">
                      {newVariantImage
                        ? newVariantImage.name
                        : "L'image sera automatiquement convertie en JPEG pour WhatsApp."}
                    </p>
                  </div>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50/70 px-5 py-4">
              <button
                type="button"
                onClick={closeAddVariantModal}
                disabled={isAddingVariant}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleAddVariant}
                disabled={isAddingVariant}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAddingVariant ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Ajout...
                  </>
                ) : (
                  <>
                    <Plus size={17} />
                    Ajouter la variante
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
  onAddVariant,
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
  onAddVariant: () => void;
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

  const outOfStockCount = product.variants.filter(
    isOutOfStockVariant
  ).length;

  const lowStockCount = product.variants.filter(
    isLowStockVariant
  ).length;

  return (
    <>
      {/* =====================================================
          MODEL HEADER
      ===================================================== */}

      <tr className="border-b border-slate-200 bg-white">
        <td colSpan={9} className="p-0">
          <div className="flex w-full items-center gap-3 px-5 py-5">
            <button
              type="button"
              onClick={onToggle}
              className="flex min-w-0 flex-1 items-center gap-5 text-left"
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

                  {outOfStockCount > 0 && (
                    <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600 ring-1 ring-red-100">
                      {outOfStockCount} rupture
                      {outOfStockCount !== 1 ? "s" : ""}
                    </span>
                  )}

                  {lowStockCount > 0 && (
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-100">
                      {lowStockCount} stock faible
                    </span>
                  )}
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
            </button>

            <button
              type="button"
              onClick={onAddVariant}
              className="hidden h-9 shrink-0 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 text-xs font-bold text-orange-600 transition-colors hover:bg-orange-100 sm:inline-flex"
              title="Ajouter une variante"
            >
              <Plus size={16} />
              Ajouter une variante
            </button>

            <button
              type="button"
              onClick={onToggle}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
              title={expanded ? "Fermer" : "Ouvrir"}
            >
              {expanded ? (
                <ChevronDown size={20} />
              ) : (
                <ChevronRight size={20} />
              )}
            </button>
          </div>

          <div className="border-t border-slate-100 px-5 py-2 sm:hidden">
            <button
              type="button"
              onClick={onAddVariant}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 text-xs font-bold text-orange-600 transition-colors hover:bg-orange-100"
            >
              <Plus size={16} />
              Ajouter une variante
            </button>
          </div>
        </td>
      </tr>

      {/* =====================================================
          VARIANTS HEADER
      ===================================================== */}

      {expanded && (
        <tr className="border-b border-slate-200 bg-slate-50">
          <td className="w-14 px-5 py-2" />

          <td className="w-24 px-5 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Photo
          </td>

          <td className="min-w-[190px] px-5 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Modèle
          </td>

          <td className="min-w-[150px] px-5 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Couleur
          </td>

          <td className="min-w-[120px] px-5 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Taille
          </td>

          <td className="min-w-[130px] px-5 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Quantité
          </td>

          <td className="min-w-[150px] px-5 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Prix d'achat
          </td>

          <td className="min-w-[160px] px-5 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Valeur
          </td>

          <td className="w-24 px-5 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Actions
          </td>
        </tr>
      )}

      {/* =====================================================
          VARIANTS
      ===================================================== */}

      {expanded &&
        product.variants.map((variant, variantIndex) => {
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
              className={`border-b border-slate-200 transition-colors hover:bg-orange-50/30 ${
                variantIndex % 2 === 0
                  ? "bg-white"
                  : "bg-slate-50/60"
              }`}
            >
              {/* EMPTY # */}

              <td className="px-5 py-2.5" />

              {/* =================================================
                  PHOTO
              ================================================= */}

              <td className="px-5 py-2.5">
                <label
                  title="Changer la photo"
                  className={`group relative block h-10 w-10 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm ${
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

              <td className="px-5 py-2.5">
                <span className="text-[13px] font-semibold text-slate-500">
                  {product.name}
                </span>
              </td>

              {/* =================================================
                  COULEUR
              ================================================= */}

              <td className="px-5 py-2.5">
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
                    className="h-8 w-full min-w-[120px] rounded-lg border border-orange-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none ring-2 ring-orange-100"
                  />
                ) : (
                  <span className="inline-flex min-h-7 items-center rounded-lg bg-slate-50 px-2.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                    {variant.color}
                  </span>
                )}
              </td>

              {/* =================================================
                  TAILLE
              ================================================= */}

              <td className="px-5 py-2.5">
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
                    className="h-8 w-20 rounded-lg border border-orange-300 bg-white px-3 text-center text-sm font-bold text-slate-700 outline-none ring-2 ring-orange-100"
                  />
                ) : (
                  <span className="inline-flex h-7 min-w-[52px] items-center justify-center rounded-lg bg-slate-50 px-2.5 text-xs font-bold text-slate-800 ring-1 ring-slate-200">
                    {variant.size}
                  </span>
                )}
              </td>

              {/* =================================================
                  QUANTITÉ
              ================================================= */}

              <td className="px-5 py-2.5 text-right">
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
                    className="ml-auto h-8 w-24 rounded-lg border border-orange-300 bg-white px-3 text-right text-sm font-bold text-slate-700 outline-none ring-2 ring-orange-100"
                  />
                ) : isOutOfStockVariant(variant) ? (
                  <span className="inline-flex min-h-7 items-center rounded-lg bg-red-50 px-2.5 text-xs font-bold text-red-700 ring-1 ring-red-200">
                    0 P · Rupture
                  </span>
                ) : isLowStockVariant(variant) ? (
                  <span className="inline-flex min-h-7 items-center rounded-lg bg-amber-50 px-2.5 text-xs font-bold text-amber-700 ring-1 ring-amber-200">
                    {getVariantQuantity(
                      variant
                    ).toLocaleString("fr-FR")} P · Stock faible
                  </span>
                ) : (
                  <span className="text-sm font-bold text-slate-900">
                    {getVariantQuantity(
                      variant
                    ).toLocaleString("fr-FR")} P
                  </span>
                )}
              </td>

              {/* =================================================
                  PRIX D'ACHAT
              ================================================= */}

              <td className="px-5 py-2.5 text-right">
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
                      className="h-8 w-24 rounded-lg border border-orange-300 bg-white px-3 text-right text-sm font-bold text-slate-700 outline-none ring-2 ring-orange-100"
                    />

                    <span className="text-xs font-bold text-slate-400">
                      DH
                    </span>
                  </div>
                ) : (
                  <span className="text-sm font-bold text-slate-900">
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

              <td className="px-5 py-2.5 text-right">
                <span className="text-sm font-bold text-slate-900">
                  {formatMoney(variantValue)}
                </span>
              </td>

              {/* =================================================
                  ACTIONS
              ================================================= */}

              <td className="px-5 py-2.5">
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
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-green-200 bg-green-50 text-green-600 transition-colors hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
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
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-50"
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
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
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
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 bg-white text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
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