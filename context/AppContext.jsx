"use client";
import axios from "axios";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { applyCategories } from "@/lib/categories";

export const AppContext = createContext();

export const useAppContext = () => {
  return useContext(AppContext);
};

export const AppContextProvider = (props) => {
  const currency = process.env.NEXT_PUBLIC_CURRENCY;
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [user, setUser] = useState(null);

  const [products, setProducts] = useState([]);
  const [userData, setUserData] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [categoriesVersion, setCategoriesVersion] = useState(0);

  const getToken = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session?.access_token || null;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      return;
    }
    router.push("/");
  };

  // Obtener todos los productos disponibles
  const fetchProductData = async () => {
    try {
      const { data } = await axios.get("/api/product/list");

      if (data.success) {
        setProducts(data.products);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

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

  // Obtener datos del usuario actual
  const fetchUserData = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const { data } = await axios.get("/api/user/data", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setUserData(data.user);
        setCartItems(data.user.cartItems || {});
        setIsSeller(data.user.role === "seller");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Agregar producto al carrito
  const addToCart = async (itemId, quantity = 1) => {
    if (!user) {
      return toast("Por Favor Registrarse", { icon: "⚠️" });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return toast.error("La cantidad seleccionada no es válida.");
    }

    let cartData = structuredClone(cartItems);
    const nextQuantity = (cartData[itemId] || 0) + quantity;
    const product = products.find((item) => item._id === itemId);
    const stock = Number(product?.stock || 0);

    if (!product || stock < nextQuantity) {
      return toast.error(stock === 0 ? "Este producto no tiene stock disponible." : `Solo hay ${stock} unidades disponibles.`);
    }
    cartData[itemId] = nextQuantity;
    setCartItems(cartData);

    try {
      const token = await getToken();
      await axios.post(
        "/api/cart/update",
        { cartData },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Agregado al Carrito");
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Actualizar cantidad de un producto en el carrito
  const updateCartQuantity = async (itemId, quantity) => {
    let cartData = structuredClone(cartItems);
    if (quantity === 0) {
      delete cartData[itemId];
    } else {
      cartData[itemId] = quantity;
    }
    setCartItems(cartData);

    try {
      const token = await getToken();
      await axios.post(
        "/api/cart/update",
        { cartData },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Carrito Actualizado");
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Contar número total de productos en el carrito
  const getCartCount = () => {
    let totalCount = 0;
    for (const items in cartItems) {
      if (cartItems[items] > 0) {
        totalCount += cartItems[items];
      }
    }
    return totalCount;
  };

  // Calcular el total del carrito
  const getCartAmount = () => {
    // Si no hay productos aún, devolvemos 0
    if (!products || products.length === 0) {
      console.warn("⚠️ No hay productos cargados aún para calcular el total.");
      return 0;
    }

    let totalAmount = 0;

    // Recorremos los items del carrito
    for (const items in cartItems) {
      const itemInfo = products.find((product) => product._id === items);

      // Si no se encuentra el producto, lo omitimos
      if (!itemInfo) {
        console.warn(`⚠️ Producto no encontrado para el ID: ${items}`);
        continue;
      }

      // Solo calculamos si la cantidad es mayor a 0
      if (cartItems[items] > 0) {
        const price =
          itemInfo.offerPrice !== undefined
            ? itemInfo.offerPrice
            : itemInfo.price || 0;

        totalAmount += price * cartItems[items];
      }
    }

    // Redondeamos el resultado a 2 decimales
    return Math.floor(totalAmount * 100) / 100;
  };

  // Cargar productos al iniciar
  useEffect(() => {
    fetchProductData();
    fetchCategories();
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        toast.error(error.message);
        return;
      }
      if (mounted) setUser(data.session?.user || null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
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
      setCartItems({});
      return;
    }
    fetchUserData();
  }, [user]);

  // Valor global del contexto
  const value = {
    user,
    signOut,
    getToken,
    currency,
    router,
    isSeller,
    setIsSeller,
    userData,
    fetchUserData,
    products,
    fetchProductData,
    fetchCategories,
    categoriesLoaded,
    categoriesVersion,
    cartItems,
    setCartItems,
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
