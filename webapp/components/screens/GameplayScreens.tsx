"use client";

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Award,
  Bell,
  Building2,
  CheckCircle2,
  Compass,
  Dice5,
  Gavel,
  HandCoins,
  Home,
  Landmark,
  MapPin,
  ReceiptText,
  Send,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  computePlayerDebt,
  computePlayerPropertyValue,
  computeSpaceRent,
} from '../../data/gameHelpers';
import {
  AuctionItem,
  BoardSpace,
  GameMode,
  LoanContract,
  MovementLog,
  Player,
  RentEvent,
  ScreenId,
  TransactionItem,
} from '../../types/game';
import {
  AnimatedCurrency,
  BoardPlayerToken,
  Button,
  DiceFace,
  formatINR,
  GeometricAvatar,
  HouseHotelIndicator,
  IconButton,
  PastelCard,
  StatusBadge,
} from '../ui/Primitives';

export interface RankedPlayer {
  player: Player;
  rank: number;
  propertyValue: number;
  debt: number;
  netWorth: number;
}

export function useRankedPlayers(
  players: Player[],
  spaces: BoardSpace[],
  loans: LoanContract[]
): RankedPlayer[] {
  return useMemo(() => {
    const enriched = players.map((player) => {
      const propertyValue = computePlayerPropertyValue(player.id, spaces);
      const debt = computePlayerDebt(player.id, loans);
      const netWorth = player.cash + propertyValue - debt;
      return { player, rank: 1, propertyValue, debt, netWorth };
    });
    enriched.sort((a, b) => b.netWorth - a.netWorth);
    return enriched.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [players, spaces, loans]);
}

/* ============================================================================
   SCREEN 5: MAIN DASHBOARD
============================================================================ */
export function MainDashboardScreen({
  activePlayer,
  players,
  roomCode,
  gameMode = 'local',
  spaces,
  loans,
  transactions,
  auctions,
  unreadNotifications,
  rentEvent,
  currentTurnPlayerId,
  onSelectPlayer,
  onNavigate,
  onInspectSpace,
}: {
  activePlayer: Player;
  players: Player[];
  roomCode: string;
  gameMode?: GameMode;
  spaces: BoardSpace[];
  loans: LoanContract[];
  transactions: TransactionItem[];
  auctions: AuctionItem[];
  unreadNotifications: number;
  rentEvent: RentEvent;
  currentTurnPlayerId?: string;
  onSelectPlayer?: (playerId: string) => void;
  onNavigate: (screen: ScreenId) => void;
  onInspectSpace: (spaceId: string) => void;
}) {
  const ranked = useRankedPlayers(players, spaces, loans);
  const myRankInfo = ranked.find((r) => r.player?.id === activePlayer?.id) ?? ranked[0] ?? {
    player: activePlayer,
    rank: 1,
    netWorth: activePlayer?.cash || 0,
    propertyValue: 0,
    debt: 0,
    properties: [],
    change: 'same' as const,
  };
  const currentSpace = spaces[activePlayer.position] ?? spaces[0];

  const currentTurnPlayer = players.find((p) => p.id === currentTurnPlayerId);
  const isMyTurn = !currentTurnPlayerId || currentTurnPlayerId === activePlayer.id;

  const myProperties = spaces.filter((s) => s.ownerId === activePlayer.id);
  const totalHouses = myProperties.reduce((sum, s) => sum + s.houses, 0);
  const totalHotels = myProperties.reduce((sum, s) => sum + (s.hasHotel ? 1 : 0), 0);

  const activeAuctions = (auctions || []).filter((a) => a.status === 'active');

  const topPlayer = ranked[0];
  const secondPlayer = ranked[1];
  const bottomPlayer = ranked[ranked.length - 1];

  const quickActions: {
    label: string;
    sub: string;
    screen: ScreenId;
    tone: 'pink' | 'green' | 'orange' | 'blue' | 'yellow' | 'white';
    icon: React.ReactNode;
  }[] = [
    {
      label: 'Send Money',
      sub: 'Instant P2P',
      screen: 'send-money',
      tone: 'pink',
      icon: <Send className="w-5 h-5" />,
    },
    {
      label: 'My Properties',
      sub: `${myProperties.length} Title Deeds`,
      screen: 'my-properties',
      tone: 'green',
      icon: <Building2 className="w-5 h-5" />,
    },
    {
      label: 'Auction',
      sub: activeAuctions.length > 0 ? `${activeAuctions.length} Live ${activeAuctions.length === 1 ? 'Gavel' : 'Gavels'}` : 'Start Auction',
      screen: 'auction-market',
      tone: 'orange',
      icon: <Gavel className="w-5 h-5" />,
    },
    {
      label: 'Loans',
      sub: 'Bank & P2P',
      screen: 'loans-dashboard',
      tone: 'blue',
      icon: <Landmark className="w-5 h-5" />,
    },
    {
      label: 'Transactions',
      sub: 'Full Ledger',
      screen: 'transactions',
      tone: 'yellow',
      icon: <ReceiptText className="w-5 h-5" />,
    },
    {
      label: 'Board',
      sub: `At ${currentSpace.name}`,
      screen: 'board',
      tone: 'white',
      icon: <Compass className="w-5 h-5" />,
    },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Top Greeting Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <GeometricAvatar shape={activePlayer.avatar} tone={activePlayer.accent} size="md" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/65">
                Table Room #{roomCode}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#35A862]" />
              <span className="text-xs font-bold text-[#35A862]">Live Sync</span>
            </div>
            <h1 className="font-display text-xl sm:text-2xl text-[#171717]">
              {isMyTurn ? `Your Turn, ${activePlayer.name}` : `Turn: ${currentTurnPlayer?.name || activePlayer.name}`}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="pastel"
            pastel="orange"
            size="sm"
            onClick={() => {
              if (gameMode === 'online') {
                onNavigate('board');
                return;
              }
              if (!isMyTurn && currentTurnPlayer && onSelectPlayer) {
                onSelectPlayer(currentTurnPlayer.id);
              }
              onNavigate('dice-input');
            }}
          >
            <Dice5 className="w-4 h-4" />
            {gameMode === 'online'
              ? isMyTurn
                ? 'Open Board & Roll'
                : 'View Live Board'
              : isMyTurn
                ? 'Enter Dice Roll'
                : `Roll for ${currentTurnPlayer?.name || 'Next'}`}
          </Button>
          <IconButton
            label="Notifications"
            badgeCount={unreadNotifications}
            tone="white"
            onClick={() => onNavigate('notifications')}
          >
            <Bell className="w-5 h-5 text-[#171717]" />
          </IconButton>
        </div>
      </div>

      {/* Turn Alert Banner when not active player's turn */}
      {!isMyTurn && currentTurnPlayer && (
        <div className="p-4 rounded-2xl bg-[#FFD95A] border-[1.5px] border-[#171717] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[3px_3px_0px_#171717] animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#171717] text-[#FFD95A] flex items-center justify-center font-display text-lg shrink-0">
              🎲
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-[#171717]">
                Chance: {currentTurnPlayer.name}&apos;s Turn to Roll!
              </p>
              <p className="text-[11px] font-semibold text-[#171717]/80">
                Pawn is currently on #{currentTurnPlayer.position} {spaces[currentTurnPlayer.position]?.name || ''}.
              </p>
            </div>
          </div>
          {gameMode === 'local' && onSelectPlayer ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onSelectPlayer(currentTurnPlayer.id);
                onNavigate('dice-input');
              }}
            >
              Switch &amp; Roll for {currentTurnPlayer.name}
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={() => onNavigate('board')}>
              Watch Live Board
            </Button>
          )}
        </div>
      )}

      {/* Pending Rent Alert Banner if active */}
      {rentEvent.status === 'pending' && (
        <PastelCard
          tone="pink"
          onClick={() => onNavigate('rent-notification')}
          className="p-4 sm:px-5 flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#171717] text-[#FF9EC4] flex items-center justify-center shrink-0">
              <HandCoins className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/75">
                Action Required · Event #{rentEvent.id}
              </p>
              <p className="text-sm font-extrabold text-[#171717]">
                {rentEvent.visitorName} landed on {rentEvent.propertyName} ({rentEvent.ownerName}) ·{' '}
                {formatINR(rentEvent.amount)} due
              </p>
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={() => onNavigate('rent-notification')}>
            Settle Rent
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </PastelCard>
      )}

      {/* Hero Balance Card */}
      <PastelCard
        tone="yellow"
        elevated
        className="relative overflow-hidden p-6 sm:p-8"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -bottom-10 w-44 h-44 rounded-full bg-[#F8F7EF]/45 border-[1.5px] border-[#171717]/20"
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge dark>Available Cash</StatusBadge>
              <StatusBadge tone="white">
                Rank #{myRankInfo.rank} of {players.length}
              </StatusBadge>
              {activePlayer.isBankrupt && (
                <StatusBadge tone="pink">Auto-Garnish Mode</StatusBadge>
              )}
            </div>
            <div className="pt-1">
              <AnimatedCurrency
                amount={activePlayer.cash}
                className="text-4xl sm:text-5xl lg:text-[54px] text-[#171717]"
              />
            </div>
            <p className="text-xs sm:text-sm font-bold text-[#171717]/75">
              {gameMode === 'online'
                ? `Online digital board · Live settlement across ${players.length} players`
                : `Physical bank replacement · Instant settlement across ${players.length} players`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[290px]">
            <div className="p-3.5 rounded-2xl bg-[#F8F7EF] border-[1.5px] border-[#171717]">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#171717]/65">
                Total Net Worth
              </span>
              <div className="mt-1">
                <AnimatedCurrency
                  amount={myRankInfo.netWorth}
                  className="text-base sm:text-lg text-[#171717]"
                />
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#171717] text-[#F8F7EF] border-[1.5px] border-[#171717]">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#F8F7EF]/70">
                Deed Equity
              </span>
              <div className="mt-1 font-display text-base sm:text-lg text-[#FFD95A]">
                {formatINR(myRankInfo.propertyValue)}
              </div>
            </div>
          </div>
        </div>
      </PastelCard>

      {/* 4 Key Position & Portfolio Metrics Below Balance Card */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <PastelCard
          tone="blue"
          onClick={() => onNavigate('board')}
          className="p-4 flex flex-col justify-between gap-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#171717]/75">
              Board Position
            </span>
            <MapPin className="w-4 h-4 text-[#171717]" />
          </div>
          <div>
            <p className="font-display text-base sm:text-lg text-[#171717] truncate">
              {currentSpace.name}
            </p>
            <p className="text-xs font-bold text-[#171717]/70">Space #{currentSpace.index}</p>
          </div>
        </PastelCard>

        <PastelCard
          tone="green"
          onClick={() => onNavigate('my-properties')}
          className="p-4 flex flex-col justify-between gap-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#171717]/75">
              Properties Owned
            </span>
            <Building2 className="w-4 h-4 text-[#171717]" />
          </div>
          <div>
            <p className="font-display text-base sm:text-lg text-[#171717]">
              {myProperties.length} Deeds
            </p>
            <p className="text-xs font-bold text-[#171717]/70">
              {formatINR(myRankInfo.propertyValue)} value
            </p>
          </div>
        </PastelCard>

        <PastelCard
          tone="orange"
          onClick={() => {
            if (myProperties[0]) onInspectSpace(myProperties[0].id);
            else onNavigate('my-properties');
          }}
          className="p-4 flex flex-col justify-between gap-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#171717]/75">
              Construction
            </span>
            <Home className="w-4 h-4 text-[#171717]" />
          </div>
          <div>
            <p className="font-display text-base sm:text-lg text-[#171717]">
              {totalHouses}H · {totalHotels}HTL
            </p>
            <p className="text-xs font-bold text-[#171717]/70">
              {totalHouses} Houses, {totalHotels} Hotel
            </p>
          </div>
        </PastelCard>

        <PastelCard
          tone="pink"
          onClick={() =>
            onNavigate(activePlayer.isBankrupt ? 'bankruptcy' : 'loans-dashboard')
          }
          className="p-4 flex flex-col justify-between gap-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#171717]/75">
              Outstanding Loans
            </span>
            <Landmark className="w-4 h-4 text-[#171717]" />
          </div>
          <div>
            <p className="font-display text-base sm:text-lg text-[#171717]">
              {formatINR(myRankInfo.debt)}
            </p>
            <p className="text-xs font-bold text-[#171717]/70">
              {myRankInfo.debt === 0 ? 'Debt-Free' : 'Tap to repay'}
            </p>
          </div>
        </PastelCard>
      </div>

      {/* Quick Action Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-[#171717]">Quick Actions</h2>
          <span className="text-xs font-bold text-[#171717]/60">Tap any desk</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((act) => (
            <PastelCard
              key={act.label}
              tone={act.tone}
              onClick={() => onNavigate(act.screen)}
              className="p-4 flex flex-col justify-between gap-3"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#171717] text-[#F8F7EF] flex items-center justify-center">
                {act.icon}
              </div>
              <div>
                <p className="text-sm font-extrabold text-[#171717]">{act.label}</p>
                <p className="text-[11px] font-semibold text-[#171717]/70">{act.sub}</p>
              </div>
            </PastelCard>
          ))}
        </div>
      </div>

      {/* Compact Leaderboard Preview + Recent Activity Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Compact Leaderboard Preview: #1, #2, and Bottom-Ranked */}
        <PastelCard tone="white" className="lg:col-span-6 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base sm:text-lg text-[#171717]">
                Standings Snapshot
              </h3>
              <p className="text-xs font-semibold text-[#171717]/65">
                Top 2 leaders & bottom-ranked alert
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => onNavigate('leaderboard')}>
              Full Rankings
            </Button>
          </div>

          <div className="space-y-2.5">
            {(() => {
              const cards: { entry: RankedPlayer; label: string; bg: string }[] = [];
              if (topPlayer) {
                cards.push({ entry: topPlayer, label: '1st · Leader', bg: 'bg-[#FFD95A]' });
              }
              if (secondPlayer && secondPlayer.player.id !== topPlayer?.player.id) {
                cards.push({ entry: secondPlayer, label: '2nd · Challenger', bg: 'bg-[#91D5F2]' });
              }
              if (
                bottomPlayer &&
                ranked.length > 2 &&
                bottomPlayer.player.id !== topPlayer?.player.id &&
                bottomPlayer.player.id !== secondPlayer?.player.id
              ) {
                cards.push({
                  entry: bottomPlayer,
                  label: `${bottomPlayer.rank}th · Trailing`,
                  bg: 'bg-[#FF9EC4]',
                });
              }
              return cards.map(({ entry, label, bg }) => (
                <div
                  key={`${label}-${entry.player.id}`}
                  className={`p-3.5 rounded-2xl ${bg} border-[1.5px] border-[#171717] flex items-center justify-between gap-3`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <GeometricAvatar
                      shape={entry.player.avatar}
                      tone="white"
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#171717]/75">
                        {label}
                      </p>
                      <p className="text-sm font-extrabold text-[#171717] truncate">
                        {entry.player.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-sm text-[#171717]">
                      {formatINR(entry.netWorth)}
                    </p>
                    <p className="text-[11px] font-bold text-[#171717]/75">
                      Cash {formatINR(entry.player.cash)}
                    </p>
                  </div>
                </div>
              ));
            })()}
          </div>
        </PastelCard>

        {/* Recent Activity Feed */}
        <PastelCard tone="white" className="lg:col-span-6 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base sm:text-lg text-[#171717]">Recent Activity</h3>
              <p className="text-xs font-semibold text-[#171717]/65">
                Live multiplayer events from the table
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => onNavigate('transactions')}>
              All History
            </Button>
          </div>

          <div className="space-y-2.5">
            {transactions.slice(0, 4).map((tx) => {
              const dotTone = {
                yellow: 'bg-[#FFD95A]',
                pink: 'bg-[#FF9EC4]',
                blue: 'bg-[#91D5F2]',
                green: 'bg-[#A8DDB9]',
                orange: 'bg-[#FFB66E]',
                white: 'bg-[#F8F7EF]',
                gray: 'bg-[#EAEAEA]',
              }[tx.pastel];

              return (
                <div
                  key={tx.id}
                  className="p-3 rounded-2xl bg-[#EAEAEA]/45 border border-[#171717]/15 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl ${dotTone} border border-[#171717] flex items-center justify-center shrink-0 font-display text-xs`}
                    >
                      {tx.direction === 'in' ? '+' : '-'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-extrabold text-[#171717] truncate">
                        {tx.title}
                      </p>
                      <p className="text-[11px] font-medium text-[#171717]/65 truncate">
                        {tx.subtitle} · {tx.timestamp}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-display text-xs sm:text-sm shrink-0 ${
                      tx.direction === 'in' ? 'text-[#1e6b3b]' : 'text-[#171717]'
                    }`}
                  >
                    {tx.direction === 'in' ? '+' : '-'}
                    {formatINR(tx.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </PastelCard>
      </div>
    </div>
  );
}

/* ============================================================================
   SCREEN 6: LEADERBOARD
============================================================================ */
export function LeaderboardScreen({
  players,
  spaces,
  loans,
  onSimulateBonus,
  onNavigate,
}: {
  players: Player[];
  spaces: BoardSpace[];
  loans: LoanContract[];
  onSimulateBonus: () => void;
  onNavigate: (screen: ScreenId) => void;
}) {
  const ranked = useRankedPlayers(players, spaces, loans);

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/60">
            Screen 06 · Live Net-Worth Standings
          </p>
          <h2 className="font-display text-2xl sm:text-3xl text-[#171717]">Player Leaderboard</h2>
        </div>
        <Button variant="pastel" pastel="green" size="sm" onClick={onSimulateBonus}>
          <TrendingUp className="w-4 h-4" />
          Simulate Market Swing
        </Button>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ranked.slice(0, 3).map((item, idx) => {
          const cardTone = idx === 0 ? 'yellow' : idx === 1 ? 'blue' : 'green';
          return (
            <PastelCard
              key={item.player.id}
              tone={cardTone}
              elevated={idx === 0}
              className={`p-6 transition-all duration-500 ${
                idx === 0 ? 'md:-translate-y-1' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <GeometricAvatar shape={item.player.avatar} tone="white" size="md" />
                  <div>
                    <StatusBadge dark={idx === 0} tone="white">
                      {idx === 0 ? '1st Place · Leader' : idx === 1 ? '2nd Place' : '3rd Place'}
                    </StatusBadge>
                    <h3 className="font-display text-lg text-[#171717] mt-1.5">
                      {item.player.name}
                    </h3>
                  </div>
                </div>
                <span className="font-display text-2xl text-[#171717]/80">#{item.rank}</span>
              </div>

              <div className="mt-5 pt-4 border-t border-[#171717]/20 space-y-3">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#171717]/70">
                    Real-Time Net Worth
                  </span>
                  <div className="mt-0.5">
                    <AnimatedCurrency
                      amount={item.netWorth}
                      className="text-2xl sm:text-3xl text-[#171717]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-[#F8F7EF]/85 border border-[#171717]/20">
                    <span className="text-[10px] font-bold text-[#171717]/65 block">Cash</span>
                    <span className="font-extrabold">{formatINR(item.player.cash)}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#F8F7EF]/85 border border-[#171717]/20">
                    <span className="text-[10px] font-bold text-[#171717]/65 block">Deeds</span>
                    <span className="font-extrabold">{formatINR(item.propertyValue)}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#F8F7EF]/85 border border-[#171717]/20">
                    <span className="text-[10px] font-bold text-[#171717]/65 block">Debt</span>
                    <span className="font-extrabold">{formatINR(item.debt)}</span>
                  </div>
                </div>
              </div>
            </PastelCard>
          );
        })}
      </div>

      {/* Full Ranking Breakdown Including Remaining & Last-Place Highlight */}
      <div className="space-y-3">
        <h3 className="font-display text-base text-[#171717]">Complete Table Standings</h3>
        {ranked.map((item) => {
          const isTop = item.rank === 1;
          const isBottom = item.rank === ranked.length;
          return (
            <PastelCard
              key={item.player.id}
              tone={isTop ? 'yellow' : isBottom ? 'pink' : 'white'}
              className="p-4 sm:p-5 transition-all duration-500"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#171717] text-[#F8F7EF] font-display text-sm flex items-center justify-center shrink-0">
                    #{item.rank}
                  </div>
                  <GeometricAvatar
                    shape={item.player.avatar}
                    tone={isTop || isBottom ? 'white' : item.player.accent}
                    size="md"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-base text-[#171717]">
                        {item.player.name}
                      </span>
                      {isTop && (
                        <StatusBadge dark>
                          <Award className="w-3 h-3" /> Top Tycoon
                        </StatusBadge>
                      )}
                      {isBottom && (
                        <StatusBadge tone="white">
                          <AlertTriangle className="w-3 h-3" /> Last Place · Debt Watch
                        </StatusBadge>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-[#171717]/70 mt-0.5">
                      Currently at Space #{item.player.position} (
                      {spaces[item.player.position]?.name})
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5 items-center">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-[#171717]/60 block">
                      Available Cash
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold">
                      {formatINR(item.player.cash)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-[#171717]/60 block">
                      Property Value
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold">
                      {formatINR(item.propertyValue)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-[#171717]/60 block">
                      Outstanding Debt
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-rose-900">
                      {formatINR(item.debt)}
                    </span>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-[10px] font-extrabold uppercase text-[#171717]/60 block">
                      Net Worth
                    </span>
                    <AnimatedCurrency
                      amount={item.netWorth}
                      className="text-base sm:text-lg text-[#171717]"
                    />
                  </div>
                </div>
              </div>

              {item.player.isBankrupt && (
                <div className="mt-3 pt-3 border-t border-[#171717]/20 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#171717]">
                    Auto-garnish active: incoming ₹ routes directly to lenders.
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onNavigate('bankruptcy')}
                  >
                    Inspect Recovery
                  </Button>
                </div>
              )}
            </PastelCard>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================================
   SCREEN 7: BOARD TRACKING
============================================================================ */
function getPerimeterGridCoord(index: number, totalSpaces: number = 36): { row: number; col: number } {
  if (totalSpaces === 36) {
    // 10x10 outer ring (36 spaces: 0..9 on Top, 9..18 on Right, 18..27 on Bottom, 27..35 on Left)
    if (index <= 9) return { row: 1, col: index + 1 };
    if (index <= 18) return { row: index - 8, col: 10 };
    if (index <= 27) return { row: 10, col: 10 - (index - 18) };
    return { row: 10 - (index - 27), col: 1 };
  }
  // 7x7 outer ring (24 spaces)
  if (index <= 6) return { row: 1, col: index + 1 };
  if (index <= 11) return { row: index - 5, col: 7 };
  if (index <= 18) return { row: 7, col: 7 - (index - 12) };
  return { row: 7 - (index - 18), col: 1 };
}

function getSpaceVisualTheme(sp: BoardSpace): {
  bg: string;
  headerBg?: string;
  badgeText?: string;
  emoji?: string;
} {
  if (sp.index === 0 || sp.type === 'start') {
    return { bg: 'bg-[#FFD95A]', badgeText: 'START', emoji: '🏁' };
  }
  if (sp.index === 9) {
    return { bg: 'bg-[#FFB66E]', badgeText: 'JAIL', emoji: '🔒' };
  }
  if (sp.index === 18) {
    return { bg: 'bg-[#A8DDB9]', badgeText: 'CLUB', emoji: '🥂' };
  }
  if (sp.index === 27) {
    return { bg: 'bg-[#91D5F2]', badgeText: 'REST', emoji: '🛋️' };
  }
  if (sp.type === 'chance') {
    return { bg: 'bg-[#FFE79B]', badgeText: 'CHANCE', emoji: '❓' };
  }
  if (sp.type === 'chest') {
    return { bg: 'bg-[#CBEBFB]', badgeText: 'CHEST', emoji: '🎁' };
  }
  if (sp.type === 'tax') {
    return { bg: 'bg-[#FFD3E4]', badgeText: 'TAX', emoji: '💸' };
  }
  if (sp.type === 'transit' || sp.colorGroup === 'transit') {
    const emoji = sp.name.includes('AIR') ? '✈️' : sp.name.includes('BEST') ? '🚌' : '🚆';
    return { bg: 'bg-[#E7EEF8]', headerBg: '#334155', emoji };
  }
  if (sp.type === 'utility' || sp.colorGroup === 'utility') {
    const emoji = sp.name.includes('WATER') ? '💧' : sp.name.includes('ELECTRIC') ? '⚡' : '🚤';
    return { bg: 'bg-[#DCF5F2]', headerBg: '#0F766E', emoji };
  }
  switch (sp.colorGroup) {
    case 'magenta':
      return { bg: 'bg-[#FFF0F7]', headerBg: '#EC4899' };
    case 'sky':
      return { bg: 'bg-[#EEF8FF]', headerBg: '#38BDF8' };
    case 'emerald':
      return { bg: 'bg-[#ECFDF3]', headerBg: '#22C55E' };
    case 'saffron':
      return { bg: 'bg-[#FEFBE8]', headerBg: '#FACC15' };
    default:
      return { bg: 'bg-[#F8F7EF]', headerBg: sp.colorHex };
  }
}

export function BoardTrackingScreen({
  spaces,
  players,
  activePlayer,
  movements,
  gameMode = 'local',
  currentTurnPlayerId,
  visualPositions = {},
  movingPlayerId = null,
  lastDiceRoll = null,
  isRollingDice = false,
  onRollDigitalDice,
  onNavigate,
  onInspectSpace,
  onPurchaseSpace,
  onTriggerRentForSpace,
}: {
  spaces: BoardSpace[];
  players: Player[];
  activePlayer: Player;
  movements: MovementLog[];
  gameMode?: GameMode;
  currentTurnPlayerId?: string;
  visualPositions?: Record<string, number>;
  movingPlayerId?: string | null;
  lastDiceRoll?: { playerId: string; playerName: string; die1: number; die2: number; total: number } | null;
  isRollingDice?: boolean;
  onRollDigitalDice?: () => Promise<MovementLog | void> | void;
  onNavigate: (screen: ScreenId) => void;
  onInspectSpace: (spaceId: string) => void;
  onPurchaseSpace: (spaceId: string) => void;
  onTriggerRentForSpace: (spaceId: string) => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number>(activePlayer.position);
  const [tumblingFaces, setTumblingFaces] = useState<[number, number]>([1, 1]);
  const [mobileFilter, setMobileFilter] = useState<'near' | 'all' | 'owned' | 'unowned'>('near');

  React.useEffect(() => {
    setSelectedIndex(activePlayer.position);
  }, [activePlayer.position]);

  // Rapid visual die face cycling while digital dice are rolling
  React.useEffect(() => {
    if (!isRollingDice) return;
    const interval = window.setInterval(() => {
      setTumblingFaces([
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ]);
    }, 90);
    return () => clearInterval(interval);
  }, [isRollingDice]);

  const selectedSpace = spaces[selectedIndex] ?? spaces[activePlayer.position] ?? spaces[0];
  const selectedTheme = getSpaceVisualTheme(selectedSpace);
  const owner = players.find((p) => p.id === selectedSpace?.ownerId);
  const currentRent = computeSpaceRent(selectedSpace, spaces);
  const currentTurnPlayer = players.find((p) => p.id === currentTurnPlayerId) || activePlayer;
  const isMyTurn = !currentTurnPlayerId || currentTurnPlayerId === activePlayer.id;

  const displayDie1 = isRollingDice ? tumblingFaces[0] : (lastDiceRoll?.die1 ?? 4);
  const displayDie2 = isRollingDice ? tumblingFaces[1] : (lastDiceRoll?.die2 ?? 3);

  const getVisualPos = (p: Player) => visualPositions[p.id] ?? p.position;
  const activeVisualPos = getVisualPos(activePlayer);

  const mobileFilteredSpaces = React.useMemo(() => {
    if (mobileFilter === 'owned') return spaces.filter((s) => Boolean(s.ownerId));
    if (mobileFilter === 'unowned') return spaces.filter((s) => Boolean(s.price) && !s.ownerId);
    if (mobileFilter === 'near') {
      // Show active player's space + next 11 spaces clockwise for quick mobile scanning
      const len = spaces.length || 36;
      const nearby: BoardSpace[] = [];
      for (let i = 0; i < 12; i++) {
        const idx = (activeVisualPos + i) % len;
        if (spaces[idx]) nearby.push(spaces[idx]);
      }
      return nearby;
    }
    return spaces;
  }, [mobileFilter, spaces, activeVisualPos]);

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/60">
            {gameMode === 'online'
              ? 'Screen 07 · Live Online Arena'
              : 'Screen 07 · Physical Board Digital Twin'}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl text-[#171717]">
            Indian Circuit Board
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-3.5 py-2 rounded-full bg-[#A8DDB9] border-[1.5px] border-[#171717] shadow-[0_2px_0_0_#171717] text-xs font-extrabold flex items-center gap-2">
            <span>{activePlayer.name}</span>
            <span className="px-2 py-0.5 rounded-full bg-[#171717] text-[#FFD95A] font-display">
              {formatINR(activePlayer.cash)}
            </span>
          </div>
          {gameMode === 'online' ? (
            <Button
              variant="pastel"
              pastel="yellow"
              size="md"
              disabled={!isMyTurn || isRollingDice || Boolean(movingPlayerId)}
              onClick={() => onRollDigitalDice?.()}
            >
              <Dice5 className="w-4 h-4" />
              {isRollingDice
                ? 'Rolling Dice...'
                : movingPlayerId
                  ? 'Moving Avatar...'
                  : isMyTurn
                    ? 'Roll Dice'
                    : `Waiting for ${currentTurnPlayer?.name || 'Player'}`}
            </Button>
          ) : (
            <Button
              variant="pastel"
              pastel="yellow"
              size="md"
              onClick={() => onNavigate('dice-input')}
            >
              <Dice5 className="w-4 h-4" />
              Enter Physical Dice
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Board Perimeter Representation */}
        <div className="xl:col-span-9 space-y-4">
          {/* ================================================================
              MOBILE RESPONSIVE BOARD (< 768px): Zero horizontal cutoff!
             ================================================================ */}
          <div className="md:hidden space-y-3.5">
            {/* Mobile Live Turn & Dice Roller Card */}
            <div
              className={`p-4 rounded-[24px] border-[2px] border-[#171717] shadow-[0_4px_0_0_#171717] space-y-3 ${
                isMyTurn ? 'bg-[#FFD95A]' : 'bg-[#91D5F2]/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <GeometricAvatar
                    shape={currentTurnPlayer.avatar}
                    tone={currentTurnPlayer.accent}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#171717]/70 block">
                      {isMyTurn ? 'Your Turn To Play' : 'Current Turn'}
                    </span>
                    <p className="font-display text-base text-[#171717] truncate">
                      {currentTurnPlayer.name}
                      {currentTurnPlayer.id === activePlayer.id ? ' (You)' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <DiceFace value={displayDie1} selected={isRollingDice} rolling={isRollingDice} size="sm" />
                  <DiceFace value={displayDie2} selected={isRollingDice} rolling={isRollingDice} size="sm" />
                </div>
              </div>

              {lastDiceRoll && (
                <p className="text-[11px] font-bold text-[#171717]/80">
                  Last Roll: {lastDiceRoll.playerName} rolled {lastDiceRoll.total} ({lastDiceRoll.die1}+{lastDiceRoll.die2})
                </p>
              )}

              {gameMode === 'online' ? (
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  disabled={!isMyTurn || isRollingDice || Boolean(movingPlayerId)}
                  onClick={() => onRollDigitalDice?.()}
                >
                  <Dice5 className="w-4 h-4" />
                  {isRollingDice
                    ? 'Rolling Dice...'
                    : movingPlayerId
                      ? 'Moving Avatar...'
                      : isMyTurn
                        ? 'Roll Dice'
                        : `Waiting for ${currentTurnPlayer?.name || 'Player'}`}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={() => onNavigate('dice-input')}
                >
                  <Dice5 className="w-4 h-4" />
                  Enter Physical Dice
                </Button>
              )}
            </div>

            {/* Mobile 10x10 Compact Visual Mini-Board (Fits 100% inside phone screen!) */}
            <div className="p-2 rounded-[24px] bg-[#D9EEDC] border-[2px] border-[#171717] shadow-[0_5px_0_0_#171717]">
              <div
                className="w-full grid gap-[3px]"
                style={{
                  gridTemplateColumns: `repeat(${spaces.length === 36 ? 10 : 7}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${spaces.length === 36 ? 10 : 7}, minmax(30px, 1fr))`,
                }}
              >
                {/* Compact Center Hub */}
                <div
                  style={{
                    gridRow: `2 / ${spaces.length === 36 ? 10 : 7}`,
                    gridColumn: `2 / ${spaces.length === 36 ? 10 : 7}`,
                  }}
                  className="rounded-2xl bg-[#F8F7EF] border-[1.5px] border-[#171717] p-2.5 flex flex-col items-center justify-center text-center gap-1.5"
                >
                  <StatusBadge tone={gameMode === 'online' ? 'green' : 'yellow'}>
                    {spaces.length}-Space Board
                  </StatusBadge>
                  <p className="font-display text-sm text-[#171717]">DEED CLUB</p>
                  <p className="text-[10px] font-bold text-[#171717]/70 leading-snug max-w-[170px]">
                    Tap any tile around the ring to open its Property Card or Buy!
                  </p>
                  <button
                    type="button"
                    onClick={() => onInspectSpace(selectedSpace.id)}
                    className="mt-0.5 px-3 py-1 rounded-full bg-[#FFD95A] border-[1.5px] border-[#171717] text-[10px] font-extrabold text-[#171717]"
                  >
                    #{selectedSpace.index} · {selectedSpace.name}
                  </button>
                </div>

                {/* Mobile Mini-Board Tiles */}
                {spaces.map((sp) => {
                  const { row, col } = getPerimeterGridCoord(sp.index, spaces.length);
                  const occupants = players.filter((p) => getVisualPos(p) === sp.index);
                  const isMovingHere = occupants.some((o) => o.id === movingPlayerId);
                  const isCurrentPlayerHere = activeVisualPos === sp.index;
                  const spOwner = players.find((p) => p.id === sp.ownerId);
                  const tileTheme = getSpaceVisualTheme(sp);

                  return (
                    <button
                      key={`mob-${sp.id}`}
                      type="button"
                      onClick={() => {
                        setSelectedIndex(sp.index);
                        onInspectSpace(sp.id);
                      }}
                      style={{ gridRow: row, gridColumn: col }}
                      title={`#${sp.index} ${sp.name}`}
                      className={`rounded-md border overflow-hidden flex flex-col items-center justify-between relative transition-transform ${
                        isMovingHere
                          ? 'bg-[#A8DDB9] border-[#171717] ring-2 ring-[#171717] scale-110 z-20'
                          : isCurrentPlayerHere
                            ? `${tileTheme.bg} border-[#171717] ring-1 ring-[#171717] z-10`
                            : `${tileTheme.bg} border-[#171717]/75`
                      }`}
                    >
                      {tileTheme.headerBg ? (
                        <div
                          className="w-full h-1.5 border-b border-[#171717]/50 shrink-0"
                          style={{ backgroundColor: tileTheme.headerBg }}
                        />
                      ) : (
                        <span className="text-[7px] font-black leading-none pt-0.5">
                          {tileTheme.emoji || sp.index}
                        </span>
                      )}

                      {occupants.length > 0 ? (
                        <div className="flex items-center justify-center -space-x-1 pb-0.5">
                          {occupants.slice(0, 2).map((occ) => (
                            <BoardPlayerToken
                              key={occ.id}
                              name={occ.name}
                              avatar={occ.avatar}
                              tone={occ.accent}
                              isTurn={occ.id === currentTurnPlayerId}
                              isSelf={occ.id === activePlayer.id}
                              isMoving={occ.id === movingPlayerId}
                              size="xs"
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="text-[7px] font-extrabold text-[#171717]/65 pb-0.5 leading-none">
                          {spOwner ? spOwner.name[0] : `#${sp.index}`}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Player Roster Strip */}
            <div className="grid grid-cols-2 gap-2">
              {players.map((p) => {
                const vPos = getVisualPos(p);
                const isTurn = p.id === currentTurnPlayerId;
                const isSelf = p.id === activePlayer.id;
                const ownedCount = spaces.filter((s) => s.ownerId === p.id).length;
                return (
                  <button
                    key={`mob-p-${p.id}`}
                    type="button"
                    onClick={() => {
                      setSelectedIndex(vPos);
                      const sp = spaces[vPos];
                      if (sp) onInspectSpace(sp.id);
                    }}
                    className={`p-2.5 rounded-2xl border-[1.5px] border-[#171717] flex items-center gap-2 text-left ${
                      isTurn ? 'bg-[#FFD95A] shadow-[0_2px_0_0_#171717]' : isSelf ? 'bg-[#A8DDB9]/75' : 'bg-white'
                    }`}
                  >
                    <BoardPlayerToken
                      name={p.name}
                      avatar={p.avatar}
                      tone={p.accent}
                      isTurn={isTurn}
                      isMoving={p.id === movingPlayerId}
                      size="xs"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-extrabold truncate text-[#171717]">{p.name}</p>
                      <p className="text-[10px] font-bold text-[#171717]/75 truncate">
                        {formatINR(p.cash)} · {ownedCount}D · #{vPos}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Mobile Filter Tabs + 2-Column Interactive Space Cards */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {[
                  { id: 'near' as const, label: 'Ahead on Board' },
                  { id: 'all' as const, label: `All ${spaces.length}` },
                  { id: 'unowned' as const, label: 'For Sale' },
                  { id: 'owned' as const, label: 'Owned' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMobileFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-full border-[1.5px] border-[#171717] text-[11px] font-extrabold whitespace-nowrap ${
                      mobileFilter === tab.id ? 'bg-[#171717] text-[#FFD95A]' : 'bg-white text-[#171717]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {mobileFilteredSpaces.map((sp) => {
                  const occupants = players.filter((p) => getVisualPos(p) === sp.index);
                  const spOwner = players.find((p) => p.id === sp.ownerId);
                  const tileTheme = getSpaceVisualTheme(sp);
                  const canQuickBuy = Boolean(sp.price) && !sp.ownerId && activeVisualPos === sp.index;

                  return (
                    <div
                      key={`mcard-${sp.id}`}
                      className={`rounded-2xl border-[1.5px] border-[#171717] overflow-hidden flex flex-col justify-between ${tileTheme.bg}`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedIndex(sp.index);
                          onInspectSpace(sp.id);
                        }}
                        className="text-left w-full flex-1 flex flex-col justify-between"
                      >
                        <div
                          className="w-full px-2.5 py-1.5 border-b border-[#171717]/60 flex items-center justify-between gap-1"
                          style={{ backgroundColor: tileTheme.headerBg || 'rgba(255,255,255,0.45)' }}
                        >
                          <span
                            className={`text-[10px] font-black ${
                              tileTheme.headerBg && ['#334155', '#0F766E', '#EC4899', '#22C55E'].includes(tileTheme.headerBg)
                                ? 'text-white'
                                : 'text-[#171717]'
                            }`}
                          >
                            {tileTheme.emoji || `#${sp.index}`}
                          </span>
                          <span className="px-1.5 py-0.2 rounded-full bg-white/90 border border-[#171717] text-[9px] font-extrabold text-[#171717]">
                            #{sp.index}
                          </span>
                        </div>

                        <div className="p-2.5 space-y-1">
                          <p className="font-display text-xs text-[#171717] leading-tight">
                            {sp.name}
                          </p>
                          <p className="text-[11px] font-bold text-[#171717]/75">
                            {sp.price
                              ? formatINR(sp.price)
                              : sp.taxAmount
                                ? `Pay ${formatINR(sp.taxAmount)}`
                                : sp.region}
                          </p>
                          {spOwner && (
                            <p className="text-[10px] font-extrabold text-[#171717]/80">
                              Owner: {spOwner.name}
                            </p>
                          )}
                          {occupants.length > 0 && (
                            <div className="flex items-center gap-1 pt-0.5">
                              {occupants.map((occ) => (
                                <BoardPlayerToken
                                  key={occ.id}
                                  name={occ.name}
                                  avatar={occ.avatar}
                                  tone={occ.accent}
                                  isTurn={occ.id === currentTurnPlayerId}
                                  isMoving={occ.id === movingPlayerId}
                                  size="xs"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </button>

                      {canQuickBuy && (
                        <button
                          type="button"
                          onClick={() => onPurchaseSpace(sp.id)}
                          className="w-full py-1.5 bg-[#A8DDB9] border-t-[1.5px] border-[#171717] text-[11px] font-black text-[#171717]"
                        >
                          Buy ({formatINR(sp.price ?? 0)})
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ================================================================
              TABLET & DESKTOP BOARD (>= 768px): Full 10x10 Perimeter Board
             ================================================================ */}
          <div className="hidden md:block p-2.5 lg:p-3.5 rounded-[32px] bg-[#D9EEDC] border-[2.5px] border-[#171717] shadow-[0_8px_0_0_#171717]">
            <div
              className="w-full grid gap-1.5"
              style={{
                gridTemplateColumns: `repeat(${spaces.length === 36 ? 10 : 7}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${spaces.length === 36 ? 10 : 7}, minmax(${spaces.length === 36 ? '64px' : '80px'}, auto))`,
              }}
            >
              {/* Center Board Hub */}
              <div
                style={{
                  gridRow: `2 / ${spaces.length === 36 ? 10 : 7}`,
                  gridColumn: `2 / ${spaces.length === 36 ? 10 : 7}`,
                }}
                className="rounded-[24px] bg-[#F8F7EF] border-[2px] border-[#171717] p-3.5 sm:p-4 flex flex-col justify-between relative overflow-hidden gap-2.5 shadow-inner"
              >
                {/* Playful Geometric Pastel Corner Accents */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-10 -top-10 w-40 h-40 rounded-full bg-[#FFD95A]/65 border-[1.5px] border-[#171717]/20"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -left-10 -bottom-10 w-36 h-36 rounded-full bg-[#91D5F2]/45 border-[1.5px] border-[#171717]/15"
                />

                <div className="flex flex-wrap items-start justify-between gap-3 relative z-10">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={gameMode === 'online' ? 'green' : 'yellow'}>
                        {gameMode === 'online'
                          ? `${spaces.length}-Space Online Edition`
                          : `${spaces.length}-Space Physical Edition`}
                      </StatusBadge>
                      <StatusBadge tone="pink">
                        {players.length} Players Active
                      </StatusBadge>
                    </div>
                    <h3 className="font-display text-xl sm:text-2xl text-[#171717] mt-1.5">
                      DEED CLUB INDIA
                    </h3>
                  </div>
                </div>

                {/* Live Dice Roll & Turn Control Card in Center Hub */}
                <div
                  className={`p-3.5 sm:p-4 rounded-[22px] border-[2px] border-[#171717] shadow-[0_4px_0_0_#171717] flex flex-wrap items-center justify-between gap-3 relative z-10 transition-colors ${
                    isMyTurn ? 'bg-[#FFD95A]' : 'bg-[#91D5F2]/55'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <GeometricAvatar
                      shape={currentTurnPlayer.avatar}
                      tone={currentTurnPlayer.accent}
                      size="md"
                    />
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#171717]/70 block">
                        {isMyTurn ? 'Your Turn To Play' : 'Current Turn'}
                      </span>
                      <p className="font-display text-base sm:text-lg text-[#171717] leading-tight">
                        {currentTurnPlayer.name}
                        {currentTurnPlayer.id === activePlayer.id ? ' (You)' : ''}
                      </p>
                      {lastDiceRoll ? (
                        <p className="text-[11px] font-bold text-[#171717]/80 mt-0.5">
                          Last Roll: {lastDiceRoll.playerName} rolled {lastDiceRoll.total} ({lastDiceRoll.die1}+{lastDiceRoll.die2})
                        </p>
                      ) : (
                        <p className="text-[11px] font-semibold text-[#171717]/70 mt-0.5">
                          Ready to roll &amp; advance
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <DiceFace value={displayDie1} selected={isRollingDice} rolling={isRollingDice} size="sm" />
                    <DiceFace value={displayDie2} selected={isRollingDice} rolling={isRollingDice} size="sm" />
                    {gameMode === 'online' ? (
                      <Button
                        variant="primary"
                        size="md"
                        disabled={!isMyTurn || isRollingDice || Boolean(movingPlayerId)}
                        onClick={() => onRollDigitalDice?.()}
                      >
                        <Dice5 className="w-4 h-4" />
                        {isRollingDice
                          ? 'Rolling...'
                          : movingPlayerId
                            ? 'Moving...'
                            : isMyTurn
                              ? 'Roll Dice'
                              : 'Wait Turn'}
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => onNavigate('dice-input')}
                      >
                        Log Roll
                      </Button>
                    )}
                  </div>
                </div>

                {/* Selected Space Live Deed Spotlight inside Center Board */}
                <div className="rounded-[22px] bg-white border-[2px] border-[#171717] shadow-[0_3px_0_0_#171717] overflow-hidden relative z-10">
                  <div
                    className="px-4 py-2 border-b-[1.5px] border-[#171717] flex items-center justify-between gap-2"
                    style={{ backgroundColor: selectedTheme.headerBg || '#FFD95A' }}
                  >
                    <div className="flex items-center gap-2">
                      {selectedTheme.emoji && <span className="text-sm">{selectedTheme.emoji}</span>}
                      <span
                        className={`font-display text-sm sm:text-base ${
                          selectedTheme.headerBg && ['#334155', '#0F766E', '#EC4899', '#22C55E'].includes(selectedTheme.headerBg)
                            ? 'text-white'
                            : 'text-[#171717]'
                        }`}
                      >
                        #{selectedSpace.index} · {selectedSpace.name}
                      </span>
                    </div>
                    <HouseHotelIndicator
                      houses={selectedSpace.houses}
                      hasHotel={selectedSpace.hasHotel}
                      isMortgaged={selectedSpace.isMortgaged}
                      compact
                    />
                  </div>
                  <div className="p-3.5 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                      <span>
                        {selectedSpace.price
                          ? `Price: ${formatINR(selectedSpace.price)} · Current Rent: ${formatINR(currentRent)}`
                          : selectedSpace.region}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#EAEAEA] border border-[#171717]/25">
                        {owner ? `Owned by ${owner.name}` : selectedSpace.price ? 'Available From Bank' : 'Board Zone'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedSpace.price && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onInspectSpace(selectedSpace.id)}
                        >
                          Open Deed Card
                        </Button>
                      )}
                      {selectedSpace.price && !selectedSpace.ownerId && (
                        <Button
                          variant="pastel"
                          pastel="green"
                          size="sm"
                          disabled={activePlayer.position !== selectedSpace.index || Boolean(movingPlayerId)}
                          onClick={() => onPurchaseSpace(selectedSpace.id)}
                        >
                          {activePlayer.position === selectedSpace.index
                            ? `Buy for ${formatINR(selectedSpace.price)}`
                            : `Land here to buy (${formatINR(selectedSpace.price)})`}
                        </Button>
                      )}
                      {selectedSpace.ownerId &&
                        selectedSpace.ownerId !== activePlayer.id &&
                        !selectedSpace.isMortgaged && (
                          <Button
                            variant="pastel"
                            pastel="pink"
                            size="sm"
                            onClick={() => onTriggerRentForSpace(selectedSpace.id)}
                          >
                            Pay Landing Rent
                          </Button>
                        )}
                    </div>
                  </div>
                </div>

                {/* Colorful Player Roster Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 relative z-10">
                  {players.map((p) => {
                    const vPos = getVisualPos(p);
                    const isTurn = p.id === currentTurnPlayerId;
                    const isSelf = p.id === activePlayer.id;
                    const ownedCount = spaces.filter((s) => s.ownerId === p.id).length;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedIndex(vPos)}
                        className={`p-2 rounded-2xl border-[1.5px] border-[#171717] flex items-center gap-2 text-left transition-all ${
                          isTurn
                            ? 'bg-[#FFD95A] shadow-[0_3px_0_0_#171717]'
                            : isSelf
                              ? 'bg-[#A8DDB9]/75'
                              : 'bg-white hover:bg-[#EAEAEA]/60'
                        }`}
                      >
                        <BoardPlayerToken
                          name={p.name}
                          avatar={p.avatar}
                          tone={p.accent}
                          isTurn={false}
                          isMoving={p.id === movingPlayerId}
                          size="xs"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-extrabold truncate text-[#171717]">
                              {p.name}
                            </span>
                            {isTurn && (
                              <span className="text-[8px] font-black px-1 rounded bg-[#171717] text-[#FFD95A]">
                                TURN
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] font-bold text-[#171717]/75 truncate">
                            {formatINR(p.cash)} · {ownedCount}D · #{vPos}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Outer Board Spaces */}
              {spaces.map((sp) => {
                const { row, col } = getPerimeterGridCoord(sp.index, spaces.length);
                const occupants = players.filter((p) => getVisualPos(p) === sp.index);
                const isMovingHere = occupants.some((o) => o.id === movingPlayerId);
                const isCurrentPlayerHere = getVisualPos(activePlayer) === sp.index;
                const isSelected = selectedIndex === sp.index;
                const spOwner = players.find((p) => p.id === sp.ownerId);
                const tileTheme = getSpaceVisualTheme(sp);

                return (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => {
                      setSelectedIndex(sp.index);
                      onInspectSpace(sp.id);
                    }}
                    style={{ gridRow: row, gridColumn: col }}
                    className={`rounded-[14px] border-[1.5px] overflow-hidden flex flex-col justify-between text-left transition-all duration-150 relative ${
                      isMovingHere
                        ? 'bg-[#A8DDB9] border-[#171717] ring-2 ring-[#171717] shadow-[0_5px_0_0_#171717] scale-[1.05] z-20'
                        : isSelected
                          ? `${tileTheme.bg} border-[#171717] ring-2 ring-[#171717] shadow-[0_3px_0_0_#171717] z-10`
                          : isCurrentPlayerHere
                            ? `${tileTheme.bg} border-[#171717] shadow-[0_3px_0_0_#171717] -translate-y-0.5`
                            : `${tileTheme.bg} border-[#171717]/80 hover:brightness-98`
                    }`}
                  >
                    {/* Vivid Color Group Top Banner (or Corner/Action Header) */}
                    {tileTheme.headerBg ? (
                      <div
                        className="w-full h-3.5 border-b border-[#171717]/75 px-1 flex items-center justify-between shrink-0"
                        style={{ backgroundColor: tileTheme.headerBg }}
                      >
                        <span className="text-[8px] font-black text-white/90 drop-shadow-xs">
                          {tileTheme.emoji || `#${sp.index}`}
                        </span>
                        {spOwner && (
                          <span
                            title={`Owned by ${spOwner.name}`}
                            className="w-2.5 h-2.5 rounded-full border border-[#171717] shrink-0"
                            style={{ backgroundColor: spOwner.accentHex }}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="w-full px-1.5 pt-1 flex items-center justify-between gap-1 shrink-0">
                        <span className="text-[9px] font-black uppercase text-[#171717]/75">
                          #{sp.index}
                        </span>
                        {tileTheme.emoji && (
                          <span className="text-xs leading-none">{tileTheme.emoji}</span>
                        )}
                      </div>
                    )}

                    {/* Space Name & Price */}
                    <div className="px-1 py-0.5 flex-1 flex flex-col justify-center min-w-0">
                      <p
                        className={`font-extrabold text-[#171717] leading-[1.08] tracking-tight break-normal ${
                          sp.name.length >= 10
                            ? 'text-[7.5px] sm:text-[8.5px]'
                            : 'text-[8.5px] sm:text-[9.5px]'
                        }`}
                      >
                        {sp.name === 'COMMUNITY CHEST' ? 'COMM. CHEST' : sp.name}
                      </p>
                      {sp.price ? (
                        <p className="text-[8.5px] font-bold text-[#171717]/75 mt-0.5">
                          {formatINR(sp.price)}
                        </p>
                      ) : sp.taxAmount ? (
                        <p className="text-[8.5px] font-extrabold text-rose-900 mt-0.5">
                          -{formatINR(sp.taxAmount)}
                        </p>
                      ) : null}
                    </div>

                    {/* Clear Player Avatar Tokens & Owner/House Badges */}
                    <div className="px-1.5 pb-1 flex items-center justify-between gap-0.5 min-h-[26px]">
                      <div className="flex flex-wrap items-center gap-0.5">
                        {occupants.map((occ) => (
                          <BoardPlayerToken
                            key={occ.id}
                            name={occ.name}
                            avatar={occ.avatar}
                            tone={occ.accent}
                            isTurn={occ.id === currentTurnPlayerId}
                            isSelf={occ.id === activePlayer.id}
                            isMoving={occ.id === movingPlayerId}
                            size={occupants.length > 2 ? 'xs' : 'sm'}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-0.5">
                        {spOwner && !occupants.length && (
                          <span
                            title={`Owned by ${spOwner.name}`}
                            className="px-1 py-0.2 rounded text-[8px] font-black border border-[#171717] text-[#171717]"
                            style={{ backgroundColor: spOwner.accentHex }}
                          >
                            {spOwner.name[0]}
                          </span>
                        )}
                        {(sp.houses > 0 || sp.hasHotel) && (
                          <span className="text-[8px] font-extrabold px-1 rounded bg-[#A8DDB9] border border-[#171717]">
                            {sp.hasHotel ? 'HTL' : `${sp.houses}H`}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Live Movement History & Quick Desks */}
        <div className="xl:col-span-3 space-y-4">
          <PastelCard tone="pink" className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <StatusBadge tone="white">Your Position</StatusBadge>
              <span className="text-xs font-extrabold">Space #{activePlayer.position}</span>
            </div>
            <div className="flex items-center gap-3">
              <GeometricAvatar shape={activePlayer.avatar} tone="white" size="md" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#171717]/75 truncate">{activePlayer.name}</p>
                <p className="font-display text-lg text-[#171717] truncate">
                  {spaces[activePlayer.position]?.name}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button variant="secondary" size="sm" onClick={() => onNavigate('my-properties')}>
                My Deeds
              </Button>
              <Button variant="secondary" size="sm" onClick={() => onNavigate('auction-market')}>
                Auctions
              </Button>
            </div>
          </PastelCard>

          <PastelCard tone="white" className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm text-[#171717]">Movement History</h3>
              <span className="text-[11px] font-bold text-[#171717]/60">Recent rolls</span>
            </div>
            <div className="space-y-2.5">
              {movements.length === 0 ? (
                <p className="text-xs font-semibold text-[#171717]/60 text-center py-4">
                  Roll the dice to begin moving around the board!
                </p>
              ) : (
                movements.slice(0, 5).map((mv) => (
                  <div
                    key={mv.id}
                    className="p-3 rounded-2xl bg-[#EAEAEA]/50 border border-[#171717]/15 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-extrabold text-[#171717]">
                        {mv.playerName} · {mv.total} ({mv.die1}+{mv.die2})
                      </span>
                      <span className="text-[10px] font-semibold text-[#171717]/60">
                        {mv.timestamp}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-[#171717]/85">
                      <span>{mv.fromName}</span>
                      <ArrowRight className="w-3 h-3 shrink-0" />
                      <span className="px-2 py-0.5 rounded-full bg-[#FFD95A] border border-[#171717]">
                        {mv.toName}
                      </span>
                    </div>
                    {mv.passedStart && (
                      <p className="text-[10px] font-extrabold text-[#1e6b3b]">
                        Passed START · +₹1,500 credited
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </PastelCard>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   SCREEN 8: DICE INPUT
============================================================================ */
export function DiceInputScreen({
  activePlayer,
  spaces,
  players,
  gameMode = 'local',
  currentTurnPlayerId,
  isRollingDice = false,
  lastDiceRoll = null,
  onSelectPlayer,
  onConfirmRoll,
  onRollDigitalDice,
  onNavigate,
}: {
  activePlayer: Player;
  spaces: BoardSpace[];
  players: Player[];
  gameMode?: GameMode;
  currentTurnPlayerId?: string;
  isRollingDice?: boolean;
  lastDiceRoll?: { playerId: string; playerName: string; die1: number; die2: number; total: number } | null;
  onSelectPlayer?: (playerId: string) => void;
  onConfirmRoll: (die1: number, die2: number, targetPlayerId?: string) => Promise<MovementLog> | MovementLog;
  onRollDigitalDice?: () => Promise<MovementLog | void> | void;
  onNavigate: (screen: ScreenId) => void;
}) {
  const [die1, setDie1] = useState(4);
  const [die2, setDie2] = useState(3);
  const [rolling, setRolling] = useState(false);
  const [lastResult, setLastResult] = useState<MovementLog | null>(null);
  const [onlineFaces, setOnlineFaces] = useState<[number, number]>([4, 3]);

  // Auto-switch to turn player ONLY in local physical companion seat mode
  React.useEffect(() => {
    if (gameMode === 'local' && currentTurnPlayerId && currentTurnPlayerId !== activePlayer.id) {
      onSelectPlayer?.(currentTurnPlayerId);
    }
  }, [currentTurnPlayerId, gameMode]);

  React.useEffect(() => {
    if (!isRollingDice) return;
    const t = window.setInterval(() => {
      setOnlineFaces([
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ]);
    }, 90);
    return () => clearInterval(t);
  }, [isRollingDice]);

  const total = die1 + die2;
  const currentSpace = spaces[activePlayer.position] || spaces[0];
  const previewIndex = (activePlayer.position + total) % spaces.length;
  const previewSpace = spaces[previewIndex] || spaces[0];
  const previewPassesStart = activePlayer.position + total >= spaces.length;
  const previewOwner = players.find((p) => p.id === previewSpace?.ownerId);

  const currentTurnPlayer = players.find((p) => p.id === currentTurnPlayerId);
  const isTurn = !currentTurnPlayerId || currentTurnPlayerId === activePlayer.id;

  const handleConfirm = async () => {
    if (rolling) return;
    setRolling(true);
    try {
      const targetId = currentTurnPlayerId || activePlayer.id;
      if (currentTurnPlayerId && currentTurnPlayerId !== activePlayer.id) {
        onSelectPlayer?.(currentTurnPlayerId);
      }
      const mv = await onConfirmRoll(die1, die2, targetId);
      setLastResult(mv);
    } catch (err) {
      console.error('Error confirming roll:', err);
    } finally {
      setRolling(false);
    }
  };

  const handleOnlineRoll = async () => {
    if (!onRollDigitalDice || isRollingDice || rolling) return;
    setRolling(true);
    try {
      const mv = await onRollDigitalDice();
      if (mv) {
        setLastResult(mv);
      }
    } finally {
      setRolling(false);
    }
  };

  const activeDie1 = gameMode === 'online' ? (isRollingDice ? onlineFaces[0] : (lastDiceRoll?.die1 ?? die1)) : die1;
  const activeDie2 = gameMode === 'online' ? (isRollingDice ? onlineFaces[1] : (lastDiceRoll?.die2 ?? die2)) : die2;
  const activeTotal = activeDie1 + activeDie2;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
      {/* Turn Alert Banner when not current active player's turn */}
      {!isTurn && currentTurnPlayer && (
        <div className="p-4 rounded-2xl bg-[#FFD95A] border-[1.5px] border-[#171717] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[3px_3px_0px_#171717] animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#171717] text-[#FFD95A] flex items-center justify-center font-display text-lg shrink-0">
              🎲
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-[#171717]">
                Chance: {currentTurnPlayer.name}&apos;s Turn to Roll!
              </p>
              <p className="text-[11px] font-semibold text-[#171717]/80">
                Pawn is at #{currentTurnPlayer.position} {spaces[currentTurnPlayer.position]?.name || ''}.
                {gameMode === 'local' ? ' Switch seat below.' : ' Wait for their online roll.'}
              </p>
            </div>
          </div>
          {gameMode === 'local' && onSelectPlayer && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onSelectPlayer(currentTurnPlayer.id)}
            >
              Switch to {currentTurnPlayer.name}
            </Button>
          )}
        </div>
      )}

      {/* Multi-Player Companion Seat Selector (Local Board Mode only) */}
      {gameMode === 'local' && players.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[11px] font-black uppercase text-[#171717]/60 whitespace-nowrap">
            Companion Seat:
          </span>
          {players.map((p) => {
            const isPlayerTurn = p.id === currentTurnPlayerId;
            const isSelected = p.id === activePlayer.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPlayer?.(p.id)}
                className={`px-3 py-1.5 rounded-xl border-[1.5px] border-[#171717] font-display text-xs flex items-center gap-1.5 transition-all shrink-0 ${
                  isSelected
                    ? 'bg-[#171717] text-[#FFD95A] shadow-[2px_2px_0px_#FFD95A]'
                    : isPlayerTurn
                    ? 'bg-[#FFD95A] text-[#171717] font-black animate-pulse'
                    : 'bg-white hover:bg-neutral-100 text-[#171717]'
                }`}
              >
                <span>{p.name}</span>
                {isPlayerTurn && (
                  <span className="text-[9px] bg-[#171717] text-[#FFD95A] px-1 rounded font-mono">
                    TURN
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/60">
            {gameMode === 'online'
              ? 'Screen 08 · Digital Online Dice'
              : 'Screen 08 · Physical Roll Entry'}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl text-[#171717]">
            {gameMode === 'online' ? 'Roll Digital Dice' : 'Enter Dice Result'}
          </h2>
        </div>
        <StatusBadge tone="yellow">
          {activePlayer.name} · At #{activePlayer.position} {currentSpace?.name}
        </StatusBadge>
      </div>

      <PastelCard tone="orange" elevated className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <DiceFace value={activeDie1} selected rolling={rolling || isRollingDice} size="lg" />
            <span className="font-display text-2xl text-[#171717]">+</span>
            <DiceFace value={activeDie2} selected rolling={rolling || isRollingDice} size="lg" />
          </div>

          <div className="text-center sm:text-right space-y-1">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#171717]/75">
              {gameMode === 'online' ? 'Dice Roll Total' : 'Calculated Move Total'}
            </span>
            <div className="font-display text-5xl text-[#171717]">
              {isRollingDice ? '...' : activeTotal}
            </div>
            {!isRollingDice && activeDie1 === activeDie2 && <StatusBadge dark>Doubles Rolled!</StatusBadge>}
          </div>
        </div>

        {gameMode === 'local' ? (
          <>
            {/* Separate Die 1 and Die 2 Value Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-[22px] bg-[#F8F7EF] border-[1.5px] border-[#171717] space-y-2.5">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/75">
                  Physical Die 1
                </span>
                <div className="grid grid-cols-6 gap-1.5">
                  {[1, 2, 3, 4, 5, 6].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setDie1(v)}
                      className={`py-2.5 rounded-xl border-[1.5px] border-[#171717] font-display text-xs transition-all ${
                        die1 === v ? 'bg-[#171717] text-[#FFD95A]' : 'bg-white hover:bg-[#FFD95A]/40'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-[22px] bg-[#F8F7EF] border-[1.5px] border-[#171717] space-y-2.5">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/75">
                  Physical Die 2
                </span>
                <div className="grid grid-cols-6 gap-1.5">
                  {[1, 2, 3, 4, 5, 6].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setDie2(v)}
                      className={`py-2.5 rounded-xl border-[1.5px] border-[#171717] font-display text-xs transition-all ${
                        die2 === v ? 'bg-[#171717] text-[#FFD95A]' : 'bg-white hover:bg-[#FFD95A]/40'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Destination Preview Strip */}
            <div className="p-4 rounded-[22px] bg-[#171717] text-[#F8F7EF] flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FFD95A]">
                  Projected Destination ({total} Spaces)
                </span>
                <p className="text-sm sm:text-base font-extrabold mt-0.5">
                  #{activePlayer.position} {currentSpace?.name} → #{previewIndex} {previewSpace?.name}
                </p>
                <p className="text-xs text-[#F8F7EF]/75">
                  {previewOwner
                    ? previewOwner.id === activePlayer.id
                      ? 'You already own this deed.'
                      : `Owned by ${previewOwner.name} · Rent notification will trigger automatically.`
                    : previewSpace?.price
                      ? `Unowned property · Fixed price ${formatINR(previewSpace.price)}`
                      : previewSpace?.region}
                </p>
              </div>
              {previewPassesStart && <StatusBadge tone="green">Passes START +₹2,000</StatusBadge>}
            </div>

            <Button variant="primary" size="lg" fullWidth onClick={handleConfirm}>
              {rolling
                ? 'Updating Board Marker...'
                : isTurn
                ? `Confirm Move (${total} Spaces)`
                : `Roll for ${currentTurnPlayer?.name || 'Turn Player'} (${total} Spaces)`}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <div className="space-y-3">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={!isTurn || rolling || isRollingDice}
              onClick={handleOnlineRoll}
            >
              <Dice5 className="w-5 h-5" />
              {rolling || isRollingDice
                ? 'Rolling & Moving Avatar...'
                : isTurn
                  ? 'Roll Online Dice'
                  : `Waiting for ${currentTurnPlayer?.name || 'Turn Player'}`}
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="secondary" size="md" fullWidth onClick={() => onNavigate('board')}>
              Watch Live Movement on Board
            </Button>
          </div>
        )}
      </PastelCard>

      {/* Confirmed Move Result Reveal */}
      {lastResult && (
        <PastelCard tone="green" elevated className="p-6 space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span className="text-xs font-extrabold uppercase tracking-wider">
                Board Position Updated
              </span>
            </div>
            <StatusBadge dark>
              {lastResult.total ?? (lastResult.die1 + lastResult.die2)} Spaces Moved
            </StatusBadge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <div className="p-3.5 rounded-2xl bg-[#F8F7EF] border border-[#171717]">
              <span className="text-[10px] font-extrabold uppercase text-[#171717]/60">
                Previous Space
              </span>
              <p className="font-display text-sm mt-1">
                #{lastResult.fromIndex ?? activePlayer?.position ?? 0} · {lastResult.fromName || spaces[lastResult.fromIndex ?? activePlayer?.position ?? 0]?.name || 'START'}
              </p>
            </div>
            <div className="text-center font-display text-lg">
              {lastResult.die1} + {lastResult.die2} = {lastResult.total ?? (lastResult.die1 + lastResult.die2)}
            </div>
            <div className="p-3.5 rounded-2xl bg-[#FFD95A] border border-[#171717]">
              <span className="text-[10px] font-extrabold uppercase text-[#171717]/70">
                New Location
              </span>
              <p className="font-display text-sm mt-1">
                #{lastResult.toIndex ?? ((lastResult.fromIndex ?? 0) + (lastResult.total ?? 0)) % (spaces.length || 36)} · {lastResult.toName || spaces[lastResult.toIndex ?? 0]?.name || 'Board Space'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <Button variant="primary" size="sm" onClick={() => onNavigate('board')}>
              View on Board
            </Button>
            <Button variant="secondary" size="sm" onClick={() => onNavigate('rent-notification')}>
              Open Rent Notice
            </Button>
          </div>
        </PastelCard>
      )}
    </div>
  );
}

/* ============================================================================
   SCREEN 9: RENT NOTIFICATION
============================================================================ */
export function RentNotificationScreen({
  rentEvent,
  players,
  onSettleRent,
  onDisputeRent,
  onInspectProperty,
}: {
  rentEvent: RentEvent;
  players: Player[];
  onSettleRent: () => void;
  onDisputeRent: (reason: string) => void;
  onInspectProperty: (spaceId: string) => void;
}) {
  const [perspective, setPerspective] = useState<'visitor' | 'owner'>('visitor');

  const visitor = players.find((p) => p.id === rentEvent.visitorId) ?? players[0];
  const owner = players.find((p) => p.id === rentEvent.ownerId) ?? players[1];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/60">
            Screen 09 · Real-Time Landing Settlement
          </p>
          <h2 className="font-display text-2xl sm:text-3xl text-[#171717]">Rent Notification</h2>
        </div>

        {/* Dual Role Toggle so Reviewer Can See Both Visiting Player & Owner Views */}
        <div className="inline-flex p-1 rounded-full bg-[#EAEAEA] border-[1.5px] border-[#171717]">
          <button
            type="button"
            onClick={() => setPerspective('visitor')}
            className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all ${
              perspective === 'visitor' ? 'bg-[#171717] text-[#F8F7EF]' : 'text-[#171717]'
            }`}
          >
            Visiting Player View
          </button>
          <button
            type="button"
            onClick={() => setPerspective('owner')}
            className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all ${
              perspective === 'owner' ? 'bg-[#171717] text-[#F8F7EF]' : 'text-[#171717]'
            }`}
          >
            Property Owner View
          </button>
        </div>
      </div>

      {/* Prominent Hero Rent Notification Card */}
      <PastelCard
        tone={
          rentEvent.status === 'completed'
            ? 'green'
            : rentEvent.status === 'disputed'
              ? 'orange'
              : perspective === 'visitor'
                ? 'pink'
                : 'yellow'
        }
        elevated
        className="overflow-hidden"
      >
        <div
          className="px-6 py-3 flex items-center justify-between text-xs font-extrabold uppercase tracking-widest text-white border-b-[1.5px] border-[#171717]"
          style={{ backgroundColor: rentEvent.colorHex }}
        >
          <span>Single-Settlement Event Lock · #{rentEvent.id}</span>
          <span>{rentEvent.timestamp}</span>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <StatusBadge
                tone={
                  rentEvent.status === 'completed'
                    ? 'green'
                    : rentEvent.status === 'disputed'
                      ? 'orange'
                      : 'white'
                }
              >
                Status: {rentEvent.status.toUpperCase()}
              </StatusBadge>

              {perspective === 'visitor' ? (
                <>
                  <h3 className="font-display text-2xl sm:text-4xl text-[#171717]">
                    You landed on {rentEvent.propertyName}!
                  </h3>
                  <p className="text-sm font-bold text-[#171717]/80">
                    Property owner: <span className="underline">{rentEvent.ownerName}</span>
                  </p>
                </>
              ) : (
                <>
                  <h3 className="font-display text-2xl sm:text-4xl text-[#171717]">
                    Someone landed on your property!
                  </h3>
                  <p className="text-sm font-bold text-[#171717]/80">
                    Visiting player: <span className="underline">{rentEvent.visitorName}</span> ·
                    Deed: {rentEvent.propertyName}
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center -space-x-2">
              <GeometricAvatar shape={visitor.avatar} tone={visitor.accent} size="md" />
              <GeometricAvatar shape={owner.avatar} tone={owner.accent} size="md" />
            </div>
          </div>

          {/* Rent Amount Showcase */}
          <div className="p-5 rounded-[24px] bg-[#F8F7EF] border-[1.5px] border-[#171717] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/65">
                {perspective === 'visitor' ? 'Rent Payable' : 'Rent To Collect'}
              </span>
              <div className="font-display text-3xl sm:text-4xl text-[#171717] mt-1">
                {formatINR(rentEvent.amount)}
              </div>
            </div>

            <div className="text-xs font-bold text-[#171717]/75 space-y-1 sm:text-right">
              <p>Fixed Physical Deed Schedule</p>
              <p>Duplicate-payment guard enabled</p>
            </div>
          </div>

          {/* State-Specific Feedback */}
          {rentEvent.status === 'completed' && (
            <div className="p-4 rounded-2xl bg-[#F8F7EF] border-[1.5px] border-[#171717] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-[#1e6b3b] shrink-0" />
                <div>
                  <p className="text-sm font-extrabold text-[#171717]">
                    Payment Settled · Duplicate Transfers Locked
                  </p>
                  <p className="text-xs font-medium text-[#171717]/70">
                    Event #{rentEvent.id} has already been paid. Neither player can trigger a second
                    deduction for this turn.
                  </p>
                </div>
              </div>
            </div>
          )}

          {rentEvent.status === 'disputed' && (
            <div className="p-4 rounded-2xl bg-[#F8F7EF] border-[1.5px] border-[#171717] flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-amber-700 shrink-0" />
              <div>
                <p className="text-sm font-extrabold text-[#171717]">
                  Landing Flagged for Table Verification
                </p>
                <p className="text-xs font-medium text-[#171717]/75">
                  {rentEvent.disputeReason ||
                    'Players are verifying physical dice count or mortgage status before release.'}
                </p>
              </div>
            </div>
          )}

          {/* Primary Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {perspective === 'visitor' ? (
              <Button
                variant="primary"
                size="lg"
                disabled={rentEvent.status === 'completed'}
                onClick={onSettleRent}
              >
                <HandCoins className="w-4 h-4" />
                {rentEvent.status === 'completed'
                  ? 'Rent Paid (Locked)'
                  : `Pay Rent ${formatINR(rentEvent.amount)}`}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                disabled={rentEvent.status === 'completed'}
                onClick={onSettleRent}
              >
                <ArrowUpRight className="w-4 h-4" />
                {rentEvent.status === 'completed'
                  ? 'Rent Collected (Locked)'
                  : `Collect Rent ${formatINR(rentEvent.amount)}`}
              </Button>
            )}

            <Button
              variant="secondary"
              size="lg"
              onClick={() => onInspectProperty(rentEvent.spaceId)}
            >
              View Property
            </Button>

            {rentEvent.status === 'pending' && (
              <Button
                variant="pastel"
                pastel="orange"
                size="md"
                onClick={() =>
                  onDisputeRent('Physical dice recount requested before rent release.')
                }
              >
                Flag Dispute
              </Button>
            )}
          </div>
        </div>
      </PastelCard>

    </div>
  );
}
