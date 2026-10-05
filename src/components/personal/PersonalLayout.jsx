import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import PersonalSidebar from './PersonalSidebar';
import PersonalNavbar from '../../pages/PersonalNavbar';
import WelcomeModal from '@/components/personal/WelcomeModal';

export default function PersonalLayout() {
  const location = useLocation();
  const [activeCompany, setActiveCompany] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.auth.me(),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies', currentUser?.email],
    queryFn: () => api.entities.Company.list('-created_date'),
    enabled: !!currentUser?.email,
  });

  useEffect(() => {
    if (companies.length > 0 && !activeCompany) {
      const savedId = api.auth.getActiveCompanyId();
      const saved = savedId
        ? companies.find((c) => c.id === savedId || c._id === savedId)
        : null;
      setActiveCompany(saved || companies[0]);
    }
  }, [companies, activeCompany]);

  useEffect(() => {
    const shouldShow =
      location.state?.showWelcome || api.auth.shouldShowWelcome();
    if (shouldShow) setShowWelcome(true);
  }, [location.state]);

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    api.auth.setWelcomeModal(false);
  };

  const handleSetActiveCompany = (company) => {
    setActiveCompany(company);
    if (company?.id) api.auth.setActiveCompanyId(company.id);
  };

  return (
    <div className="min-h-screen bg-background">
      <WelcomeModal
        open={showWelcome}
        onClose={handleCloseWelcome}
        userName={currentUser?.full_name}
      />

      <PersonalSidebar
        activeSection={null}
        setActiveSection={() => {}}
        currentUser={currentUser}
        companies={companies}
        activeCompany={activeCompany}
        setActiveCompany={handleSetActiveCompany}
      />

      <PersonalNavbar />

      <main className="min-h-screen  pl-0 md:ml-0">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="p-1 sm:p-6 lg:p-8 w-full"
        >
          <Outlet
            context={{
              activeCompany,
              setActiveCompany: handleSetActiveCompany,
              companies,
              currentUser,
            }}
          />
        </motion.div>
      </main>
    </div>
  );
}
