import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts";
import { 
  TrendingUp, 
  Shield, 
  AlertTriangle, 
  Eye, 
  Activity,
  DollarSign,
  Users
} from "lucide-react";

// Dummy data for charts
const transactionTrends = [
  { day: "Mon", transactions: 1240, fraudulent: 23 },
  { day: "Tue", transactions: 1450, fraudulent: 31 },
  { day: "Wed", transactions: 1680, fraudulent: 18 },
  { day: "Thu", transactions: 1890, fraudulent: 42 },
  { day: "Fri", transactions: 2100, fraudulent: 15 },
  { day: "Sat", transactions: 1800, fraudulent: 28 },
  { day: "Sun", transactions: 1550, fraudulent: 12 }
];

const fraudDistribution = [
  { name: "Safe", value: 94.2, color: "hsl(142, 100%, 50%)" },
  { name: "Suspicious", value: 3.8, color: "hsl(35, 100%, 60%)" },
  { name: "Fraudulent", value: 2.0, color: "hsl(0, 100%, 67%)" }
];

const riskCategories = [
  { category: "High Risk", count: 142, color: "hsl(0, 100%, 67%)" },
  { category: "Medium Risk", count: 287, color: "hsl(35, 100%, 60%)" },
  { category: "Low Risk", count: 1891, color: "hsl(142, 100%, 50%)" }
];

const DashboardPage = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Real-time crypto fraud detection overview
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
            <div className="text-2xl font-bold text-primary">12,847</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success">↗ +12.3%</span> from last week
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:shadow-lg hover:shadow-destructive/5 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Frauds Detected</CardTitle>
            <Shield className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">169</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-destructive">↗ +2.1%</span> from last week
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:shadow-lg hover:shadow-warning/5 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallets Monitored</CardTitle>
            <Eye className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">8,942</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success">↗ +5.7%</span> from last week
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:shadow-lg hover:shadow-success/5 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Detection Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">98.7%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success">↗ +0.3%</span> accuracy improvement
            </p>
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
              Daily transaction volume and fraud detection over the past week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={transactionTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(120, 3%, 18%)" />
                <XAxis 
                  dataKey="day" 
                  stroke="hsl(215, 20.2%, 65.1%)"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(215, 20.2%, 65.1%)"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(120, 3%, 14%)",
                    border: "1px solid hsl(120, 3%, 18%)",
                    borderRadius: "8px",
                    color: "hsl(210, 40%, 98%)"
                  }}
                  labelStyle={{ color: "hsl(210, 40%, 98%)" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="transactions" 
                  stroke="hsl(195, 100%, 50%)" 
                  strokeWidth={2}
                  name="Total Transactions"
                />
                <Line 
                  type="monotone" 
                  dataKey="fraudulent" 
                  stroke="hsl(0, 100%, 67%)" 
                  strokeWidth={2}
                  name="Fraudulent"
                />
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
              Current distribution of transaction risk levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={fraudDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {fraudDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(120, 3%, 14%)",
                    border: "1px solid hsl(120, 3%, 18%)",
                    borderRadius: "8px",
                    color: "hsl(210, 40%, 98%)"
                  }}
                  labelStyle={{ color: "hsl(210, 40%, 98%)" }}
                  formatter={(value) => [`${value}%`, "Percentage"]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {fraudDistribution.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {item.name}: {item.value}%
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
          <CardDescription>
            Number of transactions by risk level in the last 24 hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={riskCategories} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(120, 3%, 18%)" />
              <XAxis 
                type="number"
                stroke="hsl(215, 20.2%, 65.1%)"
                fontSize={12}
              />
              <YAxis 
                type="category"
                dataKey="category"
                stroke="hsl(215, 20.2%, 65.1%)"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(120, 3%, 14%)",
                  border: "1px solid hsl(120, 3%, 18%)",
                  borderRadius: "8px",
                  color: "hsl(210, 40%, 98%)"
                }}
                labelStyle={{ color: "hsl(210, 40%, 98%)" }}
              />
              <Bar dataKey="count" fill="hsl(195, 100%, 50%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;