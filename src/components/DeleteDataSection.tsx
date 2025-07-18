import React, { useState } from "react";
import { collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DeleteDataSection = () => {
  const [isDeleteOrdersDialogOpen, setIsDeleteOrdersDialogOpen] = useState(false);
  const [isDeleteBillsDialogOpen, setIsDeleteBillsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDeleteOrders = async () => {
    setIsDeleting(true);
    try {
      const ordersRef = collection(db, "orders");
      const querySnapshot = await getDocs(
        query(ordersRef, where("status", "==", "served"))
      );

      const deletePromises = querySnapshot.docs.map((doc) => 
        deleteDoc(doc.ref)
      );

      await Promise.all(deletePromises);

      toast({
        title: "સફળતા",
        description: `${querySnapshot.size} જૂના ઓર્ડર ડિલીટ થયા`,
      });
    } catch (error) {
      console.error("Error deleting orders:", error);
      toast({
        title: "ભૂલ",
        description: "ઓર્ડર ડિલીટ કરવામાં નિષ્ફળ",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteOrdersDialogOpen(false);
    }
  };

  const handleDeleteBills = async () => {
    setIsDeleting(true);
    try {
      const billsRef = collection(db, "bills");
      const querySnapshot = await getDocs(
        query(billsRef, where("status", "==", "paid"))
      );

      const deletePromises = querySnapshot.docs.map((doc) => 
        deleteDoc(doc.ref)
      );

      await Promise.all(deletePromises);

      toast({
        title: "સફળતા",
        description: `${querySnapshot.size} જૂના બિલ ડિલીટ થયા`,
      });
    } catch (error) {
      console.error("Error deleting bills:", error);
      toast({
        title: "ભૂલ",
        description: "બિલ ડિલીટ કરવામાં નિષ્ફળ",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteBillsDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">ડેટા ડિલીટ કરો</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">જૂના ઓર્ડર ડિલીટ કરો</h3>
            <p className="text-sm text-gray-500 mb-4">
              સર્વ થયેલા બધા ઓર્ડર ડિલીટ કરો. આ ક્રિયા પૂર્વવત્ કરી શકાશે નહીં.
            </p>
            <Button
              variant="destructive"
              onClick={() => setIsDeleteOrdersDialogOpen(true)}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              ઓર્ડર ડિલીટ કરો
            </Button>
          </div>

          <div className="pt-4 border-t">
            <h3 className="text-lg font-medium mb-2">જૂના બિલ ડિલીટ કરો</h3>
            <p className="text-sm text-gray-500 mb-4">
              ચુકવાયેલા બધા બિલ ડિલીટ કરો. આ ક્રિયા પૂર્વવત્ કરી શકાશે નહીં.
            </p>
            <Button
              variant="destructive"
              onClick={() => setIsDeleteBillsDialogOpen(true)}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              બિલ ડિલીટ કરો
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Orders Confirmation Dialog */}
      <AlertDialog
        open={isDeleteOrdersDialogOpen}
        onOpenChange={setIsDeleteOrdersDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>શું તમે ચોક્કસ છો?</AlertDialogTitle>
            <AlertDialogDescription>
              આ ક્રિયા બધા સર્વ થયેલા ઓર્ડર ડિલીટ કરશે. આ ક્રિયા પૂર્વવત્ કરી શકાશે નહીં.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>રદ કરો</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrders}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ડિલીટ કરી રહ્યું છે...
                </>
              ) : (
                "ડિલીટ કરો"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Bills Confirmation Dialog */}
      <AlertDialog
        open={isDeleteBillsDialogOpen}
        onOpenChange={setIsDeleteBillsDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>શું તમે ચોક્કસ છો?</AlertDialogTitle>
            <AlertDialogDescription>
              આ ક્રિયા બધા ચુકવાયેલા બિલ ડિલીટ કરશે. આ ક્રિયા પૂર્વવત્ કરી શકાશે નહીં.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>રદ કરો</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBills}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ડિલીટ કરી રહ્યું છે...
                </>
              ) : (
                "ડિલીટ કરો"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DeleteDataSection;