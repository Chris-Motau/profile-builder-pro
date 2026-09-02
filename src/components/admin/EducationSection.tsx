import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Save, Trash2, X, FileText, Pencil } from "lucide-react";
import { useCollectionData, removeFile, type UploadedFile, type WithId } from "@/lib/admin-data";
import { EmptyState, Field, SectionShell, UploadButton } from "./ui-bits";

type Education = {
  school: string;
  qualification: string;
  startDate: string;
  endDate: string;
  years: string;
  modules: string[];
  certificates: UploadedFile[];
  createdAt?: number;
};

const empty: Education = {
  school: "",
  qualification: "",
  startDate: "",
  endDate: "",
  years: "",
  modules: [],
  certificates: [],
};

export function EducationSection() {
  const { items, loading, add, update, remove } = useCollectionData<Education>("education");
  const [form, setForm] = useState<Education | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [moduleInput, setModuleInput] = useState("");

  function startNew() {
    setEditingId(null);
    setForm({ ...empty, modules: [], certificates: [] });
  }

  function startEdit(item: WithId<Education>) {
    setEditingId(item.id);
    const { id: _id, ...rest } = item;
    setForm({ ...empty, ...rest });
  }

  function addModule() {
    const value = moduleInput.trim();
    if (!form || !value) return;
    setForm({ ...form, modules: [...form.modules, value] });
    setModuleInput("");
  }

  async function handleSave() {
    if (!form) return;
    if (!form.school.trim() || !form.qualification.trim()) {
      toast.error("School and qualification are required");
      return;
    }
    if (editingId) {
      await update(editingId, form);
      toast.success("Education updated");
    } else {
      await add(form);
      toast.success("Education saved");
    }
    setForm(null);
    setEditingId(null);
  }

  return (
    <SectionShell
      title="Education background"
      description="Qualifications, modules completed and certificates."
      actions={
        !form && (
          <Button size="sm" onClick={startNew}>
            <Plus className="size-4" /> Add education
          </Button>
        )
      }
    >
      {form && (
        <div className="mb-6 space-y-4 rounded-xl border border-border bg-muted/40 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="School name">
              <Input value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} />
            </Field>
            <Field label="Qualification name">
              <Input
                value={form.qualification}
                onChange={(e) => setForm({ ...form, qualification: e.target.value })}
              />
            </Field>
            <Field label="Start date">
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </Field>
            <Field label="End date">
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </Field>
            <Field label="Years to complete">
              <Input
                type="number"
                min="0"
                value={form.years}
                onChange={(e) => setForm({ ...form, years: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Modules completed">
            <div className="flex gap-2">
              <Input
                value={moduleInput}
                placeholder="Module name"
                onChange={(e) => setModuleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addModule();
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={addModule}>
                <Plus className="size-4" /> Add module
              </Button>
            </div>
            {form.modules.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {form.modules.map((m, i) => (
                  <Badge key={`${m}-${i}`} variant="secondary" className="gap-1">
                    {m}
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, modules: form.modules.filter((_, x) => x !== i) })}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </Field>

          <Field label="Certificates">
            <div className="flex flex-wrap items-center gap-3">
              <UploadButton
                folder="certificates"
                label="Upload certificate"
                multiple
                onUploaded={(files) => setForm({ ...form, certificates: [...form.certificates, ...files] })}
              />
              {form.certificates.map((c) => (
                <span key={c.path} className="flex items-center gap-2 rounded-md border border-border px-2 py-1 text-xs">
                  <FileText className="size-3" />
                  <a href={c.url} target="_blank" rel="noreferrer" className="hover:underline">
                    {c.name}
                  </a>
                  <button
                    type="button"
                    onClick={async () => {
                      await removeFile(c.path);
                      setForm({ ...form, certificates: form.certificates.filter((f) => f.path !== c.path) });
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
              <Save className="size-4" /> {editingId ? "Update education" : "Save education"}
            </Button>
            <Button variant="ghost" onClick={() => { setForm(null); setEditingId(null); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <EmptyState text="No education added yet." />
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <article key={item.id} className="rounded-xl border border-border p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{item.qualification}</h3>
                  <p className="text-sm text-muted-foreground">{item.school}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.startDate} – {item.endDate}
                    {item.years ? ` · ${item.years} year(s)` : ""}
                  </p>
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
              {item.modules?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.modules.map((m, i) => (
                    <Badge key={`${m}-${i}`} variant="secondary">{m}</Badge>
                  ))}
                </div>
              )}
              {item.certificates?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                  {item.certificates.map((c) => (
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
