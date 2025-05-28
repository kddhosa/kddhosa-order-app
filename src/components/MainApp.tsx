import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import WaiterDashboard from "./WaiterDashboard";
import ChefDashboard from "./ChefDashboard";
import ReceptionDashboard from "./ReceptionDashboard";

const MainApp: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return null; // This shouldn't happen as auth is handled in App.tsx
  }

  switch (user.role) {
    case "waiter":
      return <WaiterDashboard />;
    case "chef":
      return <ChefDashboard />;
    case "reception":
      return <ReceptionDashboard />;
    default:
      return (
        <div className="text-center py-8">
          <p className="text-red-600">Unknown user role: {user.role}</p>
        </div>
      );
  }
};

export default MainApp;
