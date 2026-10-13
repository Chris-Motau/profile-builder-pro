import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Save, Trash2, X, Pencil, ArrowUp, ArrowDown } from "lucide-react";
import { useTechnicalSkills } from "@/lib/technical-skills";
import { EmptyState, Field, SectionShell } from "./ui-bits";

export function TechnicalSkillsSection() {
  const { items, loading, error, add, update, remove, saveOrder } = useTechnicalSkills();
  const [reordering, setReordering] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [skillInputs, setSkillInputs] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function moveCategory(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (reordering || target < 0 || target >= items.length) return;
    const ids = items.map((item) => item.id);
    const currentId = ids[index]!;
    ids[index] = ids[target]!;
    ids[target] = currentId;
    setReordering(true);
    try {
      await saveOrder(ids);
      toast.success("Category order saved");
    } catch {
      toast.error("Could not save category order. Please try again.");
    } finally {
      setReordering(false);
    }
  }

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
    <SectionShell title="Technical skills" description="Group your skills by category. Use the arrows to change their order on your public profile. Changes save automatically.">
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

      {error && <p role="alert" className="mb-4 text-sm text-destructive">{error}</p>}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <EmptyState text="No skill categories yet." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((cat, index) => (
            <div key={cat.id} className="rounded-xl border border-border p-5">
              <div className="mb-3 flex items-center gap-1">
                <span className="mr-auto text-xs text-muted-foreground">{index + 1} of {items.length}</span>
                <Button type="button" size="sm" variant="ghost" disabled={reordering || !!error || index === 0}
                  aria-label={`Move ${cat.category} earlier`} title="Move earlier" onClick={() => moveCategory(index, -1)}>
                  <ArrowUp className="size-4" />
                </Button>
                <Button type="button" size="sm" variant="ghost" disabled={reordering || !!error || index === items.length - 1}
                  aria-label={`Move ${cat.category} later`} title="Move later" onClick={() => moveCategory(index, 1)}>
                  <ArrowDown className="size-4" />
                </Button>
              </div>
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
