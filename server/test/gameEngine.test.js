const assert = require("assert");
const {
  TITLE_DEEDS,
  BOARD_SPACES,
  calculateRent,
} = require("../src/game-engine/gameData");
const store = require("../src/services/store");
const { processIncomingPayment } = require("../src/services/incomingPaymentService");
const { processDiceMovement } = require("../src/services/movementService");
const { handlePropertyLanding, settleRentPayment } = require("../src/services/rentService");
const { getGameLeaderboard } = require("../src/services/leaderboardService");

async function runTests() {
  console.log("=== STARTING COMPREHENSIVE BUSINESS ENGINE TEST SUITE ===");

  // 1. Verify Fixed Board & Property Data
  console.log("\n[TEST 1] Verifying Physical Board & Title Deed Data...");
  assert.strictEqual(BOARD_SPACES.length, 36, "Must have exactly 36 board spaces");
  assert.strictEqual(Object.keys(TITLE_DEEDS).length, 26, "Must have exactly 26 official title deeds");

  // Verify Mumbai
  const mumbai = TITLE_DEEDS[1];
  assert.strictEqual(mumbai.name, "MUMBAI");
  assert.strictEqual(mumbai.purchasePrice, 8500);
  assert.strictEqual(mumbai.rentSiteOnly, 1200);
  assert.strictEqual(mumbai.rentHotel, 9000);
  assert.strictEqual(mumbai.costOfHouse, 7500);
  assert.strictEqual(mumbai.costOfHotel, 7500);

  // Verify Start space
  assert.strictEqual(BOARD_SPACES[0].name, "START");
  assert.strictEqual(BOARD_SPACES[0].reward, 1500);

  // Verify Taxes
  const incomeTax = BOARD_SPACES.find((s) => s.name === "INCOME TAX");
  assert.strictEqual(incomeTax.amount, 500);
  const wealthTax = BOARD_SPACES.find((s) => s.name === "WEALTH TAX");
  assert.strictEqual(wealthTax.amount, 1000);

  console.log("✓ Test 1 Passed: Fixed board data and cards match physical game exactly.");

  // 2. Test Rent Calculation Engine
  console.log("\n[TEST 2] Verifying Rent Calculations & Combo Rules...");
  // Unimproved site
  const siteRent = calculateRent({
    property: { cardId: 1, houseCount: 0, hotelStatus: false },
    ownerProperties: [{ cardId: 1 }],
  });
  assert.strictEqual(siteRent, 1200, "Mumbai base rent must be 1200");

  // 1 House
  const h1Rent = calculateRent({
    property: { cardId: 1, houseCount: 1, hotelStatus: false },
    ownerProperties: [{ cardId: 1 }],
  });
  assert.strictEqual(h1Rent, 4000, "Mumbai 1-house rent must be 4000");

  // Hotel
  const hotelRent = calculateRent({
    property: { cardId: 1, houseCount: 0, hotelStatus: true },
    ownerProperties: [{ cardId: 1 }],
  });
  assert.strictEqual(hotelRent, 9000, "Mumbai Hotel rent must be 9000");

  // Utility Dice Combo (Electric Company with Motor Boat)
  const elecRentWithoutCombo = calculateRent({
    property: { cardId: 23 },
    ownerProperties: [{ cardId: 23 }],
    diceRoll: 8,
  });
  assert.strictEqual(elecRentWithoutCombo, 8 * 50, "Electric Company base multiplier 50x");

  const elecRentWithCombo = calculateRent({
    property: { cardId: 23 },
    ownerProperties: [{ cardId: 23 }, { cardId: 26 }], // Owns Motor Boat
    diceRoll: 8,
  });
  assert.strictEqual(elecRentWithCombo, 8 * 100, "Electric Company combo multiplier 100x");

  console.log("✓ Test 2 Passed: Rent calculations, house levels and utility multipliers verified.");

  // 3. Test Mandatory PRD Section 13 Automatic Debt Recovery Example
  console.log("\n[TEST 3] Verifying PRD Section 13 Debt Recovery (Player A owes Player B ₹10,000)...");
  const gameId = "test_game_recovery";
  const playerAId = "test_player_A";
  const playerBId = "test_player_B";

  // Create game and players
  await store.createGame({
    gameId,
    roomCode: "TEST01",
    hostId: playerAId,
    gameStatus: "IN_PROGRESS",
  });

  await store.createPlayer({
    playerId: playerAId,
    gameId,
    username: "Player A (Bankrupt)",
    balance: 0,
    bankruptcyStatus: true,
  });

  await store.createPlayer({
    playerId: playerBId,
    gameId,
    username: "Player B (Creditor)",
    balance: 5000,
    bankruptcyStatus: false,
  });

  // Create ₹10,000 loan where Player A owes Player B
  const loanId = "test_loan_10k";
  await store.createLoan({
    loanId,
    gameId,
    lenderId: playerBId,
    borrowerId: playerAId,
    loanSource: "PLAYER",
    principalAmount: 10000,
    totalRepayment: 10000,
    amountRepaid: 0,
    outstandingBalance: 10000,
    loanStatus: "ACTIVE",
    createdAt: new Date("2026-01-01"),
  });

  // Step 1: Player A receives ₹3,000
  console.log("  -> Step 1: Player A receives ₹3,000");
  const res1 = await processIncomingPayment({
    gameId,
    receiverId: playerAId,
    amount: 3000,
    transactionType: "TRANSFER",
    description: "Transfer to Player A",
  });

  assert.strictEqual(res1.allocatedToDebt, 3000, "All ₹3,000 must be allocated to debt");
  assert.strictEqual(res1.creditedToSpendable, 0, "Player A spendable balance must be ₹0");

  const pA1 = await store.getPlayerById(playerAId);
  const pB1 = await store.getPlayerById(playerBId);
  const loan1 = await store.getLoanById(loanId);

  assert.strictEqual(pA1.balance, 0, "Player A balance must be ₹0");
  assert.strictEqual(pB1.balance, 8000, "Player B balance must be 5000 + 3000 = ₹8,000");
  assert.strictEqual(loan1.outstandingBalance, 7000, "Outstanding debt must reduce to ₹7,000");

  // Step 2: Player A receives ₹5,000
  console.log("  -> Step 2: Player A receives ₹5,000");
  const res2 = await processIncomingPayment({
    gameId,
    receiverId: playerAId,
    amount: 5000,
    transactionType: "TRANSFER",
    description: "Transfer to Player A",
  });

  assert.strictEqual(res2.allocatedToDebt, 5000, "All ₹5,000 must be allocated to debt");
  assert.strictEqual(res2.creditedToSpendable, 0, "Player A spendable balance must be ₹0");

  const pB2 = await store.getPlayerById(playerBId);
  const loan2 = await store.getLoanById(loanId);
  assert.strictEqual(pB2.balance, 13000, "Player B balance must be 8000 + 5000 = ₹13,000");
  assert.strictEqual(loan2.outstandingBalance, 2000, "Outstanding debt must reduce to ₹2,000");

  // Step 3: Player A receives ₹5,000 again
  console.log("  -> Step 3: Player A receives ₹5,000 again (Final payoff + remainder)");
  const res3 = await processIncomingPayment({
    gameId,
    receiverId: playerAId,
    amount: 5000,
    transactionType: "TRANSFER",
    description: "Transfer to Player A",
  });

  assert.strictEqual(res3.allocatedToDebt, 2000, "Only remaining ₹2,000 allocated to debt");
  assert.strictEqual(res3.creditedToSpendable, 3000, "Remainder ₹3,000 credited to Player A spendable cash");

  const pA3 = await store.getPlayerById(playerAId);
  const pB3 = await store.getPlayerById(playerBId);
  const loan3 = await store.getLoanById(loanId);

  assert.strictEqual(pA3.balance, 3000, "Player A now has ₹3,000 spendable cash");
  assert.strictEqual(pB3.balance, 15000, "Player B received full ₹10,000 debt recovery");
  assert.strictEqual(loan3.outstandingBalance, 0, "Outstanding debt must be ₹0");
  assert.strictEqual(loan3.loanStatus, "REPAID", "Loan status must be REPAID");

  console.log("✓ Test 3 Passed: PRD Section 13 Automatic Debt Recovery strictly validated.");

  // 4. Test Board Movement & Start Wrap
  console.log("\n[TEST 4] Verifying Board Movement & Pass-START Reward...");
  await store.updatePlayer(playerAId, {
    currentBoardPosition: 34, // Motor Boat
    balance: 3000,
  });

  const moveRes = await processDiceMovement({
    gameId,
    playerId: playerAId,
    diceValues: [3, 4], // Total 7 -> 34 + 7 = 41 % 36 = 5 (INCOME TAX)
  });

  assert.strictEqual(moveRes.movementRecord.previousPosition, 34);
  assert.strictEqual(moveRes.movementRecord.newPosition, 5);
  assert.strictEqual(moveRes.movementRecord.passedStart, true, "Wrapped past 36 -> passed START");

  console.log("✓ Test 4 Passed: Board movement, wrapping, and START space pass verified.");

  // 5. Test Dual-Player Rent Settlement & Idempotency
  console.log("\n[TEST 5] Verifying Automatic Rent Detection & Idempotency...");
  await store.seedGameProperties(gameId);
  const propMumbai = await store.getPropertyByCardId(gameId, 1);
  // Set Player B as owner
  const ownedMumbai = await store.updateProperty(propMumbai.propertyId, { ownerId: playerBId });

  // Player A lands on Mumbai
  const rentEv = await handlePropertyLanding({
    gameId,
    property: ownedMumbai,
    visitor: pA3,
    diceRoll: 7,
  });

  assert.ok(rentEv, "Rent event must be created");
  assert.strictEqual(rentEv.rentAmount, 1200);

  // Settle rent
  const settleRes = await settleRentPayment({
    landingEventId: rentEv.landingEventId,
    confirmedByPlayerId: playerAId,
  });

  assert.strictEqual(settleRes.success, true);
  assert.strictEqual(settleRes.rentEvent.paymentStatus, "COLLECTED");

  // Attempt duplicate settlement (idempotency check)
  const dupSettle = await settleRentPayment({
    landingEventId: rentEv.landingEventId,
    confirmedByPlayerId: playerBId,
  });
  assert.strictEqual(dupSettle.alreadySettled, true, "Duplicate settlement must be safely ignored");

  console.log("✓ Test 5 Passed: Rent detection, dual confirmation, and idempotency verified.");

  console.log("\n🎉 ALL UNIT AND INTEGRATION TESTS PASSED PERFECTLY! 🎉\n");
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
