import { useState, type ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { uploadFile, type UploadedFile } from "@/lib/admin-data";

function uploadErrorMessage(error: unknown): string {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  switch (code) {
    case "storage/unauthenticated":
      return "Sign in before uploading files.";
    case "storage/unauthorized":
      return "Upload denied. Check the Firebase Storage rules for this account.";
    case "storage/bucket-not-found":
    case "storage/no-default-bucket":
      return "Storage bucket unavailable. Check the Firebase project configuration.";
    case "storage/quota-exceeded":
      return "Storage quota exceeded. Check the Firebase project's plan and usage.";
    case "storage/retry-limit-exceeded":
      return "Upload timed out. Check your connection and try again.";
    default:
      return error instanceof Error ? error.message : "Upload failed. Please try again.";
  }
}

export function SectionShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}

export function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label htmlFor={htmlFor} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function UploadButton({
  folder,
  label = "Upload file",
  accept,
  multiple,
  maxSizeBytes,
  onUploaded,
}: {
  folder: string;
  label?: string;
  accept?: string;
  multiple?: boolean;
  maxSizeBytes?: number;
  onUploaded: (files: UploadedFile[]) => void | Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState("");
  const inputId = `up-${folder.replace(/\W/g, "-")}-${label.replace(/\W/g, "-")}`;

  return (
    <div>
      <input
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          if (!files.length) return;
          if (maxSizeBytes && files.some((file) => file.size > maxSizeBytes)) {
            toast.error(`Choose a file smaller than ${Math.round(maxSizeBytes / 1024 / 1024)} MB.`);
            e.target.value = "";
            return;
          }
          setBusy(true);
          setProgress(0);
          const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
          let completedBytes = 0;
          const uploaded: UploadedFile[] = [];
          try {
            for (const file of files) {
              setCurrentFile(file.name);
              uploaded.push(
                await uploadFile(folder, file, (transferred) => {
                  setProgress(Math.round(((completedBytes + transferred) / (totalBytes || 1)) * 100));
                }),
              );
              completedBytes += file.size;
            }
            setCurrentFile("Saving uploaded files");
            setProgress(100);
            await onUploaded(uploaded);
          } catch (error) {
            if (uploaded.length > 0 && uploaded.length < files.length) {
              try {
                await onUploaded(uploaded);
              } catch (saveError) {
                toast.error(`Files uploaded, but saving failed: ${uploadErrorMessage(saveError)}`);
                return;
              }
            }
            toast.error(uploadErrorMessage(error));
          } finally {
            setBusy(false);
            setCurrentFile("");
            e.target.value = "";
          }
        }}
      />
      <Button type="button" variant="outline" size="sm" disabled={busy} asChild={false}
        onClick={() => document.getElementById(inputId)?.click()}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        {label}
      </Button>
      {busy && (
        <div className="mt-2 max-w-xs" role="status" aria-live="polite">
          <p className="truncate text-xs text-muted-foreground">{currentFile || "Preparing upload"} · {progress}%</p>
          <progress className="h-2 w-full accent-primary" max={100} value={progress} aria-label="Upload progress" />
        </div>
      )}
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      {text}
    </p>
  );
}
