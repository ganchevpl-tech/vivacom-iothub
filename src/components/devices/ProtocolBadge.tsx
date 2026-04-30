import { cn } from '@/lib/utils';
import { DeviceProtocol, PROTOCOL_COLORS, PROTOCOL_LABELS } from '@/types/protocols';
import { Radio, Wifi, Network, Zap } from 'lucide-react';

const ICONS: Record<DeviceProtocol, typeof Radio> = {
  matter: Network,
  zigbee: Radio,
  'z-wave': Zap,
  mqtt: Radio,
  wifi: Wifi,
};

interface ProtocolBadgeProps {
  protocol: DeviceProtocol;
  className?: string;
  showLabel?: boolean;
}

export function ProtocolBadge({ protocol, className, showLabel = true }: ProtocolBadgeProps) {
  const Icon = ICONS[protocol];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-semibold',
        PROTOCOL_COLORS[protocol],
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {showLabel && PROTOCOL_LABELS[protocol]}
    </span>
  );
}
