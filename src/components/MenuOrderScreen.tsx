import React, { useEffect, useState } from "react";
import { collection, addDoc, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OrderItem, Table, MenuItem, Order } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useMenu } from "@/contexts/MenuContext";
import Layout from "./Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Minus, ShoppingCart, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BillGenerationModal from "./BillGenerationModal";

interface MenuOrderScreenProps {
  table: Table;
  onOrderSubmitted: () => void;
  submitOrderOverride?: (
    table: Table,
    orderItems: OrderItem[],
    notes: string
  ) => Promise<void>;
}

const MenuOrderScreen: React.FC<MenuOrderScreenProps> = ({
  table,
  onOrderSubmitted,
  submitOrderOverride,
}) => {
  const [isBillModalOpen, setIsBillModalOpen] = useState<boolean>(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { menuItems, categories, loading } = useMenu();
  const [orderNotes, setOrderNotes] = useState("");

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ordersQuery = query(collection(db, "orders"));
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        servedAt: doc.data().servedAt?.toDate(),
      })) as Order[];

      const todayOrders = ordersData.filter(
        (order) => order.createdAt >= today
      );

      setOrders(todayOrders);
    });

    return () => {
      unsubscribeOrders();
    };
  }, []);

  const addToOrder = (menuItem: MenuItem) => {
    const existingItem = orderItems.find((item) => item.id === menuItem.id);
    if (existingItem) {
      setOrderItems(
        orderItems.map((item) =>
          item.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      const orderItem: OrderItem = {
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1,
        category: menuItem.category,
      };
      setOrderItems([...orderItems, orderItem]);
    }
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setOrderItems(orderItems.filter((item) => item.id !== itemId));
    } else {
      setOrderItems(
        orderItems.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const updateNotes = (itemId: string, notes: string) => {
    setOrderItems(
      orderItems.map((item) => (item.id === itemId ? { ...item, notes } : item))
    );
  };

  const getTotalAmount = () => {
    return orderItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const submitOrder = async () => {
    if (orderItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add items to the order",
        variant: "destructive",
      });
      return;
    }

    if (!table.sessionId) {
      toast({
        title: "Error",
        description: "Invalid table session. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      if (submitOrderOverride) {
        await submitOrderOverride(table, orderItems, orderNotes);
      } else {
        await addDoc(collection(db, "orders"), {
          tableId: table.id,
          tableNumber: table.number,
          guestName: table.guestName,
          sessionId: table.sessionId,
          waiterId: user?.uid,
          items: orderItems,
          status: "pending",
          totalAmount: getTotalAmount(),
          notes: orderNotes,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        toast({
          title: "Order Submitted",
          description: `Order for Table ${table.number} sent to kitchen`,
        });
      }

      setOrderItems([]);
      setOrderNotes("");
      onOrderSubmitted();
    } catch (error) {
      console.error("Error submitting order:", error);
      toast({
        title: "Error",
        description: "Failed to submit order. Please try again.",
        variant: "destructive",
      });
    }
    setSubmitting(false);
  };

  const getMenuItemsByCategory = (category: string) => {
    return menuItems.filter(
      (item) => item.category === category && item.isAvailable
    );
  };

  const getTableOrders = (tableId: string) => {
    if (!table || !table.sessionId) return [];
    return orders.filter(
      (order) =>
        order.tableId === tableId && order.sessionId === table.sessionId
    );
  };

  if (loading) {
    return (
      <Layout title={`Order for Table ${table.number}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Order for Table ${table.number}`}>
      <Button
        onClick={() => setIsBillModalOpen(true)}
        disabled={submitting}
        className="w-full mb-8 bg-blue-500 hover:bg-green-600"
      >
        <Send className="h-4 w-4 mr-2" />
        ઓર્ડસ જુઓ
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Items */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="appetizers" className="w-full">
            <TabsList className="grid grid-cols-1 lg:grid-cols-4 h-auto">
              {categories.map(({ id, category }) => (
                <TabsTrigger
                  key={id}
                  value={category}
                  defaultValue={categories?.[0]?.category}
                  className="capitalize"
                >
                  {category.replace("_", " ")}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map(({ id, category }) => (
              <TabsContent key={id} value={category} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getMenuItemsByCategory(category).map((item) => (
                    <Card
                      key={item.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold">{item.name}</h3>
                          <span className="text-lg font-bold text-orange-600">
                            ₹{item.price}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {item.description}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            {item.preparationTime} min
                          </span>
                          <Button
                            onClick={() => addToOrder(item)}
                            size="sm"
                            className="bg-orange-500 hover:bg-orange-600"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Current Order */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Current Order
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orderItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No items added yet
                </p>
              ) : (
                <div className="space-y-4">
                  {orderItems.map((item) => (
                    <div key={item.id} className="border-b pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">{item.name}</span>
                        <span className="font-semibold">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="text-sm text-gray-500">
                          ₹{item.price} each
                        </span>
                      </div>
                      <Textarea
                        placeholder="Special notes..."
                        value={item.notes || ""}
                        onChange={(e) => updateNotes(item.id, e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  ))}

                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span>₹{getTotalAmount().toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    onClick={submitOrder}
                    disabled={submitting}
                    className="w-full bg-green-500 hover:bg-green-600"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {submitting ? "Submitting..." : "Send to Kitchen"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <BillGenerationModal
        isOpen={isBillModalOpen}
        isReception={false}
        onClose={() => {
          setIsBillModalOpen(false);
        }}
        table={table}
        orders={getTableOrders(table.id)}
      />
    </Layout>
  );
};

export default MenuOrderScreen;
