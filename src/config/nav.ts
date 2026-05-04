import {
  LayoutDashboard,
  Map,
  Radar,
  MessageSquare,
  Building2,
  UsersRound,
  IdCard,
  Truck,
  CalendarClock,
  ScanLine,
  Warehouse,
  Boxes,
  Sparkles,
  ScanText,
  FileText,
  PenLine,
  ShieldCheck,
  Sparkle,
  CreditCard,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  title: string
  url: string
  icon: LucideIcon
  badge?: string | number
  children?: { title: string; url: string }[]
}

export type NavSection = {
  label: string
  items: NavItem[]
}

export const navSections: NavSection[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Live Map", url: "/map", icon: Map },
      { title: "Control Tower", url: "/control-tower", icon: Radar },
    ],
  },
  {
    label: "Communication",
    items: [
      { title: "Messenger", url: "/messenger", icon: MessageSquare },
    ],
  },
  {
    label: "Organization",
    items: [
      {
        title: "Company",
        url: "/company",
        icon: Building2,
        children: [
          { title: "Account", url: "/company" },
          { title: "Site Details", url: "/company/site-details" },
          { title: "Facilities", url: "/company/facilities" },
        ],
      },
      { title: "Users", url: "/users", icon: UsersRound },
      { title: "Company Drivers", url: "/drivers", icon: IdCard },
      { title: "Fleet Management", url: "/fleet", icon: Truck },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Appointments", url: "/operations/appointments", icon: CalendarClock },
      { title: "Gate", url: "/operations/gate", icon: ScanLine },
      { title: "Dock Board", url: "/operations/dock", icon: Warehouse },
      { title: "Loads", url: "/operations/loads", icon: Boxes },
      { title: "Optimization", url: "/operations/optimization", icon: Sparkles },
    ],
  },
  {
    label: "Documents",
    items: [
      { title: "Document Scanner", url: "/documents/scanner", icon: ScanText },
      { title: "Document Generator", url: "/documents/generator", icon: FileText },
      { title: "Digital Signature", url: "/documents/signature", icon: PenLine },
    ],
  },
  {
    label: "Compliance",
    items: [
      { title: "Compliance Hub", url: "/compliance", icon: ShieldCheck },
    ],
  },
  {
    label: "Billing",
    items: [
      { title: "Subscription", url: "/billing/subscription", icon: Sparkle },
      { title: "Payments", url: "/billing/payments", icon: CreditCard },
    ],
  },
]
