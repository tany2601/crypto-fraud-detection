import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, User, LogOut, Shield, LayoutDashboard, CreditCard, AlertTriangle, FileText, Settings } from "lucide-react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
const navigationItems = [{
  name: "Dashboard",
  href: "/",
  icon: LayoutDashboard
}, {
  name: "Transactions",
  href: "/transactions",
  icon: CreditCard
}, {
  name: "Alerts",
  href: "/alerts",
  icon: AlertTriangle
}, {
  name: "Reports",
  href: "/reports",
  icon: FileText
}, {
  name: "Settings",
  href: "/settings",
  icon: Settings
}];


const MainLayout = () => {

  const { logout } = useAuth();
  const navigate = useNavigate();

  const location = useLocation();
  return <SidebarProvider>
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar className="border-r border-sidebar-border w-72">
        <SidebarHeader className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <h1 className="font-bold text-sidebar-foreground truncate text-sm">
                Crypto Fraud Detection System
              </h1>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                Detecting Fraud, Securing Crypto
              </p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="p-4 mx-0 px-[16px]">
          <SidebarMenu>
            {navigationItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild className={isActive ? "bg-sidebar-accent text-sidebar-primary" : ""}>
                  <NavLink to={item.href} className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                    {item.name === "Alerts" && <Badge variant="destructive" className="ml-auto h-5 px-2 text-xs">
                      3
                    </Badge>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>;
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback className="bg-primary/10 text-primary">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                Security Admin
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                admin@cryptofraud.com
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-sidebar-accent"
              onClick={() => { logout(); navigate("/login"); }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mx-[38px]">
          <div className="flex h-16 items-center justify-between px-6 mx-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden" />
              <Badge variant="outline" className="border-success/30 text-success">
                <div className="h-2 w-2 rounded-full bg-success mr-2 animate-pulse" />
                System Active
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive text-xs"></span>
              </Button>
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback className="bg-primary/10 text-primary">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto mx-[23px]">
          <Outlet />
        </main>
      </div>
    </div>
  </SidebarProvider>;
};
export default MainLayout;