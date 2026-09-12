import { createFileRoute, Link } from "@tanstack/react-router";
import {
  GraduationCap,
  Briefcase,
  Code2,
  HeartHandshake,
  FolderKanban,
  Mail,
  Phone,
  MessageCircle,
  Linkedin,
  Github,
  Music2,
  Link2,
  FileText,
  ExternalLink,
  Download,
} from "lucide-react";
import { firebaseReady } from "@/lib/firebase";
import { useCollectionData, useDocData, type UploadedFile } from "@/lib/admin-data";
import { Badge } from "@/components/ui/badge";

type Bio = { fullName: string; headline: string; bio: string };
type Extras = {
  cv: UploadedFile | null;
  linkedin: string;
  github: string;
  tiktok: string;
  otherLinks: { label: string; url: string }[];
  email: string;
  phone: string;
  whatsapp: string;
};
type Education = {
  school: string;
  qualification: string;
  startDate: string;
  endDate: string;
  years: string;
  modules: string[];
  certificates: UploadedFile[];
};
type SkillCategory = { category: string; skills: string[] };
type ProSkill = { header: string; summary: string };
type CaseStudy = { title: string; content: string; documents: UploadedFile[] };
type Project = {
  title: string;
  problem: string;
  solution: string;
  technologies: string[];
  link: string;
  media: UploadedFile[];
  caseStudies: CaseStudy[];
};
type Experience = {
  company: string;
  position: string;
  description: string;
  startDate: string;
  endDate: string;
  certifications: UploadedFile[];
};

const emptyBio: Bio = { fullName: "", headline: "", bio: "" };
const emptyExtras: Extras = {
  cv: null,
  linkedin: "",
  github: "",
  tiktok: "",
  otherLinks: [],
  email: "",
  phone: "",
  whatsapp: "",
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "C Motau — Profile & Portfolio" },
      { name: "description", content: "Profile, education, skills, projects and experience of C Motau." },
      { property: "og:title", content: "C Motau — Profile & Portfolio" },
      { property: "og:description", content: "Profile, education, skills, projects and experience of C Motau." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PublicProfile,
});

function formatDate(value: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short" });
}

function Section({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function PublicProfile() {
  const bio = useDocData<Bio>("profile", "main", emptyBio);
  const extras = useDocData<Extras>("profile", "extras", emptyExtras);
  const education = useCollectionData<Education>("education");
  const techSkills = useCollectionData<SkillCategory>("technicalSkills");
  const proSkills = useCollectionData<ProSkill>("professionalSkills");
  const projects = useCollectionData<Project>("projects");
  const experience = useCollectionData<Experience>("experience");

  const name = bio.data.fullName || "C Motau";
  const hasContact = extras.data.email || extras.data.phone || extras.data.whatsapp;
  const hasSocial =
    extras.data.linkedin || extras.data.github || extras.data.tiktok || extras.data.otherLinks.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
          {bio.loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : (
            <>
              <p className="text-sm font-medium uppercase tracking-widest text-primary">
                {bio.data.headline || "Profile"}
              </p>
              <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">{name}</h1>
              {bio.data.bio && (
                <p className="mt-6 max-w-2xl whitespace-pre-wrap text-lg leading-relaxed text-muted-foreground">
                  {bio.data.bio}
                </p>
              )}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                {extras.data.cv && (
                  <a
                    href={extras.data.cv.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    <Download className="size-4" /> Download CV
                  </a>
                )}
                {hasSocial && (
                  <div className="flex flex-wrap gap-2">
                    {extras.data.linkedin && (
                      <SocialLink href={extras.data.linkedin} label="LinkedIn" icon={Linkedin} />
                    )}
                    {extras.data.github && <SocialLink href={extras.data.github} label="GitHub" icon={Github} />}
                    {extras.data.tiktok && <SocialLink href={extras.data.tiktok} label="TikTok" icon={Music2} />}
                    {extras.data.otherLinks.map((l, i) => (
                      <SocialLink key={i} href={l.url} label={l.label || l.url} icon={Link2} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-16 px-4 py-12 sm:px-6">
        {!firebaseReady && (
          <p className="rounded-xl border border-border bg-muted p-4 text-sm text-muted-foreground">
            Profile content is unavailable right now.
          </p>
        )}

        {/* Experience */}
        {experience.items.length > 0 && (
          <Section id="experience" icon={Briefcase} title="Experience">
            <div className="space-y-6">
              {experience.items.map((item) => (
                <article key={item.id} className="relative border-l-2 border-border pl-6">
                  <span className="absolute -left-[5px] top-1.5 size-2 rounded-full bg-primary" />
                  <h3 className="font-semibold">{item.position}</h3>
                  <p className="text-sm text-primary">{item.company}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(item.startDate)} – {item.endDate ? formatDate(item.endDate) : "Present"}
                  </p>
                  {item.description && (
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                  {item.certifications?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-3 text-xs">
                      {item.certifications.map((c) => (
                        <a
                          key={c.path}
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <FileText className="size-3" /> {c.name}
                        </a>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </Section>
        )}

        {/* Education */}
        {education.items.length > 0 && (
          <Section id="education" icon={GraduationCap} title="Education">
            <div className="grid gap-4">
              {education.items.map((item) => (
                <article key={item.id} className="rounded-xl border border-border p-5">
                  <h3 className="font-semibold">{item.qualification}</h3>
                  <p className="text-sm text-muted-foreground">{item.school}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(item.startDate)} – {formatDate(item.endDate)}
                    {item.years ? ` · ${item.years} year(s)` : ""}
                  </p>
                  {item.modules?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.modules.map((m, i) => (
                        <Badge key={`${m}-${i}`} variant="secondary">
                          {m}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {item.certificates?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-3 text-xs">
                      {item.certificates.map((c) => (
                        <a
                          key={c.path}
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <FileText className="size-3" /> {c.name}
                        </a>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </Section>
        )}

        {/* Technical skills */}
        {techSkills.items.length > 0 && (
          <Section id="technical-skills" icon={Code2} title="Technical skills">
            <div className="grid gap-4 sm:grid-cols-2">
              {techSkills.items.map((cat) => (
                <div key={cat.id} className="rounded-xl border border-border p-5">
                  <h3 className="font-semibold">{cat.category}</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(cat.skills ?? []).map((s, i) => (
                      <Badge key={`${s}-${i}`} variant="secondary">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Professional skills */}
        {proSkills.items.length > 0 && (
          <Section id="professional-skills" icon={HeartHandshake} title="Professional skills">
            <div className="grid gap-4 sm:grid-cols-2">
              {proSkills.items.map((item) => (
                <article key={item.id} className="rounded-xl border border-border p-5">
                  <h3 className="font-semibold">{item.header}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{item.summary}</p>
                </article>
              ))}
            </div>
          </Section>
        )}

        {/* Projects */}
        {projects.items.length > 0 && (
          <Section id="projects" icon={FolderKanban} title="Featured projects">
            <div className="grid gap-6">
              {projects.items.map((p) => (
                <article key={p.id} className="rounded-xl border border-border p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold">{p.title}</h3>
                    {p.link && (
                      <a
                        href={p.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="size-4" /> View project
                      </a>
                    )}
                  </div>
                  {p.problem && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Problem: </span>
                      {p.problem}
                    </p>
                  )}
                  {p.solution && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Solution: </span>
                      {p.solution}
                    </p>
                  )}
                  {p.technologies?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {p.technologies.map((t, i) => (
                        <Badge key={`${t}-${i}`} variant="secondary">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {p.media?.length > 0 && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {p.media.map((m) =>
                        m.type?.startsWith("video/") ? (
                          <video key={m.path} src={m.url} controls className="w-full rounded-lg border border-border" />
                        ) : m.type?.startsWith("image/") ? (
                          <img
                            key={m.path}
                            src={m.url}
                            alt={m.name}
                            loading="lazy"
                            className="w-full rounded-lg border border-border object-cover"
                          />
                        ) : (
                          <a
                            key={m.path}
                            href={m.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            <FileText className="size-4" /> {m.name}
                          </a>
                        ),
                      )}
                    </div>
                  )}
                  {p.caseStudies?.length > 0 && (
                    <div className="mt-5 space-y-4 border-t border-border pt-4">
                      <h4 className="text-sm font-semibold">Case studies</h4>
                      {p.caseStudies.map((cs, i) => (
                        <div key={i} className="rounded-lg bg-muted/40 p-4">
                          <h5 className="text-sm font-medium">{cs.title}</h5>
                          {cs.content && (
                            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{cs.content}</p>
                          )}
                          {cs.documents?.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-3 text-xs">
                              {cs.documents.map((d) => (
                                <a
                                  key={d.path}
                                  href={d.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-primary hover:underline"
                                >
                                  <FileText className="size-3" /> {d.name}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </Section>
        )}

        {/* Contact */}
        {(hasContact || hasSocial) && (
          <Section id="contact" icon={Mail} title="Contact">
            <div className="grid gap-3 sm:grid-cols-3">
              {extras.data.email && (
                <ContactCard href={`mailto:${extras.data.email}`} icon={Mail} label="Email" value={extras.data.email} />
              )}
              {extras.data.phone && (
                <ContactCard href={`tel:${extras.data.phone}`} icon={Phone} label="Phone" value={extras.data.phone} />
              )}
              {extras.data.whatsapp && (
                <ContactCard
                  href={`https://wa.me/${extras.data.whatsapp.replace(/[^0-9]/g, "")}`}
                  icon={MessageCircle}
                  label="WhatsApp"
                  value={extras.data.whatsapp}
                />
              )}
            </div>
          </Section>
        )}
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 sm:px-6">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} {name}</p>
          <Link to="/admin" className="text-xs text-muted-foreground hover:underline">
            Admin
          </Link>
        </div>
      </footer>
    </div>
  );
}

function SocialLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-muted"
    >
      <Icon className="size-4" /> {label}
    </a>
  );
}

function ContactCard({
  href,
  icon: Icon,
  label,
  value,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noreferrer"
      className="flex items-center gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-muted"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span className="block truncate text-sm font-medium">{value}</span>
      </span>
    </a>
  );
}
