import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import CommandPalette from './CommandPalette';
import InvitationModal from '@/components/invitations/InvitationModal';

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  useEffect(() => {
    const fn = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return isDesktop;
}

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [activeCompany, setActiveCompany] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showInvitations, setShowInvitations] = useState(false);
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();

  useEffect(() => {
    api.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ['companies', currentUser?.email],
    queryFn: () => api.entities.Company.list('-created_date'),
    enabled: !!currentUser,
    initialData: [],
  });

  useEffect(() => {
    if (!companiesLoading && currentUser && companies.length === 0) {
      navigate('/personal', { replace: true });
    }
  }, [companies, companiesLoading, currentUser, navigate]);

  // const { data: pendingInvitations = [] } = useQuery({
  //   queryKey: ['invitations', 'pending', currentUser?.email],
  //   queryFn: () => api.invitations.getMine(),
  //   enabled: !!currentUser,
  //   initialData: [],
  //   onSuccess: (data) => { if (data.length > 0) setShowInvitations(true); },
  // });

  // useEffect(() => {
  //   if (pendingInvitations.length > 0) setShowInvitations(true);
  // }, [pendingInvitations.length]);

  useEffect(() => {
    if (companies.length > 0 && !activeCompany) {
      const savedId = api.auth.getActiveCompanyId();
      const saved = savedId
        ? companies.find((c) => c.id === savedId || c._id === savedId)
        : null;
      setActiveCompany(saved || companies[0]);
    }
  }, [companies, activeCompany]);

  const handleSetActiveCompany = (company) => {
    setActiveCompany(company);
    if (company?.id) api.auth.setActiveCompanyId(company.id);
  };

  const sidebarWidth = collapsed ? 72 : 240;
  const mainMargin = isDesktop ? sidebarWidth : 0;

  return (
    <div className="min-h-screen bg-background relative">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,rgba(231,182,60,0.06),transparent_45%)]" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0),rgba(0,0,0,0.015))]" />
      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div
        style={{
          transform: isDesktop ? 'translateX(0)' : mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          visibility: (!isDesktop && !mobileOpen) ? 'hidden' : 'visible',
        }}
        className="fixed top-0 left-0 h-full z-40 transition-transform duration-200 shadow-[8px_0_30px_-10px_rgba(0,0,0,0.35)]"
      >
        <Sidebar
          companies={companies}
          activeCompany={activeCompany}
          setActiveCompany={(c) => { handleSetActiveCompany(c); setMobileOpen(false); }}
          onCreateCompany={() => { navigate('/personal/companies/new'); setMobileOpen(false); }}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          currentUser={currentUser}
          onNavClick={() => setMobileOpen(false)}
          forceExpanded={mobileOpen && !isDesktop}
        />
      </div>

      {/* TopBar */}
      <TopBar
        sidebarWidth={isDesktop ? sidebarWidth : 0}
        showMenuButton={!isDesktop}
        onOpenCommand={() => setCommandOpen(true)}
        onMenuToggle={() => setMobileOpen(o => !o)}
        currentUser={currentUser}
      />

      <CommandPalette open={commandOpen} setOpen={setCommandOpen} />

      {/* {showInvitations && pendingInvitations.length > 0 && (
        <InvitationModal
          invitations={pendingInvitations}
          onDone={() => setShowInvitations(false)}
        />
      )} */}

      {/* Main content */}
      <main
        className="relative z-10 pt-14 min-h-screen transition-all duration-200"
        style={{ marginLeft: mainMargin }}
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-4 lg:p-6"
        >
          <Outlet context={{ activeCompany, setActiveCompany: handleSetActiveCompany, companies, currentUser }} />
        </motion.div>
      </main>
    </div>
  );
}