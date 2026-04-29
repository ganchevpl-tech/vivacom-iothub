import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Car, Users, MapPin, Bell, CircleAlert as AlertCircle, ChartBar as BarChart3, Wrench, Droplet, Package, Settings, Zap, Leaf } from 'lucide-react';
import type { LeftPanelTab } from '@/types/fleet';

interface LeftIconBarProps {
  activeTab: LeftPanelTab;
  onTabChange: (tab: LeftPanelTab) => void;
  alertCount: number;
}

const tabs: { icon: React.ReactNode; id: LeftPanelTab; label: string }[] = [
  { icon: <Car className="w-5 h-5" />, id: 'units', label: 'Units' },
  { icon: <Users className="w-5 h-5" />, id: 'drivers', label: 'Drivers' },
  { icon: <MapPin className="w-5 h-5" />, id: 'tracks', label: 'Tracks' },
  { icon: <AlertCircle className="w-5 h-5" />, id: 'alerts', label: 'Alerts' },
  { icon: <AlertCircle className="w-5 h-5" />, id: 'geofences', label: 'Geofences' },
  { icon: <BarChart3 className="w-5 h-5" />, id: 'reports', label: 'Reports' },
  { icon: <Wrench className="w-5 h-5" />, id: 'maintenance', label: 'Maintenance' },
  { icon: <Droplet className="w-5 h-5" />, id: 'fuel', label: 'Fuel' },
  { icon: <Package className="w-5 h-5" />, id: 'routes', label: 'Routes' },
  { icon: <Zap className="w-5 h-5" />, id: 'ev-readiness', label: 'EV Readiness' },
  { icon: <Leaf className="w-5 h-5" />, id: 'carbon', label: 'Carbon / ESG' },
  { icon: <Settings className="w-5 h-5" />, id: 'settings', label: 'Settings' },
];

export function LeftIconBar({ activeTab, onTabChange, alertCount }: LeftIconBarProps) {
  return (
    <motion.div
      initial={{ x: -40 }}
      animate={{ x: 0 }}
      className="fixed left-0 top-0 z-40 w-16 h-screen bg-sidebar border-r border-sidebar-border flex flex-col items-center py-4 gap-2"
    >
      {tabs.map((tab) => (
        <div key={tab.id} className="relative">
          <Button
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            size="icon"
            onClick={() => onTabChange(tab.id)}
            className="w-12 h-12 rounded-lg"
            title={tab.label}
          >
            {tab.icon}
          </Button>
          {tab.id === 'alerts' && alertCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {alertCount}
            </span>
          )}
        </div>
      ))}
    </motion.div>
  );
}
