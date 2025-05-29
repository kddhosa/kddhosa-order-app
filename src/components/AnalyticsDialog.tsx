import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order, MenuItem } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, DollarSign, Award, ChartBar } from "lucide-react";
import { useMenu } from "@/contexts/MenuContext";

interface MenuItemStats {
  id: string;
  name: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
}

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "#10b981",
  },
  orders: {
    label: "Orders",
    color: "#3b82f6",
  },
};

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

const AnalyticsDialog: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const { menuItems } = useMenu();

  useEffect(() => {
    if (!isOpen) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ordersQuery = query(
      collection(db, "orders"),
      where("status", "==", "served"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        servedAt: doc.data().servedAt?.toDate(),
      })) as Order[];

      setOrders(ordersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen]);

  const getMenuItemStats = (): MenuItemStats[] => {
    const statsMap = new Map<string, MenuItemStats>();

    orders.forEach((order) => {
      order.items.forEach((orderItem) => {
        const menuItem = menuItems.find((mi) => mi.id === orderItem.id);
        if (!menuItem) return;

        const key = orderItem.id;
        const revenue = orderItem.price * orderItem.quantity;

        if (statsMap.has(key)) {
          const existing = statsMap.get(key)!;
          existing.totalRevenue += revenue;
          existing.totalOrders += orderItem.quantity;
        } else {
          statsMap.set(key, {
            id: orderItem.id,
            name: menuItem.name,
            totalRevenue: revenue,
            totalOrders: orderItem.quantity,
            averageOrderValue: revenue / orderItem.quantity,
          });
        }
      });
    });

    return Array.from(statsMap.values()).sort(
      (a, b) => b.totalRevenue - a.totalRevenue
    );
  };

  const getTopRevenueItems = () => {
    return getMenuItemStats().slice(0, 5);
  };

  const getTopPopularItems = () => {
    return getMenuItemStats()
      .sort((a, b) => b.totalOrders - a.totalOrders)
      .slice(0, 5);
  };

  const getTotalRevenue = () => {
    return orders.reduce((total, order) => total + order.totalAmount, 0);
  };

  const getTotalOrders = () => {
    return orders.length;
  };

  const getAverageOrderValue = () => {
    const total = getTotalRevenue();
    const count = getTotalOrders();
    return count > 0 ? total / count : 0;
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const revenueData = getTopRevenueItems().map((item) => ({
    name: item.name,
    revenue: item.totalRevenue,
  }));

  const popularityData = getTopPopularItems().map((item, index) => ({
    name: item.name,
    orders: item.totalOrders,
    fill: COLORS[index % COLORS.length],
  }));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-purple-50 hover:bg-purple-100">
          <ChartBar className="h-4 w-4 mr-2" />
          View Analytics
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Restaurant Analytics
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Total Revenue</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(getTotalRevenue())}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total Orders</p>
                      <p className="text-2xl font-bold">{getTotalOrders()}</p>
                    </div>
                    <Award className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm">Avg Order Value</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(getAverageOrderValue())}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-orange-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <Tabs defaultValue="revenue" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="revenue">Top Revenue Items</TabsTrigger>
                <TabsTrigger value="popularity">Most Popular Items</TabsTrigger>
              </TabsList>

              <TabsContent value="revenue" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Top 5 Revenue Generating Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {revenueData.length > 0 ? (
                      <ChartContainer
                        config={chartConfig}
                        className="h-[300px] w-full"
                      >
                        <BarChart data={revenueData}>
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) =>
                              value.length > 10
                                ? `${value.substring(0, 10)}...`
                                : value
                            }
                          />
                          <YAxis tickFormatter={(value) => `₹${value}`} />
                          <ChartTooltip
                            content={<ChartTooltipContent />}
                            formatter={(value) => [
                              formatCurrency(Number(value)),
                              ": Revenue",
                            ]}
                          />
                          <Bar
                            dataKey="revenue"
                            fill="var(--color-revenue)"
                            radius={[4, 4, 0, 0]}
                            className="animate-fade-in"
                          />
                        </BarChart>
                      </ChartContainer>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No revenue data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="popularity" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Most Popular Items by Order Count</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {popularityData.length > 0 ? (
                      <ChartContainer
                        config={chartConfig}
                        className="h-[300px] w-full"
                      >
                        <PieChart>
                          <Pie
                            data={popularityData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={120}
                            dataKey="orders"
                            className="animate-scale-in"
                          >
                            {popularityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <ChartTooltip
                            content={<ChartTooltipContent />}
                            formatter={(value, name) => [
                              `${value} orders : `,
                              popularityData.find(
                                (item) => item.orders === value
                              )?.name || name,
                            ]}
                          />
                        </PieChart>
                      </ChartContainer>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No popularity data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Detailed Stats Table */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Item Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Item Name</th>
                        <th className="text-right p-2">Total Revenue</th>
                        <th className="text-right p-2">Total Orders</th>
                        <th className="text-right p-2">Avg Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getMenuItemStats().map((item, index) => (
                        <tr key={item.id} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{item.name}</td>
                          <td className="p-2 text-right text-green-600 font-medium">
                            {formatCurrency(item.totalRevenue)}
                          </td>
                          <td className="p-2 text-right">{item.totalOrders}</td>
                          <td className="p-2 text-right">
                            {formatCurrency(item.averageOrderValue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {getMenuItemStats().length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AnalyticsDialog;
