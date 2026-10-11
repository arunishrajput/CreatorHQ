import { useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { isDayKey } from '@/core/dates'
import { STAGE_LABEL } from '@/core/labels'
import { PLANNED_STAGES, type PlannedStage, type PlannedVideoInput } from '@/core/types'
import { usePlanned } from '@/state/planned'
import { useUi, type Editor } from '@/state/ui'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { Field, Input, Select, Textarea } from '../ui/Field'
import { Kbd } from '../ui/Kbd'

/** Create / edit / delete a planned video. Driven entirely by `useUi().editor`. */
export function PlannedVideoDialog() {
  const editor = useUi((s) => s.editor)
  const close = () => useUi.getState().openEditor(null)
  const existing = usePlanned((s) => (editor?.mode === 'edit' ? s.items.find((v) => v.id === editor.id) : undefined))

  // An edit target that vanished (deleted in the side panel, say) just closes.
  const open = editor !== null && (editor.mode === 'create' || existing !== undefined)

  return (
    <Dialog open={open} onClose={close} title={editor?.mode === 'edit' ? 'Edit planned video' : 'Plan a video'}>
      {open && (
        <PlannedVideoForm
          key={editorKey(editor)}
          initial={
            existing ?? { title: '', date: editor.mode === 'create' ? editor.date : '', stage: 'idea', notes: '' }
          }
          editingId={existing?.id}
          onDone={close}
        />
      )}
    </Dialog>
  )
}

const MOD_KEY = /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘' : 'Ctrl'

function editorKey(editor: Editor) {
  return editor?.mode === 'edit' ? `edit:${editor.id}` : `create:${editor?.date}`
}

function PlannedVideoForm({
  initial,
  editingId,
  onDone,
}: {
  initial: PlannedVideoInput
  editingId: string | undefined
  onDone(): void
}) {
  const [form, setForm] = useState<PlannedVideoInput>({
    title: initial.title,
    date: initial.date,
    stage: initial.stage,
    notes: initial.notes,
  })
  const { create, update, remove } = usePlanned.getState()
  const valid = form.title.trim().length > 0 && isDayKey(form.date)

  async function submit(event?: FormEvent) {
    event?.preventDefault()
    if (!valid) return
    if (editingId) await update(editingId, form)
    else await create(form)
    onDone()
  }

  async function onDelete() {
    if (!editingId) return
    await remove(editingId)
    onDone()
  }

  const set = <K extends keyof PlannedVideoInput>(key: K, value: PlannedVideoInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  return (
    <form
      onSubmit={submit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void submit(e)
      }}
      className="flex flex-col gap-4"
    >
      <Field label="Title" htmlFor="pv-title">
        <Input
          id="pv-title"
          autoFocus
          placeholder="What's the video?"
          value={form.title}
          maxLength={200}
          onChange={(e) => set('title', e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Publish date" htmlFor="pv-date">
          <Input id="pv-date" type="date" required value={form.date} onChange={(e) => set('date', e.target.value)} />
        </Field>
        <Field label="Stage" htmlFor="pv-stage">
          <Select id="pv-stage" value={form.stage} onChange={(e) => set('stage', e.target.value as PlannedStage)}>
            {PLANNED_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {STAGE_LABEL[stage]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Notes" htmlFor="pv-notes">
        <Textarea
          id="pv-notes"
          placeholder="Hook, outline, links, sponsor…"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
        />
      </Field>

      <div className="-mx-4 -mb-4 flex items-center gap-2 border-t border-line px-4 py-3">
        {editingId && (
          <Button variant="danger" size="sm" onClick={onDelete}>
            <Trash2 size={13} /> Delete
          </Button>
        )}
        <span className="ml-auto hidden items-center gap-1 text-[11px] text-fg-subtle sm:inline-flex">
          <Kbd>{MOD_KEY}</Kbd>
          <Kbd>↵</Kbd> to save
        </span>
        <Button size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button size="sm" variant="primary" type="submit" disabled={!valid}>
          {editingId ? 'Save' : 'Add to calendar'}
        </Button>
      </div>
    </form>
  )
}
