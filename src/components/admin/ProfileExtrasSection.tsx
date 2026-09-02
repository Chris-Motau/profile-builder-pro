import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Save, FileText, X, Plus, Trash2 } from "lucide-react";
import { useDocData, removeFile, type UploadedFile } from "@/lib/admin-data";
import { Field, SectionShell, UploadButton } from "./ui-bits";

type OtherLink = { label: string; url: string };

type Extras = {
  cv: UploadedFile | null;
  linkedin: string;
  github: string;
  tiktok: string;
  otherLinks: OtherLink[];
  email: string;
  phone: string;
  whatsapp: string;
};

const empty: Extras = {
  cv: null,
  linkedin: "",
  github: "",
  tiktok: "",
  otherLinks: [],
  email: "",
  phone: "",
  whatsapp: "",
};

export function ProfileExtrasSection() {
  const { data, loading, save } = useDocData<Extras>("profile", "extras", empty);
  const [draft, setDraft] = useState<Extras>(empty);

  useEffect(() => {
    setDraft({ ...empty, ...data });
  }, [data]);

  async function persist(value: Extras) {
    setDraft(value);
    await save(value);
  }

  return (
    <SectionShell title="CV, links & contact" description="Your CV, profile links and contact details.">
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-6">
          <Field label="CV">
            <div className="flex flex-wrap items-center gap-3">
              <UploadButton
                folder="cv"
                label="Upload CV"
                onUploaded={async (files) => {
                  const next = files[0] ?? null;
                  if (draft.cv) await removeFile(draft.cv.path);
                  await persist({ ...draft, cv: next });
                  toast.success("CV uploaded");
                }}
              />
              {draft.cv && (
                <span className="flex items-center gap-2 rounded-md border border-border px-2 py-1 text-xs">
                  <FileText className="size-3" />
                  <a href={draft.cv.url} target="_blank" rel="noreferrer" className="hover:underline">{draft.cv.name}</a>
                  <button
                    type="button"
                    onClick={async () => {
                      await removeFile(draft.cv!.path);
                      await persist({ ...draft, cv: null });
                    }}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )}
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="LinkedIn">
              <Input value={draft.linkedin} onChange={(e) => setDraft({ ...draft, linkedin: e.target.value })} placeholder="https://linkedin.com/in/…" />
            </Field>
            <Field label="GitHub">
              <Input value={draft.github} onChange={(e) => setDraft({ ...draft, github: e.target.value })} placeholder="https://github.com/…" />
            </Field>
            <Field label="TikTok">
              <Input value={draft.tiktok} onChange={(e) => setDraft({ ...draft, tiktok: e.target.value })} placeholder="https://tiktok.com/@…" />
            </Field>
          </div>

          <Field label="Other links">
            <div className="space-y-2">
              {draft.otherLinks.map((l, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    className="max-w-[200px]"
                    placeholder="Label"
                    value={l.label}
                    onChange={(e) =>
                      setDraft({ ...draft, otherLinks: draft.otherLinks.map((o, x) => (x === i ? { ...o, label: e.target.value } : o)) })
                    }
                  />
                  <Input
                    placeholder="https://"
                    value={l.url}
                    onChange={(e) =>
                      setDraft({ ...draft, otherLinks: draft.otherLinks.map((o, x) => (x === i ? { ...o, url: e.target.value } : o)) })
                    }
                  />
                  <Button variant="ghost" size="icon" onClick={() => setDraft({ ...draft, otherLinks: draft.otherLinks.filter((_, x) => x !== i) })}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button variant="secondary" size="sm" onClick={() => setDraft({ ...draft, otherLinks: [...draft.otherLinks, { label: "", url: "" }] })}>
                <Plus className="size-4" /> Add link
              </Button>
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Email">
              <Input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
            </Field>
            <Field label="Contact number">
              <Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
            </Field>
            <Field label="WhatsApp">
              <Input value={draft.whatsapp} onChange={(e) => setDraft({ ...draft, whatsapp: e.target.value })} />
            </Field>
          </div>

          <Button
            onClick={async () => {
              await save(draft);
              toast.success("Details saved");
            }}
          >
            <Save className="size-4" /> Save details
          </Button>
        </div>
      )}
    </SectionShell>
  );
}
