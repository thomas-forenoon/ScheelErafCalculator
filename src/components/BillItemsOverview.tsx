import { VAT_SPLIT, TICKET_TOTALS } from "@/lib/seed";
import { centsToEuro } from "@/lib/split";
import type { LineItem, LineItemCategory } from "@/types";

const CATEGORY_LABELS: Record<LineItemCategory, string> = {
  regular: "Normale drank",
  cocktail: "Cocktails",
  shot: "Shots",
  food: "Eten"
};

type BillItemsOverviewProps = {
  lineItems: LineItem[];
};

export default function BillItemsOverview({ lineItems }: BillItemsOverviewProps) {
  const sortedItems = [...lineItems].sort((a, b) => b.amountCents - a.amountCents);
  const totalCents = lineItems.reduce((sum, item) => sum + item.amountCents, 0);
  const totalQuantity = lineItems.reduce((sum, item) => sum + item.quantity, 0);
  const regularQuantity = sumQuantity(lineItems, "regular");
  const cocktailQuantity = sumQuantity(lineItems, "cocktail");
  const shotQuantity = sumQuantity(lineItems, "shot");
  const foodQuantity = sumQuantity(lineItems, "food");

  return (
    <section className="rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-5 space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          De prestatie
        </p>
        <h2 className="text-2xl font-semibold text-ink">Wat hebben we samen verzet?</h2>
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          Felicitaties, ploeg. Over vijf bonnetjes heen kwamen we aan deze gezamenlijke
          inspanning: veel Cristal, genoeg shots, een stevige Aperol-inbreng en ook
          wat hapjes erbij.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <EffortTile label="Alles samen" value={String(totalQuantity)} helper={centsToEuro(totalCents)} />
        <EffortTile label="Gewone drankjes" value={String(regularQuantity)} helper="voor de tijdsverdeling" />
        <EffortTile label="Cocktails" value={String(cocktailQuantity)} helper="apart verdeeld" />
        <EffortTile label="Shots" value={String(shotQuantity)} helper="apart verdeeld" />
        <EffortTile label="Hapjes" value={String(foodQuantity)} helper="voor de balans" />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_0.8fr]">
        <details className="group rounded-2xl border border-line bg-paper p-4" open>
          <summary className="cursor-pointer list-none text-lg font-semibold text-ink">
            Volledige lijst drank en eten
            <span className="ml-2 text-sm font-medium text-slate-500 group-open:hidden">
              tonen
            </span>
            <span className="ml-2 hidden text-sm font-medium text-slate-500 group-open:inline">
              verbergen
            </span>
          </summary>
          <p className="mt-2 text-sm text-slate-600">
            Cristal en Cristal 33cl blijven apart, omdat ze zo apart op de bonnetjes stonden.
          </p>
          <div className="mt-4 grid gap-2 md:hidden">
            {sortedItems.map((item) => (
              <div key={item.id} className="rounded-xl bg-white px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-ink">{item.name}</div>
                    <div className="text-sm text-slate-600">{CATEGORY_LABELS[item.category]}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold tabular-nums text-ink">
                      {centsToEuro(item.amountCents)}
                    </div>
                    <div className="text-sm text-slate-600">{item.quantity} stuks</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 hidden overflow-x-auto rounded-xl border border-line md:block">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead className="bg-white text-slate-700">
                <tr>
                  <th className="px-3 py-2 font-semibold">Item</th>
                  <th className="px-3 py-2 text-right font-semibold">Aantal</th>
                  <th className="px-3 py-2 text-right font-semibold">Bedrag</th>
                  <th className="px-3 py-2 font-semibold">Categorie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-white">
                {sortedItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 font-medium text-ink">{item.name}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{item.quantity}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {centsToEuro(item.amountCents)}
                    </td>
                    <td className="px-3 py-2">{CATEGORY_LABELS[item.category]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>

        <div className="grid gap-3">
          <details className="group rounded-2xl border border-line bg-paper p-4">
            <summary className="cursor-pointer list-none text-lg font-semibold text-ink">
              Ticketbedragen
              <span className="ml-2 text-sm font-medium text-slate-500 group-open:hidden">
                tonen
              </span>
              <span className="ml-2 hidden text-sm font-medium text-slate-500 group-open:inline">
                verbergen
              </span>
            </summary>
            <dl className="mt-4 divide-y divide-line rounded-xl bg-white">
              {TICKET_TOTALS.map((ticket) => (
                <AmountRow
                  key={ticket.id}
                  label={`Ticket ${ticket.id}`}
                  value={centsToEuro(ticket.amountCents)}
                />
              ))}
              <AmountRow label="Totaal" value={centsToEuro(totalCents)} strong />
            </dl>
          </details>

          <details className="group rounded-2xl border border-line bg-paper p-4">
            <summary className="cursor-pointer list-none text-lg font-semibold text-ink">
              Btw-verdeling
              <span className="ml-2 text-sm font-medium text-slate-500 group-open:hidden">
                tonen
              </span>
              <span className="ml-2 hidden text-sm font-medium text-slate-500 group-open:inline">
                verbergen
              </span>
            </summary>
            <dl className="mt-4 divide-y divide-line rounded-xl bg-white">
              {VAT_SPLIT.map((vat) => (
                <AmountRow
                  key={vat.rate}
                  label={`Btw ${vat.rate}`}
                  value={centsToEuro(vat.amountCents)}
                />
              ))}
              <AmountRow
                label="Totaal"
                value={centsToEuro(VAT_SPLIT.reduce((sum, vat) => sum + vat.amountCents, 0))}
                strong
              />
            </dl>
          </details>
        </div>
      </div>
    </section>
  );
}

function EffortTile({
  label,
  value,
  helper
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl bg-paper p-4">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{helper}</p>
    </div>
  );
}

function AmountRow({
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
      <dd className={strong ? "font-semibold tabular-nums text-ink" : "tabular-nums text-ink"}>
        {value}
      </dd>
    </div>
  );
}

function sumQuantity(lineItems: LineItem[], category: LineItemCategory): number {
  return lineItems
    .filter((item) => item.category === category)
    .reduce((sum, item) => sum + item.quantity, 0);
}
