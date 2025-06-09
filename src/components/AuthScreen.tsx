
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AuthScreen: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (error) {
      toast({
        title: "પ્રમાણીકરણ નિષ્ફળ",
        description:
          "સાઇન ઇન કરવામાં અસમર્થ. કૃપા કરીને તપાસો કે તમારું ઇમેઇલ અધિકૃત છે કે નહીં.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">બ્લિસ ફૂડ્સ</h1>
          <p className="text-lg text-gray-600">રેસ્ટોરન્ટ મેનેજમેન્ટ સિસ્ટમ</p>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-gray-900">
              પાછા આવવા પર સ્વાગત છે
            </CardTitle>
            <CardDescription>
              ચાલુ રાખવા માટે તમારા અધિકૃત Google એકાઉન્ટ સાથે સાઇન ઇન કરો
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-6 text-lg font-medium"
              size="lg"
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-5 w-5" />
              )}
              Google સાથે સાઇન ઇન કરો
            </Button>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>ફક્ત અધિકૃત રેસ્ટોરન્ટ સ્ટાફ જ આ સિસ્ટમને એક્સેસ કરી શકે છે</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthScreen;
