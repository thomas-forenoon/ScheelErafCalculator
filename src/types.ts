export type LineItemCategory = "regular" | "cocktail" | "shot" | "food";

export type LineItem = {
  id: string;
  name: string;
  quantity: number;
  amountCents: number;
  category: LineItemCategory;
};

export type FoodWeight = 0 | 0.5 | 1 | 1.5;

export type Participant = {
  id: string;
  name: string;
  isSponsor: boolean;
  giftOnly: boolean;
  arrivalTime: string;
  departureTime: string;
  cocktailAmount: number;
  shotAmount: number;
  foodWeight: FoodWeight;
  prepaidCents: number;
};

export type EventConfig = {
  eventName: string;
  eventStartTime: string;
  eventEndTime: string;
  sponsorGiftCents: number;
};

export type PoolKey = "regular" | "cocktail" | "shot" | "food" | "sponsorGift";

export type AllocationDetail = {
  id: string;
  weight: number;
  exactShareCents: number;
  floorCents: number;
  remainder: number;
  amountCents: number;
};

export type AllocationResult = {
  allocations: Record<string, number>;
  details: AllocationDetail[];
  totalWeight: number;
  allocatedCents: number;
  unallocatedCents: number;
};

export type SplitWarning = {
  code:
    | "missing_name"
    | "no_sponsor"
    | "multiple_sponsors"
    | "invalid_sponsor_gift"
    | "cocktail_count_mismatch"
    | "shot_count_mismatch"
    | "unallocated_pool"
    | "total_mismatch";
  message: string;
  pool?: PoolKey;
};

export type PoolCalculation = {
  key: PoolKey;
  label: string;
  totalCents: number;
  totalWeight: number;
  allocatedCents: number;
  unallocatedCents: number;
  weights: Record<string, number>;
  allocations: Record<string, number>;
};

export type ParticipantSplit = {
  participant: Participant;
  presenceMinutes: number;
  regularWeight: number;
  cocktailWeight: number;
  shotWeight: number;
  foodWeight: FoodWeight;
  regularShareCents: number;
  cocktailShareCents: number;
  shotShareCents: number;
  foodShareCents: number;
  sponsorGiftShareCents: number;
  totalCents: number;
  prepaidCents: number;
  amountDueCents: number;
  overpaidCents: number;
  isFreeParticipant: boolean;
};

export type SplitResult = {
  config: EventConfig;
  totalBillCents: number;
  payableBillCents: number;
  regularBeforeGiftCents: number;
  sponsorGiftCents: number;
  regularAfterGiftCents: number;
  cocktailPoolCents: number;
  shotPoolCents: number;
  foodPoolCents: number;
  poolCheckCents: number;
  participantTotalCents: number;
  prepaidTotalCents: number;
  amountDueTotalCents: number;
  overpaidTotalCents: number;
  unallocatedCents: number;
  finalCheckCents: number;
  isBalanced: boolean;
  warnings: SplitWarning[];
  receiptCounts: {
    cocktails: number;
    shots: number;
    enteredCocktails: number;
    enteredShots: number;
  };
  pools: {
    regular: PoolCalculation;
    cocktail: PoolCalculation;
    shot: PoolCalculation;
    food: PoolCalculation;
    sponsorGift: PoolCalculation;
  };
  participants: ParticipantSplit[];
};
