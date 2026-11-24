/**
 * Centralized, Read-Only Official Game Configuration
 * Version: 5.0 (Indian Business Board Game Edition)
 *
 * All values are taken directly from the physical board game, title deed cards,
 * and game instructions.
 *
 * STRICT RULE: Administrators and players CANNOT modify these predefined values.
 */

const GAME_DATA_VERSION = "5.0.0-PHYSICAL-BUSINESS";

const COLOR_GROUPS = {
  PINK: {
    id: "PINK",
    name: "Pink",
    hex: "#FF69B4",
    totalSites: 5,
    minMonopolySites: 3, // Rule: "If a player owns THREE sites of any colour group, the rent is doubled on unimproved sites in that group."
  },
  BLUE: {
    id: "BLUE",
    name: "Light Blue",
    hex: "#64B5F6",
    totalSites: 5,
    minMonopolySites: 3,
  },
  GREEN: {
    id: "GREEN",
    name: "Green",
    hex: "#81C784",
    totalSites: 5,
    minMonopolySites: 3,
  },
  YELLOW: {
    id: "YELLOW",
    name: "Yellow",
    hex: "#FFD54F",
    totalSites: 5,
    minMonopolySites: 3,
  },
  UTILITY: {
    id: "UTILITY",
    name: "Utility",
    hex: "#B0BEC5",
    totalSites: 3,
  },
  TRANSPORT: {
    id: "TRANSPORT",
    name: "Transport",
    hex: "#90A4AE",
    totalSites: 3,
  },
};

/**
 * 26 Official Title Deeds from the physical card sheet
 */
const TITLE_DEEDS = {
  1: {
    cardId: 1,
    name: "MUMBAI",
    group: "PINK",
    purchasePrice: 8500,
    rentSiteOnly: 1200,
    rent1House: 4000,
    rent2Houses: 5500,
    rent3Houses: 7500,
    rentHotel: 9000,
    costOfHouse: 7500,
    costOfHotel: 7500,
    bankMortgageValue: 4250,
  },
  2: {
    cardId: 2,
    name: "AHMEDABAD",
    group: "PINK",
    purchasePrice: 4000,
    rentSiteOnly: 400,
    rent1House: 1500,
    rent2Houses: 3000,
    rent3Houses: 4200,
    rentHotel: 5000,
    costOfHouse: 4500,
    costOfHotel: 4500,
    bankMortgageValue: 2000,
  },
  3: {
    cardId: 3,
    name: "DARJEELING",
    group: "PINK",
    purchasePrice: 2500,
    rentSiteOnly: 200,
    rent1House: 1200,
    rent2Houses: 2600,
    rent3Houses: 3500,
    rentHotel: 5000,
    costOfHouse: 3000,
    costOfHotel: 3000,
    bankMortgageValue: 1250,
  },
  4: {
    cardId: 4,
    name: "KOLKATTA",
    group: "PINK",
    purchasePrice: 6500,
    rentSiteOnly: 800,
    rent1House: 3200,
    rent2Houses: 4500,
    rent3Houses: 6500,
    rentHotel: 8000,
    costOfHouse: 6000,
    costOfHotel: 6000,
    bankMortgageValue: 3250,
  },
  5: {
    cardId: 5,
    name: "HYDERABAD",
    group: "PINK",
    purchasePrice: 3500,
    rentSiteOnly: 300,
    rent1House: 1200,
    rent2Houses: 3000,
    rent3Houses: 4500,
    rentHotel: 6000,
    costOfHouse: 5000,
    costOfHotel: 5000,
    bankMortgageValue: 1750,
  },
  6: {
    cardId: 6,
    name: "INDORE",
    group: "BLUE",
    purchasePrice: 1500,
    rentSiteOnly: 200,
    rent1House: 600,
    rent2Houses: 1500,
    rent3Houses: 2500,
    rentHotel: 3600,
    costOfHouse: 2000,
    costOfHotel: 2000,
    bankMortgageValue: 750,
  },
  7: {
    cardId: 7,
    name: "JAIPUR",
    group: "BLUE",
    purchasePrice: 3000,
    rentSiteOnly: 250,
    rent1House: 1500,
    rent2Houses: 2750,
    rent3Houses: 4000,
    rentHotel: 5500,
    costOfHouse: 2500,
    costOfHotel: 2500,
    bankMortgageValue: 1500,
  },
  8: {
    cardId: 8,
    name: "AGRA",
    group: "BLUE",
    purchasePrice: 2500,
    rentSiteOnly: 200,
    rent1House: 900,
    rent2Houses: 1600,
    rent3Houses: 2500,
    rentHotel: 3500,
    costOfHouse: 2500,
    costOfHotel: 2500,
    bankMortgageValue: 1250,
  },
  9: {
    cardId: 9,
    name: "KANPUR",
    group: "BLUE",
    purchasePrice: 4000,
    rentSiteOnly: 400,
    rent1House: 1500,
    rent2Houses: 3000,
    rent3Houses: 4500,
    rentHotel: 5500,
    costOfHouse: 4500,
    costOfHotel: 4500,
    bankMortgageValue: 2000,
  },
  10: {
    cardId: 10,
    name: "PATNA",
    group: "BLUE",
    purchasePrice: 2000,
    rentSiteOnly: 150,
    rent1House: 800,
    rent2Houses: 2000,
    rent3Houses: 3000,
    rentHotel: 4500,
    costOfHouse: 2500,
    costOfHotel: 2500,
    bankMortgageValue: 1000,
  },
  11: {
    cardId: 11,
    name: "NEW DELHI",
    group: "GREEN",
    purchasePrice: 6000,
    rentSiteOnly: 750,
    rent1House: 3000,
    rent2Houses: 4300,
    rent3Houses: 5500,
    rentHotel: 7500,
    costOfHouse: 5000,
    costOfHotel: 5000,
    bankMortgageValue: 3000,
  },
  12: {
    cardId: 12,
    name: "CHANDIGARH",
    group: "GREEN",
    purchasePrice: 2500,
    rentSiteOnly: 200,
    rent1House: 900,
    rent2Houses: 1600,
    rent3Houses: 2500,
    rentHotel: 3500,
    costOfHouse: 3000,
    costOfHotel: 3000,
    bankMortgageValue: 1250,
  },
  13: {
    cardId: 13,
    name: "MYSORE",
    group: "GREEN",
    purchasePrice: 2500,
    rentSiteOnly: 200,
    rent1House: 1000,
    rent2Houses: 2250,
    rent3Houses: 3500,
    rentHotel: 4500,
    costOfHouse: 3000,
    costOfHotel: 3000,
    bankMortgageValue: 1250,
  },
  14: {
    cardId: 14,
    name: "COCHIN",
    group: "GREEN",
    purchasePrice: 3000,
    rentSiteOnly: 300,
    rent1House: 1200,
    rent2Houses: 2000,
    rent3Houses: 4250,
    rentHotel: 5500,
    costOfHouse: 4000,
    costOfHotel: 4000,
    bankMortgageValue: 1500,
  },
  15: {
    cardId: 15,
    name: "GOA",
    group: "GREEN",
    purchasePrice: 4000,
    rentSiteOnly: 400,
    rent1House: 2200,
    rent2Houses: 3500,
    rent3Houses: 5000,
    rentHotel: 6500,
    costOfHouse: 4500,
    costOfHotel: 4500,
    bankMortgageValue: 2000,
  },
  16: {
    cardId: 16,
    name: "SHIMLA",
    group: "YELLOW",
    purchasePrice: 2200,
    rentSiteOnly: 200,
    rent1House: 1000,
    rent2Houses: 2750,
    rent3Houses: 4500,
    rentHotel: 6000,
    costOfHouse: 3500,
    costOfHotel: 3500,
    bankMortgageValue: 1100,
  },
  17: {
    cardId: 17,
    name: "AMRITSAR",
    group: "YELLOW",
    purchasePrice: 3300,
    rentSiteOnly: 300,
    rent1House: 1400,
    rent2Houses: 2800,
    rent3Houses: 4000,
    rentHotel: 5000,
    costOfHouse: 4500,
    costOfHotel: 4500,
    bankMortgageValue: 1650,
  },
  18: {
    cardId: 18,
    name: "SRINAGAR",
    group: "YELLOW",
    purchasePrice: 5000,
    rentSiteOnly: 550,
    rent1House: 3500,
    rent2Houses: 5000,
    rent3Houses: 7000,
    rentHotel: 8000,
    costOfHouse: 6000,
    costOfHotel: 6000,
    bankMortgageValue: 2500,
  },
  19: {
    cardId: 19,
    name: "CHENNAI",
    group: "YELLOW",
    purchasePrice: 7000,
    rentSiteOnly: 900,
    rent1House: 3500,
    rent2Houses: 5000,
    rent3Houses: 7000,
    rentHotel: 8500,
    costOfHouse: 6500,
    costOfHotel: 6500,
    bankMortgageValue: 3500,
  },
  20: {
    cardId: 20,
    name: "BENGALURU",
    group: "YELLOW",
    purchasePrice: 4000,
    rentSiteOnly: 400,
    rent1House: 1500,
    rent2Houses: 3000,
    rent3Houses: 4500,
    rentHotel: 5500,
    costOfHouse: 4500,
    costOfHotel: 4500,
    bankMortgageValue: 2000,
  },
  21: {
    cardId: 21,
    name: "WATER WORKS",
    group: "UTILITY",
    purchasePrice: 3200,
    baseRent: 500,
    comboCardId: 25, // AIR INDIA
    comboRent: 1100,
    bankMortgageValue: 1600,
  },
  22: {
    cardId: 22,
    name: "RAILWAY",
    group: "TRANSPORT",
    purchasePrice: 9500,
    baseRent: 1000,
    comboCardId: 25, // AIR INDIA
    comboRent: 1350,
    bankMortgageValue: 4750,
  },
  23: {
    cardId: 23,
    name: "ELECTRIC COMPANY",
    group: "UTILITY",
    purchasePrice: 2500,
    diceMultiplierBase: 50,
    comboCardId: 26, // MOTOR BOAT
    comboDiceMultiplier: 100,
    bankMortgageValue: 1250,
  },
  24: {
    cardId: 24,
    name: "BEST",
    group: "TRANSPORT",
    purchasePrice: 3500,
    baseRent: 600,
    comboCardId: 22, // RAILWAY
    comboRent: 1110,
    bankMortgageValue: 1750,
  },
  25: {
    cardId: 25,
    name: "AIR INDIA",
    group: "TRANSPORT",
    purchasePrice: 10500,
    baseRent: 1200,
    comboCardId: 21, // WATER WORKS
    comboRent: 1500,
    bankMortgageValue: 5250,
  },
  26: {
    cardId: 26,
    name: "MOTOR BOAT",
    group: "UTILITY",
    purchasePrice: 5500,
    diceMultiplierBase: 100,
    comboCardId: 23, // ELECTRIC COMPANY
    comboDiceMultiplier: 200,
    bankMortgageValue: 2750,
  },
};

/**
 * 36 Sequential Board Spaces (0 to 35) matching the physical board
 */
const BOARD_SPACES = [
  {
    index: 0,
    name: "START",
    type: "START",
    reward: 1500,
    description: "COLLECT Rs. 1500 AS YOU PASS",
    side: "CORNER_TOP_RIGHT",
  },
  {
    index: 1,
    name: "MUMBAI",
    type: "PROPERTY",
    cardId: 1,
    colorGroup: "PINK",
    side: "RIGHT",
  },
  {
    index: 2,
    name: "WATER WORKS",
    type: "UTILITY",
    cardId: 21,
    colorGroup: "UTILITY",
    side: "RIGHT",
  },
  {
    index: 3,
    name: "RAILWAY",
    type: "TRANSPORT",
    cardId: 22,
    colorGroup: "TRANSPORT",
    side: "RIGHT",
  },
  {
    index: 4,
    name: "AHMEDABAD",
    type: "PROPERTY",
    cardId: 2,
    colorGroup: "PINK",
    side: "RIGHT",
  },
  {
    index: 5,
    name: "INCOME TAX",
    type: "TAX",
    amount: 500,
    description: "Pay Income Tax Rs. 500 to Bank",
    side: "RIGHT",
  },
  {
    index: 6,
    name: "INDORE",
    type: "PROPERTY",
    cardId: 6,
    colorGroup: "BLUE",
    side: "RIGHT",
  },
  {
    index: 7,
    name: "CHANCE",
    type: "CHANCE",
    description: "Chance (Dice roll determines card)",
    side: "RIGHT",
  },
  {
    index: 8,
    name: "JAIPUR",
    type: "PROPERTY",
    cardId: 7,
    colorGroup: "BLUE",
    side: "RIGHT",
  },
  {
    index: 9,
    name: "JAIL",
    type: "JAIL",
    fine: 500,
    description: "Jail / Just Visiting (Fine Rs. 500 to be released)",
    side: "CORNER_BOTTOM_RIGHT",
  },
  {
    index: 10,
    name: "NEW DELHI",
    type: "PROPERTY",
    cardId: 11,
    colorGroup: "GREEN",
    side: "BOTTOM",
  },
  {
    index: 11,
    name: "CHANDIGARH",
    type: "PROPERTY",
    cardId: 12,
    colorGroup: "GREEN",
    side: "BOTTOM",
  },
  {
    index: 12,
    name: "ELECTRIC COMPANY",
    type: "UTILITY",
    cardId: 23,
    colorGroup: "UTILITY",
    side: "BOTTOM",
  },
  {
    index: 13,
    name: "BEST",
    type: "TRANSPORT",
    cardId: 24,
    colorGroup: "TRANSPORT",
    side: "BOTTOM",
  },
  {
    index: 14,
    name: "SHIMLA",
    type: "PROPERTY",
    cardId: 16,
    colorGroup: "YELLOW",
    side: "BOTTOM",
  },
  {
    index: 15,
    name: "AMRITSAR",
    type: "PROPERTY",
    cardId: 17,
    colorGroup: "YELLOW",
    side: "BOTTOM",
  },
  {
    index: 16,
    name: "COMMUNITY CHEST",
    type: "COMMUNITY_CHEST",
    description: "Community Chest (Dice roll determines card)",
    side: "BOTTOM",
  },
  {
    index: 17,
    name: "SRINAGAR",
    type: "PROPERTY",
    cardId: 18,
    colorGroup: "YELLOW",
    side: "BOTTOM",
  },
  {
    index: 18,
    name: "CLUB",
    type: "CLUB",
    fee: 100,
    description: "Club entry fee Rs. 100 to Bank",
    side: "CORNER_BOTTOM_LEFT",
  },
  {
    index: 19,
    name: "AGRA",
    type: "PROPERTY",
    cardId: 8,
    colorGroup: "BLUE",
    side: "LEFT",
  },
  {
    index: 20,
    name: "CHANCE",
    type: "CHANCE",
    description: "Chance (Dice roll determines card)",
    side: "LEFT",
  },
  {
    index: 21,
    name: "KANPUR",
    type: "PROPERTY",
    cardId: 9,
    colorGroup: "BLUE",
    side: "LEFT",
  },
  {
    index: 22,
    name: "PATNA",
    type: "PROPERTY",
    cardId: 10,
    colorGroup: "BLUE",
    side: "LEFT",
  },
  {
    index: 23,
    name: "DARJEELING",
    type: "PROPERTY",
    cardId: 3,
    colorGroup: "PINK",
    side: "LEFT",
  },
  {
    index: 24,
    name: "AIR INDIA",
    type: "TRANSPORT",
    cardId: 25,
    colorGroup: "TRANSPORT",
    side: "LEFT",
  },
  {
    index: 25,
    name: "KOLKATTA",
    type: "PROPERTY",
    cardId: 4,
    colorGroup: "PINK",
    side: "LEFT",
  },
  {
    index: 26,
    name: "HYDERABAD",
    type: "PROPERTY",
    cardId: 5,
    colorGroup: "PINK",
    side: "LEFT",
  },
  {
    index: 27,
    name: "REST HOUSE",
    type: "REST_HOUSE",
    description: "Rest House / Miss next turn",
    side: "CORNER_TOP_LEFT",
  },
  {
    index: 28,
    name: "CHENNAI",
    type: "PROPERTY",
    cardId: 19,
    colorGroup: "YELLOW",
    side: "TOP",
  },
  {
    index: 29,
    name: "COMMUNITY CHEST",
    type: "COMMUNITY_CHEST",
    description: "Community Chest (Dice roll determines card)",
    side: "TOP",
  },
  {
    index: 30,
    name: "BENGALURU",
    type: "PROPERTY",
    cardId: 20,
    colorGroup: "YELLOW",
    side: "TOP",
  },
  {
    index: 31,
    name: "WEALTH TAX",
    type: "TAX",
    amount: 1000,
    description: "Pay Wealth Tax Rs. 1000 to Bank",
    side: "TOP",
  },
  {
    index: 32,
    name: "MYSORE",
    type: "PROPERTY",
    cardId: 13,
    colorGroup: "GREEN",
    side: "TOP",
  },
  {
    index: 33,
    name: "COCHIN",
    type: "PROPERTY",
    cardId: 14,
    colorGroup: "GREEN",
    side: "TOP",
  },
  {
    index: 34,
    name: "MOTOR BOAT",
    type: "UTILITY",
    cardId: 26,
    colorGroup: "UTILITY",
    side: "TOP",
  },
  {
    index: 35,
    name: "GOA",
    type: "PROPERTY",
    cardId: 15,
    colorGroup: "GREEN",
    side: "TOP",
  },
];

/**
 * Community Chest & Chance Cards matching the physical board
 */
const COMMUNITY_CHEST_CARDS = {
  ODD: {
    3: { action: "GO_TO_JAIL", text: "Go to jail", amount: 0 },
    5: { action: "PAY_BANK", text: "School and medical fees, Rs. 1000/-", amount: 1000 },
    7: { action: "PAY_BANK", text: "Marriage celebration, Rs. 2000/-", amount: 2000 },
    9: { action: "REPAIRS", text: "General repair on all your properties. Rs. 50/house, Rs. 100/hotel", perHouse: 50, perHotel: 100 },
    11: { action: "PAY_BANK", text: "Pay insurance premium, Rs. 1500/-", amount: 1500 },
  },
  EVEN: {
    2: { action: "BIRTHDAY", text: "It is your Birthday! Collect Rs. 500 from each player", amount: 500 },
    4: { action: "RECEIVE_BANK", text: "1st prize in reality TV show, Rs. 2500/-", amount: 2500 },
    6: { action: "RECEIVE_BANK", text: "Income tax refund, Rs. 2000/-", amount: 2000 },
    8: { action: "GO_TO_REST_HOUSE", text: "Go to Rest House, you cannot play next turn", amount: 0 },
    10: { action: "RECEIVE_BANK", text: "Receive interest on shares, Rs. 1500/-", amount: 1500 },
    12: { action: "RECEIVE_BANK", text: "Sale of stocks, collect Rs. 3000/-", amount: 3000 },
  },
};

const CHANCE_CARDS = {
  ODD: {
    3: { action: "RECEIVE_BANK", text: "Lottery Prize, Rs. 2500/-", amount: 2500 },
    5: { action: "RECEIVE_BANK", text: "Crossword competition prize, Rs. 1000/-", amount: 1000 },
    7: { action: "RECEIVE_BANK", text: "Won a Jack Pot of Rs. 2000/-", amount: 2000 },
    9: { action: "MOVE_TO_DARJEELING", text: "Go back to Mumbai. Pass starting point, collect Rs. 1500 and go to Darjeeling", amount: 1500, destinationIndex: 23 },
    11: { action: "RECEIVE_BANK", text: "Prize for Best performance in Export, Rs. 3000/-", amount: 3000 },
  },
  EVEN: {
    2: { action: "PAY_BANK", text: "Loss in share market, Rs. 2000/-", amount: 2000 },
    4: { action: "PAY_BANK", text: "Fine for accident due to driving under liquor influence, Rs. 1000/-", amount: 1000 },
    6: { action: "PAY_BANK", text: "House Repairs, Rs. 1500/-", amount: 1500 },
    8: { action: "PAY_BANK", text: "Loss due to fire in godown, Rs. 3000/-", amount: 3000 },
    10: { action: "GO_TO_JAIL", text: "Go to jail", amount: 0 },
    12: { action: "GO_TO_REST_HOUSE", text: "Go to Rest House, you cannot play next turn", amount: 0 },
  },
};

/**
 * Calculates exact rent for any property based on fixed rules,
 * ownership combination, house count, hotel status, and dice roll.
 */
function calculateRent({ property, ownerProperties = [], diceRoll = 7 }) {
  if (!property) return 0;

  // Mortgaged properties generate ₹0 rent (PRD & Dolly Plastic Rules Section 7)
  if (property.mortgageStatus) {
    return 0;
  }

  const card = TITLE_DEEDS[property.cardId];
  if (!card) return 0;

  // Utilities with dice multiplier: Electric Company (23) & Motor Boat (26)
  if (card.cardId === 23) {
    const ownsMotorBoat = ownerProperties.some((p) => p.cardId === 26);
    const multiplier = ownsMotorBoat ? card.comboDiceMultiplier : card.diceMultiplierBase;
    return diceRoll * multiplier;
  }
  if (card.cardId === 26) {
    const ownsElectric = ownerProperties.some((p) => p.cardId === 23);
    const multiplier = ownsElectric ? card.comboDiceMultiplier : card.diceMultiplierBase;
    return diceRoll * multiplier;
  }

  // Water Works (21)
  if (card.cardId === 21) {
    const ownsAirIndia = ownerProperties.some((p) => p.cardId === 25);
    return ownsAirIndia ? card.comboRent : card.baseRent;
  }

  // Railway (22)
  if (card.cardId === 22) {
    const ownsAirIndia = ownerProperties.some((p) => p.cardId === 25);
    return ownsAirIndia ? card.comboRent : card.baseRent;
  }

  // BEST (24)
  if (card.cardId === 24) {
    const ownsRailway = ownerProperties.some((p) => p.cardId === 22);
    return ownsRailway ? card.comboRent : card.baseRent;
  }

  // Air India (25)
  if (card.cardId === 25) {
    const ownsWaterWorks = ownerProperties.some((p) => p.cardId === 21);
    return ownsWaterWorks ? card.comboRent : card.baseRent;
  }

  // City Properties (Cards 1-20)
  if (property.hotelStatus) {
    return card.rentHotel;
  }

  if (property.houseCount === 3) {
    return card.rent3Houses;
  }
  if (property.houseCount === 2) {
    return card.rent2Houses;
  }
  if (property.houseCount === 1) {
    return card.rent1House;
  }

  // Unimproved site: check if owner owns 3 sites in this color group
  const sameGroupOwned = ownerProperties.filter((p) => {
    const c = TITLE_DEEDS[p.cardId];
    return c && c.group === card.group;
  }).length;

  if (sameGroupOwned >= 3) {
    // Official Rule: "If a player owns THREE sites of any colour group, the rent is doubled on unimproved sites in that group."
    return card.rentSiteOnly * 2;
  }

  return card.rentSiteOnly;
}

module.exports = {
  GAME_DATA_VERSION,
  COLOR_GROUPS,
  TITLE_DEEDS,
  BOARD_SPACES,
  COMMUNITY_CHEST_CARDS,
  CHANCE_CARDS,
  calculateRent,
};
