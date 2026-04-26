export default function PageHeader({ title, description, children }) {
  return (
    <div className="flex justify-between items-end flex-wrap gap-4">
      <div>
        <h1 className="text-3xl font-bold font-display text-white tracking-tight">{title}</h1>
        {description && (
          <p className="text-slate-400 text-sm mt-1.5">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
