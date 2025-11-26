import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Eye, CheckCircle, XCircle, Zap, Loader2 } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

/** ---- Types from backend (supports legacy valueEth too) ---- */
type TxItem = {
  txHash: string;
  from: string;
  to: string;
  value?: number;        // native unit (ETH or BTC)
  valueEth?: number;     // legacy FE type
  timeStamp: number;     // unix seconds
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  gasPriceGwei?: number | null;
  isMixerInvolved?: boolean;
};

type AnalyzeResponse = { count: number; items: TxItem[] };

/** ---- Data fetch (uses stored chain/address) ---- */
function useAnalyze(address: string | null, token: string | null, chain?: string | null) {
  return useQuery<AnalyzeResponse>({
    queryKey: ["alerts-analyze", address, chain, token],
    queryFn: async () => {
      const url = chain
        ? `${API}/api/analyze/${chain}/${address}?page=1&offset=50`
        : `${API}/api/analyze/${address}?page=1&offset=50`; // defaults to ETH if chain not set
      const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: Boolean(address && address.length > 0),
    refetchInterval: 15000,
    refetchOnWindowFocus: false,
  });
}

/** ---- Helpers ---- */
function timeAgo(tsSec: number) {
  if (!tsSec) return "-";
  const diffMs = Date.now() - tsSec * 1000;
  const mins = Math.max(1, Math.floor(diffMs / 60000));

  if (mins < 60) return `${mins} ${mins === 1 ? "min" : "mins"} ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 14) return `${days} ${days === 1 ? "day" : "days"} ago`;

  const weeks = Math.floor(days / 7);
  if (days < 60) return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"} ago`;

  const years = Math.floor(months / 12);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
}



type Status = "active" | "acknowledged" | "resolved";
type Severity = "critical" | "high" | "medium" | "low";

type Alert = {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  walletAddress: string;
  transactionHash: string;
  timestamp: number;
  status: Status;
  reason: string;
  amount?: number;
  from: string;
  to: string;
};

const statusKey = (address: string) => `alert_statuses_${address}`;
function loadStatuses(address: string | null): Record<string, Status> {
  if (!address) return {};
  try {
    const raw = localStorage.getItem(statusKey(address));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveStatuses(address: string, map: Record<string, Status>) {
  localStorage.setItem(statusKey(address), JSON.stringify(map));
}

/** ---- Reason/Title heuristics from available fields ---- */
function buildReasonAndTitle(t: TxItem): { title: string; reason: string; severity: Severity } {
  const val = typeof t.valueEth === "number" ? t.valueEth : (t.value ?? 0);
  const gp = typeof t.gasPriceGwei === "number" ? t.gasPriceGwei : 0;
  const selfTransfer = t.from && t.to && t.from.toLowerCase() === t.to.toLowerCase();
  const missingTo = !t.to || t.to.length === 0;

  // severity from riskScore (matches backend riskLevel buckets but adds "critical" nuance)
  const severity: Severity = t.riskScore >= 80 ? "critical" : t.riskScore >= 50 ? "high" : t.riskScore >= 30 ? "medium" : "low";

  // Build reason components
  const parts: string[] = [];
  if (val > 5) parts.push("high-value transfer");
  else if (val > 1) parts.push("large transfer");
  if (gp > 100) parts.push("elevated gas price");
  if (selfTransfer) parts.push("self-transfer behavior");
  if (missingTo) parts.push("unknown destination");
  if (t.isMixerInvolved) parts.push("known mixer involvement");
  if (parts.length === 0) parts.push("anomalous activity detected");

  // Title
  const title =
    severity === "critical"
      ? "Known Fraud Pattern Detected"
      : severity === "high"
      ? "Suspicious Transaction Pattern"
      : severity === "medium"
      ? "Unusual Transaction Activity"
      : "Low Risk Transaction";

  const reason = `${parts.join(", ")} (risk ${t.riskScore.toFixed(1)}).`;
  return { title, reason, severity };
}

/** ---- Component ---- */
const AlertsPage = () => {
  const { token } = useAuth();

  // Live sync with Transactions page selections
  const [address, setAddress] = useState<string | null>(() => localStorage.getItem("last_address"));
  const [chain, setChain] = useState<string | null>(() => localStorage.getItem("last_chain")); // "eth" | "btc" | "polygon" | "bsc"
  useEffect(() => {
    const id = setInterval(() => {
      const a = localStorage.getItem("last_address");
      const c = localStorage.getItem("last_chain");
      if (a && a !== address) setAddress(a);
      if (c !== chain) setChain(c);
    }, 1000);
    return () => clearInterval(id);
  }, [address, chain]);

  const { data, isLoading, isError, error } = useAnalyze(address, token, chain);
  const items = data?.items ?? [];

  // Persisted statuses for this address
  const [statusMap, setStatusMap] = useState<Record<string, Status>>(() => loadStatuses(address || ""));
  useEffect(() => setStatusMap(loadStatuses(address || "")), [address]);

  // Expand details toggles
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggleDetails = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // Build alerts from API items + status overrides
  const alerts: Alert[] = useMemo(() => {
    return items.map((t) => {
      const { title, reason, severity } = buildReasonAndTitle(t);
      const defaultStatus: Status = severity === "critical" || severity === "high" ? "active" : "resolved";
      const status = statusMap[t.txHash] ?? defaultStatus;
      const amount = typeof t.valueEth === "number" ? t.valueEth : t.value;

      return {
        id: t.txHash,
        title,
        description: `From ${t.from.slice(0, 10)}… to ${t.to ? t.to.slice(0, 10) + "…" : "—"} • ${amount ?? 0}`,
        severity,
        walletAddress: t.to || t.from,
        transactionHash: t.txHash,
        timestamp: t.timeStamp,
        status,
        reason,
        amount,
        from: t.from,
        to: t.to,
      };
    });
  }, [items, statusMap]);

  // Stats
  const criticalAlerts = alerts.filter((a) => a.severity === "critical").length;
  const activeAlerts = alerts.filter((a) => a.status === "active").length;
  const resolvedAlerts = alerts.filter((a) => a.status === "resolved").length;

  // UI helpers
  const getSeverityBadge = (severity: Severity) => {
    switch (severity) {
      case "critical":
        return { label: "Critical", className: "bg-destructive/20 text-destructive border-destructive/30 animate-glow", icon: Zap };
      case "high":
        return { label: "High", className: "bg-destructive/15 text-destructive border-destructive/25", icon: AlertTriangle };
      case "medium":
        return { label: "Medium", className: "bg-warning/20 text-warning border-warning/30", icon: Eye };
      default:
        return { label: "Low", className: "bg-muted/20 text-muted-foreground border-muted/30", icon: Eye };
    }
  };
  const getStatusBadge = (status: Status) => {
    switch (status) {
      case "active":
        return { label: "Active", className: "bg-primary/20 text-primary border-primary/30", icon: AlertTriangle };
      case "acknowledged":
        return { label: "Acknowledged", className: "bg-warning/20 text-warning border-warning/30", icon: Eye };
      case "resolved":
        return { label: "Resolved", className: "bg-success/20 text-success border-success/30", icon: CheckCircle };
      default:
        return { label: "Unknown", className: "bg-muted/20 text-muted-foreground border-muted/30", icon: XCircle };
    }
  };

  // Actions (persist locally; swap for API calls later if you add endpoints)
  const setStatus = (id: string, newStatus: Status) => {
    if (!address) return;
    setStatusMap((prev) => {
      const next = { ...prev, [id]: newStatus };
      saveStatuses(address, next);
      return next;
    });
  };
  const acknowledge = (id: string) => setStatus(id, "acknowledged");
  const resolve = (id: string) => setStatus(id, "resolved");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Security Alerts
          </h1>
          <p className="text-muted-foreground">
            {address ? (
              <>
                Real-time alerts for <span className="font-mono">{address}</span>
                {chain ? <> on <span className="uppercase">{chain}</span></> : null}
              </>
            ) : (
              <>Set a wallet on the Transactions page to start monitoring.</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="destructive" className={criticalAlerts > 0 ? "animate-glow" : ""}>
            {isLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Zap className="h-3 w-3 mr-1" />}
            {criticalAlerts} Critical
          </Badge>
          <Badge variant="outline" className="border-primary/30 text-primary">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {activeAlerts} Active
          </Badge>
        </div>
      </div>

      {/* Stats row (same visual style as your previous UI) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-destructive/80">Critical Alerts</p>
                <p className="text-2xl font-bold text-destructive">{criticalAlerts}</p>
              </div>
              <Zap className="h-8 w-8 text-destructive animate-glow" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary/80">Active Alerts</p>
                <p className="text-2xl font-bold text-primary">{activeAlerts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-success/30 bg-success/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-success/80">Resolved</p>
                <p className="text-2xl font-bold text-success">{resolvedAlerts}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {isError && (
        <div className="p-4 border border-destructive/30 bg-destructive/10 rounded text-destructive text-sm break-words">
          {(error as Error)?.message || "Failed to load alerts"}
        </div>
      )}

      {/* Alerts List (previous card design preserved) */}
      <div className="space-y-4">
        {isLoading && alerts.length === 0 && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Loading alerts…</CardTitle>
              <CardDescription>Please wait</CardDescription>
            </CardHeader>
          </Card>
        )}

        {!isLoading && alerts.length === 0 && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>No alerts</CardTitle>
              <CardDescription>We’ll show alerts as soon as we detect suspicious activity.</CardDescription>
            </CardHeader>
          </Card>
        )}

        {alerts.map((alert) => {
          const severityBadge = getSeverityBadge(alert.severity);
          const statusBadge = getStatusBadge(alert.status);
          const SeverityIcon = severityBadge.icon;
          const StatusIcon = statusBadge.icon;
          const isOpen = expanded.has(alert.id);

          return (
            <Card
              key={alert.id}
              className={`border-border/50 hover:shadow-lg transition-all ${
                alert.severity === "critical"
                  ? "border-destructive/30 shadow-destructive/10"
                  : alert.severity === "high"
                  ? "border-destructive/20"
                  : "border-border/50"
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={severityBadge.className}>
                        <SeverityIcon className="h-3 w-3 mr-1" />
                        {severityBadge.label}
                      </Badge>
                      <Badge className={statusBadge.className}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusBadge.label}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{alert.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {alert.description}
                    </CardDescription>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeAgo(alert.timestamp)}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="p-3 bg-secondary/50 rounded-lg border border-border/50">
                    <p className="text-sm text-foreground/80 mb-2">
                      <strong>Reason:</strong> {alert.reason}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Wallet:</span>
                        <p className="font-mono text-foreground break-all">
                          {alert.walletAddress}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Transaction:</span>
                        <p className="font-mono text-foreground break-all">
                          {alert.transactionHash}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Expandable details */}
                  {isOpen && (
                    <div className="p-3 bg-muted/20 rounded-lg border border-border/50 text-sm">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <div className="text-muted-foreground text-xs">Severity</div>
                          <div className="font-semibold capitalize">{alert.severity}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs">Status</div>
                          <div className="font-semibold capitalize">{alert.status}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs">When</div>
                          <div className="font-semibold">
                            {new Date(alert.timestamp * 1000).toLocaleString()}
                          </div>
                        </div>
                        <div className="md:col-span-3">
                          <div className="text-muted-foreground text-xs">From → To</div>
                          <div className="font-mono break-all">{alert.from} → {alert.to || "—"}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {alert.status === "active" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-primary/30 text-primary"
                          onClick={() => acknowledge(alert.id)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Acknowledge
                        </Button>
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary/90"
                          onClick={() => resolve(alert.id)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolve
                        </Button>
                      </>
                    )}
                    {alert.status === "acknowledged" && (
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-primary/90"
                        onClick={() => resolve(alert.id)}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Resolve
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => toggleDetails(alert.id)}>
                      {isOpen ? "Hide Details" : "View Details"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AlertsPage;
