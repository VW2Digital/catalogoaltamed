import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LayoutGrid, LogOut, Sparkles, ExternalLink, Settings as SettingsIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Catálogos", url: "/admin", icon: LayoutGrid, end: true },
  { title: "Configurações", url: "/admin/settings", icon: SettingsIcon, end: false },
];

function AdminSidebar({
  email,
  onSignOut,
}: {
  email?: string;
  onSignOut: () => void;
}) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const isActive = (url: string, end: boolean) =>
    end ? location.pathname === url : location.pathname.startsWith(url);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          to="/admin"
          className="flex items-center gap-2 px-2 py-1.5 font-bold tracking-tight"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-gold shadow-gold">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </span>
          {!collapsed && <span>Catálogos</span>}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Painel</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active = isActive(item.url, item.end);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink
                        to={item.url}
                        end={item.end}
                        className={({ isActive: a }) =>
                          `flex items-center gap-2 ${
                            a || active
                              ? "bg-accent text-accent-foreground font-medium"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`
                        }
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Ver site">
              <Link to="/" target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4 shrink-0" />
                {!collapsed && <span>Ver site</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {!collapsed && email && (
            <li className="px-2 pt-1 text-xs text-muted-foreground truncate">
              {email}
            </li>
          )}

          <SidebarMenuItem>
            <SidebarMenuButton onClick={onSignOut} tooltip="Sair">
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/auth", { replace: true });
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-page">
        <AdminSidebar email={user?.email} onSignOut={handleSignOut} />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
            <SidebarTrigger />
          </header>

          <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}