import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { motion } from 'framer-motion';
import PersonalSidebar from '@/components/personal/PersonalSidebar';
import WelcomeModal from '@/components/personal/WelcomeModal';
import OverviewSection from '@/components/personal/OverviewSection';
import FinancialSection from '@/components/personal/FinancialSection';
import CompaniesSection from '@/components/personal/CompaniesSection';
import NotesSection from '@/components/personal/NotesSection';
import PersonalDocuments from '@/components/personal/PersonalDocuments';
import PersonalChat from '@/components/personal/PersonalChat';
import Profile from '@/components/personal/Profile';
import PersonalNavbar from '../pages/PersonalNavbar';
import InvitationModal from '@/components/invitations/InvitationModal';
import GoalsSection from '@/pages/Goals';

export default function PersonalHome() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState('overview');
  const [activeCompany, setActiveCompany] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
const [showInvitations, setShowInvitations] = useState(false);
  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.auth.me(),
  });

  const { data: pendingInvitations = [] } = useQuery({
  queryKey: ['invitations', currentUser?.id],
  queryFn: () => api.invitations.getMine(),
  enabled: !!currentUser?.id,
});

useEffect(() => {
  if (currentUser && pendingInvitations.length > 0) {
    console.log("🔥 INVITATIONS FOUND:", pendingInvitations);
    setShowInvitations(true);
  }
}, [currentUser, pendingInvitations]);

  const { data: myCompanies = [] } = useQuery({
    queryKey: ['companies', currentUser?.email],
    queryFn: () => api.entities.Company.list('-created_date'),
    enabled: !!currentUser?.email,
  });

  useEffect(() => {
    if (myCompanies.length > 0 && !activeCompany) {
      const savedId = api.auth.getActiveCompanyId();
      const saved = savedId
        ? myCompanies.find((c) => c.id === savedId || c._id === savedId)
        : null;
      setActiveCompany(saved || myCompanies[0]);
    }
  }, [myCompanies, activeCompany]);

  useEffect(() => {
    const shouldShow =
      location.state?.showWelcome || api.auth.shouldShowWelcome();
    if (shouldShow) setShowWelcome(true);
  }, [location.state]);

  useEffect(() => {
    if (location.state?.activeSection) {
      setActiveSection(location.state.activeSection);
    }
  }, [location.state?.activeSection]);

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    api.auth.setWelcomeModal(false);
  };

  const handleSetActiveCompany = (company) => {
    setActiveCompany(company);
    if (company?.id) api.auth.setActiveCompanyId(company.id);
  };

  const handleDeleteCompany = async (id) => {
    try {
      await api.entities.Company.delete(id);
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      if (activeCompany?.id === id) {
        const remaining = myCompanies.filter((c) => c.id !== id);
        handleSetActiveCompany(remaining[0] || null);
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const myCompanyIds = myCompanies.map((c) => c.id);
  const selectedCompanyId = activeCompany?.id;

  const { data: allInvoices = [] } = useQuery({
    queryKey: ['personal-invoices', myCompanyIds.join(',')],
    queryFn: async () => {
      if (!myCompanyIds.length) return [];
      const results = await Promise.all(
        myCompanyIds.map((id) =>
          api.entities.Invoice.filter({ company_id: id })
        )
      );
      return results.flat();
    },
    enabled: myCompanyIds.length > 0,
  });

  const { data: allExpenses = [] } = useQuery({
    queryKey: ['personal-expenses', myCompanyIds.join(',')],
    queryFn: async () => {
      if (!myCompanyIds.length) return [];
      const results = await Promise.all(
        myCompanyIds.map((id) =>
          api.entities.Expense.filter({ company_id: id })
        )
      );
      return results.flat();
    },
    enabled: myCompanyIds.length > 0,
  });

  const { data: selectedInvoices = [] } = useQuery({
    queryKey: ['personal-company-invoices', selectedCompanyId],
    queryFn: () =>
      api.entities.Invoice.filter({ company_id: selectedCompanyId }, '-created_date'),
    enabled: !!selectedCompanyId,
  });

  const { data: selectedExpenses = [] } = useQuery({
    queryKey: ['personal-company-expenses', selectedCompanyId],
    queryFn: () =>
      api.entities.Expense.filter({ company_id: selectedCompanyId }, '-created_date'),
    enabled: !!selectedCompanyId,
  });

  const companyInvoices = selectedCompanyId ? selectedInvoices : allInvoices;
  const companyExpenses = selectedCompanyId ? selectedExpenses : allExpenses;

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <OverviewSection
            currentUser={currentUser}
            companies={myCompanies}
            allInvoices={companyInvoices}
            allExpenses={companyExpenses}
            activeCompany={activeCompany}
          />
        );
      case 'financials':
        return (
          <FinancialSection
            companies={myCompanies}
            allInvoices={companyInvoices}
            allExpenses={companyExpenses}
            activeCompany={activeCompany}
          />
        );
      case 'companies':
        return (
          <CompaniesSection
            companies={myCompanies}
            allInvoices={allInvoices}
            allExpenses={allExpenses}
            onDeleteCompany={handleDeleteCompany}
          />
          
        );
      case 'profile':
  return <Profile currentUser={currentUser} />;
      case 'notes':
        return <NotesSection currentUser={currentUser} />;
      case 'documents':
        return <PersonalDocuments currentUser={currentUser} />;
      case 'chat':
        return (
          <PersonalChat currentUser={currentUser} companies={myCompanies} />
        );
        case 'goals':
  return <GoalsSection currentUser={currentUser} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">

      {showInvitations && pendingInvitations.length > 0 && (
  <InvitationModal
    invitations={pendingInvitations}
    onDone={() => setShowInvitations(false)}
  />
)}
      <WelcomeModal
        open={showWelcome}
        onClose={handleCloseWelcome}
        userName={currentUser?.full_name}
      />

      <PersonalSidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        currentUser={currentUser}
        companies={myCompanies}
        activeCompany={activeCompany}
        setActiveCompany={handleSetActiveCompany}
      />
       <PersonalNavbar
         activeSection={activeSection}
  setActiveSection={setActiveSection}
         />

      <main className="min-h-screen mt-20 md:mt-14 ml-5 md:ml-60">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="p-1 sm:p-6 lg:p-8 w-full"
        >
          {renderSection()}
        </motion.div>
      </main>
    </div>
  );
}
