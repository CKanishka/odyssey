import { cn } from "../../lib/utils";

interface RadioOptionProps {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  title: string;
  description?: string;
  className?: string;
}

export function RadioOption({
  name,
  value,
  checked,
  onChange,
  disabled = false,
  title,
  description,
  className,
}: RadioOptionProps) {
  return (
    <label
      className={cn(
        "flex items-start p-3 rounded-lg border-2 cursor-pointer transition-all",
        {
          "border-primary bg-primary/5": checked,
          "border-border bg-background hover:border-primary/50": !checked,
          "opacity-50 cursor-not-allowed": disabled,
        },
        className
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="mt-0.5 mr-3 h-4 w-4 accent-primary"
      />
      <div className="flex-1">
        <div className="text-sm text-foreground">{title}</div>
        {description && (
          <div className="text-sm text-muted-foreground">{description}</div>
        )}
      </div>
    </label>
  );
}
