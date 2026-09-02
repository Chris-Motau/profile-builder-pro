import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Save, Trash2, X, Pencil, FileText } from "lucide-react";
import { useCollectionData, removeFile, type UploadedFile, type WithId } from "@/lib/admin-data";
import { EmptyState, Field, SectionShell, UploadButton } from "./ui-bits";

type Experience = {
  company: string;
  position: string;
  description: string;
  startDate: string;
  endDate: string;
  certifications: UploadedFile[];
  createdAt?: number;
};

const empty: Experience = {
  company: "",
  position: "",
  description: "",
  startDate: "",
  endDate: "",
  certifications: [],
};

export function ExperienceSection() {
  const { items, loading, add, update, remove } = useCollectionData<Experience>("experience");
  const [form, setForm] = useState<Experience | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  function startEdit(item: WithId<Experience>) {
    const { id: _id, ...rest } = item;
    setEditingId(item.id);
    setForm({ ...empty, ...rest });
  }

  async function handleSave() {
    if (!form?.company.trim() || !form.position.trim()) {
      toast.error("Company and position are required");
      return;
    }
    if (editingId) {
      await update(editingId, form);
      toast.success("Experience updated");
    } else {
      await add(form);
      toast.success("Experience saved");
    }
    setForm(null);
    setEditingId(null);
  }

  return (
    <SectionShell
      title="Experience"
      description="Roles, responsibilities and certifications earned."
      actions={
        !form && (
          <Button size="sm" onClick={() => { setEditingId(null); setForm({ ...empty, certifications: [] }); }}>
            <Plus className="size-4" /> Add experience
          </Button>
        )
      }
    >
      {form && (
        <div className="mb-6 space-y-4 rounded-xl border border-border bg-muted/40 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company name">
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </Field>
            <Field label="Position title">
              <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
            </Field>
            <Field label="Start date">
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </Field>
            <Field label="End date">
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </Field>
          </div>
          <Field label="Description">
            <Textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="Certifications">
            <div className="flex flex-wrap items-center gap-3">
              <UploadButton
                folder="experience-certifications"
                label="Upload certification"
                multiple
                onUploaded={(files) => setForm({ ...form, certifications: [...form.certifications, ...files] })}
              />
              {form.certifications.map((c) => (
                <span key={c.path} className="flex items-center gap-2 rounded-md border border-border px-2 py-1 text-xs">
                  <FileText className="size-3" />
                  <a href={c.url} target="_blank" rel="noreferrer" className="hover:underline">{c.name}</a>
                  <button
                    type="button"
                    onClick={async () => {
                      await removeFile(c.path);
                      setForm({ ...form, certifications: form.certifications.filter((f) => f.path !== c.path) });
                    }}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          </Field>
          <div className="flex gap-2">
            <Button onClick={handleSave}>
              <Save className="size-4" /> {editingId ? "Update experience" : "Save experience"}
            </Button>
            <Button variant="ghost" onClick={() => { setForm(null); setEditingId(null); }}>Cancel</Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <EmptyState text="No experience added yet." />
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <article key={item.id} className="rounded-xl border border-border p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{item.position}</h3>
                  <p className="text-sm text-muted-foreground">{item.company}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.startDate} – {item.endDate || "Present"}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(item)}>
                    <Pencil className="size-4" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(item.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              {item.description && <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{item.description}</p>}
              {item.certifications?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                  {item.certifications.map((c) => (
                    <a key={c.path} href={c.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                      <FileText className="size-3" /> {c.name}
                    </a>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </SectionShell>
  );
}
