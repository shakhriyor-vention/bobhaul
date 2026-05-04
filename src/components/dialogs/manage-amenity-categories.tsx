import { useMemo, useState } from "react"
import { ArrowDown, ArrowUp, GripVertical, Lock, Pencil, Plus, Search, Settings2, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
import { iconByName, searchIcons } from "@/lib/amenity-icons"
import { AMENITY_COLORS, colorTone, type AmenityColor } from "@/lib/amenity-colors"
import { useStore, type AmenityCategoryDef, type AmenityColorName } from "@/store"

type Draft = {
  label: string
  description: string
  icon: string
  color: AmenityColorName
}

const blankDraft = (): Draft => ({
  label: "",
  description: "",
  icon: "Tag",
  color: "slate",
})

export function ManageAmenityCategoriesSheet({
  trigger,
}: {
  trigger?: React.ReactNode
}) {
  const categories = useStore((s) => s.amenityCategories)
  const amenities = useStore((s) => s.site.amenities)
  const addCat = useStore((s) => s.addAmenityCategory)
  const updateCat = useStore((s) => s.updateAmenityCategory)
  const removeCat = useStore((s) => s.removeAmenityCategory)
  const reorder = useStore((s) => s.reorderAmenityCategories)

  const [open, setOpen] = useState(false)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft>(blankDraft())
  const [pendingDelete, setPendingDelete] = useState<AmenityCategoryDef | null>(null)
  const [adding, setAdding] = useState(false)

  const sorted = useMemo(
    () => [...categories].sort((a, b) => a.order - b.order),
    [categories],
  )
  const orderedKeys = sorted.map((c) => c.key)
  const counts = useMemo(() => {
    const m = new Map<string, number>()
    for (const a of amenities) m.set(a.category, (m.get(a.category) ?? 0) + 1)
    return m
  }, [amenities])

  const startEdit = (cat: AmenityCategoryDef) => {
    setAdding(false)
    setEditingKey(cat.key)
    setDraft({
      label: cat.label,
      description: cat.description,
      icon: cat.icon,
      color: cat.color,
    })
  }
  const startAdd = () => {
    setEditingKey(null)
    setAdding(true)
    setDraft(blankDraft())
  }
  const cancelEdit = () => {
    setEditingKey(null)
    setAdding(false)
    setDraft(blankDraft())
  }

  const submit = () => {
    if (!draft.label.trim()) {
      toast.error("Label required")
      return
    }
    if (adding) {
      addCat({
        label: draft.label.trim(),
        description: draft.description.trim(),
        icon: draft.icon,
        color: draft.color,
      })
      toast.success(`Category added · ${draft.label}`)
    } else if (editingKey) {
      updateCat(editingKey, {
        label: draft.label.trim(),
        description: draft.description.trim(),
        icon: draft.icon,
        color: draft.color,
      })
      toast.success("Category updated")
    }
    cancelEdit()
  }

  const move = (key: string, dir: -1 | 1) => {
    const i = orderedKeys.indexOf(key)
    const j = i + dir
    if (j < 0 || j >= orderedKeys.length) return
    const next = [...orderedKeys]
    ;[next[i], next[j]] = [next[j], next[i]]
    reorder(next)
  }

  const onDragStart = (key: string) => (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", key)
    e.dataTransfer.effectAllowed = "move"
  }
  const onDrop = (targetKey: string) => (e: React.DragEvent) => {
    e.preventDefault()
    const sourceKey = e.dataTransfer.getData("text/plain")
    if (!sourceKey || sourceKey === targetKey) return
    const next = [...orderedKeys]
    const from = next.indexOf(sourceKey)
    const to = next.indexOf(targetKey)
    if (from < 0 || to < 0) return
    next.splice(from, 1)
    next.splice(to, 0, sourceKey)
    reorder(next)
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) cancelEdit() }}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline">
            <Settings2 className="mr-1.5 size-4" /> Manage categories
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings2 className="size-4" /> Amenity categories
          </SheetTitle>
          <SheetDescription>
            Add, edit, reorder, recolor. Built-in categories cannot be removed.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 py-4">
          {!adding && !editingKey && (
            <Button size="sm" className="w-full" onClick={startAdd}>
              <Plus className="mr-1.5 size-4" /> New category
            </Button>
          )}

          {(adding || editingKey) && (
            <CategoryForm
              draft={draft}
              setDraft={setDraft}
              isEdit={!!editingKey}
              onCancel={cancelEdit}
              onSubmit={submit}
            />
          )}

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Display order · {sorted.length} categories
            </Label>
            <div className="space-y-2">
              {sorted.map((cat, idx) => {
                const tone = colorTone(cat.color)
                const Icon = iconByName(cat.icon)
                const count = counts.get(cat.key) ?? 0
                return (
                  <div
                    key={cat.key}
                    draggable
                    onDragStart={onDragStart(cat.key)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDrop(cat.key)}
                    className={`flex items-center gap-2 rounded-lg border p-2.5 ${tone.ringClass}`}
                  >
                    <button
                      type="button"
                      className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
                      title="Drag to reorder"
                    >
                      <GripVertical className="size-4" />
                    </button>
                    <div
                      className={`flex size-9 items-center justify-center rounded-md bg-background/60 ${tone.iconClass}`}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{cat.label}</span>
                        {cat.builtin && (
                          <Badge variant="outline" className="gap-1 text-[10px]">
                            <Lock className="size-2.5" /> built-in
                          </Badge>
                        )}
                        <Badge variant="secondary" className={`text-[10px] ${tone.badgeClass}`}>
                          {count}
                        </Badge>
                      </div>
                      {cat.description && (
                        <div className="truncate text-xs text-muted-foreground">{cat.description}</div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        disabled={idx === 0}
                        onClick={() => move(cat.key, -1)}
                        title="Move up"
                      >
                        <ArrowUp className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        disabled={idx === sorted.length - 1}
                        onClick={() => move(cat.key, 1)}
                        title="Move down"
                      >
                        <ArrowDown className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => startEdit(cat)}
                        title="Edit"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        disabled={cat.builtin}
                        onClick={() => setPendingDelete(cat)}
                        title={cat.builtin ? "Built-in cannot be removed" : "Remove"}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove category “{pendingDelete?.label}”?</AlertDialogTitle>
              <AlertDialogDescription>
                {(counts.get(pendingDelete?.key ?? "") ?? 0) > 0
                  ? `${counts.get(pendingDelete?.key ?? "")} amenities will be reassigned to the first remaining category.`
                  : "This category has no amenities."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (pendingDelete) {
                    removeCat(pendingDelete.key)
                    toast.success("Category removed")
                    setPendingDelete(null)
                  }
                }}
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  )
}

function CategoryForm({
  draft,
  setDraft,
  isEdit,
  onCancel,
  onSubmit,
}: {
  draft: Draft
  setDraft: (d: Draft) => void
  isEdit: boolean
  onCancel: () => void
  onSubmit: () => void
}) {
  const tone = colorTone(draft.color as AmenityColor)
  const Icon = iconByName(draft.icon)
  const [iconQuery, setIconQuery] = useState("")
  const filteredIcons = useMemo(() => searchIcons(iconQuery), [iconQuery])
  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`flex size-9 items-center justify-center rounded-md bg-background/80 ${tone.iconClass}`}
          >
            <Icon className="size-4" />
          </div>
          <span className="text-sm font-semibold">
            {isEdit ? "Edit category" : "New category"}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="size-7" onClick={onCancel}>
          <X className="size-3.5" />
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Label</Label>
        <Input
          placeholder="e.g. Wellness"
          value={draft.label}
          onChange={(e) => setDraft({ ...draft, label: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Description (optional)</Label>
        <Input
          placeholder="e.g. Gym, nap pods, medical"
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Color</Label>
        <div className="flex flex-wrap gap-1.5">
          {AMENITY_COLORS.map((c) => {
            const active = draft.color === c
            const t = colorTone(c)
            return (
              <button
                key={c}
                type="button"
                onClick={() => setDraft({ ...draft, color: c })}
                className={`size-7 rounded-full border-2 transition-transform ${t.swatch} ${
                  active ? "border-foreground scale-110" : "border-background"
                }`}
                title={c}
              />
            )
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Icon</Label>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {filteredIcons.length} match{filteredIcons.length === 1 ? "" : "es"}
          </span>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-8 pl-8 text-xs"
            placeholder="Search icons (e.g. truck, fuel, secure, food)…"
            value={iconQuery}
            onChange={(e) => setIconQuery(e.target.value)}
          />
          {iconQuery && (
            <button
              type="button"
              onClick={() => setIconQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              title="Clear"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        {filteredIcons.length === 0 ? (
          <div className="rounded-md border border-dashed bg-background px-3 py-6 text-center text-xs text-muted-foreground">
            No icons match "{iconQuery}". Try a different keyword.
          </div>
        ) : (
          <div className="grid max-h-48 grid-cols-7 gap-1 overflow-y-auto rounded-md border bg-background p-2 sm:grid-cols-9">
            {filteredIcons.map(({ name, icon: I }) => {
              const active = draft.icon === name
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setDraft({ ...draft, icon: name })}
                  className={`flex size-8 items-center justify-center rounded-md transition-colors ${
                    active
                      ? `${tone.iconClass} ${tone.ringClass} border`
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  title={name}
                >
                  <I className="size-3.5" />
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={onSubmit}>
          {isEdit ? "Save changes" : "Add category"}
        </Button>
      </div>
    </div>
  )
}
