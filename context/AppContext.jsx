"use client";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

export const AppContext = createContext();

export const useAppContext = () => {
  return useContext(AppContext);
};

export const AppContextProvider = (props) => {
  const currency = process.env.NEXT_PUBLIC_CURRENCY;
  const router = useRouter();

  const { user } = useUser();
  const { getToken } = useAuth();

  const [products, setProducts] = useState([]);
  const [userData, setUserData] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [cartItems, setCartItems] = useState({});

  // 🔹 Obtener todos los productos disponibles
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

  // 🔹 Obtener datos del usuario actual
  const fetchUserData = async () => {
    try {
      if (user?.publicMetadata?.role === "seller") {
        setIsSeller(true);
      }

      const token = await getToken();

      const { data } = await axios.get("/api/user/data", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setUserData(data.user);
        setCartItems(data.user.cartItems || {});
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // 🔹 Agregar producto al carrito
  const addToCart = async (itemId) => {
    if (!user) {
      return toast("Por Favor Registrarse", { icon: "⚠️" });
    }

    let cartData = structuredClone(cartItems);
    if (cartData[itemId]) {
      cartData[itemId] += 1;
    } else {
      cartData[itemId] = 1;
    }
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

  // 🔹 Actualizar cantidad de un producto en el carrito
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

  // 🔹 Contar número total de productos en el carrito
  const getCartCount = () => {
    let totalCount = 0;
    for (const items in cartItems) {
      if (cartItems[items] > 0) {
        totalCount += cartItems[items];
      }
    }
    return totalCount;
  };

  // 🔹 Calcular el total del carrito (corregido)
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

  // 🔹 Cargar productos al iniciar
  useEffect(() => {
    fetchProductData();
  }, []);

  // 🔹 Manejar sesión de usuario
  useEffect(() => {
    if (user) {
      fetchUserData();
    } else {
      // Cuando no hay usuario, limpiar datos
      setIsSeller(false);
      setUserData(false);
      setCartItems({});
    }
  }, [user]);

  // 🔹 Valor global del contexto
  const value = {
    user,
    getToken,
    currency,
    router,
    isSeller,
    setIsSeller,
    userData,
    fetchUserData,
    products,
    fetchProductData,
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
