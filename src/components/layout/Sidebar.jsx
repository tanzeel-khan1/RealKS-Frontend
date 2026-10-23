import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Building2, Users, Receipt, FileText,
  FolderOpen, Settings, ChevronDown, Plus,
  Lightbulb, NotebookPen, UserSquare2, Home, BookMarked, ScrollText,
  User, PanelLeft
} from "lucide-react";
import { api } from "@/api/apiClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n";

function getCompanyNavItems(t) {
  return [
    { path: "/", label: t('company.dashboard'), icon: LayoutDashboard },
    { path: "/clients", label: t('company.clients'), icon: Users },
    { path: "/properties", label: t('company.properties'), icon: Building2 },
    { path: "/expenses", label: t('company.expenses'), icon: Receipt },
    { path: "/invoices", label: t('company.invoices'), icon: FileText },
    { path: "/documents", label: t('company.documents'), icon: FolderOpen },
    { path: "/ideas", label: t('company.ideas'), icon: Lightbulb },
    { path: "/notepad", label: t('company.notepad'), icon: NotebookPen },
    { path: "/employees", label: t('company.employees'), icon: UserSquare2 },
    { path: "/business-plan", label: t('company.businessPlan'), icon: BookMarked },
  ];
}

export default function Sidebar({
  companies,
  activeCompany,
  setActiveCompany,
  onCreateCompany,
  collapsed,
  setCollapsed,
  currentUser,
  onNavClick,
  forceExpanded = false,
}) {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const isCollapsed = collapsed && !forceExpanded;

  const isOwner =
    activeCompany?.created_by?.toLowerCase() === currentUser?.email?.toLowerCase();

  const baseNavItems = getCompanyNavItems(t);
  const allNavItems = [
    ...baseNavItems,
    ...(isOwner ? [{ path: "/contracts", label: t('company.contracts'), icon: ScrollText }] : []),
  ];

  const navLink = (item, extra = "") => (
    <Link key={item.path} to={item.path} title={isCollapsed ? item.label : undefined} onClick={onNavClick}>
      <div
        className={cn(
          "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
          location.pathname === item.path
            ? "border border-sidebar-primary/15 bg-sidebar-primary/10 text-sidebar-foreground shadow-sm backdrop-blur-sm"
            : "border border-transparent text-sidebar-foreground/60 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground",
          extra
        )}
      >
        {location.pathname === item.path && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-full bg-primary" />
        )}
        <item.icon
          className={cn(
            "w-4 h-4 flex-shrink-0",
            location.pathname === item.path && "text-primary"
          )}
        />
        {!isCollapsed && <span>{item.label}</span>}
        {!isCollapsed && location.pathname === item.path && (
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary opacity-80" />
        )}
      </div>
    </Link>
  );

  return (
    <aside
      style={{ width: isCollapsed ? 72 : 240 }}
      className="relative h-screen flex flex-col fixed left-0 top-0 z-40 transition-all duration-200 border-r border-sidebar-border/60 bg-sidebar text-sidebar-foreground shadow-[0_1px_0_0_hsl(0_0%_100%/_0.04)_inset,8px_0_30px_-10px_rgba(0,0,0,0.22)] backdrop-blur-xl"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sidebar-foreground/[0.02] via-transparent to-primary/[0.05]" />

      {/* Logo */}
      <div className="relative h-14 flex items-center px-4 border-b border-sidebar-border/70 flex-shrink-0">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent pointer-events-none" />
        <div className="flex items-center gap-2.5 overflow-hidden w-full">
          <div className="relative h-8 w-8 rounded-xl bg-gradient-to-br from-[#5b7ad4] via-[#3a56c2] to-[#1e2d63] shadow-[0_4px_12px_-8px_rgba(37,58,140,0.8)] flex items-center justify-center flex-shrink-0">
            <span className="absolute inset-0 rounded-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]" />
            <span className="relative text-white font-black text-[13px] leading-none tracking-tight">R</span>
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-sidebar bg-foreground/80" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col leading-none">
              <span className="font-semibold text-sm tracking-tight whitespace-nowrap">
                Ranvola
              </span>
              <span className="text-[9px] uppercase tracking-[0.28em] text-primary/80 mt-1 whitespace-nowrap">
                Realtor Suite
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Workspace Switcher */}
      {!isCollapsed && (
      <div className="relative px-3 py-3 border-b border-sidebar-border/70 flex-shrink-0">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent pointer-events-none" />
          <p className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest mb-2 px-1">
            Workspace
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-2 p-2 rounded-xl border border-sidebar-border/70 bg-sidebar-accent/60 hover:bg-sidebar-accent hover:border-primary/30 transition-all text-left shadow-[0_1px_1px_rgba(15,23,42,0.01)] backdrop-blur-sm">
                <div className="w-7 h-7 rounded-lg bg-sidebar-accent border border-sidebar-border/60 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate leading-tight">
                    {activeCompany?.name || "Select Company"}
                  </p>
                  <p className="text-[10px] text-sidebar-foreground/40 truncate leading-tight">
                    {activeCompany?.industry || "No Industry"}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-sidebar-foreground/40 flex-shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              {companies.map((c) => (
                <DropdownMenuItem key={c.id} onClick={() => setActiveCompany(c)}>
                  <Building2 className="w-4 h-4 mr-2" />
                  {c.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onCreateCompany}>
                <Plus className="w-4 h-4 mr-2" />
                New Company
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/personal")}>
                <User className="w-4 h-4 mr-2" />
                Go to Personal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Navigation */}
      <div className="relative flex-1 overflow-y-auto px-2 py-3">
        {!isCollapsed && (
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/40">
            Menu
          </p>
        )}
        <nav className="space-y-1">
          {allNavItems.map((item) => navLink(item))}
        </nav>

        {/* Settings */}
        {!isCollapsed && (
          <div className="mt-4">
            <p className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest mb-2 px-2">
              General
            </p>
          </div>
        )}
        {navLink({ path: "/settings", label: "Settings", icon: Settings })}
      </div>

      {/* User Profile at Bottom */}
      <div className="relative border-t border-sidebar-border/70 p-3 flex-shrink-0">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent pointer-events-none" />
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-sidebar-accent border border-sidebar-border/70 flex items-center justify-center">
              <span className="text-xs font-semibold">
                {currentUser?.full_name?.[0] ||
                  currentUser?.email?.[0]?.toUpperCase() ||
                  "U"}
              </span>
            </div>
            <button
              onClick={() => navigate("/personal")}
              className="w-full flex items-center justify-center py-1 rounded-lg text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-sidebar-foreground/70 transition-colors"
              title="Personal Home"
            >
              <Home className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCollapsed(false)}
              className="w-full flex items-center justify-center py-1 rounded-lg text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-sidebar-foreground/70 transition-colors text-[11px]"
            >
              <PanelLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 rounded-xl border border-sidebar-border/70 bg-sidebar-accent/60 p-2 shadow-[0_1px_1px_rgba(15,23,42,0.01)] backdrop-blur-sm">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#3a56c2] to-[#1e2d63] dark:from-[#3a3f55] dark:to-[#1c1e2c] border border-sidebar-border/60 flex items-center justify-center flex-shrink-0 shadow-[0_4px_14px_-8px_rgba(37,58,140,0.8)]">
                <span className="relative text-xs font-semibold text-white z-10">
                  {currentUser?.full_name?.[0] ||
                    currentUser?.email?.[0]?.toUpperCase() ||
                    "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate leading-tight">
                  {currentUser?.full_name || "User"}
                </p>
                <p className="text-[10px] text-sidebar-foreground/40 truncate leading-tight">
                  {currentUser?.email || ""}
                </p>
              </div>
              <button
                onClick={() => navigate("/personal")}
                className="p-1.5 rounded-md hover:bg-sidebar-accent transition-colors text-sidebar-foreground/40 hover:text-primary"
                title="Personal Home"
              >
                <Home className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="mt-2 w-full flex items-center justify-center py-1.5 rounded-lg text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-sidebar-foreground/70 transition-colors text-[11px] gap-1.5"
            >
              <PanelLeft className="w-3 h-3" />
              Collapse
            </button>
          </>
        )}
      </div>
    </aside>
  );
}