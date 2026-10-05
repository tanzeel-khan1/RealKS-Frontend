import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Building2,
  StickyNote,
  FolderOpen,
  Sparkles,
} from 'lucide-react';

const steps = [
  {
    icon: LayoutDashboard,
    title: 'Personal Space',
    description:
      'Your private hub for overview, financials, notes, documents, and chats — all in one place.',
  },
  {
    icon: Building2,
    title: 'Switch or Create Companies',
    description:
      'Use the workspace switcher at the top of the sidebar to pick a company or create a new one.',
  },
  {
    icon: StickyNote,
    title: 'Stay Organized',
    description:
      'Keep personal notes, upload documents, and track activity across all your companies.',
  },
  {
    icon: FolderOpen,
    title: 'Jump to Workspace',
    description:
      'When you are ready, open a company workspace to manage investors, expenses, invoices, and more.',
  },
];

export default function WelcomeModal({ open, onClose, userName }) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle className="text-xl">
              Welcome{userName ? `, ${userName.split(' ')[0]}` : ''}!
            </DialogTitle>
          </div>
          <DialogDescription>
            Your account is verified. Here is a quick guide to get you started with Ranvola.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="flex gap-3 p-3 rounded-lg bg-muted/50 border border-border"
              >
                <div className="w-8 h-8 rounded-md bg-background flex items-center justify-center flex-shrink-0 border border-border">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{step.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full sm:w-auto">
            Get Started
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
