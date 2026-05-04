import { useEffect, useMemo, useRef, useState } from "react"
import { FileText, ImageIcon, Megaphone, Paperclip, Search, SendHorizonal } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/page-header"
import { useStore, type MessageAttachment } from "@/store"

function attachmentKind(file: File): MessageAttachment["kind"] {
  if (file.type.startsWith("image/")) return "image"
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) return "pdf"
  if (file.type.includes("word") || /\.(docx?|odt|rtf)$/i.test(file.name)) return "doc"
  return "other"
}

export default function Messenger() {
  const threads = useStore((s) => s.threads)
  const messagesByThread = useStore((s) => s.messagesByThread)
  const send = useStore((s) => s.sendMessage)
  const markRead = useStore((s) => s.markThreadRead)
  const sendAttachment = useStore((s) => s.sendAttachment)
  const broadcast = useStore((s) => s.broadcast)
  const [activeId, setActiveId] = useState(threads[0]?.id ?? "")
  const [draft, setDraft] = useState("")
  const [query, setQuery] = useState("")
  const scrollEnd = useRef<HTMLDivElement | null>(null)
  const fileInput = useRef<HTMLInputElement | null>(null)
  const [bcOpen, setBcOpen] = useState(false)
  const [bcText, setBcText] = useState("")
  const [bcAudience, setBcAudience] = useState<"drivers" | "internal" | "all">("drivers")
  const audienceCounts = useMemo(() => {
    const drivers = threads.filter((t) => t.role.includes("Driver")).length
    const internal = threads.filter((t) => t.role.includes("Internal")).length
    return { drivers, internal, all: drivers + internal }
  }, [threads])

  const active = threads.find((t) => t.id === activeId)
  const messages = messagesByThread[activeId] ?? []

  useEffect(() => {
    if (activeId) markRead(activeId)
  }, [activeId, markRead])

  useEffect(() => {
    scrollEnd.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  const filtered = threads.filter((t) =>
    !query
      ? true
      : t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.role.toLowerCase().includes(query.toLowerCase()),
  )

  const handleSend = () => {
    if (!draft.trim() || !activeId) return
    send(activeId, draft)
    setDraft("")
  }

  const handleAttach = (files: FileList | null) => {
    if (!files || !files.length || !activeId) return
    Array.from(files).forEach((f) => {
      const att: MessageAttachment = {
        name: f.name,
        url: URL.createObjectURL(f),
        size: f.size,
        kind: attachmentKind(f),
      }
      sendAttachment(activeId, att, draft)
    })
    setDraft("")
    if (fileInput.current) fileInput.current.value = ""
    toast.success(`Sent ${files.length} attachment${files.length === 1 ? "" : "s"}`)
  }

  const handleBroadcast = () => {
    if (!bcText.trim()) {
      toast.error("Type a message")
      return
    }
    const n = broadcast({ audience: bcAudience, text: bcText })
    setBcOpen(false)
    setBcText("")
    toast.success(`Broadcast sent to ${n} thread${n === 1 ? "" : "s"}`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messenger"
        description="Driver chat and internal threads, unified."
        actions={
          <Dialog open={bcOpen} onOpenChange={setBcOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Megaphone className="mr-1.5 size-4" /> Broadcast
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Broadcast message</DialogTitle>
                <DialogDescription>
                  Send to multiple recipients at once.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Audience</Label>
                  <Select value={bcAudience} onValueChange={(v) => setBcAudience(v as "drivers" | "internal" | "all")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="drivers">Drivers · {audienceCounts.drivers}</SelectItem>
                      <SelectItem value="internal">Internal teams · {audienceCounts.internal}</SelectItem>
                      <SelectItem value="all">Everyone · {audienceCounts.all}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Message</Label>
                  <Textarea
                    rows={4}
                    placeholder="Yard closed at 18:00 today for inspection…"
                    value={bcText}
                    onChange={(e) => setBcText(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBcOpen(false)}>Cancel</Button>
                <Button onClick={handleBroadcast}>
                  <Megaphone className="mr-1.5 size-4" /> Send broadcast
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="grid h-[calc(100svh-220px)] grid-cols-1 overflow-hidden p-0 md:grid-cols-[300px_1fr]">
        <aside className="flex max-h-[40svh] flex-col border-b md:max-h-none md:border-b-0 md:border-r">
          <div className="border-b p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search threads…"
                className="h-9 pl-8"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <ul className="p-2">
              {filtered.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => setActiveId(t.id)}
                    className={`flex w-full items-start gap-3 rounded-md p-2.5 text-left transition-colors ${
                      activeId === t.id ? "bg-muted" : "hover:bg-muted/60"
                    }`}
                  >
                    <div className="relative">
                      <Avatar className="size-9">
                        <AvatarFallback className="bg-primary/10 text-xs text-primary">
                          {t.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      {t.online && (
                        <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background bg-emerald-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{t.name}</span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">{t.time}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">{t.role}</div>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-muted-foreground">{t.preview}</span>
                        {t.unread > 0 && (
                          <Badge className="h-5 min-w-5 rounded-full px-1.5 text-[10px]">
                            {t.unread}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </aside>

        {active ? (
          <section className="flex flex-col">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-3">
                <Avatar className="size-9">
                  <AvatarFallback className="bg-primary/10 text-xs text-primary">
                    {active.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-medium">{active.name}</div>
                  <div className="text-xs text-muted-foreground">{active.role}</div>
                </div>
              </div>
              {active.online && <Badge variant="secondary">Online</Badge>}
            </div>

            <ScrollArea className="flex-1 px-6 py-4">
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    No messages yet.
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${m.me ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-3.5 py-2 text-sm ${
                          m.me ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        <div className="whitespace-pre-wrap break-words">{m.text}</div>
                        {m.attachments && m.attachments.length > 0 && (
                          <div className="mt-2 space-y-1.5">
                            {m.attachments.map((a, i) => (
                              <a
                                key={i}
                                href={a.url}
                                target="_blank"
                                rel="noreferrer"
                                className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs transition-colors ${
                                  m.me
                                    ? "border-primary-foreground/30 hover:bg-primary-foreground/10"
                                    : "border-border bg-background/50 hover:bg-background"
                                }`}
                              >
                                {a.kind === "image" ? (
                                  <ImageIcon className="size-3.5 shrink-0" />
                                ) : (
                                  <FileText className="size-3.5 shrink-0" />
                                )}
                                <span className="truncate">{a.name}</span>
                                <span className="shrink-0 opacity-60">
                                  {(a.size / 1024).toFixed(0)} KB
                                </span>
                              </a>
                            ))}
                          </div>
                        )}
                        <div
                          className={`mt-1 text-[10px] ${
                            m.me ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}
                        >
                          {m.time}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={scrollEnd} />
              </div>
            </ScrollArea>

            <div className="flex items-center gap-2 border-t p-3">
              <input
                ref={fileInput}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleAttach(e.target.files)}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInput.current?.click()}
                title="Attach file"
              >
                <Paperclip className="size-4" />
              </Button>
              <Input
                placeholder="Message…"
                className="h-9"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleSend()
                  }
                }}
              />
              <Button size="icon" onClick={handleSend} disabled={!draft.trim()}>
                <SendHorizonal className="size-4" />
              </Button>
            </div>
          </section>
        ) : (
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            Pick a thread.
          </div>
        )}
      </Card>
    </div>
  )
}
