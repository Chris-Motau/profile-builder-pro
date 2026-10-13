import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import { firebaseReady } from "@/lib/firebase";
import { BioSection } from "@/components/admin/BioSection";
import { EducationSection } from "@/components/admin/EducationSection";
import { TechnicalSkillsSection } from "@/components/admin/TechnicalSkillsSection";
import { ProfessionalSkillsSection } from "@/components/admin/ProfessionalSkillsSection";
import { ProjectsSection } from "@/components/admin/ProjectsSection";
import { ExperienceSection } from "@/components/admin/ExperienceSection";
import { ProfileExtrasSection } from "@/components/admin/ProfileExtrasSection";
import { AdminGate } from "@/components/admin/AdminGate";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — C Motau Profile" },
      { name: "description", content: "Manage your profile bio, education, skills, projects, experience and contact details." },
      { property: "og:title", content: "Admin Dashboard — C Motau Profile" },
      { property: "og:description", content: "Manage your profile bio, education, skills, projects, experience and contact details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  return (
    <div className="min-h-screen bg-muted/40">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard className="size-5" />
          </span>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Admin dashboard</h1>
            <p className="text-xs text-muted-foreground">Manage everything shown on your profile</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        {!firebaseReady && (
          <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            Firebase API key missing. Set VITE_FIREBASE_API_KEY to enable saving.
          </p>
        )}
        <AdminGate>
          <BioSection />
          <EducationSection />
          <TechnicalSkillsSection />
          <ProfessionalSkillsSection />
          <ProjectsSection />
          <ExperienceSection />
          <ProfileExtrasSection />
        </AdminGate>
      </main>
    </div>
  );
}
