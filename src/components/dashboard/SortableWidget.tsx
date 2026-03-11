import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { WIDGET_LABELS } from '@/hooks/useDashboardLayout';
import { cn } from '@/lib/utils';

interface SortableWidgetProps {
  id: string;
  isEditing: boolean;
  children: React.ReactNode;
}

export function SortableWidget({ id, isEditing, children }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group',
        isDragging && 'opacity-50',
        isEditing && 'ring-2 ring-primary/20 ring-dashed rounded-xl'
      )}
    >
      {isEditing && (
        <button
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 z-50 flex items-center gap-1 px-2 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium cursor-grab active:cursor-grabbing shadow-md"
        >
          <GripVertical className="w-3 h-3" />
          {WIDGET_LABELS[id] || id}
        </button>
      )}
      {children}
    </div>
  );
}
