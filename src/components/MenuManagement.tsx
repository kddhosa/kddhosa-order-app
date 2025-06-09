import React, { useState } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useMenu } from "@/contexts/MenuContext";
import { MenuItem, Category } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

const MenuManagement: React.FC = () => {
  const { menuItems, categories, loading } = useMenu();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    category: "",
    preparationTime: 15,
    allergens: "",
    isAvailable: true,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      category: "",
      preparationTime: 15,
      allergens: "",
      isAvailable: true,
    });
    setEditingItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const itemData = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        category: formData.category,
        preparationTime: Number(formData.preparationTime),
        allergens: formData.allergens
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
        isAvailable: formData.isAvailable,
      };

      if (editingItem) {
        await updateDoc(doc(db, "menuItems", editingItem.id), itemData);
        toast({
          title: "સફળતા",
          description: "મેનુ આઇટમ સફળતાપૂર્વક અપડેટ થયું",
        });
      } else {
        await addDoc(collection(db, "menuItems"), itemData);
        toast({
          title: "સફળતા",
          description: "મેનુ આઇટમ સફળતાપૂર્વક બનાવાયું",
        });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving menu item:", error);
      toast({
        title: "ભૂલ",
        description: "મેનુ આઇટમ સેવ કરવામાં નિષ્ફળ",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      preparationTime: item.preparationTime,
      allergens: item.allergens?.join(", "),
      isAvailable: item.isAvailable,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (itemId: string) => {
    setDeletingId(itemId);
    try {
      await deleteDoc(doc(db, "menuItems", itemId));
      toast({
        title: "સફળતા",
        description: "મેનુ આઇટમ સફળતાપૂર્વક ડિલીટ થયું",
      });
    } catch (error) {
      console.error("Error deleting menu item:", error);
      toast({
        title: "ભૂલ",
        description: "મેનુ આઇટમ ડિલીટ કરવામાં નિષ્ફળ",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>મેનુ મેનેજમેન્ટ</CardTitle>
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
          <CardTitle>મેનુ મેનેજમેન્ટ</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={openAddDialog}
                className="bg-green-500 hover:bg-green-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                મેનુ આઇટમ ઉમેરો
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "મેનુ આઇટમ એડિટ કરો" : "નવું મેનુ આઇટમ ઉમેરો"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">નામ</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">વર્ણન</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">કિંમત (₹)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price: Number(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="preparationTime">તૈયારીનો સમય (મિનિટ)</Label>
                    <Input
                      id="preparationTime"
                      type="number"
                      min="1"
                      value={formData.preparationTime}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          preparationTime: Number(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="category">કેટેગરી</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="કેટેગરી પસંદ કરો" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.category}>
                          {category.category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="allergens">એલર્જન (કોમા વડે અલગ કરો)</Label>
                  <Input
                    id="allergens"
                    value={formData.allergens}
                    onChange={(e) =>
                      setFormData({ ...formData, allergens: e.target.value })
                    }
                    placeholder="ઉદા., બદામ, દૂધ, ઘઉં"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    checked={formData.isAvailable}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isAvailable: e.target.checked,
                      })
                    }
                  />
                  <Label htmlFor="isAvailable">ઉપલબ્ધ</Label>
                </div>
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
                    {editingItem ? "અપડેટ કરો" : "બનાવો"}
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
              <TableHead>નામ</TableHead>
              <TableHead>કેટેગરી</TableHead>
              <TableHead>કિંમત</TableHead>
              <TableHead>તૈયારીનો સમય</TableHead>
              <TableHead>સ્થિતિ</TableHead>
              <TableHead>ક્રિયાઓ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {menuItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>₹{item.price?.toFixed(2)}</TableCell>
                <TableCell>{item.preparationTime} મિનિટ</TableCell>
                <TableCell>
                  <Badge variant={item.isAvailable ? "default" : "secondary"}>
                    {item.isAvailable ? "ઉપલબ્ધ" : "અનુપલબ્ધ"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={deletingId === item.id}
                        >
                          {deletingId === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>મેનુ આઇટમ ડિલીટ કરો</AlertDialogTitle>
                          <AlertDialogDescription>
                            શું તમે ખરેખર મેનુ આઇટમ "{item.name}" ડિલીટ કરવા માંગો છો? 
                            આ ક્રિયા પૂર્વવત્ કરી શકાશે નહીં.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={deletingId === item.id}>
                            રદ કરો
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(item.id)}
                            className="bg-red-500 hover:bg-red-600"
                            disabled={deletingId === item.id}
                          >
                            {deletingId === item.id ? (
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
        {menuItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            કોઈ મેનુ આઇટમ મળ્યું નથી. તમારું પ્રથમ મેનુ આઇટમ ઉમેરો!
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MenuManagement;
