interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function SectionCard({ title, children, className = '' }: SectionCardProps) {
  return (
    <section className={`bg-white rounded-xl border border-slate-200 p-4 ${className}`}>
      <h2 className="text-lg font-semibold text-slate-900 mb-3">{title}</h2>
      {children}
    </section>
  );
}
