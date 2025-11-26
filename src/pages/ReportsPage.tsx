import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  Download,
  Calendar as CalendarIcon,
  TrendingUp,
  AlertTriangle,
  Shield,
  BarChart3,
  PieChart,
  Activity,
  Loader2,
} from "lucide-react";
import { format as formatDate } from "date-fns";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useAuth } from "@/auth/AuthContext";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

type Chain = "eth" | "btc";

type MonthlyPoint = {
  month: string;              // e.g. 'Jan'
  transactions: number;
  fraudDetected: number;
  falsePositives: number;
};

type MonthlyReportResp = {
  points: MonthlyPoint[];
};

type QuickStatsResp = {
  detectionRatePct: number;      // e.g. 98.7
  falsePositivePct: number;      // e.g. 1.3
  responseP95Ms: number;         // e.g. 1800
  criticalCount: number;
  activeCount: number;
  resolvedToday: number;
};

type Template = {
  id: string;
  name: string;
  description: string;
  type: "summary" | "analysis" | "assessment" | "compliance";
  icon: "Shield" | "BarChart3" | "TrendingUp" | "FileText" | "PieChart";
  lastGenerated: string; // ISO date
  size: string;          // e.g. "2.3 MB"
  downloadUrl?: string;  // optional direct URL from API
};

function iconForTemplate(icon: Template["icon"]) {
  switch (icon) {
    case "Shield": return Shield;
    case "BarChart3": return BarChart3;
    case "TrendingUp": return TrendingUp;
    case "FileText": return FileText;
    case "PieChart": return PieChart;
    default: return FileText;
  }
}

/** Utils */
function openDownload(url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Hooks that call the API */
function useMonthly(chain: Chain, address: string | null, token: string | null, months = 6) {
  return useQuery<MonthlyReportResp>({
    queryKey: ["reports-monthly", chain, address, months, token],
    queryFn: async () => {
      const url = new URL(`${API}/api/reports/monthly`);
      if (address) url.searchParams.set("address", address);
      url.searchParams.set("chain", chain);
      url.searchParams.set("months", String(months));
      const res = await fetch(url.toString(), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: Boolean(address),
    refetchOnWindowFocus: false,
  });
}

function useQuickStats(chain: Chain, address: string | null, token: string | null) {
  return useQuery<QuickStatsResp>({
    queryKey: ["reports-quick-stats", chain, address, token],
    queryFn: async () => {
      const url = new URL(`${API}/api/reports/quick-stats`);
      if (address) url.searchParams.set("address", address);
      url.searchParams.set("chain", chain);
      const res = await fetch(url.toString(), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: Boolean(address),
    refetchInterval: 15000,
    refetchOnWindowFocus: false,
  });
}

function useTemplates(token: string | null) {
  return useQuery<{ templates: Template[] }>({
    queryKey: ["reports-templates", token],
    queryFn: async () => {
      const res = await fetch(`${API}/api/reports/templates`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    refetchOnWindowFocus: false,
  });
}

function useGenerateReport(token: string | null) {
  return useMutation<
    { reportId: string; status: "queued" | "ready"; downloadUrl?: string },
    Error,
    { from?: string; to?: string; reportType: string; format: string; chain: Chain; address: string | null }
  >({
    mutationFn: async (body) => {
      const res = await fetch(`${API}/api/reports/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });
}

const ReportsPage = () => {
  const { token } = useAuth();

  // Reuse the monitored address saved by Transactions page
  const [address, setAddress] = useState<string | null>(() => localStorage.getItem("last_address"));
  const [chain, setChain] = useState<Chain>(() => {
    const a = localStorage.getItem("last_address") || "";
    if (a.startsWith("0x") && a.length === 42) return "eth";
    const lower = a.toLowerCase();
    if (lower.startsWith("bc1") || lower.startsWith("tb1")) return "btc";
    return "eth";
  });

  useEffect(() => {
    // keep in sync if user changes address on other pages
    const id = setInterval(() => {
      const stored = localStorage.getItem("last_address");
      if (stored && stored !== address) setAddress(stored);
    }, 1000);
    return () => clearInterval(id);
  }, [address]);

  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [reportType, setReportType] = useState("all");
  const [format, setFormat] = useState("pdf");

  const months = 6;
  const { data: monthly, isLoading: monthlyLoading, isError: monthlyErr, error: monthlyErrObj } =
    useMonthly(chain, address, token, months);
  const { data: quick, isLoading: quickLoading, isError: quickErr, error: quickErrObj } =
    useQuickStats(chain, address, token);
  const { data: tpl, isLoading: tplLoading, isError: tplErr, error: tplErrObj } =
    useTemplates(token);

  const gen = useGenerateReport(token);

  const monthlyData = useMemo<MonthlyPoint[]>(
    () => monthly?.points ?? [],
    [monthly]
  );

  const IconForType = (t: Template["type"]) => {
    switch (t) {
      case "summary": return Shield;
      case "analysis": return BarChart3;
      case "assessment": return TrendingUp;
      case "compliance": return FileText;
      default: return FileText;
    }
  };

  const handleGenerate = async () => {
    const body = {
      from: dateFrom ? dateFrom.toISOString().slice(0, 10) : undefined,
      to: dateTo ? dateTo.toISOString().slice(0, 10) : undefined,
      reportType,
      format,
      chain,
      address,
    };
    const res = await gen.mutateAsync(body);
    // If server returns a direct download URL, open it.
    if (res.downloadUrl) openDownload(res.downloadUrl);
    // Otherwise you could poll /download/:id until ready. (Optional)
  };

  const criticalAlerts = quick?.criticalCount ?? 0;
  const activeAlerts = quick?.activeCount ?? 0;
  const resolvedToday = quick?.resolvedToday ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            {address ? (
              <>For <span className="font-mono">{chain.toUpperCase()} • {address}</span></>
            ) : (
              <>Set a wallet on the Transactions page to start.</>
            )}
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90" onClick={handleGenerate} disabled={gen.isPending || !address}>
          {gen.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
          Generate Report
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Generation + Monthly Trends */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Configuration */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Generate New Report</CardTitle>
              <CardDescription>Configure and generate custom fraud detection reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Report Type</label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger className="bg-secondary/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Reports</SelectItem>
                      <SelectItem value="fraud-summary">Fraud Summary</SelectItem>
                      <SelectItem value="transaction-analysis">Transaction Analysis</SelectItem>
                      <SelectItem value="risk-assessment">Risk Assessment</SelectItem>
                      <SelectItem value="compliance-audit">Compliance Audit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Format</label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger className="bg-secondary/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Report</SelectItem>
                      <SelectItem value="csv">CSV Data</SelectItem>
                      <SelectItem value="xlsx">Excel Spreadsheet</SelectItem>
                      <SelectItem value="json">JSON Export</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Chain</label>
                  <Select value={chain} onValueChange={(v) => setChain(v as Chain)}>
                    <SelectTrigger className="bg-secondary/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eth">Ethereum</SelectItem>
                      <SelectItem value="btc">Bitcoin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date From</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-secondary/50 border-border/50",
                          !dateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? formatDate(dateFrom, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Date To</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-secondary/50 border-border/50",
                          !dateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? formatDate(dateTo, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <Button className="w-full bg-primary hover:bg-primary/90" onClick={handleGenerate} disabled={gen.isPending || !address}>
                {gen.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                Generate Report
              </Button>
            </CardContent>
          </Card>

          {/* Monthly Trends Chart */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Monthly Fraud Detection Trends
              </CardTitle>
              <CardDescription>Fraud detection performance over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyErr && (
                <div className="p-3 text-sm rounded border border-destructive/30 bg-destructive/10 text-destructive">
                  {(monthlyErrObj as Error)?.message || "Failed to load monthly report"}
                </div>
              )}
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217.2, 32.6%, 17.5%)" />
                  <XAxis dataKey="month" stroke="hsl(215, 20.2%, 65.1%)" fontSize={12} />
                  <YAxis stroke="hsl(215, 20.2%, 65.1%)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(222, 84%, 6%)",
                      border: "1px solid hsl(217.2, 32.6%, 17.5%)",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="transactions"
                    stackId="1"
                    stroke="hsl(195, 100%, 50%)"
                    fill="hsl(195, 100%, 50%)"
                    fillOpacity={0.1}
                    name="Total Transactions"
                  />
                  <Area
                    type="monotone"
                    dataKey="fraudDetected"
                    stackId="2"
                    stroke="hsl(0, 100%, 67%)"
                    fill="hsl(0, 100%, 67%)"
                    fillOpacity={0.1}
                    name="Fraud Detected"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Quick Stats + Templates */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {quickErr && (
                <div className="p-3 text-sm rounded border border-destructive/30 bg-destructive/10 text-destructive">
                  {(quickErrObj as Error)?.message || "Failed to load quick stats"}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Detection Rate</span>
                  <span className="font-medium text-success">
                    {quickLoading ? "…" : `${(quick?.detectionRatePct ?? 0).toFixed(1)}%`}
                  </span>
                </div>
                <Progress value={quick?.detectionRatePct ?? 0} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">False Positives</span>
                  <span className="font-medium text-warning">
                    {quickLoading ? "…" : `${(quick?.falsePositivePct ?? 0).toFixed(1)}%`}
                  </span>
                </div>
                <Progress value={quick?.falsePositivePct ?? 0} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Response Time (p95)</span>
                  <span className="font-medium text-primary">
                    {quickLoading ? "…" : `< ${Math.round((quick?.responseP95Ms ?? 0) / 1000)}s`}
                  </span>
                </div>
                <Progress value={95} className="h-2" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-destructive/80">Critical</p>
                        <p className="text-xl font-bold text-destructive">{criticalAlerts}</p>
                      </div>
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-primary/80">Active</p>
                        <p className="text-xl font-bold text-primary">{activeAlerts}</p>
                      </div>
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-success/30 bg-success/5">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-success/80">Resolved Today</p>
                        <p className="text-xl font-bold text-success">{resolvedToday}</p>
                      </div>
                      <Shield className="h-5 w-5 text-success" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Report Templates */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Report Templates</CardTitle>
              <CardDescription>Quick access to pre-configured report templates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {tplErr && (
                <div className="p-3 text-sm rounded border border-destructive/30 bg-destructive/10 text-destructive">
                  {(tplErrObj as Error)?.message || "Failed to load templates"}
                </div>
              )}
              {(tpl?.templates ?? []).map((template) => {
                const Icon = iconForTemplate(template.icon) || IconForType(template.type);
                return (
                  <div
                    key={template.id}
                    className="p-3 border border-border/50 rounded-lg hover:bg-secondary/20 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/20 rounded-lg">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{template.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">{template.size}</Badge>
                          <span className="text-xs text-muted-foreground">{template.lastGenerated}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 shrink-0"
                        onClick={() => {
                          // Prefer direct URL if provided; else hit download endpoint by id.
                          if (template.downloadUrl) {
                            openDownload(template.downloadUrl);
                          } else {
                            openDownload(`${API}/api/reports/download/${template.id}`);
                          }
                        }}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {tplLoading && <div className="text-sm text-muted-foreground">Loading templates…</div>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
