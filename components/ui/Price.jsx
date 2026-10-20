export default function Price({ price, offerPrice, currency = "$", className = "" }) {
  const hasDiscount = Number(offerPrice) < Number(price);
  const current = hasDiscount ? Number(offerPrice) : Number(price);
  const discount = hasDiscount ? Math.round((1 - current / Number(price)) * 100) : 0;
  const format = (amount) =>
    `${currency || "$"}${Number(amount || 0).toLocaleString("es-EC", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 ${className}`}>
      <span className="font-semibold text-brand-ink">{format(current)}</span>
      {hasDiscount && (
        <>
          <span className="text-sm text-brand-muted line-through">{format(price)}</span>
          <span className="text-xs font-semibold text-brand-sale">-{discount}%</span>
        </>
      )}
    </div>
  );
}
