/**
 * Header Component
 * Design: Isometric LEGO Playground
 * Main navigation header with LEGO-inspired branding
 * Fully responsive with mobile hamburger menu
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Blocks, Eye, Bot, LogIn, Store, Grid3X3, Trophy, Book, Heart,
  Menu, X, ChevronRight, Camera, Box, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { NotificationBell } from "./NotificationBell";

interface HeaderProps {
  className?: string;
}

const navItems = [
  { href: "/marketplace", icon: Store, label: "Marketplace" },
  { href: "/templates", icon: Grid3X3, label: "Templates" },
  { href: "/challenges", icon: Trophy, label: "Challenges" },
  { href: "/docs", icon: Book, label: "Docs" },
  { href: "/support", icon: Heart, label: "Support", highlight: true },
];

export function Header({ className }: HeaderProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

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
          <motion.div 
            className="flex items-center gap-2 sm:gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
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
                  {/* LEGO stud decoration */}
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
          </motion.div>

          {/* Center - Desktop Navigation */}
          <motion.nav 
            className="hidden lg:flex items-center gap-1"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "rounded-xl gap-2",
                    item.highlight && "text-red-500 hover:text-red-600 hover:bg-red-50",
                    location === item.href && "bg-muted"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </motion.nav>

          {/* Right - Actions */}
          <motion.div 
            className="flex items-center gap-1 sm:gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Free Build Button */}
            <Link href="/builder">
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3"
              >
                <Box className="w-4 h-4" />
                <span className="hidden sm:inline">Free Build</span>
              </Button>
            </Link>

            {/* Dream Build Button */}
            <Link href="/dream">
              <Button 
                variant="default" 
                size="sm" 
                className="rounded-xl gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3 bg-gradient-to-r from-primary to-yellow-500 hover:opacity-90"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Dream Build</span>
              </Button>
            </Link>

            {/* Scan & Build Button */}
            <Link href="/start-build">
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Scan & Build</span>
              </Button>
            </Link>

            {/* Live Status - Hidden on mobile */}
            <Link href="/live">
              <div className="hidden md:flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-muted hover:bg-muted/80 cursor-pointer transition-colors">
                <motion.div
                  className="w-2 h-2 rounded-full bg-green-500"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
                <span className="text-xs font-medium">
                  <span className="text-green-600">Live</span>
                </span>
              </div>
            </Link>

            {/* Observer Mode - Hidden on small screens */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden sm:flex rounded-xl w-8 h-8 sm:w-9 sm:h-9">
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Observer Mode Active</p>
              </TooltipContent>
            </Tooltip>

            {/* Notification Bell */}
            <div className="hidden sm:block">
              <NotificationBell />
            </div>

            <div className="hidden sm:block w-px h-6 bg-border mx-1" />

            {/* Dashboard / Auth Button */}
            {loading ? (
              <Button variant="outline" size="sm" className="rounded-xl gap-2 h-8 sm:h-9 px-2 sm:px-3" disabled>
                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </Button>
            ) : isAuthenticated ? (
              <Link href="/dashboard">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3"
                >
                  <Bot className="w-4 h-4" />
                  <span className="hidden sm:inline">My Agents</span>
                </Button>
              </Link>
            ) : (
              <Button 
                variant="default" 
                size="sm" 
                className="rounded-xl gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3"
                asChild
              >
                <a href={getLoginUrl()}>
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </a>
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-xl w-8 h-8 sm:w-9 sm:h-9 ml-1"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </motion.div>
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
              className="fixed top-0 right-0 bottom-0 z-50 w-72 sm:w-80 bg-card border-l border-border lg:hidden"
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

              {/* Menu Items */}
              <nav className="p-4 space-y-2">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={item.href} onClick={() => setMobileMenuOpen(false)}>
                      <div 
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl transition-colors",
                          "hover:bg-muted",
                          item.highlight && "text-red-500",
                          location === item.href && "bg-muted"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.label}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Mobile-only Actions */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
                <div className="flex items-center justify-between mb-4">
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
