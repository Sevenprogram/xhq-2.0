type StatCardProps = {
  label: string;
  value: number | string;
  accent?: "teal" | "coral" | "gold" | "ink";
};

const accentMap = {
  teal: "border-l-teal",
  coral: "border-l-coral",
  gold: "border-l-gold",
  ink: "border-l-ink"
};

export function StatCard({ label, value, accent = "teal" }: StatCardProps) {
  return (
    <section className={`panel border-l-4 ${accentMap[accent]} p-4`}>
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-ink">{value}</div>
    </section>
  );
}
