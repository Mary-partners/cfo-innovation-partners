import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <p className={cn("text-3xl font-semibold text-navy-900")}>{value}</p>
        {hint ? <p className="mt-1 text-xs text-slate-text/60">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
