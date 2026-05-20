import { useMutation, useQuery } from "@tanstack/react-query"
import { Navigate, useNavigate } from "react-router"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { currentUserId } from "@/lib/persona"
import { meQuery } from "@/lib/queries"
import { announceEvent } from "@/lib/announce"
import { t } from "@/lib/strings"

const schema = z
  .object({
    title: z.string().min(3, t.admin.errors.titleTooShort).max(80),
    description: z.string().max(2000).optional(),
    location: z.string().max(200).optional(),
    starts_at: z.string().min(1),
    ends_at: z.string().min(1),
    capacity: z.coerce.number().int().min(1).max(500),
    type: z.enum(["offline", "online", "trip"]),
  })
  .refine((d) => new Date(d.ends_at) > new Date(d.starts_at), {
    message: t.admin.errors.endBeforeStart,
    path: ["ends_at"],
  })

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

export function AdminNew() {
  const userId = currentUserId()
  const { data: me, isLoading } = useQuery(meQuery(userId))
  const navigate = useNavigate()

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      starts_at: "",
      ends_at: "",
      capacity: 10,
      type: "offline",
    },
  })

  const create = useMutation({
    mutationFn: async (values: FormValues) => {
      const { data, error } = await supabase
        .from("events")
        .insert({
          creator_id: userId,
          title: values.title,
          description: values.description || null,
          location: values.location || null,
          starts_at: new Date(values.starts_at).toISOString(),
          ends_at: new Date(values.ends_at).toISOString(),
          capacity: values.capacity,
          type: values.type,
        })
        .select("id")
        .single()
      if (error) throw error
      return data
    },
    onSuccess: async (row) => {
      toast.success(t.toast.eventCreated)
      const announce = await announceEvent(row.id, userId)
      if (!announce.ok) {
        toast.error(`${t.toast.announceFailed}: ${announce.error}`)
      } else {
        toast.success(t.toast.announceSent)
      }
      navigate(`/event/${row.id}`)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (isLoading) return <p className="text-muted-foreground">{t.common.loading}</p>
  if (!me?.is_admin) return <Navigate to="/" replace />

  return (
    <form onSubmit={form.handleSubmit((v) => create.mutate(v))} className="space-y-4 max-w-lg">
      <h2 className="text-xl font-semibold">{t.admin.title}</h2>

      <Field label={t.admin.fields.title} error={form.formState.errors.title?.message}>
        <Input placeholder={t.admin.placeholders.title} {...form.register("title")} />
      </Field>

      <Field label={t.admin.fields.description} error={form.formState.errors.description?.message}>
        <Textarea
          rows={4}
          placeholder={t.admin.placeholders.description}
          {...form.register("description")}
        />
      </Field>

      <Field label={t.admin.fields.location} error={form.formState.errors.location?.message}>
        <Input placeholder={t.admin.placeholders.location} {...form.register("location")} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t.admin.fields.startsAt} error={form.formState.errors.starts_at?.message}>
          <Input type="datetime-local" {...form.register("starts_at")} />
        </Field>
        <Field label={t.admin.fields.endsAt} error={form.formState.errors.ends_at?.message}>
          <Input type="datetime-local" {...form.register("ends_at")} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t.admin.fields.capacity} error={form.formState.errors.capacity?.message}>
          <Input type="number" min={1} max={500} {...form.register("capacity")} />
        </Field>
        <Field label={t.admin.fields.type} error={form.formState.errors.type?.message}>
          <Select
            defaultValue="offline"
            onValueChange={(v) => form.setValue("type", v as FormValues["type"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="offline">{t.admin.types.offline}</SelectItem>
              <SelectItem value="online">{t.admin.types.online}</SelectItem>
              <SelectItem value="trip">{t.admin.types.trip}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Button type="submit" disabled={create.isPending}>
        {create.isPending ? t.admin.submitting : t.admin.submit}
      </Button>
    </form>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  )
}
