const SEPARATOR = /\s*[:\t]\s*|\s{2,}/;

export function textToSpecifications(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s•\-*·]+/, "").trim())
    .filter(Boolean)
    .slice(0, 60);
  if (!lines.length) return [];

  const rows = lines.map((line) => {
    const [label, ...rest] = line.split(SEPARATOR);
    const value = rest.join(": ").trim();
    return value ? { label: label.trim().slice(0, 80), value: value.slice(0, 300) } : null;
  });

  if (rows.every(Boolean)) return [{ title: "Características principales", rows }];
  return [{ title: "Características principales", items: lines.map((line) => line.slice(0, 300)) }];
}

export function specificationsToText(sections) {
  return (sections || [])
    .flatMap((section) => [
      ...(section.rows || []).map((row) => `${row.label}: ${row.value}`),
      ...(section.items || []),
    ])
    .join("\n");
}
