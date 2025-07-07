import React, { useState, useRef } from "react";
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
import { useReactToPrint } from "react-to-print";

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
  const { GST } = useMenu();
  const billRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef: billRef });

  const getCurrentSessionOrders = () => {
    if (!table.sessionId) return [];

    return orders.filter((order) => {
      return order.sessionId === table.sessionId;
    });
  };

  const currentSessionOrders = getCurrentSessionOrders();

  const getAllItems = () => {
    const items = currentSessionOrders.flatMap((order) => order.items);
    return items;
  };

  const getSubtotal = () => {
    return getAllItems().reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const getTax = () => {
    return getSubtotal() * (GST / 100);
  };

  const getTotal = () => {
    return getSubtotal() + getTax();
  };

  const handlePayment = async () => {
    setProcessing(true);
    try {
      if (!table.sessionId) {
        throw new Error("અમાન્ય ટેબલ સેશન");
      }
      reactToPrintFn();
      const billData: Omit<Bill, "id"> = {
        tableId: table.id,
        tableNumber: table.number,
        guestName: table.guestName!,
        sessionId: table.sessionId,
        orders: currentSessionOrders.map((order) => order.id),
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

      // Update table status and clear sessionId
      await updateDoc(doc(db, "tables", table.id), {
        status: "available",
        guestName: null,
        guestPhone: null,
        occupiedAt: null,
        waiterId: null,
        sessionId: null,
      });

      // Mark current session orders as served
      for (const order of currentSessionOrders) {
        await updateDoc(doc(db, "orders", order.id), {
          status: "served",
          servedAt: new Date(),
          updatedAt: new Date(),
        });
      }

      toast({
        title: "ચુકવણી પ્રક્રિયા થઈ",
        description: `બિલ તૈયાર થયું અને ટેબલ ${table.number} મુક્ત થયું`,
      });

      onClose();
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        title: "ભૂલ",
        description:
          "ચુકવણી પ્રક્રિયા કરવામાં નિષ્ફળ. કૃપા કરીને ફરી પ્રયાસ કરો.",
        variant: "destructive",
      });
    }
    setProcessing(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Receipt className="h-5 w-5 mr-2" />
            ટેબલ {table.number} નું બિલ
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div ref={billRef} className="space-x-4" id="bill-pdf-content">
            {/* Customer Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">ગ્રાહકની માહિતી</h3>
              <p>
                <strong>નામ:</strong> {table.guestName}
              </p>
              <p>
                <strong>ફોન:</strong> {table.guestPhone}
              </p>
              <p>
                <strong>ટેબલ:</strong> {table.number}
              </p>
            </div>

            {/* Orders */}
            <div>
              <h3 className="font-semibold mb-4">ઓર્ડરની વિગતો</h3>
              <div className="space-y-4">
                {currentSessionOrders.map((order, orderIndex) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium">
                        ઓર્ડર #{order.id.slice(-6)}
                      </span>
                      <Badge variant="outline">
                        {order.status === "preparing"
                          ? "તૈયાર કરી રહ્યું છે"
                          : order.status === "ready"
                            ? "તૈયાર"
                            : order.status === "served"
                              ? "સર્વ કર્યું"
                              : order.status}
                      </Badge>
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
                          <span>
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    {order.notes && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                        <strong>નોંધ:</strong> {order.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bill Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-4">બિલનો સારાંશ</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>પેટા કુલ:</span>
                  <span>₹{getSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>કર ({GST}%):</span>
                  <span>₹{getTax().toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>કુલ:</span>
                  <span>₹{getTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          {/* Payment Method */}
          <div>
            <h3 className="font-semibold mb-3">ચુકવણી પદ્ધતિ</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={paymentMethod === "cash" ? "default" : "outline"}
                onClick={() => setPaymentMethod("cash")}
                className="flex items-center justify-center"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                રોકડ
              </Button>
              <Button
                variant={paymentMethod === "card" ? "default" : "outline"}
                onClick={() => setPaymentMethod("card")}
                className="flex items-center justify-center"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                કાર્ડ
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
              રદ કરો
            </Button>
            <Button
              onClick={handlePayment}
              disabled={processing}
              className="flex-1 bg-green-500 hover:bg-green-600"
            >
              {processing ? "પ્રક્રિયા કરી રહ્યું છે..." : "ચુકવણી કરો"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BillGenerationModal;
