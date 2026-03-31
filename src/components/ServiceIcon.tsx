import { Wrench, Zap, Sparkles, Home, Truck, Thermometer, Hammer, LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Wrench,
  Zap,
  Sparkles,
  Home,
  Truck,
  Thermometer,
  Hammer,
};

interface ServiceIconProps {
  icon: string;
  className?: string;
}

export function ServiceIcon({ icon, className = "w-6 h-6" }: ServiceIconProps) {
  const Icon = iconMap[icon] || Wrench;
  return <Icon className={className} />;
}
