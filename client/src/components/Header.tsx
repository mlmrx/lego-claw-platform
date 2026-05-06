/**
 * Header Component
 * Clean, minimal navigation with grouped dropdown menus
 * Primary actions visible, secondary features in organized dropdowns
 */

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { 
  Blocks, Bot, LogIn, 
  Menu, X, ChevronDown,
  Sparkles, Box, Camera, Users, FileText, FlaskConical,
  Store, Grid3X3, Trophy, Book, Heart, Eye,
  Hammer, Compass
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { NotificationBell } from "./NotificationBell";

interface HeaderProps {
  className?: string;
}

// Dropdown menu component
function NavDropdown({ label, icon: Icon, items, location }: {
  label: string;
  icon: LucideIcon;
  items: { href: string; icon: LucideIcon; label: string; description?: string }[];
  location: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = items.some(item => location === item.href);

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "rounded-xl gap-1.5 h-9 px-3 text-sm font-medium",
          isActive && "bg-muted"
        )}
        onClick={() => setOpen(!open)}
      >
        <Icon className="w-4 h-4" />
        {label}
        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-56 rounded-xl border border-border bg-card shadow-lg overflow-hidden z-50"
          >
            <div className="p-1.5">
              {items.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                  <div className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer",
                    "hover:bg-muted",
                    location === item.href && "bg-muted"
                  )}>
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <span className="text-sm font-medium">{item.label}</span>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Header({ className }: HeaderProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const createItems = [
    { href: "/builder", icon: Box, label: "Sandbox", description: "Free-form brick playground" },
    { href: "/dream", icon: Sparkles, label: "AI Creator", description: "Describe it, AI builds it" },
    { href: "/start-build", icon: Camera, label: "Photo to LEGO", description: "Scan an image, get steps" },
    { href: "/social-build", icon: Users, label: "Co-op Room", description: "Collaborate with others" },
    { href: "/instructions", icon: FileText, label: "Instructions", description: "Step-by-step guides" },
    { href: "/sandbox", icon: FlaskConical, label: "Agent Lab", description: "Train & test AI agents" },
  ];

  const exploreItems = [
    { href: "/marketplace", icon: Store, label: "Marketplace", description: "Discover agents" },
    { href: "/templates", icon: Grid3X3, label: "Templates", description: "Starter kits & presets" },
    { href: "/challenges", icon: Trophy, label: "Challenges", description: "Compete & earn" },
    { href: "/live", icon: Eye, label: "Live Feed", description: "Watch agents in action" },
  ];

  const allMobileItems = [
    { section: "Create", items: createItems },
    { section: "Explore", items: exploreItems },
    { section: "More", items: [
      { href: "/docs", icon: Book, label: "Documentation" },
      { href: "/support", icon: Heart, label: "Support" },
    ]},
  ];

  return (
    <>
      <header 
        className={cn(
          "sticky top-0 z-50 w-full",
          "bg-card/80 backdrop-blur-md border-b border-border",
          className
        )}
      >
        <div className="container flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2 sm:gap-3 cursor-pointer">
              <div className="relative">
                <motion.div
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary flex items-center justify-center lego-shadow"
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <Blocks className="w-4 h-4 sm:w-6 sm:h-6 text-primary-foreground" />
                </motion.div>
                <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-400 border sm:border-2 border-white" />
              </div>
              
              <div className="hidden xs:block">
                <h1 className="font-heading font-bold text-base sm:text-xl tracking-tight">
                  <span className="text-primary">LEGO</span>
                  <span className="text-foreground"> Claw</span>
                </h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground -mt-0.5 hidden sm:block">
                  Agentic Network Platform
                </p>
              </div>
            </div>
          </Link>

          {/* Center - Desktop Navigation (Grouped Dropdowns) */}
          <nav className="hidden lg:flex items-center gap-1">
            <NavDropdown
              label="Create"
              icon={Hammer}
              items={createItems}
              location={location}
            />
            <NavDropdown
              label="Explore"
              icon={Compass}
              items={exploreItems}
              location={location}
            />
            <Link href="/docs">
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn("rounded-xl gap-1.5 h-9 px-3 text-sm font-medium", location === "/docs" && "bg-muted")}
              >
                <Book className="w-4 h-4" />
                Docs
              </Button>
            </Link>
            <Link href="/support">
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn("rounded-xl gap-1.5 h-9 px-3 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50", location === "/support" && "bg-muted")}
              >
                <Heart className="w-4 h-4" />
                Support
              </Button>
            </Link>
          </nav>

          {/* Right - Actions (minimal) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Primary CTA - Dream Build */}
            <Link href="/dream">
              <Button 
                variant="default" 
                size="sm" 
                className="rounded-xl gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3 bg-gradient-to-r from-primary to-yellow-500 hover:opacity-90"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Dream Build</span>
              </Button>
            </Link>

            {/* Live indicator */}
            <Link href="/live">
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-muted hover:bg-muted/80 cursor-pointer transition-colors">
                <motion.div
                  className="w-2 h-2 rounded-full bg-green-500"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
                <span className="text-xs font-medium text-green-600">Live</span>
              </div>
            </Link>

            {/* Notification Bell */}
            <div className="hidden sm:block">
              <NotificationBell />
            </div>

            <div className="hidden sm:block w-px h-6 bg-border" />

            {/* Auth Button */}
            {loading ? (
              <Button variant="outline" size="sm" className="rounded-xl h-8 sm:h-9 px-2 sm:px-3" disabled>
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </Button>
            ) : isAuthenticated ? (
              <Link href="/dashboard">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl gap-1.5 h-8 sm:h-9 px-2 sm:px-3"
                >
                  <Bot className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">My Agents</span>
                </Button>
              </Link>
            ) : (
              <Button 
                variant="default" 
                size="sm" 
                className="rounded-xl gap-1.5 h-8 sm:h-9 px-2 sm:px-3"
                asChild
              >
                <a href={getLoginUrl()}>
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">Sign In</span>
                </a>
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-xl w-8 h-8 sm:w-9 sm:h-9"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Slide-out Menu */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 sm:w-80 bg-card border-l border-border lg:hidden overflow-y-auto"
            >
              {/* Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                    <Blocks className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="font-heading font-bold">
                    <span className="text-primary">LEGO</span>
                    <span className="text-foreground"> Claw</span>
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Grouped Menu Items */}
              <div className="p-4 space-y-6 pb-32">
                {allMobileItems.map((group) => (
                  <div key={group.section}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
                      {group.section}
                    </p>
                    <div className="space-y-1">
                      {group.items.map((item, index) => (
                        <motion.div
                          key={item.href}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <Link href={item.href} onClick={() => setMobileMenuOpen(false)}>
                            <div className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors",
                              "hover:bg-muted",
                              location === item.href && "bg-muted"
                            )}>
                              <item.icon className="w-5 h-5 text-muted-foreground" />
                              <div>
                                <span className="text-sm font-medium">{item.label}</span>
                                {"description" in item && item.description && (
                                  <p className="text-xs text-muted-foreground">{item.description}</p>
                                )}
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile Footer */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <motion.div
                      className="w-2 h-2 rounded-full bg-green-500"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                    <span className="text-sm text-green-600 font-medium">Live</span>
                  </div>
                  <NotificationBell />
                </div>
                
                {loading ? (
                  <Button variant="outline" className="w-full rounded-xl" disabled>
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </Button>
                ) : isAuthenticated ? (
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full rounded-xl gap-2">
                      <Bot className="w-4 h-4" />
                      My Agents
                    </Button>
                  </Link>
                ) : (
                  <Button className="w-full rounded-xl gap-2" asChild>
                    <a href={getLoginUrl()}>
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </a>
                  </Button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
