import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction, type LucideIcon } from "lucide-react";

interface ModulePlaceholderProps {
  title: string;
  description: string;
  note: string;
  icon?: LucideIcon;
  features?: string[];
}

/**
 * Shown for modules included in the spec but not part of this MVP demo.
 * Keeps navigation complete and communicates what the module will contain.
 */
export function ModulePlaceholder({
  title,
  description,
  note,
  icon: Icon = Construction,
  features = [],
}: ModulePlaceholderProps) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <Badge tone="warning">MVP</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <Card className="flex flex-col items-center justify-center gap-4 p-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-8 w-8" />
        </div>
        <p className="max-w-md text-sm text-muted-foreground">{note}</p>
        {features.length > 0 && (
          <ul className="mt-2 flex flex-wrap justify-center gap-2">
            {features.map((f) => (
              <li key={f}>
                <Badge tone="neutral">{f}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
