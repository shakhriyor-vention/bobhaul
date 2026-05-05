import * as React from "react"
import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export type Direction = "inbound" | "outbound" | "cross-dock"

type DirectionMeta = {
  Icon: typeof ArrowDownToLine
  label: string
  compactLabel: string
  ariaLabel: string
  iconColor: string
}

const DIRECTION_META: Record<Direction, DirectionMeta> = {
  inbound: {
    Icon: ArrowDownToLine,
    label: "Inbound",
    compactLabel: "Inb",
    ariaLabel: "Inbound appointment",
    iconColor: "text-teal-600 dark:text-teal-400",
  },
  outbound: {
    Icon: ArrowUpFromLine,
    label: "Outbound",
    compactLabel: "Out",
    ariaLabel: "Outbound appointment",
    iconColor: "text-indigo-600 dark:text-indigo-400",
  },
  "cross-dock": {
    Icon: ArrowLeftRight,
    label: "Cross-Dock",
    compactLabel: "X-Dk",
    ariaLabel: "Cross-Dock appointment",
    iconColor: "text-fuchsia-600 dark:text-fuchsia-400",
  },
}

export const DIRECTION_LABEL: Record<Direction, string> = {
  inbound: DIRECTION_META.inbound.label,
  outbound: DIRECTION_META.outbound.label,
  "cross-dock": DIRECTION_META["cross-dock"].label,
}

type Size = "sm" | "md" | "lg"
type Variant = "full" | "compact" | "icon-only"
type Emphasis = "default" | "subtle"

const SIZE_CLASSES: Record<
  Size,
  { wrapper: string; iconOnly: string; icon: string; text: string }
> = {
  sm: {
    wrapper: "h-5 gap-1 px-1.5 text-[10px]",
    iconOnly: "h-5 w-5",
    icon: "size-3",
    text: "leading-none",
  },
  md: {
    wrapper: "h-6 gap-1.5 px-2 text-xs",
    iconOnly: "h-6 w-6",
    icon: "size-3.5",
    text: "leading-none",
  },
  lg: {
    wrapper: "h-7 gap-2 px-2.5 text-sm",
    iconOnly: "h-7 w-7",
    icon: "size-4",
    text: "leading-none",
  },
}

const EMPHASIS_BASE: Record<Emphasis, string> = {
  default: "border border-border/60 bg-transparent text-foreground",
  subtle: "border border-transparent bg-transparent text-foreground",
}

const COLLAPSE_FULL_MIN = 96
const COLLAPSE_COMPACT_MIN = 64

function variantForWidth(width: number | undefined): Variant {
  if (width == null) return "full"
  if (width >= COLLAPSE_FULL_MIN) return "full"
  if (width >= COLLAPSE_COMPACT_MIN) return "compact"
  return "icon-only"
}

export interface DirectionBadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  direction: Direction
  size?: Size
  variant?: Variant
  emphasis?: Emphasis
  responsive?: boolean
  containerWidth?: number
}

export function DirectionBadge({
  direction,
  size = "md",
  variant: variantProp,
  emphasis = "default",
  responsive = false,
  containerWidth,
  className,
  ...rest
}: DirectionBadgeProps) {
  const meta = DIRECTION_META[direction]
  const wrapperRef = React.useRef<HTMLSpanElement>(null)
  const [observedWidth, setObservedWidth] = React.useState<number | undefined>(
    containerWidth,
  )

  React.useEffect(() => {
    if (!responsive) return
    if (containerWidth != null) {
      setObservedWidth(containerWidth)
      return
    }
    const node = wrapperRef.current?.parentElement
    if (!node) return
    const update = () => setObservedWidth(node.getBoundingClientRect().width)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(node)
    return () => ro.disconnect()
  }, [responsive, containerWidth])

  const resolvedVariant: Variant = variantProp
    ? variantProp
    : responsive
      ? variantForWidth(observedWidth)
      : "full"

  const sizes = SIZE_CLASSES[size]
  const Icon = meta.Icon

  const isIconOnly = resolvedVariant === "icon-only"
  const isCompact = resolvedVariant === "compact"
  const labelText = isCompact ? meta.compactLabel : meta.label

  const badgeBase =
    "inline-flex shrink-0 items-center justify-center rounded-md font-medium tracking-tight whitespace-nowrap select-none"

  const content = (
    <span
      ref={wrapperRef}
      data-slot="direction-badge"
      data-direction={direction}
      data-variant={resolvedVariant}
      role={isIconOnly ? "img" : undefined}
      aria-label={isIconOnly ? meta.ariaLabel : undefined}
      className={cn(
        badgeBase,
        EMPHASIS_BASE[emphasis],
        isIconOnly ? sizes.iconOnly : sizes.wrapper,
        className,
      )}
      {...rest}
    >
      <Icon
        className={cn(sizes.icon, "shrink-0", meta.iconColor)}
        aria-hidden={isIconOnly ? undefined : true}
        focusable="false"
      />
      {!isIconOnly && (
        <span className={cn(sizes.text, "min-w-0 truncate")}>{labelText}</span>
      )}
    </span>
  )

  if (resolvedVariant === "full") return content

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="top">{meta.label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

DirectionBadge.displayName = "DirectionBadge"
