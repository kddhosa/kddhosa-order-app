
import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User } from "lucide-react";
import { Card } from "@/components/ui/card";

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { user, logout } = useAuth();

  const getRoleColor = (role: string) => {
    switch (role) {
      case "waiter":
        return "bg-blue-100 text-blue-800";
      case "chef":
        return "bg-green-100 text-green-800";
      case "reception":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case "waiter":
        return "વેઇટર";
      case "chef":
        return "રસોઇયો";
      case "reception":
        return "રિસેપ્શન";
      default:
        return role?.toUpperCase();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-amber-5 max-w-[100vw]">
      <header className="bg-white/80 backdrop-blur-sm border-b border-orange-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 flex-wrap">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">બ્લિસ ફૂડ્સ</h1>
              <span className="text-lg text-gray-600">•</span>
              <h2 className="text-xl text-gray-700">{title}</h2>
            </div>

            <div className="flex items-center space-x-4">
              <Card className="bg-white/60 border-0 px-3 py-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {user?.displayName || user?.email}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user?.role || "")}`}
                  >
                    {getRoleText(user?.role || "")}
                  </span>
                </div>
              </Card>

              <Button
                onClick={logout}
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                <LogOut className="h-4 w-4 mr-2" />
                લૉગઆઉટ
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
