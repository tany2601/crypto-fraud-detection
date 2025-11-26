import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Save,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/auth/AuthContext";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

/* ----------------------------- Types & helpers ---------------------------- */

type UserMe = {
  id: number;
  email: string;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
};

type ApiKeyMeta = {
  masked: string;         // e.g. "sk_live_•••••••••••••••••••••••1234"
  createdAt?: string;
  active?: boolean;
};

type Notifications = {
  emailNotifications: boolean;
  pushNotifications: boolean;
  fraudAlerts: boolean;
  weeklyReports: boolean;
};

function authFetch(url: string, token: string | null, init?: RequestInit) {
  return fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

function errText(e: unknown) {
  if (e instanceof Error) return e.message;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

/* --------------------------------- Hooks --------------------------------- */

function useMe(token: string | null) {
  return useQuery<UserMe>({
    queryKey: ["me", token],
    queryFn: async () => {
      const r = await authFetch(`${API}/auth/me`, token);
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    enabled: !!token,
    staleTime: 30_000,
  });
}

function useProfileUpdate(token: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<UserMe>) => {
      const r = await authFetch(`${API}/api/settings/profile`, token, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

function useApiKey(token: string | null) {
  return useQuery<ApiKeyMeta>({
    queryKey: ["api-key", token],
    queryFn: async () => {
      const r = await authFetch(`${API}/api/settings/api-key`, token);
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    enabled: !!token,
  });
}

function useApiKeyReveal(token: string | null) {
  return useMutation<{ apiKey: string }>({
    mutationFn: async () => {
      const r = await authFetch(`${API}/api/settings/api-key/reveal`, token, { method: "POST" });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
  });
}

function useApiKeyRotate(token: string | null) {
  const qc = useQueryClient();
  return useMutation<{ apiKey: string }>({
    mutationFn: async () => {
      const r = await authFetch(`${API}/api/settings/api-key/rotate`, token, { method: "POST" });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-key"] });
    },
  });
}

function useNotifications(token: string | null) {
  return useQuery<Notifications>({
    queryKey: ["notifications", token],
    queryFn: async () => {
      const r = await authFetch(`${API}/api/settings/notifications`, token);
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    enabled: !!token,
  });
}

function useNotificationsUpdate(token: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Notifications) => {
      const r = await authFetch(`${API}/api/settings/notifications`, token, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

function useChangePassword(token: string | null) {
  return useMutation({
    mutationFn: async (body: { current: string; new: string }) => {
      const r = await authFetch(`${API}/api/settings/security/change-password`, token, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
  });
}

function useSignoutOthers(token: string | null) {
  return useMutation({
    mutationFn: async () => {
      const r = await authFetch(`${API}/api/settings/security/signout-others`, token, {
        method: "POST",
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
  });
}

/* --------------------------------- Page ---------------------------------- */

const SettingsPage = () => {
  const { token, user } = useAuth();
  const { toast } = useToast();

  // Profile
  const me = useMe(token);
  const updateProfile = useProfileUpdate(token);

  // API key
  const apiKey = useApiKey(token);
  const revealKey = useApiKeyReveal(token);
  const rotateKey = useApiKeyRotate(token);

  // Notifications
  const notif = useNotifications(token);
  const saveNotif = useNotificationsUpdate(token);

  // Security
  const changePw = useChangePassword(token);
  const signoutOthers = useSignoutOthers(token);

  // Local controlled inputs (prefilled from /auth/me and /notifications)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [showApiKey, setShowApiKey] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [fraudAlerts, setFraudAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);

  // hydrate form from API
  useEffect(() => {
    if (me.data) {
      setFirstName(me.data.first_name || me.data.full_name?.split(" ")[0] || "");
      setLastName(me.data.last_name || me.data.full_name?.split(" ").slice(1).join(" ") || "");
      setEmail(me.data.email || "");
      setPhone(me.data.phone || "");
    }
  }, [me.data]);

  useEffect(() => {
    if (notif.data) {
      setEmailNotifications(!!notif.data.emailNotifications);
      setPushNotifications(!!notif.data.pushNotifications);
      setFraudAlerts(!!notif.data.fraudAlerts);
      setWeeklyReports(!!notif.data.weeklyReports);
    }
  }, [notif.data]);

  const handleCopyApiKey = async () => {
    try {
      // If we have a one-time reveal endpoint, call it when user asks to copy
      if (!revealedKey) {
        const r = await revealKey.mutateAsync();
        setRevealedKey(r.apiKey);
        await navigator.clipboard.writeText(r.apiKey);
      } else {
        await navigator.clipboard.writeText(revealedKey);
      }
      toast({ title: "API Key Copied", description: "API key has been copied to clipboard" });
    } catch (e) {
      toast({ title: "Could not copy API key", description: errText(e), variant: "destructive" });
    }
  };

  const handleGenerateNewKey = async () => {
    try {
      const r = await rotateKey.mutateAsync();
      setRevealedKey(r.apiKey); // show the new one (only once)
      toast({ title: "New API Key Generated", description: "Your previous API key has been revoked" });
    } catch (e) {
      toast({ title: "Failed to rotate key", description: errText(e), variant: "destructive" });
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
      });
      toast({ title: "Profile Updated", description: "Your profile information has been saved successfully" });
    } catch (e) {
      toast({ title: "Failed to update profile", description: errText(e), variant: "destructive" });
    }
  };

  const handleSaveNotifications = async () => {
    try {
      await saveNotif.mutateAsync({ emailNotifications, pushNotifications, fraudAlerts, weeklyReports });
      toast({ title: "Preferences Saved", description: "Notification preferences have been updated" });
    } catch (e) {
      toast({ title: "Failed to save preferences", description: errText(e), variant: "destructive" });
    }
  };

  const handleChangePassword = async (current: string, next: string, confirm: string) => {
    if (!next || next !== confirm) {
      toast({ title: "Password mismatch", description: "New password and confirmation do not match", variant: "destructive" });
      return;
    }
    try {
      await changePw.mutateAsync({ current, new: next });
      toast({ title: "Password Updated", description: "Your password has been changed" });
    } catch (e) {
      toast({ title: "Failed to change password", description: errText(e), variant: "destructive" });
    }
  };

  const handleSignoutOthers = async () => {
    try {
      await signoutOthers.mutateAsync();
      toast({ title: "Signed out", description: "All other sessions have been signed out" });
    } catch (e) {
      toast({ title: "Failed to sign out sessions", description: errText(e), variant: "destructive" });
    }
  };

  // Security form local state
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");

  const maskedKey = useMemo(() => {
    if (revealedKey) return revealedKey; // if revealed, show full once
    if (apiKey.data?.masked) return apiKey.data.masked;
    return "sk_live_••••••••••••••••••••••••••••••••";
  }, [apiKey.data?.masked, revealedKey]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-muted-foreground">Manage your account, preferences, and integrations</p>
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
              <CardDescription>Update your account details and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 border-2 border-primary/20">
                  <AvatarImage src={me.data?.avatar_url || "/placeholder-avatar.jpg"} />
                  <AvatarFallback className="bg-primary/20 text-primary text-lg">
                    {(firstName?.[0] || "U").toUpperCase()}
                    {(lastName?.[0] || "").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">
                    {firstName || lastName ? `${firstName} ${lastName}` : me.data?.full_name || "—"}
                  </h3>
                  <p className="text-muted-foreground">{email || me.data?.email || "—"}</p>
                  <Button variant="outline" size="sm">Change Avatar</Button>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="bg-secondary/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="bg-secondary/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-secondary/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-secondary/50 border-border/50"
                  />
                </div>
              </div>

              <Button
                onClick={handleSaveProfile}
                className="bg-primary hover:bg-primary/90"
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Profile
              </Button>
              {me.isLoading && <div className="text-xs text-muted-foreground">Loading profile…</div>}
              {me.isError && <div className="text-xs text-destructive">Failed to load profile</div>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys */}
        <TabsContent value="api" className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>API Key Management</CardTitle>
              <CardDescription>Manage your API keys for external integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Production API Key</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      value={showApiKey ? (revealedKey || maskedKey) : "sk_live_••••••••••••••••••••••••••••••••"}
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
                      disabled={revealKey.isPending}
                      title="Copy (reveals once via API)"
                    >
                      {revealKey.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
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
                    disabled={rotateKey.isPending}
                  >
                    {rotateKey.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Regenerate Key
                  </Button>
                  <Badge variant="outline" className={`border-success/30 ${apiKey.data?.active ? "text-success" : "text-muted-foreground"}`}>
                    {apiKey.data?.active ? "Active" : "Inactive"}
                  </Badge>
                  {apiKey.isLoading && <span className="text-xs text-muted-foreground ml-2">Loading…</span>}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">API Usage Statistics</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* These can be wired to /api/settings/api-usage if you add it later */}
                  <div className="p-4 bg-secondary/20 rounded-lg border border-border/50">
                    <div className="text-2xl font-bold text-primary">—</div>
                    <div className="text-sm text-muted-foreground">Requests Today</div>
                  </div>
                  <div className="p-4 bg-secondary/20 rounded-lg border border-border/50">
                    <div className="text-2xl font-bold text-success">—</div>
                    <div className="text-sm text-muted-foreground">Uptime</div>
                  </div>
                  <div className="p-4 bg-secondary/20 rounded-lg border border-border/50">
                    <div className="text-2xl font-bold text-warning">—</div>
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
              <CardDescription>Configure how and when you want to receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
                  </div>
                  <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Fraud Alerts</Label>
                    <p className="text-sm text-muted-foreground">Immediate alerts for detected fraud</p>
                  </div>
                  <Switch checked={fraudAlerts} onCheckedChange={setFraudAlerts} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">Automated weekly summary reports</p>
                  </div>
                  <Switch checked={weeklyReports} onCheckedChange={setWeeklyReports} />
                </div>
              </div>

              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={handleSaveNotifications}
                disabled={saveNotif.isPending}
              >
                {saveNotif.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Preferences
              </Button>

              {notif.isLoading && <div className="text-xs text-muted-foreground">Loading preferences…</div>}
              {notif.isError && <div className="text-xs text-destructive">Failed to load preferences</div>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security and authentication</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Change Password</Label>
                  <div className="space-y-2 mt-2">
                    <Input
                      type="password"
                      placeholder="Current password"
                      value={pwCurrent}
                      onChange={(e) => setPwCurrent(e.target.value)}
                      className="bg-secondary/50 border-border/50"
                    />
                    <Input
                      type="password"
                      placeholder="New password"
                      value={pwNew}
                      onChange={(e) => setPwNew(e.target.value)}
                      className="bg-secondary/50 border-border/50"
                    />
                    <Input
                      type="password"
                      placeholder="Confirm new password"
                      value={pwConfirm}
                      onChange={(e) => setPwConfirm(e.target.value)}
                      className="bg-secondary/50 border-border/50"
                    />
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                      onClick={() => handleChangePassword(pwCurrent, pwNew, pwConfirm)}
                      disabled={changePw.isPending}
                    >
                      {changePw.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Update Password
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium">Two-Factor Authentication</Label>
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                      <Badge variant="outline" className="border-warning/30 text-warning mt-2">
                        Not Enabled
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      className="border-primary/30 text-primary"
                      onClick={() =>
                        toast({
                          title: "2FA",
                          description:
                            "Hook this button to /api/settings/2fa/enable to get an OTP secret or QR.",
                        })
                      }
                    >
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
                        <p className="text-xs text-muted-foreground">Browser session • Active now</p>
                      </div>
                      <Badge className="bg-success/20 text-success border-success/30">Current</Badge>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleSignoutOthers}
                      disabled={signoutOthers.isPending}
                    >
                      {signoutOthers.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Sign Out All Other Sessions
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance (unchanged UI) */}
        <TabsContent value="appearance" className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>Customize the look and feel of your dashboard</CardDescription>
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
