"use client";

import { useEffect, useMemo, useState } from "react";
import CopyIbanButton from "@/components/CopyIbanButton";
import {
  buildPersonalCalculationParticipants,
  calculatePersonalSplit,
  COCKTAIL_COUNT,
  COCKTAIL_POOL_CENTS,
  FOOD_EATER_COUNT,
  FOOD_POOL_CENTS,
  PAYABLE_BILL_CENTS,
  REGULAR_AFTER_GIFT_CENTS,
  SHOT_COUNT,
  SHOT_POOL_CENTS,
  SPONSOR_GIFT_CENTS
} from "@/lib/personalSplit";
import { centsToEuro, euroToCents, minutesBetween } from "@/lib/split";
import {
  createDefaultState,
  LINE_ITEMS,
  PAYMENT_IBAN,
  TICKET_TOTALS,
  VAT_SPLIT
} from "@/lib/seed";
import { clearStoredState, loadStoredState, saveStoredState } from "@/lib/storage";
import type { EventConfig, LineItemCategory, Participant } from "@/types";

type Step = "start" | "gegevens" | "betalen";

type PersonalBreakdownDetails = {
  presenceMinutes: number;
  totalRegularMinutes: number;
  foodSelection: string;
  ateFood: boolean;
};

const CUSTOM_PARTICIPANT_ID = "persoonlijke-invoer";
const defaultState = createDefaultState();
const TIME_HOURS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"));
const TIME_MINUTES = ["00", "15", "30", "45"];

const CATEGORY_LABELS: Record<LineItemCategory, string> = {
  regular: "Normale drank",
  cocktail: "Cocktails",
  shot: "Shots",
  food: "Eten"
};

const EMPTY_PARTICIPANT: Participant = {
  id: CUSTOM_PARTICIPANT_ID,
  name: "Deelnemer",
  isSponsor: false,
  giftOnly: false,
  arrivalTime: defaultState.config.eventStartTime,
  departureTime: defaultState.config.eventEndTime,
  cocktailAmount: 0,
  shotAmount: 0,
  foodWeight: 0,
  ateBitterballen: false,
  ateNachos: false,
  prepaidCents: 0
};

export default function Home() {
  const [step, setStep] = useState<Step>("start");
  const [config, setConfig] = useState<EventConfig>(defaultState.config);
  const [participant, setParticipant] = useState<Participant>(EMPTY_PARTICIPANT);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const storedState = loadStoredState();

      if (storedState) {
        setConfig(storedState.config);
        setParticipant(normalizeParticipant(storedState.participants));
      }

      setHasLoadedStorage(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage) {
      return;
    }

    saveStoredState({ config, participants: [participant] });
  }, [config, hasLoadedStorage, participant]);

  const calculationParticipants = useMemo(
    () => buildPersonalCalculationParticipants(participant, defaultState.participants),
    [participant]
  );
  const selectedSplit = useMemo(
    () => calculatePersonalSplit(participant, calculationParticipants),
    [calculationParticipants, participant]
  );
  const personalBreakdown = useMemo(
    () => buildPersonalBreakdown(participant, calculationParticipants),
    [calculationParticipants, participant]
  );
  const effort = useMemo(() => getEffort(), []);
  const sortedLineItems = useMemo(
    () => [...LINE_ITEMS].sort((a, b) => b.amountCents - a.amountCents),
    []
  );
  function updateSelectedParticipant(patch: Partial<Participant>) {
    setParticipant((currentParticipant) => ({
      ...currentParticipant,
      prepaidCents: currentParticipant.prepaidCents ?? 0,
      ...patch
    }));
  }

  function restart() {
    const nextState = createDefaultState();

    clearStoredState();
    setStep("start");
    setConfig(nextState.config);
    setParticipant({
      ...EMPTY_PARTICIPANT,
      arrivalTime: nextState.config.eventStartTime,
      departureTime: nextState.config.eventEndTime
    });
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f6f8f3] text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-3 py-4 min-[390px]:px-4 sm:py-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-700">Scheel Eraf Calculator</p>
            <h1 className="text-2xl font-semibold leading-tight">Groepsrekening</h1>
          </div>
          <StepPill step={step} />
        </div>

        {step === "start" ? (
          <section className="flex flex-1 flex-col justify-between gap-6 rounded-[1.35rem] bg-white p-4 shadow-sm min-[390px]:rounded-3xl min-[390px]:p-5">
            <div className="space-y-5">
              <div className="rounded-[1.35rem] bg-ink p-5 text-white min-[390px]:rounded-3xl">
                <p className="text-sm font-semibold text-white/70">Totaal op de bonnetjes</p>
                <h2 className="mt-2 text-[2.25rem] font-semibold leading-tight min-[390px]:text-4xl">
                  {centsToEuro(effort.totalCents)}
                </h2>
              </div>

              <div className="grid gap-2 min-[390px]:grid-cols-3 min-[390px]:gap-3">
                <MiniStat label="Ik betaal voor de groep" value={centsToEuro(SPONSOR_GIFT_CENTS)} />
                <MiniStat label="Te verdelen" value={centsToEuro(effort.payableCents)} />
                <MiniStat label="Bonnetjes" value="5" />
              </div>

              <details className="rounded-2xl border border-line bg-paper p-4">
                <summary className="cursor-pointer list-none font-semibold">
                  Toon wat er op de bonnetjes stond
                </summary>
                <div className="mt-4 space-y-2">
                  {sortedLineItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-xl bg-white px-3 py-2 text-sm">
                      <div className="min-w-0">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-slate-500">{CATEGORY_LABELS[item.category]}</p>
                      </div>
                      <div className="min-w-fit text-right">
                        <p className="font-semibold tabular-nums">{centsToEuro(item.amountCents)}</p>
                        <p className="text-slate-500">{item.quantity} stuks</p>
                      </div>
                    </div>
                  ))}
                </div>
              </details>

              <details className="rounded-2xl border border-line bg-paper p-4">
                <summary className="cursor-pointer list-none font-semibold">
                  Toon ticketbedragen en btw
                </summary>
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl bg-white p-3">
                    {TICKET_TOTALS.map((ticket) => (
                      <AmountLine
                        key={ticket.id}
                        label={`Ticket ${ticket.id}`}
                        value={centsToEuro(ticket.amountCents)}
                      />
                    ))}
                  </div>
                  <div className="rounded-xl bg-white p-3">
                    {VAT_SPLIT.map((vat) => (
                      <AmountLine
                        key={vat.rate}
                        label={`Btw ${vat.rate}`}
                        value={centsToEuro(vat.amountCents)}
                      />
                    ))}
                  </div>
                </div>
              </details>
            </div>

            <button
              type="button"
              className="w-full rounded-2xl bg-emerald-700 px-5 py-4 text-base font-semibold text-white shadow-sm hover:bg-emerald-800"
              onClick={() => setStep("gegevens")}
            >
              Verder naar mijn gegevens
            </button>
          </section>
        ) : null}

        {step === "gegevens" ? (
          <section className="rounded-[1.35rem] bg-white p-4 shadow-sm min-[390px]:rounded-3xl min-[390px]:p-5">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-emerald-700">Stap 2</p>
                <h2 className="text-2xl font-semibold leading-tight min-[390px]:text-3xl">Vul je gegevens in</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Vul enkel in wat voor jou klopt. Daarna krijg je meteen je bedrag.
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-full border border-line bg-paper px-3 py-2 text-sm font-semibold"
                onClick={() => setShowExplanation(true)}
              >
                Uitleg
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
                <TimeField
                  label="Aankomst"
                  value={participant.arrivalTime}
                  onChange={(arrivalTime) => updateSelectedParticipant({ arrivalTime })}
                />
                <TimeField
                  label="Vertrek"
                  value={participant.departureTime}
                  onChange={(departureTime) => updateSelectedParticipant({ departureTime })}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
                <NumberField
                  label="Cocktails"
                  value={participant.cocktailAmount}
                  disabled={false}
                  max={COCKTAIL_COUNT}
                  onChange={(cocktailAmount) =>
                    updateSelectedParticipant({
                      cocktailAmount: parseCount(cocktailAmount, COCKTAIL_COUNT)
                    })
                  }
                />
                <NumberField
                  label="Shots"
                  value={participant.shotAmount}
                  disabled={false}
                  max={SHOT_COUNT}
                  onChange={(shotAmount) =>
                    updateSelectedParticipant({ shotAmount: parseCount(shotAmount, SHOT_COUNT) })
                  }
                />
              </div>

              <div className="rounded-2xl border border-line bg-white p-4">
                <label className="flex min-w-0 items-center justify-between gap-4">
                  <span className="min-w-0">
                    <span className="block font-semibold">Eten</span>
                    <span className="mt-1 block text-sm leading-5 text-slate-600">
                      Vink dit aan als je van de bitterballen of nacho&apos;s hebt meegegeten.
                    </span>
                  </span>
                  <input
                    className="h-6 w-6 shrink-0 accent-emerald-700"
                    type="checkbox"
                    checked={participant.foodWeight > 0}
                    onChange={(event) => {
                      const checked = event.target.checked;

                      updateSelectedParticipant({
                        foodWeight: checked ? 1 : 0,
                        ateBitterballen: checked,
                        ateNachos: checked
                      });
                    }}
                  />
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-semibold">Al iets gegeven?</span>
                <MoneyInput
                  key={participant.id}
                  valueCents={participant.prepaidCents ?? 0}
                  onChange={(prepaidCents) => updateSelectedParticipant({ prepaidCents })}
                />
                <span className="text-xs text-slate-500">
                  Contant of via overschrijving, als je al iets gegeven hebt.
                </span>
              </label>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 min-[360px]:grid-cols-[auto_1fr]">
              <button
                type="button"
                className="rounded-2xl border border-line px-5 py-4 font-semibold"
                onClick={() => setStep("start")}
              >
                Terug
              </button>
              <button
                type="button"
                className="rounded-2xl bg-emerald-700 px-5 py-4 font-semibold text-white hover:bg-emerald-800 disabled:bg-slate-300"
                onClick={() => setStep("betalen")}
              >
                Toon mijn bedrag
              </button>
            </div>
          </section>
        ) : null}

        {step === "betalen" ? (
          <section className="flex flex-1 flex-col justify-between gap-6 rounded-[1.35rem] bg-white p-4 shadow-sm min-[390px]:rounded-3xl min-[390px]:p-5">
            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold text-emerald-700">Stap 3</p>
                <h2 className="text-2xl font-semibold leading-tight min-[390px]:text-3xl">Dit is jouw bedrag.</h2>
              </div>

              <div className="rounded-[1.35rem] bg-ink p-5 text-white min-[390px]:rounded-3xl">
                <p className="text-sm font-semibold text-white/70">Nog te storten</p>
                <p className="mt-2 text-[2.55rem] font-semibold leading-tight min-[390px]:text-5xl">
                  {centsToEuro(selectedSplit.amountDueCents)}
                </p>
                <p className="mt-3 text-base text-white/80">
                  Stort dit bedrag naar het rekeningnummer hieronder.
                </p>
              </div>

              <div className="rounded-[1.35rem] border border-emerald-200 bg-emerald-50 p-4 min-[390px]:rounded-3xl">
                <p className="text-sm font-semibold text-emerald-800">Rekeningnummer</p>
                <p className="mt-2 select-all break-all rounded-2xl bg-white px-3 py-4 text-xl font-semibold tracking-normal min-[390px]:px-4 min-[390px]:text-2xl">
                  {PAYMENT_IBAN}
                </p>
                <CopyIbanButton iban={PAYMENT_IBAN} className="mt-3" />
              </div>

              <div className="grid gap-2">
                <AmountCard label="Aandeel rekening" value={centsToEuro(selectedSplit.totalCents)} />
                <AmountCard label="Al gegeven" value={centsToEuro(selectedSplit.prepaidCents)} />
                <AmountCard label="Nog te storten" value={centsToEuro(selectedSplit.amountDueCents)} strong />
              </div>

              <details className="rounded-2xl border border-line bg-paper p-4">
                <summary className="cursor-pointer list-none font-semibold">
                  Toon volledige berekening
                </summary>
                <DetailedBreakdown
                  split={selectedSplit}
                  details={personalBreakdown}
                  participant={participant}
                />
              </details>
            </div>

            <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-[auto_1fr]">
              <button
                type="button"
                className="rounded-2xl border border-line px-5 py-4 font-semibold"
                onClick={() => setStep("gegevens")}
              >
                Aanpassen
              </button>
              <button
                type="button"
                className="rounded-2xl bg-paper px-5 py-4 font-semibold"
                onClick={restart}
              >
                Opnieuw
              </button>
            </div>
          </section>
        ) : null}

        {showExplanation ? (
          <CalculationModal onClose={() => setShowExplanation(false)} />
        ) : null}
      </div>
    </main>
  );
}

function StepPill({ step }: { step: Step }) {
  const label = step === "start" ? "1 / 3" : step === "gegevens" ? "2 / 3" : "3 / 3";

  return (
    <div className="shrink-0 rounded-full bg-white px-3 py-1 text-sm font-semibold shadow-sm">{label}</div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-paper p-3 min-[390px]:block min-[390px]:p-4">
      <p className="min-w-0 text-sm font-medium leading-snug text-slate-600">{label}</p>
      <p className="min-w-0 whitespace-nowrap text-right text-xl font-semibold leading-tight tabular-nums min-[390px]:mt-1 min-[390px]:text-left min-[390px]:text-[1.35rem]">
        {value}
      </p>
    </div>
  );
}

function TimeField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const { hours, minutes } = splitTime(value);

  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold">{label}</span>
      <div className="grid grid-cols-[1fr_1fr] gap-2 rounded-2xl border border-line bg-white p-2 focus-within:border-emerald-700">
        <select
          className="rounded-xl bg-paper px-3 py-3 text-center font-semibold outline-none"
          value={hours}
          onChange={(event) => onChange(`${event.target.value}:${minutes}`)}
        >
          {TIME_HOURS.map((hour) => (
            <option key={hour} value={hour}>
              {hour} u
            </option>
          ))}
        </select>
        <select
          className="rounded-xl bg-paper px-3 py-3 text-center font-semibold outline-none"
          value={minutes}
          onChange={(event) => onChange(`${hours}:${event.target.value}`)}
        >
          {TIME_MINUTES.map((minute) => (
            <option key={minute} value={minute}>
              {minute}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

function NumberField({
  label,
  value,
  disabled,
  max,
  onChange
}: {
  label: string;
  value: number;
  disabled: boolean;
  max: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold">{label}</span>
      <input
        className="w-full rounded-2xl border border-line bg-white px-4 py-4 text-right outline-none focus:border-emerald-700 disabled:bg-slate-100"
        type="number"
        min="0"
        max={max}
        step="1"
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function MoneyInput({
  valueCents,
  onChange
}: {
  valueCents: number;
  onChange: (valueCents: number) => void;
}) {
  const [value, setValue] = useState(valueCents > 0 ? formatEuroInput(valueCents) : "");

  return (
    <div className="flex rounded-2xl border border-line bg-white focus-within:border-emerald-700">
      <span className="px-4 py-4 font-semibold text-slate-500">€</span>
      <input
        className="w-full rounded-r-2xl bg-transparent px-2 py-4 text-right outline-none"
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          onChange(euroToCents(event.target.value));
        }}
        onBlur={() => {
          const cents = euroToCents(value);

          setValue(cents > 0 ? formatEuroInput(cents) : "");
          onChange(cents);
        }}
        placeholder="0,00"
      />
    </div>
  );
}

function DetailedBreakdown({
  split,
  details,
  participant
}: {
  split: ReturnType<typeof calculatePersonalSplit>;
  details: PersonalBreakdownDetails;
  participant: Participant;
}) {
  return (
    <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
      <DetailBlock
        title="Normale drank"
        value={centsToEuro(split.regularShareCents)}
        lines={[
          `Te verdelen pot: ${centsToEuro(REGULAR_AFTER_GIFT_CENTS)}.`,
          `Jouw aanwezigheid: ${details.presenceMinutes} minuten.`,
          `Totale aanwezigheid van de groep: ${details.totalRegularMinutes} minuten.`,
          `${centsToEuro(REGULAR_AFTER_GIFT_CENTS)} × ${details.presenceMinutes} ÷ ${
            details.totalRegularMinutes
          } = ${centsToEuro(split.regularShareCents)}.`
        ]}
      />

      <DetailBlock
        title="Cocktails"
        value={centsToEuro(split.cocktailShareCents)}
        lines={[
          `Cocktailpot: ${centsToEuro(COCKTAIL_POOL_CENTS)} voor ${COCKTAIL_COUNT} cocktails.`,
          `Jij vulde ${participant.cocktailAmount} cocktail${
            participant.cocktailAmount === 1 ? "" : "s"
          } in.`,
          `${centsToEuro(COCKTAIL_POOL_CENTS)} × ${participant.cocktailAmount} ÷ ${COCKTAIL_COUNT} = ${centsToEuro(
            split.cocktailShareCents
          )}.`
        ]}
      />

      <DetailBlock
        title="Shots"
        value={centsToEuro(split.shotShareCents)}
        lines={[
          `Shotpot: ${centsToEuro(SHOT_POOL_CENTS)} voor ${SHOT_COUNT} shots.`,
          `Jij vulde ${participant.shotAmount} shot${participant.shotAmount === 1 ? "" : "s"} in.`,
          `${centsToEuro(SHOT_POOL_CENTS)} × ${participant.shotAmount} ÷ ${SHOT_COUNT} = ${centsToEuro(
            split.shotShareCents
          )}.`
        ]}
      />

      <DetailBlock
        title="Eten"
        value={centsToEuro(split.foodShareCents)}
        lines={[
          `Eten op de bonnetjes: bitterballen ${centsToEuro(3500)} + nacho's ${centsToEuro(
            2200
          )} = ${centsToEuro(FOOD_POOL_CENTS)}.`,
          `Jouw keuze: ${details.foodSelection}.`,
          details.ateFood
            ? `Je telt mee als 1 eter van ${FOOD_EATER_COUNT}.`
            : "Je telt niet mee als eter.",
          details.ateFood
            ? `${centsToEuro(FOOD_POOL_CENTS)} × 1 ÷ ${FOOD_EATER_COUNT} = ${centsToEuro(
                split.foodShareCents
              )}.`
            : `Geen bitterballen of nacho's aangeduid = ${centsToEuro(0)}.`
        ]}
      />

      <DetailBlock
        title="Totaal"
        value={centsToEuro(split.amountDueCents)}
        lines={[
          `Aandeel rekening: ${centsToEuro(split.regularShareCents)} + ${centsToEuro(
            split.cocktailShareCents
          )} + ${centsToEuro(split.shotShareCents)} + ${centsToEuro(
            split.foodShareCents
          )} = ${centsToEuro(split.totalCents)}.`,
          `Al gegeven: ${centsToEuro(split.prepaidCents)}.`,
          `Nog te storten: ${centsToEuro(split.totalCents)} - ${centsToEuro(
            split.prepaidCents
          )} = ${centsToEuro(split.amountDueCents)}.`,
          "Afronding gebeurt per pot in cents, zodat de potten exact blijven kloppen."
        ]}
      />
    </div>
  );
}

function DetailBlock({
  title,
  value,
  lines
}: {
  title: string;
  value: string;
  lines: string[];
}) {
  return (
    <section className="min-w-0 rounded-2xl bg-white p-3">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
        <h3 className="min-w-0 font-semibold text-ink">{title}</h3>
        <span className="min-w-fit whitespace-nowrap font-semibold tabular-nums text-ink">
          {value}
        </span>
      </div>
      <div className="mt-2 space-y-1">
        {lines.map((line, index) => (
          <p key={`${title}-${index}`} className="min-w-0 break-words text-slate-600">
            {line}
          </p>
        ))}
      </div>
    </section>
  );
}

function CalculationModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 p-3 sm:place-items-center">
      <section className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-700">Uitleg</p>
            <h2 className="text-2xl font-semibold">Zo wordt het bedrag verdeeld</h2>
          </div>
          <button
            type="button"
            className="rounded-full bg-paper px-3 py-2 text-sm font-semibold"
            onClick={onClose}
          >
            Sluiten
          </button>
        </div>

        <div className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
          <p>
            De rekening is {centsToEuro(58590)}. De traktatie van{" "}
            {centsToEuro(SPONSOR_GIFT_CENTS)} gaat daar eerst af. De groep verdeelt dus{" "}
            {centsToEuro(PAYABLE_BILL_CENTS)}.
          </p>
          <ExplanationRow
            title="Normale drank"
            amount={centsToEuro(REGULAR_AFTER_GIFT_CENTS)}
            text="Wordt verdeeld volgens je aankomst- en vertrektijd."
          />
          <ExplanationRow
            title="Cocktails"
            amount={centsToEuro(12280)}
            text={`Wordt verdeeld per ingevulde cocktail. Er staan ${COCKTAIL_COUNT} cocktails op de bonnetjes.`}
          />
          <ExplanationRow
            title="Shots"
            amount={centsToEuro(11550)}
            text={`Wordt verdeeld per ingevulde shot. Er staan ${SHOT_COUNT} shots op de bonnetjes.`}
          />
          <ExplanationRow
            title="Eten"
            amount={centsToEuro(FOOD_POOL_CENTS)}
            text={`Als je bitterballen of nacho's aanvinkt, betaal je 1 van ${FOOD_EATER_COUNT} delen.`}
          />
          <p>
            Wat je al contant of via overschrijving gaf, gaat helemaal op het einde van je
            bedrag af.
          </p>
        </div>
      </section>
    </div>
  );
}

function ExplanationRow({
  title,
  amount,
  text
}: {
  title: string;
  amount: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl bg-paper p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-ink">{title}</h3>
        <span className="font-semibold tabular-nums text-ink">{amount}</span>
      </div>
      <p className="mt-1">{text}</p>
    </div>
  );
}

function AmountCard({
  label,
  value,
  strong = false
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-2xl px-4 py-3 ${
        strong ? "bg-emerald-50 text-emerald-950" : "bg-paper"
      }`}
    >
      <span className="min-w-0 font-medium">{label}</span>
      <span className="min-w-fit whitespace-nowrap font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function AmountLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-1">
      <span className="min-w-0 text-slate-600">{label}</span>
      <span className="min-w-fit whitespace-nowrap font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function parseCount(value: string, max: number): number {
  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) ? Math.min(max, Math.max(0, parsed)) : 0;
}

function getEffort() {
  const totalCents = LINE_ITEMS.reduce((sum, item) => sum + item.amountCents, 0);
  const totalQuantity = LINE_ITEMS.reduce((sum, item) => sum + item.quantity, 0);

  return {
    totalCents,
    payableCents: totalCents - SPONSOR_GIFT_CENTS,
    totalQuantity,
    regularQuantity: sumQuantity("regular"),
    cocktailQuantity: sumQuantity("cocktail"),
    shotQuantity: sumQuantity("shot"),
    foodQuantity: sumQuantity("food")
  };
}

function sumQuantity(category: LineItemCategory): number {
  return LINE_ITEMS.filter((item) => item.category === category).reduce(
    (sum, item) => sum + item.quantity,
    0
  );
}

function buildPersonalBreakdown(
  participant: Participant,
  calculationParticipants: Participant[]
): PersonalBreakdownDetails {
  const totalRegularMinutes = calculationParticipants.reduce((sum, item) => {
    const isFreeParticipant = item.name.trim().toLocaleLowerCase("nl-BE") === "robbe";

    return isFreeParticipant ? sum : sum + minutesBetween(item.arrivalTime, item.departureTime);
  }, 0);
  const ateFood = participant.foodWeight > 0;

  return {
    presenceMinutes: minutesBetween(participant.arrivalTime, participant.departureTime),
    totalRegularMinutes,
    foodSelection: ateFood ? "eten aangeduid" : "geen eten",
    ateFood
  };
}

function normalizeParticipant(storedParticipants: Participant[]): Participant {
  const storedParticipant =
    storedParticipants.find((storedItem) => storedItem.id === CUSTOM_PARTICIPANT_ID) ??
    storedParticipants.find((storedItem) => storedItem.name.trim()) ??
    EMPTY_PARTICIPANT;
  const foodWeight = toSimpleFoodWeight(storedParticipant.foodWeight);
  const ateBitterballen = storedParticipant.ateBitterballen ?? foodWeight > 0;
  const ateNachos = storedParticipant.ateNachos ?? foodWeight > 0;

  return {
    ...EMPTY_PARTICIPANT,
    ...storedParticipant,
    id: CUSTOM_PARTICIPANT_ID,
    name: EMPTY_PARTICIPANT.name,
    isSponsor: false,
    giftOnly: false,
    ateBitterballen,
    ateNachos,
    foodWeight: ateBitterballen || ateNachos ? 1 : 0,
    prepaidCents: storedParticipant.prepaidCents ?? 0
  };
}

function toSimpleFoodWeight(value: number): 0 | 1 {
  return value > 0 ? 1 : 0;
}

function splitTime(value: string): { hours: string; minutes: string } {
  const [rawHours = "15", rawMinutes = "30"] = value.split(":");
  const hours = TIME_HOURS.includes(rawHours) ? rawHours : "15";
  const minutes = TIME_MINUTES.includes(rawMinutes) ? rawMinutes : "30";

  return { hours, minutes };
}

function formatEuroInput(cents: number): string {
  return new Intl.NumberFormat("nl-BE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(cents / 100);
}
