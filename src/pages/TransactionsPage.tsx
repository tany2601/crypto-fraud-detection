import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Filter, Download, Eye, AlertTriangle, Shield, Loader2 } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

type Chain = "eth" | "btc"; // polygon/bsc can be added later when adapters are enabled

type TxItem = {
  txHash: string;
  from: string;
  to: string;
  value: number;          // native units (ETH or BTC)
  timeStamp: number;      // seconds
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  gasPriceGwei: number;
  isMixerInvolved: boolean;
};

type AnalyzeResponse = { count: number; items: TxItem[] };

function useAnalyze(chain: Chain, address: string | null, token: string | null) {
  return useQuery<AnalyzeResponse>({
    queryKey: ["analyze", chain, address, token],
    queryFn: async () => {
      const res = await fetch(`${API}/api/analyze/${chain}/${address}?page=1&offset=50`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      return res.json();
    },
    enabled: Boolean(address && address.length > 0),
    refetchInterval: 15000,
    refetchOnWindowFocus: false,
  });
}

function formatTs(ts: number) {
  if (!ts) return "-";
  const d = new Date(ts * 1000);
  return d.toLocaleString();
}

// very light heuristic — good enough for demo
function inferChainFromAddress(addr: string): Chain {
  const a = addr.trim();
  if (a.startsWith("0x") && a.length === 42) return "eth";
  const lower = a.toLowerCase();
  if (lower.startsWith("bc1") || lower.startsWith("tb1")) return "btc"; // bech32
  if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(a)) return "btc";       // legacy/segwit (base58)
  return "eth"; // default
}

function unitForChain(chain: Chain) {
  return chain === "btc" ? "BTC" : "ETH";
}

/** ---------- EXPORT HELPERS ---------- */
function toCsv(rows: TxItem[], chain: Chain) {
  // consistent column order
  const headers = ["txHash", "from", "to", `value(${unitForChain(chain)})`, "riskScore", "riskLevel", "gasPriceGwei", "timeStamp(ISO)", "isMixerInvolved"];
  const escape = (v: unknown) => {
    const s = `${v ?? ""}`;
    // quote if contains comma, quote, or newline
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = rows.map((r) => {
    const iso = r.timeStamp ? new Date(r.timeStamp * 1000).toISOString() : "";
    const cols = [
      r.txHash,
      r.from,
      r.to,
      r.value,
      r.riskScore.toFixed(2),
      r.riskLevel,
      r.gasPriceGwei ?? 0,
      iso,
      r.isMixerInvolved ? "true" : "false",
    ];
    return cols.map(escape).join(",");
  });
  // Add UTF-8 BOM for Excel compatibility
  const bom = "\uFEFF";
  return bom + [headers.join(","), ...lines].join("\n");
}

function downloadFile(content: string | Blob, filename: string, mime: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function handleExport(opts: {
  rows: TxItem[];
  chain: Chain;
  address: string | null;
  format: "csv" | "json";
  scope: "all" | "filtered";
}) {
  const { rows, chain, address, format, scope } = opts;
  const stamp = new Date().toISOString().replace(/[:T]/g, "-").split(".")[0];
  const addrPart = (address || "address").slice(0, 10);
  const base = `${chain}_${addrPart}_${stamp}_${scope}`;
  if (format === "csv") {
    const csv = toCsv(rows, chain);
    downloadFile(csv, `${base}.csv`, "text/csv;charset=utf-8");
  } else {
    downloadFile(JSON.stringify(rows, null, 2), `${base}.json`, "application/json");
  }
}
/** ------------------------------------ */

const TransactionsPage = () => {
  const { token } = useAuth();
  const [inputAddress, setInputAddress] = useState(() => localStorage.getItem("last_address") || "");
  const [activeAddress, setActiveAddress] = useState<string | null>(() => localStorage.getItem("last_address"));
  const [chain, setChain] = useState<Chain>(() => (activeAddress ? inferChainFromAddress(activeAddress) : "eth"));

  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");

  const { data, isLoading, isError, error, refetch, isFetching } = useAnalyze(chain, activeAddress, token);

  useEffect(() => {
    if (activeAddress) localStorage.setItem("last_address", activeAddress);
  }, [activeAddress]);

  const items = data?.items ?? [];

  const filtered = useMemo(() => {
    return items.filter((t) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "safe" && t.riskLevel === "low") ||
        (statusFilter === "suspicious" && t.riskLevel === "medium") ||
        (statusFilter === "fraud" && t.riskLevel === "high");

      const matchesRisk =
        riskFilter === "all" ||
        (riskFilter === "low" && t.riskScore < 50) ||
        (riskFilter === "medium" && t.riskScore >= 50 && t.riskScore < 80) ||
        (riskFilter === "high" && t.riskScore >= 80);

      return matchesStatus && matchesRisk;
    });
  }, [items, statusFilter, riskFilter]);

  const getRiskBadge = (score: number) => {
    if (score >= 80) return { label: "High", variant: "destructive" as const, icon: AlertTriangle };
    if (score >= 50) return { label: "Medium", variant: "default" as const, icon: Eye };
    return { label: "Low", variant: "secondary" as const, icon: Shield };
  };

  const getStatusBadge = (riskLevel: TxItem["riskLevel"]) => {
    switch (riskLevel) {
      case "high":
        return { label: "Fraud", className: "bg-destructive/20 text-destructive border-destructive/30" };
      case "medium":
        return { label: "Suspicious", className: "bg-warning/20 text-warning border-warning/30" };
      default:
        return { label: "Safe", className: "bg-success/20 text-success border-success/30" };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Transactions
          </h1>
          <p className="text-muted-foreground">Monitor and analyze crypto transactions in real-time</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={chain} onValueChange={(v) => setChain(v as Chain)}>
            <SelectTrigger className="w-[130px] bg-secondary/50 border-border/50">
              <SelectValue placeholder="Chain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="eth">Ethereum</SelectItem>
              <SelectItem value="btc">Bitcoin</SelectItem>
              {/* add polygon/bsc when adapters are enabled */}
            </SelectContent>
          </Select>

          <Input
            placeholder={`Enter ${chain.toUpperCase()} address (e.g., ${chain === "eth" ? "0xd8dA6B..." : "bc1..."})`}
            value={inputAddress}
            onChange={(e) => setInputAddress(e.target.value)}
            className="w-[340px] bg-secondary/50 border-border/50"
          />
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={() => {
              if (!inputAddress.trim()) return;
              const inferred = inferChainFromAddress(inputAddress);
              if (inferred !== chain) setChain(inferred);
              setActiveAddress(inputAddress.trim());
            }}
          >
            {isFetching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
            Analyze
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (activeAddress) refetch();
            }}
            className="border-border/50"
          >
            <Filter className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-primary/10 text-primary hover:bg-primary/20">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Export Filtered</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() =>
                  handleExport({ rows: filtered, chain, address: activeAddress, format: "csv", scope: "filtered" })
                }
              >
                CSV (filtered)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  handleExport({ rows: filtered, chain, address: activeAddress, format: "json", scope: "filtered" })
                }
              >
                JSON (filtered)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Export All</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() =>
                  handleExport({ rows: items, chain, address: activeAddress, format: "csv", scope: "all" })
                }
              >
                CSV (all)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  handleExport({ rows: items, chain, address: activeAddress, format: "json", scope: "all" })
                }
              >
                JSON (all)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 bg-secondary/50 border-border/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="safe">Safe</SelectItem>
                <SelectItem value="suspicious">Suspicious</SelectItem>
                <SelectItem value="fraud">Fraud</SelectItem>
              </SelectContent>
            </Select>

            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-full md:w-48 bg-secondary/50 border-border/50">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="low">Low Risk (0-49)</SelectItem>
                <SelectItem value="medium">Medium Risk (50-79)</SelectItem>
                <SelectItem value="high">High Risk (80-100)</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex-1" />
            {activeAddress && (
              <Badge variant="outline" className="border-primary/30 text-primary">
                {chain.toUpperCase()} • Monitoring: <span className="font-mono ml-2">{activeAddress}</span>
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>{isLoading ? "Loading…" : `Showing ${filtered.length} of ${items.length}`}</CardDescription>
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="p-4 border border-destructive/30 bg-destructive/10 rounded text-destructive text-sm break-words">
              {(error as Error)?.message || "Failed to load data"}
              <div className="mt-2 text-xs text-destructive/80">
                Tip: Make sure the selected chain matches the address format.
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-muted/20">
                    <TableHead>Tx Hash</TableHead>
                    <TableHead>From → To</TableHead>
                    <TableHead>Amount ({unitForChain(chain)})</TableHead>
                    <TableHead>Risk Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t) => {
                    const riskBadge = getRiskBadge(t.riskScore);
                    const statusBadge = getStatusBadge(t.riskLevel);
                    const RiskIcon = riskBadge.icon;
                    return (
                      <TableRow
                        key={t.txHash}
                        className={`border-border/50 hover:bg-muted/10 ${
                          t.riskLevel === "high"
                            ? "bg-destructive/5"
                            : t.riskLevel === "medium"
                            ? "bg-warning/5"
                            : "bg-success/5"
                        }`}
                      >
                        <TableCell className="font-mono text-xs">{t.txHash.slice(0, 10)}…</TableCell>
                        <TableCell className="font-mono text-xs">
                          <div className="truncate max-w-[280px]" title={`${t.from} → ${t.to}`}>
                            {t.from ? t.from.slice(0, 8) + "…" : "—"} → {t.to ? t.to.slice(0, 8) + "…" : "—"}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">{t.value}</TableCell>
                        <TableCell>
                          <Badge variant={riskBadge.variant} className="flex items-center gap-1">
                            <RiskIcon className="h-3 w-3" />
                            {t.riskScore.toFixed(2)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">{formatTs(t.timeStamp)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!isLoading && filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        {activeAddress ? "No transactions match your filters." : "Enter a wallet address to start analysis."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionsPage;
