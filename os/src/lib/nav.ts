import {
  LayoutDashboard,
  Building2,
  ListChecks,
  Inbox,
  ShieldCheck,
  CalendarClock,
  Receipt,
  FolderClosed,
  Users,
  BarChart3,
  Workflow,
  Settings,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** false = placeholder page, ships in a later phase (see /docs/implementation-plan.md) */
  implemented: boolean;
  phase: string;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Command Centre", icon: LayoutDashboard, implemented: true, phase: "Phase 1" },
  { href: "/clients", label: "Clients", icon: Building2, implemented: true, phase: "Phase 1" },
  { href: "/work", label: "Work", icon: ListChecks, implemented: false, phase: "Phase 1" },
  { href: "/requests", label: "Requests", icon: Inbox, implemented: false, phase: "Phase 2" },
  { href: "/quality", label: "Quality", icon: ShieldCheck, implemented: false, phase: "Phase 2" },
  { href: "/calendar", label: "Calendar & Deadlines", icon: CalendarClock, implemented: false, phase: "Phase 1" },
  { href: "/billing", label: "Time & Billing", icon: Receipt, implemented: false, phase: "Phase 3" },
  { href: "/documents", label: "Documents", icon: FolderClosed, implemented: false, phase: "Phase 1" },
  { href: "/team", label: "Team & Capacity", icon: Users, implemented: false, phase: "Phase 2" },
  { href: "/reports", label: "Reports & Analytics", icon: BarChart3, implemented: false, phase: "Phase 2" },
  { href: "/templates", label: "Templates & Automations", icon: Workflow, implemented: false, phase: "Phase 1" },
  { href: "/settings", label: "Settings & Security", icon: Settings, implemented: true, phase: "Phase 0" },
];
