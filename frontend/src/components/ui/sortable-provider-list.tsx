import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Music2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ToggleSwitch } from "./toggle-switch";

export interface ProviderPreference {
  id: string;
  enabled: boolean;
}

export interface ProviderInfo {
  id: string;
  name: string;
  icon: string;
  default_enabled: boolean;
}

interface SortableProviderItemProps {
  preference: ProviderPreference;
  provider: ProviderInfo;
  index: number;
  onToggle: (id: string) => void;
}

function SortableProviderItem({
  preference,
  provider,
  index,
  onToggle,
}: SortableProviderItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: preference.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-2.5 transition-colors",
        isDragging && "border-primary opacity-60",
        !preference.enabled && "opacity-60"
      )}
    >
      {/* Drag handle */}
      <button
        type="button"
        aria-label={`Reorder ${provider.name}`}
        {...attributes}
        {...listeners}
        className={cn(
          "shrink-0 cursor-grab rounded p-1 text-faint transition-colors active:cursor-grabbing",
          "hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        )}
      >
        <GripVertical className="size-4" />
      </button>

      {/* Priority index */}
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full font-mono text-xs font-medium tnum",
          preference.enabled ? "bg-primary/15 text-primary" : "bg-elevated text-faint"
        )}
      >
        {index + 1}
      </span>

      {/* Provider icon */}
      <Music2 className="size-4 shrink-0 text-faint" aria-hidden />

      {/* Provider name */}
      <span
        className={cn(
          "flex-1 text-sm font-medium",
          preference.enabled ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {provider.name}
      </span>

      {/* Enable/disable toggle */}
      <ToggleSwitch
        checked={preference.enabled}
        onChange={() => onToggle(preference.id)}
        size="sm"
      />
    </div>
  );
}

export interface SortableProviderListProps {
  preferences: ProviderPreference[];
  providers: ProviderInfo[];
  onReorder: (preferences: ProviderPreference[]) => void;
  onToggle: (id: string) => void;
  label?: string;
  description?: string;
}

export function SortableProviderList({
  preferences,
  providers,
  onReorder,
  onToggle,
  label,
  description,
}: SortableProviderListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Create a map for quick provider lookup
  const providerMap = new Map(providers.map((p) => [p.id, p]));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = preferences.findIndex((p) => p.id === active.id);
      const newIndex = preferences.findIndex((p) => p.id === over.id);
      onReorder(arrayMove(preferences, oldIndex, newIndex));
    }
  };

  return (
    <div className="space-y-3">
      {label && (
        <div>
          <span className="text-sm font-medium text-foreground">{label}</span>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={preferences.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {preferences.map((pref, index) => {
              const provider = providerMap.get(pref.id);
              if (!provider) return null;
              return (
                <SortableProviderItem
                  key={pref.id}
                  preference={pref}
                  provider={provider}
                  index={index}
                  onToggle={onToggle}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

export default SortableProviderList;
