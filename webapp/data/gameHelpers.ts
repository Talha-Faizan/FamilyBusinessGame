import { BoardSpace, LoanContract } from '../types/game';

export const PASTEL_HEX: Record<string, string> = {
  yellow: '#FFD95A',
  pink: '#FF9EC4',
  blue: '#91D5F2',
  green: '#A8DDB9',
  orange: '#FFB66E',
  white: '#F8F7EF',
  gray: '#EAEAEA',
};

export const COLOR_GROUP_META: Record<
  string,
  { label: string; hex: string; textLight?: boolean }
> = {
  terracotta: { label: 'Heritage Brown', hex: '#8D5B4C', textLight: true },
  sky: { label: 'Coastal Sky', hex: '#57B8E4', textLight: false },
  magenta: { label: 'Boulevard Rose', hex: '#D95B96', textLight: true },
  tangerine: { label: 'Amber Circuit', hex: '#F38B3C', textLight: false },
  crimson: { label: 'Metro Crimson', hex: '#E04F4F', textLight: true },
  saffron: { label: 'Sunburst Gold', hex: '#E8C228', textLight: false },
  emerald: { label: 'Garden Emerald', hex: '#35A862', textLight: true },
  royal: { label: 'Marine Royal', hex: '#2F5597', textLight: true },
  transit: { label: 'Rail Network', hex: '#334155', textLight: true },
  utility: { label: 'Civic Grid', hex: '#64748B', textLight: true },
};

export function computeSpaceRent(space: BoardSpace, allSpaces: BoardSpace[]): number {
  if (space.isMortgaged) return 0;
  if (space.type === 'transit') {
    if (!space.ownerId) return space.baseRent ?? 1000;
    const ownedRails = allSpaces.filter(
      (s) => s.type === 'transit' && s.ownerId === space.ownerId && !s.isMortgaged
    ).length;
    return (space.baseRent ?? 1000) * Math.max(1, ownedRails);
  }
  if (space.type === 'utility') {
    return space.baseRent ?? 750;
  }
  if (space.hasHotel) return space.rentHotel ?? 0;
  if (space.houses === 3) return space.rent3House ?? 0;
  if (space.houses === 2) return space.rent2House ?? 0;
  if (space.houses === 1) return space.rent1House ?? 0;
  return space.baseRent ?? 0;
}

export function computePlayerPropertyValue(playerId: string, spaces: BoardSpace[]): number {
  return spaces
    .filter((s) => s.ownerId === playerId)
    .reduce((sum, s) => {
      const base = s.isMortgaged ? (s.mortgageValue ?? 0) : (s.price ?? 0);
      const build =
        s.houses * (s.houseCost ?? 0) + (s.hasHotel ? 3 * (s.houseCost ?? 0) + (s.hotelCost ?? 0) : 0);
      return sum + base + build;
    }, 0);
}

export function computePlayerDebt(playerId: string, loans: LoanContract[]): number {
  return loans
    .filter(
      (l) =>
        l.borrowerId === playerId &&
        (l.status === 'active' || l.status === 'auto-garnish')
    )
    .reduce((sum, l) => sum + Math.max(0, l.totalRepayment - l.amountRepaid), 0);
}
