import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ShieldCheck,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Wifi,
  Menu,
  Clock,
  Truck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/access-control', label: 'Access Control', icon: ShieldCheck },
  { path: '/time-management', label: 'Time Management', icon: Clock },
  { path: '/fleet', label: 'Fleet', icon: Truck },
  { path: '/logs', label: 'Logs', icon: FileText },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function DashboardSidebar({ collapsed, onCollapse }: SidebarProps) {
  const location = useLocation();
  
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 z-40 h-screen bg-sidebar shadow-sidebar flex flex-col"
    >
      {/* Logo Section */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
            <Wifi className="w-5 h-5 text-primary-foreground" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <h1 className="font-bold text-lg text-sidebar-foreground whitespace-nowrap">
                  Vivacom<span className="text-primary"> IoT</span>
                </h1>
                <p className="text-xs text-sidebar-foreground/60 whitespace-nowrap">
                  Enterprise Dashboard
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group',
                'hover:bg-sidebar-accent',
                isActive 
                  ? 'bg-primary text-primary-foreground shadow-lg' 
                  : 'text-sidebar-foreground'
              )}
            >
              <item.icon className={cn(
                'w-5 h-5 flex-shrink-0 transition-transform',
                !isActive && 'group-hover:scale-110'
              )} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="font-medium whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          );
        })}
      </nav>

      {/* Connection Status */}
      <div className="px-3 pb-4">
        <div className={cn(
          'flex items-center gap-3 px-3 py-3 rounded-lg bg-sidebar-accent',
          collapsed && 'justify-center'
        )}>
          <div className="relative flex-shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-status-ok animate-pulse-status" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden"
              >
                <p className="text-xs text-sidebar-foreground/80 whitespace-nowrap">MQTT Connected</p>
                <p className="text-xs text-sidebar-foreground/50 whitespace-nowrap">flespi.io</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse Toggle */}
      <div className="px-3 pb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCollapse(!collapsed)}
          className={cn(
            'w-full justify-center text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
            !collapsed && 'justify-start'
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 mr-2" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </motion.aside>
  );
}
