import type { EventConfig, FoodWeight, LineItem, Participant } from "@/types";

export const DEFAULT_EVENT_CONFIG: EventConfig = {
  eventName: "Scheel Eraf Calculator",
  eventStartTime: "15:30",
  eventEndTime: "22:30",
  sponsorGiftCents: 10000
};

export const PAYMENT_IBAN = "BE66 9731 6120 5243";

export const TICKET_TOTALS = [
  { id: "185040", amountCents: 35750 },
  { id: "185100", amountCents: 10000 },
  { id: "185223", amountCents: 3570 },
  { id: "185184", amountCents: 4300 },
  { id: "185136", amountCents: 4970 }
];

export const VAT_SPLIT = [
  { rate: "12%", amountCents: 5700 },
  { rate: "21%", amountCents: 52890 }
];

export const LINE_ITEMS: LineItem[] = [
  { id: "regular-cristal", name: "Cristal", quantity: 53, amountCents: 15900, category: "regular" },
  { id: "regular-jacks-ipa", name: "Jack's IPA", quantity: 11, amountCents: 5170, category: "regular" },
  { id: "regular-lefort-tripel", name: "Lefort Tripel", quantity: 4, amountCents: 1920, category: "regular" },
  { id: "regular-pepsi", name: "Pepsi", quantity: 4, amountCents: 1160, category: "regular" },
  { id: "regular-duvel", name: "Duvel", quantity: 2, amountCents: 980, category: "regular" },
  { id: "regular-cristal-33cl", name: "Cristal 33cl", quantity: 1, amountCents: 390, category: "regular" },
  { id: "regular-god-0", name: "GOD 0%", quantity: 1, amountCents: 520, category: "regular" },
  { id: "regular-de-poes-houblon", name: "De Poes Houblon", quantity: 1, amountCents: 490, category: "regular" },
  { id: "regular-omer", name: "Omer", quantity: 1, amountCents: 490, category: "regular" },
  { id: "regular-westmalle-tripel", name: "Westmalle Tripel", quantity: 1, amountCents: 490, category: "regular" },
  { id: "regular-ypra", name: "Ypra 0,4%", quantity: 1, amountCents: 470, category: "regular" },
  { id: "regular-saison-dupont", name: "Saison Dupont", quantity: 1, amountCents: 400, category: "regular" },
  { id: "regular-framboos-limo", name: "Framboos Limo", quantity: 1, amountCents: 390, category: "regular" },
  { id: "regular-ice-tea", name: "Ice tea", quantity: 1, amountCents: 290, category: "regular" },
  { id: "cocktail-aperol-spritz", name: "Aperol spritz", quantity: 12, amountCents: 10200, category: "cocktail" },
  { id: "cocktail-sterk", name: "STERK", quantity: 2, amountCents: 1440, category: "cocktail" },
  { id: "cocktail-looza-tomaat", name: "Looza Tomaat", quantity: 2, amountCents: 640, category: "cocktail" },
  { id: "shot-shot", name: "SHOT", quantity: 21, amountCents: 11550, category: "shot" },
  { id: "food-bitterballen", name: "Bitterballen", quantity: 5, amountCents: 3500, category: "food" },
  { id: "food-messy-nachos", name: "Messy Nacho's", quantity: 2, amountCents: 2200, category: "food" }
];

export const FOOD_OPTIONS: { value: FoodWeight; label: string }[] = [
  { value: 0, label: "Geen eten" },
  { value: 1, label: "Meegegeten" }
];

export const NAME_OPTIONS = [
  "Baelus",
  "Brocky",
  "Chrikke",
  "Gompie",
  "Jacky",
  "Jasper",
  "Jay",
  "Lennert",
  "Nagels",
  "Naki",
  "Quartier",
  "Robbe",
  "Schel",
  "Vermeir"
];

export function createSeedParticipants(
  config: EventConfig = DEFAULT_EVENT_CONFIG
): Participant[] {
  const seededPeople = [
    { name: "Baelus", arrivalTime: "15:30", departureTime: config.eventEndTime },
    { name: "Brocky", arrivalTime: "15:30", departureTime: config.eventEndTime },
    { name: "Chrikke", arrivalTime: "15:30", departureTime: config.eventEndTime },
    { name: "Gompie", arrivalTime: "15:30", departureTime: config.eventEndTime },
    { name: "Jacky", arrivalTime: "16:30", departureTime: config.eventEndTime },
    { name: "Jasper", arrivalTime: "17:00", departureTime: config.eventEndTime },
    { name: "Jay", arrivalTime: "17:30", departureTime: config.eventEndTime },
    { name: "Lennert", arrivalTime: "18:00", departureTime: config.eventEndTime },
    { name: "Nagels", arrivalTime: "18:30", departureTime: config.eventEndTime },
    { name: "Naki", arrivalTime: "19:30", departureTime: config.eventEndTime },
    { name: "Quartier", arrivalTime: "20:00", departureTime: config.eventEndTime },
    { name: "Robbe", arrivalTime: "15:30", departureTime: "16:00" },
    { name: "Schel", arrivalTime: "15:30", departureTime: config.eventEndTime },
    { name: "Vermeir", arrivalTime: "20:00", departureTime: config.eventEndTime }
  ];

  return seededPeople.map((person, index) => {
    const participantNumber = index + 1;
    const isRobbe = person.name === "Robbe";

    return {
      id: `participant-${participantNumber}`,
      name: person.name,
      isSponsor: false,
      giftOnly: isRobbe,
      arrivalTime: person.arrivalTime,
      departureTime: person.departureTime,
      cocktailAmount: 0,
      shotAmount: 0,
      foodWeight: 0,
      prepaidCents: 0
    };
  });
}

export function createDefaultState(): {
  config: EventConfig;
  participants: Participant[];
} {
  return {
    config: { ...DEFAULT_EVENT_CONFIG },
    participants: createSeedParticipants(DEFAULT_EVENT_CONFIG)
  };
}
