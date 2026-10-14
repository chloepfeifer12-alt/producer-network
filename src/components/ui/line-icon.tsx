import { Building2, ChartLine, Compass, ClipboardList, Crown, Gem, HeartPulse, House, Landmark, PiggyBank, Stethoscope, Umbrella, Users, Waves, type LucideProps } from "lucide-react";
import type { LineSlug } from "@/lib/data/types";

const MAP: Record<LineSlug, React.ComponentType<LucideProps>> = {
  life: HeartPulse,
  "accident-health": Stethoscope,
  "property-casualty": Umbrella,
  "personal-lines": House,
  commercial: Building2,
  medicare: Landmark,
  annuities: PiggyBank,
  "employee-benefits": Users,
  specialty: Gem,
  "surplus-lines": Waves,
  "claims-operations": ClipboardList,
  "agency-leadership": Crown,
  "financial-planning": Compass,
  "wealth-management": Gem,
  "retirement-plans": PiggyBank,
  "investments-securities": ChartLine,
  "bank-financial-services": Landmark,
};

export function LineIcon({ line, ...props }: { line: LineSlug } & LucideProps) {
  const Icon = MAP[line];
  return <Icon strokeWidth={1.6} {...props} />;
}
