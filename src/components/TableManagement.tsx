import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TableStatus, Table as TableType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash, Loader2 } from "lucide-react";

const TableManagement: React.FC = () => {
  const [tables, setTables] = useState<TableType[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    number: 1,
    capacity: 2,
    status: "available" as TableStatus,
  });

  useEffect(() => {
    const tablesQuery = query(collection(db, "tables"));
    const unsubscribe = onSnapshot(tablesQuery, (snapshot) => {
      const tablesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        occupiedAt: doc.data().occupiedAt?.toDate(),
      })) as TableType[];

      setTables(tablesData.sort((a, b) => a.number - b.number));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setFormData({
      number: 1,
      capacity: 2,
      status: "available",
    });
    setEditingTable(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Check if table number already exists (when creating new table)
      if (!editingTable) {
        const existingTable = tables.find(
          (table) => table.number === formData.number,
        );
        if (existingTable) {
          toast({
            title: "Error",
            description: "A table with this number already exists",
            variant: "destructive",
          });
          setSubmitting(false);
          return;
        }
      }

      const tableData = {
        number: Number(formData.number),
        capacity: Number(formData.capacity),
        status: formData.status,
      };

      if (editingTable) {
        await updateDoc(doc(db, "tables", editingTable.id), tableData);
        toast({
          title: "Success",
          description: "Table updated successfully",
        });
      } else {
        await addDoc(collection(db, "tables"), tableData);
        toast({
          title: "Success",
          description: "Table created successfully",
        });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving table:", error);
      toast({
        title: "Error",
        description: "Failed to save table",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (table: TableType) => {
    setEditingTable(table);
    setFormData({
      number: table.number,
      capacity: table.capacity,
      status: table.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (tableId: string) => {
    setDeletingId(tableId);
    try {
      await deleteDoc(doc(db, "tables", tableId));
      toast({
        title: "Success",
        description: "Table deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting table:", error);
      toast({
        title: "Error",
        description: "Failed to delete table",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const openAddDialog = () => {
    resetForm();
    // Set next available table number
    const maxNumber =
      tables.length > 0 ? Math.max(...tables.map((t) => t.number)) : 0;
    setFormData((prev) => ({ ...prev, number: maxNumber + 1 }));
    setIsDialogOpen(true);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "available":
        return "default";
      case "occupied":
        return "destructive";
      case "reserved":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Table Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Table Management</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={openAddDialog}
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Table
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingTable ? "Edit Table" : "Add New Table"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="number">Table Number</Label>
                  <Input
                    id="number"
                    type="number"
                    min="1"
                    value={formData.number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        number: Number(e.target.value),
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="capacity">Capacity (seats)</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    max="20"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capacity: Number(e.target.value),
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(
                      value: "available" | "occupied" | "reserved",
                    ) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="occupied">Occupied</SelectItem>
                      <SelectItem value="reserved">Reserved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {editingTable ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Table Number</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Guest</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tables.map((table) => (
              <TableRow key={table.id}>
                <TableCell className="font-medium">
                  Table {table.number}
                </TableCell>
                <TableCell>{table.capacity} seats</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(table.status)}>
                    {table.status}
                  </Badge>
                </TableCell>
                <TableCell>{table.guestName || "-"}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(table)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(table.id)}
                      disabled={
                        deletingId === table.id || table.status === "occupied"
                      }
                    >
                      {deletingId === table.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {tables.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No tables found. Add your first table!
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TableManagement;
