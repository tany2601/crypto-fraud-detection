import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Download, Eye, AlertTriangle, Shield } from "lucide-react";

// Dummy transaction data
const transactions = [
  {
    id: "0x1a2b3c4d",
    walletAddress: "0x742d35Cc6b5F9F3725f46r5e7A5829B320167f21",
    amount: "2.45 BTC",
    riskScore: 95,
    status: "fraud",
    timestamp: "2024-01-20 14:32:15",
    reason: "Suspicious pattern detected"
  },
  {
    id: "0x5e6f7g8h",
    walletAddress: "0x8B1c2D3e4F5a6B7c8D9E0f1A2B3C4d5E6f7G8h9I",
    amount: "0.15 ETH",
    riskScore: 25,
    status: "safe",
    timestamp: "2024-01-20 14:28:42",
    reason: "Normal transaction pattern"
  },
  {
    id: "0x9i0j1k2l",
    walletAddress: "0x3C4d5E6f7G8h9I0j1K2l3M4n5O6p7Q8r9S0t1U2v",
    amount: "1.75 BTC",
    riskScore: 65,
    status: "suspicious",
    timestamp: "2024-01-20 14:25:33",
    reason: "High-value transaction from new wallet"
  },
  {
    id: "0x3m4n5o6p",
    walletAddress: "0x7W8x9Y0z1A2b3C4d5E6f7G8h9I0j1K2l3M4n5O6p",
    amount: "0.05 BTC",
    riskScore: 15,
    status: "safe",
    timestamp: "2024-01-20 14:22:18",
    reason: "Regular user activity"
  },
  {
    id: "0x7q8r9s0t",
    walletAddress: "0x1Q2r3S4t5U6v7W8x9Y0z1A2b3C4d5E6f7G8h9I0j",
    amount: "5.20 ETH",
    riskScore: 88,
    status: "fraud",
    timestamp: "2024-01-20 14:18:27",
    reason: "Multiple red flags detected"
  },
  {
    id: "0x1u2v3w4x",
    walletAddress: "0x5K6l7M8n9O0p1Q2r3S4t5U6v7W8x9Y0z1A2b3C4d",
    amount: "0.30 BTC",
    riskScore: 45,
    status: "suspicious",
    timestamp: "2024-01-20 14:15:55",
    reason: "Unusual timing pattern"
  }
];

const TransactionsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");

  const getRiskBadge = (score: number) => {
    if (score >= 80) return { label: "High", variant: "destructive" as const, icon: AlertTriangle };
    if (score >= 50) return { label: "Medium", variant: "default" as const, icon: Eye };
    return { label: "Low", variant: "secondary" as const, icon: Shield };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "fraud":
        return { label: "Fraud", className: "bg-destructive/20 text-destructive border-destructive/30" };
      case "suspicious":
        return { label: "Suspicious", className: "bg-warning/20 text-warning border-warning/30" };
      case "safe":
        return { label: "Safe", className: "bg-success/20 text-success border-success/30" };
      default:
        return { label: "Unknown", className: "bg-muted/20 text-muted-foreground border-muted/30" };
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.walletAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    const matchesRisk = riskFilter === "all" || 
                       (riskFilter === "high" && transaction.riskScore >= 80) ||
                       (riskFilter === "medium" && transaction.riskScore >= 50 && transaction.riskScore < 80) ||
                       (riskFilter === "low" && transaction.riskScore < 50);
    
    return matchesSearch && matchesStatus && matchesRisk;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Transactions
          </h1>
          <p className="text-muted-foreground">
            Monitor and analyze crypto transactions in real-time
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
          <CardDescription>
            Filter transactions by status, risk level, or search by wallet address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by wallet address or transaction ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-secondary/50 border-border/50"
                />
              </div>
            </div>
            
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
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Showing {filteredTransactions.length} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-muted/20">
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Wallet Address</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => {
                  const riskBadge = getRiskBadge(transaction.riskScore);
                  const statusBadge = getStatusBadge(transaction.status);
                  const RiskIcon = riskBadge.icon;
                  
                  return (
                    <TableRow 
                      key={transaction.id} 
                      className={`border-border/50 hover:bg-muted/10 ${
                        transaction.status === 'fraud' ? 'bg-destructive/5' :
                        transaction.status === 'suspicious' ? 'bg-warning/5' :
                        'bg-success/5'
                      }`}
                    >
                      <TableCell className="font-mono text-sm">
                        {transaction.id}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <div className="truncate max-w-32" title={transaction.walletAddress}>
                          {transaction.walletAddress}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {transaction.amount}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={riskBadge.variant} className="flex items-center gap-1">
                            <RiskIcon className="h-3 w-3" />
                            {transaction.riskScore}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusBadge.className}>
                          {statusBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {transaction.timestamp}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionsPage;