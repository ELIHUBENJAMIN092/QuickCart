export default function Container({ children, className = "" }) {
  return <div className={`mx-auto w-full max-w-[1360px] px-5 md:px-8 lg:px-12 ${className}`}>{children}</div>;
}
