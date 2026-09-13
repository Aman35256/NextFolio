import { ArrowUpRight, BriefcaseBusiness, Check, Code2, Copy, Mail, MapPin, PhoneCall, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useResumeStore } from '../../store';
import { useUIStore } from '../../store';
import { getPortfolioLayout } from './layoutTokens';
import { portfolioPaletteVars } from './paletteTokens';
import { EMPTY_PORTFOLIO_MESSAGE, hasPortfolioData, normalizeResumeForPortfolio } from './resumeThemeData';

function MagicButton({ children, href, onClick }) {
  const content = (
    <span className="relative inline-flex h-12 min-w-48 overflow-hidden rounded-lg p-px focus:outline-none">
      <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,var(--portfolio-accent)_0%,var(--portfolio-primary)_50%,var(--portfolio-accent)_100%)]" />
      <span className="inline-flex h-full w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-6 text-sm font-medium text-white backdrop-blur-3xl">
        {children}
      </span>
    </span>
  );

  if (href) {
    return (
      <a href={href} onClick={onClick}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick}>
      {content}
    </button>
  );
}

function findScrollParent(element) {
  let current = element?.parentElement;

  while (current) {
    const { overflowY } = window.getComputedStyle(current);
    if (/(auto|scroll)/.test(overflowY) && current.scrollHeight > current.clientHeight) {
      return current;
    }
    current = current.parentElement;
  }

  return null;
}

function scrollToHash(hash, root = document) {
  if (typeof document === 'undefined' || !hash?.startsWith('#')) return false;

  const target = root?.querySelector?.(hash) || document.getElementById(hash.slice(1));
  if (!target) return false;

  const scrollParent = findScrollParent(target);
  if (scrollParent) {
    const parentTop = scrollParent.getBoundingClientRect().top;
    const targetTop = target.getBoundingClientRect().top;
    scrollParent.scrollTo({
      top: scrollParent.scrollTop + targetTop - parentTop - 24,
      behavior: 'smooth',
    });
  } else {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (typeof window !== 'undefined') {
    window.history.replaceState(null, '', hash);
  }

  return true;
}

function handleSectionLink(event, href, root) {
  if (!href?.startsWith('#')) return;
  event.preventDefault();
  scrollToHash(href, root);
}

function FloatingNav({ onNavigate }) {
  const items = [
    ['About', '#about'],
    ['Projects', '#projects'],
    ['Skills', '#skills'],
    ['Contact', '#contact'],
  ];

  return (
    <nav className="sticky top-4 z-30 mx-auto mb-8 flex w-fit max-w-[90vw] items-center gap-1 rounded-full border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-white/80 shadow-2xl backdrop-blur">
      {items.map(([label, href]) => (
        <a
          key={href}
          href={href}
          onClick={(event) => onNavigate(event, href)}
          className="rounded-full px-3 py-1.5 hover:bg-white/10 hover:text-white"
        >
          {label}
        </a>
      ))}
    </nav>
  );
}

function Hero({ resume, onNavigate }) {
  return (
    <section className="relative flex min-h-[86vh] items-center justify-center overflow-hidden rounded-b-[2rem]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,color-mix(in_srgb,var(--portfolio-secondary)_38%,transparent),transparent_28%),radial-gradient(circle_at_80%_20%,color-mix(in_srgb,var(--portfolio-primary)_28%,transparent),transparent_30%),linear-gradient(180deg,#050816_0%,#06091f_100%)]" />
      <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_18%,#050816_72%)]" />

      <div className="relative z-10 flex max-w-5xl flex-col items-center px-6 text-center">
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.45em] text-blue-100/80">
          Dynamic Nextfolio Theme
        </p>
        <h1 className="max-w-4xl text-4xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
          {resume.name}
        </h1>
        {resume.summary && (
          <p className="mt-6 max-w-3xl text-sm leading-7 text-slate-200 md:text-lg">
            {resume.summary}
          </p>
        )}
        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <MagicButton href="#projects" onClick={(event) => onNavigate(event, '#projects')}>
            Show my work <ArrowUpRight className="h-4 w-4" />
          </MagicButton>
          {resume.email && (
            <MagicButton href="#contact" onClick={(event) => onNavigate(event, '#contact')}>
              Contact me <Mail className="h-4 w-4" />
            </MagicButton>
          )}
        </div>
      </div>
    </section>
  );
}

function BentoCard({ className = '', children }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl border border-white/10 bg-[#10132e] p-6 shadow-2xl ${className}`}>
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_10%,rgba(203,172,249,0.35),transparent_28%),radial-gradient(circle_at_90%_70%,rgba(59,130,246,0.22),transparent_26%)]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function projectStatus(project = {}) {
  const source = `${project.status || ''} ${project.date || ''}`.toLowerCase();

  if (/\b(done|completed|complete|finished|shipped|launched)\b/.test(source)) return 'Completed';
  if (/\b(present|current|ongoing|running|active|progress|working)\b/.test(source)) return 'Running';
  return 'Completed';
}

function projectDateScore(project = {}, index = 0) {
  const source = [
    project.status,
    project.date,
    project.title,
    project.description,
  ].filter(Boolean).join(' ');

  if (/\b(present|current|ongoing|running|active|progress|working)\b/i.test(source)) {
    return 1_000_000_000_000 + index;
  }

  const dateMatches = [...source.matchAll(/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{4}|\b\d{4}\b/gi)];
  if (!dateMatches.length) return index;

  const latestDate = dateMatches.at(-1)?.[0] || '';
  const parsedDate = Date.parse(latestDate.length === 4 ? `Dec 31 ${latestDate}` : latestDate);

  return Number.isNaN(parsedDate) ? index : parsedDate;
}

function latestProject(projects = []) {
  return (projects
    .map((project, index) => ({ project, score: projectDateScore(project, index) }))
    .sort((a, b) => b.score - a.score))[0]?.project;
}

function AboutGrid({ resume, layoutStyle }) {
  const highlightedSkills = resume.skills.slice(0, 8);
  const currentProject = latestProject(resume.projects);
  const currentProjectStatus = currentProject ? projectStatus(currentProject) : '';
  const isCompact = layoutStyle === 'compact';
  const isGrid = layoutStyle === 'grid';

  return (
    <section id="about" className={isCompact ? 'py-12' : 'py-20'}>
      <div className={`grid grid-cols-1 gap-4 md:grid-cols-6 ${isGrid ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} ${isCompact ? 'lg:gap-4' : 'lg:gap-8'}`}>
        <BentoCard className={`md:col-span-6 ${isGrid ? 'lg:col-span-2' : 'lg:col-span-3'} ${isCompact ? 'min-h-[16rem]' : 'min-h-[24rem]'} flex items-end`}>
          <div>
            <p className="text-sm text-[#c1c2d3]">About</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold text-white md:text-4xl">
              {resume.summary || `${resume.name} builds thoughtful digital experiences.`}
            </h2>
          </div>
        </BentoCard>

        <BentoCard className={`md:col-span-3 lg:col-span-2 ${isCompact ? 'min-h-[12rem]' : 'min-h-[16rem]'}`}>
          <p className="text-sm text-[#c1c2d3]">Location</p>
          <div className="mt-6 flex items-center gap-3 text-2xl font-bold text-white">
            <MapPin className="h-7 w-7 text-[var(--portfolio-accent)]" />
            {resume.location || 'Available remotely'}
          </div>
        </BentoCard>

        <BentoCard className={`md:col-span-3 lg:col-span-2 ${isCompact ? 'min-h-[12rem]' : 'min-h-[16rem]'}`}>
          <p className="text-sm text-[#c1c2d3]">I constantly improve</p>
          <h2 className="mt-2 text-3xl font-bold text-white">My tech stack</h2>
          <div className="mt-6 grid grid-cols-2 gap-2">
            {highlightedSkills.length > 0 ? highlightedSkills.map((skill) => (
              <span key={skill} className="rounded-lg bg-[#161a31] px-3 py-2 text-center text-xs text-white/80 md:text-sm">
                {skill}
              </span>
            )) : (
              <span className="col-span-2 text-sm text-white/60">Skills will appear here after resume creation.</span>
            )}
          </div>
        </BentoCard>

        {resume.education.length > 0 && (
          <BentoCard className="md:col-span-3 lg:col-span-2 min-h-[12rem]">
            <p className="text-sm text-[#c1c2d3]">Education</p>
            <div className="space-y-4 mt-3">
              {resume.education.map((edu, idx) => (
                <div key={idx}>
                  <h2 className="text-2xl font-bold text-white">
                    {edu?.school || edu?.degree}
                  </h2>
                  {[edu?.degree, edu?.timeline, edu?.result].filter(Boolean).map((detail) => (
                    <p key={detail} className="mt-2 text-white/70">{detail}</p>
                  ))}
                </div>
              ))}
            </div>
          </BentoCard>
        )}

        <BentoCard className={`${isGrid ? 'md:col-span-3 lg:col-span-2' : 'md:col-span-3'} ${isCompact ? 'min-h-[12rem]' : 'min-h-[16rem]'}`}>
          <p className="text-sm text-[#c1c2d3]">The inside scoop</p>
          {currentProject && (
            <span className="mt-3 inline-flex rounded-full border border-[var(--portfolio-accent)]/40 bg-[var(--portfolio-accent)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--portfolio-accent)]">
              {currentProjectStatus}
            </span>
          )}
          <h2 className="mt-3 text-3xl font-bold text-white">
            {currentProject ? `Latest project: ${currentProject.title}` : 'Projects will appear as users add them'}
          </h2>
          {currentProject?.date && <p className="mt-3 text-sm font-medium text-white/60">{currentProject.date}</p>}
          {currentProject?.description && <p className="mt-4 text-sm leading-6 text-white/70">{currentProject.description}</p>}
        </BentoCard>

        <BentoCard className="md:col-span-3 lg:col-span-2 min-h-[12rem] flex items-center justify-center text-center">
          {resume.email ? (
            <CopyEmail email={resume.email} />
          ) : (
            <p className="text-white/70">Add an email to enable contact actions.</p>
          )}
        </BentoCard>
      </div>
    </section>
  );
}

function CopyEmail({ email }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard?.writeText(email);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div>
      <h2 className="mb-5 text-2xl font-bold text-white">Do you want to start a project together?</h2>
      <MagicButton onClick={copy}>
        {copied ? 'Email copied' : 'Copy email'} {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </MagicButton>
    </div>
  );
}

function Projects({ projects, layout }) {
  if (!projects.length) return null;

  return (
    <section className={layout.section} id="projects">
      <h2 className="text-center text-4xl font-bold text-white md:text-5xl">
        A Small Section of <span className="text-[var(--portfolio-accent)]">Recent Projects</span>
      </h2>
      <div className={`mt-12 grid ${layout.grid} ${layout.gap}`}>
        {projects.map((project, index) => (
          <article 
            key={project.id} 
            className="group rounded-3xl border border-white/10 bg-[#10132e] p-5 shadow-2xl transition hover:-translate-y-1 cursor-pointer"
            onClick={() => {
              if (project.githubLink) {
                window.open(project.githubLink, '_blank');
              } else if (project.demoLink) {
                window.open(project.demoLink, '_blank');
              } else if (project.link) {
                window.open(project.link, '_blank');
              }
            }}
          >
            <div className="relative mb-7 flex h-56 items-center justify-center overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_50%_10%,rgba(203,172,249,0.42),transparent_32%),linear-gradient(135deg,#13162d,#06091f)]">
              <span className="text-7xl font-black text-white/10">{String(index + 1).padStart(2, '0')}</span>
            <Sparkles className="absolute right-7 top-7 h-7 w-7 text-[var(--portfolio-accent)]" />
            </div>
            <h3 className="text-2xl font-bold text-white">{project.title}</h3>
            {project.description && <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/70">{project.description}</p>}
            {project.link && (
              <a href={project.link} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--portfolio-accent)]">
                Check live site <ArrowUpRight className="h-4 w-4" />
              </a>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function ExperienceAndSkills({ resume, layout }) {
  const cards = resume.skills.map((skill, index) => ({
    id: `skill-${index}-${skill}`,
    title: skill,
  }));

  if (!cards.length) return null;

  return (
    <section className={layout.section} id="skills">
      <h2 className="text-center text-4xl font-bold text-white md:text-5xl">
        MY <span className="text-[var(--portfolio-accent)]">Skill Set</span>
      </h2>
      <div className={`mt-12 grid grid-cols-1 ${layout.grid} ${layout.gap}`}>
        {cards.map((card) => {
          return (
            <article key={card.id} className="rounded-2xl border border-white/10 bg-[#10132e] p-px">
              <div className="rounded-2xl bg-[#06091f] p-6 md:p-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#161a31]">
                    <Code2 className="h-7 w-7 text-[var(--portfolio-accent)]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white md:text-2xl">{card.title}</h3>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function profileUrl(value, baseUrl) {
  const profile = typeof value === 'string' ? value.trim() : '';
  if (!profile) return '';
  if (/^https?:\/\//i.test(profile)) return profile;
  if (profile.includes('.')) return `https://${profile}`;
  return `${baseUrl}${profile.replace(/^@/, '')}`;
}

function phoneHref(phone) {
  const dialable = typeof phone === 'string' ? phone.replace(/[^\d+]/g, '') : '';
  return dialable ? `tel:${dialable}` : '';
}

function ContactCard({ action, external = false, href, Icon, label, value }) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className="group rounded-2xl border border-white/10 bg-[#10132e] p-px transition hover:-translate-y-1 hover:border-[var(--portfolio-accent)]"
    >
      <div className="flex h-full items-center gap-4 rounded-2xl bg-[#06091f] p-5 md:p-6">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#161a31]">
          <Icon className="h-7 w-7 text-[var(--portfolio-accent)]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm text-white/60">{label}</span>
          <span className="mt-1 block break-words text-lg font-bold text-white">{value}</span>
          <span className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[var(--portfolio-accent)]">
            {action} <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </span>
      </div>
    </a>
  );
}

function Footer({ resume }) {
  const contactOptions = [
    resume.email && {
      action: 'Send email',
      href: `mailto:${resume.email}`,
      Icon: Mail,
      label: 'Email',
      value: resume.email,
    },
    resume.phone && {
      action: 'Call now',
      href: phoneHref(resume.phone),
      Icon: PhoneCall,
      label: 'Mobile',
      value: resume.phone,
    },
    resume.linkedin && {
      action: 'Open LinkedIn',
      external: true,
      href: profileUrl(resume.linkedin, 'https://www.linkedin.com/in/'),
      Icon: BriefcaseBusiness,
      label: 'LinkedIn',
      value: resume.linkedin,
    },
    resume.github && {
      action: 'Open GitHub',
      external: true,
      href: profileUrl(resume.github, 'https://github.com/'),
      Icon: Code2,
      label: 'GitHub',
      value: resume.github,
    },
  ].filter((option) => option && option.href);

  return (
    <footer id="contact" className="scroll-mt-24 min-h-[82vh] pb-12 pt-20">
      <div className="flex flex-col items-center text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--portfolio-accent)]">
          Contact Me
        </p>
        <h2 className="max-w-3xl text-4xl font-bold text-white md:text-5xl">
          Ready to take <span className="text-[var(--portfolio-accent)]">your</span> digital presence to the next level?
        </h2>
        <p className="my-6 max-w-2xl text-white/70">
          Choose the easiest way to reach me. Each option opens the correct contact channel.
        </p>
        {contactOptions.length > 0 ? (
          <div className="mt-8 grid w-full max-w-5xl grid-cols-1 gap-4 text-left sm:grid-cols-2">
            {contactOptions.map((option) => (
              <ContactCard key={option.label} {...option} />
            ))}
          </div>
        ) : (
          <p className="mt-8 text-white/60">Contact details will appear here after resume creation.</p>
        )}
      </div>
      <div className="mt-14 flex flex-col items-center justify-between gap-5 text-sm text-white/60 md:flex-row">
        <p>{resume.name ? `Copyright © ${new Date().getFullYear()} ${resume.name}` : ''}</p>
      </div>
    </footer>
  );
}

export default function PortfolioThemeModern() {
  const portfolioRef = useRef(null);
  const resumeData = useResumeStore((state) => state.resumeData || state);
  const colorPalette = useUIStore((state) => state.colorPalette);
  const layoutStyle = useUIStore((state) => state.layoutStyle);
  const layout = getPortfolioLayout(layoutStyle);
  const resume = useMemo(() => normalizeResumeForPortfolio(resumeData), [resumeData]);
  const navigateToSection = (event, href) => handleSectionLink(event, href, portfolioRef.current);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.location.hash) return undefined;

    const frame = window.requestAnimationFrame(() => {
      scrollToHash(window.location.hash, portfolioRef.current);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [resume]);

  if (!hasPortfolioData(resume)) {
    return (
      <div className="min-h-full bg-[#06091f] flex items-center justify-center p-6 text-center text-white/70">
        <p className="text-lg">{EMPTY_PORTFOLIO_MESSAGE}</p>
      </div>
    );
  }

  return (
    <main ref={portfolioRef} className="relative mx-auto flex min-h-full flex-col items-center bg-[#06091f] px-5 text-white sm:px-10" style={portfolioPaletteVars(colorPalette)}>
      <div className={`w-full ${layout.inner}`}>
        <FloatingNav onNavigate={navigateToSection} />
        <Hero resume={resume} onNavigate={navigateToSection} />
        <AboutGrid resume={resume} layoutStyle={layoutStyle} />
        <Projects projects={resume.projects} layout={layout} />
        <ExperienceAndSkills resume={resume} layout={layout} />
        <Footer resume={resume} />
      </div>
    </main>
  );
}
