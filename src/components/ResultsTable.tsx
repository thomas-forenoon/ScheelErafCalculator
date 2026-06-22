import CopyIbanButton from "@/components/CopyIbanButton";
import { centsToEuro } from "@/lib/split";
import { PAYMENT_IBAN } from "@/lib/seed";
import type { SplitResult } from "@/types";

type ResultsTableProps = {
  result: SplitResult;
};

export default function ResultsTable({ result }: ResultsTableProps) {
  return (
    <section className="rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-5 space-y-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Stap 2
          </p>
          <h2 className="text-2xl font-semibold text-ink">Resultaat per persoon</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <SummaryTile label="Rekening verdeeld" value={centsToEuro(result.participantTotalCents)} />
          <SummaryTile label="Al betaald" value={centsToEuro(result.prepaidTotalCents)} />
          <SummaryTile label="Nog te betalen" value={centsToEuro(result.amountDueTotalCents)} strong />
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
          <p className="text-sm font-semibold uppercase tracking-wide">Betaling</p>
          <div className="mt-2 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
            <div>
              <p className="text-xl font-semibold">Betaal je openstaande bedrag naar:</p>
              <p className="mt-2 select-all rounded-xl border border-emerald-200 bg-white px-4 py-3 text-2xl font-semibold tracking-normal text-ink">
                {PAYMENT_IBAN}
              </p>
            </div>
            <CopyIbanButton iban={PAYMENT_IBAN} className="lg:pt-8" />
          </div>
          {result.overpaidTotalCents > 0 ? (
            <p className="mt-2 text-sm">
              Er staat {centsToEuro(result.overpaidTotalCents)} als te veel betaald.
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 md:hidden">
        {result.participants.map((split) => (
          <article
            key={split.participant.id}
            className={`rounded-2xl border p-4 ${
              split.isFreeParticipant ? "border-rose-200 bg-rose-50" : "border-line bg-white"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-ink">
                  {split.participant.name.trim() || "Naam ontbreekt"}
                </h3>
                <p className="text-sm text-slate-600">{split.presenceMinutes} minuten aanwezig</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Nog te betalen
                </p>
                <p className="text-2xl font-semibold text-ink">
                  {centsToEuro(split.amountDueCents)}
                </p>
              </div>
            </div>
            {split.participant.name === "Robbe" ? (
              <p className="mt-3 rounded-xl border border-rose-200 bg-white/70 px-3 py-2 text-sm font-semibold text-rose-800">
                Robbe was heel vroeg weg en hoeft niets te betalen ❤️
              </p>
            ) : null}
            <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <ResultPair label="Aandeel" value={centsToEuro(split.totalCents)} />
              <ResultPair label="Al betaald" value={centsToEuro(split.prepaidCents)} />
              <ResultPair label="Drank" value={centsToEuro(split.regularShareCents)} />
              <ResultPair label="Cocktails" value={centsToEuro(split.cocktailShareCents)} />
              <ResultPair label="Shots" value={centsToEuro(split.shotShareCents)} />
              <ResultPair label="Eten" value={centsToEuro(split.foodShareCents)} />
            </dl>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-md border border-line md:block">
        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
          <thead className="bg-paper text-slate-700">
            <tr>
              <th className="px-3 py-2 font-semibold">Naam</th>
              <th className="px-3 py-2 text-right font-semibold">Tijd aanwezig</th>
              <th className="px-3 py-2 text-right font-semibold">Normale drank</th>
              <th className="px-3 py-2 text-right font-semibold">Cocktails</th>
              <th className="px-3 py-2 text-right font-semibold">Shots</th>
              <th className="px-3 py-2 text-right font-semibold">Eten</th>
              <th className="px-3 py-2 text-right font-semibold">Sponsorcadeau</th>
              <th className="px-3 py-2 text-right font-semibold">Aandeel rekening</th>
              <th className="px-3 py-2 text-right font-semibold">Al betaald</th>
              <th className="px-3 py-2 text-right font-semibold">Nog te betalen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white">
            {result.participants.map((split) => (
              <tr
                key={split.participant.id}
                className={
                  split.isFreeParticipant
                    ? "bg-rose-50/80"
                    : split.participant.isSponsor
                      ? "bg-emerald-50/60"
                      : ""
                }
              >
                <td className="px-3 py-2 font-medium text-ink">
                  {split.participant.name.trim() || "Naam ontbreekt"}
                  {split.participant.name === "Robbe" ? " ❤️" : ""}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {split.presenceMinutes} min
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {centsToEuro(split.regularShareCents)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {centsToEuro(split.cocktailShareCents)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {centsToEuro(split.shotShareCents)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {centsToEuro(split.foodShareCents)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {centsToEuro(split.sponsorGiftShareCents)}
                </td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums text-ink">
                  {centsToEuro(split.totalCents)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {centsToEuro(split.prepaidCents)}
                </td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums text-ink">
                  {centsToEuro(split.amountDueCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SummaryTile({
  label,
  value,
  strong = false
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className={strong ? "rounded-2xl bg-ink p-4 text-white" : "rounded-2xl bg-paper p-4"}>
      <p className={strong ? "text-sm font-medium text-white/75" : "text-sm font-medium text-slate-600"}>
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function ResultPair({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/80 px-3 py-2">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 font-semibold tabular-nums text-ink">{value}</dd>
    </div>
  );
}
