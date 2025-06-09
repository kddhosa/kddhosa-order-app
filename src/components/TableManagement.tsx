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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
      if (!editingTable) {
        const existingTable = tables.find(
          (table) => table.number === formData.number
        );
        if (existingTable) {
          toast({
            title: "ભૂલ",
            description: "આ નંબર સાથે ટેબલ પહેલેથી અસ્તિત્વમાં છે",
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
          title: "સફળતા",
          description: "ટેબલ સફળતાપૂર્વક અપડેટ થયું",
        });
      } else {
        await addDoc(collection(db, "tables"), tableData);
        toast({
          title: "સફળતા",
          description: "ટેબલ સફળતાપૂર્વક બનાવાયું",
        });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving table:", error);
      toast({
        title: "ભૂલ",
        description: "ટેબલ સેવ કરવામાં નિષ્ફળ",
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
        title: "સફળતા",
        description: "ટેબલ સફળતાપૂર્વક ડિલીટ થયું",
      });
    } catch (error) {
      console.error("Error deleting table:", error);
      toast({
        title: "ભૂલ",
        description: "ટેબલ ડિલીટ કરવામાં નિષ્ફળ",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const openAddDialog = () => {
    resetForm();
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
          <CardTitle>ટેબલ મેનેજમેન્ટ</CardTitle>
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
          <CardTitle>ટેબલ મેનેજમેન્ટ</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={openAddDialog}
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                ટેબલ ઉમેરો
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingTable ? "ટેબલ એડિટ કરો" : "નવું ટેબલ ઉમેરો"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="number">ટેબલ નંબર</Label>
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
                {/* <div>
                  <Label htmlFor="capacity">ક્ષમતા (બેઠકો)</Label>
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
                  <Label htmlFor="status">સ્થિતિ</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: TableStatus) => 
                      setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="સ્થિતિ પસંદ કરો" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">ઉપલબ્ધ</SelectItem>
                      <SelectItem value="occupied">કબજે</SelectItem>
                      <SelectItem value="reserved">આરક્ષિત</SelectItem>
                    </SelectContent>
                  </Select>
                </div> */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    રદ કરો
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {editingTable ? "અપડેટ કરો" : "બનાવો"}
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
              <TableHead>ટેબલ નંબર</TableHead>
              <TableHead>ક્ષમતા</TableHead>
              <TableHead>સ્થિતિ</TableHead>
              <TableHead>મહેમાન</TableHead>
              <TableHead>ક્રિયાઓ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tables.map((table) => (
              <TableRow key={table.id}>
                <TableCell className="font-medium">
                  ટેબલ {table.number}
                </TableCell>
                <TableCell>{table.capacity} બેઠકો</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(table.status)}>
                    {table.status === "available"
                      ? "ઉપલબ્ધ"
                      : table.status === "occupied"
                        ? "કબજે"
                        : "આરક્ષિત"}
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
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={
                            deletingId === table.id ||
                            table.status === "occupied"
                          }
                        >
                          {deletingId === table.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>ટેબલ ડિલીટ કરો</AlertDialogTitle>
                          <AlertDialogDescription>
                            શું તમે ખરેખર ટેબલ {table.number} ડિલીટ કરવા માંગો
                            છો? આ ક્રિયા પૂર્વવત્ કરી શકાશે નહીં.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={deletingId === table.id}>
                            રદ કરો
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(table.id)}
                            className="bg-red-500 hover:bg-red-600"
                            disabled={deletingId === table.id}
                          >
                            {deletingId === table.id ? (
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {tables.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            કોઈ ટેબલ મળ્યું નથી. તમારું પ્રથમ ટેબલ ઉમેરો!
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TableManagement;
