
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Phone, Users, MessageSquare, Loader2 } from "lucide-react";

interface GuestRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    phone: string;
    guests: number;
    notes?: string;
  }) => void;
  tableNumber?: number;
  isLoading: boolean;
}

const GuestRegistrationModal: React.FC<GuestRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  tableNumber,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    guests: 1,
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "મહેમાનનું નામ આવશ્યક છે";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "ફોન નંબર આવશ્યક છે";
    } else if (!/^\+?[\d\s\-()]+$/.test(formData.phone)) {
      newErrors.phone = "કૃપા કરીને માન્ય ફોન નંબર દાખલ કરો";
    }

    if (formData.guests < 1) {
      newErrors.guests = "મહેમાનોની સંખ્યા ઓછામાં ઓછી 1 હોવી જોઈએ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
      // Reset form
      setFormData({ name: "", phone: "", guests: 1, notes: "" });
      setErrors({});
    }
  };

  const handleClose = () => {
    setFormData({ name: "", phone: "", guests: 1, notes: "" });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            મહેમાન નોંધણી - ટેબલ {tableNumber}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              મહેમાનનું નામ *
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="name"
                type="text"
                placeholder="મહેમાનનું નામ દાખલ કરો"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className={`pl-10 ${errors.name ? "border-red-500 focus:border-red-500" : ""}`}
              />
            </div>
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="phone"
              className="text-sm font-medium text-gray-700"
            >
              ફોન નંબર *
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className={`pl-10 ${errors.phone ? "border-red-500 focus:border-red-500" : ""}`}
              />
            </div>
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="guests"
              className="text-sm font-medium text-gray-700"
            >
              મહેમાનોની સંખ્યા
            </Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="guests"
                type="number"
                min="1"
                placeholder="1"
                value={formData.guests}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    guests: parseInt(e.target.value) || 1,
                  })
                }
                className={`pl-10 ${errors.guests ? "border-red-500 focus:border-red-500" : ""}`}
              />
            </div>
            {errors.guests && (
              <p className="text-red-500 text-xs mt-1">{errors.guests}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="notes"
              className="text-sm font-medium text-gray-700"
            >
              વિશેષ વિનંતીઓ (વૈકલ્પિક)
            </Label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
              <Textarea
                id="notes"
                placeholder="કોઈ વિશેષ વિનંતીઓ અથવા નોંધો..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="pl-10 min-h-[80px]"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isLoading}
            >
              રદ કરો
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                "મહેમાન નોંધણી કરો"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GuestRegistrationModal;
