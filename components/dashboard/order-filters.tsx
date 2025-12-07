"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useState } from "react";

export function OrderFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [processing, setProcessing] = useState(
    searchParams.get("processing") === "true" ? "true" : 
    searchParams.get("status") === "COMPLETED" ? "false" : 
    "all"
  );
  const [status, setStatus] = useState(
    searchParams.get("status") && searchParams.get("status") !== "COMPLETED" 
      ? searchParams.get("status") || "all" 
      : "all"
  );

  const handleFilter = () => {
    const params = new URLSearchParams();
    
    if (search) {
      params.set("search", search);
    }
    
    if (processing && processing !== "all") {
      if (processing === "true") {
        params.set("processing", "true");
      } else if (processing === "false") {
        // Show only completed
        params.set("status", "COMPLETED");
      }
    } else if (status && status !== "all") {
      params.set("status", status);
    }
    
    router.push(`/dashboard/orders?${params.toString()}`);
  };

  const handleReset = () => {
    setSearch("");
    setProcessing("all");
    setStatus("all");
    router.push("/dashboard/orders");
  };

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by client name or phone..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleFilter();
            }
          }}
        />
      </div>
      
      <Select value={processing || "all"} onValueChange={(val) => setProcessing(val === "all" ? "" : val)}>
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder="Filter by type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Orders</SelectItem>
          <SelectItem value="true">Processing (In Development)</SelectItem>
          <SelectItem value="false">Completed Only</SelectItem>
        </SelectContent>
      </Select>

      <Select value={status || "all"} onValueChange={(val) => setStatus(val === "all" ? "" : val)}>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Specific Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="PENDING">Pending</SelectItem>
          <SelectItem value="APPROVED">Approved</SelectItem>
          <SelectItem value="REJECTED">Rejected</SelectItem>
          <SelectItem value="QUOTATION_SENT">Quotation Sent</SelectItem>
          <SelectItem value="COMPLETED">Completed</SelectItem>
          <SelectItem value="CANCELLED">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      <Button onClick={handleFilter}>Filter</Button>
      {(search || (processing && processing !== "all") || (status && status !== "all")) && (
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
      )}
    </div>
  );
}

