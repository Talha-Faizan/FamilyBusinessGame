export type ScreenId =
  | 'welcome'            // Screen 1
  | 'create-game'        // Screen 2
  | 'join-game'          // Screen 3
  | 'lobby'              // Screen 4
  | 'dashboard'          // Screen 5
  | 'leaderboard'        // Screen 6
  | 'board'              // Screen 7
  | 'dice-input'         // Screen 8
  | 'rent-notification'  // Screen 9
  | 'my-properties'      // Screen 10
  | 'property-details'   // Screen 11
  | 'auction-market'     // Screen 12
  | 'auction-details'    // Screen 13
  | 'auction-result'     // Screen 14
  | 'loans-dashboard'    // Screen 15
  | 'request-loan'       // Screen 16
  | 'give-loan'          // Screen 17
  | 'loan-details'       // Screen 18
  | 'bankruptcy'         // Screen 19
  | 'send-money'         // Screen 20
  | 'transactions'       // Screen 21
  | 'notifications';     // Screen 22

export type GameMode = 'local' | 'online';

export type AvatarShapeId =
  | 'prism'
  | 'orbit'
  | 'monolith'
  | 'crown-geo'
  | 'diamond-grid'
  | 'arch-duo'
  | 'starburst'
  | 'stepped-hex';

export type PastelTone = 'yellow' | 'pink' | 'blue' | 'green' | 'orange' | 'white' | 'gray';

export type PropertyColorGroup =
  | 'terracotta'
  | 'sky'
  | 'magenta'
  | 'tangerine'
  | 'crimson'
  | 'saffron'
  | 'emerald'
  | 'royal'
  | 'transit'
  | 'utility';

export type SpaceType = 'start' | 'property' | 'transit' | 'utility' | 'tax' | 'chance' | 'chest' | 'corner';

export interface BoardSpace {
  index: number; // 0 to 23 around the 24-space physical board perimeter
  id: string;
  name: string;
  region?: string;
  type: SpaceType;
  colorGroup?: PropertyColorGroup;
  colorHex?: string;
  price?: number;
  baseRent?: number;
  rent1House?: number;
  rent2House?: number;
  rent3House?: number;
  rentHotel?: number;
  houseCost?: number;
  hotelCost?: number;
  mortgageValue?: number;
  taxAmount?: number;
  ownerId?: string | null;
  houses: number; // 0..3
  hasHotel: boolean;
  isMortgaged: boolean;
}

export interface Player {
  id: string;
  name: string;
  avatar: AvatarShapeId;
  accent: PastelTone;
  accentHex: string;
  cash: number;
  position: number;
  isHost?: boolean;
  isReady: boolean;
  isBankrupt?: boolean;
}

export interface GameConfig {
  roomCode: string;
  gameName: string;
  gameMode: GameMode;
  minPlayers: number;
  maxPlayers: number;
  startingMoney: number;
  auctionsEnabled: boolean;
  bankLoansEnabled: boolean;
  p2pLoansEnabled: boolean;
  maxInterestRate: number;
  defaultLoanRounds: number;
  doubleSetRent: boolean;
  evenBuildRule: boolean;
  mustLandOnPropertyToBuy?: boolean;
  doublesRollAgain?: boolean;
  clubPayPlayers?: boolean;
}

export interface MovementLog {
  id: string;
  playerId: string;
  playerName: string;
  die1: number;
  die2: number;
  total: number;
  fromIndex: number;
  fromName: string;
  toIndex: number;
  toName: string;
  passedStart: boolean;
  timestamp: string;
}

export type RentEventStatus = 'pending' | 'completed' | 'disputed';

export interface RentEvent {
  id: string;
  spaceId: string;
  propertyName: string;
  colorHex: string;
  visitorId: string;
  visitorName: string;
  ownerId: string;
  ownerName: string;
  amount: number;
  status: RentEventStatus;
  timestamp: string;
  disputeReason?: string;
}

export interface AuctionBid {
  id: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  timestamp: string;
}

export interface AuctionItem {
  id: string;
  spaceId: string;
  propertyName: string;
  colorGroup: PropertyColorGroup;
  colorHex: string;
  sellerId: string;
  sellerName: string;
  startingBid: number;
  currentBid: number;
  highestBidderId: string | null;
  highestBidderName: string | null;
  secondsRemaining: number;
  status: 'active' | 'settled';
  bids: AuctionBid[];
}

export interface LoanRepaymentEntry {
  id: string;
  amount: number;
  timestamp: string;
  source: 'manual' | 'auto-garnish';
}

export interface LoanContract {
  id: string;
  agreementCode: string;
  lenderId: string; // 'bank' or player.id
  lenderName: string;
  borrowerId: string;
  borrowerName: string;
  principal: number;
  interestRate: number; // 0 for interest-free
  totalRepayment: number;
  amountRepaid: number;
  terms: string;
  status: 'active' | 'pending-approval' | 'settled' | 'auto-garnish';
  createdAt: string;
  repayments: LoanRepaymentEntry[];
}

export type TransactionCategory =
  | 'rent-paid'
  | 'rent-received'
  | 'transfer'
  | 'property-purchase'
  | 'auction'
  | 'loan-repayment'
  | 'tax'
  | 'reward';

export interface TransactionItem {
  id: string;
  category: TransactionCategory;
  title: string;
  subtitle: string;
  amount: number;
  direction: 'in' | 'out' | 'neutral';
  fromName: string;
  toName: string;
  timestamp: string;
  pastel: PastelTone;
}

export type NotificationCategory =
  | 'rent-request'
  | 'auction-bid'
  | 'outbid'
  | 'loan-request'
  | 'loan-repayment'
  | 'property-purchase'
  | 'player-activity'
  | 'bankruptcy';

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  pastel: PastelTone;
  targetScreen: ScreenId;
  ctaLabel?: string;
}
