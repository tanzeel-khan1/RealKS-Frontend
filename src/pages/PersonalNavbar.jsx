"use client";

import React, { useEffect, useState } from "react";
import {
  Search,
  Sun,
  Moon,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Command } from "cmdk";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/i18n";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "financials", label: "Financials" },
  { id: "notes", label: "My Notes" },
  { id: "documents", label: "Documents" },
  { id: "chat", label: "Chats" },
  { id: "profile", label: "Profile" },
];
export default function PersonalNavbar(
    { activeSection,
  setActiveSection,}
) {
    
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const theme = localStorage.getItem("theme") || "light";

    document.documentElement.classList.toggle(
      "dark",
      theme === "dark"
    );

    const down = (e) => {
      if (e.key === "k" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setCommandOpen(true);
      }
    };

    document.addEventListener("keydown", down);

    return () =>
      document.removeEventListener("keydown", down);
  }, []);

  const { t } = useLanguage();

  const toggleTheme = () => {
    const dark =
      document.documentElement.classList.toggle("dark");

    localStorage.setItem(
      "theme",
      dark ? "dark" : "light"
    );
  };

  return (
    <>
      {/* Navbar */}
     <header
  className="
  hidden md:flex
  fixed md:top-0 top-4 right-0 md:left-60
  h-16 px-6 z-50
  items-center justify-between
  backdrop-blur-xl
  bg-sidebar dark:bg-zinc-950/70
  border-b border-zinc-200 dark:border-zinc-800
  shadow-sm
"
>
        {/* Left */}
        <div>
          <h1 className="font-bold text-lg">
            {t('navbar.dashboard')}
          </h1>
          <p className="text-xs text-zinc-500 hidden md:block">
            {t('navbar.welcome')} 👋
          </p>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <button
            onClick={() => setCommandOpen(true)}
            className="
              hidden md:flex
              items-center justify-between
              w-72 px-4 py-2
              rounded-xl
              bg-zinc-100 dark:bg-zinc-900
              border
            "
          >
            <div className="flex items-center gap-2">
              <Search size={16} />
              <span className="text-sm text-zinc-500">
                {t('navbar.searchTabs')}
              </span>
            </div>

            <kbd className="text-xs border rounded px-2 py-1">
              {t('navbar.ctrlK')}
            </kbd>
          </button>

          {/* Language Switcher */}
          <div className="flex items-center">
            {/* Import dynamically */}
          </div>

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Theme */}
          <button
            onClick={toggleTheme}
            className="
              h-10 w-10
              rounded-xl
              border
              flex items-center justify-center
              bg-white dark:bg-zinc-900
            "
          >
            <Sun className="h-5 w-5 dark:hidden" />
            <Moon className="hidden dark:block h-5 w-5" />
          </button>

          {/* Mobile Menu */}
          <button
            onClick={() =>
              setMobileOpen(!mobileOpen)
            }
            className="md:hidden"
          >
            {mobileOpen ? (
              <X size={24} />
            ) : (
              <Menu size={24} />
            )}
          </button>

          {/* Profile */}
          <div className="relative hidden md:block">
            <button
              onClick={() =>
                setShowMenu(!showMenu)
              }
              className="
                flex items-center gap-3
                px-2 py-1 rounded-xl
                hover:bg-zinc-100
                dark:hover:bg-zinc-900
              "
            >
              <div className="relative">
                <div
                  className="
                  w-11 h-11
                  rounded-full
                  bg-gradient-to-r
                  from-blue-500
                  to-purple-600
                  text-white
                  flex items-center justify-center
                  font-bold
                "
                >
                  {user?.full_name?.charAt(0) ||
                    "U"}
                </div>

                <span
                  className="
                  absolute bottom-0 right-0
                  h-3 w-3
                  bg-green-500
                  rounded-full
                  border-2 border-white
                "
                />
              </div>

              <div className="text-left">
                <p className="font-medium text-sm">
                  {user?.full_name || "User"}
                </p>

                <p className="text-xs text-zinc-500">
                  {user?.email}
                </p>
              </div>

              <ChevronDown size={16} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: -10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -10,
                  }}
                  className="
                    absolute right-0 mt-3
                    w-80
                    rounded-2xl
                    border
                    bg-white
                    dark:bg-zinc-900
                    shadow-2xl
                    overflow-hidden
                  "
                >
                  <div className="p-5 border-b">
                    <h3 className="font-semibold">
                      {user?.full_name}
                    </h3>

                    <p className="text-sm text-zinc-500">
                      {user?.email}
                    </p>

                    <div
                      className="
                      inline-block
                      mt-2 px-3 py-1
                      rounded-full
                      bg-green-100
                      text-green-700
                      text-xs
                    "
                    >
                      {user?.subscription?.plan ||
                        "Free"}
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: -250 }}
            animate={{ x: 0 }}
            exit={{ x: -250 }}
            className="
              fixed top-16 left-0
              w-72 h-screen
              bg-white dark:bg-zinc-950
              border-r z-40
              p-5
            "
          >
            <div className="space-y-4">
              {tabs.map((tab) => (
                <a
                  key={tab.label}
                  href={tab.href}
                  className="
                    block
                    p-3
                    rounded-xl
                    hover:bg-zinc-100
                    dark:hover:bg-zinc-900
                  "
                >
                  {tab.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Command Palette */}
      <AnimatePresence>
        {commandOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="
              fixed inset-0
              bg-black/40
              backdrop-blur-sm
              z-[100]
            "
            onClick={() =>
              setCommandOpen(false)
            }
          >
            <div
              className="
                max-w-xl
                mx-auto
                mt-32
              "
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <Command
                className="
                rounded-2xl
                bg-white
                dark:bg-zinc-900
                border
                shadow-2xl
                overflow-hidden
              "
              >
                <Command.Input
                  placeholder="Search tabs..."
                  className="
                    w-full
                    p-4
                    outline-none
                    bg-transparent
                  "
                />

                <Command.List>
  {tabs.map((tab) => (
    <Command.Item
      key={tab.id}
      onSelect={() => {
        setActiveSection(tab.id);   // ✅ MAIN FIX
        setCommandOpen(false);
      }}
      className="
        px-4 py-3
        cursor-pointer
        hover:bg-zinc-100
        dark:hover:bg-zinc-800
      "
    >
      {tab.label}
    </Command.Item>
  ))}
</Command.List>
                 
              </Command>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}