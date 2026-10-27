const styles = {
  sale: "bg-brand-sale text-white",
  trending: "bg-brand-accent text-white",
  new: "bg-brand-success text-white",
  "sold-out": "bg-brand-ink text-white",
  limited: "bg-brand-sand text-brand-ink",
};

export default function Badge({ children, variant = "limited", className = "" }) {
  return (
    <span className={`inline-flex px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}
