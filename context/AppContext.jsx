"use client";
import axios from "axios";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { applyCategories } from "@/lib/categories";
import { getCartAmount as calculateCartAmount, getCartCount as calculateCartCount } from "@/lib/cart";

export const AppContext = createContext();

export const useAppContext = () => {
  return useContext(AppContext);
};

export const AppContextProvider = (props) => {
  const currency = process.env.NEXT_PUBLIC_CURRENCY;
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [commerceEnabled, setCommerceEnabled] = useState(false);
  const [commerceSettingsLoading, setCommerceSettingsLoading] = useState(true);
  const [commerceSettingsError, setCommerceSettingsError] = useState("");
  const [userData, setUserData] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const cartItemsRef = useRef(cartItems);
  const persistedCartItemsRef = useRef(cartItems);
  const cartUpdateQueue = useRef(Promise.resolve());
  const [pendingCartUpdates, setPendingCartUpdates] = useState(0);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [categoriesVersion, setCategoriesVersion] = useState(0);

  const getToken = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session?.access_token || null;
  }, [supabase]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      return;
    }
    router.push("/");
  };

  const fetchProductData = useCallback(async () => {
    setProductsLoading(true);
    setProductsError("");
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/product/list", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!data.success) throw new Error(data.message || "No se pudieron cargar los productos.");
      setProducts(data.products);
      return true;
    } catch (error) {
      const message = error.response?.data?.message || error.message || "No se pudieron cargar los productos.";
      setProductsError(message);
      toast.error(message);
      return false;
    } finally {
      setProductsLoading(false);
    }
  }, [getToken]);

  const fetchCommerceSettings = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setCommerceSettingsLoading(true);
    setCommerceSettingsError("");
    try {
      const { data } = await axios.get("/api/commerce-settings", {
        headers: { "Cache-Control": "no-cache" },
      });
      if (!data.success) throw new Error(data.message || "No se pudo cargar la configuración de la tienda.");
      setCommerceEnabled(data.enabled === true);
      return true;
    } catch (error) {
      const message = error.response?.data?.message || error.message || "No se pudo cargar la configuración de la tienda.";
      setCommerceEnabled(false);
      setCommerceSettingsError(message);
      toast.error(message);
      return false;
    } finally {
      setCommerceSettingsLoading(false);
    }
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get("/api/categories");
      if (data.success) {
        applyCategories(data.categories);
        setCategoriesVersion((version) => version + 1);
      }
    } catch (error) {
      console.error("No se pudieron cargar las categorías:", error);
    } finally {
      setCategoriesLoaded(true);
    }
  };

  const fetchUserData = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const { data } = await axios.get("/api/user/data", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setUserData(data.user);
        const nextCartItems = data.user.cartItems || {};
        cartItemsRef.current = nextCartItems;
        persistedCartItemsRef.current = nextCartItems;
        setCartItems(nextCartItems);
        setIsSeller(data.user.role === "seller");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const persistCart = async (nextCartItems, successMessage) => {
    cartItemsRef.current = nextCartItems;
    setCartItems(nextCartItems);
    setPendingCartUpdates((count) => count + 1);

    const request = cartUpdateQueue.current.then(async () => {
      const token = await getToken();
      if (!token) throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");
      const { data } = await axios.post(
        "/api/cart/update",
        { cartData: nextCartItems },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!data.success) throw new Error(data.message || "No se pudo actualizar el carrito.");
      persistedCartItemsRef.current = nextCartItems;
    });
    cartUpdateQueue.current = request.catch(() => undefined);

    try {
      await request;
      toast.success(successMessage);
      return true;
    } catch (error) {
      if (cartItemsRef.current === nextCartItems) {
        cartItemsRef.current = persistedCartItemsRef.current;
        setCartItems(persistedCartItemsRef.current);
      }
      toast.error(error.response?.data?.message || error.message || "No se pudo actualizar el carrito.");
      return false;
    } finally {
      setPendingCartUpdates((count) => Math.max(0, count - 1));
    }
  };

  const addToCart = async (itemId, quantity = 1) => {
    if (!commerceEnabled) {
      return toast.error("El carrito no está disponible en este momento.");
    }
    if (!user) {
      return toast("Por favor inicia sesión", { icon: "⚠️" });
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return toast.error("La cantidad seleccionada no es válida.");
    }

    const currentCart = cartItemsRef.current;
    const cartData = { ...currentCart };
    const nextQuantity = (cartData[itemId] || 0) + quantity;
    const product = products.find((item) => item._id === itemId);
    const stock = Number(product?.stock || 0);

    if (!product || stock < nextQuantity) {
      return toast.error(stock === 0 ? "Este producto no tiene stock disponible." : `Solo hay ${stock} unidades disponibles.`);
    }
    cartData[itemId] = nextQuantity;
    return persistCart(cartData, "Agregado al carrito");
  };

  const updateCartQuantity = async (itemId, quantity) => {
    if (!commerceEnabled) {
      return toast.error("El carrito no está disponible en este momento.");
    }
    if (!user) return toast("Por favor inicia sesión", { icon: "⚠️" });
    if (!Number.isInteger(quantity) || quantity < 0) {
      return toast.error("La cantidad seleccionada no es válida.");
    }

    const currentCart = cartItemsRef.current;
    const product = products.find((item) => item._id === itemId);
    if (quantity > 0 && (!product || quantity > Number(product.stock || 0))) {
      return toast.error("La cantidad supera el stock disponible.");
    }

    const cartData = { ...currentCart };
    if (quantity === 0) delete cartData[itemId];
    else cartData[itemId] = quantity;
    if (cartData[itemId] === currentCart[itemId]) return;

    return persistCart(cartData, "Carrito actualizado");
  };

  const getCartCount = () => calculateCartCount(cartItems);

  const getCartAmount = () => {
    if (!products.length) {
      console.warn("⚠️ No hay productos cargados aún para calcular el total.");
      return 0;
    }
    return calculateCartAmount(cartItems, products);
  };

  const clearCart = () => {
    cartItemsRef.current = {};
    persistedCartItemsRef.current = {};
    setCartItems({});
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(fetchCommerceSettings, 0);
    return () => clearTimeout(timeout);
  }, [fetchCommerceSettings]);

  useEffect(() => {
    if (authLoading || commerceSettingsLoading) return undefined;
    const timeout = setTimeout(fetchProductData, 0);
    return () => clearTimeout(timeout);
  }, [authLoading, commerceEnabled, commerceSettingsLoading, fetchProductData, user]);

  useEffect(() => {
    if (commerceSettingsLoading) return undefined;
    const refresh = () => fetchCommerceSettings({ silent: true });
    const interval = setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [commerceSettingsLoading, fetchCommerceSettings]);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        toast.error(error.message);
        if (mounted) setAuthLoading(false);
        return;
      }
      if (mounted) {
        setUser(data.session?.user || null);
        setAuthLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!user) {
      setIsSeller(false);
      setUserData(false);
      cartItemsRef.current = {};
      persistedCartItemsRef.current = {};
      setCartItems({});
      return;
    }
    fetchUserData();
  }, [user]);

  const value = {
    user,
    authLoading,
    signOut,
    getToken,
    currency,
    router,
    isSeller,
    setIsSeller,
    userData,
    fetchUserData,
    products,
    productsLoading,
    productsError,
    fetchProductData,
    commerceEnabled,
    commerceSettingsLoading,
    commerceSettingsError,
    fetchCommerceSettings,
    fetchCategories,
    categoriesLoaded,
    categoriesVersion,
    cartItems,
    cartSaving: pendingCartUpdates > 0,
    clearCart,
    addToCart,
    updateCartQuantity,
    getCartCount,
    getCartAmount,
  };

  return (
    <AppContext.Provider value={value}>
      {props.children}
    </AppContext.Provider>
  );
};
