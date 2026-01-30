import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LocationHoursSummary } from '@/types/labor';
import { formatHours } from '@/utils/laborCalculations';
import { Clock, Users } from 'lucide-react';

// Fix for default marker icons in Leaflet with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons with Vivacom colors
const createCustomIcon = (color: 'green' | 'amber' | 'red') => {
  const colors = {
    green: '#22c55e',
    amber: '#f59e0b', 
    red: '#ef4444',
  };
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: ${colors[color]};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        position: relative;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          opacity: 0.9;
        "></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

interface AccessPoint {
  id: string;
  name: string;
  location: string;
  coordinates: [number, number];
  status: 'online' | 'high-traffic' | 'offline';
  activeUsers: number;
  lastActivity: string;
}

// Vivacom Access Points in Sofia
export const accessPoints: AccessPoint[] = [
  {
    id: 'viva-hq',
    name: 'Vivacom Headquarters',
    location: 'Business Park Sofia',
    coordinates: [42.6563, 23.3900],
    status: 'online',
    activeUsers: 234,
    lastActivity: '2 min ago',
  },
  {
    id: 'the-mall',
    name: 'The Mall Sofia',
    location: 'Tsarigradsko Shose 115',
    coordinates: [42.6711, 23.3737],
    status: 'high-traffic',
    activeUsers: 1893,
    lastActivity: '1 min ago',
  },
  {
    id: 'paradise-center',
    name: 'Paradise Center',
    location: 'Cherni Vrah Blvd 100',
    coordinates: [42.6629, 23.3173],
    status: 'online',
    activeUsers: 456,
    lastActivity: '3 min ago',
  },
  {
    id: 'ndk',
    name: 'National Palace of Culture',
    location: 'Bulgaria Square 1',
    coordinates: [42.6851, 23.3189],
    status: 'online',
    activeUsers: 189,
    lastActivity: '5 min ago',
  },
];

const getMarkerIcon = (status: AccessPoint['status']) => {
  switch (status) {
    case 'online':
      return createCustomIcon('green');
    case 'high-traffic':
      return createCustomIcon('amber');
    case 'offline':
      return createCustomIcon('red');
  }
};

const getStatusBadge = (status: AccessPoint['status']) => {
  const styles = {
    online: 'bg-status-ok/20 text-status-ok border-status-ok/30',
    'high-traffic': 'bg-status-warning/20 text-status-warning border-status-warning/30',
    offline: 'bg-status-alert/20 text-status-alert border-status-alert/30',
  };
  
  const labels = {
    online: 'Online',
    'high-traffic': 'High Traffic',
    offline: 'Offline',
  };
  
  return (
    <span className={cn(
      'px-2 py-0.5 rounded-full text-xs font-semibold border',
      styles[status]
    )}>
      {labels[status]}
    </span>
  );
};

// Component to handle map view centering
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, 12);
  }, [center, map]);
  
  return null;
}

interface AccessPointsMapProps {
  locationHours?: LocationHoursSummary[];
  className?: string;
}

export function AccessPointsMap({ locationHours, className }: AccessPointsMapProps) {
  const mapRef = useRef<L.Map>(null);
  const sofiaCenter: [number, number] = [42.6977, 23.3219];
  
  // Get hours summary for a specific location
  const getLocationHours = (pointId: string) => {
    return locationHours?.find((l) => l.locationId === pointId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className={cn('bg-card rounded-xl shadow-card border border-border p-6', className)}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Access Points Map</h3>
          <p className="text-sm text-muted-foreground">Live monitoring across Sofia</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-status-ok" />
            <span className="text-muted-foreground">Online</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-status-warning" />
            <span className="text-muted-foreground">High Traffic</span>
          </div>
        </div>
      </div>
      
      <div className="aspect-video rounded-lg overflow-hidden border border-border">
        <MapContainer
          ref={mapRef}
          center={sofiaCenter}
          zoom={12}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          {/* Dark themed map tiles - CartoDB Dark Matter */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          
          <MapController center={sofiaCenter} />
          
          {accessPoints.map((point) => {
            const hoursData = getLocationHours(point.id);
            
            return (
              <Marker
                key={point.id}
                position={point.coordinates}
                icon={getMarkerIcon(point.status)}
              >
                <Popup className="custom-popup">
                  <div className="min-w-[220px] p-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-sm text-foreground">{point.name}</h4>
                      {getStatusBadge(point.status)}
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{point.location}</p>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div className="bg-muted/50 rounded px-2 py-1.5">
                        <p className="text-muted-foreground">Active Users</p>
                        <p className="font-semibold text-foreground">{point.activeUsers.toLocaleString()}</p>
                      </div>
                      <div className="bg-muted/50 rounded px-2 py-1.5">
                        <p className="text-muted-foreground">Last Activity</p>
                        <p className="font-semibold text-foreground">{point.lastActivity}</p>
                      </div>
                    </div>
                    
                    {/* Location Hours Summary */}
                    {hoursData && (
                      <div className="border-t border-border pt-2 mt-2">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          <span className="text-xs font-medium text-foreground">Today's Hours</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-primary/10 rounded px-2 py-1.5">
                            <p className="text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Total
                            </p>
                            <p className="font-bold text-primary">{formatHours(hoursData.totalHoursToday)}</p>
                          </div>
                          <div className="bg-muted/50 rounded px-2 py-1.5">
                            <p className="text-muted-foreground flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              Employees
                            </p>
                            <p className="font-semibold text-foreground">{hoursData.employeeCount}</p>
                          </div>
                        </div>
                        {hoursData.entries.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {hoursData.entries.slice(0, 3).map((entry, idx) => (
                              <div key={idx} className="flex justify-between text-xs">
                                <span className="text-muted-foreground truncate max-w-[120px]">
                                  {entry.employeeName}
                                </span>
                                <span className="font-medium text-foreground">
                                  {formatHours(entry.hours)}
                                </span>
                              </div>
                            ))}
                            {hoursData.entries.length > 3 && (
                              <p className="text-xs text-muted-foreground">
                                +{hoursData.entries.length - 3} more
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
      
      {/* Access Points List */}
      <div className="mt-4 space-y-2">
        {accessPoints.map((point) => {
          const hoursData = getLocationHours(point.id);
          
          return (
            <div 
              key={point.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={cn(
                  'w-2.5 h-2.5 rounded-full',
                  point.status === 'online' && 'bg-status-ok',
                  point.status === 'high-traffic' && 'bg-status-warning animate-pulse',
                  point.status === 'offline' && 'bg-status-alert'
                )} />
                <div>
                  <p className="text-sm font-medium text-foreground">{point.name}</p>
                  <p className="text-xs text-muted-foreground">{point.location}</p>
                </div>
              </div>
              <div className="text-right">
                {hoursData ? (
                  <>
                    <p className="text-sm font-semibold text-primary">{formatHours(hoursData.totalHoursToday)}</p>
                    <p className="text-xs text-muted-foreground">{hoursData.employeeCount} employees</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-foreground">{point.activeUsers.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">users</p>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
