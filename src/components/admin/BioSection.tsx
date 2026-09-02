import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Pencil, Save, X } from "lucide-react";
import { useDocData } from "@/lib/admin-data";
import { Field, SectionShell } from "./ui-bits";

type Bio = { fullName: string; headline: string; bio: string };
const empty: Bio = { fullName: "", headline: "", bio: "" };

export function BioSection() {
  const { data, loading, save } = useDocData<Bio>("profile", "main", empty);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Bio>(empty);

  useEffect(() => {
    if (!editing) setDraft(data);
  }, [data, editing]);

  const hasBio = Boolean(data.bio || data.fullName);

  async function handleSave() {
    await save(draft);
    setEditing(false);
    toast.success("Bio saved");
  }

  return (
    <SectionShell
      title="Profile bio"
      description="Write the bio that introduces you across the site."
      actions={
        hasBio && !editing ? (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="size-4" /> Edit bio
          </Button>
        ) : null
      }
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : editing || !hasBio ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="bio-name">
              <Input
                id="bio-name"
                value={draft.fullName}
                onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
                placeholder="Your name"
              />
            </Field>
            <Field label="Headline" htmlFor="bio-headline">
              <Input
                id="bio-headline"
                value={draft.headline}
                onChange={(e) => setDraft({ ...draft, headline: e.target.value })}
                placeholder="Full-stack developer"
              />
            </Field>
          </div>
          <Field label="Bio" htmlFor="bio-body">
            <Textarea
              id="bio-body"
              rows={8}
              value={draft.bio}
              onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
              placeholder="Tell your story…"
            />
          </Field>
          <div className="flex gap-2">
            <Button onClick={handleSave}>
              <Save className="size-4" /> {hasBio ? "Update bio" : "Save bio"}
            </Button>
            {hasBio && (
              <Button variant="ghost" onClick={() => setEditing(false)}>
                <X className="size-4" /> Cancel
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-lg font-semibold">{data.fullName}</p>
          <p className="text-sm text-primary">{data.headline}</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{data.bio}</p>
        </div>
      )}
    </SectionShell>
  );
}
