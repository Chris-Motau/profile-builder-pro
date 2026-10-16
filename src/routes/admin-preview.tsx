import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import { firebaseReady } from "@/lib/firebase";
import { BioSection } from "@/components/admin/BioSection";
import { EducationSection } from "@/components/admin/EducationSection";
import { TechnicalSkillsSection } from "@/components/admin/TechnicalSkillsSection";
import { ProfessionalSkillsSection } from "@/components/admin/ProfessionalSkillsSection";
import { ProjectsSection } from "@/components/admin/ProjectsSection";
import { ExperienceSection } from "@/components/admin/ExperienceSection";
import { ProfileExtrasSection } from "@/components/admin/ProfileExtrasSection";

export const Route = createFileRoute("/admin-preview")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard Preview — C Motau Profile" },
      { name: "description", content: "Preview the profile admin dashboard in read-only mode." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDashboardPreview,
});

function AdminDashboardPreview() {
  return (
    <div className="min-h-screen bg-muted/40">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <LayoutDashboard className="size-5" />
            </span>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Admin dashboard preview</h1>
              <p className="text-xs text-muted-foreground">Read-only preview of profile content and controls</p>
            </div>
          </div>
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Back to profile
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          This dashboard is available for preview only. Its controls are disabled and changes cannot be made here.
        </p>
        {!firebaseReady && (
          <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            Firebase API key missing. Set VITE_FIREBASE_API_KEY to load dashboard content.
          </p>
        )}
        <fieldset disabled className="min-w-0 border-0 p-0">
          <BioSection />
          <div className="mt-8 space-y-8">
            <EducationSection />
            <TechnicalSkillsSection />
            <ProfessionalSkillsSection />
            <ProjectsSection />
            <ExperienceSection />
            <ProfileExtrasSection />
          </div>
        </fieldset>
      </main>
    </div>
  );
}
