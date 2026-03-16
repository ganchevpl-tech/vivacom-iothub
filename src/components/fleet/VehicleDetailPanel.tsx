import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { X, MapPin, Gauge, Zap, Signal, Users, MapPin as MapPinIcon, Droplet, Navigation2, Smartphone } from 'lucide-react';
import type { Vehicle } from '@/types/fleet';

interface VehicleDetailPanelProps {
  vehicle: Vehicle | undefined;
  onClose: () => void;
}

const getStatusColor = (status: string) => {
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
    default:
      return 'bg-blue-500/20 text-blue-700 border-blue-300';
  }
};

const formatStatus = (status: string) => {
  return status.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
};

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export function VehicleDetailPanel({ vehicle, onClose }: VehicleDetailPanelProps) {
  if (!vehicle) return null;

  const handleStreetView = () => {
    window.open(
      `https://maps.google.com/?cbll=${vehicle.latitude},${vehicle.longitude}&layer=c`,
      '_blank'
    );
  };

  const handleNavigate = () => {
    window.open(
      `https://maps.google.com/dir/${vehicle.latitude},${vehicle.longitude}`,
      '_blank'
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 320 }}
        animate={{ x: 0 }}
        exit={{ x: 320 }}
        transition={{ duration: 0.3 }}
        className="fixed right-0 top-0 z-30 w-80 h-screen bg-card/95 backdrop-blur-sm border-l border-border shadow-lg flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">{vehicle.plate}</h2>
              <Badge variant="outline" className={getStatusColor(vehicle.status)}>
                {formatStatus(vehicle.status)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {vehicle.make} {vehicle.model}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Vehicle Info */}
          <Card className="p-3 bg-muted/50 border-muted-foreground/20">
            <p className="text-xs text-muted-foreground mb-1">Vehicle Name</p>
            <p className="font-semibold text-foreground">{vehicle.name}</p>
          </Card>

          {/* Status Duration */}
          <Card className="p-3 bg-muted/50 border-muted-foreground/20">
            <p className="text-xs text-muted-foreground mb-1">Status Duration</p>
            <p className="font-semibold text-foreground">
              {formatDuration(vehicle.statusDuration)}
            </p>
          </Card>

          {/* Movement Info */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3 bg-blue-500/10 border-blue-300/30">
              <Gauge className="w-4 h-4 text-blue-600 mb-1" />
              <p className="text-xs text-muted-foreground">Speed</p>
              <p className="font-semibold text-foreground">{vehicle.speed} km/h</p>
            </Card>
            <Card className="p-3 bg-purple-500/10 border-purple-300/30">
              <Navigation2 className="w-4 h-4 text-purple-600 mb-1" />
              <p className="text-xs text-muted-foreground">Heading</p>
              <p className="font-semibold text-foreground">{vehicle.heading}°</p>
            </Card>
          </div>

          {/* Battery & Signal */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3 bg-amber-500/10 border-amber-300/30">
              <Zap className="w-4 h-4 text-amber-600 mb-1" />
              <p className="text-xs text-muted-foreground">Battery</p>
              <p className="font-semibold text-foreground">{vehicle.battery.toFixed(1)}V</p>
            </Card>
            <Card className="p-3 bg-cyan-500/10 border-cyan-300/30">
              <Signal className="w-4 h-4 text-cyan-600 mb-1" />
              <p className="text-xs text-muted-foreground">GSM Signal</p>
              <p className="font-semibold text-foreground">
                {Array(vehicle.signal).fill('▪').join('')}
              </p>
            </Card>
          </div>

          {/* Driver */}
          <Card className="p-3 bg-muted/50 border-muted-foreground/20">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Driver</p>
            </div>
            <p className="font-semibold text-foreground">{vehicle.driver}</p>
          </Card>

          {/* Address */}
          <Card className="p-3 bg-muted/50 border-muted-foreground/20">
            <div className="flex items-start gap-2 mb-1">
              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">Location</p>
            </div>
            <p className="font-semibold text-foreground text-sm">{vehicle.address}</p>
          </Card>

          {/* Fuel Level */}
          <Card className="p-3 bg-muted/50 border-muted-foreground/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Droplet className="w-4 h-4 text-orange-500" />
                <p className="text-xs text-muted-foreground">Fuel Level</p>
              </div>
              <p className="font-semibold text-foreground">{vehicle.fuel}%</p>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all"
                style={{ width: `${vehicle.fuel}%` }}
              />
            </div>
          </Card>

          {/* Mileage */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3 bg-muted/50 border-muted-foreground/20">
              <p className="text-xs text-muted-foreground mb-1">Today</p>
              <p className="font-semibold text-foreground">{vehicle.mileageToday} km</p>
            </Card>
            <Card className="p-3 bg-muted/50 border-muted-foreground/20">
              <p className="text-xs text-muted-foreground mb-1">Total</p>
              <p className="font-semibold text-foreground">
                {(vehicle.mileageTotal / 1000).toFixed(0)}K km
              </p>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-border p-4 space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleStreetView}
            className="w-full"
          >
            <Smartphone className="w-4 h-4 mr-2" />
            Street View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNavigate}
            className="w-full"
          >
            <MapPinIcon className="w-4 h-4 mr-2" />
            Navigate
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
              >
                Stop Engine
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogTitle>Stop Engine?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to stop the engine on {vehicle.plate}? This action cannot be undone.
              </AlertDialogDescription>
              <div className="flex justify-end gap-2">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Stop Engine
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
