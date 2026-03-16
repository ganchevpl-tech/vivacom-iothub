import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Search, X } from 'lucide-react';
import type { Vehicle, VehicleStatus } from '@/types/fleet';

interface UnitsPanelProps {
  vehicles: Vehicle[];
  selectedVehicleId?: string;
  onVehicleSelect: (vehicleId: string) => void;
  stats: {
    totalVehicles: number;
    onlineNow: number;
    inMotion: number;
    activeAlerts: number;
  };
}

const statusFilters: { id: VehicleStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'moving', label: 'Moving' },
  { id: 'idle', label: 'Idle' },
  { id: 'parked-short', label: 'Parked' },
  { id: 'offline', label: 'Offline' },
];

const getStatusColor = (status: VehicleStatus) => {
  switch (status) {
    case 'moving':
      return 'bg-green-500/20 text-green-700 border-green-300';
    case 'idle':
      return 'bg-yellow-500/20 text-yellow-700 border-yellow-300';
    case 'parked-short':
      return 'bg-red-500/20 text-red-700 border-red-300';
    case 'parked-long':
      return 'bg-gray-500/20 text-gray-700 border-gray-300';
    case 'offline':
      return 'bg-gray-900/20 text-gray-300 border-gray-700';
  }
};

const getStatusDot = (status: VehicleStatus) => {
  switch (status) {
    case 'moving':
      return 'bg-green-500';
    case 'idle':
      return 'bg-yellow-500';
    case 'parked-short':
      return 'bg-red-500';
    case 'parked-long':
      return 'bg-gray-500';
    case 'offline':
      return 'bg-gray-900';
  }
};

const formatStatus = (status: VehicleStatus) => {
  return status.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
};

export function UnitsPanel({
  vehicles,
  selectedVehicleId,
  onVehicleSelect,
  stats,
}: UnitsPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<VehicleStatus | 'all'>('all');

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const matchesSearch =
        vehicle.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.driver.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatus === 'all' || vehicle.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [vehicles, searchQuery, selectedStatus]);

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed left-16 top-0 z-30 w-80 h-screen bg-card/95 backdrop-blur-sm border-r border-border shadow-lg flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">Units</h2>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Card className="p-2 bg-primary/10 border-primary/30">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold text-foreground">{stats.totalVehicles}</p>
          </Card>
          <Card className="p-2 bg-green-500/10 border-green-500/30">
            <p className="text-xs text-muted-foreground">Online</p>
            <p className="text-lg font-bold text-green-600">{stats.onlineNow}</p>
          </Card>
          <Card className="p-2 bg-blue-500/10 border-blue-500/30">
            <p className="text-xs text-muted-foreground">In Motion</p>
            <p className="text-lg font-bold text-blue-600">{stats.inMotion}</p>
          </Card>
          <Card className="p-2 bg-red-500/10 border-red-500/30">
            <p className="text-xs text-muted-foreground">Alerts</p>
            <p className="text-lg font-bold text-red-600">{stats.activeAlerts}</p>
          </Card>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search vehicle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
      </div>

      {/* Status Filters */}
      <div className="px-4 py-3 border-b border-border flex gap-2 overflow-x-auto">
        {statusFilters.map((filter) => (
          <Button
            key={filter.id}
            variant={selectedStatus === filter.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedStatus(filter.id)}
            className="whitespace-nowrap text-xs"
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Vehicle List */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          {filteredVehicles.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No vehicles found
            </p>
          ) : (
            filteredVehicles.map((vehicle) => (
              <motion.button
                key={vehicle.id}
                onClick={() => onVehicleSelect(vehicle.id)}
                whileHover={{ scale: 1.02 }}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedVehicleId === vehicle.id
                    ? 'bg-primary/20 border-primary shadow-md'
                    : 'bg-muted/50 border-muted-foreground/20 hover:bg-muted'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${getStatusDot(vehicle.status)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {vehicle.plate}
                      </p>
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {vehicle.speed > 0 ? `${vehicle.speed} km/h` : formatStatus(vehicle.status)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {vehicle.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {vehicle.driver}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))
          )}
        </div>
      </ScrollArea>
    </motion.div>
  );
}
