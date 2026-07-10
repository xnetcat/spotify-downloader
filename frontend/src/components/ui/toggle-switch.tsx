import { forwardRef } from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

export interface ToggleSwitchProps {
  /** Whether the switch is on */
  checked: boolean;
  /** Callback when switch is toggled */
  onChange: (checked: boolean) => void;
  /** Label text */
  label?: string;
  /** Description text */
  description?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Whether the switch is disabled */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
  /** ID for form integration */
  id?: string;
  /** Name for form integration */
  name?: string;
}

const sizeConfig = {
  sm: {
    track: "h-4 w-7",
    thumb: "size-3 data-[state=checked]:translate-x-3.5 data-[state=unchecked]:translate-x-0.5",
    label: "text-sm",
  },
  md: {
    track: "h-5 w-9",
    thumb: "size-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5",
    label: "text-sm",
  },
  lg: {
    track: "h-6 w-11",
    thumb: "size-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5",
    label: "text-base",
  },
} as const;

export const ToggleSwitch = forwardRef<HTMLButtonElement, ToggleSwitchProps>(
  ({ checked, onChange, label, description, size = "md", disabled = false, className, id, name }, ref) => {
    const config = sizeConfig[size];

    return (
      <label
        className={cn(
          "inline-flex items-start gap-3",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          className
        )}
      >
        <SwitchPrimitive.Root
          ref={ref}
          id={id}
          name={name}
          checked={checked}
          onCheckedChange={onChange}
          disabled={disabled}
          className={cn(
            "peer inline-flex shrink-0 items-center rounded-full border border-transparent",
            "transition-colors outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "disabled:cursor-not-allowed",
            "data-[state=checked]:bg-primary data-[state=unchecked]:bg-elevated",
            config.track
          )}
        >
          <SwitchPrimitive.Thumb
            className={cn(
              "pointer-events-none block rounded-full bg-background shadow-sm ring-0 transition-transform",
              config.thumb
            )}
          />
        </SwitchPrimitive.Root>

        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <span className={cn("font-medium text-foreground", config.label)}>{label}</span>
            )}
            {description && (
              <span className="mt-0.5 text-xs text-muted-foreground">{description}</span>
            )}
          </div>
        )}
      </label>
    );
  }
);

ToggleSwitch.displayName = "ToggleSwitch";

export default ToggleSwitch;
