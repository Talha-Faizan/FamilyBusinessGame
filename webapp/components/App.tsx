"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Activity,
  Bell,
  Dice5,
  Gavel,
  HandCoins,
  Layers,
  LogOut,
  Sparkles,
} from 'lucide-react';
import {
  Building as PixelBuilding,
  Coins as PixelCoins,
  Gamepad as PixelGamepad,
  Home as PixelHome,
  Receipt as PixelReceipt,
  Trophy as PixelTrophy,
  Users as PixelUsers,
  Wallet as PixelWallet,
} from 'pixelarticons/react';
import {
  computeSpaceRent,
  PASTEL_HEX,
} from '../data/gameHelpers';
import {
  OFFICIAL_36_BOARD_SPACES,
  OFFICIAL_TITLE_DEEDS,
  mapColorGroup,
  mapColorHex,
} from '../data/officialBoardData';
import {
  AppNotification,
  AuctionItem,
  AvatarShapeId,
  BoardSpace,
  GameConfig,
  LoanContract,
  MovementLog,
  PastelTone,
  Player,
  RentEvent,
  ScreenId,
  TransactionCategory,
  TransactionItem,
} from '../types/game';
import {
  AnimatedCurrency,
  Button,
  formatINR,
  GeometricAvatar,
  PastelCard,
  StatusBadge,
} from './ui/Primitives';
import {
  CreateGameScreen,
  JoinGameScreen,
  MultiplayerLobbyScreen,
  WelcomeScreen,
} from './screens/AuthLobbyScreens';
import {
  BoardTrackingScreen,
  DiceInputScreen,
  LeaderboardScreen,
  MainDashboardScreen,
  RentNotificationScreen,
  useRankedPlayers,
} from './screens/GameplayScreens';
import {
  AuctionDetailsScreen,
  AuctionMarketplaceScreen,
  AuctionResultScreen,
  formatCountdown,
  MyPropertiesScreen,
  PropertyDetailsScreen,
} from './screens/PropertyAuctionScreens';
import {
  BankruptcyScreen,
  GiveLoanScreen,
  LoanDetailsScreen,
  LoansDashboardScreen,
  NotificationsScreen,
  RequestLoanScreen,
  SendMoneyScreen,
  TransactionHistoryScreen,
} from './screens/LoansBankingScreens';
import { api, pingServerHealth } from '../services/api';
import {
  getSocket,
  joinGameRoom,
  leaveGameRoom,
  onSocketStatusChange,
} from '../services/socket';

const DEFAULT_CONFIG: GameConfig = {
  roomCode: '',
  gameName: 'Property Business Arena',
  gameMode: 'local',
  minPlayers: 2,
  maxPlayers: 6,
  startingMoney: 30000,
  auctionsEnabled: true,
  bankLoansEnabled: true,
  p2pLoansEnabled: true,
  maxInterestRate: 15,
  defaultLoanRounds: 5,
  doubleSetRent: true,
  evenBuildRule: true,
  mustLandOnPropertyToBuy: true,
  doublesRollAgain: true,
  clubPayPlayers: true,
};

const INITIAL_RENT_PLACEHOLDER: RentEvent = {
  id: 'EVT-NONE',
  spaceId: '',
  propertyName: 'None',
  colorHex: '#2F5597',
  visitorId: '',
  visitorName: '',
  ownerId: '',
  ownerName: '',
  amount: 0,
  status: 'completed',
  timestamp: 'No pending rent',
};

// Generate base 36 spaces from official title deeds & board layout
function buildDefaultSpaces(): BoardSpace[] {
  return OFFICIAL_36_BOARD_SPACES.map((sp) => {
    const deed = sp.cardId ? OFFICIAL_TITLE_DEEDS[sp.cardId] : null;
    return {
      index: sp.index,
      id: `sp-${sp.index}`,
      name: sp.name,
      region: sp.description || (deed ? `${deed.group} Group` : undefined),
      type: sp.type.toLowerCase() as any,
      colorGroup: sp.colorGroup ? mapColorGroup(sp.colorGroup) : undefined,
      colorHex: sp.colorGroup ? mapColorHex(sp.colorGroup) : undefined,
      price: deed?.purchasePrice || (sp as any).amount,
      baseRent: deed?.rentSiteOnly,
      rent1House: deed?.rent1House,
      rent2House: deed?.rent2Houses,
      rent3House: deed?.rent3Houses,
      rentHotel: deed?.rentHotel,
      houseCost: deed?.costOfHouse,
      hotelCost: deed?.costOfHotel,
      mortgageValue: deed?.bankMortgageValue,
      taxAmount: sp.type === 'TAX' ? (sp as any).amount : undefined,
      ownerId: null,
      houses: 0,
      hasHotel: false,
      isMortgaged: false,
    };
  });
}

export const SLUG_TO_SCREEN: Record<string, ScreenId> = {
  dashboard: 'dashboard',
  board: 'board',
  activity: 'transactions',
  transactions: 'transactions',
  dice: 'dice-input',
  'dice-input': 'dice-input',
  leaderboard: 'leaderboard',
  properties: 'my-properties',
  'my-properties': 'my-properties',
  'property-details': 'property-details',
  auctions: 'auction-market',
  'auction-market': 'auction-market',
  'auction-details': 'auction-details',
  'auction-result': 'auction-result',
  loans: 'loans-dashboard',
  'loans-dashboard': 'loans-dashboard',
  'request-loan': 'request-loan',
  'give-loan': 'give-loan',
  'loan-details': 'loan-details',
  bankruptcy: 'bankruptcy',
  'send-money': 'send-money',
  rent: 'rent-notification',
  'rent-notification': 'rent-notification',
  notifications: 'notifications',
  lobby: 'lobby',
  welcome: 'welcome',
  'create-game': 'create-game',
  'join-game': 'join-game',
};

export const SCREEN_TO_SLUG: Record<ScreenId, string> = {
  dashboard: 'dashboard',
  board: 'board',
  transactions: 'activity',
  'dice-input': 'dice',
  leaderboard: 'leaderboard',
  'my-properties': 'properties',
  'property-details': 'property-details',
  'auction-market': 'auctions',
  'auction-details': 'auction-details',
  'auction-result': 'auction-result',
  'loans-dashboard': 'loans',
  'request-loan': 'request-loan',
  'give-loan': 'give-loan',
  'loan-details': 'loan-details',
  bankruptcy: 'bankruptcy',
  'send-money': 'send-money',
  'rent-notification': 'rent',
  notifications: 'notifications',
  lobby: 'lobby',
  welcome: 'welcome',
  'create-game': 'create-game',
  'join-game': 'join-game',
};

export default function App() {
  const routeParams = useParams<{ roomCode?: string; tab?: string[] | string }>();

  const urlRoomCode = routeParams?.roomCode ? String(routeParams.roomCode).toUpperCase() : '';
  const urlTab = routeParams?.tab
    ? Array.isArray(routeParams.tab)
      ? routeParams.tab[0]
      : String(routeParams.tab)
    : '';

  const initialScreenFromRoute =
    urlTab && SLUG_TO_SCREEN[urlTab.toLowerCase()]
      ? SLUG_TO_SCREEN[urlTab.toLowerCase()]
      : urlRoomCode
        ? 'dashboard'
        : 'welcome';

  const [screen, setScreenState] = useState<ScreenId>(initialScreenFromRoute);
  const [gameId, setGameId] = useState<string>('');

  const [config, setConfig] = useState<GameConfig>({
    ...DEFAULT_CONFIG,
    roomCode: urlRoomCode || DEFAULT_CONFIG.roomCode,
  });

  const setScreen = useCallback(
    (targetScreen: ScreenId) => {
      setScreenState(targetScreen);
      const activeCode = config.roomCode || urlRoomCode;
      if (
        activeCode &&
        targetScreen !== 'welcome' &&
        targetScreen !== 'create-game' &&
        targetScreen !== 'join-game'
      ) {
        const slug = SCREEN_TO_SLUG[targetScreen] || targetScreen;
        const targetPath = `/${activeCode.toUpperCase()}/${slug}`;
        if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
          window.history.pushState(null, '', targetPath);
        }
      } else if (targetScreen === 'welcome') {
        if (typeof window !== 'undefined' && window.location.pathname !== '/') {
          window.history.pushState(null, '', '/');
        }
      }
    },
    [config.roomCode, urlRoomCode]
  );

  // Sync browser Back/Forward buttons smoothly without page reload or jitter
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === 'undefined') return;
      const path = window.location.pathname;
      const parts = path.split('/').filter(Boolean);
      if (parts.length >= 2) {
        const tabSlug = parts[1].toLowerCase();
        const mapped = SLUG_TO_SCREEN[tabSlug];
        if (mapped) {
          setScreenState(mapped);
        }
      } else if (parts.length === 1) {
        setScreenState('dashboard');
      } else {
        setScreenState('welcome');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [players, setPlayers] = useState<Player[]>([]);
  const [activePlayerId, setActivePlayerId] = useState<string>('');
  const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState<string>('');
  const [spaces, setSpaces] = useState<BoardSpace[]>(buildDefaultSpaces);
  const [movements, setMovements] = useState<MovementLog[]>([]);
  const [rentEvent, setRentEvent] = useState<RentEvent>(INITIAL_RENT_PLACEHOLDER);
  const [auctions, setAuctions] = useState<AuctionItem[]>([]);
interface UnownedLandingEvent {
  gameId: string;
  propertyId: string;
  cardId?: string;
  name: string;
  colorGroup?: string;
  price: number;
  landingPlayerId: string;
  landingPlayerName: string;
  canAfford: boolean;
}

interface AuctionPromptEvent {
  gameId: string;
  propertyId: string;
  cardId?: string;
  propertyName: string;
  colorGroup?: string;
  price: number;
  declinedByPlayerId: string;
  declinedByPlayerName: string;
  passVotes: string[];
}

  const [loans, setLoans] = useState<LoanContract[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeRentAlert, setActiveRentAlert] = useState<any | null>(null);
  const [unownedLanding, setUnownedLanding] = useState<UnownedLandingEvent | null>(null);
  const [auctionPrompt, setAuctionPrompt] = useState<AuctionPromptEvent | null>(null);

  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('sp-1');
  const [popupSpaceId, setPopupSpaceId] = useState<string | null>(null);
  const [buyConfirmSpaceId, setBuyConfirmSpaceId] = useState<string | null>(null);
  const [popupAuctionBid, setPopupAuctionBid] = useState<number>(50);
  const [landingEventModal, setLandingEventModal] = useState<{
    title: string;
    subtitle: string;
    message: string;
    tone: PastelTone;
    emoji: string;
  } | null>(null);
  const [selectedAuctionId, setSelectedAuctionId] = useState<string>('');
  const [selectedLoanId, setSelectedLoanId] = useState<string>('');
  const [toast, setToast] = useState<{ text: string; tone: PastelTone } | null>(null);
  const [isWakingServer, setIsWakingServer] = useState(false);
  const [visualPositions, setVisualPositions] = useState<Record<string, number>>({});
  const [movingPlayerId, setMovingPlayerId] = useState<string | null>(null);
  const [isRollingDice, setIsRollingDice] = useState(false);
  const [lastDiceRoll, setLastDiceRoll] = useState<{
    playerId: string;
    playerName: string;
    die1: number;
    die2: number;
    total: number;
  } | null>(null);

  const animTimersRef = useRef<number[]>([]);
  const lastAnimatedMovementIdRef = useRef<string>('');
  const animatingUntilRef = useRef<number>(0);
  const configGameModeRef = useRef(config.gameMode);

  useEffect(() => {
    configGameModeRef.current = config.gameMode;
  }, [config.gameMode]);

  useEffect(() => {
    return () => {
      animTimersRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const animatePlayerSteps = useCallback(
    (
      playerId: string,
      fromPos: number,
      toPos: number,
      totalSteps: number,
      movementId?: string,
      onComplete?: () => void
    ): number => {
      if (movementId && lastAnimatedMovementIdRef.current === movementId) {
        onComplete?.();
        return 0;
      }
      if (movementId) {
        lastAnimatedMovementIdRef.current = movementId;
      }

      animTimersRef.current.forEach((id) => window.clearTimeout(id));
      animTimersRef.current = [];

      const boardLen = spaces.length || 36;
      const computedSteps = totalSteps > 0 ? totalSteps : (toPos - fromPos + boardLen) % boardLen;
      const stepsCount = Math.max(1, Math.min(computedSteps, 12));
      const path: number[] = [];
      for (let s = 1; s <= stepsCount; s++) {
        path.push((fromPos + s) % boardLen);
      }
      if (path[path.length - 1] !== toPos) {
        path[path.length - 1] = toPos;
      }

      const stepMs = 170;
      const totalDuration = stepsCount * stepMs + 200;
      animatingUntilRef.current = Date.now() + totalDuration;

      setMovingPlayerId(playerId);
      setVisualPositions((prev) => ({ ...prev, [playerId]: fromPos }));

      path.forEach((pos, idx) => {
        const tid = window.setTimeout(() => {
          setVisualPositions((prev) => ({ ...prev, [playerId]: pos }));
          if (idx === path.length - 1) {
            const doneTid = window.setTimeout(() => {
              setMovingPlayerId(null);
              setVisualPositions((prev) => {
                const copy = { ...prev };
                delete copy[playerId];
                return copy;
              });
              onComplete?.();
            }, 200);
            animTimersRef.current.push(doneTid);
          }
        }, (idx + 1) * stepMs);
        animTimersRef.current.push(tid);
      });

      return totalDuration;
    },
    [spaces.length]
  );

  const showToast = useCallback((text: string, tone: PastelTone = 'yellow') => {
    setToast({ text, tone });
  }, []);

  const activePlayer = useMemo(() => {
    const found = players.find((p) => p.id === activePlayerId);
    if (found) return found;
    return (
      players[0] || {
        id: 'p-guest',
        name: 'Guest Player',
        avatar: 'prism' as AvatarShapeId,
        accent: 'yellow' as PastelTone,
        accentHex: '#FFD95A',
        cash: config.startingMoney,
        position: 0,
        isReady: false,
        isBankrupt: false,
      }
    );
  }, [players, activePlayerId, config.startingMoney]);

  const rankedPlayers = useRankedPlayers(players, spaces, loans);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(id);
  }, [toast]);

  const gameIdRef = useRef(gameId);
  const activePlayerIdRef = useRef(activePlayerId);
  const screenRef = useRef(screen);
  const selectedAuctionIdRef = useRef(selectedAuctionId);
  const isSyncingRef = useRef(false);
  const pendingSyncRef = useRef(false);

  useEffect(() => {
    gameIdRef.current = gameId;
  }, [gameId]);

  useEffect(() => {
    activePlayerIdRef.current = activePlayerId;
  }, [activePlayerId]);

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  useEffect(() => {
    selectedAuctionIdRef.current = selectedAuctionId;
  }, [selectedAuctionId]);

  // Synchronize Authoritative Game State from Backend MongoDB with deep equality bailouts
  const syncAuthoritativeGameState = useCallback(
    async (targetGameId: string, currentPid?: string) => {
      try {
        const data = await api.getGameState(targetGameId);
        if (!data || !data.game) return;

        if (data.game.currentTurnPlayerId) {
          setCurrentTurnPlayerId(data.game.currentTurnPlayerId);
        }

        const effectivePid = currentPid || activePlayerIdRef.current;

        // Map Game Config with memoized bailout
        setConfig((prev) => {
          const newCode = data.game.roomCode || '';
          const newMode = data.game.gameSettings?.gameMode === 'ONLINE' ? 'online' : 'local';
          const newMin = data.game.minimumPlayers || 2;
          const newMax = data.game.maximumPlayers || 6;
          const newCash = data.game.gameSettings?.startingMoney || 50000;
          if (
            prev.roomCode === newCode &&
            prev.gameMode === newMode &&
            prev.minPlayers === newMin &&
            prev.maxPlayers === newMax &&
            prev.startingMoney === newCash
          ) {
            return prev;
          }
          return {
            ...prev,
            roomCode: newCode,
            gameMode: newMode,
            gameName: data.game.gameName || prev.gameName,
            minPlayers: newMin,
            maxPlayers: newMax,
            startingMoney: newCash,
            auctionsEnabled: data.game.gameSettings?.auctionEnabled !== false,
            bankLoansEnabled: data.game.gameSettings?.bankLoanEnabled !== false,
            p2pLoansEnabled: data.game.gameSettings?.playerLoanEnabled !== false,
            maxInterestRate: data.game.gameSettings?.bankInterestRate || prev.maxInterestRate,
          };
        });

        // Map Players
        const backendPlayers = data.players || [];
        const mappedPlayers: Player[] = backendPlayers.map((p: any) => {
          const accent = (p.color as PastelTone) || 'yellow';
          return {
            id: p.playerId || p.id,
            name: p.username || p.name || 'Player',
            avatar: (p.avatar as AvatarShapeId) || 'prism',
            accent: accent in PASTEL_HEX ? (accent as PastelTone) : 'yellow',
            accentHex: PASTEL_HEX[accent as PastelTone] || p.color || '#FFD95A',
            cash: p.balance ?? p.currentBalance ?? 50000,
            position: p.currentBoardPosition ?? p.position ?? 0,
            isHost: p.playerId === data.game.hostId,
            isReady: p.isReady ?? true,
            isBankrupt: p.bankruptcyStatus ?? false,
          };
        });
        setPlayers((prev) => {
          const isIdentical =
            prev.length === mappedPlayers.length &&
            prev.every((p, i) => {
              const m = mappedPlayers[i];
              return (
                m &&
                p.id === m.id &&
                p.cash === m.cash &&
                p.position === m.position &&
                p.isBankrupt === m.isBankrupt &&
                p.isReady === m.isReady
              );
            });
          return isIdentical ? prev : mappedPlayers;
        });

        // Map Board Spaces with Authoritative Properties
        const backendProps = data.properties || [];
        const mappedSpaces: BoardSpace[] = OFFICIAL_36_BOARD_SPACES.map((sp) => {
          const deed = sp.cardId ? OFFICIAL_TITLE_DEEDS[sp.cardId] : null;
          const prop = backendProps.find((p: any) => p.cardId === sp.cardId);
          return {
            index: sp.index,
            id: prop ? prop.propertyId : `sp-${sp.index}`,
            name: sp.name,
            region: sp.description || (deed ? `${deed.group} Group` : undefined),
            type: sp.type.toLowerCase() as any,
            colorGroup: sp.colorGroup ? mapColorGroup(sp.colorGroup) : undefined,
            colorHex: sp.colorGroup ? mapColorHex(sp.colorGroup) : undefined,
            price: deed?.purchasePrice || (sp as any).amount,
            baseRent: deed?.rentSiteOnly,
            rent1House: deed?.rent1House,
            rent2House: deed?.rent2Houses,
            rent3House: deed?.rent3Houses,
            rentHotel: deed?.rentHotel,
            houseCost: deed?.costOfHouse,
            hotelCost: deed?.costOfHotel,
            mortgageValue: deed?.bankMortgageValue,
            taxAmount: sp.type === 'TAX' ? (sp as any).amount : undefined,
            ownerId: prop?.ownerId || null,
            houses: prop?.houseCount || 0,
            hasHotel: prop?.hotelStatus || false,
            isMortgaged: prop?.mortgageStatus || false,
          };
        });
        setSpaces((prev) => {
          const isIdentical =
            prev.length === mappedSpaces.length &&
            prev.every((s, i) => {
              const m = mappedSpaces[i];
              return (
                m &&
                s.ownerId === m.ownerId &&
                s.houses === m.houses &&
                s.hasHotel === m.hasHotel &&
                s.isMortgaged === m.isMortgaged
              );
            });
          return isIdentical ? prev : mappedSpaces;
        });

        // Map Auctions
        const backendAuctions = data.activeAuctions || [];
        const mappedAuctions: AuctionItem[] = backendAuctions.map((auc: any) => {
          const seller = mappedPlayers.find((p) => p.id === auc.sellerId);
          const highestBidder = mappedPlayers.find((p) => p.id === auc.highestBidderId);
          const targetSpace = mappedSpaces.find((s) => s.id === auc.propertyId);
          const secondsRem = auc.endTime
            ? Math.max(0, Math.ceil((new Date(auc.endTime).getTime() - Date.now()) / 1000))
            : 10;
          return {
            id: auc.auctionId,
            spaceId: auc.propertyId,
            propertyName: targetSpace?.name || auc.propertyName || 'Deed',
            colorGroup: targetSpace?.colorGroup || 'royal',
            colorHex: targetSpace?.colorHex || '#2F5597',
            sellerId: auc.sellerId,
            sellerName: seller?.name || (auc.sellerId === 'BANK' ? 'Central Bank' : 'Seller'),
            startingBid: Number(auc.startingBid ?? auc.currentHighestBid ?? 50),
            currentBid: Number(auc.currentBid ?? auc.currentHighestBid ?? auc.startingBid ?? 50),
            highestBidderId: auc.highestBidderId || null,
            highestBidderName: highestBidder?.name || null,
            secondsRemaining: secondsRem,
            status:
              auc.status === 'COMPLETED' ||
              auc.auctionStatus === 'COMPLETED' ||
              auc.auctionStatus === 'EXPIRED' ||
              auc.auctionStatus === 'CANCELLED'
                ? 'settled'
                : 'active',
            bids: (auc.bidHistory || [])
              .slice()
              .reverse()
              .map((b: any, i: number) => {
                const bPlayer = mappedPlayers.find((p) => p.id === b.bidderId);
                return {
                  id: `bid-${auc.auctionId}-${i}-${b.timestamp || i}`,
                  bidderId: b.bidderId,
                  bidderName: bPlayer?.name || b.bidderName || 'Bidder',
                  amount: Number(b.amount ?? b.bidAmount ?? 0),
                  timestamp: new Date(b.timestamp || Date.now()).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  }),
                };
              }),
          };
        });
        setAuctions((prev) => {
          const settledPrev = prev.filter(
            (p) => p.status === 'settled' && !mappedAuctions.some((m) => m.id === p.id)
          );
          const merged = [...mappedAuctions, ...settledPrev.slice(0, 6)];
          if (prev.length === 0 && merged.length === 0) return prev;
          const isIdentical =
            prev.length === merged.length &&
            prev.every((a, i) => {
              const m = merged[i];
              return (
                m &&
                a.id === m.id &&
                a.status === m.status &&
                a.currentBid === m.currentBid &&
                a.highestBidderId === m.highestBidderId &&
                a.secondsRemaining === m.secondsRemaining &&
                a.bids.length === m.bids.length
              );
            });
          return isIdentical ? prev : merged;
        });
        setSelectedAuctionId((prev) => prev || (mappedAuctions.length > 0 ? mappedAuctions[0].id : ''));

        // Map Loans
        const backendLoans = data.loans || [];
        const mappedLoans: LoanContract[] = backendLoans.map((ln: any) => {
          const lender = mappedPlayers.find((p) => p.id === ln.lenderId);
          const borrower = mappedPlayers.find((p) => p.id === ln.borrowerId);
          return {
            id: ln.loanId,
            agreementCode: `AGR-${(ln.loanId || '').slice(-4).toUpperCase()}`,
            lenderId: ln.lenderId === 'BANK' ? 'bank' : ln.lenderId,
            lenderName: ln.lenderId === 'BANK' ? 'Central Reserve Bank' : lender?.name || 'Lender',
            borrowerId: ln.borrowerId,
            borrowerName: borrower?.name || 'Borrower',
            principal: ln.principalAmount,
            interestRate: ln.interestRate || 0,
            totalRepayment: ln.totalRepayment || ln.principalAmount,
            amountRepaid: ln.amountRepaid || 0,
            terms: `${ln.interestRate || 0}% Interest Rate`,
            status:
              ln.loanStatus === 'ACTIVE'
                ? 'active'
                : ln.loanStatus === 'PENDING'
                  ? 'pending-approval'
                  : 'settled',
            createdAt: new Date(ln.createdAt || Date.now()).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            repayments: (ln.repayments || []).map((r: any, idx: number) => ({
              id: `rp-${idx}`,
              amount: r.amount,
              timestamp: new Date(r.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
              source: r.source === 'AUTO_GARNISH' ? 'auto-garnish' : 'manual',
            })),
          };
        });
        setLoans((prev) => {
          if (prev.length === 0 && mappedLoans.length === 0) return prev;
          const isIdentical =
            prev.length === mappedLoans.length &&
            prev.every((l, i) => {
              const m = mappedLoans[i];
              return m && l.id === m.id && l.status === m.status && l.amountRepaid === m.amountRepaid;
            });
          return isIdentical ? prev : mappedLoans;
        });
        setSelectedLoanId((prev) => prev || (mappedLoans.length > 0 ? mappedLoans[0].id : ''));

        // Map Movements
        const backendMovements = data.recentMovements || [];
        const mappedMovements: MovementLog[] = backendMovements.map((m: any) => {
          const p = mappedPlayers.find((pl) => pl.id === m.playerId);
          const fromSp = mappedSpaces[m.previousPosition || 0];
          const toSp = mappedSpaces[m.newPosition || 0];
          return {
            id: m.movementId,
            playerId: m.playerId,
            playerName: p?.name || 'Player',
            die1: m.diceValues?.[0] || 1,
            die2: m.diceValues?.[1] || 1,
            total: (m.diceValues || []).reduce((a: number, b: number) => a + b, 0),
            fromIndex: m.previousPosition || 0,
            fromName: fromSp?.name || `Space #${m.previousPosition}`,
            toIndex: m.newPosition || 0,
            toName: toSp?.name || `Space #${m.newPosition}`,
            passedStart: m.passedStart || false,
            timestamp: new Date(m.timestamp || Date.now()).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          };
        });
        setMovements((prev) => {
          if (prev.length === 0 && mappedMovements.length === 0) return prev;
          if (prev.length === mappedMovements.length && prev[0]?.id === mappedMovements[0]?.id) {
            return prev;
          }
          return mappedMovements;
        });

        // Map Transactions
        const backendTransactions = data.recentTransactions || [];
        const mappedTransactions: TransactionItem[] = backendTransactions.map((tx: any) => {
          const sender = mappedPlayers.find((p) => p.id === tx.senderId);
          const receiver = mappedPlayers.find((p) => p.id === tx.receiverId);
          const isToMe = tx.receiverId === effectivePid;
          const isFromMe = tx.senderId === effectivePid;
          const typeUpper = (tx.transactionType || 'TRANSFER').toUpperCase();
          let cat: TransactionCategory = 'transfer';
          if (typeUpper === 'RENT') {
            cat = isToMe ? 'rent-received' : 'rent-paid';
          } else if (typeUpper.includes('PURCHASE') || typeUpper.includes('BUILD') || typeUpper.includes('MORTGAGE')) {
            cat = 'property-purchase';
          } else if (typeUpper.includes('AUCTION')) {
            cat = 'auction';
          } else if (typeUpper.includes('LOAN') || typeUpper.includes('DEBT')) {
            cat = 'loan-repayment';
          } else if (typeUpper.includes('TAX') || typeUpper.includes('FINE') || typeUpper.includes('JAIL')) {
            cat = 'tax';
          } else if (typeUpper.includes('REWARD') || typeUpper.includes('START') || typeUpper.includes('CLUB')) {
            cat = 'reward';
          }

          return {
            id: tx.transactionId,
            category: cat,
            title: tx.description || `${tx.transactionType || 'Transaction'}`,
            subtitle: `Ref #${(tx.transactionId || '').slice(-6)}`,
            amount: tx.amount,
            direction: isToMe ? 'in' : isFromMe ? 'out' : 'neutral',
            fromName: sender?.name || 'Bank',
            toName: receiver?.name || 'Bank',
            timestamp: new Date(tx.timestamp || Date.now()).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            pastel: isToMe ? 'green' : isFromMe ? 'pink' : 'yellow',
          };
        });
        setTransactions((prev) => {
          if (prev.length === 0 && mappedTransactions.length === 0) return prev;
          if (prev.length === mappedTransactions.length && prev[0]?.id === mappedTransactions[0]?.id) {
            return prev;
          }
          return mappedTransactions;
        });

        // Map Notifications
        const backendNotifications = data.notifications || [];
        const mappedNotifications: AppNotification[] = backendNotifications.map((n: any) => ({
          id: n.notificationId,
          category: n.type || 'player-activity',
          title: n.title,
          message: n.message,
          timestamp: new Date(n.createdAt || Date.now()).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          read: n.read ?? false,
          pastel: n.type === 'rent-request' || n.type === 'outbid' ? 'pink' : 'blue',
          targetScreen:
            n.type === 'rent-request'
              ? 'rent-notification'
              : n.type === 'outbid'
                ? 'auction-details'
                : 'dashboard',
          ctaLabel:
            n.type === 'rent-request'
              ? 'Pay Rent'
              : n.type === 'outbid'
                ? 'Counter Bid'
                : undefined,
        }));
        setNotifications((prev) => {
          if (prev.length === 0 && mappedNotifications.length === 0) return prev;
          if (prev.length === mappedNotifications.length && prev[0]?.id === mappedNotifications[0]?.id) {
            return prev;
          }
          return mappedNotifications;
        });

        // Map Pending Rent Event
        const backendPendingRents = data.pendingRents || [];
        const activeRent = backendPendingRents.find(
          (r: any) =>
            (r.renterId === effectivePid || r.ownerId === effectivePid) &&
            r.status === 'PENDING'
        );
        if (activeRent) {
          const visitor = mappedPlayers.find((p) => p.id === activeRent.renterId);
          const owner = mappedPlayers.find((p) => p.id === activeRent.ownerId);
          const prop = mappedSpaces.find((s) => s.id === activeRent.propertyId);
          setRentEvent({
            id: activeRent.landingEventId,
            spaceId: activeRent.propertyId,
            propertyName: prop?.name || 'Property',
            colorHex: prop?.colorHex || '#FF69B4',
            visitorId: activeRent.renterId,
            visitorName: visitor?.name || 'Visitor',
            ownerId: activeRent.ownerId,
            ownerName: owner?.name || 'Owner',
            amount: activeRent.rentDue,
            status: 'pending',
            timestamp: 'Just now · Live Rent',
          });
        }
      } catch (err: any) {
        console.error('[App] Failed to synchronize game state:', err);
      }
    },
    []
  );

  // Coalesced smooth background sync handler (prevents parallel network storms)
  const handleSync = useCallback(async () => {
    const gid = gameIdRef.current;
    if (!gid) return;
    if (isSyncingRef.current) {
      pendingSyncRef.current = true;
      return;
    }
    isSyncingRef.current = true;
    try {
      await syncAuthoritativeGameState(gid, activePlayerIdRef.current);
    } finally {
      isSyncingRef.current = false;
      if (pendingSyncRef.current && gameIdRef.current) {
        pendingSyncRef.current = false;
        syncAuthoritativeGameState(gameIdRef.current, activePlayerIdRef.current);
      }
    }
  }, [syncAuthoritativeGameState]);

  const hasRestoredRef = useRef(false);

  // Cold-start health check & socket connection status tracking (Render free tier wakeup)
  useEffect(() => {
    let cancelled = false;
    let slowTimer: number | undefined;
    let retryTimer: number | undefined;

    const unsubscribe = onSocketStatusChange((status) => {
      if (!cancelled) {
        setIsWakingServer(status === 'waking');
      }
    });

    const probe = async () => {
      let settled = false;
      slowTimer = window.setTimeout(() => {
        if (!cancelled && !settled) setIsWakingServer(true);
      }, 1500);
      try {
        await pingServerHealth();
        settled = true;
        if (!cancelled) setIsWakingServer(false);
      } catch {
        settled = true;
        if (!cancelled) {
          setIsWakingServer(true);
          retryTimer = window.setTimeout(probe, 3000);
        }
      } finally {
        if (slowTimer) window.clearTimeout(slowTimer);
      }
    };

    probe();

    return () => {
      cancelled = true;
      unsubscribe();
      if (slowTimer) window.clearTimeout(slowTimer);
      if (retryTimer) window.clearTimeout(retryTimer);
    };
  }, []);

  // Restore Active Session on Mount
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    try {
      const saved = sessionStorage.getItem('property_game_session');
      let savedGameId = '';
      let savedPlayerId = '';
      let savedRoomCode = '';

      if (saved) {
        const parsed = JSON.parse(saved);
        savedGameId = parsed.gameId || '';
        savedPlayerId = parsed.playerId || '';
        savedRoomCode = (parsed.roomCode || '').toUpperCase();
      }

      const lookupCode = urlRoomCode || savedRoomCode || savedGameId;
      if (lookupCode) {
        api
          .getGameState(lookupCode)
          .then((res) => {
            if (!res || !res.game) return;
            const actualGameId = res.game.gameId;
            const actualRoomCode = (res.game.roomCode || lookupCode).toUpperCase();
            setGameId(actualGameId);

            const effectivePid =
              savedPlayerId && res.players?.some((p: any) => p.playerId === savedPlayerId)
                ? savedPlayerId
                : res.players?.[0]?.playerId || '';

            if (effectivePid) {
              setActivePlayerId(effectivePid);
              sessionStorage.setItem(
                'property_game_session',
                JSON.stringify({
                  gameId: actualGameId,
                  playerId: effectivePid,
                  roomCode: actualRoomCode,
                })
              );
            }

            joinGameRoom(actualGameId, effectivePid);
            syncAuthoritativeGameState(actualGameId, effectivePid).then(() => {
              if (!urlTab) {
                if (res.game?.gameStatus === 'LOBBY') {
                  setScreen('lobby');
                } else if (res.game?.gameStatus === 'IN_PROGRESS') {
                  setScreen('dashboard');
                } else if (res.game?.gameStatus === 'COMPLETED') {
                  setScreen('leaderboard');
                }
              } else {
                const mapped = SLUG_TO_SCREEN[urlTab.toLowerCase()];
                if (mapped) setScreenState(mapped);
              }
            });
          })
          .catch((err) => {
            console.warn('[App] Session restore error:', err);
            if (!urlRoomCode) setScreenState('welcome');
          });
      }
    } catch (e) {
      console.warn('[App] Session parse error:', e);
    }
  }, []);

  // Real-Time Socket.IO Subscriptions (Rock-solid, attached once per game room)
  useEffect(() => {
    if (!gameId) return;

    const s = getSocket();

    const onPlayerRemoved = ({ playerId }: { playerId: string }) => {
      if (playerId === activePlayerIdRef.current) {
        handleLeaveGame();
        showToast('You were removed from the room by the host', 'pink');
      } else {
        handleSync();
      }
    };

    const onGameStarted = ({ firstPlayerId, game }: any) => {
      if (firstPlayerId) {
        setCurrentTurnPlayerId(firstPlayerId);
      }
      const mode = game?.gameSettings?.gameMode === 'ONLINE' ? 'online' : configGameModeRef.current;
      handleSync();
      setScreen(mode === 'online' ? 'board' : 'dashboard');
      showToast(
        mode === 'online'
          ? 'Online game started! Roll the dice on the board.'
          : 'Game started! Physical tokens placed on START.',
        'green'
      );
    };

    const onPlayerMoved = (payload: any) => {
      const mr = payload?.movementRecord;
      if (mr && typeof mr.previousPosition === 'number' && typeof mr.newPosition === 'number') {
        const dVals: number[] = Array.isArray(mr.diceValues) ? mr.diceValues : [1, 1];
        const d1 = dVals[0] ?? 1;
        const d2 = dVals[1] ?? 0;
        const moverName = payload?.player?.username || 'Player';
        setLastDiceRoll({
          playerId: mr.playerId,
          playerName: moverName,
          die1: d1,
          die2: d2,
          total: mr.totalMovement ?? (d1 + d2),
        });
        animatePlayerSteps(
          mr.playerId,
          mr.previousPosition,
          mr.newPosition,
          mr.totalMovement ?? (d1 + d2),
          mr.movementId
        );
      }
      handleSync();
    };

    const onTurnChanged = ({ currentTurnPlayerId: nextPid }: { currentTurnPlayerId: string }) => {
      if (nextPid) {
        setCurrentTurnPlayerId(nextPid);
      }
      handleSync();
    };

    const onDebtRecovered = ({ amountRecovered }: { amountRecovered: number }) => {
      handleSync();
      showToast(`Auto-garnished ₹${amountRecovered.toLocaleString('en-IN')} toward debts!`, 'green');
    };

    const onAuctionStarted = ({ auction }: any) => {
      handleSync();
      setUnownedLanding(null);
      setAuctionPrompt(null);
      if (auction?.auctionId) {
        setSelectedAuctionId(auction.auctionId);
      }
      showToast(
        `New 10s auction opened for ${auction?.propertyName || auction?.name || 'Property'}!`,
        'orange'
      );
    };

    const onPropertyPurchased = () => {
      handleSync();
      setUnownedLanding(null);
      setAuctionPrompt(null);
    };

    const onUnownedPropertyLanded = (evt: UnownedLandingEvent) => {
      handleSync();
      const myId = activePlayerIdRef.current;
      if (evt && evt.landingPlayerId === myId) {
        const delay = Math.max(0, animatingUntilRef.current - Date.now());
        if (delay > 40) {
          window.setTimeout(() => setUnownedLanding(evt), delay);
        } else {
          setUnownedLanding(evt);
        }
      }
    };

    const onUnownedPropertyDeclined = (evt: AuctionPromptEvent) => {
      handleSync();
      setUnownedLanding(null);
      setAuctionPrompt(evt);
    };

    const onAuctionPromptVoteUpdated = (evt: any) => {
      setAuctionPrompt((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          passVotes: Array.from(new Set([...(prev.passVotes || []), ...(evt.passVotes || [])])),
        };
      });
    };

    const onAuctionPromptResolved = (evt: any) => {
      setAuctionPrompt(null);
      handleSync();
      if (evt.action === 'ALL_PASSED') {
        showToast(evt.message || `All players passed. ${evt.propertyName || 'Property'} remains with the Bank.`, 'yellow');
      } else if (evt.action === 'AUCTION_STARTED') {
        if (evt.auctionId) {
          setSelectedAuctionId(evt.auctionId);
          setScreen('auction-details');
        }
        showToast(`10s gavel auction opened for ${evt.propertyName || 'property'}!`, 'orange');
      }
    };

    const onAuctionBidPlaced = (data: any) => {
      if (data?.auctionId) {
        setAuctions((prev) =>
          prev.map((auc) =>
            auc.id === data.auctionId
              ? {
                  ...auc,
                  currentBid: Number(data.currentHighestBid ?? auc.currentBid),
                  highestBidderId: data.highestBidderId || auc.highestBidderId,
                  highestBidderName: data.highestBidderName || auc.highestBidderName,
                  secondsRemaining: Number(data.secondsRemaining ?? 10),
                }
              : auc
          )
        );
      }
      handleSync();
    };

    const onAuctionEnded = (data: any) => {
      if (data?.auctionId) {
        setAuctions((prev) =>
          prev.map((auc) =>
            auc.id === data.auctionId
              ? {
                  ...auc,
                  status: 'settled',
                  secondsRemaining: 0,
                  highestBidderId: data.winnerId || auc.highestBidderId,
                  highestBidderName: data.winnerName || auc.highestBidderName,
                  currentBid:
                    data.winningBid !== undefined
                      ? Number(data.winningBid)
                      : auc.currentBid,
                }
              : auc
          )
        );
      }
      handleSync();
      if (data?.winnerId) {
        showToast(
          `Sold to ${data.winnerName} for ₹${Number(data.winningBid || 0).toLocaleString('en-IN')}!`,
          'green'
        );
        if (
          screenRef.current === 'auction-details' &&
          (!selectedAuctionIdRef.current || selectedAuctionIdRef.current === data.auctionId)
        ) {
          setSelectedAuctionId(data.auctionId);
          setScreen('auction-result');
        }
      } else {
        showToast(
          data?.message ||
            `Auction closed with no bids. ${data?.propertyName || 'Property'} remains with the Bank.`,
          'yellow'
        );
        if (
          screenRef.current === 'auction-details' &&
          (!selectedAuctionIdRef.current || selectedAuctionIdRef.current === data.auctionId)
        ) {
          setScreen('board');
        }
      }
    };

    const onRentLandingAlert = (data: any) => {
      handleSync();
      const myId = activePlayerIdRef.current;
      if (data && (data.visitorId === myId || data.ownerId === myId)) {
        const delay = Math.max(0, animatingUntilRef.current - Date.now());
        if (delay > 40) {
          window.setTimeout(() => setActiveRentAlert(data), delay);
        } else {
          setActiveRentAlert(data);
        }
      }
    };

    const onRentEventTriggered = (evt: any) => {
      handleSync();
      const myId = activePlayerIdRef.current;
      if (evt && (evt.renterId === myId || evt.visitorId === myId || evt.ownerId === myId)) {
        const delay = Math.max(0, animatingUntilRef.current - Date.now());
        const showAlert = () => {
          setActiveRentAlert(evt);
          if (evt.renterId === myId || evt.visitorId === myId) {
            showToast(`Landed on ${evt.propertyName || 'property'}! Rent payment due.`, 'pink');
          } else if (evt.ownerId === myId) {
            showToast(`${evt.visitorName || 'A player'} landed on your property ${evt.propertyName || ''}!`, 'green');
          }
        };
        if (delay > 40) {
          window.setTimeout(showAlert, delay);
        } else {
          showAlert();
        }
      }
    };

    const onRentSettled = (data: any) => {
      handleSync();
      setActiveRentAlert(null);
      showToast(
        `Rent payment of ₹${data.rentAmount ? data.rentAmount.toLocaleString('en-IN') : ''} settled successfully!`,
        'green'
      );
    };

    s.on('connect', handleSync);
    s.on('player_joined', handleSync);
    s.on('player_removed', onPlayerRemoved);
    s.on('game_started', onGameStarted);
    s.on('turn_changed', onTurnChanged);
    s.on('player_moved', onPlayerMoved);
    s.on('balance_updated', handleSync);
    s.on('debt_recovered', onDebtRecovered);
    s.on('transfer_completed', handleSync);
    s.on('leaderboard_updated', handleSync);
    s.on('property_purchased', onPropertyPurchased);
    s.on('property_updated', handleSync);
    s.on('unowned_property_landed', onUnownedPropertyLanded);
    s.on('unowned_property_declined', onUnownedPropertyDeclined);
    s.on('auction_prompt_vote_updated', onAuctionPromptVoteUpdated);
    s.on('auction_prompt_resolved', onAuctionPromptResolved);
    s.on('auction_started', onAuctionStarted);
    s.on('auction_bid_placed', onAuctionBidPlaced);
    s.on('auction_ended', onAuctionEnded);
    s.on('loan_created', handleSync);
    s.on('loan_status_changed', handleSync);
    s.on('loan_repaid', handleSync);
    s.on('rent_landing_alert', onRentLandingAlert);
    s.on('rent_event_triggered', onRentEventTriggered);
    s.on('rent_settled', onRentSettled);

    return () => {
      s.off('connect', handleSync);
      s.off('player_joined', handleSync);
      s.off('player_removed', onPlayerRemoved);
      s.off('game_started', onGameStarted);
      s.off('turn_changed', onTurnChanged);
      s.off('player_moved', onPlayerMoved);
      s.off('balance_updated', handleSync);
      s.off('debt_recovered', onDebtRecovered);
      s.off('transfer_completed', handleSync);
      s.off('leaderboard_updated', handleSync);
      s.off('property_purchased', onPropertyPurchased);
      s.off('property_updated', handleSync);
      s.off('unowned_property_landed', onUnownedPropertyLanded);
      s.off('unowned_property_declined', onUnownedPropertyDeclined);
      s.off('auction_prompt_vote_updated', onAuctionPromptVoteUpdated);
      s.off('auction_prompt_resolved', onAuctionPromptResolved);
      s.off('auction_started', onAuctionStarted);
      s.off('auction_bid_placed', onAuctionBidPlaced);
      s.off('auction_ended', onAuctionEnded);
      s.off('loan_created', handleSync);
      s.off('loan_status_changed', handleSync);
      s.off('loan_repaid', handleSync);
      s.off('rent_landing_alert', onRentLandingAlert);
      s.off('rent_event_triggered', onRentEventTriggered);
      s.off('rent_settled', onRentSettled);
    };
  }, [gameId, handleSync]);

  // Live Auction Second Countdown Ticker
  useEffect(() => {
    const timer = window.setInterval(() => {
      setAuctions((prev) =>
        prev.map((auc) =>
          auc.status === 'active' && auc.secondsRemaining > 0
            ? { ...auc, secondsRemaining: auc.secondsRemaining - 1 }
            : auc
        )
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  /* --- Game Action Handlers Connected to Authoritative REST API --- */

  const handleCreateGame = async (
    hostName: string,
    avatar: AvatarShapeId,
    tone: PastelTone
  ) => {
    try {
      const res = await api.createGame({
        username: hostName,
        avatar,
        color: tone,
        gameName: config.gameName,
        gameSettings: {
          gameMode: config.gameMode === 'online' ? 'ONLINE' : 'LOCAL_BOARD',
          startingMoney: config.startingMoney || 30000,
          mustLandOnPropertyToBuy: config.mustLandOnPropertyToBuy ?? true,
          doublesRollAgain: config.doublesRollAgain ?? true,
          evenBuildRule: config.evenBuildRule ?? true,
          clubPayPlayers: config.clubPayPlayers ?? true,
          jailExitFine: 200,
          minimumPlayers: config.minPlayers,
          maximumPlayers: config.maxPlayers,
          auctionEnabled: config.auctionsEnabled,
          bankLoanEnabled: config.bankLoansEnabled,
          playerLoanEnabled: config.p2pLoansEnabled,
          loanInterestAllowed: true,
          bankInterestRate: config.maxInterestRate,
        },
      });

      const newGameId = res.game.gameId;
      const newPlayerId = res.player.playerId;

      setGameId(newGameId);
      setActivePlayerId(newPlayerId);
      sessionStorage.setItem(
        'property_game_session',
        JSON.stringify({ gameId: newGameId, playerId: newPlayerId, roomCode: res.roomCode })
      );

      joinGameRoom(newGameId, newPlayerId);
      await syncAuthoritativeGameState(newGameId, newPlayerId);
      setScreen('lobby');
      showToast(`Room created! Room Code: ${res.roomCode}`, 'green');
    } catch (err: any) {
      showToast(err.message || 'Failed to create game', 'pink');
    }
  };

  const handleJoinLobby = async (
    roomCode: string,
    username: string,
    avatar: AvatarShapeId,
    tone: PastelTone
  ) => {
    try {
      const res = await api.joinGame({
        roomCode,
        username,
        avatar,
        color: tone,
      });

      const newGameId = res.game.gameId;
      const newPlayerId = res.player.playerId;

      setGameId(newGameId);
      setActivePlayerId(newPlayerId);
      sessionStorage.setItem(
        'property_game_session',
        JSON.stringify({ gameId: newGameId, playerId: newPlayerId, roomCode })
      );

      joinGameRoom(newGameId, newPlayerId);
      await syncAuthoritativeGameState(newGameId, newPlayerId);
      setScreen('lobby');
      showToast(`Joined Room #${roomCode} as ${username}`, 'green');
    } catch (err: any) {
      showToast(err.message || 'Failed to join game', 'pink');
    }
  };

  const handleStartGame = async () => {
    try {
      await api.startGame(gameId, activePlayerId);
      await syncAuthoritativeGameState(gameId, activePlayerId);
      setScreen(config.gameMode === 'online' ? 'board' : 'dashboard');
      showToast(
        config.gameMode === 'online'
          ? 'Online game started! Roll the dice on the board.'
          : 'Game started! Physical tokens placed on START.',
        'green'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to start game', 'pink');
    }
  };

  const handleLeaveGame = () => {
    if (gameId && activePlayerId) {
      leaveGameRoom(gameId, activePlayerId);
    }
    sessionStorage.removeItem('property_game_session');
    setGameId('');
    setActivePlayerId('');
    setPlayers([]);
    setScreen('welcome');
    showToast('Exited game session', 'blue');
  };

  const executeDiceMove = async (
    effectivePid: string,
    diceInput: [number, number] | null,
    rollDigital: boolean
  ): Promise<MovementLog> => {
    const rollingPlayer = players.find((p) => p.id === effectivePid) || activePlayer;

    try {
      if (rollDigital) {
        setIsRollingDice(true);
      }
      if (config.gameMode === 'local' && effectivePid && effectivePid !== activePlayerId) {
        setActivePlayerId(effectivePid);
      }

      const res = await api.submitDiceRoll(gameId, effectivePid, diceInput, rollDigital);

      // Give digital dice brief tumble feedback before pawn starts stepping
      if (rollDigital) {
        await new Promise((r) => window.setTimeout(r, 420));
        setIsRollingDice(false);
      }

      const m = res.movementRecord;
      const dVals: number[] = Array.isArray(res.diceValues)
        ? res.diceValues
        : Array.isArray(m?.diceValues)
          ? m.diceValues
          : diceInput || [1, 1];
      const d1 = dVals[0] ?? 1;
      const d2 = dVals[1] ?? 0;
      const total = d1 + d2;
      const fromPos = m?.previousPosition ?? rollingPlayer.position ?? 0;
      const toPos = m?.newPosition ?? ((fromPos + total) % spaces.length);
      const fromSpaceName = m?.previousName || spaces[fromPos]?.name || `Space #${fromPos}`;
      const toSpaceName = m?.destinationName || spaces[toPos]?.name || `Space #${toPos}`;

      setLastDiceRoll({
        playerId: effectivePid,
        playerName: rollingPlayer.name,
        die1: d1,
        die2: d2,
        total,
      });

      const mv: MovementLog = {
        id: m?.movementId || `mv-${Date.now()}`,
        playerId: effectivePid,
        playerName: rollingPlayer.name,
        die1: d1,
        die2: d2,
        total,
        fromIndex: fromPos,
        fromName: fromSpaceName,
        toIndex: toPos,
        toName: toSpaceName,
        passedStart: m?.passedStart ?? false,
        timestamp: 'Just now',
      };

      const nextTurnPid = res.currentTurnPlayerId;
      if (nextTurnPid) {
        setCurrentTurnPlayerId(nextTurnPid);
      }

      const handlePostLanding = () => {
        if (res.rentEvent) {
          setRentEvent({
            id: res.rentEvent.landingEventId,
            spaceId: res.rentEvent.propertyId,
            propertyName: res.rentEvent.destinationName || toSpaceName,
            colorHex: '#FF69B4',
            visitorId: effectivePid,
            visitorName: rollingPlayer.name,
            ownerId: res.rentEvent.ownerId,
            ownerName: res.rentEvent.ownerName || 'Owner',
            amount: res.rentEvent.rentDue,
            status: 'pending',
            timestamp: 'Just now · Live Roll',
          });
          showToast(
            `Landed on ${res.rentEvent.destinationName || toSpaceName}! ₹${res.rentEvent.rentDue.toLocaleString('en-IN')} rent due.`,
            'pink'
          );
        } else if (res.gameplayAction?.type === 'UNOWNED_PROPERTY') {
          setUnownedLanding({
            gameId,
            propertyId: res.gameplayAction.propertyId,
            cardId: res.gameplayAction.cardId,
            name: res.gameplayAction.name,
            colorGroup: res.gameplayAction.colorGroup,
            price: res.gameplayAction.purchasePrice,
            landingPlayerId: effectivePid,
            landingPlayerName: rollingPlayer.name,
            canAfford: res.gameplayAction.canAfford ?? (rollingPlayer.cash >= res.gameplayAction.purchasePrice),
          });
          showToast(`${res.gameplayAction.name} is available for purchase!`, 'yellow');
        } else if (res.gameplayAction?.message) {
          const actType = res.gameplayAction.type || 'SPACE';
          const eventMeta: Record<string, { title: string; tone: PastelTone; emoji: string }> = {
            CHANCE: { title: 'Chance Card Drawn', tone: 'yellow', emoji: '❓' },
            COMMUNITY_CHEST: { title: 'Community Chest', tone: 'blue', emoji: '🎁' },
            TAX: { title: 'Tax Payment Notice', tone: 'pink', emoji: '💸' },
            START: { title: 'Landed on START!', tone: 'green', emoji: '🏁' },
            JAIL: { title: 'Jail Notice', tone: 'orange', emoji: '🔒' },
            REST_HOUSE: { title: 'Rest House', tone: 'blue', emoji: '🛋️' },
            CLUB: { title: 'Club Zone', tone: 'green', emoji: '🥂' },
          };
          const meta = eventMeta[actType] || {
            title: res.gameplayAction.name || toSpaceName,
            tone: 'yellow' as PastelTone,
            emoji: '🎲',
          };
          setLandingEventModal({
            title: meta.title,
            subtitle: `${rollingPlayer.name} · Space #${toPos} ${toSpaceName}`,
            message: res.gameplayAction.message,
            tone: meta.tone,
            emoji: meta.emoji,
          });
          showToast(res.gameplayAction.message, meta.tone);
        } else {
          showToast(`${rollingPlayer.name} moved ${total} spaces to ${toSpaceName}`, 'green');
        }

        // Auto-advance chance to next player ONLY in Local Physical Board companion mode!
        if (
          configGameModeRef.current === 'local' &&
          !res.extraTurnGranted &&
          nextTurnPid &&
          nextTurnPid !== effectivePid &&
          res.gameplayAction?.type !== 'UNOWNED_PROPERTY' &&
          !res.rentEvent
        ) {
          window.setTimeout(() => {
            setActivePlayerId(nextTurnPid);
            const nextPlayerObj = players.find((p) => p.id === nextTurnPid);
            showToast(`Chance moved to ${nextPlayerObj?.name || 'next player'}!`, nextPlayerObj?.accent || 'yellow');
          }, 1200);
        }
      };

      // Step-by-step hop animation across board spaces, then sync & open landing prompt
      animatePlayerSteps(effectivePid, fromPos, toPos, total, m?.movementId, () => {
        syncAuthoritativeGameState(gameId, effectivePid);
        handlePostLanding();
      });

      // Keep balances/logs updated immediately while visualPositions holds the hop path
      await syncAuthoritativeGameState(gameId, effectivePid);

      return mv;
    } catch (err: any) {
      setIsRollingDice(false);
      showToast(err.message || 'Dice roll failed', 'pink');
      const d1 = diceInput?.[0] ?? 1;
      const d2 = diceInput?.[1] ?? 1;
      const total = d1 + d2;
      const fromPos = rollingPlayer.position ?? 0;
      const toPos = (fromPos + total) % spaces.length;
      return {
        id: `mv-${Date.now()}`,
        playerId: effectivePid,
        playerName: rollingPlayer.name,
        die1: d1,
        die2: d2,
        total,
        fromIndex: fromPos,
        fromName: spaces[fromPos]?.name || 'START',
        toIndex: toPos,
        toName: spaces[toPos]?.name || 'Board Space',
        passedStart: fromPos + total >= spaces.length,
        timestamp: 'Just now',
      };
    }
  };

  const handleConfirmDiceRoll = async (
    die1: number,
    die2: number,
    targetPlayerId?: string
  ): Promise<MovementLog> => {
    const effectivePid =
      targetPlayerId ||
      (currentTurnPlayerId && players.some((p) => p.id === currentTurnPlayerId)
        ? currentTurnPlayerId
        : activePlayerId);
    return executeDiceMove(effectivePid, [die1, die2], false);
  };

  const handleRollDigitalDice = async (): Promise<MovementLog> => {
    return executeDiceMove(activePlayerId, null, true);
  };

  const handleBuyUnownedProperty = async () => {
    if (!unownedLanding) return;
    try {
      await api.buyProperty(gameId, unownedLanding.propertyId, unownedLanding.landingPlayerId);
      showToast(`Purchased ${unownedLanding.name} for ${formatINR(unownedLanding.price)}!`, 'green');
      setUnownedLanding(null);
      await syncAuthoritativeGameState(gameId, activePlayerId);
    } catch (err: any) {
      showToast(err.message || 'Failed to buy property', 'pink');
    }
  };

  const handleDeclineUnownedProperty = async () => {
    if (!unownedLanding) return;
    try {
      const landing = unownedLanding;
      setUnownedLanding(null);
      await api.declineUnownedProperty(gameId, landing.propertyId, landing.landingPlayerId);
      showToast(`Passed on ${landing.name}. Asking all players for auction...`, 'yellow');
    } catch (err: any) {
      showToast(err.message || 'Failed to decline property', 'pink');
    }
  };

  const handleAuctionDecision = async (decision: 'AUCTION' | 'PASS') => {
    if (!auctionPrompt) return;
    try {
      const res = await api.submitAuctionDecision(gameId, auctionPrompt.propertyId, activePlayerId, decision);
      if (decision === 'AUCTION') {
        setAuctionPrompt(null);
        await syncAuthoritativeGameState(gameId, activePlayerId);
        if (res.auction?.auctionId) {
          setSelectedAuctionId(res.auction.auctionId);
          setScreen('auction-details');
        }
        showToast(`10s auction initiated for ${auctionPrompt.propertyName}!`, 'orange');
      } else {
        if (res.action === 'ALL_PASSED') {
          setAuctionPrompt(null);
          showToast(`All players passed. ${auctionPrompt.propertyName} remains unowned.`, 'yellow');
        } else {
          setAuctionPrompt((prev) => (prev ? { ...prev, passVotes: [...(prev.passVotes || []), activePlayerId] } : null));
          showToast('Vote to pass recorded. Waiting for other players...', 'blue');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'pink');
    }
  };

  const handleSettleRent = async (customLandingEventId?: string) => {
    const targetId = customLandingEventId || activeRentAlert?.landingEventId || rentEvent.id;
    if (!targetId || targetId === 'EVT-NONE') return;
    try {
      await api.settleRent(gameId, targetId, activePlayerId);
      await syncAuthoritativeGameState(gameId, activePlayerId);
      setActiveRentAlert(null);
      setRentEvent((prev) => ({ ...prev, status: 'completed' }));
      showToast(`Rent settled successfully!`, 'green');
    } catch (err: any) {
      showToast(err.message || 'Failed to settle rent', 'pink');
    }
  };

  const handlePurchaseSpace = async (spaceId: string) => {
    try {
      await api.buyProperty(gameId, spaceId, activePlayerId);
      await syncAuthoritativeGameState(gameId, activePlayerId);
      showToast('Title Deed purchased successfully!', 'green');
    } catch (err: any) {
      showToast(err.message || 'Failed to buy property', 'pink');
    }
  };

  const handleBuildHouse = async (spaceId: string) => {
    try {
      await api.buildHouse(gameId, spaceId, activePlayerId);
      await syncAuthoritativeGameState(gameId, activePlayerId);
      showToast('Constructed house successfully!', 'green');
    } catch (err: any) {
      showToast(err.message || 'Failed to build house', 'pink');
    }
  };

  const handleUpgradeHotel = async (spaceId: string) => {
    try {
      await api.upgradeHotel(gameId, spaceId, activePlayerId);
      await syncAuthoritativeGameState(gameId, activePlayerId);
      showToast('Upgraded to Grand Hotel!', 'yellow');
    } catch (err: any) {
      showToast(err.message || 'Failed to upgrade hotel', 'pink');
    }
  };

  const handleToggleMortgage = async (spaceId: string) => {
    try {
      await api.toggleMortgage(gameId, spaceId, activePlayerId);
      await syncAuthoritativeGameState(gameId, activePlayerId);
      showToast('Mortgage status updated successfully!', 'blue');
    } catch (err: any) {
      showToast(err.message || 'Failed to update mortgage', 'pink');
    }
  };

  const handleStartAuction = async (spaceId: string, startingBid: number) => {
    try {
      const res = await api.startAuction(gameId, {
        propertyId: spaceId,
        sellerId: activePlayerId,
        startingBid,
        reservePrice: startingBid,
        durationSeconds: 10,
      });
      const startedId = res.auctionId || res.auction?.auctionId;
      await syncAuthoritativeGameState(gameId, activePlayerId);
      if (startedId) {
        setSelectedAuctionId(startedId);
      }
      setScreen('auction-details');
      showToast('Live auction gavel started!', 'orange');
    } catch (err: any) {
      showToast(err.message || 'Failed to start auction', 'pink');
    }
  };

  const handlePlaceBid = async (auctionId: string, amount: number) => {
    try {
      await api.placeBid(gameId, auctionId, activePlayerId, amount);
      await syncAuthoritativeGameState(gameId, activePlayerId);
      showToast(`Bid of ₹${amount.toLocaleString('en-IN')} placed!`, 'yellow');
    } catch (err: any) {
      showToast(err.message || 'Failed to place bid', 'pink');
    }
  };

  const handleFinalizeAuction = async (auctionId: string) => {
    try {
      await api.finalizeAuction(gameId, auctionId);
      setAuctions((prev) =>
        prev.map((auc) =>
          auc.id === auctionId ? { ...auc, status: 'settled', secondsRemaining: 0 } : auc
        )
      );
      await syncAuthoritativeGameState(gameId, activePlayerId);
      setSelectedAuctionId(auctionId);
      setScreen('auction-result');
      showToast('Gavel sold! Auction finalized.', 'green');
    } catch (err: any) {
      showToast(err.message || 'Failed to finalize auction', 'pink');
    }
  };

  const handleRequestLoan = async (
    lenderId: string,
    amount: number,
    rate: number,
    _terms: string
  ) => {
    try {
      if (lenderId === 'bank') {
        await api.takeBankLoan(gameId, activePlayerId, amount);
        showToast(`Bank loan of ₹${amount.toLocaleString('en-IN')} disbursed!`, 'green');
      } else {
        await api.requestPlayerLoan(gameId, activePlayerId, lenderId, amount, rate);
        showToast('P2P loan request sent to rival player!', 'blue');
      }
      await syncAuthoritativeGameState(gameId, activePlayerId);
      setScreen('loans-dashboard');
    } catch (err: any) {
      showToast(err.message || 'Loan request failed', 'pink');
    }
  };

  const handleApprovePendingLoan = async (loanId: string, _finalRate: number) => {
    try {
      await api.respondToLoan(gameId, loanId, activePlayerId, true);
      await syncAuthoritativeGameState(gameId, activePlayerId);
      showToast('Loan approved and funds disbursed!', 'green');
      setScreen('loans-dashboard');
    } catch (err: any) {
      showToast(err.message || 'Failed to approve loan', 'pink');
    }
  };

  const handleRepayLoan = async (loanId: string, amount: number) => {
    try {
      await api.repayLoan(gameId, loanId, amount);
      await syncAuthoritativeGameState(gameId, activePlayerId);
      showToast(`Repaid ₹${amount.toLocaleString('en-IN')} toward loan!`, 'green');
    } catch (err: any) {
      showToast(err.message || 'Failed to repay loan', 'pink');
    }
  };

  const handleSendMoney = async (recipientId: string, amount: number, _note: string) => {
    try {
      await api.sendMoney(gameId, activePlayerId, recipientId, amount);
      await syncAuthoritativeGameState(gameId, activePlayerId);
      showToast(`Transferred ₹${amount.toLocaleString('en-IN')} successfully!`, 'green');
      setScreen('dashboard');
    } catch (err: any) {
      showToast(err.message || 'Failed to transfer money', 'pink');
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      if (gameId && activePlayerId) {
        await api.markNotificationsRead(gameId, activePlayerId);
        await syncAuthoritativeGameState(gameId, activePlayerId);
      }
      showToast('All notifications marked as read', 'blue');
    } catch (err: any) {
      showToast(err.message || 'Failed to mark notifications', 'pink');
    }
  };

  /* --- Active Entity Lookups --- */
  const currentSpaceDetail =
    spaces.find((s) => s.id === selectedSpaceId) ??
    spaces.find((s) => Boolean(s.price)) ??
    spaces[1];

  const currentAuctionDetail =
    auctions.find((a) => a.id === selectedAuctionId) ??
    auctions[0] ?? {
      id: 'auc-none',
      spaceId: 'sp-1',
      propertyName: 'Mumbai',
      colorGroup: 'magenta' as any,
      colorHex: '#FF69B4',
      sellerId: 'bank',
      sellerName: 'Bank',
      startingBid: 8500,
      currentBid: 8500,
      highestBidderId: null,
      highestBidderName: null,
      secondsRemaining: 0,
      status: 'settled' as const,
      bids: [],
    };

  const currentLoanDetail =
    loans.find((l) => l.id === selectedLoanId) ??
    loans[0] ?? {
      id: 'ln-none',
      agreementCode: 'AGR-NONE',
      lenderId: 'bank',
      lenderName: 'Central Reserve Bank',
      borrowerId: activePlayerId,
      borrowerName: activePlayer.name,
      principal: 0,
      interestRate: 0,
      totalRepayment: 0,
      amountRepaid: 0,
      terms: 'No Active Loan',
      status: 'settled' as const,
      createdAt: 'Today',
      repayments: [],
    };

  /* --- 22 Screens Router --- */
  const renderCurrentScreen = () => {
    switch (screen) {
      case 'welcome':
        return (
          <WelcomeScreen
            gameMode={config.gameMode}
            onChangeGameMode={(mode) => setConfig((prev) => ({ ...prev, gameMode: mode }))}
            onNavigate={setScreen}
          />
        );
      case 'create-game':
        return (
          <CreateGameScreen
            config={config}
            onUpdateConfig={(patch) => setConfig((prev) => ({ ...prev, ...patch }))}
            hostPlayer={activePlayer}
            onUpdateHost={(name, avatar, tone) => handleCreateGame(name, avatar, tone)}
            onNavigate={setScreen}
          />
        );
      case 'join-game':
        return (
          <JoinGameScreen
            defaultRoomCode={config.roomCode || urlRoomCode}
            onJoinLobby={handleJoinLobby}
            onNavigate={setScreen}
          />
        );
      case 'lobby':
        return (
          <MultiplayerLobbyScreen
            config={config}
            players={players}
            activePlayerId={activePlayer.id}
            onToggleReady={() => {}}
            onAddBotPlayer={() => showToast('Waiting for other players to enter room code', 'blue')}
            onStartGame={handleStartGame}
            onNavigate={setScreen}
          />
        );
      case 'dashboard':
        return (
          <MainDashboardScreen
            activePlayer={activePlayer}
            players={players}
            roomCode={config.roomCode}
            gameMode={config.gameMode}
            spaces={spaces}
            loans={loans}
            transactions={transactions}
            auctions={auctions}
            unreadNotifications={unreadCount}
            rentEvent={rentEvent}
            currentTurnPlayerId={currentTurnPlayerId}
            onSelectPlayer={(pid) => {
              setActivePlayerId(pid);
              const p = players.find((x) => x.id === pid);
              if (p) showToast(`Switched perspective to ${p.name}`, p.accent);
            }}
            onNavigate={setScreen}
            onInspectSpace={(id) => {
              setSelectedSpaceId(id);
              setPopupSpaceId(id);
            }}
          />
        );
      case 'leaderboard':
        return (
          <LeaderboardScreen
            players={players}
            spaces={spaces}
            loans={loans}
            onSimulateBonus={() => syncAuthoritativeGameState(gameId, activePlayerId)}
            onNavigate={setScreen}
          />
        );
      case 'board':
        return (
          <BoardTrackingScreen
            spaces={spaces}
            players={players}
            activePlayer={activePlayer}
            movements={movements}
            gameMode={config.gameMode}
            currentTurnPlayerId={currentTurnPlayerId}
            visualPositions={visualPositions}
            movingPlayerId={movingPlayerId}
            lastDiceRoll={lastDiceRoll}
            isRollingDice={isRollingDice}
            onRollDigitalDice={handleRollDigitalDice}
            onNavigate={setScreen}
            onInspectSpace={(id) => {
              setSelectedSpaceId(id);
              setPopupSpaceId(id);
            }}
            onPurchaseSpace={(spaceId) => {
              setBuyConfirmSpaceId(spaceId);
            }}
            onTriggerRentForSpace={(spaceId) => {
              const sp = spaces.find((s) => s.id === spaceId);
              const owner = players.find((p) => p.id === sp?.ownerId);
              if (!sp || !owner) return;
              setRentEvent({
                id: `EVT-${Math.floor(1000 + Math.random() * 9000)}`,
                spaceId: sp.id,
                propertyName: sp.name,
                colorHex: sp.colorHex ?? '#2F5597',
                visitorId: activePlayer.id,
                visitorName: activePlayer.name,
                ownerId: owner.id,
                ownerName: owner.name,
                amount: computeSpaceRent(sp, spaces),
                status: 'pending',
                timestamp: 'Just now · Board Trigger',
              });
              setScreen('rent-notification');
            }}
          />
        );
      case 'dice-input':
        return (
          <DiceInputScreen
            activePlayer={activePlayer}
            spaces={spaces}
            players={players}
            gameMode={config.gameMode}
            currentTurnPlayerId={currentTurnPlayerId}
            isRollingDice={isRollingDice}
            lastDiceRoll={lastDiceRoll}
            onSelectPlayer={(pid) => {
              setActivePlayerId(pid);
              const p = players.find((x) => x.id === pid);
              if (p) showToast(`Switched perspective to ${p.name}`, p.accent);
            }}
            onConfirmRoll={handleConfirmDiceRoll as any}
            onRollDigitalDice={handleRollDigitalDice}
            onNavigate={setScreen}
          />
        );
      case 'rent-notification':
        return (
          <RentNotificationScreen
            rentEvent={rentEvent}
            players={players}
            onSettleRent={handleSettleRent}
            onDisputeRent={() => showToast('Dispute recorded for table host review', 'orange')}
            onInspectProperty={(spaceId) => {
              setSelectedSpaceId(spaceId);
              setPopupSpaceId(spaceId);
            }}
          />
        );
      case 'my-properties':
        return (
          <MyPropertiesScreen
            activePlayer={activePlayer}
            players={players}
            spaces={spaces}
            onSelectProperty={(spaceId) => {
              setSelectedSpaceId(spaceId);
              setPopupSpaceId(spaceId);
            }}
            onNavigate={setScreen}
          />
        );
      case 'property-details':
        return (
          <PropertyDetailsScreen
            space={currentSpaceDetail}
            allSpaces={spaces}
            activePlayer={activePlayer}
            players={players}
            onBuildHouse={handleBuildHouse}
            onUpgradeHotel={handleUpgradeHotel}
            onToggleMortgage={handleToggleMortgage}
            onTransferProperty={() => showToast('Direct deed transfer not permitted mid-game', 'orange')}
            onStartAuction={handleStartAuction}
            onPurchaseUnowned={handlePurchaseSpace}
            onNavigate={setScreen}
          />
        );
      case 'auction-market':
        return (
          <AuctionMarketplaceScreen
            auctions={auctions}
            players={players}
            onSelectAuction={(id) => {
              setSelectedAuctionId(id);
              setScreen('auction-details');
            }}
            onInspectResult={(id) => {
              setSelectedAuctionId(id);
              setScreen('auction-result');
            }}
            onNavigate={setScreen}
          />
        );
      case 'auction-details':
        return (
          <AuctionDetailsScreen
            auction={currentAuctionDetail}
            allAuctions={auctions}
            space={spaces.find((s) => s.id === currentAuctionDetail.spaceId)}
            players={players}
            activePlayer={activePlayer}
            onPlaceBid={handlePlaceBid}
            onSimulateRivalBid={() => showToast('Waiting for rival player bids over live network', 'blue')}
            onSelectAuction={(id) => setSelectedAuctionId(id)}
            onSwitchActivePlayer={(playerId) => {
              setActivePlayerId(playerId);
              const chosen = players.find((p) => p.id === playerId);
              if (chosen) showToast(`Switched perspective to ${chosen.name}`, chosen.accent);
            }}
            onFinalizeAuction={handleFinalizeAuction}
            onNavigate={setScreen}
          />
        );
      case 'auction-result':
        return (
          <AuctionResultScreen
            auction={currentAuctionDetail}
            players={players}
            onNavigate={setScreen}
          />
        );
      case 'loans-dashboard':
        return (
          <LoansDashboardScreen
            activePlayer={activePlayer}
            loans={loans}
            onSelectLoan={(id) => {
              setSelectedLoanId(id);
              setScreen('loan-details');
            }}
            onNavigate={setScreen}
          />
        );
      case 'request-loan':
        return (
          <RequestLoanScreen
            activePlayer={activePlayer}
            players={players}
            config={config}
            onRequestLoan={handleRequestLoan}
            onNavigate={setScreen}
          />
        );
      case 'give-loan':
        return (
          <GiveLoanScreen
            activePlayer={activePlayer}
            players={players}
            loans={loans}
            config={config}
            onGiveLoan={() => {}}
            onApprovePendingLoan={handleApprovePendingLoan}
            onNavigate={setScreen}
          />
        );
      case 'loan-details':
        return (
          <LoanDetailsScreen
            loan={currentLoanDetail}
            activePlayer={activePlayer}
            onRepayLoan={handleRepayLoan}
            onNavigate={setScreen}
          />
        );
      case 'bankruptcy':
        return (
          <BankruptcyScreen
            players={players}
            loans={loans}
            onSimulateIncomingGarnish={() => syncAuthoritativeGameState(gameId, activePlayerId)}
            onNavigate={setScreen}
          />
        );
      case 'send-money':
        return (
          <SendMoneyScreen
            activePlayer={activePlayer}
            players={players}
            onSendMoney={handleSendMoney}
            onNavigate={setScreen}
          />
        );
      case 'transactions':
        return <TransactionHistoryScreen transactions={transactions} />;
      case 'notifications':
        return (
          <NotificationsScreen
            notifications={notifications}
            onMarkAllRead={handleMarkAllNotificationsRead}
            onOpenNotification={(notif) => {
              setScreen(notif.targetScreen);
            }}
          />
        );
      default:
        return null;
    }
  };

  /* --- 5-Tab Mobile Bottom Navigation --- */
  const mobileBottomTabs: {
    id: ScreenId;
    match: ScreenId[];
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'dashboard',
      match: ['dashboard', 'send-money', 'rent-notification'],
      label: 'Home',
      icon: <PixelHome className="w-4 h-4" />,
    },
    {
      id: 'board',
      match: ['board', 'dice-input'],
      label: 'Board',
      icon: <PixelGamepad className="w-4 h-4" />,
    },
    {
      id: 'leaderboard',
      match: ['leaderboard'],
      label: 'Rankings',
      icon: <PixelTrophy className="w-4 h-4" />,
    },
    {
      id: 'my-properties',
      match: ['my-properties', 'property-details', 'auction-market', 'auction-details', 'auction-result'],
      label: 'Properties',
      icon: <PixelBuilding className="w-4 h-4" />,
    },
    {
      id: 'transactions',
      match: ['transactions', 'notifications', 'loans-dashboard', 'request-loan', 'give-loan', 'loan-details', 'bankruptcy'],
      label: 'Activity',
      icon: <PixelReceipt className="w-4 h-4" />,
    },
  ];

  const isInsideGame = Boolean(gameId || config.roomCode || urlRoomCode) && !['welcome', 'create-game', 'join-game', 'lobby'].includes(screen);

  return (
    <div className="min-h-screen bg-[#F8F7EF] text-[#171717] flex flex-col font-body">
      {isWakingServer && (
        <div className="bg-[#FFD95A] border-b-[1.5px] border-[#171717] px-4 py-1.5 text-center text-xs font-extrabold text-[#171717] z-50">
          Waking server &amp; reconnecting to live table...
        </div>
      )}
      {/* Global In-Game Top Bar - ONLY shown when actively playing inside a game */}
      {isInsideGame && (
        <header className="sticky top-0 z-40 bg-[#F8F7EF]/95 backdrop-blur-md border-b-[1.5px] border-[#171717] px-3 sm:px-6 py-2.5">
          <div className="max-w-[1520px] mx-auto flex flex-wrap items-center justify-between gap-3">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (gameId) {
                    setScreen('dashboard');
                  } else {
                    setScreen('welcome');
                  }
                }}
                className="flex items-center gap-2.5 group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-[#FFD95A] border-[1.5px] border-[#171717] shadow-[0_2px_0_0_#171717] flex items-center justify-center">
                  <div className="w-3.5 h-3.5 rounded-xs bg-[#171717] rotate-45" />
                </div>
                <div className="text-left">
                  <span className="font-display text-sm sm:text-base tracking-tight block leading-none">
                    DEED CLUB
                  </span>
                  {config.roomCode && (
                    <span className="text-[10px] font-extrabold text-[#171717]/60 block leading-none mt-0.5">
                      #{config.roomCode}
                    </span>
                  )}
                </div>
              </button>

              {/* Turn Indicator Pill in Header */}
              {gameId && currentTurnPlayerId && (
                <button
                  type="button"
                  onClick={() => {
                    if (config.gameMode === 'online') {
                      setScreen('board');
                    } else {
                      setActivePlayerId(currentTurnPlayerId);
                      setScreen('dice-input');
                    }
                  }}
                  className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFD95A] border-[1.5px] border-[#171717] text-xs font-black uppercase text-[#171717] shadow-[2px_2px_0px_#171717] hover:bg-[#FFE082] transition-colors cursor-pointer"
                  title={
                    config.gameMode === 'online'
                      ? 'Open live online board'
                      : 'Click to switch active perspective to this player'
                  }
                >
                  <span>🎲</span>
                  <span>Turn: {players.find((p) => p.id === currentTurnPlayerId)?.name || 'Player'}</span>
                </button>
              )}
            </div>

            {/* Web View Header Controls */}
            <div className="flex items-center gap-2">
              {gameId && (
                <span
                  className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-full border-[1.5px] border-[#171717] text-[11px] font-extrabold uppercase ${
                    config.gameMode === 'online' ? 'bg-[#A8DDB9]' : 'bg-[#91D5F2]'
                  }`}
                >
                  {config.gameMode === 'online' ? 'Online' : 'Local Board'}
                </span>
              )}
              {gameId && activePlayer && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#FFD95A] border-[1.5px] border-[#171717] font-display text-xs text-[#171717]">
                  {formatINR(activePlayer.cash)}
                </span>
              )}

              {gameId && (
                <button
                  type="button"
                  onClick={handleLeaveGame}
                  className="px-3 py-1.5 rounded-full bg-white border-[1.5px] border-[#171717] text-xs font-extrabold text-[#171717] hover:bg-[#FF9EC4] flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Exit Room</span>
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Toast Feedback */}
      {toast && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 z-50 animate-slide-up">
          <PastelCard
            tone={toast.tone}
            elevated
            className="px-4 py-3 flex items-center gap-2.5 !rounded-full shadow-[0_6px_0_0_#171717]"
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="text-xs sm:text-sm font-extrabold text-[#171717]">{toast.text}</span>
          </PastelCard>
        </div>
      )}

      {!isInsideGame ? (
        /* Outside Game Mode: Clean Centered Blank Screen showing ONLY Create/Join Prompts */
        <main className="min-h-screen bg-[#F8F7EF] text-[#171717] flex flex-col justify-center items-center px-4 py-8 flex-1">
          <div className={`w-full mx-auto ${screen === 'lobby' || screen === 'create-game' ? 'max-w-4xl' : screen === 'join-game' ? 'max-w-md' : 'max-w-sm'}`}>
            {renderCurrentScreen()}
          </div>
        </main>
      ) : (
        /* In-Game Mode: Full Web Desktop & Responsive Gameplay Application */
        <div className="max-w-[1520px] w-full mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 px-4 sm:px-6 py-6 pb-24 lg:pb-8">
          {/* Left Sidebar Navigation */}
          <aside className="hidden lg:flex lg:col-span-3 xl:col-span-2 flex-col justify-between gap-6">
            <div className="space-y-5 sticky top-20">
              {/* Active Player Balance Mini Card */}
              {activePlayer && (
                <PastelCard tone="yellow" className="p-4 space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <GeometricAvatar shape={activePlayer.avatar} tone="white" size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold truncate">{activePlayer.name}</p>
                      <p className="text-[10px] font-bold text-[#171717]/70">
                        {config.roomCode ? `#${config.roomCode}` : 'No Session'}
                      </p>
                    </div>
                  </div>
                  <div className="pt-1 border-t border-[#171717]/15">
                    <span className="text-[10px] font-extrabold uppercase text-[#171717]/65 block">
                      Cash Balance
                    </span>
                    <AnimatedCurrency amount={activePlayer.cash} className="text-lg text-[#171717]" />
                  </div>
                </PastelCard>
              )}

              {/* Grouped Desktop Navigation */}
              <nav className="space-y-4">
                {[
                  {
                    heading: 'Gameplay',
                    items: [
                      { id: 'dashboard' as ScreenId, label: 'Dashboard', icon: <PixelHome className="w-4 h-4" /> },
                      { id: 'board' as ScreenId, label: config.gameMode === 'online' ? 'Live Board' : 'Board Tracker', icon: <PixelGamepad className="w-4 h-4" /> },
                      { id: 'dice-input' as ScreenId, label: config.gameMode === 'online' ? 'Roll Dice' : 'Dice Input', icon: <Dice5 className="w-4 h-4" /> },
                      { id: 'leaderboard' as ScreenId, label: 'Leaderboard', icon: <PixelTrophy className="w-4 h-4" /> },
                      { id: 'rent-notification' as ScreenId, label: 'Rent Notice', icon: <HandCoins className="w-4 h-4" />, badge: rentEvent.status === 'pending' ? '!' : undefined },
                    ],
                  },
                  {
                    heading: 'Deeds & Banking',
                    items: [
                      { id: 'my-properties' as ScreenId, label: 'My Properties', icon: <PixelBuilding className="w-4 h-4" /> },
                      { id: 'auction-market' as ScreenId, label: 'Auctions', icon: <Gavel className="w-4 h-4" /> },
                      { id: 'loans-dashboard' as ScreenId, label: 'Loans Desk', icon: <PixelWallet className="w-4 h-4" /> },
                      { id: 'bankruptcy' as ScreenId, label: 'Bankruptcy', icon: <Activity className="w-4 h-4" /> },
                      { id: 'send-money' as ScreenId, label: 'Send Money', icon: <PixelCoins className="w-4 h-4" /> },
                      { id: 'transactions' as ScreenId, label: 'Transactions', icon: <PixelReceipt className="w-4 h-4" /> },
                      { id: 'notifications' as ScreenId, label: 'Notifications', icon: <Bell className="w-4 h-4" />, badge: unreadCount > 0 ? String(unreadCount) : undefined },
                    ],
                  },
                  {
                    heading: 'Entry & Room',
                    items: [
                      { id: 'welcome' as ScreenId, label: 'Welcome', icon: <Sparkles className="w-4 h-4" /> },
                      { id: 'create-game' as ScreenId, label: 'Create Game', icon: <Layers className="w-4 h-4" /> },
                      { id: 'join-game' as ScreenId, label: 'Join Game', icon: <PixelUsers className="w-4 h-4" /> },
                      { id: 'lobby' as ScreenId, label: 'Room Lobby', icon: <PixelUsers className="w-4 h-4" /> },
                    ],
                  },
                ].map((group) => (
                  <div key={group.heading} className="space-y-1">
                    <span className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-[#171717]/55">
                      {group.heading}
                    </span>
                    {group.items.map((item) => {
                      const active = screen === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setScreen(item.id)}
                          className={`w-full px-3.5 py-2.5 rounded-full flex items-center justify-between text-xs font-extrabold transition-all ${
                            active
                              ? 'bg-[#171717] text-[#F8F7EF] shadow-[0_3px_0_0_rgba(23,23,23,0.22)]'
                              : 'text-[#171717]/80 hover:bg-[#EAEAEA]'
                          }`}
                        >
                          <span className="flex items-center gap-2.5">
                            {item.icon}
                            {item.label}
                          </span>
                          {item.badge && (
                            <span className="px-1.5 py-0.2 rounded-full bg-[#FF9EC4] text-[#171717] border border-[#171717] text-[10px]">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Stage: Full 10-col width when viewing the Live Board */}
          <main className={`lg:col-span-9 min-w-0 ${screen === 'board' ? 'xl:col-span-10' : 'xl:col-span-7'}`}>
            {renderCurrentScreen()}
          </main>

          {/* Right-Side Live Table Panel on Wide Desktop (hidden on Board screen so 10x10 board gets full space) */}
          {screen !== 'board' && (
            <aside className="hidden xl:block xl:col-span-3 space-y-5">
            <div className="sticky top-20 space-y-5">
              {/* Live Auction Gavel Ticker */}
              {auctions.filter((a) => a.status === 'active')[0] && (
                <PastelCard
                  tone="orange"
                  onClick={() => {
                    setSelectedAuctionId(auctions.filter((a) => a.status === 'active')[0].id);
                    setScreen('auction-details');
                  }}
                  className="p-5 space-y-3 cursor-pointer hover:shadow-[0_6px_0_0_#171717] transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <StatusBadge dark>Live Gavel</StatusBadge>
                    <span className="font-display text-xs">
                      {formatCountdown(
                        auctions.filter((a) => a.status === 'active')[0].secondsRemaining
                      )}
                    </span>
                  </div>
                  <div>
                    <p className="font-display text-lg text-[#171717]">
                      {auctions.filter((a) => a.status === 'active')[0].propertyName}
                    </p>
                    <p className="text-xs font-bold text-[#171717]/80">
                      High Bid:{' '}
                      {formatINR(auctions.filter((a) => a.status === 'active')[0].currentBid)} by{' '}
                      {auctions.filter((a) => a.status === 'active')[0].highestBidderName || 'None'}
                    </p>
                  </div>
                </PastelCard>
              )}

              {/* Live Net Worth Rail */}
              <PastelCard tone="white" className="p-5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm text-[#171717]">Live Standings</h3>
                  <button
                    type="button"
                    onClick={() => setScreen('leaderboard')}
                    className="text-xs font-extrabold underline cursor-pointer"
                  >
                    Expand
                  </button>
                </div>
                <div className="space-y-2">
                  {rankedPlayers.length === 0 ? (
                    <p className="text-xs font-bold text-[#171717]/60 text-center py-4">
                      No active players yet
                    </p>
                  ) : (
                    rankedPlayers.map((rp) => (
                      <button
                        key={rp.player.id}
                        type="button"
                        onClick={() => {
                          if (config.gameMode === 'local') {
                            setActivePlayerId(rp.player.id);
                          }
                        }}
                        className={`w-full p-2.5 rounded-2xl border flex items-center justify-between text-left transition-all ${
                          rp.player.id === activePlayer.id
                            ? 'bg-[#FFD95A] border-[#171717]'
                            : 'bg-[#EAEAEA]/45 border-transparent hover:border-[#171717]/30'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-display text-xs w-5">#{rp.rank}</span>
                          <GeometricAvatar
                            shape={rp.player.avatar}
                            tone={rp.player.accent}
                            size="xs"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-extrabold truncate">{rp.player.name}</p>
                              {rp.player.id === currentTurnPlayerId && (
                                <span className="text-[9px] bg-[#171717] text-[#FFD95A] px-1 rounded font-mono font-black">
                                  TURN
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-semibold text-[#171717]/65">
                              Space #{rp.player.position}
                            </p>
                          </div>
                        </div>
                        <span className="font-display text-xs">{formatINR(rp.netWorth)}</span>
                      </button>
                    ))
                  )}
                </div>
              </PastelCard>

              {/* Live Feed Pulse */}
              <PastelCard tone="white" className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm text-[#171717]">Table Activity</h3>
                  <button
                    type="button"
                    onClick={() => setScreen('notifications')}
                    className="text-xs font-extrabold underline cursor-pointer"
                  >
                    Alerts ({unreadCount})
                  </button>
                </div>
                <div className="space-y-2.5">
                  {transactions.length === 0 ? (
                    <p className="text-xs font-bold text-[#171717]/60 text-center py-4">
                      No transactions recorded
                    </p>
                  ) : (
                    transactions.slice(0, 4).map((t) => (
                      <div
                        key={t.id}
                        className="text-xs pb-2 border-b border-[#171717]/10 last:border-none last:pb-0"
                      >
                        <div className="flex justify-between font-extrabold">
                          <span className="truncate pr-2">{t.title}</span>
                          <span>{formatINR(t.amount)}</span>
                        </div>
                        <p className="text-[11px] font-medium text-[#171717]/60">
                          {t.fromName} → {t.toName} · {t.timestamp}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </PastelCard>
            </div>
          </aside>
          )}

          {/* Responsive Mobile Bottom Navigation on Narrow Viewports */}
          <nav className="lg:hidden fixed bottom-3 left-3 right-3 z-30 rounded-full bg-[#171717] text-[#F8F7EF] p-1.5 shadow-[0_8px_24px_rgba(23,23,23,0.3)] flex items-center justify-around">
            {mobileBottomTabs.map((tab) => {
              const isActive = tab.match.includes(screen);
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setScreen(tab.id)}
                  className={`flex-1 py-2 rounded-full flex flex-col items-center gap-0.5 text-[10px] font-extrabold transition-all cursor-pointer ${
                    isActive ? 'bg-[#FFD95A] text-[#171717]' : 'text-[#F8F7EF]/75'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* REAL-TIME DUAL SCREEN RENT LANDING MODAL (ON TOP OF EVERYTHING) */}
      {activeRentAlert &&
        (activeRentAlert.visitorId === activePlayerId ||
          activeRentAlert.ownerId === activePlayerId) && (
          <div className="fixed inset-0 z-[99999] bg-[#171717]/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-lg bg-[#F8F7EF] border-[2.5px] border-[#171717] rounded-3xl shadow-[8px_8px_0px_#171717] overflow-hidden animate-scale-up">
              {/* Modal Header */}
              <div
                className={`p-6 border-b-2 border-[#171717] flex items-center justify-between gap-4 ${
                  activePlayerId === activeRentAlert.visitorId ? 'bg-[#FF9EC4]' : 'bg-[#A8DDB9]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#171717] text-[#F8F7EF] flex items-center justify-center font-display text-lg">
                    {activePlayerId === activeRentAlert.visitorId ? '!' : '₹'}
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#171717]/70 block">
                      {activePlayerId === activeRentAlert.visitorId
                        ? 'RENT DUE IMMEDIATELY'
                        : 'RENT TO COLLECT'}
                    </span>
                    <h3 className="font-display text-xl sm:text-2xl text-[#171717]">
                      {activePlayerId === activeRentAlert.visitorId
                        ? `Landed on ${activeRentAlert.propertyName}!`
                        : `${activeRentAlert.visitorName} Landed on ${activeRentAlert.propertyName}!`}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveRentAlert(null)}
                  className="w-8 h-8 rounded-full border border-[#171717] bg-[#F8F7EF] text-[#171717] font-bold text-sm flex items-center justify-center cursor-pointer hover:bg-white"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-5">
                <div className="p-5 rounded-2xl bg-[#FFD95A]/45 border-[1.5px] border-[#171717] flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#171717]/70 block">
                      Official Title Deed Rent
                    </span>
                    <span className="font-display text-3xl text-[#171717]">
                      {formatINR(activeRentAlert.rentAmount)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#171717]/70 block">
                      Registered Owner
                    </span>
                    <span className="font-display text-base text-[#171717]">
                      {activeRentAlert.ownerName}
                    </span>
                  </div>
                </div>

                {activePlayerId === activeRentAlert.visitorId ? (
                  <div className="space-y-3">
                    <p className="text-xs sm:text-sm font-semibold text-[#171717]/80">
                      You arrived on <strong>{activeRentAlert.propertyName}</strong> owned by{' '}
                      <strong>{activeRentAlert.ownerName}</strong>. Under physical board rules, you
                      must transfer the listed rent before the next dice roll.
                    </p>
                    <div className="flex items-center justify-between text-xs font-bold p-3 rounded-xl bg-[#EAEAEA]/60 border border-[#171717]/15">
                      <span>Your Current Balance:</span>
                      <span className="font-display text-sm">{formatINR(activePlayer.cash)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Button
                        variant="primary"
                        size="lg"
                        onClick={() => handleSettleRent(activeRentAlert.landingEventId)}
                      >
                        Pay Rent ({formatINR(activeRentAlert.rentAmount)})
                      </Button>
                      <Button
                        variant="secondary"
                        size="lg"
                        onClick={() => {
                          setActiveRentAlert(null);
                          setScreen('rent-notification');
                        }}
                      >
                        Details & Dispute
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs sm:text-sm font-semibold text-[#171717]/80">
                      <strong>{activeRentAlert.visitorName}</strong> just rolled and landed on your title
                      deed <strong>{activeRentAlert.propertyName}</strong>. Claim and acknowledge your
                      official rent collection!
                    </p>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Button
                        variant="pastel"
                        pastel="green"
                        size="lg"
                        onClick={() => handleSettleRent(activeRentAlert.landingEventId)}
                      >
                        Collect Rent ({formatINR(activeRentAlert.rentAmount)})
                      </Button>
                      <Button
                        variant="secondary"
                        size="lg"
                        onClick={() => setActiveRentAlert(null)}
                      >
                        Dismiss Notification
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      {/* UNOWNED PROPERTY PURCHASE MODAL (LANDING PLAYER ONLY) */}
      {unownedLanding && unownedLanding.landingPlayerId === activePlayerId && (() => {
        const deedSpace = spaces.find(
          (s) => s.id === unownedLanding.propertyId || s.name === unownedLanding.name
        );
        return (
          <div className="fixed inset-0 z-[99990] bg-[#171717]/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-md bg-[#F8F7EF] border-[2.5px] border-[#171717] rounded-3xl shadow-[8px_8px_0px_#171717] overflow-hidden animate-scale-up max-h-[90vh] overflow-y-auto">
              <div
                className="p-5 border-b-2 border-[#171717] flex items-center justify-between gap-4"
                style={{ backgroundColor: deedSpace?.colorHex || '#FFD95A' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#171717] text-[#FFD95A] flex items-center justify-center font-display text-lg">
                    🏢
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#171717]/80 block">
                      PROPERTY AVAILABLE · #{deedSpace?.index ?? ''}
                    </span>
                    <h3 className="font-display text-xl sm:text-2xl text-[#171717]">
                      {unownedLanding.name}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDeclineUnownedProperty}
                  className="w-8 h-8 rounded-full border border-[#171717] bg-[#F8F7EF] text-[#171717] font-bold text-sm flex items-center justify-center cursor-pointer hover:bg-white"
                  title="Pass and offer to auction"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-4">
                <div className="p-4 rounded-2xl bg-white border-[1.5px] border-[#171717] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#171717]/70 uppercase">Purchase Price</span>
                    <span className="font-display text-2xl text-[#171717]">{formatINR(unownedLanding.price)}</span>
                  </div>
                  {unownedLanding.colorGroup && (
                    <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-[#171717]/10">
                      <span className="text-[#171717]/60">Color Group</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#EAEAEA] border border-[#171717]/20">
                        {unownedLanding.colorGroup}
                      </span>
                    </div>
                  )}
                  {deedSpace?.baseRent !== undefined && (
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#171717]/10 text-[11px]">
                      <div className="p-2 rounded-xl bg-[#EAEAEA]/55 text-center">
                        <span className="block text-[9px] font-bold text-[#171717]/60 uppercase">Site Rent</span>
                        <span className="font-display">{formatINR(deedSpace.baseRent)}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#EAEAEA]/55 text-center">
                        <span className="block text-[9px] font-bold text-[#171717]/60 uppercase">1 House</span>
                        <span className="font-display">{formatINR(deedSpace.rent1House ?? deedSpace.baseRent)}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#EAEAEA]/55 text-center">
                        <span className="block text-[9px] font-bold text-[#171717]/60 uppercase">Hotel</span>
                        <span className="font-display">{formatINR(deedSpace.rentHotel ?? deedSpace.baseRent)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-[#EAEAEA]/60 border border-[#171717]/15 flex items-center justify-between text-xs font-bold">
                  <span className="text-[#171717]/70">Your Cash Balance:</span>
                  <span className="font-display text-sm">{formatINR(activePlayer.cash)}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Button
                    variant="pastel"
                    pastel="green"
                    size="lg"
                    disabled={activePlayer.cash < unownedLanding.price}
                    onClick={handleBuyUnownedProperty}
                  >
                    Buy ({formatINR(unownedLanding.price)})
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={handleDeclineUnownedProperty}
                  >
                    Pass
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* UNIVERSAL PROPERTY / SPACE CARD POPUP MODAL */}
      {popupSpaceId && (() => {
        const sp = spaces.find((s) => s.id === popupSpaceId);
        if (!sp) return null;
        const spOwner = players.find((p) => p.id === sp.ownerId);
        const occupants = players.filter((p) => p.position === sp.index);
        const isOwnedByMe = sp.ownerId === activePlayer.id;
        const isPurchasable = Boolean(sp.price);
        const currentRent = computeSpaceRent(sp, spaces);
        const canBuyHere =
          isPurchasable &&
          !sp.ownerId &&
          (!config.mustLandOnPropertyToBuy || activePlayer.position === sp.index);

        return (
          <div
            className="fixed inset-0 z-[99970] bg-[#171717]/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setPopupSpaceId(null)}
          >
            <div
              className="w-full max-w-lg bg-[#F8F7EF] border-[2.5px] border-[#171717] rounded-3xl shadow-[8px_8px_0px_#171717] overflow-hidden animate-scale-up max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Color Header */}
              <div
                className="p-5 border-b-2 border-[#171717] flex items-center justify-between gap-4"
                style={{ backgroundColor: sp.colorHex || '#FFD95A' }}
              >
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#171717]/80 block">
                    SPACE #{sp.index} · {sp.type.toUpperCase()}
                  </span>
                  <h3 className="font-display text-2xl text-[#171717]">{sp.name}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPopupSpaceId(null)}
                  className="w-9 h-9 rounded-full border-[1.5px] border-[#171717] bg-[#F8F7EF] text-[#171717] font-bold text-sm flex items-center justify-center cursor-pointer hover:bg-white"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-4">
                {isPurchasable ? (
                  <>
                    {/* Price, Mortgage & Owner Summary */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-2xl bg-white border-[1.5px] border-[#171717]">
                        <span className="text-[10px] font-extrabold uppercase text-[#171717]/60 block">
                          Deed Price
                        </span>
                        <span className="font-display text-xl text-[#171717]">
                          {formatINR(sp.price ?? 0)}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-white border-[1.5px] border-[#171717]">
                        <span className="text-[10px] font-extrabold uppercase text-[#171717]/60 block">
                          Mortgage Value
                        </span>
                        <span className="font-display text-xl text-[#171717]">
                          {formatINR(sp.mortgageValue ?? Math.round((sp.price ?? 0) / 2))}
                        </span>
                      </div>
                    </div>

                    {/* Owner Pill */}
                    <div className="p-3.5 rounded-2xl bg-[#EAEAEA]/65 border-[1.5px] border-[#171717] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        {spOwner ? (
                          <>
                            <GeometricAvatar shape={spOwner.avatar} tone={spOwner.accent} size="sm" />
                            <div>
                              <span className="text-[10px] font-extrabold uppercase text-[#171717]/60 block">
                                Registered Owner
                              </span>
                              <span className="font-display text-sm text-[#171717]">
                                {spOwner.name} {isOwnedByMe ? '(You)' : ''}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div>
                            <span className="text-[10px] font-extrabold uppercase text-[#171717]/60 block">
                              Ownership Status
                            </span>
                            <span className="font-display text-sm text-[#171717]">
                              Unowned · Available From Central Bank
                            </span>
                          </div>
                        )}
                      </div>
                      <StatusBadge tone={sp.isMortgaged ? 'pink' : 'yellow'}>
                        Rent {formatINR(currentRent)}
                      </StatusBadge>
                    </div>

                    {/* Full Rent Schedule */}
                    {sp.baseRent !== undefined && (
                      <div className="p-4 rounded-2xl bg-white border-[1.5px] border-[#171717] space-y-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#171717]/65 block">
                          Official Title Deed Rent Schedule
                        </span>
                        <div className="space-y-1.5 text-xs font-bold">
                          {[
                            { label: 'Site Only (Base Rent)', value: sp.baseRent, active: !sp.hasHotel && sp.houses === 0 },
                            ...(sp.type === 'property'
                              ? [
                                  { label: 'With 1 House', value: sp.rent1House, active: !sp.hasHotel && sp.houses === 1 },
                                  { label: 'With 2 Houses', value: sp.rent2House, active: !sp.hasHotel && sp.houses === 2 },
                                  { label: 'With 3 Houses', value: sp.rent3House, active: !sp.hasHotel && sp.houses === 3 },
                                  { label: 'With Grand Hotel', value: sp.rentHotel, active: sp.hasHotel },
                                ]
                              : []),
                          ].map((tier) => (
                            <div
                              key={tier.label}
                              className={`px-3 py-1.5 rounded-xl flex items-center justify-between ${
                                tier.active ? 'bg-[#FFD95A] border border-[#171717]' : 'bg-[#EAEAEA]/45'
                              }`}
                            >
                              <span>{tier.label}</span>
                              <span className="font-display">{formatINR(tier.value ?? 0)}</span>
                            </div>
                          ))}
                        </div>
                        {sp.houseCost ? (
                          <p className="text-[11px] font-semibold text-[#171717]/70 pt-1">
                            Construction: {formatINR(sp.houseCost)} per house · {formatINR(sp.hotelCost ?? sp.houseCost)} for hotel
                          </p>
                        ) : null}
                      </div>
                    )}

                    {/* Property Actions */}
                    <div className="space-y-2.5 pt-1">
                      {!sp.ownerId && (
                        <Button
                          variant="pastel"
                          pastel="green"
                          size="lg"
                          fullWidth
                          disabled={!canBuyHere || activePlayer.cash < (sp.price ?? 0)}
                          onClick={() => {
                            setPopupSpaceId(null);
                            setBuyConfirmSpaceId(sp.id);
                          }}
                        >
                          {!canBuyHere
                            ? `Land on #${sp.index} ${sp.name} to Buy`
                            : activePlayer.cash < (sp.price ?? 0)
                              ? `Insufficient Cash (${formatINR(sp.price ?? 0)})`
                              : `Buy Property (${formatINR(sp.price ?? 0)})`}
                        </Button>
                      )}

                      {isOwnedByMe && (
                        <div className="space-y-2.5">
                          <div className="grid grid-cols-2 gap-2.5">
                            {sp.type === 'property' && !sp.hasHotel && sp.houses < 3 && (
                              <Button
                                variant="pastel"
                                pastel="green"
                                size="md"
                                disabled={sp.isMortgaged}
                                onClick={() => handleBuildHouse(sp.id)}
                              >
                                Build House ({formatINR(sp.houseCost ?? 0)})
                              </Button>
                            )}
                            {sp.type === 'property' && !sp.hasHotel && sp.houses >= 3 && (
                              <Button
                                variant="pastel"
                                pastel="yellow"
                                size="md"
                                disabled={sp.isMortgaged}
                                onClick={() => handleUpgradeHotel(sp.id)}
                              >
                                Upgrade Hotel ({formatINR(sp.hotelCost ?? sp.houseCost ?? 0)})
                              </Button>
                            )}
                            <Button
                              variant="secondary"
                              size="md"
                              onClick={() => handleToggleMortgage(sp.id)}
                            >
                              {sp.isMortgaged ? 'Unmortgage Deed' : 'Mortgage Deed'}
                            </Button>
                          </div>

                          <div className="p-3 rounded-2xl bg-[#FFB66E]/35 border-[1.5px] border-[#171717] flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold">Start Bid ₹</span>
                              <input
                                type="number"
                                min={50}
                                step={50}
                                value={popupAuctionBid}
                                onChange={(e) => setPopupAuctionBid(Math.max(50, Number(e.target.value) || 50))}
                                className="w-24 px-2.5 py-1.5 rounded-xl bg-white border-[1.5px] border-[#171717] font-display text-xs"
                              />
                            </div>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                handleStartAuction(sp.id, popupAuctionBid);
                                setPopupSpaceId(null);
                              }}
                            >
                              Auction Property
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-white border-[1.5px] border-[#171717]">
                      <span className="text-[10px] font-extrabold uppercase text-[#171717]/60 block">
                        Board Rule
                      </span>
                      <p className="text-sm font-bold text-[#171717] mt-1">
                        {sp.region || 'Official board action space.'}
                      </p>
                      {sp.taxAmount && (
                        <p className="text-xs font-extrabold text-rose-900 mt-1">
                          Tax Due on Landing: {formatINR(sp.taxAmount)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {occupants.length > 0 && (
                  <div className="p-3 rounded-2xl bg-[#A8DDB9]/35 border border-[#171717]/20 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-extrabold text-[#171717]/75">Players Here:</span>
                    {occupants.map((occ) => (
                      <span
                        key={occ.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#171717] text-xs font-bold"
                      >
                        <GeometricAvatar shape={occ.avatar} tone={occ.accent} size="xs" circular />
                        {occ.name}
                      </span>
                    ))}
                  </div>
                )}

                <Button variant="secondary" size="md" fullWidth onClick={() => setPopupSpaceId(null)}>
                  Close Card
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* BUY PROPERTY CONFIRMATION POPUP */}
      {buyConfirmSpaceId && (() => {
        const sp = spaces.find((s) => s.id === buyConfirmSpaceId);
        if (!sp || !sp.price) return null;
        const remainingCash = activePlayer.cash - sp.price;
        return (
          <div
            className="fixed inset-0 z-[99992] bg-[#171717]/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setBuyConfirmSpaceId(null)}
          >
            <div
              className="w-full max-w-md bg-[#F8F7EF] border-[2.5px] border-[#171717] rounded-3xl shadow-[8px_8px_0px_#171717] overflow-hidden animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="p-5 border-b-2 border-[#171717] flex items-center justify-between gap-4"
                style={{ backgroundColor: sp.colorHex || '#A8DDB9' }}
              >
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#171717]/80 block">
                    CONFIRM PURCHASE · #{sp.index}
                  </span>
                  <h3 className="font-display text-2xl text-[#171717]">Buy {sp.name}?</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setBuyConfirmSpaceId(null)}
                  className="w-8 h-8 rounded-full border border-[#171717] bg-[#F8F7EF] text-[#171717] font-bold text-sm flex items-center justify-center cursor-pointer hover:bg-white"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-4 rounded-2xl bg-white border-[1.5px] border-[#171717] space-y-2 text-xs font-bold">
                  <div className="flex items-center justify-between">
                    <span className="text-[#171717]/70">Purchase Price</span>
                    <span className="font-display text-lg text-[#171717]">{formatINR(sp.price)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#171717]/70">Your Current Cash</span>
                    <span className="font-display text-sm">{formatINR(activePlayer.cash)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#171717]/15">
                    <span className="text-[#171717]/70">Balance After Purchase</span>
                    <span className={`font-display text-sm ${remainingCash < 0 ? 'text-rose-700' : 'text-[#1e6b3b]'}`}>
                      {formatINR(remainingCash)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="pastel"
                    pastel="green"
                    size="lg"
                    disabled={remainingCash < 0}
                    onClick={async () => {
                      const targetId = sp.id;
                      setBuyConfirmSpaceId(null);
                      await handlePurchaseSpace(targetId);
                    }}
                  >
                    Confirm Buy
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => setBuyConfirmSpaceId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* BOARD EVENT POPUP (CHANCE / COMMUNITY CHEST / TAX / START / JAIL) */}
      {landingEventModal && (
        <div
          className="fixed inset-0 z-[99985] bg-[#171717]/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLandingEventModal(null)}
        >
          <div
            className="w-full max-w-md bg-[#F8F7EF] border-[2.5px] border-[#171717] rounded-3xl shadow-[8px_8px_0px_#171717] overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`p-5 border-b-2 border-[#171717] flex items-center justify-between gap-4 ${
                landingEventModal.tone === 'pink'
                  ? 'bg-[#FF9EC4]'
                  : landingEventModal.tone === 'blue'
                    ? 'bg-[#91D5F2]'
                    : landingEventModal.tone === 'green'
                      ? 'bg-[#A8DDB9]'
                      : landingEventModal.tone === 'orange'
                        ? 'bg-[#FFB66E]'
                        : 'bg-[#FFD95A]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#171717] text-[#FFD95A] flex items-center justify-center text-xl">
                  {landingEventModal.emoji}
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#171717]/75 block">
                    {landingEventModal.subtitle}
                  </span>
                  <h3 className="font-display text-xl text-[#171717]">{landingEventModal.title}</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLandingEventModal(null)}
                className="w-8 h-8 rounded-full border border-[#171717] bg-[#F8F7EF] text-[#171717] font-bold text-sm flex items-center justify-center cursor-pointer hover:bg-white"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm font-bold text-[#171717] leading-relaxed">
                {landingEventModal.message}
              </p>
              <Button variant="primary" size="lg" fullWidth onClick={() => setLandingEventModal(null)}>
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* UNOWNED PROPERTY AUCTION PROMPT MODAL (ALL PLAYERS) */}
      {auctionPrompt && (
        <div className="fixed inset-0 z-[99980] bg-[#171717]/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-[#F8F7EF] border-[2.5px] border-[#171717] rounded-3xl shadow-[8px_8px_0px_#171717] overflow-hidden animate-scale-up">
            <div className="p-5 border-b-2 border-[#171717] bg-[#FF9EC4] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#171717] text-[#FF9EC4] flex items-center justify-center font-display text-lg">
                  🔨
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#171717]/70 block">
                    AUCTION DECISION
                  </span>
                  <h3 className="font-display text-xl sm:text-2xl text-[#171717]">
                    Auction {auctionPrompt.propertyName}?
                  </h3>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs sm:text-sm font-semibold text-[#171717]/85 leading-relaxed">
                <strong>{auctionPrompt.declinedByPlayerName}</strong> chose to pass on purchasing{' '}
                <strong>{auctionPrompt.propertyName}</strong> for {formatINR(auctionPrompt.price)}.
              </p>
              <p className="text-xs text-[#171717]/65">
                Would you like to put this property up for live gavel auction (starts at ₹50), or pass? If all players pass, it remains with the Bank.
              </p>

              {auctionPrompt.passVotes?.includes(activePlayerId) ? (
                <div className="p-4 rounded-2xl bg-[#A8DDB9]/40 border-[1.5px] border-[#171717] space-y-3">
                  <p className="text-xs font-black text-[#171717]">
                    ✓ You voted to pass.
                  </p>
                  <p className="text-[11px] font-bold text-[#171717]/70">
                    Waiting for remaining players... ({auctionPrompt.passVotes.length} passed so far)
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAuctionDecision('AUCTION')}
                    className="w-full"
                  >
                    Start Auction Now Instead (₹50)
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => handleAuctionDecision('AUCTION')}
                  >
                    Auction Property
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => handleAuctionDecision('PASS')}
                  >
                    Pass
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
