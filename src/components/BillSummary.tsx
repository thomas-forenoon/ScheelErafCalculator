import { centsToEuro } from "@/lib/split";
import type { EventConfig, SplitResult } from "@/types";

type BillSummaryProps = {
  config: EventConfig;
  result: SplitResult;
  onConfigChange: (config: EventConfig) => void;
};

export default function BillSummary({
  config,
  result,
  onConfigChange
}: BillSummaryProps) {
  const sponsorNames = result.participants
    .filter((split) => split.participant.isSponsor)
    .map((split) => split.participant.name.trim() || "Naam ontbreekt");
  const sponsorLabel =
    sponsorNames.length === 0
      ? "Niet geselecteerd"
      : sponsorNames.length === 1
        ? sponsorNames[0]
        : sponsorNames.join(", ");
  const totalIsCorrect = result.isBalanced;

  return (
    <section className="rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Rekening
        </p>
        <h2 className="text-2xl font-semibold text-ink">Controle verdeling</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_1.35fr]">
        <div className="grid gap-3 sm:grid-cols-2">
          <SummaryValue label="Totaalbedrag" value={centsToEuro(result.totalBillCents)} />
          <SummaryValue label="Sponsor" value={sponsorLabel} />
          <SummaryValue label="Sponsorcadeau" value={centsToEuro(result.sponsorGiftCents)} />
          <SummaryValue label="Al betaald" value={centsToEuro(result.prepaidTotalCents)} />
          <SummaryValue label="Nog te betalen" value={centsToEuro(result.amountDueTotalCents)} />
          <label className="rounded-md border border-line bg-paper p-3">
            <span className="block text-sm font-medium text-slate-600">Starttijd</span>
            <input
              className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-base font-semibold text-ink outline-none focus:border-emerald-600"
              type="time"
              value={config.eventStartTime}
              onChange={(event) =>
                onConfigChange({ ...config, eventStartTime: event.target.value })
              }
            />
          </label>
          <label className="rounded-md border border-line bg-paper p-3">
            <span className="block text-sm font-medium text-slate-600">Eindtijd</span>
            <input
              className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-base font-semibold text-ink outline-none focus:border-emerald-600"
              type="time"
              value={config.eventEndTime}
              onChange={(event) =>
                onConfigChange({ ...config, eventEndTime: event.target.value })
              }
            />
          </label>
        </div>

        <div className="rounded-md border border-line">
          <div className="flex flex-col gap-2 border-b border-line p-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-ink">Controle per pot</h3>
            <span
              className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-semibold ${
                totalIsCorrect
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {totalIsCorrect ? "Totaal klopt" : "Totaal klopt niet"}
            </span>
          </div>
          <dl className="divide-y divide-line text-sm">
            <CheckRow label="Sponsorcadeau" value={centsToEuro(result.sponsorGiftCents)} />
            <CheckRow
              label="Normale drank na cadeau"
              value={centsToEuro(result.regularAfterGiftCents)}
            />
            <CheckRow label="Cocktails" value={centsToEuro(result.cocktailPoolCents)} />
            <CheckRow label="Shots" value={centsToEuro(result.shotPoolCents)} />
            <CheckRow label="Eten" value={centsToEuro(result.foodPoolCents)} />
            <CheckRow label="Totaal" value={centsToEuro(result.poolCheckCents)} strong />
          </dl>
        </div>
      </div>

      {result.warnings.length > 0 ? (
        <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-950">
          <h3 className="font-semibold">Waarschuwingen</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {result.warnings.map((warning, index) => (
              <li key={`${warning.code}-${index}`}>{warning.message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.unallocatedCents > 0 ? (
        <div className="mt-4 rounded-md border border-slate-300 bg-slate-50 p-4 text-sm text-slate-800">
          Niet-toegewezen bedrag: {centsToEuro(result.unallocatedCents)}. De controle telt
          deelnemerstotalen plus dit bedrag mee.
        </div>
      ) : null}
    </section>
  );
}

function SummaryValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-paper p-3">
      <dt className="text-sm font-medium text-slate-600">{label}</dt>
      <dd className="mt-2 break-words text-xl font-semibold text-ink">{value}</dd>
    </div>
  );
}

function CheckRow({
  label,
  value,
  strong = false
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 px-3 py-2">
      <dt className={strong ? "font-semibold text-ink" : "text-slate-700"}>{label}</dt>
      <dd className={strong ? "font-semibold text-ink" : "font-medium text-ink"}>{value}</dd>
    </div>
  );
}
