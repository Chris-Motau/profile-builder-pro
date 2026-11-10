import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  GraduationCap,
  Briefcase,
  Code2,
  HeartHandshake,
  FolderKanban,
  AppWindow,
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
  ChevronDown,
  ChevronUp,
  Award,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { firebaseReady } from "@/lib/firebase";
import { useCollectionData, useDocData, type UploadedFile } from "@/lib/admin-data";
import { useTechnicalSkills } from "@/lib/technical-skills";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Bio = { fullName: string; headline: string; bio: string; profilePicture?: UploadedFile | null };
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
type AppEntry = { name: string; link: string };
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
  speaker,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
  speaker?: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </span>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        </div>
        {speaker}
      </div>
      {children}
    </section>
  );
}

function VoiceReaderButton({
  section,
  isSpeaking,
  onClick,
  className,
}: {
  section: string;
  isSpeaking: boolean;
  onClick: () => void;
  className?: string;
}) {
  const label = isSpeaking ? `Stop reading ${section}` : `Read ${section} aloud`;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={className}
      aria-label={label}
      aria-pressed={isSpeaking}
      title={label}
      onClick={onClick}
    >
      {isSpeaking ? <VolumeX /> : <Volume2 />}
    </Button>
  );
}

function PublicProfile() {
  const navigatedFromMenu = useRef(false);
  const activeUtterance = useRef<SpeechSynthesisUtterance | null>(null);
  const [speakingSection, setSpeakingSection] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(() => new Set());
  useEffect(
    () => () => {
      activeUtterance.current = null;
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    },
    [],
  );
  const bio = useDocData<Bio>("profile", "main", emptyBio);
  const extras = useDocData<Extras>("profile", "extras", emptyExtras);
  const education = useCollectionData<Education>("education");
  const techSkills = useTechnicalSkills();
  const proSkills = useCollectionData<ProSkill>("professionalSkills");
  const projects = useCollectionData<Project>("projects");
  const apps = useCollectionData<AppEntry>("apps");
  const experience = useCollectionData<Experience>("experience");

  const name = bio.data.fullName || "C Motau";
  const hasContact = extras.data.email || extras.data.phone || extras.data.whatsapp;
  const hasSocial =
    extras.data.linkedin || extras.data.github || extras.data.tiktok || extras.data.otherLinks.length > 0;
  const quickLinks = [
    { id: "about", label: "About" },
    ...(experience.items.length ? [{ id: "experience", label: "Experience" }] : []),
    ...(education.items.length ? [{ id: "education", label: "Education" }] : []),
    ...(techSkills.items.length ? [{ id: "technical-skills", label: "Technical skills" }] : []),
    ...(proSkills.items.length ? [{ id: "professional-skills", label: "Professional skills" }] : []),
    ...(projects.items.length ? [{ id: "projects", label: "Projects" }] : []),
    ...(apps.items.length ? [{ id: "apps", label: "Apps" }] : []),
    ...(hasContact || hasSocial ? [{ id: "contact", label: "Contact" }] : []),
  ];

  const toggleSectionSpeech = (section: string, text: string) => {
    if (
      typeof window === "undefined" ||
      !window.speechSynthesis ||
      typeof SpeechSynthesisUtterance === "undefined"
    ) {
      toast.error("Text-to-speech is not available in this browser.");
      return;
    }

    const speech = window.speechSynthesis;
    if (speakingSection === section) {
      activeUtterance.current = null;
      speech.cancel();
      setSpeakingSection(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      if (activeUtterance.current === utterance) {
        activeUtterance.current = null;
        setSpeakingSection(null);
      }
    };
    utterance.onerror = (event) => {
      if (activeUtterance.current === utterance) {
        activeUtterance.current = null;
        setSpeakingSection(null);
        if (event.error !== "canceled" && event.error !== "interrupted") {
          toast.error("Unable to read this section aloud. Please try again.");
        }
      }
    };

    speech.cancel();
    activeUtterance.current = utterance;
    setSpeakingSection(section);
    try {
      speech.speak(utterance);
    } catch {
      activeUtterance.current = null;
      setSpeakingSection(null);
      toast.error("Unable to read this section aloud. Please try again.");
    }
  };

  const experienceSpeechText = experience.items
    .map((item) =>
      [
        item.position,
        item.company,
        [item.startDate && formatDate(item.startDate), item.endDate ? formatDate(item.endDate) : "Present"]
          .filter(Boolean)
          .join(" to "),
        item.description,
        ...(item.certifications ?? []).map((file) => file.name),
      ]
        .filter(Boolean)
        .join(". "),
    )
    .join(". ");
  const professionalSkillsSpeechText = proSkills.items
    .map((item) => [item.header, item.summary].filter(Boolean).join(". "))
    .join(". ");
  const projectsSpeechText = projects.items
    .map((project) =>
      [
        project.title,
        project.problem && `Problem: ${project.problem}`,
        project.solution && `Solution: ${project.solution}`,
        project.technologies?.length && `Technologies: ${project.technologies.join(", ")}`,
        ...(project.media ?? [])
          .filter((file) => !file.type?.startsWith("image/") && !file.type?.startsWith("video/"))
          .map((file) => file.name),
        ...(project.caseStudies ?? []).flatMap((study) => [
          study.title,
          study.content,
          ...(study.documents ?? []).map((file) => file.name),
        ]),
      ]
        .filter(Boolean)
        .join(". "),
    )
    .join(". ");

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header id="top" className="border-b border-border bg-muted/30">
        <div className="border-b border-border bg-background/90">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <a href="#top" className="font-semibold tracking-tight hover:text-primary">{name}</a>
            <nav aria-label="Header navigation">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" aria-label="Open quick navigation">
                    Quick navigation <ChevronDown className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="min-w-48"
                  onCloseAutoFocus={(event) => {
                    if (navigatedFromMenu.current) event.preventDefault();
                    navigatedFromMenu.current = false;
                  }}
                >
                  {quickLinks.map((link) => (
                    <DropdownMenuItem key={link.id} asChild onSelect={() => { navigatedFromMenu.current = true; }}>
                      <a href={`#${link.id}`}>{link.label}</a>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem asChild>
                    <Link to="/certificates">See all certificates</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/admin-preview">Admin preview</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>
        </div>
        <div className="profile-cover">
          <div className="profile-cover-orb" aria-hidden="true" />
          <div id="about" className="relative z-10 mx-auto max-w-4xl scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24">
          {bio.loading ? (
            <p className="text-white/80">Loading…</p>
          ) : (
            <>
              <div className="mb-5 flex justify-end">
                <VoiceReaderButton
                  section="bio"
                  isSpeaking={speakingSection === "about"}
                  onClick={() =>
                    toggleSectionSpeech(
                      "about",
                      [name, bio.data.headline || "Profile", bio.data.bio].filter(Boolean).join(". "),
                    )
                  }
                  className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                />
              </div>
              {bio.data.profilePicture?.url && (
                <img
                  src={bio.data.profilePicture.url}
                  alt={`${name}'s profile picture`}
                  className="mb-6 size-32 rounded-full border-4 border-white/70 object-cover shadow-xl shadow-black/20"
                />
              )}
              <p className="text-sm font-medium uppercase tracking-widest text-teal-200">
                {(bio.data.headline || "Profile").split(/\s+/).map((word, index) => (
                  <span key={`${word}-${index}`} className="profile-word" aria-hidden="true">
                    {word}
                  </span>
                ))}
              </p>
              <h1
                className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl"
                aria-label={name}
              >
                {name.split(/\s+/).map((word, index) => (
                  <span key={`${word}-${index}`} className="profile-word" aria-hidden="true">
                    {word}
                  </span>
                ))}
              </h1>
              {bio.data.bio && (
                <p className="profile-bio-reveal mt-6 max-w-2xl whitespace-pre-wrap text-lg leading-relaxed text-white/80">
                  {bio.data.bio}
                </p>
              )}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                {extras.data.cv && (
                  <a
                    href={extras.data.cv.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-teal-100"
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
          <Section
            id="experience"
            icon={Briefcase}
            title="Experience"
            speaker={
              <VoiceReaderButton
                section="experience"
                isSpeaking={speakingSection === "experience"}
                onClick={() => toggleSectionSpeech("experience", experienceSpeechText)}
              />
            }
          >
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
          <Section
            id="professional-skills"
            icon={HeartHandshake}
            title="Professional skills"
            speaker={
              <VoiceReaderButton
                section="professional skills"
                isSpeaking={speakingSection === "professional-skills"}
                onClick={() => toggleSectionSpeech("professional-skills", professionalSkillsSpeechText)}
              />
            }
          >
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
          <Section
            id="projects"
            icon={FolderKanban}
            title="Featured projects"
            speaker={
              <VoiceReaderButton
                section="featured projects"
                isSpeaking={speakingSection === "projects"}
                onClick={() => toggleSectionSpeech("projects", projectsSpeechText)}
              />
            }
          >
            <div
              className="flex snap-x snap-proximity gap-6 overflow-x-auto overscroll-x-contain pb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              role="region"
              aria-label="Featured projects, scroll horizontally to see more"
              tabIndex={0}
            >
              {projects.items.map((p) => (
                <article key={p.id} className="w-[85%] min-w-0 shrink-0 snap-start rounded-xl border border-border p-6 md:w-[calc((100%-1.5rem)/2)] [overflow-wrap:anywhere]">
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
                  {(p.problem || p.solution) && (
                    <div className="mt-3">
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-auto px-0 py-1 text-primary hover:bg-transparent hover:underline"
                        aria-expanded={expandedProjects.has(p.id)}
                        aria-controls={`project-details-${p.id}`}
                        onClick={() =>
                          setExpandedProjects((current) => {
                            const next = new Set(current);
                            if (next.has(p.id)) next.delete(p.id);
                            else next.add(p.id);
                            return next;
                          })
                        }
                      >
                        {expandedProjects.has(p.id) ? (
                          <>Hide details <ChevronUp /></>
                        ) : (
                          <>View more details <ChevronDown /></>
                        )}
                      </Button>
                      <div
                        id={`project-details-${p.id}`}
                        className="mt-2"
                        hidden={!expandedProjects.has(p.id)}
                      >
                        {p.problem && (
                          <p className="text-sm text-muted-foreground">
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
                      </div>
                    </div>
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

        {apps.items.length > 0 && (
          <Section id="apps" icon={AppWindow} title="My apps">
            <div className="grid gap-4 sm:grid-cols-2">
              {apps.items.map((app) => (
                <article
                  key={app.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border p-3 sm:gap-4 sm:rounded-xl sm:p-5"
                >
                  <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                    <AppIcon name={app.name} link={app.link} />
                    <h3 className="min-w-0 truncate text-sm font-semibold sm:text-base">{app.name}</h3>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    className="h-9 shrink-0 px-3 sm:px-4"
                  >
                    <a
                    href={app.link}
                    target="_blank"
                    rel="noreferrer"
                    >
                      <Download className="size-4" /> Install
                    </a>
                  </Button>
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

      <footer className="border-t border-border bg-muted/30 py-10">
        <div className="mx-auto grid max-w-4xl gap-8 px-4 sm:grid-cols-2 sm:px-6">
          <div className="space-y-3">
            <a href="#top" className="text-lg font-semibold tracking-tight hover:text-primary">{name}</a>
            <p className="max-w-sm text-sm text-muted-foreground">{bio.data.headline || "Profile and portfolio"}</p>
          </div>
          <nav aria-label="Footer quick navigation">
            <h2 className="mb-3 text-sm font-semibold">Quick navigation</h2>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
              {quickLinks.map((link) => (
                <li key={link.id}>
                  <a href={`#${link.id}`} className="text-muted-foreground hover:text-primary hover:underline">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="mx-auto mt-8 flex max-w-4xl items-center justify-between gap-4 border-t border-border px-4 pt-6 sm:px-6">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} {name}</p>
          <div className="flex gap-4">
            <Link to="/admin-preview" className="text-xs text-muted-foreground hover:underline">
              Admin preview
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function AppIcon({ name, link }: { name: string; link: string }) {
  const [failed, setFailed] = useState(false);
  let iconUrl: string | null = null;
  try {
    const url = new URL(link);
    if (url.protocol === "https:" || url.protocol === "http:") {
      iconUrl = new URL("/favicon.ico", url.origin).href;
    }
  } catch {
    iconUrl = null;
  }

  return (
    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-primary sm:size-12 sm:rounded-xl">
      {iconUrl && !failed ? (
        <img
          src={iconUrl}
          alt=""
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <AppWindow className="size-5 sm:size-6" aria-hidden="true" />
      )}
      <span className="sr-only">{`${name} app icon`}</span>
    </span>
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
      className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-3 py-2 text-sm text-white transition-colors hover:bg-white/10"
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
