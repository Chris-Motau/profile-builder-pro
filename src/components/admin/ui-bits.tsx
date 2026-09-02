import { useState, type ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";
import { uploadFile, type UploadedFile } from "@/lib/admin-data";

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
  onUploaded,
}: {
  folder: string;
  label?: string;
  accept?: string;
  multiple?: boolean;
  onUploaded: (files: UploadedFile[]) => void | Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
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
          setBusy(true);
          try {
            const uploaded = await Promise.all(files.map((f) => uploadFile(folder, f)));
            await onUploaded(uploaded);
          } finally {
            setBusy(false);
            e.target.value = "";
          }
        }}
      />
      <Button type="button" variant="outline" size="sm" disabled={busy} asChild={false}
        onClick={() => document.getElementById(inputId)?.click()}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        {label}
      </Button>
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
