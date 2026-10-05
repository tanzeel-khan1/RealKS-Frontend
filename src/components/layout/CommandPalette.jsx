import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList
} from '@/components/ui/command';
import {
  LayoutDashboard, Receipt, FileText, FolderOpen, TrendingUp, Settings
} from 'lucide-react';

const commands = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Expenses', icon: Receipt, path: '/expenses' },
  { label: 'Invoices', icon: FileText, path: '/invoices' },
  { label: 'Documents', icon: FolderOpen, path: '/documents' },
  { label: 'Analytics', icon: TrendingUp, path: '/analytics' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

export default function CommandPalette({ open, setOpen }) {
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [setOpen]);

  const runCommand = (path) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {commands.map(cmd => (
            <CommandItem key={cmd.path} onSelect={() => runCommand(cmd.path)}>
              <cmd.icon className="mr-2 h-4 w-4" />
              {cmd.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}