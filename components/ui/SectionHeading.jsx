export default function SectionHeading({ eyebrow, title, description, link }) {
  return (
    <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-muted">{eyebrow}</p>}
        <h2 className="font-display text-3xl tracking-tight text-brand-ink md:text-4xl">{title}</h2>
        {description && <p className="mt-3 text-sm leading-6 text-brand-muted">{description}</p>}
      </div>
      {link}
    </div>
  );
}
