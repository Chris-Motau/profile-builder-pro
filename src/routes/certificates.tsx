import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Download, ExternalLink, FileText } from "lucide-react";
import { useCollectionData, useDocData, type UploadedFile } from "@/lib/admin-data";

type Extras = { cv: UploadedFile | null };
type Education = { school: string; qualification: string; certificates: UploadedFile[] };
type Experience = { company: string; position: string; certifications: UploadedFile[] };
type CaseStudy = { title: string; documents: UploadedFile[] };
type Project = { title: string; media: UploadedFile[]; caseStudies: CaseStudy[] };

const emptyExtras: Extras = { cv: null };

export const Route = createFileRoute("/certificates")({
  head: () => ({
    meta: [
      { title: "Certificates & Documents — C Motau" },
      { name: "description", content: "View and download certificates and documents from C Motau's profile." },
    ],
  }),
  component: CertificatesPage,
});

type DocumentItem = { file: UploadedFile; group: string; detail: string };

function isPdf(file: UploadedFile) {
  return file.type?.toLowerCase() === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function CertificatesPage() {
  const extras = useDocData<Extras>("profile", "extras", emptyExtras);
  const education = useCollectionData<Education>("education");
  const experience = useCollectionData<Experience>("experience");
  const projects = useCollectionData<Project>("projects");

  const documents: DocumentItem[] = [];
  if (extras.data.cv) documents.push({ file: extras.data.cv, group: "Profile", detail: "CV" });

  education.items.forEach((item) =>
    (item.certificates ?? []).forEach((file) =>
      documents.push({ file, group: "Education certificate", detail: `${item.qualification} · ${item.school}` }),
    ),
  );
  experience.items.forEach((item) =>
    (item.certifications ?? []).forEach((file) =>
      documents.push({ file, group: "Experience certification", detail: `${item.position} · ${item.company}` }),
    ),
  );
  projects.items.forEach((project) => {
    (project.media ?? []).filter((file) => isPdf(file)).forEach((file) =>
      documents.push({ file, group: "Project document", detail: project.title }),
    );
    (project.caseStudies ?? []).forEach((study) =>
      (study.documents ?? []).forEach((file) =>
        documents.push({ file, group: "Case study document", detail: `${study.title} · ${project.title}` }),
      ),
    );
  });

  const loading = extras.loading || education.loading || experience.loading || projects.loading;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Back to profile
          </Link>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">Certificates & documents</h1>
          <p className="mt-2 text-muted-foreground">Browse and download certificates and PDF documents listed on this profile.</p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading documents…</p>
        ) : documents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <FileText className="mx-auto size-8 text-muted-foreground" />
            <h2 className="mt-3 font-semibold">No certificates or documents yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">Documents added to the profile will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {documents.map(({ file, group, detail }, index) => (
              <article key={`${file.path}-${index}`} className="flex flex-col gap-4 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">{file.name}</h2>
                    <p className="mt-0.5 text-xs text-primary">{group}</p>
                    {detail && <p className="mt-1 text-sm text-muted-foreground">{detail}</p>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2 sm:pl-4">
                  <a href={file.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
                    <ExternalLink className="size-4" /> View
                  </a>
                  <a href={file.url} download={file.name} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
                    <Download className="size-4" /> Download
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
