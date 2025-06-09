
import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order } from "@/types";
import Layout from "./Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ChefHat, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ChefDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      where("status", "in", ["pending", "preparing", "ready"]),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ordersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          servedAt: doc.data().servedAt?.toDate(),
        })) as Order[];

        // Sort by creation time
        ordersData.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
        );
        setOrders(ordersData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching orders:", error);
        toast({
          title: "ભૂલ",
          description: "ઓર્ડર લોડ કરવામાં નિષ્ફળ. કૃપા કરીને પેજ રિફ્રેશ કરો.",
          variant: "destructive",
        });
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [toast]);

  const updateOrderStatus = async (
    orderId: string,
    newStatus: "preparing" | "ready",
  ) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus,
        updatedAt: new Date(),
      });

      toast({
        title: "ઓર્ડર અપડેટ થયું",
        description: `ઓર્ડરની સ્થિતિ ${newStatus === "preparing" ? "તૈયાર કરી રહ્યું છે" : "તૈયાર"} માં બદલાઈ`,
      });
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "ભૂલ",
        description: "ઓર્ડરની સ્થિતિ અપડેટ કરવામાં નિષ્ફળ",
        variant: "destructive",
      });
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 1) return "હમણાં જ";
    if (minutes === 1) return "1 મિનિટ પહેલાં";
    return `${minutes} મિનિટ પહેલાં`;
  };

  const getOrdersByStatus = (status: string) => {
    return orders.filter((order) => order.status === status);
  };

  if (loading) {
    return (
      <Layout title="રસોડાની ડિસ્પ્લે સિસ્ટમ">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="રસોડાની ડિસ્પ્લે સિસ્ટમ">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* New Orders */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-orange-500" />
            નવા ઓર્ડર ({getOrdersByStatus("pending").length})
          </h3>
          <div className="space-y-4">
            {getOrdersByStatus("pending").map((order) => (
              <Card key={order.id} className="bg-orange-50 border-orange-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      ટેબલ {order.tableNumber}
                    </CardTitle>
                    <Badge variant="secondary">
                      {getTimeAgo(order.createdAt)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{order.guestName}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 mb-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        {item.notes && (
                          <span className="text-gray-500 italic">
                            ({item.notes})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    onClick={() => updateOrderStatus(order.id, "preparing")}
                  >
                    <ChefHat className="h-4 w-4 mr-2" />
                    તૈયાર કરવા શરૂ કરો
                  </Button>
                </CardContent>
              </Card>
            ))}
            {getOrdersByStatus("pending").length === 0 && (
              <p className="text-gray-500 text-center py-8">કોઈ નવા ઓર્ડર નથી</p>
            )}
          </div>
        </div>

        {/* Preparing */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ChefHat className="h-5 w-5 mr-2 text-blue-500" />
            તૈયાર કરી રહ્યું છે ({getOrdersByStatus("preparing").length})
          </h3>
          <div className="space-y-4">
            {getOrdersByStatus("preparing").map((order) => (
              <Card key={order.id} className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      ટેબલ {order.tableNumber}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="border-blue-300 text-blue-700"
                    >
                      {getTimeAgo(order.updatedAt)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{order.guestName}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 mb-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        {item.notes && (
                          <span className="text-gray-500 italic">
                            ({item.notes})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    className="w-full bg-blue-500 hover:bg-blue-600"
                    onClick={() => updateOrderStatus(order.id, "ready")}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    તૈયાર તરીકે માર્ક કરો
                  </Button>
                </CardContent>
              </Card>
            ))}
            {getOrdersByStatus("preparing").length === 0 && (
              <p className="text-gray-500 text-center py-8">
                કોઈ ઓર્ડર તૈયાર થઈ રહ્યા નથી
              </p>
            )}
          </div>
        </div>

        {/* Ready */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
            પિકઅપ માટે તૈયાર ({getOrdersByStatus("ready").length})
          </h3>
          <div className="space-y-4">
            {getOrdersByStatus("ready").map((order) => (
              <Card key={order.id} className="bg-green-50 border-green-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      ટેબલ {order.tableNumber}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="border-green-300 text-green-700"
                    >
                      તૈયાર
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{order.guestName}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 mb-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span className="text-green-600">✓</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-green-600 font-medium text-center">
                    પિકઅપની રાહ જોઈ રહ્યું છે...
                  </p>
                </CardContent>
              </Card>
            ))}
            {getOrdersByStatus("ready").length === 0 && (
              <p className="text-gray-500 text-center py-8">કોઈ ઓર્ડર તૈયાર નથી</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ChefDashboard;
