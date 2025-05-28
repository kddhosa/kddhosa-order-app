import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table } from "@/types";
import { Users, Clock, Phone } from "lucide-react";

interface TableCardProps {
  table: Table;
  onClick: () => void;
}

const TableCard: React.FC<TableCardProps> = ({ table, onClick }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 border-green-300 hover:bg-green-50";
      case "occupied":
        return "bg-red-100 border-red-300 hover:bg-red-50";
      case "reserved":
        return "bg-yellow-100 border-yellow-300 hover:bg-yellow-50";
      default:
        return "bg-gray-100 border-gray-300 hover:bg-gray-50";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "occupied":
        return "bg-red-500";
      case "reserved":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTimeOccupied = () => {
    if (!table.occupiedAt) return "";
    const now = new Date();
    const diff = now.getTime() - table.occupiedAt.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1 ${getStatusColor(table.status)}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-2xl font-bold text-gray-900">
              Table {table.number}
            </h3>
            <Badge
              className={`${getStatusBadgeColor(table.status)} text-white`}
            >
              {table.status}
            </Badge>
          </div>
          <div className="flex items-center text-gray-600">
            <Users className="h-4 w-4 mr-1" />
            <span className="text-sm">{table.capacity}</span>
          </div>
        </div>

        {table.status === "occupied" && (
          <div className="space-y-2">
            <div>
              <p className="font-medium text-gray-900">{table.guestName}</p>
              <div className="flex items-center text-gray-600 text-sm">
                <Phone className="h-3 w-3 mr-1" />
                <span>{table.guestPhone}</span>
              </div>
            </div>
            {table.occupiedAt && (
              <div className="flex items-center text-orange-600 text-sm">
                <Clock className="h-3 w-3 mr-1" />
                <span>{getTimeOccupied()}</span>
              </div>
            )}
          </div>
        )}

        {table.status === "available" && (
          <p className="text-gray-500 text-sm">Click to assign guests</p>
        )}

        {table.status === "reserved" && table.guestName && (
          <div>
            <p className="font-medium text-gray-900">Reserved for:</p>
            <p className="text-gray-700">{table.guestName}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TableCard;
