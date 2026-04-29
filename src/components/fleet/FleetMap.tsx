import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Vehicle } from '@/types/fleet';

interface FleetMapProps {
  vehicles: Vehicle[];
  selectedVehicleId?: string;
  onVehicleSelect: (vehicleId: string) => void;
}

// Светофар: зелено=движение, жълто=idle (двигател работи), червено=изгасен
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'moving':
      return '#22c55e'; // 🟢 зелено
    case 'idle':
      return '#eab308'; // 🟡 жълто — спрян, но ключът е в гнездото
    case 'parked-short':
      return '#ef4444'; // 🔴 червено — изгасен двигател
    case 'parked-long':
      return '#dc2626'; // 🔴 тъмно червено — изгасен отдавна
    case 'offline':
      return '#6b7280'; // ⚫ сиво — без връзка
    default:
      return '#3b82f6';
  }
};

const createCustomIcon = (status: string, isSelected: boolean) => {
  const color = getStatusColor(status);
  const size = isSelected ? 40 : 32;

  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: ${isSelected ? '3px' : '2px'} solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        font-size: 16px;
      ">
        🚗
      </div>
    `,
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

export function FleetMap({ vehicles, selectedVehicleId, onVehicleSelect }: FleetMapProps) {
  return (
    <MapContainer
      center={[42.6977, 23.3219]}
      zoom={13}
      style={{ width: '100%', height: '100%' }}
      className="rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {vehicles.map((vehicle) => (
        <Marker
          key={vehicle.id}
          position={[vehicle.latitude, vehicle.longitude]}
          icon={createCustomIcon(vehicle.status, selectedVehicleId === vehicle.id)}
          eventHandlers={{
            click: () => onVehicleSelect(vehicle.id),
          }}
        >
          <Popup>
            <div className="text-xs space-y-1">
              <div className="font-semibold">{vehicle.plate}</div>
              <div className="text-muted-foreground">{vehicle.name}</div>
              <div className="text-muted-foreground">Driver: {vehicle.driver}</div>
              <div className="text-muted-foreground">
                {vehicle.status === 'moving' ? `${vehicle.speed} km/h` : vehicle.status}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
