export default function SectionHeading({ eyebrow, title, description, link }) {
  return (
    <div className="mb-10 flex flex-col gap-5 md:mb-12 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        {eyebrow && <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-accent">{eyebrow}</p>}
        <h2 className="font-display text-3xl leading-[0.98] text-brand-ink md:text-5xl">{title}</h2>
        {description && <p className="mt-4 max-w-2xl text-sm leading-7 text-brand-muted md:text-base">{description}</p>}
      </div>
      {link && <div className="shrink-0 text-[12px] font-semibold uppercase tracking-[0.14em]">{link}</div>}
    </div>
  );
}
