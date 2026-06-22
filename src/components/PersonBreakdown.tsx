import { centsToEuro } from "@/lib/split";
import type { PoolCalculation, SplitResult } from "@/types";

type PersonBreakdownProps = {
  result: SplitResult;
};

export default function PersonBreakdown({ result }: PersonBreakdownProps) {
  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-sm sm:p-5">
      <h2 className="mb-4 text-2xl font-semibold text-ink">Berekening per persoon</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        {result.participants.map((split) => (
          <article key={split.participant.id} className="rounded-md border border-line p-4">
            <h3 className="mb-3 text-lg font-semibold text-ink">
              {split.participant.name.trim() || "Naam ontbreekt"}
              {split.participant.name === "Robbe" ? " ❤️" : ""}
            </h3>
            {split.participant.name === "Robbe" ? (
              <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">
                Robbe was heel vroeg weg en hoeft niets te betalen ❤️
              </p>
            ) : null}
            <BreakdownBlock
              title="Normale drank"
              line={formatWeightedLine({
                pool: result.pools.regular,
                weightLabel: `${formatNumber(split.regularWeight)} minuten`,
                totalWeightLabel: `${formatNumber(result.pools.regular.totalWeight)} totale minuten`,
                amountCents: split.regularShareCents
              })}
            />
            <BreakdownBlock
              title="Cocktails"
              line={formatWeightedLine({
                pool: result.pools.cocktail,
                weightLabel: formatUnit(split.cocktailWeight, "cocktail", "cocktails"),
                totalWeightLabel: `${formatNumber(result.pools.cocktail.totalWeight)} totale cocktails`,
                amountCents: split.cocktailShareCents
              })}
            />
            <BreakdownBlock
              title="Shots"
              line={formatWeightedLine({
                pool: result.pools.shot,
                weightLabel: formatUnit(split.shotWeight, "shot", "shots"),
                totalWeightLabel: `${formatNumber(result.pools.shot.totalWeight)} totale shots`,
                amountCents: split.shotShareCents
              })}
            />
            <BreakdownBlock
              title="Eten"
              line={formatWeightedLine({
                pool: result.pools.food,
                weightLabel: `${formatNumber(split.foodWeight)} eetgewicht`,
                totalWeightLabel: `${formatNumber(result.pools.food.totalWeight)} totaal eetgewicht`,
                amountCents: split.foodShareCents
              })}
            />
            <BreakdownBlock
              title="Sponsorcadeau"
              line={centsToEuro(split.sponsorGiftShareCents)}
            />
            <BreakdownBlock title="Aandeel rekening" line={centsToEuro(split.totalCents)} />
            <BreakdownBlock title="Al betaald" line={centsToEuro(split.prepaidCents)} />
            <BreakdownBlock title="Nog te betalen" line={centsToEuro(split.amountDueCents)} strong />
          </article>
        ))}
      </div>
    </section>
  );
}

function BreakdownBlock({
  title,
  line,
  strong = false
}: {
  title: string;
  line: string;
  strong?: boolean;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="font-semibold text-slate-800">{title}:</div>
      <div className={strong ? "font-semibold text-ink" : "text-sm leading-6 text-slate-700"}>
        {line}
      </div>
    </div>
  );
}

function formatWeightedLine({
  pool,
  weightLabel,
  totalWeightLabel,
  amountCents
}: {
  pool: PoolCalculation;
  weightLabel: string;
  totalWeightLabel: string;
  amountCents: number;
}): string {
  if (pool.totalCents > 0 && pool.totalWeight <= 0) {
    return `${centsToEuro(pool.totalCents)} is niet verdeeld, omdat niemand eraan gekoppeld is.`;
  }

  return `${centsToEuro(pool.totalCents)} × ${weightLabel} ÷ ${totalWeightLabel} = ${centsToEuro(
    amountCents
  )}`;
}

function formatUnit(value: number, singular: string, plural: string): string {
  return `${formatNumber(value)} ${value === 1 ? singular : plural}`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("nl-BE", {
    maximumFractionDigits: 2
  }).format(value);
}
