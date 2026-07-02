import {
  AlertTriangle,
  BarChart3,
  Bell,
  Box,
  Crosshair,
  Drone,
  FileText,
  Files,
  LayoutDashboard,
  Layers,
  Map,
  Radar,
  Settings,
  Shield,
  Signal,
  TrendingUp,
  Truck,
  type LucideIcon,
} from "lucide-react";

export const DASHBOARD_ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  BarChart3,
  Map,
  FileText,
  Files,
  Bell,
  Settings,
  TrendingUp,
  Truck,
  Radar,
  Layers,
  Box,
  Shield,
  Drone,
  AlertTriangle,
  Crosshair,
  Signal,
};

export function DashboardIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = DASHBOARD_ICONS[name] ?? LayoutDashboard;
  return <Icon className={className} />;
}
