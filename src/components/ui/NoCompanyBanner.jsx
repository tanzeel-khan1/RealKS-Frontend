import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Show this when a page requires an active company.
 * Pass `hasNoCompanies={true}` when the user has zero companies at all.
 */
export default function NoCompanyBanner({ hasNoCompanies = false }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center py-28 text-muted-foreground gap-4">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
        <Building2 className="w-8 h-8 opacity-40" />
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-foreground">
          {hasNoCompanies ? 'No company yet' : 'No company selected'}
        </p>
        <p className="text-sm mt-1 max-w-xs">
          {hasNoCompanies
            ? 'First create your company — then you can add expenses, invoices, employees, and more.'
            : 'Select a company from the sidebar to view and manage its data.'}
        </p>
      </div>
      {hasNoCompanies && (
        <Button onClick={() => navigate('/personal/companies/new')} className="gap-2 mt-1">
          <Building2 className="w-4 h-4" /> Create Company
        </Button>
      )}
    </div>
  );
}
