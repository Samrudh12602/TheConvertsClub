"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { StatusChip, type SessionStatus } from "@/components/ui/status-chip";
import { Drawer } from "@/components/ui/drawer";
import { sessions as ALL_SESSIONS, type Session } from "@/lib/data";
import { formatDate } from "@/lib/format";

export function AdminSessionsClient() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState<Session | null>(null);

  const filtered = useMemo(
    () =>
      ALL_SESSIONS.filter((s) => {
        const matchesQuery = `${s.studentName} ${s.mentorName} ${s.type}`.toLowerCase().includes(query.toLowerCase());
        const matchesStatus = statusFilter === "All" || s.status === statusFilter;
        return matchesQuery && matchesStatus;
      }),
    [query, statusFilter]
  );

  const columns: Column<Session>[] = [
    { key: "type", header: "Type", render: (s) => <span className="font-medium">{s.type}</span> },
    { key: "student", header: "Student", render: (s) => s.studentName },
    { key: "mentor", header: "Mentor", render: (s) => s.mentorName },
    { key: "date", header: "Date", render: (s) => formatDate(s.date, { month: "short" }) },
    { key: "time", header: "Time", render: (s) => s.startTime },
    { key: "status", header: "Status", render: (s) => <StatusChip status={s.status} /> },
  ];

  const STATUSES: SessionStatus[] = ["requested", "confirmed", "in-progress", "completed", "feedback-pending", "cancelled", "no-show", "rescheduled"];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-ink">All sessions</h1>

      <Card className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input placeholder="Search by student, mentor, type…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-52">
          <option>All</option>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
      </Card>

      <DataTable columns={columns} rows={filtered} onRowClick={setSelected} />

      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.type} subtitle={selected ? `${selected.studentName} × ${selected.mentorName}` : undefined}>
        {selected && (
          <div className="space-y-6">
            <StatusChip status={selected.status} />
            <p className="text-sm text-muted">
              {formatDate(selected.date, { weekday: "long", month: "long" })} · {selected.startTime}
              {selected.endTime !== "—" && `–${selected.endTime}`} IST
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <Button variant="outline">Reassign</Button>
              <Button variant="outline">Reschedule</Button>
              <Button variant="outline">Mark complete</Button>
              <Button variant="danger">Cancel</Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
