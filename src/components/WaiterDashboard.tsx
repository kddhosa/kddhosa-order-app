import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Table } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "./Layout";
import TableCard from "./TableCard";
import GuestRegistrationModal from "./GuestRegistrationModal";
import MenuOrderScreen from "./MenuOrderScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const WaiterDashboard: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showMenuScreen, setShowMenuScreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "tables"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tablesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          occupiedAt: doc.data().occupiedAt?.toDate(),
        })) as Table[];

        // Sort by table number
        tablesData.sort((a, b) => a.number - b.number);
        setTables(tablesData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching tables:", error);
        toast({
          title: "Error",
          description: "Failed to load tables. Please refresh the page.",
          variant: "destructive",
        });
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [toast]);

  const filteredTables = tables.filter(
    (table) =>
      table.number.toString().includes(searchQuery) ||
      table.guestName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      table.status.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleTableClick = (table: Table) => {
    if (table.status === "available") {
      setSelectedTable(table);
      setShowGuestModal(true);
    } else {
      setSelectedTable(table);
      setShowMenuScreen(true);
    }
  };

  const handleGuestRegistration = async (guestData: {
    name: string;
    phone: string;
    guests: number;
    notes?: string;
  }) => {
    if (!selectedTable || !user) return;

    try {
      await updateDoc(doc(db, "tables", selectedTable.id), {
        status: "occupied",
        guestName: guestData.name,
        guestPhone: guestData.phone,
        occupiedAt: new Date(),
        waiterId: user.uid,
      });

      toast({
        title: "Table Assigned",
        description: `Table ${selectedTable.number} assigned to ${guestData.name}`,
      });

      setShowGuestModal(false);
      setShowMenuScreen(true);
    } catch (error) {
      console.error("Error updating table:", error);
      toast({
        title: "Error",
        description: "Failed to assign table. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleOrderSubmitted = () => {
    setShowMenuScreen(false);
    setSelectedTable(null);
  };

  const handleBackToTables = () => {
    setShowMenuScreen(false);
    setSelectedTable(null);
  };

  if (showMenuScreen && selectedTable) {
    return (
      <div>
        <div className="p-4 bg-white border-b">
          <Button
            onClick={handleBackToTables}
            variant="outline"
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tables
          </Button>
        </div>
        <MenuOrderScreen
          table={selectedTable}
          onOrderSubmitted={handleOrderSubmitted}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <Layout title="Table Management">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Table Management">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search tables, guests, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/80 border-orange-200 focus:border-orange-400"
            />
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <span>Occupied</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <span>Reserved</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onClick={() => handleTableClick(table)}
            />
          ))}
        </div>

        {filteredTables.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No tables found matching your search.
            </p>
          </div>
        )}
      </div>

      <GuestRegistrationModal
        isOpen={showGuestModal}
        onClose={() => {
          setShowGuestModal(false);
          setSelectedTable(null);
        }}
        onSubmit={handleGuestRegistration}
        tableNumber={selectedTable?.number}
      />
    </Layout>
  );
};

export default WaiterDashboard;
