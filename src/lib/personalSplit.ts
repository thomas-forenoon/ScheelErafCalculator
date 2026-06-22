import type { Participant } from "@/types";
import { allocateByWeights, minutesBetween } from "@/lib/split";

export const SPONSOR_GIFT_CENTS = 10000;
export const REGULAR_BEFORE_GIFT_CENTS = 29060;
export const REGULAR_AFTER_GIFT_CENTS = REGULAR_BEFORE_GIFT_CENTS - SPONSOR_GIFT_CENTS;
export const COCKTAIL_POOL_CENTS = 12280;
export const COCKTAIL_COUNT = 16;
export const SHOT_POOL_CENTS = 11550;
export const SHOT_COUNT = 21;
export const FOOD_POOL_CENTS = 5700;
export const FOOD_EATER_COUNT = 10;
export const TOTAL_BILL_CENTS = 58590;
export const PAYABLE_BILL_CENTS = TOTAL_BILL_CENTS - SPONSOR_GIFT_CENTS;

export type PersonalSplitResult = {
  regularShareCents: number;
  cocktailShareCents: number;
  shotShareCents: number;
  foodShareCents: number;
  totalCents: number;
  prepaidCents: number;
  amountDueCents: number;
  overpaidCents: number;
};

export function calculatePersonalSplit(
  participant: Participant,
  participants: Participant[]
): PersonalSplitResult {
  const isRobbe = participant.name.trim().toLocaleLowerCase("nl-BE") === "robbe";

  if (isRobbe) {
    const prepaidCents = participant.prepaidCents ?? 0;

    return {
      regularShareCents: 0,
      cocktailShareCents: 0,
      shotShareCents: 0,
      foodShareCents: 0,
      totalCents: 0,
      prepaidCents,
      amountDueCents: 0,
      overpaidCents: prepaidCents
    };
  }

  const regularAllocation = allocateByWeights(
    REGULAR_AFTER_GIFT_CENTS,
    participants.map((item) => ({
      id: item.id,
      weight:
        item.name.trim().toLocaleLowerCase("nl-BE") === "robbe"
          ? 0
          : minutesBetween(item.arrivalTime, item.departureTime)
    }))
  );
  const cocktailAmount = clampCount(participant.cocktailAmount, COCKTAIL_COUNT);
  const shotAmount = clampCount(participant.shotAmount, SHOT_COUNT);
  const cocktailShareCents =
    allocateByWeights(COCKTAIL_POOL_CENTS, [
      { id: participant.id, weight: cocktailAmount },
      { id: "rest", weight: Math.max(0, COCKTAIL_COUNT - cocktailAmount) }
    ]).allocations[participant.id] ?? 0;
  const shotShareCents =
    allocateByWeights(SHOT_POOL_CENTS, [
      { id: participant.id, weight: shotAmount },
      { id: "rest", weight: Math.max(0, SHOT_COUNT - shotAmount) }
    ]).allocations[participant.id] ?? 0;
  const foodShareCents =
    participant.foodWeight > 0
      ? allocateByWeights(FOOD_POOL_CENTS, [
          { id: participant.id, weight: 1 },
          { id: "rest", weight: FOOD_EATER_COUNT - 1 }
        ]).allocations[participant.id] ?? 0
      : 0;
  const regularShareCents = regularAllocation.allocations[participant.id] ?? 0;
  const prepaidCents = participant.prepaidCents ?? 0;
  const totalCents = regularShareCents + cocktailShareCents + shotShareCents + foodShareCents;

  return {
    regularShareCents,
    cocktailShareCents,
    shotShareCents,
    foodShareCents,
    totalCents,
    prepaidCents,
    amountDueCents: Math.max(0, totalCents - prepaidCents),
    overpaidCents: Math.max(0, prepaidCents - totalCents)
  };
}

export function buildPersonalCalculationParticipants(
  participant: Participant,
  baselineParticipants: Participant[]
): Participant[] {
  const participantName = normalizeName(participant.name);
  const nameMatchIndex = baselineParticipants.findIndex(
    (item) => normalizeName(item.name) === participantName && participantName !== ""
  );

  if (nameMatchIndex >= 0) {
    return baselineParticipants.map((item, index) =>
      index === nameMatchIndex ? { ...participant } : item
    );
  }

  const fallbackIndex = baselineParticipants.findIndex(
    (item) => normalizeName(item.name) !== "robbe" && !item.giftOnly
  );

  if (fallbackIndex >= 0) {
    return baselineParticipants.map((item, index) =>
      index === fallbackIndex ? { ...participant } : item
    );
  }

  return [{ ...participant }];
}

function clampCount(value: number, max: number): number {
  return Number.isFinite(value) ? Math.min(max, Math.max(0, value)) : 0;
}

function normalizeName(name: string): string {
  return name.trim().toLocaleLowerCase("nl-BE");
}
