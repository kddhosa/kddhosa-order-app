
import React from 'react';
import Layout from './Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ChefHat, CheckCircle } from 'lucide-react';

const ChefDashboard: React.FC = () => {
  return (
    <Layout title="Kitchen Display System">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* New Orders */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-orange-500" />
            New Orders
          </h3>
          <div className="space-y-4">
            <Card className="bg-orange-50 border-orange-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Table 5</CardTitle>
                  <Badge variant="secondary">2 min ago</Badge>
                </div>
                <p className="text-sm text-gray-600">John Smith • 2 guests</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>2x Pasta Carbonara</span>
                    <span className="text-gray-500">15 min</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>1x Caesar Salad</span>
                    <span className="text-gray-500">5 min</span>
                  </div>
                </div>
                <Button className="w-full bg-orange-500 hover:bg-orange-600">
                  <ChefHat className="h-4 w-4 mr-2" />
                  Start Preparing
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Preparing */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ChefHat className="h-5 w-5 mr-2 text-blue-500" />
            Preparing
          </h3>
          <div className="space-y-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Table 3</CardTitle>
                  <Badge variant="outline" className="border-blue-300 text-blue-700">8 min</Badge>
                </div>
                <p className="text-sm text-gray-600">Sarah Johnson • 4 guests</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>3x Grilled Salmon</span>
                    <span className="text-green-600">Ready</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>1x Vegetarian Pizza</span>
                    <span className="text-orange-600">2 min</span>
                  </div>
                </div>
                <Button className="w-full bg-blue-500 hover:bg-blue-600">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Ready
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Ready */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
            Ready for Pickup
          </h3>
          <div className="space-y-4">
            <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Table 8</CardTitle>
                  <Badge variant="outline" className="border-green-300 text-green-700">Ready</Badge>
                </div>
                <p className="text-sm text-gray-600">Mike Davis • 2 guests</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>2x Beef Burger</span>
                    <span className="text-green-600">✓</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>2x French Fries</span>
                    <span className="text-green-600">✓</span>
                  </div>
                </div>
                <p className="text-xs text-green-600 font-medium text-center">Waiting for pickup...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ChefDashboard;
