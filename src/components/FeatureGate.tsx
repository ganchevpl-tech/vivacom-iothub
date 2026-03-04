import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { Feature, FEATURE_LABELS, useFeatureFlags } from '@/hooks/useFeatureFlags';

interface LockedGateProps {
  feature: Feature;
  compact?: boolean;
}

function LockedGate({ feature, compact }: LockedGateProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border text-muted-foreground text-sm">
        <Lock className="w-4 h-4 flex-shrink-0" />
        <span>{FEATURE_LABELS[feature]} — не е активирано</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-card rounded-xl shadow-card border border-border p-8 flex flex-col items-center justify-center text-center"
    >
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Lock className="w-6 h-6 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">
          {FEATURE_LABELS[feature]}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Тази функция не е активирана за вашия акаунт. Свържете се с администратора.
        </p>
      </div>
    </motion.div>
  );
}

interface FeatureGateProps {
  feature: Feature;
  organizationId?: string;
  children: ReactNode;
  compact?: boolean;
  fallback?: ReactNode;
}

export function FeatureGate({
  feature,
  organizationId,
  children,
  compact = false,
  fallback,
}: FeatureGateProps) {
  const { hasFeature, isLoading } = useFeatureFlags(organizationId);

  if (isLoading) {
    return <div className="animate-pulse bg-muted/50 rounded-xl h-32" />;
  }

  if (hasFeature(feature)) return <>{children}</>;
  if (fallback) return <>{fallback}</>;

  return <LockedGate feature={feature} compact={compact} />;
}
