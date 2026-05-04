import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

// ─── Types ────────────────────────────────────────────────────────────────

export type DriverStatus = "on-duty" | "rest" | "off" | "expiring"
export type Driver = {
  id: string
  name: string
  license: string
  licenseExp: string
  hours: { used: number; max: number }
  status: DriverStatus
  loadId?: string
  phone: string
}

export type VehicleStatus = "on-route" | "idle" | "maintenance"
export type Vehicle = {
  id: string
  model: string
  year: number
  driverId?: string
  odometer: number
  status: VehicleStatus
  nextService: string
}

export type Facility = {
  id: string
  name: string
  type: "Cross-dock" | "Warehouse" | "Yard only"
  city: string
  manager: string
  docks: number
  yard: number
  status: "active" | "pilot"
}

export type UserRole =
  | "Hub Manager"
  | "Dispatcher"
  | "Operator"
  | "Compliance"
  | "Gate Guard"
export type UserStatus = "active" | "invited" | "suspended"
export type AppUser = {
  id: string
  name: string
  email: string
  role: UserRole
  branch: string
  status: UserStatus
  lastActive: string
}

export type AppointmentStatus =
  | "confirmed"
  | "pending"
  | "late"
  | "checked-in"
  | "loading"
  | "completed"
  | "canceled"

export type AuditEntry = {
  id: string
  actor: string
  action: string
  detail?: string
  time: string
  source?: "system" | "user" | "iot" | "webhook" | "kiosk"
}

export type AppointmentEquipment = "53ft" | "48ft" | "box" | "reefer" | "hazmat"

export type Appointment = {
  id: string
  time: string
  date: string
  carrier: string
  loadId: string
  type: "inbound" | "outbound" | "cross-dock"
  dockId?: string
  driverId: string
  status: AppointmentStatus
  equipment?: AppointmentEquipment[]
  durationMin?: number
  reference?: string
  notes?: string
  facilityId?: string
  recurring?: { frequency: "weekly" | "biweekly" | "monthly"; until?: string }
  audit: AuditEntry[]
}

export type LoadStatus =
  | "draft"
  | "scheduled"
  | "loading"
  | "unloading"
  | "in-transit"
  | "delivered"
  | "delayed"
  | "awaiting-paperwork"
export type LoadPriority = "high" | "med" | "low"
export type Load = {
  id: string
  origin: string
  destination: string
  weight: number
  pieces: number
  seal?: string
  status: LoadStatus
  carrier: string
  appointmentId?: string
  dockId?: string
  driverId?: string
  bolGenerated?: boolean
  palletsDone?: number
  palletsTotal?: number
  priority?: LoadPriority
  loaderName?: string
  startedAt?: string
  notes?: string
}

export type DockCapability = "reefer" | "hazmat" | "leveler" | "food" | "oversize" | "liftgate"
export type DockStatus = "free" | "loading" | "unloading" | "blocked" | "reserved"
export type Dock = {
  id: string
  status: DockStatus
  loadId?: string
  since?: string
  progress?: number
  blockReason?: string
  capabilities: DockCapability[]
  direction: "inbound" | "outbound" | "both"
  etaFinish?: string
  palletsDone?: number
  palletsTotal?: number
}

export type GateEvent = {
  id: string
  type: "in" | "out"
  driverId: string
  loadId: string
  trailer: string
  dockId?: string
  time: string
  notes?: string
}

export type DocumentKind = "BOL" | "POD" | "Manifest" | "Damage" | "Customs" | "Gate Pass" | "Seal"
export type DocumentStatus = "draft" | "pending-signature" | "signed" | "verified" | "failed"
export type LogiDocument = {
  id: string
  name: string
  kind: DocumentKind
  loadId?: string
  status: DocumentStatus
  createdAt: string
}

export type SignatureStatus = "pending" | "signed" | "declined"
export type Signature = {
  id: string
  documentId: string
  signerName: string
  signerRole: string
  status: SignatureStatus
  requestedAt: string
  resolvedAt?: string
}

export type ExceptionSeverity = "critical" | "warning" | "info"
export type ExceptionStatus = "open" | "snoozed" | "resolved"
export type LogiException = {
  id: string
  severity: ExceptionSeverity
  title: string
  detail: string
  loadId?: string
  driverId?: string
  age: string
  owner?: string
  status: ExceptionStatus
}

export type MessageAttachment = {
  name: string
  url: string
  size: number
  kind: "image" | "pdf" | "doc" | "other"
}
export type Message = {
  id: string
  from: string
  text: string
  time: string
  me: boolean
  attachments?: MessageAttachment[]
}
export type Thread = {
  id: string
  name: string
  role: string
  preview: string
  time: string
  unread: number
  online?: boolean
}

export type Notification = {
  id: string
  title: string
  detail: string
  time: string
  read: boolean
  kind: "info" | "warning" | "success" | "danger"
}

export type Suggestion = {
  id: string
  title: string
  reason: string
  saving: string
  confidence: number
}

export type Invoice = {
  id: string
  date: string
  amount: number
  status: "paid" | "refunded" | "failed"
  method: string
}

export type PaymentMethod = {
  id: string
  brand: "Visa" | "Mastercard" | "Amex" | "Discover" | "ACH"
  last4: string
  expMonth: number
  expYear: number
  isDefault: boolean
}

export type SubscriptionPlan = "Starter" | "Growth" | "Enterprise"

export type Density = "compact" | "comfortable"
export type Accent = "violet" | "blue" | "emerald" | "amber" | "rose"
export type TimeFormat = "12h" | "24h"
export type DateFormat = "us" | "iso" | "eu"
export type Units = "imperial" | "metric"

export type Preferences = {
  density: Density
  accent: Accent
  language: string
  timezone: string
  timeFormat: TimeFormat
  dateFormat: DateFormat
  units: Units
  weekStart: "monday" | "sunday"
  reduceMotion: boolean
  highContrast: boolean
  textSize: "small" | "medium" | "large"
  notif: {
    email: boolean
    push: boolean
    sms: boolean
    digest: "off" | "daily" | "weekly"
    exceptions: boolean
    appointments: boolean
    sigs: boolean
    optimizer: boolean
    billing: boolean
  }
}

export type AccountInfo = {
  legalName: string
  dba: string
  industry: string
  founded: string
  dotNumber: string
  mcNumber: string
  primaryContact: string
  contactEmail: string
  mailingAddress: string
}

export type Shift = {
  name: "Day" | "Swing" | "Night"
  startTime: string
  endTime: string
  supervisor: string
  crewSize: number
  loadsCompleted: number
  palletsMoved: number
  issues: number
}

export type LoaderStatus = "loading" | "break" | "covering" | "available"
export type Loader = {
  id: string
  name: string
  shift: "Day" | "Swing" | "Night"
  status: LoaderStatus
  task?: string
  isMe?: boolean
}

export type SitePhotoCategory =
  | "entrance"
  | "dock"
  | "parking"
  | "signage"
  | "hazard"
  | "interior"
  | "exterior"
  | "other"

export type SitePhoto = {
  id: string
  url: string
  caption: string
  primary?: boolean
  uploadedAt: string
  uploadedBy?: string
  category?: SitePhotoCategory
  tags?: string[]
  description?: string
  sizeBytes?: number
  width?: number
  height?: number
}

export type AmenityKey =
  | "driver-lounge"
  | "restrooms"
  | "showers"
  | "fuel"
  | "truck-wash"
  | "scale"
  | "forklift"
  | "cross-dock"
  | "refrigerated"
  | "hazmat"
  | "overnight"
  | "24-7"
  | "security"
  | "wifi"
  | "vending"
  | "ev-charging"

export type AmenityCategory = string

export type AmenityColorName =
  | "violet" | "indigo" | "blue" | "cyan" | "teal"
  | "emerald" | "lime" | "amber" | "orange"
  | "rose" | "fuchsia" | "slate"

export type AmenityCategoryDef = {
  key: string
  label: string
  description: string
  icon: string
  color: AmenityColorName
  order: number
  builtin?: boolean
}

export type SiteAmenity = {
  key: AmenityKey | string
  name: string
  available: boolean
  category: AmenityCategory
  notes?: string
}

export type SiteSettings = {
  name: string
  code: string
  manager: string
  region: string
  address: string
  lat: string
  lng: string
  hours: { day: string; open: string; close: string; on: boolean }[]
  gate: {
    requireQr: boolean
    autoAssignDock: boolean
    photoTrailer: boolean
    sealVerification: boolean
    afterHours: boolean
    guardPhone: string
    notes: string
  }
  photos: SitePhoto[]
  amenities: SiteAmenity[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────

const now = () => new Date()
const fmtTime = (d: Date) =>
  `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
const isoDate = (offsetDays = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}
const id = (prefix: string) => `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`

// ─── Store ────────────────────────────────────────────────────────────────

type Store = {
  drivers: Driver[]
  vehicles: Vehicle[]
  facilities: Facility[]
  users: AppUser[]
  appointments: Appointment[]
  loads: Load[]
  docks: Dock[]
  gateEvents: GateEvent[]
  documents: LogiDocument[]
  signatures: Signature[]
  exceptions: LogiException[]
  threads: Thread[]
  messagesByThread: Record<string, Message[]>
  notifications: Notification[]
  suggestions: Suggestion[]
  invoices: Invoice[]
  paymentMethods: PaymentMethod[]
  subscription: { plan: SubscriptionPlan; renewsOn: string; price: number }
  account: AccountInfo
  site: SiteSettings
  amenityCategories: AmenityCategoryDef[]
  oncall: string
  shift: Shift
  loaders: Loader[]
  prefs: Preferences

  // ── actions ──
  bookAppointment(input: {
    time: string
    date: string
    carrier: string
    type: "inbound" | "outbound" | "cross-dock"
    driverId: string
    origin: string
    destination: string
    weight: number
    pieces: number
  }): { appointmentId: string; loadId: string }

  cancelAppointment(appointmentId: string, reason?: string): void
  approveAppointment(appointmentId: string): void
  declineAppointment(appointmentId: string, reason: string): void
  rescheduleAppointment(appointmentId: string, date: string, time: string, dockId?: string): void
  duplicateAppointment(appointmentId: string): string | null
  markAppointmentStatus(appointmentId: string, status: AppointmentStatus): void
  appendAudit(appointmentId: string, entry: Omit<AuditEntry, "id" | "time">): void

  checkInDriver(input: {
    driverId: string
    loadId: string
    trailer: string
  }): { dockId?: string }

  checkOutDriver(input: { loadId: string; seal: string; notes?: string }): void

  assignDock(loadId: string, dockId: string): void
  freeDock(dockId: string): void
  blockDock(dockId: string, reason: string): void

  generateDocument(input: {
    kind: DocumentKind
    loadId?: string
    name?: string
  }): { documentId: string; signatureId?: string }

  requestSignature(input: {
    documentId: string
    signerName: string
    signerRole: string
  }): { signatureId: string }
  signDocument(signatureId: string): void
  declineSignature(signatureId: string): void
  remindSigner(signatureId: string): void

  resolveException(exceptionId: string): void
  snoozeException(exceptionId: string): void

  applySuggestion(suggestionId: string): void
  dismissSuggestion(suggestionId: string): void
  runOptimizer(): number

  sendMessage(threadId: string, text: string): void
  markThreadRead(threadId: string): void

  addDriver(d: Omit<Driver, "id">): string
  updateDriver(id: string, patch: Partial<Driver>): void

  addVehicle(v: Omit<Vehicle, "id">): string
  addFacility(f: Omit<Facility, "id">): string
  inviteUser(u: Omit<AppUser, "id" | "lastActive" | "status">): string
  removeUser(id: string): void

  updateAccount(patch: Partial<AccountInfo>): void
  updateSite(patch: Partial<SiteSettings>): void
  addSitePhoto(photo: { url: string; caption: string; category?: SitePhotoCategory; tags?: string[]; description?: string; sizeBytes?: number; width?: number; height?: number; uploadedBy?: string }): string
  updateSitePhoto(id: string, patch: Partial<SitePhoto>): void
  removeSitePhoto(id: string): void
  setPrimaryPhoto(id: string): void
  reorderSitePhotos(orderedIds: string[]): void
  toggleAmenity(key: string): void
  updateAmenityNotes(key: string, notes: string): void
  addAmenity(amenity: { name: string; available: boolean; category: AmenityCategory; notes?: string }): void
  updateAmenity(key: string, patch: Partial<Omit<SiteAmenity, "key">>): void
  removeAmenity(key: string): void

  addAmenityCategory(input: { label: string; description?: string; icon: string; color: AmenityColorName }): string
  updateAmenityCategory(key: string, patch: Partial<Omit<AmenityCategoryDef, "key" | "builtin">>): void
  removeAmenityCategory(key: string): void
  reorderAmenityCategories(orderedKeys: string[]): void

  changePlan(plan: SubscriptionPlan): void
  payInvoice(invoiceId: string): void
  addPaymentMethod(input: { brand: PaymentMethod["brand"]; last4: string; expMonth: number; expYear: number; setDefault?: boolean }): string
  removePaymentMethod(id: string): void
  setDefaultPaymentMethod(id: string): void

  setLoadPriority(loadId: string, priority: LoadPriority): void
  advanceLoadProgress(loadId: string, palletsDone: number): void
  completeLoad(loadId: string): void

  markAllNotificationsRead(): void
  pushNotification(n: Omit<Notification, "id" | "time" | "read">): void

  renewLicense(driverId: string, newExpiry: string): void
  sendAttachment(threadId: string, attachment: MessageAttachment, text?: string): void
  broadcast(input: { audience: "drivers" | "internal" | "all"; text: string }): number
  updatePrefs(patch: Partial<Preferences>): void
  resetPrefs(): void
}

// ─── Seed ─────────────────────────────────────────────────────────────────

const seedDrivers: Driver[] = [
  { id: "DR-1042", name: "Mo Cole", license: "CDL-A", licenseExp: "2027-04-12", hours: { used: 6.4, max: 11 }, status: "on-duty", loadId: "LD-4421", phone: "+1 312 555 0100" },
  { id: "DR-1108", name: "Tani Singh", license: "CDL-A", licenseExp: "2026-08-22", hours: { used: 8.1, max: 11 }, status: "on-duty", loadId: "LD-4422", phone: "+1 312 555 0101" },
  { id: "DR-1133", name: "Rae Diaz", license: "CDL-A", licenseExp: "2028-01-04", hours: { used: 4.0, max: 11 }, status: "rest", phone: "+1 312 555 0102" },
  { id: "DR-1190", name: "Yuki Brown", license: "CDL-B", licenseExp: "2025-11-30", hours: { used: 0, max: 11 }, status: "off", phone: "+1 312 555 0103" },
  { id: "DR-1212", name: "Jordan Liu", license: "CDL-A", licenseExp: "2026-03-15", hours: { used: 9.2, max: 11 }, status: "on-duty", loadId: "LD-4407", phone: "+1 312 555 0104" },
  { id: "DR-1240", name: "Priya Shah", license: "CDL-A", licenseExp: "2026-05-06", hours: { used: 0, max: 11 }, status: "expiring", phone: "+1 312 555 0105" },
]

const seedVehicles: Vehicle[] = [
  { id: "TR-088", model: "Volvo VNL 860", year: 2022, driverId: "DR-1042", odometer: 182442, status: "on-route", nextService: "Service in 1.2k mi" },
  { id: "TR-091", model: "Freightliner Cascadia", year: 2021, driverId: "DR-1108", odometer: 224001, status: "on-route", nextService: "Service in 600 mi" },
  { id: "TR-104", model: "Kenworth T680", year: 2023, odometer: 98304, status: "idle", nextService: "PM in 4 days" },
  { id: "TR-110", model: "Peterbilt 579", year: 2020, odometer: 311556, status: "maintenance", nextService: "Brake service" },
  { id: "TR-122", model: "Volvo VNL 740", year: 2024, driverId: "DR-1212", odometer: 44210, status: "on-route", nextService: "PM in 11 days" },
  { id: "TR-130", model: "Mack Anthem", year: 2022, odometer: 165022, status: "idle", nextService: "PM in 3 days" },
]

const seedFacilities: Facility[] = [
  { id: "BR-01", name: "North Hub", type: "Cross-dock", city: "Chicago, IL", manager: "A. Patel", docks: 24, yard: 80, status: "active" },
  { id: "BR-02", name: "South Hub", type: "Cross-dock", city: "Dallas, TX", manager: "L. Romero", docks: 18, yard: 56, status: "active" },
  { id: "BR-03", name: "West Cross-Dock", type: "Warehouse", city: "Phoenix, AZ", manager: "K. Nakamura", docks: 12, yard: 32, status: "active" },
  { id: "BR-04", name: "East Pilot", type: "Yard only", city: "Newark, NJ", manager: "—", docks: 8, yard: 16, status: "pilot" },
]

const seedUsers: AppUser[] = [
  { id: "U-1", name: "Avery Patel", email: "avery@bobhaul.io", role: "Hub Manager", branch: "North Hub", status: "active", lastActive: "2m ago" },
  { id: "U-2", name: "Liam Romero", email: "liam@bobhaul.io", role: "Hub Manager", branch: "South Hub", status: "active", lastActive: "12m ago" },
  { id: "U-3", name: "Karin Nakamura", email: "karin@bobhaul.io", role: "Dispatcher", branch: "West", status: "active", lastActive: "now" },
  { id: "U-4", name: "Jules Okafor", email: "jules@bobhaul.io", role: "Operator", branch: "North Hub", status: "active", lastActive: "5m ago" },
  { id: "U-5", name: "Sam Lin", email: "sam@bobhaul.io", role: "Operator", branch: "North Hub", status: "invited", lastActive: "—" },
  { id: "U-6", name: "Rae Diaz", email: "rae@bobhaul.io", role: "Compliance", branch: "HQ", status: "active", lastActive: "1h ago" },
]

const audit = (entries: { actor: string; action: string; detail?: string; source?: AuditEntry["source"]; mins?: number }[]): AuditEntry[] =>
  entries.map((e, i) => ({
    id: `EVT-${1000 + i}`,
    actor: e.actor,
    action: e.action,
    detail: e.detail,
    time: `${e.mins ?? 0}m ago`,
    source: e.source ?? "user",
  }))

const seedAppointments: Appointment[] = [
  { id: "AP-001", time: "08:00", date: isoDate(), carrier: "Schneider", loadId: "LD-4401", type: "inbound", dockId: "D-01", driverId: "DR-1108", status: "completed", equipment: ["53ft", "reefer"], audit: audit([
    { actor: "system", action: "Released", source: "system", mins: 12 },
    { actor: "M. Lin", action: "Marked completed", mins: 24 },
    { actor: "kiosk", action: "Driver checked in", source: "kiosk", mins: 180 },
    { actor: "system", action: "Confirmed", source: "system", mins: 720 },
  ]) },
  { id: "AP-002", time: "09:30", date: isoDate(), carrier: "JB Hunt", loadId: "LD-4407", type: "outbound", dockId: "D-07", driverId: "DR-1212", status: "late", equipment: ["53ft"], audit: audit([
    { actor: "system", action: "Late by 24m", source: "system", mins: 24 },
    { actor: "system", action: "Confirmed", source: "system", mins: 480 },
  ]) },
  { id: "AP-003", time: "10:00", date: isoDate(), carrier: "Bobhaul", loadId: "LD-4421", type: "inbound", dockId: "D-01", driverId: "DR-1042", status: "loading", equipment: ["53ft"], audit: audit([
    { actor: "kiosk", action: "Checked in at gate", source: "kiosk", mins: 14 },
    { actor: "system", action: "Dock D-01 assigned", source: "system", mins: 14 },
  ]) },
  { id: "AP-004", time: "10:45", date: isoDate(), carrier: "Werner", loadId: "LD-4422", type: "inbound", dockId: "D-03", driverId: "DR-1108", status: "loading", equipment: ["48ft"], recurring: { frequency: "weekly", until: "2026-12-31" }, audit: audit([
    { actor: "kiosk", action: "Checked in", source: "kiosk", mins: 30 },
  ]) },
  { id: "AP-005", time: "12:15", date: isoDate(), carrier: "Knight", loadId: "LD-4430", type: "outbound", driverId: "DR-1133", status: "pending", equipment: ["53ft", "reefer"], audit: audit([
    { actor: "Carrier portal", action: "Booking requested", source: "webhook", mins: 60 },
  ]) },
  { id: "AP-006", time: "14:00", date: isoDate(), carrier: "Bobhaul", loadId: "LD-4441", type: "inbound", driverId: "DR-1190", status: "confirmed", equipment: ["53ft"], audit: audit([
    { actor: "A. Patel", action: "Approved", mins: 90 },
  ]) },
  { id: "AP-007", time: "15:30", date: isoDate(), carrier: "XPO", loadId: "LD-4448", type: "outbound", driverId: "DR-1240", status: "pending", equipment: ["box"], audit: audit([
    { actor: "Carrier portal", action: "Booking requested", source: "webhook", mins: 30 },
  ]) },
  { id: "AP-008", time: "07:15", date: isoDate(), carrier: "Schneider", loadId: "LD-4451", type: "cross-dock", dockId: "D-02", driverId: "DR-1042", status: "confirmed", equipment: ["53ft"], audit: audit([
    { actor: "A. Patel", action: "Approved", mins: 200 },
    { actor: "system", action: "Cross-dock pair LD-4451 ↔ LD-4452", source: "system", mins: 200 },
  ]) },
  { id: "AP-009", time: "11:30", date: isoDate(), carrier: "JB Hunt", loadId: "LD-4453", type: "cross-dock", driverId: "DR-1133", status: "pending", equipment: ["53ft", "reefer"], audit: audit([
    { actor: "Carrier portal", action: "Booking requested · cross-dock", source: "webhook", mins: 45 },
  ]) },
  { id: "AP-010", time: "13:00", date: isoDate(), carrier: "Werner", loadId: "LD-4455", type: "cross-dock", dockId: "D-06", driverId: "DR-1190", status: "checked-in", equipment: ["48ft"], audit: audit([
    { actor: "kiosk", action: "Driver checked in · cross-dock pairing pending", source: "kiosk", mins: 8 },
    { actor: "A. Patel", action: "Approved", mins: 240 },
  ]) },
  { id: "AP-011", time: "16:45", date: isoDate(), carrier: "Bobhaul", loadId: "LD-4458", type: "inbound", driverId: "DR-1108", status: "pending", equipment: ["53ft", "hazmat"], audit: audit([
    { actor: "Carrier portal", action: "Booking requested", source: "webhook", mins: 15 },
  ]) },
  { id: "AP-012", time: "06:30", date: isoDate(), carrier: "Knight", loadId: "LD-4460", type: "inbound", dockId: "D-08", driverId: "DR-1212", status: "confirmed", equipment: ["53ft", "reefer"], recurring: { frequency: "biweekly", until: "2026-12-31" }, audit: audit([
    { actor: "A. Patel", action: "Approved · recurring biweekly", mins: 1440 },
  ]) },
  { id: "AP-013", time: "08:30", date: isoDate(1), carrier: "Schneider", loadId: "LD-4461", type: "inbound", dockId: "D-01", driverId: "DR-1108", status: "confirmed", equipment: ["53ft", "reefer"], audit: audit([{ actor: "A. Patel", action: "Approved", mins: 240 }]) },
  { id: "AP-014", time: "10:00", date: isoDate(1), carrier: "JB Hunt", loadId: "LD-4462", type: "cross-dock", dockId: "D-02", driverId: "DR-1133", status: "confirmed", equipment: ["53ft"], audit: audit([{ actor: "A. Patel", action: "Approved", mins: 200 }]) },
  { id: "AP-015", time: "13:15", date: isoDate(1), carrier: "Werner", loadId: "LD-4463", type: "outbound", driverId: "DR-1190", status: "confirmed", equipment: ["48ft"], audit: audit([{ actor: "A. Patel", action: "Approved", mins: 120 }]) },
  { id: "AP-016", time: "15:00", date: isoDate(1), carrier: "Bobhaul", loadId: "LD-4464", type: "inbound", dockId: "D-06", driverId: "DR-1042", status: "confirmed", equipment: ["53ft", "hazmat"], audit: audit([{ actor: "A. Patel", action: "Approved", mins: 60 }]) },
  { id: "AP-017", time: "07:45", date: isoDate(2), carrier: "Knight", loadId: "LD-4465", type: "inbound", dockId: "D-03", driverId: "DR-1212", status: "confirmed", equipment: ["53ft", "reefer"], audit: audit([{ actor: "A. Patel", action: "Approved", mins: 480 }]) },
  { id: "AP-018", time: "11:00", date: isoDate(2), carrier: "XPO", loadId: "LD-4466", type: "cross-dock", driverId: "DR-1240", status: "pending", equipment: ["box"], audit: audit([{ actor: "Carrier portal", action: "Booking requested", source: "webhook", mins: 12 }]) },
  { id: "AP-019", time: "14:30", date: isoDate(2), carrier: "Schneider", loadId: "LD-4467", type: "outbound", dockId: "D-07", driverId: "DR-1108", status: "confirmed", equipment: ["53ft"], audit: audit([{ actor: "A. Patel", action: "Approved", mins: 360 }]) },
  { id: "AP-020", time: "09:00", date: isoDate(3), carrier: "Bobhaul", loadId: "LD-4468", type: "inbound", dockId: "D-01", driverId: "DR-1190", status: "confirmed", equipment: ["53ft"], recurring: { frequency: "weekly", until: "2026-12-31" }, audit: audit([{ actor: "A. Patel", action: "Approved · recurring weekly", mins: 1440 }]) },
  { id: "AP-021", time: "12:00", date: isoDate(3), carrier: "JB Hunt", loadId: "LD-4469", type: "cross-dock", dockId: "D-06", driverId: "DR-1133", status: "confirmed", equipment: ["53ft", "reefer"], audit: audit([{ actor: "A. Patel", action: "Approved", mins: 240 }]) },
  { id: "AP-022", time: "16:00", date: isoDate(3), carrier: "Werner", loadId: "LD-4470", type: "outbound", driverId: "DR-1042", status: "pending", equipment: ["48ft"], audit: audit([{ actor: "Carrier portal", action: "Booking requested", source: "webhook", mins: 18 }]) },
  { id: "AP-023", time: "08:00", date: isoDate(4), carrier: "Schneider", loadId: "LD-4471", type: "inbound", dockId: "D-01", driverId: "DR-1108", status: "confirmed", equipment: ["53ft", "reefer"], audit: audit([{ actor: "A. Patel", action: "Approved", mins: 600 }]) },
  { id: "AP-024", time: "11:45", date: isoDate(4), carrier: "Knight", loadId: "LD-4472", type: "cross-dock", driverId: "DR-1212", status: "confirmed", equipment: ["53ft"], audit: audit([{ actor: "A. Patel", action: "Approved", mins: 180 }]) },
  { id: "AP-025", time: "15:30", date: isoDate(4), carrier: "XPO", loadId: "LD-4473", type: "outbound", dockId: "D-07", driverId: "DR-1240", status: "confirmed", equipment: ["box"], audit: audit([{ actor: "A. Patel", action: "Approved", mins: 90 }]) },
  { id: "AP-026", time: "10:30", date: isoDate(-1), carrier: "Bobhaul", loadId: "LD-4474", type: "inbound", dockId: "D-01", driverId: "DR-1190", status: "completed", equipment: ["53ft"], audit: audit([{ actor: "M. Lin", action: "Released", mins: 1200 }]) },
  { id: "AP-027", time: "13:00", date: isoDate(-1), carrier: "JB Hunt", loadId: "LD-4475", type: "outbound", dockId: "D-07", driverId: "DR-1133", status: "completed", equipment: ["53ft"], audit: audit([{ actor: "M. Lin", action: "Released", mins: 1100 }]) },
  { id: "AP-028", time: "11:15", date: isoDate(), carrier: "XPO", loadId: "LD-4476", type: "outbound", driverId: "DR-1240", status: "canceled", equipment: ["box"], audit: audit([
    { actor: "Carrier portal", action: "Canceled · driver unavailable", source: "webhook", mins: 90 },
    { actor: "A. Patel", action: "Approved", mins: 360 },
  ]) },
  { id: "AP-029", time: "16:00", date: isoDate(1), carrier: "Knight", loadId: "LD-4477", type: "inbound", dockId: "D-03", driverId: "DR-1133", status: "canceled", equipment: ["53ft", "reefer"], audit: audit([
    { actor: "L. Romero", action: "Canceled · weather hold", mins: 30 },
    { actor: "A. Patel", action: "Approved", mins: 720 },
  ]) },
  { id: "AP-030", time: "09:00", date: isoDate(), carrier: "Werner", loadId: "LD-4478", type: "inbound", dockId: "D-05", driverId: "DR-1042", status: "late", equipment: ["48ft"], audit: audit([
    { actor: "system", action: "Late by 18m", source: "system", mins: 18 },
    { actor: "system", action: "Confirmed", source: "system", mins: 600 },
  ]) },
  { id: "AP-031", time: "10:15", date: isoDate(), carrier: "JB Hunt", loadId: "LD-4479", type: "outbound", dockId: "D-06", driverId: "DR-1212", status: "checked-in", equipment: ["53ft"], audit: audit([
    { actor: "kiosk", action: "Driver checked in", source: "kiosk", mins: 6 },
    { actor: "system", action: "Dock D-06 assigned", source: "system", mins: 6 },
    { actor: "A. Patel", action: "Approved", mins: 480 },
  ]) },
  { id: "AP-032", time: "11:00", date: isoDate(), carrier: "Schneider", loadId: "LD-4480", type: "outbound", dockId: "D-02", driverId: "DR-1190", status: "loading", equipment: ["53ft", "hazmat"], audit: audit([
    { actor: "M. Lin", action: "Loading started", mins: 22 },
    { actor: "kiosk", action: "Driver checked in", source: "kiosk", mins: 35 },
  ]) },
]

const seedLoads: Load[] = [
  { id: "LD-4401", origin: "Milwaukee, WI", destination: "Chicago, IL", weight: 22000, pieces: 14, seal: "SL-88101", status: "delivered", carrier: "Schneider", appointmentId: "AP-001", palletsDone: 14, palletsTotal: 14 },
  { id: "LD-4407", origin: "Milwaukee, WI", destination: "Chicago, IL", weight: 22800, pieces: 14, seal: "SL-88107", status: "delayed", carrier: "JB Hunt", appointmentId: "AP-002", driverId: "DR-1212", dockId: "D-07", palletsDone: 4, palletsTotal: 14, priority: "high", loaderName: "K. Reeves", startedAt: "09:22" },
  { id: "LD-4421", origin: "Chicago, IL", destination: "Indianapolis, IN", weight: 38200, pieces: 24, seal: "SL-88120", status: "loading", carrier: "Bobhaul", appointmentId: "AP-003", driverId: "DR-1042", dockId: "D-01", bolGenerated: true, palletsDone: 14, palletsTotal: 24, priority: "med", loaderName: "M. Lin", startedAt: "10:14" },
  { id: "LD-4422", origin: "Detroit, MI", destination: "Chicago, IL", weight: 29540, pieces: 18, seal: "SL-88121", status: "unloading", carrier: "Werner", appointmentId: "AP-004", driverId: "DR-1108", dockId: "D-03", palletsDone: 6, palletsTotal: 18, priority: "low", loaderName: "J. Park", startedAt: "10:45" },
  { id: "LD-4419", origin: "Chicago, IL", destination: "St. Louis, MO", weight: 41000, pieces: 30, seal: "SL-88119", status: "in-transit", carrier: "JB Hunt", driverId: "DR-1133", palletsDone: 30, palletsTotal: 30 },
  { id: "LD-4430", origin: "Chicago, IL", destination: "Cleveland, OH", weight: 27600, pieces: 18, status: "scheduled", carrier: "Knight", appointmentId: "AP-005", palletsTotal: 18, priority: "high" },
  { id: "LD-4441", origin: "Cleveland, OH", destination: "Chicago, IL", weight: 33120, pieces: 22, status: "scheduled", carrier: "Bobhaul", appointmentId: "AP-006", palletsTotal: 22, priority: "med" },
  { id: "LD-4448", origin: "Chicago, IL", destination: "Madison, WI", weight: 18500, pieces: 12, status: "scheduled", carrier: "XPO", appointmentId: "AP-007", palletsTotal: 12, priority: "low" },
]

const seedDocks: Dock[] = [
  { id: "D-01", status: "loading", loadId: "LD-4421", since: "10:14", progress: 60, capabilities: ["leveler", "liftgate"], direction: "both", etaFinish: "11:18", palletsDone: 14, palletsTotal: 24 },
  { id: "D-02", status: "free", capabilities: ["leveler"], direction: "both" },
  { id: "D-03", status: "unloading", loadId: "LD-4422", since: "10:45", progress: 30, capabilities: ["leveler", "reefer", "food"], direction: "inbound", etaFinish: "12:08", palletsDone: 6, palletsTotal: 18 },
  { id: "D-04", status: "blocked", since: "Maintenance", blockReason: "Door track repair · back online 14:00", capabilities: ["leveler"], direction: "both" },
  { id: "D-05", status: "free", capabilities: ["leveler", "oversize"], direction: "outbound" },
  { id: "D-06", status: "free", capabilities: ["leveler", "hazmat"], direction: "both" },
  { id: "D-07", status: "loading", loadId: "LD-4407", since: "09:22", progress: 28, capabilities: ["leveler"], direction: "outbound", etaFinish: "10:50", palletsDone: 4, palletsTotal: 14 },
  { id: "D-08", status: "reserved", since: "13:30 · Bobhaul", capabilities: ["leveler", "reefer"], direction: "inbound" },
]

const seedGateEvents: GateEvent[] = [
  { id: "GE-1", type: "in", driverId: "DR-1042", loadId: "LD-4421", trailer: "T-88", dockId: "D-01", time: "10:14" },
  { id: "GE-2", type: "out", driverId: "DR-1133", loadId: "LD-4419", trailer: "T-72", dockId: "D-05", time: "10:02" },
  { id: "GE-3", type: "in", driverId: "DR-1108", loadId: "LD-4422", trailer: "T-91", dockId: "D-03", time: "09:48" },
  { id: "GE-4", type: "out", driverId: "DR-1212", loadId: "LD-4407", trailer: "T-65", dockId: "D-07", time: "09:31" },
  { id: "GE-5", type: "in", driverId: "DR-1190", loadId: "LD-4418", trailer: "T-44", dockId: "D-02", time: "09:12" },
]

const seedDocs: LogiDocument[] = [
  { id: "DOC-1", name: "BOL_LD-4421.pdf", kind: "BOL", loadId: "LD-4421", status: "verified", createdAt: "10:15" },
  { id: "DOC-2", name: "POD_LD-4419.jpg", kind: "POD", loadId: "LD-4419", status: "verified", createdAt: "09:50" },
  { id: "DOC-3", name: "Manifest_LD-4422.pdf", kind: "Manifest", loadId: "LD-4422", status: "failed", createdAt: "10:46" },
  { id: "DOC-4", name: "Seal_LD-4407.jpg", kind: "Seal", loadId: "LD-4407", status: "verified", createdAt: "09:32" },
]

const seedSigs: Signature[] = [
  { id: "SIG-1", documentId: "DOC-1", signerName: "M. Cole", signerRole: "Driver", status: "pending", requestedAt: "8m ago" },
  { id: "SIG-2", documentId: "DOC-2", signerName: "Receiver, Indy DC", signerRole: "Consignee", status: "pending", requestedAt: "22m ago" },
]

const seedExceptions: LogiException[] = [
  { id: "EX-1042", severity: "critical", title: "Dwell breach · LD-4407", detail: "Trailer at D-07 for 3h 22m, exceeds 2h SLA.", loadId: "LD-4407", driverId: "DR-1212", age: "12m", status: "open" },
  { id: "EX-1041", severity: "critical", title: "Driver license expiring · DR-1240", detail: "P. Shah license expires in 48 hours.", driverId: "DR-1240", age: "1h", owner: "R. Diaz", status: "open" },
  { id: "EX-1040", severity: "warning", title: "Late arrival · LD-4421", detail: "Driver M. Cole 18m behind appointment.", loadId: "LD-4421", driverId: "DR-1042", age: "22m", owner: "K. Nakamura", status: "open" },
  { id: "EX-1039", severity: "warning", title: "Seal mismatch · LD-4419", detail: "Reported seal SL-88119, scanned SL-88120.", loadId: "LD-4419", driverId: "DR-1133", age: "38m", status: "open" },
  { id: "EX-1038", severity: "info", title: "Optimizer suggestion ignored", detail: "D-03 reassignment skipped 3x today.", age: "1h", status: "open" },
]

const seedThreads: Thread[] = [
  { id: "t1", name: "M. Cole", role: "Driver · LD-4421", preview: "ETA 6 min, dock 01.", time: "2m", unread: 2, online: true },
  { id: "t2", name: "Yard Team", role: "Internal · 4 members", preview: "Trailer 88 moved to slot B7.", time: "12m", unread: 1 },
  { id: "t3", name: "T. Singh", role: "Driver · LD-4422", preview: "Seal 4421 verified.", time: "28m", unread: 0, online: true },
  { id: "t4", name: "Dispatch", role: "Internal · 8 members", preview: "Optimizer rerouted 3 loads.", time: "1h", unread: 1 },
  { id: "t5", name: "R. Diaz", role: "Driver · LD-4419", preview: "Departed dock.", time: "2h", unread: 0 },
  { id: "t6", name: "Compliance", role: "Internal", preview: "DOT inspection cleared.", time: "1d", unread: 0 },
]

const seedMessages: Record<string, Message[]> = {
  t1: [
    { id: "m1", from: "M. Cole", text: "On approach, 6 min out.", time: "10:14", me: false },
    { id: "m2", from: "You", text: "Copy. Dock 01 will be free, pull up to gate first.", time: "10:14", me: true },
    { id: "m3", from: "M. Cole", text: "Got it. Seal intact, paperwork ready.", time: "10:15", me: false },
    { id: "m4", from: "You", text: "Perfect. Scan QR at gate kiosk on arrival.", time: "10:16", me: true },
  ],
  t2: [
    { id: "m1", from: "Yard Lead", text: "Trailer 88 moved to slot B7.", time: "10:02", me: false },
  ],
  t3: [
    { id: "m1", from: "T. Singh", text: "Seal 4421 verified.", time: "09:48", me: false },
  ],
  t4: [
    { id: "m1", from: "Optimizer", text: "Rerouted 3 loads to maximize throughput.", time: "09:30", me: false },
  ],
  t5: [],
  t6: [],
}

const seedNotifications: Notification[] = [
  { id: "N-1", title: "Dwell breach LD-4407", detail: "Exceeds 2h SLA at D-07", time: "12m ago", read: false, kind: "danger" },
  { id: "N-2", title: "License expiring", detail: "P. Shah · 2 days remaining", time: "1h ago", read: false, kind: "warning" },
  { id: "N-3", title: "Optimizer ran sweep", detail: "12 suggestions generated", time: "2h ago", read: false, kind: "info" },
]

const seedAmenityCategories: AmenityCategoryDef[] = [
  { key: "comfort", label: "Driver Comfort", description: "Lounge, restrooms, showers, vending", icon: "Coffee", color: "violet", order: 0, builtin: true },
  { key: "security", label: "Security", description: "Gate, guards, cameras", icon: "ShieldCheck", color: "emerald", order: 1, builtin: true },
  { key: "cargo", label: "Cargo Handling", description: "Forklift, scale, cross-dock, reefer", icon: "Forklift", color: "amber", order: 2, builtin: true },
  { key: "parking", label: "Parking & Access", description: "Overnight, 24/7, drop yard", icon: "SquareParking", color: "blue", order: 3, builtin: true },
  { key: "utilities", label: "Utilities", description: "WiFi, EV charging, power, water", icon: "Plug", color: "cyan", order: 4, builtin: true },
  { key: "services", label: "Services", description: "Fuel, truck wash, mechanic", icon: "Sparkles", color: "rose", order: 5, builtin: true },
]

const seedPaymentMethods: PaymentMethod[] = [
  { id: "PM-1", brand: "Visa", last4: "4242", expMonth: 9, expYear: 2027, isDefault: true },
  { id: "PM-2", brand: "Mastercard", last4: "8181", expMonth: 4, expYear: 2028, isDefault: false },
]

const defaultPrefs: Preferences = {
  density: "comfortable",
  accent: "violet",
  language: "en-US",
  timezone: "America/Chicago",
  timeFormat: "24h",
  dateFormat: "us",
  units: "imperial",
  weekStart: "monday",
  reduceMotion: false,
  highContrast: false,
  textSize: "medium",
  notif: {
    email: true,
    push: true,
    sms: false,
    digest: "daily",
    exceptions: true,
    appointments: true,
    sigs: true,
    optimizer: false,
    billing: true,
  },
}

const seedInvoices: Invoice[] = [
  { id: "INV-2026-04", date: "May 1, 2026", amount: 549, status: "paid", method: "Visa · 4242" },
  { id: "INV-2026-03", date: "Apr 1, 2026", amount: 549, status: "paid", method: "Visa · 4242" },
  { id: "INV-2026-02", date: "Mar 1, 2026", amount: 549, status: "paid", method: "Visa · 4242" },
  { id: "INV-2026-01", date: "Feb 1, 2026", amount: 199, status: "paid", method: "Visa · 4242" },
  { id: "INV-2025-12", date: "Jan 1, 2026", amount: 199, status: "paid", method: "Visa · 4242" },
  { id: "INV-2025-11", date: "Dec 1, 2025", amount: 199, status: "refunded", method: "Visa · 4242" },
]

const seedAccount: AccountInfo = {
  legalName: "Bobhaul Logistics, Inc.",
  dba: "Bobhaul",
  industry: "3PL · Cross-dock",
  founded: "2019",
  dotNumber: "3892410",
  mcNumber: "MC-1294823",
  primaryContact: "Avery Patel",
  contactEmail: "avery@bobhaul.io",
  mailingAddress: "540 W Madison St, Suite 12, Chicago, IL 60661",
}

const seedSite: SiteSettings = {
  name: "North Hub",
  code: "BR-01",
  manager: "Avery Patel",
  region: "midwest",
  address: "2200 S Throop St, Chicago, IL 60608",
  lat: "41.853012",
  lng: "-87.659210",
  hours: [
    { day: "Monday", open: "06:00", close: "22:00", on: true },
    { day: "Tuesday", open: "06:00", close: "22:00", on: true },
    { day: "Wednesday", open: "06:00", close: "22:00", on: true },
    { day: "Thursday", open: "06:00", close: "22:00", on: true },
    { day: "Friday", open: "06:00", close: "22:00", on: true },
    { day: "Saturday", open: "08:00", close: "16:00", on: true },
    { day: "Sunday", open: "—", close: "—", on: false },
  ],
  gate: {
    requireQr: true,
    autoAssignDock: true,
    photoTrailer: true,
    sealVerification: true,
    afterHours: false,
    guardPhone: "+1 (312) 555-7100",
    notes: "Use west entrance off Throop St. Yard staff on radio ch. 4.",
  },
  photos: [
    {
      id: "PH-1",
      url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=70",
      caption: "Main entrance · west gate",
      primary: true,
      uploadedAt: "2026-04-12",
      uploadedBy: "Avery Patel",
      category: "entrance",
      tags: ["west-gate", "primary"],
      description: "West entrance off Throop St. Photo for driver wayfinding.",
      sizeBytes: 482_310,
      width: 1600,
      height: 1067,
    },
    {
      id: "PH-2",
      url: "https://images.unsplash.com/photo-1601598851547-4302969d0614?w=800&auto=format&fit=crop&q=70",
      caption: "Dock doors 01–08",
      uploadedAt: "2026-04-12",
      uploadedBy: "Avery Patel",
      category: "dock",
      tags: ["dock", "inbound"],
      description: "North dock face. Doors 1–8 inbound only.",
      sizeBytes: 612_980,
      width: 1600,
      height: 1067,
    },
    {
      id: "PH-3",
      url: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&auto=format&fit=crop&q=70",
      caption: "Yard slot map · A wing",
      uploadedAt: "2026-04-15",
      uploadedBy: "M. Lee",
      category: "parking",
      tags: ["yard", "map"],
      description: "Slot numbering for A wing trailer drop.",
      sizeBytes: 298_440,
      width: 1600,
      height: 900,
    },
    {
      id: "PH-4",
      url: "https://images.unsplash.com/photo-1601598851547-4302969d0614?w=800&auto=format&fit=crop&q=70",
      caption: "Driver lounge",
      uploadedAt: "2026-04-20",
      uploadedBy: "K. Nakamura",
      category: "interior",
      tags: ["amenities", "lounge"],
      description: "Driver lounge with vending and lockers.",
      sizeBytes: 421_005,
      width: 1600,
      height: 1067,
    },
  ],
  amenities: [
    { key: "driver-lounge", name: "Driver lounge", available: true, category: "comfort", notes: "Coffee, microwave, lockers" },
    { key: "restrooms", name: "Restrooms", available: true, category: "comfort" },
    { key: "showers", name: "Showers", available: true, category: "comfort", notes: "2 stalls · token at front desk" },
    { key: "fuel", name: "Fuel station", available: false, category: "services" },
    { key: "truck-wash", name: "Truck wash", available: false, category: "services" },
    { key: "scale", name: "Certified scale", available: true, category: "cargo", notes: "Inbound + outbound" },
    { key: "forklift", name: "Forklift available", available: true, category: "cargo", notes: "5 units · 8000 lb" },
    { key: "cross-dock", name: "Cross-dock", available: true, category: "cargo" },
    { key: "refrigerated", name: "Refrigerated storage", available: false, category: "cargo" },
    { key: "hazmat", name: "Hazmat certified", available: true, category: "cargo", notes: "Class 3, 8, 9" },
    { key: "overnight", name: "Overnight parking", available: true, category: "parking", notes: "12 spaces · first-come" },
    { key: "24-7", name: "24/7 access", available: false, category: "parking", notes: "Closed Sundays" },
    { key: "security", name: "Security gate", available: true, category: "security", notes: "Manned 06:00–22:00" },
    { key: "wifi", name: "Driver WiFi", available: true, category: "utilities" },
    { key: "vending", name: "Vending machines", available: true, category: "comfort" },
    { key: "ev-charging", name: "EV charging", available: false, category: "utilities" },
  ],
}

// ─── Implementation ───────────────────────────────────────────────────────

export const useStore = create<Store>()(persist((set, get) => ({
  drivers: seedDrivers,
  vehicles: seedVehicles,
  facilities: seedFacilities,
  users: seedUsers,
  appointments: seedAppointments,
  loads: seedLoads,
  docks: seedDocks,
  gateEvents: seedGateEvents,
  documents: seedDocs,
  signatures: seedSigs,
  exceptions: seedExceptions,
  threads: seedThreads,
  messagesByThread: seedMessages,
  notifications: seedNotifications,
  suggestions: [
    { id: "S-1", title: "Reassign LD-4422 from D-03 → D-01", reason: "D-01 frees in 4m, D-03 has 22m queue.", saving: "Saves 18m dwell", confidence: 92 },
    { id: "S-2", title: "Move LD-4441 slot 14:00 → 13:30", reason: "Driver DR-1108 finishes early at D-03.", saving: "Reduces idle time by 30m", confidence: 84 },
    { id: "S-3", title: "Swap doors D-05 ↔ D-07", reason: "Cargo type mismatch with current door equipment.", saving: "Avoids forklift transfer", confidence: 76 },
  ],
  invoices: seedInvoices,
  paymentMethods: seedPaymentMethods,
  amenityCategories: seedAmenityCategories,
  subscription: { plan: "Growth", renewsOn: "May 28, 2026", price: 549 },
  account: seedAccount,
  site: seedSite,
  oncall: "K. Nakamura",
  shift: {
    name: "Day",
    startTime: "06:00",
    endTime: "14:00",
    supervisor: "K. Reeves",
    crewSize: 6,
    loadsCompleted: 14,
    palletsMoved: 412,
    issues: 1,
  },
  loaders: [
    { id: "L-1", name: "K. Reeves", shift: "Day", status: "covering", task: "D-12 · escalation", isMe: true },
    { id: "L-2", name: "M. Lin", shift: "Day", status: "loading", task: "D-01 · LD-4421" },
    { id: "L-3", name: "J. Park", shift: "Day", status: "loading", task: "D-03 · LD-4422" },
    { id: "L-4", name: "A. Singh", shift: "Day", status: "loading", task: "D-07 · LD-4407" },
    { id: "L-5", name: "T. Bell", shift: "Day", status: "available" },
    { id: "L-6", name: "R. Owens", shift: "Day", status: "break", task: "Lunch · back 12:30" },
  ],
  prefs: defaultPrefs,

  bookAppointment: ({ time, date, carrier, type, driverId, origin, destination, weight, pieces }) => {
    const appointmentId = id("AP")
    const loadId = id("LD")
    const newLoad: Load = {
      id: loadId,
      origin,
      destination,
      weight,
      pieces,
      status: "scheduled",
      carrier,
      appointmentId,
    }
    const newAppt: Appointment = {
      id: appointmentId,
      time,
      date,
      carrier,
      loadId,
      type,
      driverId,
      status: "confirmed",
      equipment: ["53ft"],
      audit: [
        {
          id: id("EVT"),
          actor: "You",
          action: "Booking created",
          time: "now",
          source: "user",
        },
      ],
    }
    set((s) => ({
      appointments: [newAppt, ...s.appointments],
      loads: [newLoad, ...s.loads],
    }))
    get().pushNotification({
      title: `Appointment booked · ${appointmentId}`,
      detail: `${carrier} · ${type} · ${time}`,
      kind: "success",
    })
    return { appointmentId, loadId }
  },

  cancelAppointment: (appointmentId, reason) => {
    set((s) => ({
      appointments: s.appointments.map((a) =>
        a.id === appointmentId
          ? {
              ...a,
              status: "canceled",
              audit: [
                {
                  id: id("EVT"),
                  actor: "You",
                  action: "Canceled",
                  detail: reason,
                  time: "now",
                  source: "user",
                },
                ...a.audit,
              ],
            }
          : a,
      ),
    }))
  },

  approveAppointment: (appointmentId) => {
    set((s) => ({
      appointments: s.appointments.map((a) =>
        a.id === appointmentId
          ? {
              ...a,
              status: "confirmed",
              audit: [
                { id: id("EVT"), actor: "You", action: "Approved", time: "now", source: "user" },
                ...a.audit,
              ],
            }
          : a,
      ),
    }))
    get().pushNotification({
      title: `Appointment approved · ${appointmentId}`,
      detail: "",
      kind: "success",
    })
  },

  declineAppointment: (appointmentId, reason) => {
    set((s) => ({
      appointments: s.appointments.map((a) =>
        a.id === appointmentId
          ? {
              ...a,
              status: "canceled",
              audit: [
                {
                  id: id("EVT"),
                  actor: "You",
                  action: "Declined",
                  detail: reason,
                  time: "now",
                  source: "user",
                },
                ...a.audit,
              ],
            }
          : a,
      ),
    }))
  },

  rescheduleAppointment: (appointmentId, date, time, dockId) => {
    set((s) => ({
      appointments: s.appointments.map((a) =>
        a.id === appointmentId
          ? {
              ...a,
              date,
              time,
              dockId: dockId ?? a.dockId,
              audit: [
                {
                  id: id("EVT"),
                  actor: "You",
                  action: "Rescheduled",
                  detail: `${date} · ${time}${dockId ? ` · ${dockId}` : ""}`,
                  time: "now",
                  source: "user",
                },
                ...a.audit,
              ],
            }
          : a,
      ),
    }))
    get().pushNotification({
      title: `Rescheduled · ${appointmentId}`,
      detail: `${date} · ${time}`,
      kind: "info",
    })
  },

  duplicateAppointment: (appointmentId) => {
    const src = get().appointments.find((a) => a.id === appointmentId)
    if (!src) return null
    const newId = id("AP")
    const newLoadId = id("LD")
    const copy: Appointment = {
      ...src,
      id: newId,
      loadId: newLoadId,
      status: "pending",
      audit: [
        {
          id: id("EVT"),
          actor: "You",
          action: "Duplicated",
          detail: `Copy of ${appointmentId}`,
          time: "now",
          source: "user",
        },
      ],
    }
    set((s) => ({ appointments: [copy, ...s.appointments] }))
    return newId
  },

  markAppointmentStatus: (appointmentId, status) => {
    set((s) => ({
      appointments: s.appointments.map((a) =>
        a.id === appointmentId
          ? {
              ...a,
              status,
              audit: [
                {
                  id: id("EVT"),
                  actor: "You",
                  action: `Marked ${status}`,
                  time: "now",
                  source: "user",
                },
                ...a.audit,
              ],
            }
          : a,
      ),
    }))
  },

  appendAudit: (appointmentId, entry) => {
    set((s) => ({
      appointments: s.appointments.map((a) =>
        a.id === appointmentId
          ? {
              ...a,
              audit: [
                { id: id("EVT"), time: "now", ...entry } as AuditEntry,
                ...a.audit,
              ],
            }
          : a,
      ),
    }))
  },

  checkInDriver: ({ driverId, loadId, trailer }) => {
    const time = fmtTime(now())
    const eventId = id("GE")
    let assignedDock: string | undefined
    set((s) => {
      const freeDock = s.docks.find((d) => d.status === "free")
      assignedDock = s.site.gate.autoAssignDock ? freeDock?.id : undefined
      const newEvent: GateEvent = {
        id: eventId,
        type: "in",
        driverId,
        loadId,
        trailer,
        dockId: assignedDock,
        time,
      }
      return {
        gateEvents: [newEvent, ...s.gateEvents],
        appointments: s.appointments.map((a) =>
          a.loadId === loadId ? { ...a, status: assignedDock ? "loading" : "checked-in", dockId: assignedDock ?? a.dockId } : a,
        ),
        loads: s.loads.map((l) =>
          l.id === loadId
            ? { ...l, status: assignedDock ? "loading" : l.status, dockId: assignedDock ?? l.dockId, driverId }
            : l,
        ),
        docks: assignedDock
          ? s.docks.map((d) =>
              d.id === assignedDock
                ? { ...d, status: "loading", loadId, since: time, progress: 0 }
                : d,
            )
          : s.docks,
      }
    })
    get().pushNotification({
      title: `Driver checked in · ${driverId}`,
      detail: assignedDock ? `Assigned to ${assignedDock}` : "Awaiting dock",
      kind: "info",
    })
    return { dockId: assignedDock }
  },

  checkOutDriver: ({ loadId, seal }) => {
    const time = fmtTime(now())
    set((s) => {
      const load = s.loads.find((l) => l.id === loadId)
      const sealMismatch = load?.seal && load.seal !== seal
      const eventId = id("GE")
      const newEvent: GateEvent = {
        id: eventId,
        type: "out",
        driverId: load?.driverId ?? "—",
        loadId,
        trailer: "—",
        dockId: load?.dockId,
        time,
      }
      const newExceptions: LogiException[] = sealMismatch
        ? [
            {
              id: id("EX"),
              severity: "warning",
              title: `Seal mismatch · ${loadId}`,
              detail: `Reported ${load?.seal}, scanned ${seal}.`,
              loadId,
              driverId: load?.driverId,
              age: "now",
              status: "open",
            },
            ...s.exceptions,
          ]
        : s.exceptions
      return {
        gateEvents: [newEvent, ...s.gateEvents],
        loads: s.loads.map((l) =>
          l.id === loadId ? { ...l, status: "in-transit", seal: seal || l.seal } : l,
        ),
        appointments: s.appointments.map((a) =>
          a.loadId === loadId ? { ...a, status: "completed" } : a,
        ),
        docks: s.docks.map((d) =>
          d.loadId === loadId ? { ...d, status: "free", loadId: undefined, since: undefined, progress: undefined } : d,
        ),
        exceptions: newExceptions,
      }
    })
    get().pushNotification({
      title: `Driver checked out`,
      detail: `${loadId} departed`,
      kind: "success",
    })
  },

  assignDock: (loadId, dockId) => {
    const time = fmtTime(now())
    set((s) => ({
      docks: s.docks.map((d) =>
        d.id === dockId ? { ...d, status: "loading", loadId, since: time, progress: 0 } : d,
      ),
      loads: s.loads.map((l) =>
        l.id === loadId ? { ...l, status: "loading", dockId } : l,
      ),
      appointments: s.appointments.map((a) =>
        a.loadId === loadId ? { ...a, status: "loading", dockId } : a,
      ),
    }))
  },

  freeDock: (dockId) =>
    set((s) => ({
      docks: s.docks.map((d) =>
        d.id === dockId
          ? { ...d, status: "free", loadId: undefined, since: undefined, progress: undefined, blockReason: undefined }
          : d,
      ),
    })),

  blockDock: (dockId, reason) =>
    set((s) => ({
      docks: s.docks.map((d) =>
        d.id === dockId ? { ...d, status: "blocked", blockReason: reason, since: "Maintenance" } : d,
      ),
    })),

  generateDocument: ({ kind, loadId, name }) => {
    const documentId = id("DOC")
    const docName = name ?? `${kind}_${loadId ?? "manual"}.pdf`
    const newDoc: LogiDocument = {
      id: documentId,
      name: docName,
      kind,
      loadId,
      status: "pending-signature",
      createdAt: fmtTime(now()),
    }
    let signatureId: string | undefined
    set((s) => {
      const updated = { documents: [newDoc, ...s.documents] }
      const driver = loadId ? s.drivers.find((d) => d.id === s.loads.find((l) => l.id === loadId)?.driverId) : undefined
      if (kind === "BOL" || kind === "POD") {
        signatureId = id("SIG")
        const newSig: Signature = {
          id: signatureId,
          documentId,
          signerName: driver?.name ?? "Driver",
          signerRole: "Driver",
          status: "pending",
          requestedAt: "now",
        }
        return { ...updated, signatures: [newSig, ...s.signatures] }
      }
      return updated
    })
    if (loadId) {
      set((s) => ({
        loads: s.loads.map((l) =>
          l.id === loadId && kind === "BOL" ? { ...l, bolGenerated: true } : l,
        ),
      }))
    }
    get().pushNotification({
      title: `${kind} generated`,
      detail: docName,
      kind: "success",
    })
    return { documentId, signatureId }
  },

  requestSignature: ({ documentId, signerName, signerRole }) => {
    const signatureId = id("SIG")
    const newSig: Signature = {
      id: signatureId,
      documentId,
      signerName,
      signerRole,
      status: "pending",
      requestedAt: "now",
    }
    set((s) => ({ signatures: [newSig, ...s.signatures] }))
    return { signatureId }
  },

  signDocument: (signatureId) => {
    set((s) => {
      const sig = s.signatures.find((x) => x.id === signatureId)
      if (!sig) return {}
      return {
        signatures: s.signatures.map((x) =>
          x.id === signatureId ? { ...x, status: "signed", resolvedAt: fmtTime(now()) } : x,
        ),
        documents: s.documents.map((d) =>
          d.id === sig.documentId ? { ...d, status: "signed" } : d,
        ),
      }
    })
    get().pushNotification({
      title: "Signature received",
      detail: signatureId,
      kind: "success",
    })
  },

  declineSignature: (signatureId) => {
    set((s) => ({
      signatures: s.signatures.map((x) =>
        x.id === signatureId ? { ...x, status: "declined", resolvedAt: fmtTime(now()) } : x,
      ),
    }))
    get().pushNotification({
      title: "Signature declined",
      detail: signatureId,
      kind: "warning",
    })
  },

  remindSigner: (signatureId) => {
    get().pushNotification({
      title: "Reminder sent",
      detail: signatureId,
      kind: "info",
    })
  },

  resolveException: (exceptionId) => {
    set((s) => ({
      exceptions: s.exceptions.map((e) =>
        e.id === exceptionId ? { ...e, status: "resolved" } : e,
      ),
    }))
  },

  snoozeException: (exceptionId) => {
    set((s) => ({
      exceptions: s.exceptions.map((e) =>
        e.id === exceptionId ? { ...e, status: "snoozed" } : e,
      ),
    }))
  },

  applySuggestion: (suggestionId) => {
    const sug = get().suggestions.find((s) => s.id === suggestionId)
    set((s) => ({
      suggestions: s.suggestions.filter((x) => x.id !== suggestionId),
    }))
    if (sug) {
      get().pushNotification({
        title: "Suggestion applied",
        detail: sug.title,
        kind: "success",
      })
    }
  },

  dismissSuggestion: (suggestionId) =>
    set((s) => ({
      suggestions: s.suggestions.filter((x) => x.id !== suggestionId),
    })),

  runOptimizer: () => {
    const newSugs: Suggestion[] = [
      { id: id("S"), title: "Consolidate LD-4448 + LD-4441 into single dock window", reason: "Same destination route, overlap of 30m.", saving: "Saves 1 dock-hour", confidence: 81 },
      { id: id("S"), title: "Pre-stage trailer T-104 to D-05", reason: "Next inbound expected in 12m.", saving: "Reduces yard moves by 1", confidence: 88 },
    ]
    set((s) => ({ suggestions: [...newSugs, ...s.suggestions] }))
    get().pushNotification({
      title: "Optimizer run complete",
      detail: `${newSugs.length} new suggestions`,
      kind: "info",
    })
    return newSugs.length
  },

  sendMessage: (threadId, text) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const msg: Message = {
      id: id("M"),
      from: "You",
      text: trimmed,
      time: fmtTime(now()),
      me: true,
    }
    set((s) => ({
      messagesByThread: {
        ...s.messagesByThread,
        [threadId]: [...(s.messagesByThread[threadId] ?? []), msg],
      },
      threads: s.threads.map((t) =>
        t.id === threadId ? { ...t, preview: trimmed.slice(0, 60), time: "now" } : t,
      ),
    }))
  },

  markThreadRead: (threadId) => {
    set((s) => ({
      threads: s.threads.map((t) => (t.id === threadId ? { ...t, unread: 0 } : t)),
    }))
  },

  addDriver: (d) => {
    const newId = id("DR")
    set((s) => ({ drivers: [{ ...d, id: newId }, ...s.drivers] }))
    return newId
  },

  updateDriver: (driverId, patch) => {
    set((s) => ({
      drivers: s.drivers.map((d) => (d.id === driverId ? { ...d, ...patch } : d)),
    }))
  },

  addVehicle: (v) => {
    const newId = id("TR")
    set((s) => ({ vehicles: [{ ...v, id: newId }, ...s.vehicles] }))
    return newId
  },

  addFacility: (f) => {
    const newId = id("BR")
    set((s) => ({ facilities: [{ ...f, id: newId }, ...s.facilities] }))
    return newId
  },

  inviteUser: (u) => {
    const newId = id("U")
    set((s) => ({
      users: [
        { ...u, id: newId, status: "invited", lastActive: "—" },
        ...s.users,
      ],
    }))
    return newId
  },

  removeUser: (userId) => {
    set((s) => ({ users: s.users.filter((u) => u.id !== userId) }))
  },

  updateAccount: (patch) => set((s) => ({ account: { ...s.account, ...patch } })),

  updateSite: (patch) => set((s) => ({ site: { ...s.site, ...patch } })),

  addSitePhoto: ({ url, caption, category, tags, description, sizeBytes, width, height, uploadedBy }) => {
    const photoId = id("PH")
    set((s) => ({
      site: {
        ...s.site,
        photos: [
          {
            id: photoId,
            url,
            caption,
            primary: s.site.photos.length === 0,
            uploadedAt: isoDate(),
            uploadedBy: uploadedBy ?? "Avery Patel",
            category: category ?? "other",
            tags: tags ?? [],
            description: description ?? "",
            sizeBytes,
            width,
            height,
          },
          ...s.site.photos,
        ],
      },
    }))
    return photoId
  },

  updateSitePhoto: (photoId, patch) => {
    set((s) => ({
      site: {
        ...s.site,
        photos: s.site.photos.map((p) =>
          p.id === photoId ? { ...p, ...patch } : p,
        ),
      },
    }))
  },

  removeSitePhoto: (photoId) => {
    set((s) => {
      const removed = s.site.photos.find((p) => p.id === photoId)
      const remaining = s.site.photos.filter((p) => p.id !== photoId)
      if (removed?.primary && remaining.length > 0) {
        remaining[0] = { ...remaining[0], primary: true }
      }
      return { site: { ...s.site, photos: remaining } }
    })
  },

  setPrimaryPhoto: (photoId) => {
    set((s) => ({
      site: {
        ...s.site,
        photos: s.site.photos.map((p) => ({ ...p, primary: p.id === photoId })),
      },
    }))
  },

  reorderSitePhotos: (orderedIds) => {
    set((s) => {
      const map = new Map(s.site.photos.map((p) => [p.id, p]))
      const ordered = orderedIds
        .map((pid) => map.get(pid))
        .filter((p): p is SitePhoto => Boolean(p))
      const remaining = s.site.photos.filter((p) => !orderedIds.includes(p.id))
      return { site: { ...s.site, photos: [...ordered, ...remaining] } }
    })
  },

  toggleAmenity: (key) => {
    set((s) => ({
      site: {
        ...s.site,
        amenities: s.site.amenities.map((a) =>
          a.key === key ? { ...a, available: !a.available } : a,
        ),
      },
    }))
  },

  updateAmenityNotes: (key, notes) => {
    set((s) => ({
      site: {
        ...s.site,
        amenities: s.site.amenities.map((a) =>
          a.key === key ? { ...a, notes } : a,
        ),
      },
    }))
  },

  addAmenity: (amenity) => {
    const key = amenity.name.toLowerCase().replace(/\s+/g, "-").slice(0, 32)
    set((s) => {
      if (s.site.amenities.some((a) => a.key === key)) return {}
      return {
        site: {
          ...s.site,
          amenities: [...s.site.amenities, { key, ...amenity }],
        },
      }
    })
  },

  updateAmenity: (key, patch) => {
    set((s) => ({
      site: {
        ...s.site,
        amenities: s.site.amenities.map((a) =>
          a.key === key ? { ...a, ...patch } : a,
        ),
      },
    }))
  },

  removeAmenity: (key) => {
    set((s) => ({
      site: {
        ...s.site,
        amenities: s.site.amenities.filter((a) => a.key !== key),
      },
    }))
  },

  addAmenityCategory: ({ label, description, icon, color }) => {
    const baseKey = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32) || "category"
    let key = baseKey
    let i = 2
    set((s) => {
      while (s.amenityCategories.some((c) => c.key === key)) {
        key = `${baseKey}-${i++}`
      }
      const order = s.amenityCategories.length
      const next: AmenityCategoryDef = {
        key,
        label,
        description: description ?? "",
        icon,
        color,
        order,
        builtin: false,
      }
      return { amenityCategories: [...s.amenityCategories, next] }
    })
    return key
  },

  updateAmenityCategory: (key, patch) => {
    set((s) => ({
      amenityCategories: s.amenityCategories.map((c) =>
        c.key === key ? { ...c, ...patch } : c,
      ),
    }))
  },

  removeAmenityCategory: (key) => {
    set((s) => {
      const target = s.amenityCategories.find((c) => c.key === key)
      if (!target || target.builtin) return {}
      const remaining = s.amenityCategories
        .filter((c) => c.key !== key)
        .sort((a, b) => a.order - b.order)
        .map((c, i) => ({ ...c, order: i }))
      const fallback = remaining[0]?.key ?? "services"
      const reassigned = s.site.amenities.map((a) =>
        a.category === key ? { ...a, category: fallback } : a,
      )
      return {
        amenityCategories: remaining,
        site: { ...s.site, amenities: reassigned },
      }
    })
  },

  reorderAmenityCategories: (orderedKeys) => {
    set((s) => {
      const map = new Map(s.amenityCategories.map((c) => [c.key, c]))
      const reordered: AmenityCategoryDef[] = []
      orderedKeys.forEach((k, i) => {
        const c = map.get(k)
        if (c) {
          reordered.push({ ...c, order: i })
          map.delete(k)
        }
      })
      let i = reordered.length
      for (const c of map.values()) {
        reordered.push({ ...c, order: i++ })
      }
      return { amenityCategories: reordered }
    })
  },

  changePlan: (plan) => {
    const price = plan === "Starter" ? 199 : plan === "Growth" ? 549 : 1499
    set((s) => ({
      subscription: { ...s.subscription, plan, price },
    }))
    get().pushNotification({
      title: "Plan changed",
      detail: `Switched to ${plan}`,
      kind: "success",
    })
  },

  payInvoice: (invoiceId) => {
    set((s) => ({
      invoices: s.invoices.map((i) =>
        i.id === invoiceId ? { ...i, status: "paid" } : i,
      ),
    }))
  },

  setLoadPriority: (loadId, priority) => {
    set((s) => ({
      loads: s.loads.map((l) => (l.id === loadId ? { ...l, priority } : l)),
    }))
  },

  advanceLoadProgress: (loadId, palletsDone) => {
    set((s) => ({
      loads: s.loads.map((l) =>
        l.id === loadId ? { ...l, palletsDone } : l,
      ),
      docks: s.docks.map((d) =>
        d.loadId === loadId
          ? {
              ...d,
              palletsDone,
              progress: d.palletsTotal
                ? Math.round((palletsDone / d.palletsTotal) * 100)
                : d.progress,
            }
          : d,
      ),
    }))
  },

  completeLoad: (loadId) => {
    set((s) => ({
      loads: s.loads.map((l) =>
        l.id === loadId ? { ...l, status: "awaiting-paperwork", palletsDone: l.palletsTotal } : l,
      ),
    }))
    get().pushNotification({
      title: `Load complete · ${loadId}`,
      detail: "Awaiting paperwork",
      kind: "success",
    })
  },

  markAllNotificationsRead: () => {
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    }))
  },

  pushNotification: (n) => {
    set((s) => ({
      notifications: [
        { ...n, id: id("N"), time: "now", read: false },
        ...s.notifications,
      ].slice(0, 30),
    }))
  },

  addPaymentMethod: ({ brand, last4, expMonth, expYear, setDefault }) => {
    const newId = id("PM")
    set((s) => ({
      paymentMethods: [
        ...s.paymentMethods.map((p) => (setDefault ? { ...p, isDefault: false } : p)),
        { id: newId, brand, last4, expMonth, expYear, isDefault: !!setDefault || s.paymentMethods.length === 0 },
      ],
    }))
    get().pushNotification({
      title: "Payment method added",
      detail: `${brand} ···· ${last4}`,
      kind: "success",
    })
    return newId
  },

  removePaymentMethod: (pmId) => {
    set((s) => {
      const target = s.paymentMethods.find((p) => p.id === pmId)
      const remaining = s.paymentMethods.filter((p) => p.id !== pmId)
      if (target?.isDefault && remaining.length > 0) {
        remaining[0] = { ...remaining[0], isDefault: true }
      }
      return { paymentMethods: remaining }
    })
  },

  setDefaultPaymentMethod: (pmId) => {
    set((s) => ({
      paymentMethods: s.paymentMethods.map((p) => ({ ...p, isDefault: p.id === pmId })),
    }))
  },

  renewLicense: (driverId, newExpiry) => {
    set((s) => ({
      drivers: s.drivers.map((d) =>
        d.id === driverId
          ? { ...d, licenseExp: newExpiry, status: d.status === "expiring" ? "off" : d.status }
          : d,
      ),
    }))
    get().pushNotification({
      title: "License renewed",
      detail: `${driverId} · expires ${newExpiry}`,
      kind: "success",
    })
  },

  sendAttachment: (threadId, attachment, text) => {
    const msg: Message = {
      id: id("M"),
      from: "You",
      text: text?.trim() || `Sent ${attachment.name}`,
      time: fmtTime(now()),
      me: true,
      attachments: [attachment],
    }
    set((s) => ({
      messagesByThread: {
        ...s.messagesByThread,
        [threadId]: [...(s.messagesByThread[threadId] ?? []), msg],
      },
      threads: s.threads.map((t) =>
        t.id === threadId ? { ...t, preview: `📎 ${attachment.name}`, time: "now" } : t,
      ),
    }))
  },

  broadcast: ({ audience, text }) => {
    const trimmed = text.trim()
    if (!trimmed) return 0
    const targetRoles =
      audience === "drivers" ? ["Driver"] : audience === "internal" ? ["Internal"] : ["Driver", "Internal"]
    let count = 0
    set((s) => {
      const updates: Record<string, Message[]> = {}
      const updatedThreads = s.threads.map((t) => {
        const isMatch = targetRoles.some((r) => t.role.includes(r))
        if (!isMatch) return t
        count++
        const msg: Message = {
          id: id("M"),
          from: "You · broadcast",
          text: trimmed,
          time: fmtTime(now()),
          me: true,
        }
        updates[t.id] = [...(s.messagesByThread[t.id] ?? []), msg]
        return { ...t, preview: `📢 ${trimmed.slice(0, 50)}`, time: "now" }
      })
      return {
        threads: updatedThreads,
        messagesByThread: { ...s.messagesByThread, ...updates },
      }
    })
    get().pushNotification({
      title: `Broadcast sent · ${audience}`,
      detail: `${count} recipient${count === 1 ? "" : "s"}`,
      kind: "info",
    })
    return count
  },

  updatePrefs: (patch) => {
    set((s) => ({
      prefs: {
        ...s.prefs,
        ...patch,
        notif: { ...s.prefs.notif, ...(patch.notif ?? {}) },
      },
    }))
  },

  resetPrefs: () => {
    set({ prefs: defaultPrefs })
  },
}), {
  name: "bobhaul-store",
  storage: createJSONStorage(() => localStorage),
  version: 4,
  partialize: (state) => {
    const { appointments: _appointments, ...rest } = state
    return rest as Store
  },
  migrate: (persistedState, fromVersion) => {
    const state = persistedState as Partial<Store> | undefined
    if (!state) return state as unknown as Store
    if (fromVersion < 2 && state.site?.amenities) {
      state.site = {
        ...state.site,
        amenities: state.site.amenities.map((a) => ({
          ...a,
          category: a.category ?? inferAmenityCategory(a.key, a.name),
        })),
      }
    }
    if (fromVersion < 3 || !state.amenityCategories || state.amenityCategories.length === 0) {
      state.amenityCategories = seedAmenityCategories
    }
    if (fromVersion < 4) {
      delete (state as { appointments?: unknown }).appointments
    }
    return state as unknown as Store
  },
}))

function inferAmenityCategory(key: string, name: string): AmenityCategory {
  const k = (key + " " + name).toLowerCase()
  if (/lounge|restroom|shower|wifi|vending|coffee|food|rest/.test(k)) return "comfort"
  if (/security|gate|guard|camera|lock/.test(k)) return "security"
  if (/dock|fork|scale|hazmat|reefer|refrig|cargo|cross/.test(k)) return "cargo"
  if (/parking|overnight|24|drop|yard/.test(k)) return "parking"
  if (/wifi|ev|electric|water|charg/.test(k)) return "utilities"
  return "services"
}

// Selectors
export const selectOpenExceptions = (s: Store) =>
  s.exceptions.filter((e) => e.status === "open")
export const selectActiveLoads = (s: Store) =>
  s.loads.filter((l) => ["loading", "unloading"].includes(l.status))
export const selectQueuedLoads = (s: Store) =>
  s.loads.filter((l) => l.status === "scheduled" && !l.dockId)
export const selectPendingSignatures = (s: Store) =>
  s.signatures.filter((sig) => sig.status === "pending")
export const selectUnreadNotifications = (s: Store) =>
  s.notifications.filter((n) => !n.read)
