"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";

interface ReviewRow {
  id: string;
  student: string;
  type: "WAT" | "SOP";
  assignedTo: string;
  due: string;
  status: "Submitted" | "In review" | "Overdue";
}

const ROWS: ReviewRow[] = [
  { id: "r1", student: "Ananya Iyer", type: "WAT", assignedTo: "Ananya Iyer (mentor)", due: "Today, 8 PM", status: "In review" },
  { id: "r2", student: "Sanya Kapoor", type: "SOP", assignedTo: "Meera Nair", due: "Tomorrow, 6 PM", status: "In review" },
  { id: "r3", student: "Vikram Suresh", type: "WAT", assignedTo: "Rohan Bhatia", due: "Yesterday", status: "Overdue" },
  { id: "r4", student: "Aarav Mehta", type: "SOP", assignedTo: "Ishaan Kapoor", due: "18 Sep", status: "Overdue" },
];

const columns: Column<ReviewRow>[] = [
  { key: "student", header: "Student", render: (r) => r.student },
  { key: "type", header: "Type", render: (r) => <Badge variant={r.type === "WAT" ? "info" : "violet"}>{r.type}</Badge> },
  { key: "assignedTo", header: "Assigned to", render: (r) => r.assignedTo },
  { key: "due", header: "Due", render: (r) => r.due },
  { key: "status", header: "Status", render: (r) => <Badge variant={r.status === "Overdue" ? "danger" : "warning"}>{r.status}</Badge> },
];

export default function AdminReviewsPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Reviews queue</h1>
      <Card padding="sm">
        <p className="text-sm text-muted px-1 pb-1">{ROWS.filter((r) => r.status === "Overdue").length} overdue reviews need reassignment.</p>
      </Card>
      <DataTable columns={columns} rows={ROWS} />
    </div>
  );
}
