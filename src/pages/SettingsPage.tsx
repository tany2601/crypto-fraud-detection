import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Key, 
  Bell, 
  Shield, 
  Palette, 
  Monitor,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SettingsPage = () => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [fraudAlerts, setFraudAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);
  const { toast } = useToast();

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText("sk_live_1234567890abcdef1234567890abcdef");
    toast({
      title: "API Key Copied",
      description: "API key has been copied to clipboard",
    });
  };

  const handleGenerateNewKey = () => {
    toast({
      title: "New API Key Generated",
      description: "Your previous API key has been revoked",
    });
  };

  const handleSaveProfile = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile information has been saved successfully",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account, preferences, and integrations
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-fit">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">API Keys</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your account details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 border-2 border-primary/20">
                  <AvatarImage src="/placeholder-avatar.jpg" />
                  <AvatarFallback className="bg-primary/20 text-primary text-lg">
                    JD
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">John Doe</h3>
                  <p className="text-muted-foreground">john.doe@example.com</p>
                  <Button variant="outline" size="sm">
                    Change Avatar
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName"
                    defaultValue="John"
                    className="bg-secondary/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName"
                    defaultValue="Doe"
                    className="bg-secondary/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    type="email"
                    defaultValue="john.doe@example.com"
                    className="bg-secondary/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone"
                    defaultValue="+1 (555) 123-4567"
                    className="bg-secondary/50 border-border/50"
                  />
                </div>
              </div>

              <Button onClick={handleSaveProfile} className="bg-primary hover:bg-primary/90">
                <Save className="h-4 w-4 mr-2" />
                Save Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys */}
        <TabsContent value="api" className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>API Key Management</CardTitle>
              <CardDescription>
                Manage your API keys for external integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Production API Key</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input 
                      value={showApiKey ? "" : "sk_live_••••••••••••••••••••••••••••••••"}
                      readOnly
                      className="bg-secondary/50 border-border/50 font-mono"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="border-border/50"
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleCopyApiKey}
                      className="border-border/50"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Keep your API key secure. Do not share it in publicly accessible areas.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleGenerateNewKey}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate Key
                  </Button>
                  <Badge variant="outline" className="border-success/30 text-success">
                    Active
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">API Usage Statistics</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-secondary/20 rounded-lg border border-border/50">
                    <div className="text-2xl font-bold text-primary">2,847</div>
                    <div className="text-sm text-muted-foreground">Requests Today</div>
                  </div>
                  <div className="p-4 bg-secondary/20 rounded-lg border border-border/50">
                    <div className="text-2xl font-bold text-success">99.8%</div>
                    <div className="text-sm text-muted-foreground">Uptime</div>
                  </div>
                  <div className="p-4 bg-secondary/20 rounded-lg border border-border/50">
                    <div className="text-2xl font-bold text-warning">45ms</div>
                    <div className="text-sm text-muted-foreground">Avg Response</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how and when you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch 
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive browser push notifications
                    </p>
                  </div>
                  <Switch 
                    checked={pushNotifications}
                    onCheckedChange={setPushNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Fraud Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Immediate alerts for detected fraud
                    </p>
                  </div>
                  <Switch 
                    checked={fraudAlerts}
                    onCheckedChange={setFraudAlerts}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Automated weekly summary reports
                    </p>
                  </div>
                  <Switch 
                    checked={weeklyReports}
                    onCheckedChange={setWeeklyReports}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security and authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Change Password</Label>
                  <div className="space-y-2 mt-2">
                    <Input 
                      type="password"
                      placeholder="Current password"
                      className="bg-secondary/50 border-border/50"
                    />
                    <Input 
                      type="password"
                      placeholder="New password"
                      className="bg-secondary/50 border-border/50"
                    />
                    <Input 
                      type="password"
                      placeholder="Confirm new password"
                      className="bg-secondary/50 border-border/50"
                    />
                    <Button size="sm" className="bg-primary hover:bg-primary/90">
                      Update Password
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium">Two-Factor Authentication</Label>
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                      <Badge variant="outline" className="border-warning/30 text-warning mt-2">
                        Not Enabled
                      </Badge>
                    </div>
                    <Button variant="outline" className="border-primary/30 text-primary">
                      Enable 2FA
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium">Session Management</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border/50">
                      <div>
                        <p className="text-sm font-medium">Current Session</p>
                        <p className="text-xs text-muted-foreground">Chrome on macOS • Active now</p>
                      </div>
                      <Badge className="bg-success/20 text-success border-success/30">
                        Current
                      </Badge>
                    </div>
                    <Button variant="destructive" size="sm">
                      Sign Out All Other Sessions
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance" className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize the look and feel of your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Theme</Label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    <div className="p-4 border-2 border-primary/50 rounded-lg bg-card cursor-pointer">
                      <div className="flex items-center justify-center h-8 mb-2">
                        <Monitor className="h-6 w-6 text-primary" />
                      </div>
                      <p className="text-center text-sm font-medium">Dark</p>
                      <p className="text-center text-xs text-muted-foreground">Current</p>
                    </div>
                    <div className="p-4 border border-border/50 rounded-lg bg-card cursor-pointer opacity-50">
                      <div className="flex items-center justify-center h-8 mb-2">
                        <Monitor className="h-6 w-6" />
                      </div>
                      <p className="text-center text-sm font-medium">Light</p>
                      <p className="text-center text-xs text-muted-foreground">Coming Soon</p>
                    </div>
                    <div className="p-4 border border-border/50 rounded-lg bg-card cursor-pointer opacity-50">
                      <div className="flex items-center justify-center h-8 mb-2">
                        <Monitor className="h-6 w-6" />
                      </div>
                      <p className="text-center text-sm font-medium">Auto</p>
                      <p className="text-center text-xs text-muted-foreground">Coming Soon</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Color Scheme</Label>
                  <p className="text-sm text-muted-foreground">
                    Current theme features neon blue, green, and purple accents optimized for fraud detection workflows.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-6 h-6 rounded-full bg-primary border-2 border-primary-foreground"></div>
                    <div className="w-6 h-6 rounded-full bg-success"></div>
                    <div className="w-6 h-6 rounded-full bg-warning"></div>
                    <div className="w-6 h-6 rounded-full bg-destructive"></div>
                    <div className="w-6 h-6 rounded-full bg-accent"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;