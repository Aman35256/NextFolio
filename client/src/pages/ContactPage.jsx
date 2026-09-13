import { ArrowLeft, ArrowUpRight, Code2, Link2, Mail, PhoneCall } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/NextFolioLogo.png';
import profilePhoto from '../assets/RishiProfile.jpg';
import { useResumeStore } from '../store';
import { normalizeResumeForPortfolio } from '../features/themes/resumeThemeData';

const CONTACT_DETAILS = {
  name: 'Rishi Singh Shandilya',
  email: 'rishisingh.shandilya@gmail.com',
  github: 'github.com/Rishi472',
  linkedin: 'linkedin.com/in/rishisinghshandilya',
};

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
      className="group rounded-2xl border border-indigo-100 bg-white p-6 shadow-soft-md transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-soft-lg"
    >
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25">
          <Icon className="h-6 w-6" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-slate-500">{label}</span>
          <span className="mt-1 block break-words text-lg font-bold text-slate-950">{value}</span>
          <span className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-indigo-600">
            {action}
            <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </span>
      </div>
    </a>
  );
}

export default function ContactPage() {
  const navigate = useNavigate();
  const resumeData = useResumeStore((state) => state.resumeData || state);
  const resume = useMemo(() => normalizeResumeForPortfolio(resumeData), [resumeData]);
  const contact = {
    ...resume,
    name: CONTACT_DETAILS.name,
    email: CONTACT_DETAILS.email,
    phone: CONTACT_DETAILS.phone,
    github: CONTACT_DETAILS.github,
    linkedin: CONTACT_DETAILS.linkedin,
  };

  const contactOptions = [
    contact.email && {
      action: 'Send mail',
      href: `mailto:${contact.email}`,
      Icon: Mail,
      label: 'Email',
      value: contact.email,
    },
    contact.phone && {
      action: 'Call now',
      href: phoneHref(contact.phone),
      Icon: PhoneCall,
      label: 'Contact Number',
      value: contact.phone,
    },
    contact.linkedin && {
      action: 'Visit LinkedIn',
      external: true,
      href: profileUrl(contact.linkedin, 'https://www.linkedin.com/in/'),
      Icon: Link2,
      label: 'LinkedIn',
      value: contact.linkedin,
    },
    contact.github && {
      action: 'Visit GitHub',
      external: true,
      href: profileUrl(contact.github, 'https://github.com/'),
      Icon: Code2,
      label: 'GitHub',
      value: contact.github,
    },
  ].filter((option) => option && option.href);

  return (
    <main className="min-h-screen bg-gradient-subtle text-slate-900">
      <header className="border-b border-indigo-100 bg-white/80 px-6 py-4 shadow-soft-sm backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Builder
          </button>
          <div className="group relative" tabIndex={0} aria-label="NextFolio logo">
            <img
              src={logo}
              alt="Nextfolio"
              className="h-12 w-44 rounded-xl bg-white object-cover p-1 shadow-sm"
            />
            <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 px-3 py-2 text-xs font-bold uppercase tracking-wide text-white opacity-0 shadow-xl shadow-indigo-500/30 ring-1 ring-white/40 transition-opacity duration-200 group-hover:opacity-100 group-focus:opacity-100">
              BUILD TODAY. IMPRESS TOMORROW.
            </span>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_22rem]">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-indigo-600">Contact</p>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight text-slate-950 md:text-6xl">
              Contact {contact.name} directly.
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Choose any contact option below. Email opens a mail draft, phone opens the call option, and social links open the matching profile.
            </p>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-1 shadow-2xl shadow-indigo-500/25">
            <img
              src={profilePhoto}
              alt={contact.name}
              className="h-[26rem] w-full rounded-[1.3rem] bg-white object-cover object-top"
            />
          </div>
        </div>

        {contactOptions.length > 0 ? (
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {contactOptions.map((option) => (
              <ContactCard key={option.label} {...option} />
            ))}
          </div>
        ) : (
          <div className="mt-12 rounded-2xl border border-indigo-100 bg-white p-8 text-slate-600 shadow-soft-md">
            Add email, phone, LinkedIn, or GitHub details in Personal Info to show contact options here.
          </div>
        )}
      </section>
    </main>
  );
}
