import assert from "node:assert/strict";
import test from "node:test";
import { calculateSplit, allocateByWeights } from "./split";
import { createDefaultState, LINE_ITEMS } from "./seed";

test("bonbedragen zijn correct ingesteld", () => {
  const { config, participants } = createDefaultState();
  const result = calculateSplit(config, participants, LINE_ITEMS);

  assert.equal(result.totalBillCents, 58590);
  assert.equal(result.payableBillCents, 48590);
  assert.equal(result.sponsorGiftCents, 10000);
  assert.equal(result.regularAfterGiftCents, 19060);
});

test("allocateByWeights telt altijd exact op tot de pool", () => {
  const result = allocateByWeights(10000, [
    { id: "a", weight: 1 },
    { id: "b", weight: 1 },
    { id: "c", weight: 1 }
  ]);

  const allocatedTotal = Object.values(result.allocations).reduce((sum, value) => sum + value, 0);

  assert.equal(allocatedTotal, 10000);
  assert.equal(result.unallocatedCents, 0);
});

test("nulgewicht geeft een niet-toegewezen bedrag terug", () => {
  const result = allocateByWeights(5000, [
    { id: "a", weight: 0 },
    { id: "b", weight: 0 }
  ]);

  assert.equal(result.allocatedCents, 0);
  assert.equal(result.unallocatedCents, 5000);
});

test("alleen-cadeau deelnemer krijgt geen gewicht voor gemeenschappelijke drank", () => {
  const { config, participants } = createDefaultState();
  const result = calculateSplit(config, participants, LINE_ITEMS);
  const giftOnlyParticipant = result.participants.find(
    (participant) => participant.participant.giftOnly
  );

  assert.ok(giftOnlyParticipant);
  assert.equal(giftOnlyParticipant.regularWeight, 0);
  assert.equal(giftOnlyParticipant.regularShareCents, 0);
});

test("Robbe betaalt automatisch niets", () => {
  const { config, participants } = createDefaultState();
  const result = calculateSplit(config, participants, LINE_ITEMS);
  const robbe = result.participants.find((participant) => participant.participant.name === "Robbe");

  assert.ok(robbe);
  assert.equal(robbe.totalCents, 0);
  assert.equal(robbe.amountDueCents, 0);
  assert.equal(robbe.isFreeParticipant, true);
});

test("al betaald verlaagt alleen het openstaande bedrag", () => {
  const { config, participants } = createDefaultState();
  const resultWithoutPrepaid = calculateSplit(config, participants, LINE_ITEMS);
  const sponsorTotal = resultWithoutPrepaid.participants[0].totalCents;
  const resultWithPrepaid = calculateSplit(
    config,
    [{ ...participants[0], prepaidCents: 1000 }, ...participants.slice(1)],
    LINE_ITEMS
  );

  assert.equal(resultWithPrepaid.participants[0].totalCents, sponsorTotal);
  assert.equal(resultWithPrepaid.participants[0].amountDueCents, Math.max(0, sponsorTotal - 1000));
});

test("deelnemerstotalen plus niet-toegewezen bedrag zijn exact het totaal", () => {
  const { config, participants } = createDefaultState();
  const result = calculateSplit(config, participants, LINE_ITEMS);

  assert.equal(result.participantTotalCents + result.unallocatedCents, result.payableBillCents);
});
