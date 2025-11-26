import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from "recharts";
import { TrendingUp, Shield, AlertTriangle, Eye, Activity, DollarSign, Users, Loader2 } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

type TxItem = {
  txHash: string;
  from: string;
  to: string;
  valueEth: number;
  timeStamp: number;
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  gasPriceGwei: number;
  isMixerInvolved: boolean;
};
type AnalyzeResponse = { count: number; items: TxItem[] };

function useAnalyze(address: string | null, token: string | null) {
  return useQuery<AnalyzeResponse>({
    queryKey: ["dashboard-analyze", address, token],
    queryFn: async () => {
      const res = await fetch(`${API}/api/analyze/${address}?page=1&offset=50`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: Boolean(address && address.length > 0),
    refetchInterval: 15000,
    refetchOnWindowFocus: false,
  });
}

const DashboardPage = () => {
  const { token } = useAuth();
  const [address, setAddress] = useState<string | null>(() => localStorage.getItem("last_address"));

  // stay synced with changes from Transactions page
  useEffect(() => {
    const id = setInterval(() => {
      const stored = localStorage.getItem("last_address");
      if (stored && stored !== address) setAddress(stored);
    }, 1000);
    return () => clearInterval(id);
  }, [address]);

  const { data, isLoading, isError } = useAnalyze(address, token);
  const items = data?.items ?? [];

  // KPI calculations
  const totalTx = items.length;
  const fraudCount = items.filter((t) => t.riskLevel === "high").length;
  const suspiciousCount = items.filter((t) => t.riskLevel === "medium").length;
  const safeCount = items.filter((t) => t.riskLevel === "low").length;

  const detectionRate = totalTx ? ((fraudCount + suspiciousCount) / totalTx) * 100 : 0;

  // Trend chart (group by hour)
  const transactionTrends = useMemo(() => {
    const byHour = new Map<string, { transactions: number; fraudulent: number }>();
    for (const t of items) {
      const d = new Date(t.timeStamp * 1000);
      const key = d.toLocaleString(undefined, { month: "short", day: "2-digit", hour: "2-digit" });
      const cur = byHour.get(key) || { transactions: 0, fraudulent: 0 };
      cur.transactions += 1;
      if (t.riskLevel === "high") cur.fraudulent += 1;
      byHour.set(key, cur);
    }
    return Array.from(byHour.entries()).map(([day, v]) => ({ day, ...v }));
  }, [items]);

  const fraudDistribution = useMemo(
    () => [
      { name: "Safe", value: totalTx ? (safeCount / totalTx) * 100 : 0, color: "hsl(142, 100%, 50%)" },
      { name: "Suspicious", value: totalTx ? (suspiciousCount / totalTx) * 100 : 0, color: "hsl(35, 100%, 60%)" },
      { name: "Fraudulent", value: totalTx ? (fraudCount / totalTx) * 100 : 0, color: "hsl(0, 100%, 67%)" },
    ],
    [totalTx, safeCount, suspiciousCount, fraudCount]
  );

  const riskCategories = useMemo(
    () => [
      { category: "High Risk", count: fraudCount, color: "hsl(0, 100%, 67%)" },
      { category: "Medium Risk", count: suspiciousCount, color: "hsl(35, 100%, 60%)" },
      { category: "Low Risk", count: safeCount, color: "hsl(142, 100%, 50%)" },
    ],
    [fraudCount, suspiciousCount, safeCount]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            {address ? (
              <>Live overview for <span className="font-mono">{address}</span></>
            ) : (
              <>Set a wallet on the Transactions page to start monitoring.</>
            )}
          </p>
        </div>
        <Badge variant="outline" className="border-primary/30 text-primary">
          <Activity className="h-3 w-3 mr-1" />
          Live Monitoring
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border/50 hover:shadow-lg hover:shadow-primary/5 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : totalTx}</div>
            <p className="text-xs text-muted-foreground">
              {address ? "Last fetched window" : "Set an address to begin"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:shadow-lg hover:shadow-destructive/5 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Frauds Detected</CardTitle>
            <Shield className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{fraudCount}</div>
            <p className="text-xs text-muted-foreground">High risk items</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:shadow-lg hover:shadow-warning/5 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspicious</CardTitle>
            <Eye className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{suspiciousCount}</div>
            <p className="text-xs text-muted-foreground">Medium risk items</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:shadow-lg hover:shadow-success/5 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Detection Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{detectionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">High + Medium / Total</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Trends Chart */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Transaction Trends
            </CardTitle>
            <CardDescription>
              Volume and detected fraud by hour (current window)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={transactionTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(120, 3%, 18%)" />
                <XAxis dataKey="day" stroke="hsl(215, 20.2%, 65.1%)" fontSize={12} />
                <YAxis stroke="hsl(215, 20.2%, 65.1%)" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(120, 3%, 14%)", border: "1px solid hsl(120, 3%, 18%)", borderRadius: "8px", color: "hsl(210, 40%, 98%)" }} labelStyle={{ color: "hsl(210, 40%, 98%)" }} />
                <Line type="monotone" dataKey="transactions" stroke="hsl(195, 100%, 50%)" strokeWidth={2} name="Total" />
                <Line type="monotone" dataKey="fraudulent" stroke="hsl(0, 100%, 67%)" strokeWidth={2} name="Fraudulent" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fraud Distribution Pie Chart */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Security Status Distribution
            </CardTitle>
            <CardDescription>
              Distribution across risk levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={fraudDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {fraudDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(120, 3%, 14%)", border: "1px solid hsl(120, 3%, 18%)", borderRadius: "8px", color: "hsl(210, 40%, 98%)" }} labelStyle={{ color: "hsl(210, 40%, 98%)" }} formatter={(value: number) => [`${value.toFixed(1)}%`, "Percentage"]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {fraudDistribution.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-muted-foreground">
                    {item.name}: {item.value.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Categories Bar Chart */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Risk Category Breakdown
          </CardTitle>
          <CardDescription>Counts by risk level (current window)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={riskCategories} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(120, 3%, 18%)" />
              <XAxis type="number" stroke="hsl(215, 20.2%, 65.1%)" fontSize={12} />
              <YAxis type="category" dataKey="category" stroke="hsl(215, 20.2%, 65.1%)" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(120, 3%, 14%)", border: "1px solid hsl(120, 3%, 18%)", borderRadius: "8px", color: "hsl(210, 40%, 98%)" }} />
              <Bar dataKey="count" fill="hsl(195, 100%, 50%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
