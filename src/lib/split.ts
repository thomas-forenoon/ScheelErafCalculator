import type {
  AllocationResult,
  EventConfig,
  FoodWeight,
  LineItem,
  LineItemCategory,
  Participant,
  PoolCalculation,
  PoolKey,
  SplitResult,
  SplitWarning
} from "@/types";

const POOL_LABELS: Record<PoolKey, string> = {
  regular: "Gemeenschappelijke drank",
  cocktail: "Cocktails",
  shot: "Shots",
  food: "Eten",
  sponsorGift: "Sponsorcadeau"
};

const CATEGORY_TO_POOL: Record<LineItemCategory, Exclude<PoolKey, "sponsorGift">> = {
  regular: "regular",
  cocktail: "cocktail",
  shot: "shot",
  food: "food"
};

export function isFreeParticipant(participant: Pick<Participant, "name" | "giftOnly">): boolean {
  return participant.giftOnly || participant.name.trim().toLocaleLowerCase("nl-BE") === "robbe";
}

export function euroToCents(value: string | number): number {
  if (typeof value === "number") {
    return Math.round(value * 100);
  }

  const cleaned = value
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  if (!cleaned) {
    return 0;
  }

  const sign = cleaned.startsWith("-") ? -1 : 1;
  const unsigned = cleaned.replace("-", "");
  const [wholePart = "0", decimalPart = ""] = unsigned.split(".");
  const euros = Number.parseInt(wholePart, 10) || 0;
  const cents = Number.parseInt(decimalPart.padEnd(2, "0").slice(0, 2), 10) || 0;

  return sign * (euros * 100 + cents);
}

export function centsToEuro(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const absolute = Math.abs(cents);
  const euros = Math.floor(absolute / 100);
  const centsPart = String(absolute % 100).padStart(2, "0");

  return `${sign}€${euros.toLocaleString("nl-BE")},${centsPart}`;
}

export function minutesBetween(startHHmm: string, endHHmm: string): number {
  const start = parseHHmm(startHHmm);
  const end = parseHHmm(endHHmm);

  if (start === null || end === null) {
    return 0;
  }

  if (end === start) {
    return 0;
  }

  return end < start ? end + 24 * 60 - start : end - start;
}

export function allocateByWeights(
  totalCents: number,
  weights: { id: string; weight: number }[]
): AllocationResult {
  const normalizedWeights = weights.map(({ id, weight }) => ({
    id,
    weight: Number.isFinite(weight) ? Math.max(0, weight) : 0
  }));
  const totalWeight = normalizedWeights.reduce((sum, item) => sum + item.weight, 0);
  const emptyAllocations = Object.fromEntries(normalizedWeights.map(({ id }) => [id, 0]));

  if (totalCents <= 0) {
    return {
      allocations: emptyAllocations,
      details: normalizedWeights.map(({ id, weight }) => ({
        id,
        weight,
        exactShareCents: 0,
        floorCents: 0,
        remainder: 0,
        amountCents: 0
      })),
      totalWeight,
      allocatedCents: 0,
      unallocatedCents: Math.max(0, totalCents)
    };
  }

  if (totalWeight <= 0) {
    return {
      allocations: emptyAllocations,
      details: normalizedWeights.map(({ id, weight }) => ({
        id,
        weight,
        exactShareCents: 0,
        floorCents: 0,
        remainder: 0,
        amountCents: 0
      })),
      totalWeight: 0,
      allocatedCents: 0,
      unallocatedCents: totalCents
    };
  }

  const details = normalizedWeights.map(({ id, weight }) => {
    const exactShareCents = (totalCents * weight) / totalWeight;
    const floorCents = Math.floor(exactShareCents);

    return {
      id,
      weight,
      exactShareCents,
      floorCents,
      remainder: exactShareCents - floorCents,
      amountCents: floorCents
    };
  });

  const allocatedFloors = details.reduce((sum, detail) => sum + detail.floorCents, 0);
  const leftoverCents = totalCents - allocatedFloors;
  const remainderOrder = [...details].sort((a, b) => {
    if (b.remainder !== a.remainder) {
      return b.remainder - a.remainder;
    }

    return a.id.localeCompare(b.id);
  });

  for (let index = 0; index < leftoverCents; index += 1) {
    remainderOrder[index].amountCents += 1;
  }

  const allocations = Object.fromEntries(
    details.map(({ id, amountCents }) => [id, amountCents])
  );

  return {
    allocations,
    details,
    totalWeight,
    allocatedCents: totalCents,
    unallocatedCents: 0
  };
}

export function calculateSplit(
  config: EventConfig,
  participants: Participant[],
  lineItems: LineItem[]
): SplitResult {
  const warnings: SplitWarning[] = [];
  const regularBeforeGiftCents = sumCategory(lineItems, "regular");
  const cocktailPoolCents = sumCategory(lineItems, "cocktail");
  const shotPoolCents = sumCategory(lineItems, "shot");
  const foodPoolCents = sumCategory(lineItems, "food");
  const totalBillCents =
    regularBeforeGiftCents + cocktailPoolCents + shotPoolCents + foodPoolCents;

  const sponsorGiftCents = Math.max(
    0,
    Math.min(config.sponsorGiftCents, regularBeforeGiftCents)
  );

  if (config.sponsorGiftCents < 0) {
    warnings.push({
      code: "invalid_sponsor_gift",
      message: "Sponsorcadeau mag niet negatief zijn."
    });
  }

  if (config.sponsorGiftCents > regularBeforeGiftCents) {
    warnings.push({
      code: "invalid_sponsor_gift",
      message: "Sponsorcadeau is groter dan de gemeenschappelijke drank."
    });
  }

  const regularAfterGiftCents = regularBeforeGiftCents - sponsorGiftCents;
  const payableBillCents = totalBillCents - sponsorGiftCents;

  participants.forEach((participant, index) => {
    if (!participant.name.trim()) {
      warnings.push({
        code: "missing_name",
        message: `Ontbrekende naam bij deelnemer ${index + 1}.`
      });
    }
  });

  const sponsors = participants.filter((participant) => participant.isSponsor);

  if (sponsors.length > 1) {
    warnings.push({
      code: "multiple_sponsors",
      message: "Meer dan één sponsor geselecteerd."
    });
  }

  const receiptCocktailCount = sumQuantity(lineItems, "cocktail");
  const receiptShotCount = sumQuantity(lineItems, "shot");
  const enteredCocktailCount = participants.reduce(
    (sum, participant) =>
      sum + (isFreeParticipant(participant) ? 0 : safeNumber(participant.cocktailAmount)),
    0
  );
  const enteredShotCount = participants.reduce(
    (sum, participant) =>
      sum + (isFreeParticipant(participant) ? 0 : safeNumber(participant.shotAmount)),
    0
  );

  if (enteredCocktailCount !== receiptCocktailCount) {
    warnings.push({
      code: "cocktail_count_mismatch",
      message:
        "Let op: het ingevoerde aantal cocktails komt niet overeen met het aantal op de bonnetjes."
    });
  }

  if (enteredShotCount !== receiptShotCount) {
    warnings.push({
      code: "shot_count_mismatch",
      message:
        "Let op: het ingevoerde aantal shots komt niet overeen met het aantal op de bonnetjes."
    });
  }

  const regularWeights = participants.map((participant) => {
    const presenceMinutes = minutesBetween(participant.arrivalTime, participant.departureTime);

    return {
      id: participant.id,
      weight: isFreeParticipant(participant) ? 0 : presenceMinutes
    };
  });
  const cocktailWeights = participants.map((participant) => ({
    id: participant.id,
    weight: isFreeParticipant(participant) ? 0 : safeNumber(participant.cocktailAmount)
  }));
  const shotWeights = participants.map((participant) => ({
    id: participant.id,
    weight: isFreeParticipant(participant) ? 0 : safeNumber(participant.shotAmount)
  }));
  const foodWeights = participants.map((participant) => ({
    id: participant.id,
    weight: isFreeParticipant(participant) ? 0 : participant.foodWeight
  }));

  const regularAllocation = allocateByWeights(regularAfterGiftCents, regularWeights);
  const cocktailAllocation = allocateByWeights(cocktailPoolCents, cocktailWeights);
  const shotAllocation = allocateByWeights(shotPoolCents, shotWeights);
  const foodAllocation = allocateByWeights(foodPoolCents, foodWeights);
  const sponsorGiftAllocations = Object.fromEntries(
    participants.map((participant) => [participant.id, 0])
  );
  const pools = {
    regular: createPool("regular", regularAfterGiftCents, regularWeights, regularAllocation),
    cocktail: createPool("cocktail", cocktailPoolCents, cocktailWeights, cocktailAllocation),
    shot: createPool("shot", shotPoolCents, shotWeights, shotAllocation),
    food: createPool("food", foodPoolCents, foodWeights, foodAllocation),
    sponsorGift: {
      key: "sponsorGift",
      label: POOL_LABELS.sponsorGift,
      totalCents: sponsorGiftCents,
      totalWeight: 1,
      allocatedCents: sponsorGiftCents,
      unallocatedCents: 0,
      weights: Object.fromEntries(participants.map((participant) => [participant.id, 0])),
      allocations: sponsorGiftAllocations
    } satisfies PoolCalculation
  };

  (Object.values(pools) as PoolCalculation[]).forEach((pool) => {
    if (pool.totalCents > 0 && pool.unallocatedCents > 0) {
      warnings.push({
        code: "unallocated_pool",
        pool: pool.key,
        message: `Er is een bedrag in een categorie, maar niemand is eraan gekoppeld: ${pool.label} (${centsToEuro(pool.unallocatedCents)}).`
      });
    }
  });

  const participantSplits = participants.map((participant) => {
    const presenceMinutes = minutesBetween(participant.arrivalTime, participant.departureTime);
    const freeParticipant = isFreeParticipant(participant);
    const regularShareCents = pools.regular.allocations[participant.id] ?? 0;
    const cocktailShareCents = pools.cocktail.allocations[participant.id] ?? 0;
    const shotShareCents = pools.shot.allocations[participant.id] ?? 0;
    const foodShareCents = pools.food.allocations[participant.id] ?? 0;
    const sponsorGiftShareCents = pools.sponsorGift.allocations[participant.id] ?? 0;
    const totalCents =
      regularShareCents +
      cocktailShareCents +
      shotShareCents +
      foodShareCents +
      sponsorGiftShareCents;
    const prepaidCents = safeNumber(participant.prepaidCents);
    const amountDueCents = Math.max(0, totalCents - prepaidCents);

    return {
      participant,
      presenceMinutes,
      regularWeight: freeParticipant ? 0 : presenceMinutes,
      cocktailWeight: freeParticipant ? 0 : safeNumber(participant.cocktailAmount),
      shotWeight: freeParticipant ? 0 : safeNumber(participant.shotAmount),
      foodWeight: (freeParticipant ? 0 : participant.foodWeight) as FoodWeight,
      regularShareCents,
      cocktailShareCents,
      shotShareCents,
      foodShareCents,
      sponsorGiftShareCents,
      totalCents,
      prepaidCents,
      amountDueCents,
      overpaidCents: Math.max(0, prepaidCents - totalCents),
      isFreeParticipant: freeParticipant
    };
  });

  const participantTotalCents = participantSplits.reduce(
    (sum, participant) => sum + participant.totalCents,
    0
  );
  const prepaidTotalCents = participantSplits.reduce(
    (sum, participant) => sum + participant.prepaidCents,
    0
  );
  const amountDueTotalCents = participantSplits.reduce(
    (sum, participant) => sum + participant.amountDueCents,
    0
  );
  const overpaidTotalCents = participantSplits.reduce(
    (sum, participant) => sum + participant.overpaidCents,
    0
  );
  const unallocatedCents =
    pools.regular.unallocatedCents +
    pools.cocktail.unallocatedCents +
    pools.shot.unallocatedCents +
    pools.food.unallocatedCents +
    pools.sponsorGift.unallocatedCents;
  const finalCheckCents = participantTotalCents + unallocatedCents;
  const poolCheckCents =
    sponsorGiftCents + regularAfterGiftCents + cocktailPoolCents + shotPoolCents + foodPoolCents;
  const isBalanced = finalCheckCents === payableBillCents && poolCheckCents === totalBillCents;

  if (!isBalanced) {
    warnings.push({
      code: "total_mismatch",
      message: "De totalen tellen niet exact op tot het totaalbedrag."
    });
  }

  return {
    config,
    totalBillCents,
    payableBillCents,
    regularBeforeGiftCents,
    sponsorGiftCents,
    regularAfterGiftCents,
    cocktailPoolCents,
    shotPoolCents,
    foodPoolCents,
    poolCheckCents,
    participantTotalCents,
    prepaidTotalCents,
    amountDueTotalCents,
    overpaidTotalCents,
    unallocatedCents,
    finalCheckCents,
    isBalanced,
    warnings,
    receiptCounts: {
      cocktails: receiptCocktailCount,
      shots: receiptShotCount,
      enteredCocktails: enteredCocktailCount,
      enteredShots: enteredShotCount
    },
    pools,
    participants: participantSplits
  };
}

function parseHHmm(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

function sumCategory(lineItems: LineItem[], category: LineItemCategory): number {
  return lineItems
    .filter((item) => CATEGORY_TO_POOL[item.category] === CATEGORY_TO_POOL[category])
    .reduce((sum, item) => sum + item.amountCents, 0);
}

function sumQuantity(lineItems: LineItem[], category: LineItemCategory): number {
  return lineItems
    .filter((item) => item.category === category)
    .reduce((sum, item) => sum + item.quantity, 0);
}

function safeNumber(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function createPool(
  key: Exclude<PoolKey, "sponsorGift">,
  totalCents: number,
  weights: { id: string; weight: number }[],
  allocation: AllocationResult
): PoolCalculation {
  return {
    key,
    label: POOL_LABELS[key],
    totalCents,
    totalWeight: allocation.totalWeight,
    allocatedCents: allocation.allocatedCents,
    unallocatedCents: allocation.unallocatedCents,
    weights: Object.fromEntries(weights.map(({ id, weight }) => [id, weight])),
    allocations: allocation.allocations
  };
}
