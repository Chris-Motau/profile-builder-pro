import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Save, Trash2, X, Pencil } from "lucide-react";
import { useCollectionData } from "@/lib/admin-data";
import { EmptyState, Field, SectionShell } from "./ui-bits";

type SkillCategory = { category: string; skills: string[]; createdAt?: number };

export function TechnicalSkillsSection() {
  const { items, loading, add, update, remove } = useCollectionData<SkillCategory>("technicalSkills");
  const [newCategory, setNewCategory] = useState("");
  const [skillInputs, setSkillInputs] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function addCategory() {
    const value = newCategory.trim();
    if (!value) return;
    await add({ category: value, skills: [] });
    setNewCategory("");
    toast.success("Category saved");
  }

  async function addSkill(id: string, skills: string[]) {
    const value = (skillInputs[id] ?? "").trim();
    if (!value) return;
    await update(id, { skills: [...skills, value] });
    setSkillInputs({ ...skillInputs, [id]: "" });
  }

  return (
    <SectionShell title="Technical skills" description="Group your skills by category, e.g. Frontend, Backend.">
      <div className="mb-6 flex flex-wrap gap-2">
        <Input
          className="max-w-xs"
          placeholder="New category (e.g. Frontend)"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCategory()}
        />
        <Button onClick={addCategory}>
          <Plus className="size-4" /> Add category
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <EmptyState text="No skill categories yet." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((cat) => (
            <div key={cat.id} className="rounded-xl border border-border p-5">
              <div className="flex items-center justify-between gap-2">
                {editing === cat.id ? (
                  <div className="flex flex-1 gap-2">
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                    <Button
                      size="sm"
                      onClick={async () => {
                        await update(cat.id, { category: editName.trim() || cat.category });
                        setEditing(null);
                        toast.success("Category updated");
                      }}
                    >
                      <Save className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <h3 className="font-semibold">{cat.category}</h3>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(cat.id); setEditName(cat.category); }}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(cat.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {(cat.skills ?? []).map((s, i) => (
                  <Badge key={`${s}-${i}`} variant="secondary" className="gap-1">
                    {s}
                    <button
                      type="button"
                      onClick={() => update(cat.id, { skills: cat.skills.filter((_, x) => x !== i) })}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              <Field label="Add skill" className="mt-4">
                <div className="flex gap-2">
                  <Input
                    value={skillInputs[cat.id] ?? ""}
                    placeholder="e.g. React"
                    onChange={(e) => setSkillInputs({ ...skillInputs, [cat.id]: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill(cat.id, cat.skills ?? []);
                      }
                    }}
                  />
                  <Button variant="secondary" onClick={() => addSkill(cat.id, cat.skills ?? [])}>
                    <Plus className="size-4" />
                  </Button>
                </div>
              </Field>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  );
}
