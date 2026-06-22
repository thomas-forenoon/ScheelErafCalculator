import { euroToCents, isFreeParticipant } from "@/lib/split";
import { FOOD_OPTIONS, NAME_OPTIONS } from "@/lib/seed";
import type { EventConfig, FoodWeight, Participant } from "@/types";

const CUSTOM_NAME_VALUE = "__custom__";

type ParticipantsEditorProps = {
  config: EventConfig;
  participants: Participant[];
  copyStatus: string;
  onChange: (participants: Participant[]) => void;
  onCopy: () => void;
  onExport: () => void;
  onReset: () => void;
};

export default function ParticipantsEditor({
  config,
  participants,
  copyStatus,
  onChange,
  onCopy,
  onExport,
  onReset
}: ParticipantsEditorProps) {
  function updateParticipant(id: string, patch: Partial<Participant>) {
    onChange(
      participants.map((participant) => {
        if (participant.id !== id) {
          return participant;
        }

        return {
          ...participant,
          prepaidCents: participant.prepaidCents ?? 0,
          ...patch
        };
      })
    );
  }

  function updateSponsor(id: string, checked: boolean) {
    onChange(
      participants.map((participant) => ({
        ...participant,
        prepaidCents: participant.prepaidCents ?? 0,
        isSponsor: checked
          ? participant.id === id
          : participant.id === id
            ? false
            : participant.isSponsor
      }))
    );
  }

  function updateName(id: string, value: string) {
    const participant = participants.find((item) => item.id === id);

    if (!participant) {
      return;
    }

    if (value === CUSTOM_NAME_VALUE) {
      updateParticipant(id, {
        name: NAME_OPTIONS.includes(participant.name) ? "" : participant.name
      });
      return;
    }

    if (value === "Robbe") {
      updateParticipant(id, {
        name: "Robbe",
        isSponsor: false,
        giftOnly: true,
        arrivalTime: "15:30",
        departureTime: "16:00",
        cocktailAmount: 0,
        shotAmount: 0,
        foodWeight: 0,
        prepaidCents: 0
      });
      return;
    }

    updateParticipant(id, {
      name: value,
      giftOnly: participant.name === "Robbe" ? false : participant.giftOnly
    });
  }

  function updateGiftOnly(id: string, checked: boolean) {
    updateParticipant(
      id,
      checked
        ? {
            giftOnly: true,
            cocktailAmount: 0,
            shotAmount: 0,
            foodWeight: 0
          }
        : { giftOnly: false }
    );
  }

  function addParticipant() {
    const nextNumber = participants.length + 1;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `participant-${Date.now()}`;

    onChange([
      ...participants,
      {
        id,
        name: `Persoon ${nextNumber}`,
        isSponsor: false,
        giftOnly: false,
        arrivalTime: config.eventStartTime,
        departureTime: config.eventEndTime,
        cocktailAmount: 0,
        shotAmount: 0,
        foodWeight: 0,
        prepaidCents: 0
      }
    ]);
  }

  function removeParticipant(id: string) {
    onChange(participants.filter((participant) => participant.id !== id));
  }

  return (
    <section className="rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-5 space-y-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Stap 1
          </p>
          <h2 className="text-2xl font-semibold text-ink">Deelnemers</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            Kies een naam, vul aankomst en vertrek in en noteer meteen wat al contant of via
            overschrijving betaald is.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap">
          <button
            type="button"
            className="rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700"
            onClick={addParticipant}
          >
            Deelnemer toevoegen
          </button>
          <button
            type="button"
            className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink hover:bg-paper"
            onClick={onReset}
          >
            Reset naar standaard
          </button>
          <button
            type="button"
            className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink hover:bg-paper"
            onClick={onCopy}
          >
            Resultaat kopiëren
          </button>
          <button
            type="button"
            className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink hover:bg-paper"
            onClick={onExport}
          >
            Exporteren als CSV
          </button>
        </div>
      </div>

      {copyStatus ? (
        <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
          {copyStatus}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {participants.map((participant, index) => {
          const freeParticipant = isFreeParticipant(participant);

          return (
            <article
              key={participant.id}
              className={`rounded-2xl border p-4 shadow-sm ${
                freeParticipant
                  ? "border-rose-200 bg-rose-50"
                  : participant.isSponsor
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-line bg-white"
              }`}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Deelnemer {index + 1}
                  </p>
                  <h3 className="text-lg font-semibold text-ink">
                    {participant.name.trim() || "Naam ontbreekt"}
                  </h3>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                  onClick={() => removeParticipant(participant.id)}
                >
                  Verwijderen
                </button>
              </div>

              <div className="grid gap-3">
                <label className="grid gap-1.5">
                  <span className="text-sm font-semibold text-slate-700">Naam</span>
                  <select
                    aria-label="Naam"
                    className="w-full rounded-xl border border-line bg-white px-3 py-3 text-base outline-none focus:border-emerald-600"
                    value={nameSelectValue(participant.name)}
                    onChange={(event) => updateName(participant.id, event.target.value)}
                  >
                    {NAME_OPTIONS.map((name, optionIndex) => (
                      <option key={`${name}-${optionIndex}`} value={name}>
                        {name}
                      </option>
                    ))}
                    <option value={CUSTOM_NAME_VALUE}>Eigen naam invullen</option>
                  </select>
                </label>

                {nameSelectValue(participant.name) === CUSTOM_NAME_VALUE ? (
                  <label className="grid gap-1.5">
                    <span className="text-sm font-semibold text-slate-700">Eigen naam</span>
                    <input
                      aria-label="Eigen naam"
                      className="w-full rounded-xl border border-line bg-white px-3 py-3 text-base outline-none focus:border-emerald-600"
                      value={participant.name}
                      onChange={(event) =>
                        updateParticipant(participant.id, { name: event.target.value })
                      }
                    />
                  </label>
                ) : null}

                {participant.name === "Robbe" ? (
                  <div className="rounded-xl border border-rose-200 bg-white/70 px-3 py-3 text-sm font-semibold text-rose-800">
                    Robbe was heel vroeg weg en hoeft niets te betalen ❤️
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-3">
                  <ToggleField
                    label="Sponsor"
                    checked={participant.isSponsor}
                    disabled={participant.name === "Robbe"}
                    onChange={(checked) => updateSponsor(participant.id, checked)}
                  />
                  <ToggleField
                    label="Alleen cadeau"
                    checked={freeParticipant}
                    disabled={participant.name === "Robbe"}
                    onChange={(checked) => updateGiftOnly(participant.id, checked)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1.5">
                    <span className="text-sm font-semibold text-slate-700">Aankomst</span>
                    <input
                      aria-label="Aankomst"
                      className="w-full rounded-xl border border-line bg-white px-3 py-3 outline-none focus:border-emerald-600"
                      type="time"
                      value={participant.arrivalTime}
                      onChange={(event) =>
                        updateParticipant(participant.id, { arrivalTime: event.target.value })
                      }
                    />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-sm font-semibold text-slate-700">Vertrek</span>
                    <input
                      aria-label="Vertrek"
                      className="w-full rounded-xl border border-line bg-white px-3 py-3 outline-none focus:border-emerald-600"
                      type="time"
                      value={participant.departureTime}
                      onChange={(event) =>
                        updateParticipant(participant.id, { departureTime: event.target.value })
                      }
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <NumberField
                    label="Aantal cocktails"
                    value={freeParticipant ? 0 : participant.cocktailAmount}
                    disabled={freeParticipant}
                    step="1"
                    onChange={(value) =>
                      updateParticipant(participant.id, { cocktailAmount: parseCount(value) })
                    }
                  />
                  <NumberField
                    label="Aantal shots"
                    value={freeParticipant ? 0 : participant.shotAmount}
                    disabled={freeParticipant}
                    step="1"
                    onChange={(value) =>
                      updateParticipant(participant.id, { shotAmount: parseCount(value) })
                    }
                  />
                </div>

                <label className="grid gap-1.5">
                  <span className="text-sm font-semibold text-slate-700">Eten</span>
                  <select
                    aria-label="Eten"
                    className="w-full rounded-xl border border-line bg-white px-3 py-3 outline-none focus:border-emerald-600 disabled:bg-slate-100 disabled:text-slate-500"
                    disabled={freeParticipant}
                    value={freeParticipant ? 0 : participant.foodWeight}
                    onChange={(event) =>
                      updateParticipant(participant.id, {
                        foodWeight: parseFoodWeight(event.target.value)
                      })
                    }
                  >
                    {FOOD_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1.5">
                  <span className="text-sm font-semibold text-slate-700">Al betaald</span>
                  <div className="flex rounded-xl border border-line bg-white focus-within:border-emerald-600">
                    <span className="px-3 py-3 font-semibold text-slate-500">€</span>
                    <input
                      aria-label="Al betaald"
                      className="w-full rounded-r-xl bg-transparent px-2 py-3 text-right outline-none"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={participant.prepaidCents ? (participant.prepaidCents / 100).toFixed(2) : ""}
                      onChange={(event) =>
                        updateParticipant(participant.id, {
                          prepaidCents: euroToCents(event.target.value)
                        })
                      }
                      placeholder="0,00"
                    />
                  </div>
                </label>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ToggleField({
  label,
  checked,
  disabled = false,
  onChange
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-3 py-3 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      <input
        aria-label={label}
        className="h-5 w-5 accent-emerald-700 disabled:opacity-50"
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  disabled,
  step,
  onChange
}: {
  label: string;
  value: number;
  disabled: boolean;
  step: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        aria-label={label}
        className="w-full rounded-xl border border-line bg-white px-3 py-3 text-right outline-none focus:border-emerald-600 disabled:bg-slate-100 disabled:text-slate-500"
        type="number"
        min="0"
        step={step}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function nameSelectValue(name: string): string {
  return NAME_OPTIONS.includes(name) ? name : CUSTOM_NAME_VALUE;
}

function parseCount(value: string): number {
  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function parseFoodWeight(value: string): FoodWeight {
  const parsed = Number.parseFloat(value);

  if (parsed === 0.5 || parsed === 1 || parsed === 1.5) {
    return parsed;
  }

  return 0;
}
