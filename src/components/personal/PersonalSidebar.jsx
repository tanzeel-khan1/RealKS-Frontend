import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  LogOut,
  Home,
  TrendingUp,
  FolderOpen,
  Menu,
  X,
  ChevronDown,
  Plus,
  Mail,
} from "lucide-react";
import { api } from "@/api/apiClient";
import LogoutConfirmDialog from "@/components/auth/LogoutConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { useLanguage } from "@/i18n";

function getNavItems(t) {
  return [
    { id: "overview", label: t('tabs.overview'), icon: LayoutDashboard },
    { id: "financials", label: t('tabs.financials'), icon: TrendingUp },
    { id: "companies", label: t('tabs.companies'), icon: Building2 },
    { id: "documents", label: t('tabs.documents'), icon: FolderOpen },
    { id: "profile", label: t('tabs.profile'), icon: LayoutDashboard },
  ];
}

function CompanySwitcher({
  companies,
  activeCompany,
  setActiveCompany,
  onCreateCompany,
  onManageCompanies,
  onInvestors,
}) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  return (
    <div className="px-3 py-3 border-b border-sidebar-border flex-shrink-0">
      <p className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest mb-2 px-1">
        {t('sidebar.workspace')}
      </p>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-sidebar-accent transition-colors text-left">
            <div className="w-7 h-7 rounded-md bg-sidebar-accent flex items-center justify-center flex-shrink-0">
              <Building2 className="w-3.5 h-3.5 text-sidebar-foreground/60" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate leading-tight">
                {activeCompany?.name || t('sidebar.selectCompany')}
              </p>
              <p className="text-[10px] text-sidebar-foreground/40 truncate leading-tight">
                {activeCompany?.industry || `${companies.length} ${t('tabs.companies_plural')}`}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-sidebar-foreground/40 flex-shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          {companies.map((c) => (
            <DropdownMenuItem
              key={c.id}
              onClick={() => {
                setActiveCompany(c);
                api.auth.setActiveCompanyId(c.id);

                navigate("/");
              }}
            >
              <Building2 className="w-4 h-4 mr-2" />
              {c.name}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem onClick={onCreateCompany}>
            <Plus className="w-4 h-4 mr-2" />
            {t('sidebar.newCompany')}
          </DropdownMenuItem>
          {companies.length > 0 && (
            <>
              <DropdownMenuSeparator />
              {onManageCompanies && (
                <DropdownMenuItem onClick={onManageCompanies}>
                  <Building2 className="w-4 h-4 mr-2" />
                  {t('sidebar.manageCompanies')}
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default function PersonalSidebar({
  activeSection,
  setActiveSection,
  currentUser,
  companies = [],
  activeCompany,
  setActiveCompany,
}) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navItems = getNavItems(t);

  const handleLogout = () => {
    api.auth.logout();
    api.auth.redirectToLogin();
  };

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
    setIsMobileMenuOpen(false);
  };

  const handleCreateCompany = () => {
    setIsMobileMenuOpen(false);
    navigate("/personal/companies/new?returnTo=personal");
  };

  const switcherProps = {
    companies,
    activeCompany,
    setActiveCompany,
    onCreateCompany: handleCreateCompany,
    onManageCompanies: () => setActiveSection("companies"),
    // onInvestors: () => navigate('/'),
  };
  return (
    <>
      {/* Desktop Sidebar */}

      <aside className="hidden md:flex h-screen bg-sidebar text-sidebar-foreground flex-col fixed left-0 top-0 z-40 border-r border-sidebar-border w-60">
        <div className="h-14 flex items-center px-4 border-b border-sidebar-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center flex-shrink-0">
              <span className="text-black font-bold text-xs">R</span>
            </div>
            <span className="font-semibold text-sm tracking-tight text-sidebar-foreground">
              Ranvola
            </span>
          </div>
        </div>

        <div className="px-3 py-3 border-b border-sidebar-border flex-shrink-0">
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-sidebar-accent">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-sidebar-foreground">
                {currentUser?.full_name?.[0] ||
                  currentUser?.email?.[0]?.toUpperCase() ||
                  "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">
                {currentUser?.full_name || "User"}
              </p>
              <p className="text-[10px] text-sidebar-foreground/50 truncate">
                {currentUser?.email}
              </p>
            </div>
          </div>
        </div>

        <CompanySwitcher {...switcherProps} />

        <div className="flex-1 overflow-y-auto px-2 py-3">
          <p className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest mb-2 px-2">
            Menu
          </p>
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id)}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors text-left ${
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-sidebar-border p-3 space-y-1 flex-shrink-0">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('sidebar.logOut')}</span>
          </button>

          <a
            href="mailto:Contact@tanzilbuilds.xyz"
            className="flex items-start gap-2.5 px-2.5 py-2 rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            <Mail className="w-4 h-4 mt-0.5 flex-shrink-0 text-sidebar-foreground/40" />
            <span className="min-w-0">
              <span className="block text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest">
                {t('sidebar.support')}
              </span>
              <span className="block text-xs text-sidebar-foreground/70 truncate">
                Contact@tanzilbuilds.xyz
              </span>
            </span>
          </a>
        </div>
      </aside>

      {/* Mobile Top Navbar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-sidebar text-sidebar-foreground border-b border-sidebar-border flex items-center justify-between px-4">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center">
            <span className="text-black font-bold text-xs">R</span>
          </div>
          <span className="font-semibold text-sm tracking-tight">
            Ranvola
          </span>
        </div>
        <div className="w-9 h-9 rounded-full bg-sidebar-primary/20 flex items-center justify-center">
          <span className="text-xs font-bold">
            {currentUser?.full_name?.[0] ||
              currentUser?.email?.[0]?.toUpperCase() ||
              "U"}
          </span>
        </div>
      </header>

      {isMobileMenuOpen && (
        <button
          type="button"
          aria-label="Close menu overlay"
          onClick={() => setIsMobileMenuOpen(false)}
          className="md:hidden fixed inset-0 z-50 bg-black/40"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`md:hidden fixed left-0 top-0 z-[60] h-screen w-72 max-w-[85vw] bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col transition-transform duration-300 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center flex-shrink-0">
              <span className="text-black font-bold text-xs">R</span>
            </div>
            <span className="font-semibold text-sm tracking-tight">
              Ranvola
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <CompanySwitcher {...switcherProps} />

        <div className="px-3 py-3 border-b border-sidebar-border flex-shrink-0">
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-sidebar-accent">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold">
                {currentUser?.full_name?.[0] ||
                  currentUser?.email?.[0]?.toUpperCase() ||
                  "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">
                {currentUser?.full_name || "User"}
              </p>
              <p className="text-[10px] text-sidebar-foreground/50 truncate">
                {currentUser?.email}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3">
          <p className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest mb-2 px-2">
            {t('sidebar.menu')}
          </p>
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id)}
                  className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-[13px] font-medium transition-colors text-left ${
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-sidebar-border p-3 space-y-1 flex-shrink-0">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-[13px] font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('sidebar.logOut')}</span>
          </button>

          <a
            href="mailto:Contact@tanzilbuilds.xyz"
            className="flex items-start gap-2.5 px-2.5 py-2.5 rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            <Mail className="w-4 h-4 mt-0.5 flex-shrink-0 text-sidebar-foreground/40" />
            <span className="min-w-0">
              <span className="block text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest">
                {t('sidebar.support')}
              </span>
              <span className="block text-xs text-sidebar-foreground/70 truncate">
                Contact@tanzilbuilds.xyz
              </span>
            </span>
          </a>
        </div>
      </aside>

      <LogoutConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        onConfirm={handleLogout}
      />
    </>
  );
}
