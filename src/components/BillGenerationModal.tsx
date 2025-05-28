import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, Order, Bill, PaymentMethod } from "@/types";
import { doc, updateDoc, addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Receipt, CreditCard, DollarSign } from "lucide-react";
import { useMenu } from "@/contexts/MenuContext";

interface BillGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: Table;
  orders: Order[];
}

const BillGenerationModal: React.FC<BillGenerationModalProps> = ({
  isOpen,
  onClose,
  table,
  orders,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const { gst } = useMenu();

  const getAllItems = () => {
    const items = orders.flatMap((order) => order.items);
    return items;
  };

  const getSubtotal = () => {
    return getAllItems().reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const getTax = () => {
    return getSubtotal() * (gst / 100);
  };

  const getTotal = () => {
    return getSubtotal() + getTax();
  };

  const handlePayment = async () => {
    setProcessing(true);
    try {
      // Create bill
      const billData: Omit<Bill, "id"> = {
        tableId: table.id,
        tableNumber: table.number,
        guestName: table.guestName!,
        orders: orders.map((order) => order.id),
        items: getAllItems(),
        subtotal: getSubtotal(),
        tax: getTax(),
        total: getTotal(),
        status: "paid",
        generatedAt: new Date(),
        paidAt: new Date(),
        paymentMethod,
      };

      await addDoc(collection(db, "bills"), billData);

      // Update table status
      await updateDoc(doc(db, "tables", table.id), {
        status: "available",
        guestName: null,
        guestPhone: null,
        occupiedAt: null,
        waiterId: null,
      });

      // Mark all orders as served
      for (const order of orders) {
        await updateDoc(doc(db, "orders", order.id), {
          status: "served",
          servedAt: new Date(),
          updatedAt: new Date(),
        });
      }

      toast({
        title: "Payment Processed",
        description: `Bill generated and table ${table.number} released`,
      });

      onClose();
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        title: "Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    }
    setProcessing(false);
  };

  if (orders.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>No Orders Found</DialogTitle>
          </DialogHeader>
          <p className="text-center text-gray-500 py-8">
            No orders found for Table {table.number}
          </p>
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Receipt className="h-5 w-5 mr-2" />
            Bill for Table {table.number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Customer Information</h3>
            <p>
              <strong>Name:</strong> {table.guestName}
            </p>
            <p>
              <strong>Phone:</strong> {table.guestPhone}
            </p>
            <p>
              <strong>Table:</strong> {table.number}
            </p>
          </div>

          {/* Orders */}
          <div>
            <h3 className="font-semibold mb-4">Order Details</h3>
            <div className="space-y-4">
              {orders.map((order, orderIndex) => (
                <div key={order.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium">
                      Order #{order.id.slice(-6)}
                    </span>
                    <Badge variant="outline">{order.status}</Badge>
                  </div>
                  <div className="space-y-2">
                    {order.items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bill Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-4">Bill Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${getSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (10%):</span>
                <span>${getTax().toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>${getTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <h3 className="font-semibold mb-3">Payment Method</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={paymentMethod === "cash" ? "default" : "outline"}
                onClick={() => setPaymentMethod("cash")}
                className="flex items-center justify-center"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Cash
              </Button>
              <Button
                variant={paymentMethod === "card" ? "default" : "outline"}
                onClick={() => setPaymentMethod("card")}
                className="flex items-center justify-center"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Card
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={processing}
              className="flex-1 bg-green-500 hover:bg-green-600"
            >
              {processing ? "Processing..." : "Process Payment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BillGenerationModal;
