import React, { createContext, useContext, useState, useEffect } from "react";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Category, MenuItem } from "@/types";

interface MenuContextType {
  menuItems: MenuItem[];
  categories: Category[];
  loading: boolean;
}

const MenuContext = createContext<MenuContextType>({
  menuItems: [],
  categories: [],
  loading: true,
});

export const MenuProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const categories = await getDoc(doc(db, "menuItems", "categories"));
      if (categories.exists()) {
        const data = categories.data().items as Category[];
        setCategories(data);
      } else {
        console.error("No categories found in menuItems document");
      }
    };

    const menuItemsCollection = collection(db, "menuItems");
    const unsubscribe = onSnapshot(menuItemsCollection, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as MenuItem[];
      console.log({ items });

      setMenuItems(items.filter((item) => item.isAvailable));
      setLoading(false);
    });

    fetchCategories();

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
