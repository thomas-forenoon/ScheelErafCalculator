import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPersonalCalculationParticipants,
  calculatePersonalSplit,
  PAYABLE_BILL_CENTS,
  REGULAR_AFTER_GIFT_CENTS,
  SPONSOR_GIFT_CENTS
} from "./personalSplit";
import { createDefaultState } from "./seed";

test("traktatie van 100 euro wordt van het te verdelen totaal afgetrokken", () => {
  assert.equal(SPONSOR_GIFT_CENTS, 10000);
  assert.equal(REGULAR_AFTER_GIFT_CENTS, 19060);
  assert.equal(PAYABLE_BILL_CENTS, 48590);
});

test("voorbeeld 15:30 tot 22:30 met 2 shots en eten blijft onder 200 euro", () => {
  const { participants } = createDefaultState();
  const participant = {
    ...participants.find((item) => item.name === "Schel")!,
    arrivalTime: "15:30",
    departureTime: "22:30",
    cocktailAmount: 0,
    shotAmount: 2,
    foodWeight: 1,
    prepaidCents: 0
  };
  const nextParticipants = participants.map((item) =>
    item.id === participant.id ? participant : item
  );
  const result = calculatePersonalSplit(participant, nextParticipants);

  assert.equal(result.shotShareCents, 1100);
  assert.equal(result.foodShareCents, 570);
  assert.ok(result.totalCents < 20000);
});

test("anonieme flow gebruikt nog altijd de groepsaanwezigheid als noemer", () => {
  const { participants } = createDefaultState();
  const participant = {
    ...participants.find((item) => item.name === "Schel")!,
    id: "persoonlijke-invoer",
    name: "Deelnemer",
    arrivalTime: "15:30",
    departureTime: "22:30",
    cocktailAmount: 0,
    shotAmount: 0,
    foodWeight: 0,
    prepaidCents: 0
  };
  const calculationParticipants = buildPersonalCalculationParticipants(participant, participants);
  const result = calculatePersonalSplit(participant, calculationParticipants);

  assert.equal(calculationParticipants.length, participants.length);
  assert.ok(result.regularShareCents > 0);
  assert.ok(result.regularShareCents < 3000);
});

test("eten wordt verdeeld over 10 eters", () => {
  const { participants } = createDefaultState();
  const participant = { ...participants[0], foodWeight: 1 as const };
  const result = calculatePersonalSplit(participant, [participant, ...participants.slice(1)]);

  assert.equal(result.foodShareCents, 570);
});

test("Robbe betaalt nul", () => {
  const { participants } = createDefaultState();
  const robbe = participants.find((item) => item.name === "Robbe")!;
  const result = calculatePersonalSplit(robbe, participants);

  assert.equal(result.totalCents, 0);
  assert.equal(result.amountDueCents, 0);
});
