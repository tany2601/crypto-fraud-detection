import { useState } from "react";
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
  CalendarIcon, 
  TrendingUp, 
  AlertTriangle, 
  Shield,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import { format as formatDate } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  AreaChart,
  Area
} from "recharts";

// Dummy data for reports
const monthlyData = [
  { month: "Jan", transactions: 45231, fraudDetected: 892, falsePositives: 23 },
  { month: "Feb", transactions: 52144, fraudDetected: 1034, falsePositives: 31 },
  { month: "Mar", transactions: 48967, fraudDetected: 967, falsePositives: 18 },
  { month: "Apr", transactions: 56789, fraudDetected: 1156, falsePositives: 42 },
  { month: "May", transactions: 61234, fraudDetected: 1203, falsePositives: 28 },
  { month: "Jun", transactions: 58456, fraudDetected: 1089, falsePositives: 35 }
];

const reportTemplates = [
  {
    id: "fraud-summary",
    name: "Fraud Detection Summary",
    description: "Comprehensive overview of fraud detection activities",
    type: "summary",
    icon: Shield,
    lastGenerated: "2024-01-20",
    size: "2.3 MB"
  },
  {
    id: "transaction-analysis",
    name: "Transaction Analysis Report", 
    description: "Detailed analysis of transaction patterns and risks",
    type: "analysis",
    icon: BarChart3,
    lastGenerated: "2024-01-19",
    size: "4.7 MB"
  },
  {
    id: "risk-assessment",
    name: "Risk Assessment Report",
    description: "Risk level breakdown and trend analysis",
    type: "assessment",
    icon: TrendingUp,
    lastGenerated: "2024-01-18",
    size: "1.8 MB"
  },
  {
    id: "compliance-audit",
    name: "Compliance Audit Report",
    description: "Regulatory compliance and audit trail documentation",
    type: "compliance",
    icon: FileText,
    lastGenerated: "2024-01-17",
    size: "3.2 MB"
  }
];

const ReportsPage = () => {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [reportType, setReportType] = useState("all");
  const [format, setFormat] = useState("pdf");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            Generate comprehensive fraud detection reports and analytics
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Download className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Generation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Configuration */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Generate New Report</CardTitle>
              <CardDescription>
                Configure and generate custom fraud detection reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date From</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
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
                        variant={"outline"}
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

              <Button className="w-full bg-primary hover:bg-primary/90">
                <FileText className="h-4 w-4 mr-2" />
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
              <CardDescription>
                Fraud detection performance over the last 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217.2, 32.6%, 17.5%)" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(215, 20.2%, 65.1%)"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(215, 20.2%, 65.1%)"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(222, 84%, 6%)",
                      border: "1px solid hsl(217.2, 32.6%, 17.5%)",
                      borderRadius: "8px"
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

        {/* Report Templates & Stats */}
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
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Detection Rate</span>
                  <span className="font-medium text-success">98.7%</span>
                </div>
                <Progress value={98.7} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">False Positives</span>
                  <span className="font-medium text-warning">1.3%</span>
                </div>
                <Progress value={1.3} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Response Time</span>
                  <span className="font-medium text-primary">&lt; 2s</span>
                </div>
                <Progress value={95} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Report Templates */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Report Templates</CardTitle>
              <CardDescription>
                Quick access to pre-configured report templates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {reportTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <div
                    key={template.id}
                    className="p-3 border border-border/50 rounded-lg hover:bg-secondary/20 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/20 rounded-lg">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {template.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {template.size}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {template.lastGenerated}
                          </span>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 shrink-0">
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;