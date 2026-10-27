const markers = [" para ", " una ", " cada ", " que "];

function splitTitle(title) {
  const source = String(title || "").trim();
  if (!source) return ["", ""];

  const [explicit, ...rest] = source.split("|");
  if (rest.length) return [explicit.trim(), rest.join("|").trim()];

  const lower = source.toLowerCase();
  for (const marker of markers) {
    const index = lower.indexOf(marker);
    if (index > 0) {
      return [source.slice(0, index).trim(), source.slice(index + 1).trim()];
    }
  }
  return [source, ""];
}

export default function TwoToneTitle({ title, className = "" }) {
  const [first, second] = splitTitle(title);

  return (
    <h1 className={`font-display font-bold leading-[0.94] tracking-[-0.045em] text-brand-ink ${className}`}>
      <span className="block">{first}</span>
      {second && <span className="block text-brand-accent">{second}</span>}
    </h1>
  );
}
