import { useState } from "react";
import { toast } from "sonner";
import { AppWindow, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCollectionData, type WithId } from "@/lib/admin-data";
import { EmptyState, Field, SectionShell } from "./ui-bits";

type AppEntry = {
  name: string;
  link: string;
  createdAt?: number;
};

const empty: AppEntry = { name: "", link: "" };

export function AppsSection() {
  const { items, loading, add, update, remove } = useCollectionData<AppEntry>("apps");
  const [form, setForm] = useState<AppEntry | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  function startEdit(item: WithId<AppEntry>) {
    setEditingId(item.id);
    setForm({ name: item.name, link: item.link });
  }

  async function handleSave() {
    if (!form) return;
    const name = form.name.trim();
    const link = form.link.trim();
    let parsedLink: URL;
    try {
      parsedLink = new URL(link);
    } catch {
      toast.error("Enter a valid app link");
      return;
    }
    if (!name) {
      toast.error("App name is required");
      return;
    }
    if (parsedLink.protocol !== "https:" && parsedLink.protocol !== "http:") {
      toast.error("App link must start with http:// or https://");
      return;
    }

    try {
      const app = { name, link };
      if (editingId) {
        await update(editingId, app);
        toast.success("App updated");
      } else {
        await add(app);
        toast.success("App added");
      }
      setForm(null);
      setEditingId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save app. Please try again.");
    }
  }

  return (
    <SectionShell
      title="Your apps"
      description="Add apps you've developed. They appear on your home page with an install link."
      actions={
        !form && (
          <Button
            size="sm"
            onClick={() => {
              setEditingId(null);
              setForm(empty);
            }}
          >
            <Plus className="size-4" /> Add app
          </Button>
        )
      }
    >
      {form && (
        <div className="mb-6 space-y-4 rounded-xl border border-border bg-muted/40 p-5">
          <Field label="App name">
            <Input
              autoComplete="off"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="My app"
            />
          </Field>
          <Field label="App link">
            <Input
              type="url"
              value={form.link}
              onChange={(event) => setForm({ ...form, link: event.target.value })}
              placeholder="https://example.com"
            />
          </Field>
          <div className="flex gap-2">
            <Button onClick={() => void handleSave()}>
              <Save className="size-4" /> Save app
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setForm(null);
                setEditingId(null);
              }}
            >
              <X className="size-4" /> Cancel
            </Button>
          </div>
        </div>
      )}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <EmptyState text="No apps added yet." />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <AppWindow className="size-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.link}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => startEdit(item)}>
                  <Pencil className="size-4" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${item.name}`}
                  onClick={async () => {
                    try {
                      await remove(item.id);
                      toast.success("App deleted");
                    } catch (error) {
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : "Unable to delete app. Please try again.",
                      );
                    }
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  );
}
