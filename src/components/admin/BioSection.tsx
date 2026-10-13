import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Pencil, Save, X } from "lucide-react";
import { removeFile, useDocData, type UploadedFile } from "@/lib/admin-data";
import { Field, SectionShell, UploadButton } from "./ui-bits";

type BioDraft = { fullName: string; headline: string; bio: string };
type Bio = BioDraft & { profilePicture?: UploadedFile | null };
const empty: BioDraft = { fullName: "", headline: "", bio: "" };

export function BioSection() {
  const { data, loading, save } = useDocData<Bio>("profile", "main", empty);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<BioDraft>(empty);
  const [removingPicture, setRemovingPicture] = useState(false);

  useEffect(() => {
    if (!editing) setDraft({ fullName: data.fullName, headline: data.headline, bio: data.bio });
  }, [data, editing]);

  const hasBio = Boolean(data.bio || data.fullName);

  async function handleSave() {
    await save(draft);
    setEditing(false);
    toast.success("Bio saved");
  }

  async function handlePictureUploaded(files: UploadedFile[]) {
    const picture = files[0];
    if (!picture) return;
    const oldPicture = data.profilePicture;
    try {
      await save({ profilePicture: picture });
    } catch (error) {
      await removeFile(picture.path);
      throw error;
    }
    if (oldPicture?.path && oldPicture.path !== picture.path) await removeFile(oldPicture.path);
    toast.success("Profile picture saved");
  }

  async function handleRemovePicture() {
    const oldPicture = data.profilePicture;
    if (!oldPicture) return;
    setRemovingPicture(true);
    try {
      await save({ profilePicture: null });
      await removeFile(oldPicture.path);
      toast.success("Profile picture removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove profile picture");
    } finally {
      setRemovingPicture(false);
    }
  }

  return (
    <SectionShell
      title="Profile bio"
      description="Write the bio that introduces you across the site."
      actions={hasBio && !editing ? (
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          <Pencil className="size-4" /> Edit bio
        </Button>
      ) : null}
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-5 border-b border-border pb-6">
            {data.profilePicture?.url ? (
              <img src={data.profilePicture.url} alt="Current profile picture" className="size-24 rounded-full border border-border object-cover" />
            ) : (
              <div className="flex size-24 items-center justify-center rounded-full border border-dashed border-border text-center text-xs text-muted-foreground">No picture</div>
            )}
            <div className="space-y-2">
              <p className="text-sm font-medium">Profile picture</p>
              <div className="flex flex-wrap gap-2">
                <UploadButton
                  folder="profile-picture"
                  label={data.profilePicture ? "Replace picture" : "Upload picture"}
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  maxSizeBytes={10 * 1024 * 1024}
                  onUploaded={handlePictureUploaded}
                />
                {data.profilePicture && (
                  <Button type="button" variant="ghost" size="sm" disabled={removingPicture} onClick={handleRemovePicture}>
                    <X className="size-4" /> Remove picture
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">JPG, PNG, WebP, GIF or AVIF, up to 10 MB.</p>
            </div>
          </div>
          {editing || !hasBio ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" htmlFor="bio-name">
                  <Input id="bio-name" value={draft.fullName} onChange={(e) => setDraft({ ...draft, fullName: e.target.value })} placeholder="Your name" />
                </Field>
                <Field label="Headline" htmlFor="bio-headline">
                  <Input id="bio-headline" value={draft.headline} onChange={(e) => setDraft({ ...draft, headline: e.target.value })} placeholder="Full-stack developer" />
                </Field>
              </div>
              <Field label="Bio" htmlFor="bio-body">
                <Textarea id="bio-body" rows={8} value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} placeholder="Tell your story…" />
              </Field>
              <div className="flex gap-2">
                <Button onClick={handleSave}>
                  <Save className="size-4" /> {hasBio ? "Update bio" : "Save bio"}
                </Button>
                {hasBio && <Button variant="ghost" onClick={() => setEditing(false)}><X className="size-4" /> Cancel</Button>}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-lg font-semibold">{data.fullName}</p>
              <p className="text-sm text-primary">{data.headline}</p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{data.bio}</p>
            </div>
          )}
        </div>
      )}
    </SectionShell>
  );
}
