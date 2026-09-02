import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Save, Trash2, Pencil } from "lucide-react";
import { useCollectionData } from "@/lib/admin-data";
import { EmptyState, Field, SectionShell } from "./ui-bits";

type ProSkill = { header: string; summary: string; createdAt?: number };

export function ProfessionalSkillsSection() {
  const { items, loading, add, update, remove } = useCollectionData<ProSkill>("professionalSkills");
  const [form, setForm] = useState<ProSkill | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleSave() {
    if (!form?.header.trim()) {
      toast.error("Header is required");
      return;
    }
    if (editingId) {
      await update(editingId, form);
      toast.success("Professional skill updated");
    } else {
      await add(form);
      toast.success("Professional skill saved");
    }
    setForm(null);
    setEditingId(null);
  }

  return (
    <SectionShell
      title="Professional skills"
      description="Soft skills and strengths with a short summary each."
      actions={
        !form && (
          <Button size="sm" onClick={() => { setEditingId(null); setForm({ header: "", summary: "" }); }}>
            <Plus className="size-4" /> Add skill
          </Button>
        )
      }
    >
      {form && (
        <div className="mb-6 space-y-4 rounded-xl border border-border bg-muted/40 p-5">
          <Field label="Header">
            <Input value={form.header} onChange={(e) => setForm({ ...form, header: e.target.value })} />
          </Field>
          <Field label="Summary">
            <Textarea rows={4} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
          </Field>
          <div className="flex gap-2">
            <Button onClick={handleSave}>
              <Save className="size-4" /> {editingId ? "Update" : "Save"}
            </Button>
            <Button variant="ghost" onClick={() => { setForm(null); setEditingId(null); }}>Cancel</Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <EmptyState text="No professional skills yet." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <article key={item.id} className="rounded-xl border border-border p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{item.header}</h3>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => { setEditingId(item.id); setForm({ header: item.header, summary: item.summary }); }}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(item.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{item.summary}</p>
            </article>
          ))}
        </div>
      )}
    </SectionShell>
  );
}
