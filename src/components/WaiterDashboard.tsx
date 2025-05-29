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
import { Table, Order } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "./Layout";
import TableCard from "./TableCard";
import GuestRegistrationModal from "./GuestRegistrationModal";
import MenuOrderScreen from "./MenuOrderScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, ArrowLeft, Clock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// Helper function to generate UUID
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const WaiterDashboard: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [readyOrders, setReadyOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showMenuScreen, setShowMenuScreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [occupyingTable, setOccupyingTable] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "tables"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tablesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          occupiedAt: doc.data().occupiedAt?.toDate(),
        })) as Table[];

        tablesData.sort((a, b) => a.number - b.number);
        setTables(tablesData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching tables:", error);
        toast({
          title: "Error",
          description: "Failed to load tables. Please refresh the page.",
          variant: "destructive",
        });
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [toast]);

  useEffect(() => {
    if (!user) return;

    const ordersQuery = query(
      collection(db, "orders"),
      where("status", "==", "ready")
    );

    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const orders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        servedAt: doc.data().servedAt?.toDate(),
      })) as Order[];

      // Filter to only show orders from current active sessions
      const activeSessionOrders = orders.filter((order) => {
        const table = tables.find((t) => t.id === order.tableId);
        if (!table || !table.sessionId) return false;

        return order.sessionId === table.sessionId;
      });

      setReadyOrders(activeSessionOrders);
    });

    return unsubscribeOrders;
  }, [user, tables]);

  const filteredTables = tables.filter(
    (table) =>
      table.number.toString().includes(searchQuery) ||
      table.guestName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      table.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTableClick = (table: Table) => {
    if (table.status === "available") {
      setSelectedTable(table);
      setShowGuestModal(true);
    } else {
      setSelectedTable(table);
      setShowMenuScreen(true);
    }
  };

  const handleGuestRegistration = async (guestData: {
    name: string;
    phone: string;
    guests: number;
    notes?: string;
  }) => {
    if (!selectedTable || !user) return;

    setOccupyingTable(selectedTable.id);
    const sessionId = generateUUID();

    const selectedTableData: Table = {
      ...selectedTable,
      status: "occupied",
      guestName: guestData.name,
      guestPhone: guestData.phone,
      occupiedAt: new Date(),
      waiterId: user.uid,
      sessionId: sessionId,
    };
    setSelectedTable((table) => ({ ...table, ...selectedTableData }));

    try {
      await updateDoc(doc(db, "tables", selectedTable.id), {
        ...selectedTableData,
      });

      toast({
        title: "Table Assigned",
        description: `Table ${selectedTable.number} assigned to ${guestData.name}`,
      });

      setShowGuestModal(false);
      setShowMenuScreen(true);
    } catch (error) {
      console.error("Error updating table:", error);
      toast({
        title: "Error",
        description: "Failed to assign table. Please try again.",
        variant: "destructive",
      });
    } finally {
      setOccupyingTable(null);
    }
  };

  const handleOrderServed = async (orderId: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: "served",
        servedAt: new Date(),
      });

      toast({
        title: "Order Served",
        description: "Order marked as served successfully",
      });
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const handleOrderSubmitted = () => {
    setShowMenuScreen(false);
    setSelectedTable(null);
  };

  const handleBackToTables = () => {
    setShowMenuScreen(false);
    setSelectedTable(null);
  };

  if (showMenuScreen && selectedTable) {
    return (
      <div>
        <div className="p-4 bg-white border-b">
          <Button
            onClick={handleBackToTables}
            variant="outline"
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tables
          </Button>
        </div>
        <MenuOrderScreen
          table={selectedTable}
          onOrderSubmitted={handleOrderSubmitted}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <Layout title="Table Management">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Table Management">
      <div className="space-y-6">
        {/* Ready Orders Section */}
        {readyOrders.length > 0 && (
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center text-green-800">
                <CheckCircle className="h-5 w-5 mr-2" />
                Ready for Pickup ({readyOrders.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {readyOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white p-4 rounded-lg border border-green-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">Table {order.tableNumber}</p>
                        <p className="text-sm text-gray-600">
                          {order.guestName}
                        </p>
                      </div>
                      <Badge className="bg-green-500">Ready</Badge>
                    </div>
                    <div className="space-y-1 mb-3">
                      {order.items.slice(0, 2).map((item, idx) => (
                        <p key={idx} className="text-sm">
                          {item.quantity}x {item.name}
                        </p>
                      ))}
                      {order.items.length > 2 && (
                        <p className="text-sm text-gray-500">
                          +{order.items.length - 2} more items
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => handleOrderServed(order.id)}
                    >
                      Mark as Served
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search tables, guests, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/80 border-orange-200 focus:border-orange-400"
            />
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <span>Occupied</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <span>Reserved</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTables.map((table) => (
            <div key={table.id} className="relative">
              <TableCard
                table={table}
                onClick={() => handleTableClick(table)}
              />
              {occupyingTable === table.id && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                    <span className="text-sm font-medium">
                      Assigning table...
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredTables.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No tables found matching your search.
            </p>
          </div>
        )}
      </div>

      <GuestRegistrationModal
        isOpen={showGuestModal}
        onClose={() => {
          setShowGuestModal(false);
          setSelectedTable(null);
        }}
        isLoading={occupyingTable === selectedTable?.id}
        onSubmit={handleGuestRegistration}
        tableNumber={selectedTable?.number}
      />
    </Layout>
  );
};

export default WaiterDashboard;
