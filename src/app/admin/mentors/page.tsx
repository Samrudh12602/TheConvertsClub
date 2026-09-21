"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Avatar } from "@/components/ui/avatar";
import { mentors, type Mentor } from "@/lib/data";
import { formatINR } from "@/lib/format";

export default function AdminMentorsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("All");

  const filtered = useMemo(
    () =>
      mentors.filter((m) => {
        const matchesQuery = `${m.name} ${m.college}`.toLowerCase().includes(query.toLowerCase());
        const matchesTier = tierFilter === "All" || m.tier === tierFilter;
        return matchesQuery && matchesTier;
      }),
    [query, tierFilter]
  );

  const columns: Column<Mentor>[] = [
    {
      key: "name",
      header: "Mentor",
      render: (m) => (
        <div className="flex items-center gap-3">
          <Avatar name={m.name} size={32} />
          <div>
            <p className="font-medium text-ink">{m.name}</p>
            <p className="text-xs text-muted">{m.college}</p>
          </div>
        </div>
      ),
    },
    { key: "tier", header: "Tier", render: (m) => <Badge variant="gold">{m.tier}</Badge> },
    { key: "status", header: "Status", render: (m) => <Badge variant={m.status === "active" ? "success" : "neutral"}>{m.status}</Badge> },
    { key: "workload", header: "This week", align: "right", render: (m) => <span className="tabular-nums">{m.workloadThisWeek}h</span> },
    {
      key: "rating",
      header: "Rating",
      align: "right",
      render: (m) => (
        <span className="inline-flex items-center gap-1 tabular-nums">
          <Star size={13} className="fill-accent text-accent" /> {m.rating}
        </span>
      ),
    },
    { key: "earnings", header: "Accrued", align: "right", render: (m) => <span className="tabular-nums">{formatINR(m.earningsAccrued)}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink">Mentors</h1>
      </div>

      <Card className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input placeholder="Search mentors…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} className="w-40">
          <option>All</option>
          <option>Senior</option>
          <option>Junior</option>
        </Select>
      </Card>

      <DataTable columns={columns} rows={filtered} onRowClick={(m) => router.push(`/admin/mentors/${m.id}` as never)} />
    </div>
  );
}
