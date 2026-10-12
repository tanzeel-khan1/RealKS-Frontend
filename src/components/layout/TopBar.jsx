import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Command, Menu, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/api/apiClient';
import { formatDistanceToNow } from 'date-fns';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/i18n';

const STORAGE_KEY = 'notif_read_ids';

function getStoredReadIds() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); }
  catch { return new Set(); }
}

export default function TopBar({ sidebarWidth, showMenuButton, onOpenCommand, onMenuToggle, currentUser }) {
  const { t } = useLanguage();
  const [activities, setActivities] = useState([]);
  const [readIds, setReadIds] = useState(getStoredReadIds);

  useEffect(() => {
    if (!currentUser?.email) return;

    // Only load activities created by the current user
    api.entities.Activity.filter({ user_email: currentUser.email }, '-created_date', 20)
      .then(setActivities);

    const unsubscribe = api.entities.Activity.subscribe((event) => {
      if (Array.isArray(event.data)) {
        setActivities(event.data.filter(a => a.user_email === currentUser.email).slice(0, 20));
      }
    });

    return unsubscribe;
  }, [currentUser?.email]);

  const unreadCount = activities.filter(a => !readIds.has(a.id)).length;

  const markAllRead = () => {
    const newSet = new Set(activities.map(a => a.id));
    setReadIds(newSet);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...newSet]));
  };

  return (
    <header
      className="fixed top-0 right-0 left-0 lg:left-[var(--sidebar-w)] h-14 bg-background/80 backdrop-blur-md border-b border-border z-30 flex items-center gap-2 px-4 transition-all duration-200"
      style={{ '--sidebar-w': `${sidebarWidth}px` }}
    >
      {showMenuButton && (
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg hover:bg-accent transition-colors text-foreground shrink-0"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      <button
        onClick={onOpenCommand}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border/70 bg-card/60 backdrop-blur hover:bg-card hover:border-foreground/20 text-muted-foreground text-sm transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex-1 max-w-sm"
      >
        <Search className="w-4 h-4 shrink-0" />
        <span>{t('topbar.searchAnything')}</span>
        <kbd className="ml-auto text-xs bg-muted/80 text-muted-foreground px-1.5 py-0.5 rounded-md border border-border font-mono hidden sm:flex items-center gap-0.5">
         {t('navbar.ctrlK')}
        </kbd>
      </button>

      <div className="flex items-center gap-1.5 ml-auto shrink-0">
        <LanguageSwitcher />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
          }}
          title="Toggle theme"
        >
          <Sun className="w-[18px] h-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute w-[18px] h-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-[18px] h-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gradient-to-b from-[#34d399] to-[#0e9f6e] text-background text-[10px] font-bold rounded-full flex items-center justify-center shadow-[0_2px_8px_-2px_rgba(22,163,74,0.8)]">
                  {unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <h4 className="font-semibold text-sm">{t('topbar.myActivity')}</h4>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {t('topbar.markAllRead')}
                </button>
              )}
            </div>
            <ScrollArea className="max-h-64">
              {activities.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">{t('topbar.noActivity')}</p>
              ) : (
                activities.slice(0, 10).map(a => (
                  <div key={a.id} className={`p-3 border-b border-border last:border-0 transition-colors ${readIds.has(a.id) ? 'opacity-40' : 'hover:bg-muted/30'}`}>
                    {!readIds.has(a.id) && <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mr-1.5 mb-0.5" />}
                    <span className="text-sm font-medium">{a.action}</span>
                    {a.details && <p className="text-xs text-muted-foreground mt-0.5">{a.details}</p>}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {a.created_date ? formatDistanceToNow(new Date(a.created_date), { addSuffix: true }) : ''}
                    </p>
                  </div>
                ))
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
