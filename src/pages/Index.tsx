
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user, loading } = useAuth();

  // This component should not be reached when auth is properly set up
  // but we'll keep it as a fallback
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">બ્લિસ ફૂડ્સ લોડ કરી રહ્યું છે...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-amber-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">બ્લિસ ફૂડ્સ</h1>
        <p className="text-xl text-gray-600">રેસ્ટોરન્ટ મેનેજમેન્ટ સિસ્ટમ</p>
        <p className="text-sm text-gray-500 mt-4">
          {user ? `સ્વાગત છે ${user.email}` : "ચાલુ રાખવા માટે કૃપા કરીને પ્રમાણીકરણ કરો"}
        </p>
      </div>
    </div>
  );
};

export default Index;
