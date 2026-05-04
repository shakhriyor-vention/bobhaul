import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowDownAZ,
  ArrowUpAZ,
  CalendarDays,
  ChevronDown,
  Clock,
  Download,
  Eye,
  Filter,
  HardDrive,
  ImagePlus,
  Layers,
  MapPin,
  Maximize2,
  MoreHorizontal,
  MoveDown,
  MoveUp,
  Plus,
  Ruler,
  Search,
  Star,
  Tag,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PageHeader } from "@/components/page-header"
import { ManageAmenityCategoriesSheet } from "@/components/dialogs/manage-amenity-categories"
import { resolveCategory, sortByOrder } from "@/config/amenity-categories"
import { iconByName } from "@/lib/amenity-icons"
import { colorTone } from "@/lib/amenity-colors"
import { useStore, type AmenityCategory, type SiteSettings, type SitePhoto, type SitePhotoCategory, type SiteAmenity } from "@/store"

type Tab = "general" | "photos" | "amenities"

export default function SiteDetails() {
  const site = useStore((s) => s.site)
  const update = useStore((s) => s.updateSite)
  const [tab, setTab] = useState<Tab>("general")
  const [draft, setDraft] = useState<SiteSettings>(site)
  useEffect(() => setDraft(site), [site])

  const dirtyGeneral =
    JSON.stringify({ ...draft, photos: undefined, amenities: undefined }) !==
    JSON.stringify({ ...site, photos: undefined, amenities: undefined })

  const save = () => {
    update({
      name: draft.name,
      code: draft.code,
      manager: draft.manager,
      region: draft.region,
      address: draft.address,
      lat: draft.lat,
      lng: draft.lng,
      hours: draft.hours,
      gate: draft.gate,
    })
    toast.success("Site updated")
  }

  const updateGate = <K extends keyof SiteSettings["gate"]>(
    key: K,
    value: SiteSettings["gate"][K],
  ) => {
    setDraft({ ...draft, gate: { ...draft.gate, [key]: value } })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Site Details"
        description="Operating hours, gate config, photos, amenities."
        actions={
          tab === "general" ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDraft(site)}
                disabled={!dirtyGeneral}
              >
                Discard
              </Button>
              <Button size="sm" onClick={save} disabled={!dirtyGeneral}>
                Save changes
              </Button>
            </>
          ) : null
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="photos">
            Photos · {site.photos.length}
          </TabsTrigger>
          <TabsTrigger value="amenities">
            Amenities · {site.amenities.filter((a) => a.available).length}/{site.amenities.length}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="size-4 text-muted-foreground" /> {draft.name}
                  </CardTitle>
                  <CardDescription>{draft.code} · {draft.address}</CardDescription>
                </div>
                <Badge>Active site</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Site name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
              <Field label="Site code" value={draft.code} onChange={(v) => setDraft({ ...draft, code: v })} />
              <Field label="Manager" value={draft.manager} onChange={(v) => setDraft({ ...draft, manager: v })} />
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Region</Label>
                <Select value={draft.region} onValueChange={(v) => setDraft({ ...draft, region: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="midwest">Midwest</SelectItem>
                    <SelectItem value="south">South</SelectItem>
                    <SelectItem value="west">West</SelectItem>
                    <SelectItem value="east">East</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Street address</Label>
                <Input
                  value={draft.address}
                  onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                />
              </div>
              <Field label="Latitude" value={draft.lat} onChange={(v) => setDraft({ ...draft, lat: v })} />
              <Field label="Longitude" value={draft.lng} onChange={(v) => setDraft({ ...draft, lng: v })} />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" /> Operating hours
                </CardTitle>
                <CardDescription>Gate access and dock availability</CardDescription>
              </CardHeader>
              <CardContent className="divide-y">
                {draft.hours.map((h, i) => (
                  <div
                    key={h.day}
                    className="grid grid-cols-[140px_1fr_auto] items-center gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <span className="text-sm font-medium">{h.day}</span>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {h.on ? (
                        <>
                          <Input
                            className="h-8 w-24 font-mono"
                            value={h.open}
                            onChange={(e) => {
                              const next = [...draft.hours]
                              next[i] = { ...h, open: e.target.value }
                              setDraft({ ...draft, hours: next })
                            }}
                          />
                          <span>—</span>
                          <Input
                            className="h-8 w-24 font-mono"
                            value={h.close}
                            onChange={(e) => {
                              const next = [...draft.hours]
                              next[i] = { ...h, close: e.target.value }
                              setDraft({ ...draft, hours: next })
                            }}
                          />
                        </>
                      ) : (
                        <span className="italic">Closed</span>
                      )}
                    </div>
                    <Switch
                      checked={h.on}
                      onCheckedChange={(c) => {
                        const next = [...draft.hours]
                        next[i] = { ...h, on: c }
                        setDraft({ ...draft, hours: next })
                      }}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gate & access</CardTitle>
                <CardDescription>Driver entry rules</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Toggle
                  label="Require QR check-in"
                  desc="Drivers must scan at kiosk"
                  checked={draft.gate.requireQr}
                  onChange={(v) => updateGate("requireQr", v)}
                />
                <Toggle
                  label="Auto-assign dock"
                  desc="Optimizer picks door on check-in"
                  checked={draft.gate.autoAssignDock}
                  onChange={(v) => updateGate("autoAssignDock", v)}
                />
                <Toggle
                  label="Photo of trailer"
                  desc="Captured at gate"
                  checked={draft.gate.photoTrailer}
                  onChange={(v) => updateGate("photoTrailer", v)}
                />
                <Toggle
                  label="Seal verification"
                  desc="Required at check-out"
                  checked={draft.gate.sealVerification}
                  onChange={(v) => updateGate("sealVerification", v)}
                />
                <Toggle
                  label="After-hours arrivals"
                  desc="Allow drop-and-go"
                  checked={draft.gate.afterHours}
                  onChange={(v) => updateGate("afterHours", v)}
                />
                <div className="space-y-1.5 pt-2">
                  <Label className="text-xs text-muted-foreground">Gate guard contact</Label>
                  <Input
                    value={draft.gate.guardPhone}
                    onChange={(e) => updateGate("guardPhone", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Notes for drivers</Label>
                  <Textarea
                    rows={3}
                    value={draft.gate.notes}
                    onChange={(e) => updateGate("notes", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="photos" className="mt-6">
          <PhotosTab />
        </TabsContent>

        <TabsContent value="amenities" className="mt-6">
          <AmenitiesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

const PHOTO_CATEGORIES: { key: SitePhotoCategory; label: string; tone: string }[] = [
  { key: "entrance", label: "Entrance", tone: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300" },
  { key: "dock", label: "Dock", tone: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300" },
  { key: "parking", label: "Parking", tone: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
  { key: "signage", label: "Signage", tone: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300" },
  { key: "hazard", label: "Hazard", tone: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" },
  { key: "interior", label: "Interior", tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
  { key: "exterior", label: "Exterior", tone: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300" },
  { key: "other", label: "Other", tone: "bg-zinc-100 text-zinc-700 dark:bg-zinc-500/15 dark:text-zinc-300" },
]

function getCategoryMeta(key?: SitePhotoCategory) {
  return PHOTO_CATEGORIES.find((c) => c.key === key) ?? PHOTO_CATEGORIES[7]
}

function formatBytes(bytes?: number) {
  if (!bytes) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

type SortKey = "newest" | "oldest" | "name" | "category"

function PhotosTab() {
  const photos = useStore((s) => s.site.photos)
  const siteCode = useStore((s) => s.site.code)
  const addPhoto = useStore((s) => s.addSitePhoto)
  const updatePhoto = useStore((s) => s.updateSitePhoto)
  const removePhoto = useStore((s) => s.removeSitePhoto)
  const setPrimary = useStore((s) => s.setPrimaryPhoto)
  const reorder = useStore((s) => s.reorderSitePhotos)
  const fileInput = useRef<HTMLInputElement>(null)

  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [lightboxId, setLightboxId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [filterCat, setFilterCat] = useState<SitePhotoCategory | "all">("all")
  const [sort, setSort] = useState<SortKey>("newest")

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    Array.from(files).forEach((f) => {
      const url = URL.createObjectURL(f)
      addPhoto({
        url,
        caption: f.name.replace(/\.[^.]+$/, ""),
        sizeBytes: f.size,
        category: "other",
        uploadedBy: "You",
      })
    })
    toast.success(`Uploaded ${files.length} photo${files.length === 1 ? "" : "s"}`)
  }

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: photos.length }
    PHOTO_CATEGORIES.forEach((c) => (map[c.key] = 0))
    photos.forEach((p) => {
      const k = p.category ?? "other"
      map[k] = (map[k] ?? 0) + 1
    })
    return map
  }, [photos])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = photos.filter((p) => {
      if (filterCat !== "all" && (p.category ?? "other") !== filterCat) return false
      if (!q) return true
      return (
        p.caption.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        (p.tags ?? []).some((t) => t.toLowerCase().includes(q))
      )
    })
    list = [...list]
    if (sort === "newest") list.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
    if (sort === "oldest") list.sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt))
    if (sort === "name") list.sort((a, b) => a.caption.localeCompare(b.caption))
    if (sort === "category")
      list.sort((a, b) => (a.category ?? "other").localeCompare(b.category ?? "other"))
    return list
  }, [photos, search, filterCat, sort])

  const lightboxIndex = lightboxId ? filtered.findIndex((p) => p.id === lightboxId) : -1
  const lightboxPhoto = lightboxIndex >= 0 ? filtered[lightboxIndex] : null

  const stepLightbox = (delta: number) => {
    if (!lightboxPhoto || filtered.length === 0) return
    const next = (lightboxIndex + delta + filtered.length) % filtered.length
    setLightboxId(filtered[next].id)
  }

  const moveCard = (id: string, dir: -1 | 1) => {
    const ids = photos.map((p) => p.id)
    const idx = ids.indexOf(id)
    const target = idx + dir
    if (idx < 0 || target < 0 || target >= ids.length) return
    ;[ids[idx], ids[target]] = [ids[target], ids[idx]]
    reorder(ids)
  }

  const downloadPhoto = (p: SitePhoto) => {
    const a = document.createElement("a")
    a.href = p.url
    a.download = `${p.caption || "photo"}.jpg`
    a.target = "_blank"
    a.rel = "noopener noreferrer"
    document.body.appendChild(a)
    a.click()
    a.remove()
    toast.success("Download started")
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search caption, tag, description…"
              className="pl-9"
            />
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">
                <span className="flex items-center gap-2">
                  <ArrowDownAZ className="size-4" /> Newest
                </span>
              </SelectItem>
              <SelectItem value="oldest">
                <span className="flex items-center gap-2">
                  <ArrowUpAZ className="size-4" /> Oldest
                </span>
              </SelectItem>
              <SelectItem value="name">By name</SelectItem>
              <SelectItem value="category">By category</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={() => fileInput.current?.click()}>
          <ImagePlus className="mr-1.5 size-4" /> Upload
        </Button>
        <input
          ref={fileInput}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files)
            e.target.value = ""
          }}
        />
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Filter className="size-3.5" /> Filter
        </span>
        <FilterChip
          active={filterCat === "all"}
          onClick={() => setFilterCat("all")}
          label="All"
          count={counts.all}
        />
        {PHOTO_CATEGORIES.map((c) => (
          <FilterChip
            key={c.key}
            active={filterCat === c.key}
            onClick={() => setFilterCat(c.key)}
            label={c.label}
            count={counts[c.key] ?? 0}
            tone={c.tone}
          />
        ))}
      </div>

      {/* Drop zone */}
      <Card className="p-0">
        <CardContent className="p-0">
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              handleFiles(e.dataTransfer.files)
            }}
            className="flex w-full cursor-pointer items-center justify-center gap-4 rounded-xl border-2 border-dashed bg-muted/20 p-5 transition-colors hover:bg-muted/40"
          >
            <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Upload className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Drop images or click to upload</p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, WebP · multiple files OK · max 10 MB each
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.preventDefault()
                fileInput.current?.click()
              }}
            >
              <Plus className="mr-1.5 size-4" /> Browse
            </Button>
          </label>
        </CardContent>
      </Card>

      {/* Gallery */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            {photos.length === 0
              ? "No photos yet. Upload to get started."
              : "No photos match your filters."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p, i) => {
            const cat = getCategoryMeta(p.category)
            const idxInAll = photos.findIndex((x) => x.id === p.id)
            return (
              <Card key={p.id} className="group overflow-hidden p-0">
                <div className="relative aspect-[4/3] bg-muted">
                  <img
                    src={p.url}
                    alt={p.caption}
                    className="h-full w-full cursor-zoom-in object-cover"
                    onClick={() => setLightboxId(p.id)}
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.opacity = "0.3"
                    }}
                  />

                  {/* Top-left badges */}
                  <div className="absolute left-2 top-2 flex gap-1.5">
                    {p.primary && (
                      <Badge className="gap-1 bg-amber-500 text-white hover:bg-amber-500">
                        <Star className="size-3 fill-current" /> Primary
                      </Badge>
                    )}
                    <Badge variant="secondary" className={cat.tone}>
                      {cat.label}
                    </Badge>
                  </div>

                  {/* Top-right menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute right-2 top-2 size-7 bg-background/80 backdrop-blur"
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setLightboxId(p.id)}>
                        <Eye className="mr-2 size-4" /> View
                      </DropdownMenuItem>
                      {!p.primary && (
                        <DropdownMenuItem
                          onClick={() => {
                            setPrimary(p.id)
                            toast.success("Primary photo updated")
                          }}
                        >
                          <Star className="mr-2 size-4" /> Set as primary
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => downloadPhoto(p)}>
                        <Download className="mr-2 size-4" /> Download
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        disabled={idxInAll === 0}
                        onClick={() => moveCard(p.id, -1)}
                      >
                        <MoveUp className="mr-2 size-4" /> Move up
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={idxInAll === photos.length - 1}
                        onClick={() => moveCard(p.id, 1)}
                      >
                        <MoveDown className="mr-2 size-4" /> Move down
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-rose-600 focus:text-rose-600"
                        onClick={() => setPendingDelete(p.id)}
                      >
                        <Trash2 className="mr-2 size-4" /> Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Hover overlay */}
                  <button
                    type="button"
                    onClick={() => setLightboxId(p.id)}
                    className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-2 items-center justify-center gap-2 bg-gradient-to-t from-black/60 to-transparent py-3 text-xs font-medium text-white opacity-0 transition group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100"
                  >
                    <Maximize2 className="size-3.5" /> Click to expand · #{i + 1}
                  </button>
                </div>
                <div className="p-3">
                  <div className="line-clamp-1 text-sm font-medium">{p.caption}</div>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="size-3" /> {p.uploadedBy ?? "—"}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="size-3" /> {p.uploadedAt}
                    </span>
                  </div>
                  {p.tags && p.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {p.tags.slice(0, 3).map((t) => (
                        <Badge
                          key={t}
                          variant="outline"
                          className="rounded-full px-1.5 py-0 text-[10px]"
                        >
                          #{t}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={!!lightboxPhoto} onOpenChange={(o) => !o && setLightboxId(null)}>
        <DialogContent className="max-w-5xl p-0 sm:max-w-5xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Photo preview</DialogTitle>
            <DialogDescription>Photo metadata and actions</DialogDescription>
          </DialogHeader>
          {lightboxPhoto && (
            <Lightbox
              photo={lightboxPhoto}
              siteCode={siteCode}
              onClose={() => setLightboxId(null)}
              onPrev={() => stepLightbox(-1)}
              onNext={() => stepLightbox(1)}
              onUpdate={(patch) => updatePhoto(lightboxPhoto.id, patch)}
              onSetPrimary={() => {
                setPrimary(lightboxPhoto.id)
                toast.success("Primary photo updated")
              }}
              onDownload={() => downloadPhoto(lightboxPhoto)}
              onDelete={() => {
                setLightboxId(null)
                setPendingDelete(lightboxPhoto.id)
              }}
              positionLabel={`${lightboxIndex + 1} / ${filtered.length}`}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove photo?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) {
                  removePhoto(pendingDelete)
                  toast.success("Photo removed")
                  setPendingDelete(null)
                }
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  label,
  count,
  tone,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
  tone?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors " +
        (active
          ? "border-foreground/20 bg-foreground text-background"
          : "border-input bg-background text-foreground hover:bg-muted")
      }
    >
      {tone && !active && (
        <span className={`size-2 rounded-full ${tone.split(" ").find((c) => c.startsWith("bg-")) ?? "bg-muted"}`} />
      )}
      {label}
      <span
        className={
          "rounded-full px-1.5 text-[10px] " +
          (active ? "bg-background/15 text-background" : "bg-muted text-muted-foreground")
        }
      >
        {count}
      </span>
    </button>
  )
}

function Lightbox({
  photo,
  siteCode,
  onClose,
  onPrev,
  onNext,
  onUpdate,
  onSetPrimary,
  onDownload,
  onDelete,
  positionLabel,
}: {
  photo: SitePhoto
  siteCode: string
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  onUpdate: (patch: Partial<SitePhoto>) => void
  onSetPrimary: () => void
  onDownload: () => void
  onDelete: () => void
  positionLabel: string
}) {
  const [draft, setDraft] = useState(photo)
  const [tagInput, setTagInput] = useState("")
  useEffect(() => setDraft(photo), [photo])

  const dirty =
    draft.caption !== photo.caption ||
    draft.description !== photo.description ||
    draft.category !== photo.category ||
    JSON.stringify(draft.tags ?? []) !== JSON.stringify(photo.tags ?? [])

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, "")
    if (!t) return
    if ((draft.tags ?? []).includes(t)) {
      setTagInput("")
      return
    }
    setDraft({ ...draft, tags: [...(draft.tags ?? []), t] })
    setTagInput("")
  }

  const removeTag = (t: string) => {
    setDraft({ ...draft, tags: (draft.tags ?? []).filter((x) => x !== t) })
  }

  const cat = getCategoryMeta(draft.category)

  return (
    <div className="grid gap-0 md:grid-cols-[1fr_360px]">
      {/* Image side */}
      <div className="relative flex min-h-[60vh] items-center justify-center bg-black md:rounded-l-md">
        <img
          src={photo.url}
          alt={photo.caption}
          className="max-h-[80vh] w-full object-contain"
        />
        <Button
          size="icon"
          variant="secondary"
          className="absolute left-3 top-1/2 size-9 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur"
          onClick={onPrev}
        >
          <span className="text-lg">‹</span>
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="absolute right-3 top-1/2 size-9 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur"
          onClick={onNext}
        >
          <span className="text-lg">›</span>
        </Button>
        <div className="absolute left-3 top-3 rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium backdrop-blur">
          {positionLabel}
        </div>
        {photo.primary && (
          <Badge className="absolute right-14 top-3 gap-1 bg-amber-500 text-white hover:bg-amber-500">
            <Star className="size-3 fill-current" /> Primary
          </Badge>
        )}
        <Button
          size="icon"
          variant="secondary"
          className="absolute right-3 top-3 size-8 rounded-full bg-background/80 backdrop-blur"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Metadata side */}
      <div className="flex max-h-[80vh] flex-col overflow-hidden border-l">
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Caption
            </Label>
            <Input
              value={draft.caption}
              onChange={(e) => setDraft({ ...draft, caption: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <Layers className="size-3.5" /> Category
            </Label>
            <Select
              value={draft.category ?? "other"}
              onValueChange={(v) =>
                setDraft({ ...draft, category: v as SitePhotoCategory })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  <span className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${cat.tone.split(" ").find((c) => c.startsWith("bg-")) ?? "bg-muted"}`} />
                    {cat.label}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PHOTO_CATEGORIES.map((c) => (
                  <SelectItem key={c.key} value={c.key}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <Tag className="size-3.5" /> Tags
            </Label>
            <div className="flex flex-wrap gap-1.5 rounded-md border bg-muted/30 p-2">
              {(draft.tags ?? []).length === 0 && (
                <span className="text-xs text-muted-foreground">No tags yet</span>
              )}
              {(draft.tags ?? []).map((t) => (
                <Badge
                  key={t}
                  variant="secondary"
                  className="gap-1 rounded-full"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    className="ml-0.5 text-muted-foreground hover:text-foreground"
                    aria-label={`Remove ${t}`}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add tag and press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addTag()
                  }
                }}
              />
              <Button variant="outline" size="sm" onClick={addTag}>
                Add
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Description / notes
            </Label>
            <Textarea
              rows={3}
              value={draft.description ?? ""}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="Detail visible to dispatch and drivers."
            />
          </div>

          <div className="rounded-lg border bg-muted/20 p-3 text-sm">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Metadata
            </div>
            <dl className="grid grid-cols-[20px_1fr] gap-x-2 gap-y-2">
              <Meta icon={User} label="Uploaded by" value={photo.uploadedBy ?? "—"} />
              <Meta icon={CalendarDays} label="Uploaded" value={photo.uploadedAt} />
              <Meta icon={HardDrive} label="File size" value={formatBytes(photo.sizeBytes)} />
              <Meta
                icon={Ruler}
                label="Dimensions"
                value={
                  photo.width && photo.height
                    ? `${photo.width} × ${photo.height} px`
                    : "—"
                }
              />
              <Meta icon={MapPin} label="Site" value={siteCode} mono />
              <Meta icon={Layers} label="Photo ID" value={photo.id} mono />
            </dl>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/20 p-3">
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={onSetPrimary}
              disabled={photo.primary}
            >
              <Star className="mr-1.5 size-4" />
              {photo.primary ? "Primary" : "Set primary"}
            </Button>
            <Button size="sm" variant="outline" onClick={onDownload}>
              <Download className="mr-1.5 size-4" /> Download
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-rose-600 hover:text-rose-600"
              onClick={onDelete}
            >
              <Trash2 className="mr-1.5 size-4" /> Delete
            </Button>
          </div>
          <Button
            size="sm"
            disabled={!dirty}
            onClick={() => {
              onUpdate({
                caption: draft.caption,
                description: draft.description,
                category: draft.category,
                tags: draft.tags,
              })
              toast.success("Photo updated")
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}

function Meta({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <>
      <dt className="flex items-center justify-center pt-0.5 text-muted-foreground">
        <Icon className="size-3.5" />
      </dt>
      <dd className="flex flex-col text-sm">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className={mono ? "font-mono text-xs" : ""}>{value}</span>
      </dd>
    </>
  )
}

function AmenitiesTab() {
  const amenities = useStore((s) => s.site.amenities)
  const categoriesRaw = useStore((s) => s.amenityCategories)
  const toggle = useStore((s) => s.toggleAmenity)
  const updateNotes = useStore((s) => s.updateAmenityNotes)
  const updateAmenity = useStore((s) => s.updateAmenity)
  const add = useStore((s) => s.addAmenity)
  const remove = useStore((s) => s.removeAmenity)

  const sortedCats = [...categoriesRaw].sort(sortByOrder)
  const fallbackCat = sortedCats[0]?.key ?? "services"
  const [addOpen, setAddOpen] = useState(false)
  const [newAmenity, setNewAmenity] = useState<{
    name: string
    notes: string
    category: AmenityCategory
  }>({ name: "", notes: "", category: fallbackCat })
  const [pendingRemove, setPendingRemove] = useState<string | null>(null)
  const [activeCat, setActiveCat] = useState<AmenityCategory | "all">("all")
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const toggleCollapsed = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const setCategoryEnabled = (key: string, enabled: boolean) => {
    const inCat = amenities.filter((a) => a.category === key)
    inCat.forEach((a) => {
      if (a.available !== enabled) toggle(a.key)
    })
    toast.success(`${enabled ? "Enabled" : "Disabled"} ${inCat.length} amenit${inCat.length === 1 ? "y" : "ies"}`)
  }

  const available = amenities.filter((a) => a.available).length

  const grouped = sortedCats.map((cat) => ({
    cat: resolveCategory(cat),
    items: amenities.filter((a) => a.category === cat.key),
  }))

  const orphaned = amenities.filter(
    (a) => !sortedCats.some((c) => c.key === a.category),
  )

  const visibleGroups =
    activeCat === "all" ? grouped : grouped.filter((g) => g.cat.key === activeCat)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{amenities.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-emerald-600">{available}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {grouped.filter((g) => g.items.length > 0).length} / {sortedCats.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveCat("all")}
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            activeCat === "all"
              ? "border-foreground bg-foreground text-background"
              : "border-border hover:bg-muted"
          }`}
        >
          All · {amenities.length}
        </button>
        {grouped.map(({ cat, items }) => {
          const active = activeCat === cat.key
          const Icon = cat.Icon
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCat(cat.key)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                active ? `${cat.ringClass} border-current ${cat.iconClass}` : "border-border hover:bg-muted"
              }`}
            >
              <Icon className={`size-3.5 ${cat.iconClass}`} />
              {cat.label} · {items.length}
            </button>
          )
        })}
        <ManageAmenityCategoriesSheet />
      </div>

      <Card>
        <CardHeader className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <CardTitle>Site amenities</CardTitle>
            <CardDescription>
              Toggle availability · drivers see this list at booking
            </CardDescription>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1.5 size-4" /> Add amenity
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add custom amenity</DialogTitle>
                <DialogDescription>
                  Pick a category to keep the list organized.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input
                    placeholder="e.g. Mechanic on-site"
                    value={newAmenity.name}
                    onChange={(e) => setNewAmenity({ ...newAmenity, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select
                    value={newAmenity.category}
                    onValueChange={(v) =>
                      setNewAmenity({ ...newAmenity, category: v as AmenityCategory })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedCats.map((c) => {
                        const tone = colorTone(c.color)
                        const Icon = iconByName(c.icon)
                        return (
                          <SelectItem key={c.key} value={c.key}>
                            <span className="flex items-center gap-2">
                              <Icon className={`size-3.5 ${tone.iconClass}`} />
                              {c.label}
                            </span>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Notes (optional)</Label>
                  <Input
                    placeholder="Hours, conditions, contact"
                    value={newAmenity.notes}
                    onChange={(e) => setNewAmenity({ ...newAmenity, notes: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!newAmenity.name.trim()) {
                      toast.error("Name required")
                      return
                    }
                    const catLabel =
                      sortedCats.find((c) => c.key === newAmenity.category)?.label ?? "Other"
                    add({
                      name: newAmenity.name,
                      available: true,
                      category: newAmenity.category,
                      notes: newAmenity.notes || undefined,
                    })
                    toast.success(`Amenity added · ${catLabel}`)
                    setNewAmenity({ name: "", notes: "", category: fallbackCat })
                    setAddOpen(false)
                  }}
                >
                  Add
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-6">
          {visibleGroups.map(({ cat, items }) => {
            if (items.length === 0) return null
            const Icon = cat.Icon
            const availInCat = items.filter((a) => a.available).length
            const allOn = availInCat === items.length
            const isOpen = !collapsed.has(cat.key)
            return (
              <Collapsible
                key={cat.key}
                open={isOpen}
                onOpenChange={() => toggleCollapsed(cat.key)}
                className="space-y-3"
              >
                <div
                  className={`flex items-center gap-3 rounded-lg border p-3 ${cat.ringClass}`}
                >
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex flex-1 items-center gap-3 text-left"
                    >
                      <div
                        className={`flex size-9 items-center justify-center rounded-md bg-background/60 ${cat.iconClass}`}
                      >
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{cat.label}</span>
                          <Badge variant="secondary" className={cat.badgeClass}>
                            {availInCat} / {items.length}
                          </Badge>
                        </div>
                        {cat.description && (
                          <div className="text-xs text-muted-foreground">
                            {cat.description}
                          </div>
                        )}
                      </div>
                      <ChevronDown
                        className={`size-4 text-muted-foreground transition-transform ${
                          isOpen ? "" : "-rotate-90"
                        }`}
                      />
                    </button>
                  </CollapsibleTrigger>
                  <div
                    className="flex items-center gap-2 border-l pl-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-xs text-muted-foreground">
                      {allOn ? "All on" : availInCat === 0 ? "All off" : "Mixed"}
                    </span>
                    <Switch
                      checked={allOn}
                      onCheckedChange={(v) => setCategoryEnabled(cat.key, v)}
                      aria-label={`Toggle all ${cat.label}`}
                    />
                  </div>
                </div>

                <CollapsibleContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {items.map((a) => (
                      <AmenityRow
                        key={a.key}
                        amenity={a}
                        categories={sortedCats}
                        onToggle={() => toggle(a.key)}
                        onNotes={(v) => updateNotes(a.key, v)}
                        onChangeCategory={(v) => updateAmenity(a.key, { category: v })}
                        onRemove={() => setPendingRemove(a.key)}
                      />
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )
          })}

          {activeCat === "all" && orphaned.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-dashed p-3">
                <div className="text-sm font-semibold">Uncategorized</div>
                <Badge variant="outline">{orphaned.length}</Badge>
                <span className="text-xs text-muted-foreground">
                  Category was removed · pick new one
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {orphaned.map((a) => (
                  <AmenityRow
                    key={a.key}
                    amenity={a}
                    categories={sortedCats}
                    onToggle={() => toggle(a.key)}
                    onNotes={(v) => updateNotes(a.key, v)}
                    onChangeCategory={(v) => updateAmenity(a.key, { category: v })}
                    onRemove={() => setPendingRemove(a.key)}
                  />
                ))}
              </div>
            </div>
          )}

          {visibleGroups.every((g) => g.items.length === 0) && orphaned.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No amenities in this category yet.
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!pendingRemove} onOpenChange={(o) => !o && setPendingRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove amenity?</AlertDialogTitle>
            <AlertDialogDescription>
              {amenities.find((a) => a.key === pendingRemove)?.name} will be removed from this site.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingRemove) {
                  remove(pendingRemove)
                  toast.success("Amenity removed")
                  setPendingRemove(null)
                }
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function AmenityRow({
  amenity,
  categories,
  onToggle,
  onNotes,
  onChangeCategory,
  onRemove,
}: {
  amenity: SiteAmenity
  categories: { key: string; label: string; color: string; icon: string }[]
  onToggle: () => void
  onNotes: (v: string) => void
  onChangeCategory: (v: AmenityCategory) => void
  onRemove: () => void
}) {
  const cat = categories.find((c) => c.key === amenity.category)
  const tone = cat ? colorTone(cat.color as Parameters<typeof colorTone>[0]) : colorTone("slate")
  const Icon = iconByName(cat?.icon ?? "Tag")
  return (
    <div
      className={`group flex items-start justify-between gap-3 rounded-lg border p-3 transition-colors ${
        amenity.available ? "bg-card" : "bg-muted/30"
      }`}
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <div className={`flex size-7 items-center justify-center rounded-md bg-muted ${tone.iconClass}`}>
            <Icon className="size-3.5" />
          </div>
          <span className="text-sm font-medium">{amenity.name}</span>
          <span
            className={`ml-auto size-2 shrink-0 rounded-full ${
              amenity.available ? "bg-emerald-500" : "bg-muted-foreground/40"
            }`}
          />
        </div>
        <Input
          className="h-8 text-xs"
          placeholder="Add notes…"
          value={amenity.notes ?? ""}
          onChange={(e) => onNotes(e.target.value)}
        />
        <div className="flex items-center gap-1">
          <Select value={amenity.category} onValueChange={(v) => onChangeCategory(v as AmenityCategory)}>
            <SelectTrigger className="h-7 w-full text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => {
                const t = colorTone(c.color as Parameters<typeof colorTone>[0])
                const CatIcon = iconByName(c.icon)
                return (
                  <SelectItem key={c.key} value={c.key}>
                    <span className="flex items-center gap-2">
                      <CatIcon className={`size-3.5 ${t.iconClass}`} />
                      {c.label}
                    </span>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <Switch checked={amenity.available} onCheckedChange={onToggle} />
        <Button
          variant="ghost"
          size="icon"
          className="size-7 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={onRemove}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function Toggle({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string
  desc: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-0.5">
        <Label className="text-sm">{label}</Label>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
