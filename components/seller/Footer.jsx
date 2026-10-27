export default function Footer() {
  return (
    <footer className="mt-auto border-t border-brand-line bg-white px-4 py-4 md:px-8">
      <div className="flex flex-col items-center justify-between gap-1 text-center text-[11px] text-brand-muted sm:flex-row sm:text-left">
        <p>© {new Date().getFullYear()} COMPEL · Panel de administración</p>
        <p className="hidden sm:block">Gestión de catálogo, contenido y ventas</p>
      </div>
    </footer>
  );
}
