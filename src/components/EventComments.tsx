import { useMemo, useState, type FormEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AvatarStack } from "./AvatarStack"
import { supabase } from "@/lib/supabase"
import { commentsQuery, usersQuery } from "@/lib/queries"
import { formatCommentTime } from "@/lib/dates"
import { currentUserId } from "@/lib/persona"
import { t } from "@/lib/strings"

type Props = { eventId: string }

export function EventComments({ eventId }: Props) {
  const userId = currentUserId()
  const queryClient = useQueryClient()
  const { data: comments } = useQuery(commentsQuery(eventId))
  const { data: users } = useQuery(usersQuery())
  const [draft, setDraft] = useState("")

  const userMap = useMemo(() => {
    if (!users) return new Map<string, { first_name: string | null; id: string }>()
    return new Map(users.map((u) => [u.id, u]))
  }, [users])

  const submit = useMutation({
    mutationFn: async (body: string) => {
      const { error } = await supabase
        .from("comments")
        .insert({ event_id: eventId, user_id: userId, body })
      if (error) throw error
    },
    onSuccess: () => {
      setDraft("")
      queryClient.invalidateQueries({ queryKey: ["comments", eventId] })
    },
    onError: (e: Error) => toast.error(`${t.toast.commentFailed}: ${e.message}`),
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const body = draft.trim()
    if (!body) {
      toast.error(t.toast.commentEmpty)
      return
    }
    submit.mutate(body)
  }

  return (
    <section className="space-y-4 border-t pt-5">
      <h2 className="text-base font-semibold">
        {t.detail.commentsHeading} · {comments?.length ?? 0}
      </h2>

      {comments && comments.length > 0 ? (
        <ul className="space-y-3">
          {comments.map((c) => {
            const author = userMap.get(c.user_id)
            return (
              <li key={c.id} className="flex gap-2.5">
                <Link to={`/profile/${c.user_id}`} className="shrink-0 pt-0.5">
                  <AvatarStack
                    users={[{ id: c.user_id, first_name: author?.first_name ?? null }]}
                    max={1}
                    size="md"
                  />
                </Link>
                <div className="flex-1 min-w-0 rounded-lg bg-muted px-3 py-2">
                  <div className="flex items-baseline justify-between gap-2 mb-0.5">
                    <Link
                      to={`/profile/${c.user_id}`}
                      className="font-medium text-sm truncate hover:underline"
                    >
                      {author?.first_name ?? "—"}
                    </Link>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatCommentTime(c.created_at)}
                    </span>
                  </div>
                  <p className="whitespace-pre-line text-sm leading-snug">{c.body}</p>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{t.detail.commentsEmpty}</p>
      )}

      <form onSubmit={onSubmit} className="space-y-2">
        <Textarea
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t.detail.commentPlaceholder}
          className="resize-none"
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={submit.isPending || !draft.trim()}
          >
            {submit.isPending ? t.detail.commentSending : t.detail.commentSubmit}
          </Button>
        </div>
      </form>
    </section>
  )
}
