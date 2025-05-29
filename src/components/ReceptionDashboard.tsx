import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order, Table, Bill } from "@/types";
import Layout from "./Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  Clock,
  Users,
  FileText,
  TrendingUp,
  History,
  Settings,
  UtensilsCrossed,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import BillGenerationModal from "./BillGenerationModal";
import MenuManagement from "./MenuManagement";
import TableManagement from "./TableManagement";
import AnalyticsDialog from "./AnalyticsDialog";

const ReceptionDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [generatingBill, setGeneratingBill] = useState<string | null>(null);
  const { toast } = useToast();

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

    const tablesQuery = query(collection(db, "tables"));
    const unsubscribeTables = onSnapshot(tablesQuery, (snapshot) => {
      const tablesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        occupiedAt: doc.data().occupiedAt?.toDate(),
      })) as Table[];

      setTables(tablesData);
      setLoading(false);
    });

    const billsQuery = query(
      collection(db, "bills"),
      orderBy("generatedAt", "desc"),
      limit(50)
    );
    const unsubscribeBills = onSnapshot(billsQuery, (snapshot) => {
      const billsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        generatedAt: doc.data().generatedAt?.toDate(),
        paidAt: doc.data().paidAt?.toDate(),
      })) as Bill[];

      setBills(billsData);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeTables();
      unsubscribeBills();
    };
  }, []);

  const getActiveTables = () => {
    return tables.filter((table) => table.status === "occupied");
  };

  const getTodaysRevenue = () => {
    return orders
      .filter((order) => order.status === "served")
      .reduce((total, order) => total + order.totalAmount, 0);
  };

  const getAverageOrderValue = () => {
    const servedOrders = orders.filter((order) => order.status === "served");
    if (servedOrders.length === 0) return 0;
    return getTodaysRevenue() / servedOrders.length;
  };

  const getTableOrders = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table || !table.sessionId) return [];
    
    // Only return orders from current session using table's sessionId
    return orders.filter(
      (order) => order.tableId === tableId && 
                 order.sessionId === table.sessionId
    );
  };

  const getTableTotal = (tableId: string) => {
    const tableOrders = getTableOrders(tableId);
    return tableOrders.reduce((total, order) => total + order.totalAmount, 0);
  };

  const handleGenerateBill = (table: Table) => {
    setSelectedTable(table);
    setShowBillModal(true);
    setGeneratingBill(table.id);
  };

  const getRecentOrders = () => {
    return orders
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 4);
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 1) return "Just now";
    if (minutes === 1) return "1 min ago";
    return `${minutes} min ago`;
  };

  const getPaidBills = () => {
    return bills.filter((bill) => bill.status === "paid");
  };

  const getPendingBills = () => {
    return bills.filter((bill) => bill.status === "pending");
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Layout title="Reception Dashboard">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Reception Dashboard">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Reception Dashboard</h1>
        <AnalyticsDialog />
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="menu-management">
            <UtensilsCrossed className="h-4 w-4 mr-2" />
            Menu Management
          </TabsTrigger>
          <TabsTrigger value="table-management">
            <Settings className="h-4 w-4 mr-2" />
            Table Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">
                      Today's Revenue
                    </p>
                    <p className="text-3xl font-bold">
                      ₹{getTodaysRevenue().toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">
                      Orders Today
                    </p>
                    <p className="text-3xl font-bold">{orders.length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">
                      Active Tables
                    </p>
                    <p className="text-3xl font-bold">
                      {getActiveTables().length}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">
                      Avg Order Value
                    </p>
                    <p className="text-3xl font-bold">
                      ₹{getAverageOrderValue().toFixed(2)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Tables & Recent Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Active Tables
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getActiveTables().map((table) => {
                    const tableTotal = getTableTotal(table.id);
                    const timeOccupied = table.occupiedAt
                      ? Math.floor(
                          (new Date().getTime() - table.occupiedAt.getTime()) /
                            (1000 * 60)
                        )
                      : 0;

                    return (
                      <div
                        key={table.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">Table {table.number}</p>
                          <p className="text-sm text-gray-600">
                            {table.guestName}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            ₹{tableTotal.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {timeOccupied} min
                          </p>
                        </div>
                        <div className="relative">
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600"
                            onClick={() => handleGenerateBill(table)}
                            disabled={
                              tableTotal === 0 || generatingBill === table.id
                            }
                          >
                            {generatingBill === table.id ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Generating...
                              </div>
                            ) : (
                              "Generate Bill"
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {getActiveTables().length === 0 && (
                    <p className="text-gray-500 text-center py-8">
                      No active tables
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Recent Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getRecentOrders().map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">#{order.id.slice(-6)}</p>
                        <p className="text-sm text-gray-600">
                          Table {order.tableNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            order.status === "ready" ? "default" : "secondary"
                          }
                          className={
                            order.status === "preparing"
                              ? "bg-blue-500"
                              : order.status === "ready"
                                ? "bg-green-500"
                                : order.status === "served"
                                  ? "bg-gray-500"
                                  : "bg-orange-500"
                          }
                        >
                          {order.status}
                        </Badge>
                        <p className="text-sm text-gray-600 mt-1">
                          {getTimeAgo(order.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {getRecentOrders().length === 0 && (
                    <p className="text-gray-500 text-center py-8">
                      No recent orders
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bill History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="h-5 w-5 mr-2" />
                Bill History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="paid-bills">
                  <AccordionTrigger>
                    <div className="flex items-center justify-between w-full mr-4">
                      <span>Paid Bills ({getPaidBills().length})</span>
                      <span className="text-green-600 font-semibold">
                        ₹
                        {getPaidBills()
                          .reduce((sum, bill) => sum + bill.total, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {getPaidBills().length === 0 ? (
                        <p className="text-gray-500 text-center py-4">
                          No paid bills found
                        </p>
                      ) : (
                        <TableComponent>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Bill ID</TableHead>
                              <TableHead>Table</TableHead>
                              <TableHead>Guest</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Paid At</TableHead>
                              <TableHead>Payment</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getPaidBills().map((bill) => (
                              <TableRow key={bill.id}>
                                <TableCell className="font-mono text-sm">
                                  #{bill.id.slice(-6)}
                                </TableCell>
                                <TableCell>{bill.tableNumber}</TableCell>
                                <TableCell>{bill.guestName}</TableCell>
                                <TableCell className="font-medium">
                                  ₹{bill.total.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {bill.paidAt ? formatDate(bill.paidAt) : "-"}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">
                                    {bill.paymentMethod || "cash"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </TableComponent>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="pending-bills">
                  <AccordionTrigger>
                    <div className="flex items-center justify-between w-full mr-4">
                      <span>Pending Bills ({getPendingBills().length})</span>
                      <span className="text-orange-600 font-semibold">
                        ₹
                        {getPendingBills()
                          .reduce((sum, bill) => sum + bill.total, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {getPendingBills().length === 0 ? (
                        <p className="text-gray-500 text-center py-4">
                          No pending bills
                        </p>
                      ) : (
                        <TableComponent>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Bill ID</TableHead>
                              <TableHead>Table</TableHead>
                              <TableHead>Guest</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Generated At</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getPendingBills().map((bill) => (
                              <TableRow key={bill.id}>
                                <TableCell className="font-mono text-sm">
                                  #{bill.id.slice(-6)}
                                </TableCell>
                                <TableCell>{bill.tableNumber}</TableCell>
                                <TableCell>{bill.guestName}</TableCell>
                                <TableCell className="font-medium">
                                  ₹{bill.total.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {formatDate(bill.generatedAt)}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="destructive"
                                    className="text-xs"
                                  >
                                    Pending
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </TableComponent>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="menu-management">
          <MenuManagement />
        </TabsContent>

        <TabsContent value="table-management">
          <TableManagement />
        </TabsContent>
      </Tabs>

      {selectedTable && (
        <BillGenerationModal
          isOpen={showBillModal}
          onClose={() => {
            setShowBillModal(false);
            setSelectedTable(null);
            setGeneratingBill(null);
          }}
          table={selectedTable}
          orders={getTableOrders(selectedTable.id)}
        />
      )}
    </Layout>
  );
};

export default ReceptionDashboard;
