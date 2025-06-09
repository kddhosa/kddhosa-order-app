
import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Category } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Edit, Trash2, Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const categoriesDoc = await getDoc(doc(db, "menuItems", "categories"));
      if (categoriesDoc.exists()) {
        const data = categoriesDoc.data().items as Category[];
        setCategories(data || []);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "ભૂલ",
        description: "કેટેગરીઓ લોડ કરવામાં નિષ્ફળ",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateId = () => {
    return Date.now().toString();
  };

  const saveCategories = async (updatedCategories: Category[]) => {
    try {
      setSaving(true);
      await updateDoc(doc(db, "menuItems", "categories"), {
        items: updatedCategories,
      });
      setCategories(updatedCategories);
      toast({
        title: "સફળતા",
        description: "કેટેગરીઓ સફળતાપૂર્વક અપડેટ થઈ",
      });
    } catch (error) {
      console.error("Error saving categories:", error);
      toast({
        title: "ભૂલ",
        description: "કેટેગરીઓ સેવ કરવામાં નિષ્ફળ",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "ભૂલ",
        description: "કેટેગરીનું નામ ખાલી હોઈ શકે નહીં",
        variant: "destructive",
      });
      return;
    }

    // Check if category already exists
    if (categories.some(cat => cat.category.toLowerCase() === newCategoryName.toLowerCase())) {
      toast({
        title: "ભૂલ",
        description: "કેટેગરી પહેલેથી અસ્તિત્વમાં છે",
        variant: "destructive",
      });
      return;
    }

    const newCategory: Category = {
      id: generateId(),
      category: newCategoryName.trim(),
    };

    const updatedCategories = [...categories, newCategory];
    await saveCategories(updatedCategories);
    setNewCategoryName("");
  };

  const handleEditCategory = async () => {
    if (!editCategoryName.trim() || !editingCategory) {
      toast({
        title: "ભૂલ",
        description: "કેટેગરીનું નામ ખાલી હોઈ શકે નહીં",
        variant: "destructive",
      });
      return;
    }

    // Check if category already exists (excluding current one)
    if (categories.some(cat => 
      cat.id !== editingCategory.id && 
      cat.category.toLowerCase() === editCategoryName.toLowerCase()
    )) {
      toast({
        title: "ભૂલ",
        description: "કેટેગરી પહેલેથી અસ્તિત્વમાં છે",
        variant: "destructive",
      });
      return;
    }

    const updatedCategories = categories.map(cat =>
      cat.id === editingCategory.id
        ? { ...cat, category: editCategoryName.trim() }
        : cat
    );

    await saveCategories(updatedCategories);
    setEditingCategory(null);
    setEditCategoryName("");
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const updatedCategories = categories.filter(cat => cat.id !== categoryId);
    await saveCategories(updatedCategories);
  };

  const startEdit = (category: Category) => {
    setEditingCategory(category);
    setEditCategoryName(category.category);
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditCategoryName("");
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>કેટેગરી મેનેજમેન્ટ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>કેટેગરી મેનેજમેન્ટ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Category */}
        <div className="space-y-2">
          <Label htmlFor="new-category">નવી કેટેગરી ઉમેરો</Label>
          <div className="flex gap-2">
            <Input
              id="new-category"
              placeholder="કેટેગરીનું નામ દાખલ કરો"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !saving && handleAddCategory()}
              disabled={saving}
            />
            <Button onClick={handleAddCategory} className="shrink-0" disabled={saving}>
              {saving ? (
                <Loader className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {saving ? "ઉમેરી રહ્યું છે..." : "ઉમેરો"}
            </Button>
          </div>
        </div>

        {/* Categories List */}
        <div className="space-y-2">
          <Label>હાલની કેટેગરીઓ</Label>
          {categories.length === 0 ? (
            <p className="text-gray-500 text-center py-8">કોઈ કેટેગરી મળી નથી</p>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  {editingCategory?.id === category.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editCategoryName}
                        onChange={(e) => setEditCategoryName(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && !saving && handleEditCategory()}
                        className="flex-1"
                        disabled={saving}
                      />
                      <Button size="sm" onClick={handleEditCategory} disabled={saving}>
                        {saving ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          "સેવ કરો"
                        )}
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit} disabled={saving}>
                        રદ કરો
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium capitalize">
                        {category.category}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(category)}
                          disabled={saving}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive" disabled={saving}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>કેટેગરી ડિલીટ કરો</AlertDialogTitle>
                              <AlertDialogDescription>
                                શું તમે ખરેખર કેટેગરી "{category.category}" ડિલીટ કરવા માંગો છો? 
                                આ ક્રિયા પૂર્વવત્ કરી શકાશે નહીં.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={saving}>રદ કરો</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCategory(category.id)}
                                className="bg-red-500 hover:bg-red-600"
                                disabled={saving}
                              >
                                {saving ? (
                                  <>
                                    <Loader className="h-4 w-4 mr-2 animate-spin" />
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
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryManagement;
