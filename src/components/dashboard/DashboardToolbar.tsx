import { motion } from 'framer-motion';
import { GripVertical, RotateCcw, Lock, Clock as Unlock, Loader as Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DashboardToolbarProps {
  isEditing: boolean;
  isSaving: boolean;
  onToggleEdit: () => void;
  onReset: () => void;
}

export function DashboardToolbar({ isEditing, isSaving, onToggleEdit, onReset }: DashboardToolbarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3"
    >
      <Button
        variant={isEditing ? 'default' : 'outline'}
        size="sm"
        onClick={onToggleEdit}
        className={cn(
          'gap-2 transition-all',
          isEditing && 'ring-2 ring-primary/30'
        )}
      >
        {isEditing ? (
          <>
            <Lock className="w-4 h-4" />
            Заключи
          </>
        ) : (
          <>
            <Unlock className="w-4 h-4" />
            Редактирай
          </>
        )}
      </Button>

      {isEditing && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2"
        >
          <Button variant="outline" size="sm" onClick={onReset} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Нулирай
          </Button>
          {isSaving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <GripVertical className="w-3 h-3" />
            Плъзни за преместване
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
