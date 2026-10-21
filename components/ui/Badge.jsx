const styles = {
  sale: "bg-brand-sale text-white",
  trending: "bg-brand-accent text-white",
  new: "bg-brand-success text-white",
  "sold-out": "bg-brand-ink text-white",
  limited: "bg-brand-sand text-brand-ink",
};

export default function Badge({ children, variant = "limited", className = "" }) {
  return (
    <span className={`inline-flex rounded-md px-2.5 py-1 text-[11px] font-semibold tracking-wide ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}
