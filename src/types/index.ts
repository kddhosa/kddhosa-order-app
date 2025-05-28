export type TableStatus = "available" | "occupied" | "reserved";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "served";
export type BillStatus = "pending" | "paid";
export type PaymentMethod = "cash" | "card";
export type UserRole = "waiter" | "chef" | "reception";

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  guestName?: string;
  guestPhone?: string;
  occupiedAt?: Date;
  waiterId?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isAvailable: boolean;
  imageUrl?: string;
  preparationTime: number;
  allergens: string[];
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  category: string;
}

export interface Order {
  id: string;
  tableId: string;
  tableNumber: number;
  guestName: string;
  waiterId: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  servedAt?: Date;
}

export interface Bill {
  id: string;
  tableId: string;
  tableNumber: number;
  guestName: string;
  orders: string[];
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: BillStatus;
  generatedAt: Date;
  paidAt?: Date;
  paymentMethod?: PaymentMethod;
}

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
}

export interface Category {
  id: string;
  category: string
}