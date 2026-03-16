/// <reference types="google.maps" />
import { useEffect, useRef, useState } from 'react';
import { MapPin, Loader as Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    google?: typeof google;
  }
}

interface GoogleMapsViewProps {
  locations?: Array<{
    lat: number;
    lng: number;
    title: string;
    description?: string;
  }>;
}

const DEFAULT_LOCATIONS = [
  { lat: 42.6977, lng: 23.3219, title: 'София — Централен офис', description: 'Главен офис' },
  { lat: 42.1354, lng: 24.7453, title: 'Пловдив — Клон', description: 'Регионален офис' },
  { lat: 43.2141, lng: 27.9147, title: 'Варна — Клон', description: 'Регионален офис' },
];

export function GoogleMapsView({ locations = DEFAULT_LOCATIONS }: GoogleMapsViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;

  useEffect(() => {
    if (!apiKey) {
      setError('Google Maps API ключ не е конфигуриран (VITE_GOOGLE_MAPS_KEY)');
      return;
    }

    // Check if already loaded
    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => setError('Грешка при зареждане на Google Maps');
    document.head.appendChild(script);

    return () => {
      // Don't remove the script on unmount — it stays loaded
    };
  }, [apiKey]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.google?.maps) return;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 42.7, lng: 25.5 },
      zoom: 7,
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#1a1d29' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1d29' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#8b95a5' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c3040' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
        { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1e2233' }] },
      ],
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    mapInstanceRef.current = map;

    locations.forEach(loc => {
      const marker = new google.maps.Marker({
        position: { lat: loc.lat, lng: loc.lng },
        map,
        title: loc.title,
      });

      if (loc.description) {
        const infoWindow = new google.maps.InfoWindow({
          content: `<div style="color:#1a1d29;font-family:sans-serif"><strong>${loc.title}</strong><br/>${loc.description}</div>`,
        });
        marker.addListener('click', () => infoWindow.open(map, marker));
      }
    });
  }, [isLoaded, locations]);

  if (error) {
    return (
      <div className="bg-card rounded-xl shadow-card border border-border p-6">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-5 h-5 text-destructive" />
          <h2 className="text-lg font-semibold text-foreground">Google Maps</h2>
        </div>
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">Google Maps</h2>
            <p className="text-sm text-muted-foreground">Локации на организацията</p>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">{locations.length} локации</span>
      </div>
      <div className="relative" style={{ height: 400 }}>
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}
        <div ref={mapRef} className={cn('w-full h-full', !isLoaded && 'invisible')} />
      </div>
    </div>
  );
}
