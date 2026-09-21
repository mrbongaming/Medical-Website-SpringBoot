export function PageTitle({ eyebrow = 'BỆNH VIỆN ĐA KHOA AN TÂM', title, description, children }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-brand-900 sm:[&_h1]:text-4xl [&_p]:mt-2 [&_p]:max-w-3xl [&_p]:text-slate-600">
      <div>
        <span className="mb-2 inline-block text-xs font-bold uppercase tracking-[0.16em] text-sky-700">
          {eyebrow}
        </span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children}
    </div>
  );
}
