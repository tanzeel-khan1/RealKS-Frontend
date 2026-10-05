import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { UserSquare2 } from 'lucide-react';
import EmployeesTab from '@/components/notepad/EmployeesTab';
import NoCompanyBanner from '@/components/ui/NoCompanyBanner';

export default function Employees() {
  const { activeCompany, companies } = useOutletContext();

  if (!activeCompany?.id) return <NoCompanyBanner hasNoCompanies={!companies?.length} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <UserSquare2 className="w-6 h-6" /> Employees
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage all the employees of the company.</p>
      </div>
      <EmployeesTab companyId={activeCompany?.id} />
    </div>
  );
}