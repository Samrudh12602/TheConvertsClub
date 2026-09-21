"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Avatar } from "@/components/ui/avatar";
import { students, type Student } from "@/lib/data";
import { formatDate } from "@/lib/format";

export default function AdminStudentsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [packageFilter, setPackageFilter] = useState("All");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const matchesQuery = `${s.name} ${s.email} ${s.college}`.toLowerCase().includes(query.toLowerCase());
      const matchesPackage = packageFilter === "All" || s.package === packageFilter;
      return matchesQuery && matchesPackage;
    });
  }, [query, packageFilter]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const columns: Column<Student>[] = [
    {
      key: "select",
      header: "",
      render: (s) => (
        <input
          type="checkbox"
          checked={selected.has(s.id)}
          onChange={(e) => {
            e.stopPropagation();
            toggleSelect(s.id);
          }}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 accent-[var(--gold-500)]"
        />
      ),
    },
    {
      key: "name",
      header: "Student",
      render: (s) => (
        <div className="flex items-center gap-3">
          <Avatar name={s.name} size={32} />
          <div>
            <p className="font-medium text-ink">{s.name}</p>
            <p className="text-xs text-muted">{s.college}</p>
          </div>
        </div>
      ),
    },
    { key: "package", header: "Package", render: (s) => s.package ? <Badge variant="outline">{s.package}</Badge> : <Badge variant="neutral">None</Badge> },
    { key: "mentor", header: "Mentor", render: (s) => s.assignedMentor },
    {
      key: "credits",
      header: "PI credits",
      render: (s) => (
        <span className="tabular-nums">
          {s.credits.pi.used}/{s.credits.pi.total}
        </span>
      ),
    },
    { key: "joined", header: "Joined", render: (s) => formatDate(s.joinedOn, { month: "short" }) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink">Students</h1>
        <div className="flex items-center gap-2">
          {selected.size > 0 && <Badge variant="gold">{selected.size} selected</Badge>}
          <Button variant="outline" size="sm">
            <Download size={14} /> Export CSV
          </Button>
          <Button size="sm">Add student</Button>
        </div>
      </div>

      <Card className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input placeholder="Search students…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={packageFilter} onChange={(e) => setPackageFilter(e.target.value)} className="w-48">
          <option>All</option>
          <option>Call Convert</option>
          <option>Call Convert Plus</option>
          <option>À la carte</option>
        </Select>
      </Card>

      <DataTable columns={columns} rows={filtered} onRowClick={(s) => router.push(`/admin/students/${s.id}` as never)} />
    </div>
  );
}
