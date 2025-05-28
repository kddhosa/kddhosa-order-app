
import React from 'react';
import Layout from './Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Clock, Users, FileText, TrendingUp } from 'lucide-react';

const ReceptionDashboard: React.FC = () => {
  return (
    <Layout title="Reception Dashboard">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Today's Revenue</p>
                  <p className="text-3xl font-bold">$2,847</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Orders Today</p>
                  <p className="text-3xl font-bold">156</p>
                </div>
                <FileText className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Active Tables</p>
                  <p className="text-3xl font-bold">12</p>
                </div>
                <Users className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Avg Order Value</p>
                  <p className="text-3xl font-bold">$18.25</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Tables & Bills */}
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
                {[
                  { table: 3, guest: 'Sarah Johnson', amount: 89.50, time: '45 min' },
                  { table: 5, guest: 'John Smith', amount: 67.25, time: '23 min' },
                  { table: 8, guest: 'Mike Davis', amount: 34.75, time: '12 min' },
                ].map((item) => (
                  <div key={item.table} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Table {item.table}</p>
                      <p className="text-sm text-gray-600">{item.guest}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${item.amount}</p>
                      <p className="text-sm text-gray-600">{item.time}</p>
                    </div>
                    <Button size="sm" className="bg-green-500 hover:bg-green-600">
                      Generate Bill
                    </Button>
                  </div>
                ))}
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
                {[
                  { id: '#001', table: 5, status: 'preparing', time: '2 min ago' },
                  { id: '#002', table: 3, status: 'ready', time: '8 min ago' },
                  { id: '#003', table: 8, status: 'served', time: '12 min ago' },
                  { id: '#004', table: 1, status: 'pending', time: '15 min ago' },
                ].map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{order.id}</p>
                      <p className="text-sm text-gray-600">Table {order.table}</p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={order.status === 'ready' ? 'default' : 'secondary'}
                        className={
                          order.status === 'preparing' ? 'bg-blue-500' :
                          order.status === 'ready' ? 'bg-green-500' :
                          order.status === 'served' ? 'bg-gray-500' :
                          'bg-orange-500'
                        }
                      >
                        {order.status}
                      </Badge>
                      <p className="text-sm text-gray-600 mt-1">{order.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ReceptionDashboard;
