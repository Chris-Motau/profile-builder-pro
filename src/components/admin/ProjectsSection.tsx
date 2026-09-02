import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Save, Trash2, X, Pencil, FileText, ExternalLink } from "lucide-react";
import { useCollectionData, removeFile, type UploadedFile, type WithId } from "@/lib/admin-data";
import { EmptyState, Field, SectionShell, UploadButton } from "./ui-bits";

type CaseStudy = { title: string; content: string; documents: UploadedFile[] };

type Project = {
  title: string;
  problem: string;
  solution: string;
  technologies: string[];
  link: string;
  media: UploadedFile[];
  caseStudies: CaseStudy[];
  createdAt?: number;
};

const empty: Project = {
  title: "",
  problem: "",
  solution: "",
  technologies: [],
  link: "",
  media: [],
  caseStudies: [],
};

export function ProjectsSection() {
  const { items, loading, add, update, remove } = useCollectionData<Project>("projects");
  const [form, setForm] = useState<Project | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [techInput, setTechInput] = useState("");

  function startEdit(item: WithId<Project>) {
    const { id: _id, ...rest } = item;
    setEditingId(item.id);
    setForm({ ...empty, ...rest });
  }

  async function handleSave() {
    if (!form?.title.trim()) {
      toast.error("Project title is required");
      return;
    }
    if (editingId) {
      await update(editingId, form);
      toast.success("Project updated");
    } else {
      await add(form);
      toast.success("Project saved");
    }
    setForm(null);
    setEditingId(null);
  }

  function patchCase(index: number, patch: Partial<CaseStudy>) {
    if (!form) return;
    setForm({
      ...form,
      caseStudies: form.caseStudies.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    });
  }

  return (
    <SectionShell
      title="Featured projects"
      description="Projects, technologies, media and case studies."
      actions={
        !form && (
          <Button size="sm" onClick={() => { setEditingId(null); setForm({ ...empty, technologies: [], media: [], caseStudies: [] }); }}>
            <Plus className="size-4" /> Add project
          </Button>
        )
      }
    >
      {form && (
        <div className="mb-6 space-y-5 rounded-xl border border-border bg-muted/40 p-5">
          <Field label="Project title">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Problem statement">
              <Textarea rows={5} value={form.problem} onChange={(e) => setForm({ ...form, problem: e.target.value })} />
            </Field>
            <Field label="Solution">
              <Textarea rows={5} value={form.solution} onChange={(e) => setForm({ ...form, solution: e.target.value })} />
            </Field>
          </div>
          <Field label="Project link">
            <Input placeholder="https://" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
          </Field>

          <Field label="Technologies used">
            <div className="flex gap-2">
              <Input
                value={techInput}
                placeholder="e.g. React"
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (techInput.trim()) {
                      setForm({ ...form, technologies: [...form.technologies, techInput.trim()] });
                      setTechInput("");
                    }
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  if (!techInput.trim()) return;
                  setForm({ ...form, technologies: [...form.technologies, techInput.trim()] });
                  setTechInput("");
                }}
              >
                <Plus className="size-4" /> Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {form.technologies.map((t, i) => (
                <Badge key={`${t}-${i}`} variant="secondary" className="gap-1">
                  {t}
                  <button type="button" onClick={() => setForm({ ...form, technologies: form.technologies.filter((_, x) => x !== i) })}>
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </Field>

          <Field label="Images & videos">
            <div className="flex flex-wrap items-center gap-3">
              <UploadButton
                folder="project-media"
                label="Upload media"
                accept="image/*,video/*"
                multiple
                onUploaded={(files) => setForm({ ...form, media: [...form.media, ...files] })}
              />
              {form.media.map((m) => (
                <span key={m.path} className="flex items-center gap-2 rounded-md border border-border px-2 py-1 text-xs">
                  <a href={m.url} target="_blank" rel="noreferrer" className="hover:underline">{m.name}</a>
                  <button
                    type="button"
                    onClick={async () => {
                      await removeFile(m.path);
                      setForm({ ...form, media: form.media.filter((f) => f.path !== m.path) });
                    }}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          </Field>

          <div className="space-y-3 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Case studies</h4>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setForm({ ...form, caseStudies: [...form.caseStudies, { title: "", content: "", documents: [] }] })}
              >
                <Plus className="size-4" /> Add case study
              </Button>
            </div>
            {form.caseStudies.length === 0 && (
              <p className="text-xs text-muted-foreground">No case studies added for this project yet.</p>
            )}
            {form.caseStudies.map((cs, i) => (
              <div key={i} className="space-y-3 rounded-lg border border-border bg-background p-4">
                <div className="flex items-center justify-between gap-2">
                  <Input
                    placeholder="Case study title"
                    value={cs.title}
                    onChange={(e) => patchCase(i, { title: e.target.value })}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setForm({ ...form, caseStudies: form.caseStudies.filter((_, x) => x !== i) })}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <Textarea
                  rows={5}
                  placeholder="Write or paste the case study…"
                  value={cs.content}
                  onChange={(e) => patchCase(i, { content: e.target.value })}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <UploadButton
                    folder="case-studies"
                    label="Upload document"
                    multiple
                    onUploaded={(files) => patchCase(i, { documents: [...cs.documents, ...files] })}
                  />
                  {cs.documents.map((d) => (
                    <span key={d.path} className="flex items-center gap-2 rounded-md border border-border px-2 py-1 text-xs">
                      <FileText className="size-3" />
                      <a href={d.url} target="_blank" rel="noreferrer" className="hover:underline">{d.name}</a>
                      <button
                        type="button"
                        onClick={async () => {
                          await removeFile(d.path);
                          patchCase(i, { documents: cs.documents.filter((f) => f.path !== d.path) });
                        }}
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave}>
              <Save className="size-4" /> {editingId ? "Update project" : "Save project"}
            </Button>
            <Button variant="ghost" onClick={() => { setForm(null); setEditingId(null); }}>Cancel</Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <EmptyState text="No projects saved yet." />
      ) : (
        <div className="grid gap-4">
          {items.map((p) => (
            <article key={p.id} className="rounded-xl border border-border p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{p.title}</h3>
                  {p.link && (
                    <a href={p.link} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <ExternalLink className="size-3" /> {p.link}
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(p)}>
                    <Pencil className="size-4" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(p.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              {p.problem && <p className="mt-3 text-sm text-muted-foreground"><span className="font-medium text-foreground">Problem: </span>{p.problem}</p>}
              {p.solution && <p className="mt-1 text-sm text-muted-foreground"><span className="font-medium text-foreground">Solution: </span>{p.solution}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {(p.technologies ?? []).map((t, i) => <Badge key={`${t}-${i}`} variant="secondary">{t}</Badge>)}
              </div>
              {(p.caseStudies ?? []).length > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">{p.caseStudies.length} case study/ies · {(p.media ?? []).length} media file(s)</p>
              )}
            </article>
          ))}
        </div>
      )}
    </SectionShell>
  );
}
