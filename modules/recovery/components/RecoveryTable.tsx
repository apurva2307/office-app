"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RecoveryStatus } from "@prisma/client"; // This might error if generation failed
import { format } from "date-fns";
import { Plus, Search } from "lucide-react";

// Types (Mirroring Prisma for now to avoid build errors if generation failed)
type RecoveryCase = {
  id: string;
  title: string;
  amount: { toString: () => string } | number;
  status: RecoveryStatus;
  employeeNumber?: string | null;
  employeeName?: string | null;
  employeeDesignation?: string | null;
  createdAt: Date;
  assignedTo?: { fullName: string } | null;
};

export function RecoveryTable({ data }: { data: any[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recovery Cases</CardTitle>
        <div className="flex gap-2">
          {/* Add Filters here later */}
          {/* <Button><Plus className="mr-2 h-4 w-4" /> New Case</Button> */}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No recoveries found
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{item.employeeName || 'N/A'}</span>
                      <span className="text-xs text-muted-foreground">{item.employeeNumber || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>₹{item.amount.toString()}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.status === "RECOVERED" ? "default" : "secondary"
                      }
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.assignedTo?.fullName || "Unassigned"}
                  </TableCell>
                  <TableCell>
                    {format(new Date(item.createdAt), "MMM d, yyyy")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
