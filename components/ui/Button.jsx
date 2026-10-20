import Link from "next/link";

const variants = {
  primary: "bg-brand-accent text-white hover:bg-brand-accent-hover",
  secondary: "border border-brand-ink text-brand-ink hover:bg-brand-ink hover:text-white",
  ghost: "text-brand-ink hover:bg-brand-sand",
  link: "text-brand-accent underline-offset-4 hover:underline",
};

export default function Button({
  children,
  variant = "primary",
  className = "",
  href,
  ...props
}) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-colors ${variants[variant]} ${className}`;
  if (href) {
    return <Link href={href} className={classes}>{children}</Link>;
  }
  return <button className={classes} {...props}>{children}</button>;
}
