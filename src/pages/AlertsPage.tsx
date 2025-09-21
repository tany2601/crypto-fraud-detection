import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Eye, CheckCircle, XCircle, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Dummy alert data
const alerts = [
  {
    id: "1",
    title: "Suspicious Transaction Pattern Detected",
    description: "Multiple high-value transactions from wallet 0x742d35Cc6b5F9F3725f46r5e7A5829B320167f21",
    severity: "high" as const,
    walletAddress: "0x742d35Cc6b5F9F3725f46r5e7A5829B320167f21",
    transactionHash: "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t",
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    status: "active" as const,
    reason: "Transaction velocity exceeds normal patterns by 300%"
  },
  {
    id: "2",
    title: "Known Fraudulent Wallet Activity",
    description: "Transaction detected from wallet flagged in our fraud database",
    severity: "critical" as const,
    walletAddress: "0x8B1c2D3e4F5a6B7c8D9E0f1A2B3C4d5E6f7G8h9I",
    transactionHash: "0x5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x",
    timestamp: new Date(Date.now() - 32 * 60 * 1000), // 32 minutes ago
    status: "acknowledged" as const,
    reason: "Wallet matches known fraud pattern from previous incidents"
  },
  {
    id: "3",
    title: "Unusual Geographic Pattern",
    description: "Rapid transactions from multiple geographic locations detected",
    severity: "medium" as const,
    walletAddress: "0x3C4d5E6f7G8h9I0j1K2l3M4n5O6p7Q8r9S0t1U2v",
    transactionHash: "0x9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b",
    timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    status: "resolved" as const,
    reason: "VPN usage detected, transactions originated from 5 different countries within 10 minutes"
  },
  {
    id: "4",
    title: "Mixing Service Detection",
    description: "Transaction routed through known cryptocurrency mixing service",
    severity: "high" as const,
    walletAddress: "0x7W8x9Y0z1A2b3C4d5E6f7G8h9I0j1K2l3M4n5O6p",
    transactionHash: "0x3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f",
    timestamp: new Date(Date.now() - 67 * 60 * 1000), // 67 minutes ago
    status: "active" as const,
    reason: "Funds traced through Tornado Cash mixer before final destination"
  },
  {
    id: "5",
    title: "Smart Contract Vulnerability",
    description: "Interaction with contract containing known security vulnerabilities",
    severity: "medium" as const,
    walletAddress: "0x1Q2r3S4t5U6v7W8x9Y0z1A2b3C4d5E6f7G8h9I0j",
    transactionHash: "0x7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6j",
    timestamp: new Date(Date.now() - 89 * 60 * 1000), // 89 minutes ago
    status: "acknowledged" as const,
    reason: "Contract has reentrancy vulnerability, potential for fund drainage"
  },
  {
    id: "6",
    title: "Phishing Website Connection",
    description: "Transaction linked to wallet associated with phishing activities",
    severity: "critical" as const,
    walletAddress: "0x5K6l7M8n9O0p1Q2r3S4t5U6v7W8x9Y0z1A2b3C4d",
    transactionHash: "0x1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6j7k8l9m0n",
    timestamp: new Date(Date.now() - 123 * 60 * 1000), // 123 minutes ago
    status: "resolved" as const,
    reason: "Wallet linked to fake DeFi platform collecting user funds"
  }
];

const AlertsPage = () => {
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return { 
          label: "Critical", 
          className: "bg-destructive/20 text-destructive border-destructive/30 animate-glow",
          icon: Zap 
        };
      case "high":
        return { 
          label: "High", 
          className: "bg-destructive/15 text-destructive border-destructive/25",
          icon: AlertTriangle 
        };
      case "medium":
        return { 
          label: "Medium", 
          className: "bg-warning/20 text-warning border-warning/30",
          icon: Eye 
        };
      default:
        return { 
          label: "Low", 
          className: "bg-muted/20 text-muted-foreground border-muted/30",
          icon: Eye 
        };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return { 
          label: "Active", 
          className: "bg-primary/20 text-primary border-primary/30",
          icon: AlertTriangle 
        };
      case "acknowledged":
        return { 
          label: "Acknowledged", 
          className: "bg-warning/20 text-warning border-warning/30",
          icon: Eye 
        };
      case "resolved":
        return { 
          label: "Resolved", 
          className: "bg-success/20 text-success border-success/30",
          icon: CheckCircle 
        };
      default:
        return { 
          label: "Unknown", 
          className: "bg-muted/20 text-muted-foreground border-muted/30",
          icon: XCircle 
        };
    }
  };

  const activeAlerts = alerts.filter(alert => alert.status === "active").length;
  const criticalAlerts = alerts.filter(alert => alert.severity === "critical").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Security Alerts
          </h1>
          <p className="text-muted-foreground">
            Real-time fraud detection alerts and notifications
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge 
            variant="destructive" 
            className={criticalAlerts > 0 ? "animate-glow" : ""}
          >
            <Zap className="h-3 w-3 mr-1" />
            {criticalAlerts} Critical
          </Badge>
          <Badge variant="outline" className="border-primary/30 text-primary">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {activeAlerts} Active
          </Badge>
        </div>
      </div>

      {/* Alert Stats */}
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
                <p className="text-sm text-success/80">Resolved Today</p>
                <p className="text-2xl font-bold text-success">
                  {alerts.filter(alert => alert.status === "resolved").length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.map((alert) => {
          const severityBadge = getSeverityBadge(alert.severity);
          const statusBadge = getStatusBadge(alert.status);
          const SeverityIcon = severityBadge.icon;
          const StatusIcon = statusBadge.icon;

          return (
            <Card 
              key={alert.id} 
              className={`border-border/50 hover:shadow-lg transition-all ${
                alert.severity === 'critical' ? 'border-destructive/30 shadow-destructive/10' :
                alert.severity === 'high' ? 'border-destructive/20' :
                'border-border/50'
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
                      {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
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

                  <div className="flex items-center gap-2">
                    {alert.status === "active" && (
                      <>
                        <Button size="sm" variant="outline" className="border-primary/30 text-primary">
                          <Eye className="h-3 w-3 mr-1" />
                          Acknowledge
                        </Button>
                        <Button size="sm" className="bg-primary hover:bg-primary/90">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolve
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost">
                      View Details
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