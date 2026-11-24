export interface OfficialDeed {
  cardId: number;
  name: string;
  group: string;
  purchasePrice: number;
  rentSiteOnly: number;
  rent1House: number;
  rent2Houses: number;
  rent3Houses: number;
  rentHotel: number;
  costOfHouse: number;
  costOfHotel: number;
  bankMortgageValue: number;
}

export const OFFICIAL_TITLE_DEEDS: Record<number, OfficialDeed> = {
  1: { cardId: 1, name: 'MUMBAI', group: 'PINK', purchasePrice: 8500, rentSiteOnly: 1200, rent1House: 4000, rent2Houses: 5500, rent3Houses: 7500, rentHotel: 9000, costOfHouse: 7500, costOfHotel: 7500, bankMortgageValue: 4250 },
  2: { cardId: 2, name: 'AHMEDABAD', group: 'PINK', purchasePrice: 4000, rentSiteOnly: 400, rent1House: 1500, rent2Houses: 3000, rent3Houses: 4200, rentHotel: 5000, costOfHouse: 4500, costOfHotel: 4500, bankMortgageValue: 2000 },
  3: { cardId: 3, name: 'DARJEELING', group: 'PINK', purchasePrice: 2500, rentSiteOnly: 200, rent1House: 1200, rent2Houses: 2600, rent3Houses: 3500, rentHotel: 5000, costOfHouse: 3000, costOfHotel: 3000, bankMortgageValue: 1250 },
  4: { cardId: 4, name: 'KOLKATTA', group: 'PINK', purchasePrice: 6500, rentSiteOnly: 800, rent1House: 3200, rent2Houses: 4500, rent3Houses: 6500, rentHotel: 8000, costOfHouse: 6000, costOfHotel: 6000, bankMortgageValue: 3250 },
  5: { cardId: 5, name: 'HYDERABAD', group: 'PINK', purchasePrice: 3500, rentSiteOnly: 300, rent1House: 1200, rent2Houses: 3000, rent3Houses: 4500, rentHotel: 6000, costOfHouse: 5000, costOfHotel: 5000, bankMortgageValue: 1750 },
  6: { cardId: 6, name: 'INDORE', group: 'BLUE', purchasePrice: 1500, rentSiteOnly: 200, rent1House: 600, rent2Houses: 1500, rent3Houses: 2500, rentHotel: 3600, costOfHouse: 2000, costOfHotel: 2000, bankMortgageValue: 750 },
  7: { cardId: 7, name: 'JAIPUR', group: 'BLUE', purchasePrice: 3000, rentSiteOnly: 250, rent1House: 1500, rent2Houses: 2750, rent3Houses: 4000, rentHotel: 5500, costOfHouse: 4000, costOfHotel: 4000, bankMortgageValue: 1500 },
  8: { cardId: 8, name: 'AGRA', group: 'BLUE', purchasePrice: 2500, rentSiteOnly: 200, rent1House: 900, rent2Houses: 1600, rent3Houses: 2500, rentHotel: 3500, costOfHouse: 3000, costOfHotel: 3000, bankMortgageValue: 1250 },
  9: { cardId: 9, name: 'KANPUR', group: 'BLUE', purchasePrice: 4000, rentSiteOnly: 400, rent1House: 1500, rent2Houses: 3000, rent3Houses: 4500, rentHotel: 5500, costOfHouse: 4500, costOfHotel: 4500, bankMortgageValue: 2000 },
  10: { cardId: 10, name: 'PATNA', group: 'BLUE', purchasePrice: 2000, rentSiteOnly: 150, rent1House: 800, rent2Houses: 2000, rent3Houses: 3000, rentHotel: 4500, costOfHouse: 2500, costOfHotel: 2500, bankMortgageValue: 1000 },
  11: { cardId: 11, name: 'NEW DELHI', group: 'GREEN', purchasePrice: 6000, rentSiteOnly: 750, rent1House: 3000, rent2Houses: 4300, rent3Houses: 5500, rentHotel: 7500, costOfHouse: 5000, costOfHotel: 5000, bankMortgageValue: 3000 },
  12: { cardId: 12, name: 'CHANDIGARH', group: 'GREEN', purchasePrice: 2500, rentSiteOnly: 200, rent1House: 900, rent2Houses: 1600, rent3Houses: 2500, rentHotel: 3500, costOfHouse: 3000, costOfHotel: 3000, bankMortgageValue: 1250 },
  13: { cardId: 13, name: 'MYSORE', group: 'GREEN', purchasePrice: 2500, rentSiteOnly: 200, rent1House: 1000, rent2Houses: 2250, rent3Houses: 3500, rentHotel: 4500, costOfHouse: 3000, costOfHotel: 3000, bankMortgageValue: 1250 },
  14: { cardId: 14, name: 'COCHIN', group: 'GREEN', purchasePrice: 3000, rentSiteOnly: 300, rent1House: 1200, rent2Houses: 2000, rent3Houses: 4250, rentHotel: 5500, costOfHouse: 4000, costOfHotel: 4000, bankMortgageValue: 1500 },
  15: { cardId: 15, name: 'GOA', group: 'GREEN', purchasePrice: 4000, rentSiteOnly: 400, rent1House: 2200, rent2Houses: 3500, rent3Houses: 5000, rentHotel: 6500, costOfHouse: 4500, costOfHotel: 4500, bankMortgageValue: 2000 },
  16: { cardId: 16, name: 'SHIMLA', group: 'YELLOW', purchasePrice: 2200, rentSiteOnly: 200, rent1House: 1000, rent2Houses: 2750, rent3Houses: 4500, rentHotel: 6000, costOfHouse: 3500, costOfHotel: 3500, bankMortgageValue: 1100 },
  17: { cardId: 17, name: 'AMRITSAR', group: 'YELLOW', purchasePrice: 3300, rentSiteOnly: 300, rent1House: 1400, rent2Houses: 2800, rent3Houses: 4000, rentHotel: 5000, costOfHouse: 4500, costOfHotel: 4500, bankMortgageValue: 1650 },
  18: { cardId: 18, name: 'SRINAGAR', group: 'YELLOW', purchasePrice: 5000, rentSiteOnly: 550, rent1House: 3500, rent2Houses: 5000, rent3Houses: 7000, rentHotel: 8000, costOfHouse: 6000, costOfHotel: 6000, bankMortgageValue: 2500 },
  19: { cardId: 19, name: 'CHENNAI', group: 'YELLOW', purchasePrice: 7000, rentSiteOnly: 900, rent1House: 3500, rent2Houses: 5000, rent3Houses: 7000, rentHotel: 8500, costOfHouse: 6500, costOfHotel: 6500, bankMortgageValue: 3500 },
  20: { cardId: 20, name: 'BENGALURU', group: 'YELLOW', purchasePrice: 4000, rentSiteOnly: 400, rent1House: 1500, rent2Houses: 3000, rent3Houses: 4500, rentHotel: 5500, costOfHouse: 4500, costOfHotel: 4500, bankMortgageValue: 2000 },
  21: { cardId: 21, name: 'WATER WORKS', group: 'UTILITY', purchasePrice: 3200, rentSiteOnly: 500, rent1House: 500, rent2Houses: 500, rent3Houses: 500, rentHotel: 500, costOfHouse: 0, costOfHotel: 0, bankMortgageValue: 1600 },
  22: { cardId: 22, name: 'RAILWAY', group: 'TRANSPORT', purchasePrice: 9500, rentSiteOnly: 1000, rent1House: 1000, rent2Houses: 1000, rent3Houses: 1000, rentHotel: 1000, costOfHouse: 0, costOfHotel: 0, bankMortgageValue: 4750 },
  23: { cardId: 23, name: 'ELECTRIC COMPANY', group: 'UTILITY', purchasePrice: 2500, rentSiteOnly: 400, rent1House: 400, rent2Houses: 400, rent3Houses: 400, rentHotel: 400, costOfHouse: 0, costOfHotel: 0, bankMortgageValue: 1250 },
  24: { cardId: 24, name: 'BEST', group: 'TRANSPORT', purchasePrice: 3500, rentSiteOnly: 600, rent1House: 600, rent2Houses: 600, rent3Houses: 600, rentHotel: 600, costOfHouse: 0, costOfHotel: 0, bankMortgageValue: 1750 },
  25: { cardId: 25, name: 'AIR INDIA', group: 'TRANSPORT', purchasePrice: 10500, rentSiteOnly: 1200, rent1House: 1200, rent2Houses: 1200, rent3Houses: 1200, rentHotel: 1200, costOfHouse: 0, costOfHotel: 0, bankMortgageValue: 5250 },
  26: { cardId: 26, name: 'MOTOR BOAT', group: 'UTILITY', purchasePrice: 5500, rentSiteOnly: 800, rent1House: 800, rent2Houses: 800, rent3Houses: 800, rentHotel: 800, costOfHouse: 0, costOfHotel: 0, bankMortgageValue: 2750 },
};

export const OFFICIAL_36_BOARD_SPACES = [
  { index: 0, name: 'START', type: 'START', reward: 1500, description: 'COLLECT ₹1,500 AS YOU PASS' },
  { index: 1, name: 'MUMBAI', type: 'PROPERTY', cardId: 1, colorGroup: 'PINK' },
  { index: 2, name: 'WATER WORKS', type: 'UTILITY', cardId: 21, colorGroup: 'UTILITY' },
  { index: 3, name: 'RAILWAY', type: 'TRANSPORT', cardId: 22, colorGroup: 'TRANSPORT' },
  { index: 4, name: 'AHMEDABAD', type: 'PROPERTY', cardId: 2, colorGroup: 'PINK' },
  { index: 5, name: 'INCOME TAX', type: 'TAX', amount: 1500, description: 'Pay Income Tax ₹1,500 to Bank' },
  { index: 6, name: 'INDORE', type: 'PROPERTY', cardId: 6, colorGroup: 'BLUE' },
  { index: 7, name: 'CHANCE', type: 'CHANCE', description: 'Draw Chance card by dice parity' },
  { index: 8, name: 'JAIPUR', type: 'PROPERTY', cardId: 7, colorGroup: 'BLUE' },
  { index: 9, name: 'JAIL', type: 'CORNER', description: 'Visiting or Locked Up' },
  { index: 10, name: 'NEW DELHI', type: 'PROPERTY', cardId: 11, colorGroup: 'GREEN' },
  { index: 11, name: 'CHANDIGARH', type: 'PROPERTY', cardId: 12, colorGroup: 'GREEN' },
  { index: 12, name: 'ELECTRIC COMPANY', type: 'UTILITY', cardId: 23, colorGroup: 'UTILITY' },
  { index: 13, name: 'BEST', type: 'TRANSPORT', cardId: 24, colorGroup: 'TRANSPORT' },
  { index: 14, name: 'SHIMLA', type: 'PROPERTY', cardId: 16, colorGroup: 'YELLOW' },
  { index: 15, name: 'AMRITSAR', type: 'PROPERTY', cardId: 17, colorGroup: 'YELLOW' },
  { index: 16, name: 'COMMUNITY CHEST', type: 'COMMUNITY_CHEST', description: 'Draw Community Chest card' },
  { index: 17, name: 'SRINAGAR', type: 'PROPERTY', cardId: 18, colorGroup: 'YELLOW' },
  { index: 18, name: 'CLUB', type: 'CORNER', description: 'Club lounge / resting zone' },
  { index: 19, name: 'AGRA', type: 'PROPERTY', cardId: 8, colorGroup: 'BLUE' },
  { index: 20, name: 'CHANCE', type: 'CHANCE', description: 'Draw Chance card by dice parity' },
  { index: 21, name: 'KANPUR', type: 'PROPERTY', cardId: 9, colorGroup: 'BLUE' },
  { index: 22, name: 'PATNA', type: 'PROPERTY', cardId: 10, colorGroup: 'BLUE' },
  { index: 23, name: 'DARJEELING', type: 'PROPERTY', cardId: 3, colorGroup: 'PINK' },
  { index: 24, name: 'AIR INDIA', type: 'TRANSPORT', cardId: 25, colorGroup: 'TRANSPORT' },
  { index: 25, name: 'KOLKATTA', type: 'PROPERTY', cardId: 4, colorGroup: 'PINK' },
  { index: 26, name: 'HYDERABAD', type: 'PROPERTY', cardId: 5, colorGroup: 'PINK' },
  { index: 27, name: 'REST HOUSE', type: 'CORNER', description: 'Rest House · Skip next turn' },
  { index: 28, name: 'CHENNAI', type: 'PROPERTY', cardId: 19, colorGroup: 'YELLOW' },
  { index: 29, name: 'COMMUNITY CHEST', type: 'COMMUNITY_CHEST', description: 'Draw Community Chest card' },
  { index: 30, name: 'BENGALURU', type: 'PROPERTY', cardId: 20, colorGroup: 'YELLOW' },
  { index: 31, name: 'WEALTH TAX', type: 'TAX', amount: 1000, description: 'Pay Wealth Tax ₹1,000 to Bank' },
  { index: 32, name: 'MYSORE', type: 'PROPERTY', cardId: 13, colorGroup: 'GREEN' },
  { index: 33, name: 'COCHIN', type: 'PROPERTY', cardId: 14, colorGroup: 'GREEN' },
  { index: 34, name: 'MOTOR BOAT', type: 'UTILITY', cardId: 26, colorGroup: 'UTILITY' },
  { index: 35, name: 'GOA', type: 'PROPERTY', cardId: 15, colorGroup: 'GREEN' },
];

export function mapColorGroup(group?: string) {
  switch (group) {
    case 'PINK': return 'magenta' as const;
    case 'BLUE': return 'sky' as const;
    case 'GREEN': return 'emerald' as const;
    case 'YELLOW': return 'saffron' as const;
    case 'UTILITY': return 'utility' as const;
    case 'TRANSPORT': return 'transit' as const;
    default: return 'terracotta' as const;
  }
}

export function mapColorHex(group?: string) {
  switch (group) {
    case 'PINK': return '#FF69B4';
    case 'BLUE': return '#64B5F6';
    case 'GREEN': return '#81C784';
    case 'YELLOW': return '#FFD54F';
    case 'UTILITY': return '#B0BEC5';
    case 'TRANSPORT': return '#90A4AE';
    default: return '#8D5B4C';
  }
}
