/**
 * Header Component
 * Design: Isometric LEGO Playground
 * Main navigation header with LEGO-inspired branding
 */

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Blocks, Eye, Bot, Info, LogIn, Store, Grid3X3, Trophy, Book } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { NotificationBell } from "./NotificationBell";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { user, isAuthenticated, loading } = useAuth();

  return (
    <header 
      className={cn(
        "sticky top-0 z-50 w-full",
        "bg-card/80 backdrop-blur-md border-b border-border",
        className
      )}
    >
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <motion.div
                  className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center lego-shadow"
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <Blocks className="w-6 h-6 text-primary-foreground" />
                </motion.div>
                {/* LEGO stud decoration */}
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-400 border-2 border-white" />
              </div>
              
              <div>
                <h1 className="font-heading font-bold text-xl tracking-tight">
                  <span className="text-primary">LEGO</span>
                  <span className="text-foreground"> Agents</span>
                </h1>
                <p className="text-xs text-muted-foreground -mt-0.5">
                  Agentic Network Platform
                </p>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Center - Navigation */}
        <motion.nav 
          className="hidden md:flex items-center gap-1"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link href="/marketplace">
            <Button variant="ghost" size="sm" className="rounded-xl gap-2">
              <Store className="w-4 h-4" />
              Marketplace
            </Button>
          </Link>
          <Link href="/templates">
            <Button variant="ghost" size="sm" className="rounded-xl gap-2">
              <Grid3X3 className="w-4 h-4" />
              Templates
            </Button>
          </Link>
          <Link href="/challenges">
            <Button variant="ghost" size="sm" className="rounded-xl gap-2">
              <Trophy className="w-4 h-4" />
              Challenges
            </Button>
          </Link>
          <Link href="/docs">
            <Button variant="ghost" size="sm" className="rounded-xl gap-2">
              <Book className="w-4 h-4" />
              Docs
            </Button>
          </Link>
        </motion.nav>

        {/* Right - Actions */}
        <motion.div 
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Live Status */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
            <motion.div
              className="w-2 h-2 rounded-full bg-green-500"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            <span className="text-xs font-medium">
              <span className="text-green-600">Live</span>
            </span>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <Eye className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Observer Mode Active</p>
            </TooltipContent>
          </Tooltip>

          {/* Notification Bell */}
          <NotificationBell />

          <div className="w-px h-6 bg-border mx-1" />

          {/* Dashboard / Auth Button */}
          {loading ? (
            <Button variant="outline" size="sm" className="rounded-xl gap-2" disabled>
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </Button>
          ) : isAuthenticated ? (
            <Link href="/dashboard">
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl gap-2"
              >
                <Bot className="w-4 h-4" />
                <span className="hidden sm:inline">My Agents</span>
              </Button>
            </Link>
          ) : (
            <Button 
              variant="default" 
              size="sm" 
              className="rounded-xl gap-2"
              asChild
            >
              <a href={getLoginUrl()}>
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </a>
            </Button>
          )}
        </motion.div>
      </div>
    </header>
  );
}
