import React, { createContext, useContext, useState, useEffect } from "react";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Category, MenuItem } from "@/types";

const DEFAULT_GST_RATE = 18;

interface MenuContextType {
  menuItems: MenuItem[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  gst: number;
}

const MenuContext = createContext<MenuContextType>({
  menuItems: [],
  categories: [],
  loading: true,
  error: null,
  gst: DEFAULT_GST_RATE,
});

export const MenuProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [gst, setGst] = useState<number>(DEFAULT_GST_RATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await getDoc(doc(db, "menuItems", "categories"));
        if (categories.exists()) {
          const data = categories.data().items as Category[];
          setCategories(data);
        } else {
          console.error("No categories found in menuItems document");
          setError("Categories not found");
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Failed to load categories");
      }
    };

    const fetchGST = async () => {
      try {
        const taxDoc = await getDoc(doc(db, "settings", "tax"));
        setGst(taxDoc?.data()?.gst || DEFAULT_GST_RATE);
      } catch (error) {
        setGst(DEFAULT_GST_RATE);
      }
    };
    const menuItemsCollection = collection(db, "menuItems");
    const unsubscribe = onSnapshot(
      menuItemsCollection,
      (snapshot) => {
        try {
          const items = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as MenuItem[];

          setMenuItems(items.filter((item) => item.name && item.price > 0));
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error("Error processing menu items:", err);
          setError("Failed to load menu items");
          setLoading(false);
        }
      },
      (err) => {
        console.error("Error fetching menu items:", err);
        setError("Failed to connect to menu data");
        setLoading(false);
      }
    );

    fetchCategories();
    fetchGST();

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <MenuContext.Provider
      value={{
        menuItems,
        categories,
        loading,
        error,
        gst,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error("useMenu must be used within a MenuProvider");
  }
  return context;
};
