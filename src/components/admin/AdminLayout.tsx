import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutGrid,
  LogOut,
  ExternalLink,
  Settings as SettingsIcon,
  Home,
  BarChart3,
  Layers,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type NavItem = {
  title: string;
  url: string;
  icon: typeof LayoutGrid;
  end?: boolean;
  external?: boolean;
  badgeKey?: "catalogs";
};

const principal: NavItem[] = [
  { title: "Catálogos", url: "/admin", icon: LayoutGrid, end: true, badgeKey: "catalogs" },
  { title: "Início", url: "/", icon: Home, external: true },
  { title: "Relatórios", url: "/admin/reports", icon: BarChart3 },
];

const sistema: NavItem[] = [
  { title: "Configurações", url: "/admin/settings", icon: SettingsIcon },
  { title: "Ver site", url: "/", icon: ExternalLink, external: true },
];

function AdminSidebar({
  email,
  isAdmin,
  onSignOut,
}: {
  email?: string;
  isAdmin: boolean;
  onSignOut: () => void;
}) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const [catalogsCount, setCatalogsCount] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { count } = await supabase
        .from("catalogs")
        .select("*", { count: "exact", head: true });
      setCatalogsCount(count ?? 0);
    })();
  }, [location.pathname]);

  const isActive = (url: string, end: boolean) =>
    end ? location.pathname === url : location.pathname.startsWith(url);

  function renderItem(item: NavItem) {
    const active = !item.external && isActive(item.url, item.end ?? false);
    const badge =
      item.badgeKey === "catalogs" && catalogsCount !== null
        ? catalogsCount
        : null;

    const inner = (
      <>
        <item.icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="flex-1">{item.title}</span>}
        {!collapsed && badge !== null && (
          <Badge
            variant="secondary"
            className="ml-auto h-5 min-w-[1.5rem] justify-center rounded-full px-1.5 text-[11px]"
          >
            {badge}
          </Badge>
        )}
      </>
    );

    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
          {item.external ? (
            <a href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-2">
              {inner}
            </a>
          ) : (
            <NavLink
              to={item.url}
              end={item.end}
              className="flex items-center gap-2"
            >
              {inner}
            </NavLink>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  const initials = (email ?? "U")
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          to="/admin"
          className="flex items-center gap-3 px-2 py-2"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-gold shadow-gold">
            <Layers className="h-5 w-5 text-primary-foreground" />
          </span>
          {!collapsed && (
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-bold tracking-tight">Catálogos</span>
              <span className="truncate text-xs text-muted-foreground">Painel admin</span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{principal.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{sistema.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <div
          className={`flex items-center gap-3 px-2 py-2 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-gradient-gold text-xs font-semibold text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-medium">{email}</span>
              <span className="truncate text-xs text-muted-foreground">
                {isAdmin ? "Administrador" : "Usuário"}
              </span>
            </div>
          )}
        </div>
        <SidebarMenu>
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
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/auth", { replace: true });
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-page">
        <AdminSidebar email={user?.email} isAdmin={isAdmin} onSignOut={handleSignOut} />

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