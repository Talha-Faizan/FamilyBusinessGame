"use client";

import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  Building2,
  CheckCircle2,
  Clock,
  Crown,
  Gavel,
  Home,
  Lock,
  Repeat,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { COLOR_GROUP_META, computeSpaceRent } from '../../data/gameHelpers';
import { AuctionItem, BoardSpace, Player, ScreenId } from '../../types/game';
import {
  AnimatedCurrency,
  Button,
  ConfirmModal,
  EmptyStateCard,
  formatINR,
  GeometricAvatar,
  HouseHotelIndicator,
  PastelCard,
  StatusBadge,
} from '../ui/Primitives';

export function formatCountdown(seconds: number): string {
  const s = Math.max(0, seconds);
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

/* ============================================================================
   SCREEN 10: MY PROPERTIES
============================================================================ */
export function MyPropertiesScreen({
  activePlayer,
  players,
  spaces,
  onSelectProperty,
  onNavigate,
}: {
  activePlayer: Player;
  players: Player[];
  spaces: BoardSpace[];
  onSelectProperty: (spaceId: string) => void;
  onNavigate: (screen: ScreenId) => void;
}) {
  const [filter, setFilter] = useState<'mine' | 'all' | 'improved' | 'mortgaged'>('mine');

  const ownableSpaces = spaces.filter((s) => Boolean(s.price));
  const filtered = ownableSpaces.filter((s) => {
    if (filter === 'mine') return s.ownerId === activePlayer.id;
    if (filter === 'improved')
      return s.ownerId === activePlayer.id && (s.houses > 0 || s.hasHotel);
    if (filter === 'mortgaged') return s.isMortgaged;
    return true;
  });

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/60">
            Screen 10 · Title Deed Vault
          </p>
          <h2 className="font-display text-2xl sm:text-3xl text-[#171717]">
            {activePlayer.name}’s Properties
          </h2>
        </div>
        <Button
          variant="pastel"
          pastel="orange"
          size="sm"
          onClick={() => onNavigate('auction-market')}
        >
          <Gavel className="w-4 h-4" />
          Auction House
        </Button>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'mine' as const, label: 'My Deeds' },
          { id: 'improved' as const, label: 'Houses & Hotels' },
          { id: 'mortgaged' as const, label: 'Mortgaged' },
          { id: 'all' as const, label: 'All 18 Board Deeds' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-full border-[1.5px] border-[#171717] text-xs font-extrabold transition-all ${
              filter === tab.id ? 'bg-[#171717] text-[#F8F7EF]' : 'bg-[#F8F7EF] hover:bg-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyStateCard
          title="No Matching Title Deeds"
          description="Acquire cities on the physical board or bid in the Auction Marketplace to expand your deed portfolio."
          actionLabel="Browse Auctions"
          onAction={() => onNavigate('auction-market')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((space) => {
            const owner = players.find((p) => p.id === space.ownerId);
            const groupMeta = space.colorGroup ? COLOR_GROUP_META[space.colorGroup] : null;
            const activeRent = computeSpaceRent(space, spaces);

            return (
              <PastelCard
                key={space.id}
                tone="white"
                onClick={() => onSelectProperty(space.id)}
                className="overflow-hidden flex flex-col justify-between"
              >
                {/* Original Physical Board Color Group Header */}
                <div
                  className="px-5 py-4 border-b-[1.5px] border-[#171717] flex items-center justify-between gap-2"
                  style={{
                    backgroundColor: space.colorHex ?? '#FFD95A',
                    color: groupMeta?.textLight ? '#F8F7EF' : '#171717',
                  }}
                >
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-85 block">
                      {groupMeta?.label ?? 'Deed'}
                    </span>
                    <h3 className="font-display text-lg leading-snug">{space.name}</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#F8F7EF] text-[#171717] border border-[#171717] text-[10px] font-extrabold">
                    #{space.index}
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-[#EAEAEA]/55 border border-[#171717]/15">
                      <span className="text-[10px] font-extrabold uppercase text-[#171717]/60 block">
                        Purchase Price
                      </span>
                      <span className="font-display text-sm text-[#171717] mt-0.5 block">
                        {formatINR(space.price ?? 0)}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#FFD95A]/65 border border-[#171717]/30">
                      <span className="text-[10px] font-extrabold uppercase text-[#171717]/70 block">
                        Current Rent
                      </span>
                      <span className="font-display text-sm text-[#171717] mt-0.5 block">
                        {space.isMortgaged ? '₹0' : formatINR(activeRent)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <HouseHotelIndicator
                      houses={space.houses}
                      hasHotel={space.hasHotel}
                      isMortgaged={space.isMortgaged}
                    />

                    {owner ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F8F7EF] border border-[#171717] text-xs font-bold">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-[#171717]"
                          style={{ backgroundColor: owner.accentHex }}
                        />
                        {owner.name}
                      </div>
                    ) : (
                      <StatusBadge tone="gray">Bank Unowned</StatusBadge>
                    )}
                  </div>
                </div>
              </PastelCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   SCREEN 11: PROPERTY DETAILS
============================================================================ */
export function PropertyDetailsScreen({
  space,
  allSpaces,
  activePlayer,
  players,
  onBuildHouse,
  onUpgradeHotel,
  onToggleMortgage,
  onTransferProperty,
  onStartAuction,
  onPurchaseUnowned,
  onNavigate,
}: {
  space: BoardSpace;
  allSpaces: BoardSpace[];
  activePlayer: Player;
  players: Player[];
  onBuildHouse: (spaceId: string) => void;
  onUpgradeHotel: (spaceId: string) => void;
  onToggleMortgage: (spaceId: string) => void;
  onTransferProperty: (spaceId: string, recipientId: string) => void;
  onStartAuction: (spaceId: string, startingBid: number) => void;
  onPurchaseUnowned: (spaceId: string) => void;
  onNavigate: (screen: ScreenId) => void;
}) {
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [auctionModalOpen, setAuctionModalOpen] = useState(false);
  const [recipientId, setRecipientId] = useState(
    players.find((p) => p.id !== activePlayer.id)?.id ?? ''
  );
  const [startingBid, setStartingBid] = useState(space.price ?? 5000);

  const owner = players.find((p) => p.id === space.ownerId);
  const isOwner = space.ownerId === activePlayer.id;
  const groupMeta = space.colorGroup ? COLOR_GROUP_META[space.colorGroup] : null;
  const currentRent = computeSpaceRent(space, allSpaces);
  const canBuild = space.type === 'property' && isOwner && !space.isMortgaged;

  const rentRows = [
    {
      label: 'Base Site Rent',
      value: space.baseRent ?? 0,
      active: !space.isMortgaged && space.houses === 0 && !space.hasHotel,
    },
    {
      label: 'With 1 House',
      value: space.rent1House ?? 0,
      active: !space.isMortgaged && space.houses === 1 && !space.hasHotel,
    },
    {
      label: 'With 2 Houses',
      value: space.rent2House ?? 0,
      active: !space.isMortgaged && space.houses === 2 && !space.hasHotel,
    },
    {
      label: 'With 3 Houses',
      value: space.rent3House ?? 0,
      active: !space.isMortgaged && space.houses === 3 && !space.hasHotel,
    },
    {
      label: 'With Hotel',
      value: space.rentHotel ?? 0,
      active: !space.isMortgaged && space.hasHotel,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => onNavigate('my-properties')}>
            <ArrowLeft className="w-4 h-4" />
            Deeds
          </Button>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/60">
              Screen 11 · Official Title Deed
            </p>
            <h2 className="font-display text-2xl sm:text-3xl text-[#171717]">{space.name}</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-[#171717]/60" />
          <span className="text-xs font-bold text-[#171717]/70">Fixed Physical Edition Values</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Physical Title Deed Card */}
        <PastelCard tone="white" elevated className="lg:col-span-7 overflow-hidden">
          <div
            className="p-6 border-b-2 border-[#171717] flex items-start justify-between gap-4"
            style={{
              backgroundColor: space.colorHex ?? '#FFD95A',
              color: groupMeta?.textLight ? '#F8F7EF' : '#171717',
            }}
          >
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest opacity-90">
                {groupMeta?.label ?? 'Title Deed'} · Space #{space.index}
              </span>
              <h3 className="font-display text-2xl sm:text-3xl mt-1">{space.name}</h3>
              <p className="text-xs font-bold opacity-85 mt-0.5">{space.region}</p>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-[#F8F7EF] text-[#171717] border-[1.5px] border-[#171717] text-right">
              <span className="text-[10px] font-extrabold uppercase block text-[#171717]/65">
                Fixed Price
              </span>
              <span className="font-display text-base">{formatINR(space.price ?? 0)}</span>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Current Construction Level Banner */}
            <div className="p-4 rounded-2xl bg-[#FFD95A]/45 border-[1.5px] border-[#171717] flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#171717]/70 block">
                  Current Construction & Active Rent
                </span>
                <span className="font-display text-xl text-[#171717]">
                  {space.isMortgaged ? '₹0 (Mortgaged)' : formatINR(currentRent)}
                </span>
              </div>
              <HouseHotelIndicator
                houses={space.houses}
                hasHotel={space.hasHotel}
                isMortgaged={space.isMortgaged}
              />
            </div>

            {/* Rent Schedule Table */}
            <div className="space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/65">
                Official Rent Schedule
              </span>
              {rentRows.map((row) => (
                <div
                  key={row.label}
                  className={`px-4 py-2.5 rounded-xl border flex items-center justify-between text-sm ${
                    row.active
                      ? 'bg-[#A8DDB9] border-[#171717] font-extrabold'
                      : 'bg-[#EAEAEA]/40 border-[#171717]/15 font-semibold'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {row.active && <CheckCircle2 className="w-4 h-4" />}
                    {row.label}
                  </span>
                  <span className="font-display text-xs sm:text-sm">{formatINR(row.value)}</span>
                </div>
              ))}
            </div>

            {/* Fixed Construction & Mortgage Values */}
            <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-[#171717]/15 text-center">
              <div className="p-3 rounded-2xl bg-[#EAEAEA]/55">
                <span className="text-[10px] font-extrabold uppercase text-[#171717]/60 block">
                  House Cost
                </span>
                <span className="font-display text-xs sm:text-sm">
                  {space.houseCost ? formatINR(space.houseCost) : 'N/A'}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-[#EAEAEA]/55">
                <span className="text-[10px] font-extrabold uppercase text-[#171717]/60 block">
                  Hotel Upgrade
                </span>
                <span className="font-display text-xs sm:text-sm">
                  {space.hotelCost ? formatINR(space.hotelCost) : 'N/A'}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-[#EAEAEA]/55">
                <span className="text-[10px] font-extrabold uppercase text-[#171717]/60 block">
                  Mortgage Value
                </span>
                <span className="font-display text-xs sm:text-sm">
                  {formatINR(space.mortgageValue ?? 0)}
                </span>
              </div>
            </div>
          </div>
        </PastelCard>

        {/* Right Column: Ownership & Deed Management Actions */}
        <div className="lg:col-span-5 space-y-4">
          <PastelCard tone="blue" className="p-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {owner ? (
                <GeometricAvatar shape={owner.avatar} tone="white" size="md" />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-[#F8F7EF] border-[1.5px] border-[#171717] flex items-center justify-center font-display text-xs">
                  BANK
                </div>
              )}
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#171717]/70">
                  Registered Deed Holder
                </span>
                <p className="font-display text-base text-[#171717]">
                  {owner ? owner.name : 'Unowned Bank Title'}
                </p>
              </div>
            </div>
            {isOwner && <StatusBadge dark>Yours</StatusBadge>}
          </PastelCard>

          <PastelCard tone="white" className="p-5 space-y-3">
            <h4 className="font-display text-base text-[#171717]">Deed Actions</h4>
            {!owner && space.price && activePlayer.position === space.index && (
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => onPurchaseUnowned(space.id)}
              >
                Purchase Title for {formatINR(space.price)}
              </Button>
            )}

            {!owner && space.price && activePlayer.position !== space.index && (
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  size="lg"
                  fullWidth
                  disabled
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Must Land on Space to Purchase ({formatINR(space.price)})
                </Button>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FFD95A]/30 border border-[#171717]/20 text-xs font-bold text-[#171717]/80">
                  <AlertCircle className="w-4 h-4 text-[#171717] shrink-0" />
                  <span>
                    Your pawn is currently on Space #{activePlayer.position} ({allSpaces[activePlayer.position]?.name || 'Board'}). You can ONLY purchase {space.name} when your pawn lands directly on Space #{space.index}.
                  </span>
                </div>
              </div>
            )}

            {!isOwner && owner && (
              <p className="text-xs font-semibold text-[#171717]/70 p-3 rounded-2xl bg-[#EAEAEA]/60">
                Owned by {owner.name}. Switch active player to {owner.name} in the top bar to test
                building, mortgaging, or auctioning this deed.
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Button
                variant="pastel"
                pastel="green"
                disabled={!canBuild || space.hasHotel || space.houses >= 3}
                onClick={() => onBuildHouse(space.id)}
              >
                <Home className="w-4 h-4" />
                Build House ({formatINR(space.houseCost ?? 0)})
              </Button>

              <Button
                variant="pastel"
                pastel="pink"
                disabled={!canBuild || space.houses < 3 || space.hasHotel}
                onClick={() => onUpgradeHotel(space.id)}
              >
                <Building2 className="w-4 h-4" />
                Upgrade Hotel ({formatINR(space.hotelCost ?? 0)})
              </Button>

              <Button
                variant="secondary"
                disabled={!isOwner || space.houses > 0 || space.hasHotel}
                onClick={() => onToggleMortgage(space.id)}
              >
                {space.isMortgaged
                  ? `Unmortgage (${formatINR(Math.round((space.mortgageValue ?? 0) * 1.1))})`
                  : `Mortgage (+${formatINR(space.mortgageValue ?? 0)})`}
              </Button>

              <Button
                variant="secondary"
                disabled={!isOwner}
                onClick={() => setTransferModalOpen(true)}
              >
                <Repeat className="w-4 h-4" />
                Transfer Deed
              </Button>
            </div>

            <Button
              variant="pastel"
              pastel="orange"
              fullWidth
              disabled={!isOwner && Boolean(owner)}
              onClick={() => {
                setStartingBid(space.price ?? 5000);
                setAuctionModalOpen(true);
              }}
            >
              <Gavel className="w-4 h-4" />
              Put Property Up for Live Auction
            </Button>
          </PastelCard>
        </div>
      </div>

      {/* Transfer Property Confirmation Modal */}
      <ConfirmModal
        open={transferModalOpen}
        title={`Transfer ${space.name}`}
        subtitle="Select a table player to transfer ownership of this physical deed."
        tone="blue"
        confirmLabel="Confirm Transfer"
        onClose={() => setTransferModalOpen(false)}
        onConfirm={() => {
          if (recipientId) onTransferProperty(space.id, recipientId);
          setTransferModalOpen(false);
        }}
      >
        <div className="space-y-2">
          {players
            .filter((p) => p.id !== activePlayer.id)
            .map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setRecipientId(p.id)}
                className={`w-full p-3 rounded-2xl border-[1.5px] flex items-center justify-between ${
                  recipientId === p.id
                    ? 'bg-[#91D5F2] border-[#171717]'
                    : 'bg-white border-[#171717]/25'
                }`}
              >
                <span className="flex items-center gap-2.5 font-extrabold text-sm">
                  <GeometricAvatar shape={p.avatar} tone={p.accent} size="xs" />
                  {p.name}
                </span>
                <span className="text-xs font-bold">{formatINR(p.cash)}</span>
              </button>
            ))}
        </div>
      </ConfirmModal>

      {/* Start Auction Modal */}
      <ConfirmModal
        open={auctionModalOpen}
        title={`Auction ${space.name}`}
        subtitle="Launch a live timed gavel open to all rival players."
        tone="orange"
        confirmLabel="Launch Live Gavel"
        onClose={() => setAuctionModalOpen(false)}
        onConfirm={() => {
          onStartAuction(space.id, startingBid);
          setAuctionModalOpen(false);
        }}
      >
        <div className="space-y-2">
          <label className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/70">
            Opening Reserve Bid (₹)
          </label>
          <input
            type="number"
            min={500}
            step={500}
            value={startingBid}
            onChange={(e) => setStartingBid(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-2xl bg-white border-[1.5px] border-[#171717] font-display text-lg"
          />
        </div>
      </ConfirmModal>
    </div>
  );
}

/* ============================================================================
   SCREEN 12: AUCTION MARKETPLACE
============================================================================ */
export function AuctionMarketplaceScreen({
  auctions,
  players,
  onSelectAuction,
  onInspectResult,
  onNavigate,
}: {
  auctions: AuctionItem[];
  players: Player[];
  onSelectAuction: (auctionId: string) => void;
  onInspectResult: (auctionId: string) => void;
  onNavigate: (screen: ScreenId) => void;
}) {
  const activeAuctions = auctions.filter((a) => a.status === 'active');
  const settledAuctions = auctions.filter((a) => a.status === 'settled');

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/60">
            Screen 12 · Live Gavel Floor
          </p>
          <h2 className="font-display text-2xl sm:text-3xl text-[#171717]">Auction Marketplace</h2>
        </div>
        <Button variant="secondary" size="sm" onClick={() => onNavigate('my-properties')}>
          List My Property
        </Button>
      </div>

      {activeAuctions.length === 0 ? (
        <EmptyStateCard
          title="No Live Auctions Right Now"
          description="Open any property deed to start a live bidding war with your table."
          actionLabel="Go to Properties"
          onAction={() => onNavigate('my-properties')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {activeAuctions.map((auc) => {
            const seller = players.find((p) => p.id === auc.sellerId);
            const uniqueBidders = new Set(auc.bids.map((b) => b.bidderId)).size;

            return (
              <PastelCard
                key={auc.id}
                tone="orange"
                elevated
                className="overflow-hidden flex flex-col justify-between"
              >
                <div
                  className="px-6 py-4 border-b-[1.5px] border-[#171717] flex items-center justify-between text-white"
                  style={{ backgroundColor: auc.colorHex }}
                >
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-90">
                      Live Deed Gavel
                    </span>
                    <h3 className="font-display text-xl">{auc.propertyName}</h3>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#171717] text-[#FFD95A] font-display text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    {formatCountdown(auc.secondsRemaining)}
                  </span>
                </div>

                <div className="p-6 bg-[#F8F7EF] space-y-5 flex-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      {seller && (
                        <GeometricAvatar shape={seller.avatar} tone={seller.accent} size="sm" />
                      )}
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-[#171717]/60 block">
                          Seller
                        </span>
                        <span className="text-sm font-extrabold text-[#171717]">
                          {auc.sellerName}
                        </span>
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAEAEA] border border-[#171717]/25 text-xs font-bold">
                      <Users className="w-3.5 h-3.5" />
                      {uniqueBidders} Bidders
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FFD95A] border-[1.5px] border-[#171717] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#171717]/75 block">
                        Current Highest Bid
                      </span>
                      <span className="font-display text-2xl text-[#171717]">
                        {formatINR(auc.currentBid)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-extrabold uppercase text-[#171717]/70 block">
                        Highest Bidder
                      </span>
                      <span className="text-sm font-extrabold text-[#171717]">
                        {auc.highestBidderName ?? 'No Bids Yet'}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={() => onSelectAuction(auc.id)}
                  >
                    <Gavel className="w-4 h-4" />
                    Enter Bidding Arena
                  </Button>
                </div>
              </PastelCard>
            );
          })}
        </div>
      )}

      {/* Settled Auctions Row */}
      {settledAuctions.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="font-display text-base text-[#171717]">Recently Settled Gavels</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settledAuctions.map((auc) => (
              <PastelCard
                key={auc.id}
                tone="green"
                onClick={() => onInspectResult(auc.id)}
                className="p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <StatusBadge dark>Sold</StatusBadge>
                  <p className="font-display text-base text-[#171717] mt-1.5">{auc.propertyName}</p>
                  <p className="text-xs font-bold text-[#171717]/75">
                    Won by {auc.highestBidderName} from {auc.sellerName}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-display text-lg text-[#171717] block">
                    {formatINR(auc.currentBid)}
                  </span>
                  <span className="text-xs font-extrabold underline">View Result →</span>
                </div>
              </PastelCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   SCREEN 13: AUCTION DETAILS — CIRCULAR MULTIPLAYER BIDDING ARENA
============================================================================ */
export function AuctionDetailsScreen({
  auction,
  allAuctions,
  space,
  players,
  activePlayer,
  onPlaceBid,
  onSimulateRivalBid,
  onSelectAuction,
  onSwitchActivePlayer,
  onFinalizeAuction,
  onNavigate,
}: {
  auction: AuctionItem;
  allAuctions: AuctionItem[];
  space?: BoardSpace;
  players: Player[];
  activePlayer: Player;
  onPlaceBid: (auctionId: string, amount: number) => void;
  onSimulateRivalBid: (auctionId: string) => void;
  onSelectAuction: (auctionId: string) => void;
  onSwitchActivePlayer: (playerId: string) => void;
  onFinalizeAuction: (auctionId: string) => void;
  onNavigate: (screen: ScreenId) => void;
}) {
  const minNextBid = auction.highestBidderId ? auction.currentBid + 50 : auction.startingBid;
  const [customIncrement, setCustomIncrement] = useState<number>(250);
  const [manualBid, setManualBid] = useState<string>('');
  const [animatingBidderId, setAnimatingBidderId] = useState<string | null>(
    auction.highestBidderId
  );
  const [bumpCenter, setBumpCenter] = useState(false);

  const isSeller = activePlayer.id === auction.sellerId;
  const bidAmount =
    manualBid !== ''
      ? Number(manualBid)
      : auction.highestBidderId
        ? auction.currentBid + customIncrement
        : Math.max(auction.startingBid, auction.currentBid);
  const insufficientFunds = bidAmount > activePlayer.cash;
  const groupMeta = COLOR_GROUP_META[auction.colorGroup];
  const activeAuctionsList = allAuctions.filter((a) => a.status === 'active');

  React.useEffect(() => {
    if (!auction.highestBidderId) return;
    setAnimatingBidderId(auction.highestBidderId);
    setBumpCenter(true);
    const t1 = window.setTimeout(() => setBumpCenter(false), 420);
    const t2 = window.setTimeout(() => setAnimatingBidderId(null), 900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [auction.currentBid, auction.highestBidderId]);

  // Seller anchored at 12 o'clock (-90°); all other participating players evenly spaced around the circle
  const orderedArenaPlayers = React.useMemo(() => {
    const seller = players.find((p) => p.id === auction.sellerId);
    const others = players.filter((p) => p.id !== auction.sellerId);
    return seller ? [seller, ...others] : players;
  }, [players, auction.sellerId]);

  const latestBidByPlayer = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of auction.bids) {
      if (map[b.bidderId] === undefined) {
        map[b.bidderId] = b.amount;
      }
    }
    return map;
  }, [auction.bids]);

  const myLatestBid = latestBidByPlayer[activePlayer.id];
  const isOutbid =
    !isSeller &&
    myLatestBid !== undefined &&
    auction.highestBidderId !== null &&
    auction.highestBidderId !== activePlayer.id;

  const playerNodes = orderedArenaPlayers.map((player, idx) => {
    const count = Math.max(1, orderedArenaPlayers.length);
    const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / count;
    const rx = 36.5;
    const ry = 36.5;
    const xPct = 50 + rx * Math.cos(angle);
    const yPct = 52 + ry * Math.sin(angle);
    return {
      player,
      xPct,
      yPct,
      isPlayerSeller: player.id === auction.sellerId,
      isLeader: player.id === auction.highestBidderId,
      latestBid: latestBidByPlayer[player.id],
    };
  });

  const leaderNode = playerNodes.find((n) => n.isLeader);

  const handleSubmitBid = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSeller || bidAmount < minNextBid || insufficientFunds) return;
    onPlaceBid(auction.id, bidAmount);
    setManualBid('');
  };

  const handleQuickCounter = () => {
    const counterAmt = auction.currentBid + 500;
    if (isSeller || counterAmt > activePlayer.cash) return;
    onPlaceBid(auction.id, counterAmt);
    setManualBid('');
  };

  const urgentTimer = auction.secondsRemaining <= 5 && auction.status === 'active';

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-slide-up">
      {/* Arena Header: Back, Active Auction Switcher & 10s Resetting Countdown */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => onNavigate('auction-market')}>
            <ArrowLeft className="w-4 h-4" />
            All Auctions
          </Button>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/60">
              Screen 13 · 10s Gavel Countdown (Resets On Each Bid)
            </p>
            <h2 className="font-display text-xl sm:text-2xl text-[#171717]">
              {auction.propertyName} Auction Ring
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeAuctionsList.length > 1 && (
            <div className="inline-flex p-1 rounded-full bg-[#EAEAEA] border border-[#171717]">
              {activeAuctionsList.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    onSelectAuction(a.id);
                    setManualBid('');
                  }}
                  className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-all ${
                    a.id === auction.id ? 'bg-[#171717] text-[#FFD95A]' : 'text-[#171717]/75'
                  }`}
                >
                  {a.propertyName}
                </button>
              ))}
            </div>
          )}

          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-[1.5px] border-[#171717] font-display text-xs sm:text-sm shadow-[0_3px_0_0_#171717] ${
              urgentTimer
                ? 'bg-[#FF9EC4] text-[#171717] animate-pulse'
                : 'bg-[#171717] text-[#FFD95A]'
            }`}
          >
            <Clock className="w-4 h-4" />
            {formatCountdown(auction.secondsRemaining)}
          </div>
        </div>
      </div>

      {/* Outbid Notification Banner when another player takes the lead */}
      {isOutbid && (
        <div className="rounded-[26px] bg-[#FF9EC4] border-2 border-[#171717] shadow-[0_5px_0_0_#171717] px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#171717] text-[#FF9EC4] flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#171717]/75">
                Outbid Notification · Lead Taken!
              </p>
              <p className="text-xs sm:text-sm font-extrabold text-[#171717]">
                {auction.highestBidderName} took the lead at {formatINR(auction.currentBid)} — ahead
                of your {formatINR(myLatestBid)} bid!
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            disabled={auction.currentBid + 500 > activePlayer.cash}
            onClick={handleQuickCounter}
          >
            Quick Counter {formatINR(auction.currentBid + 500)}
          </Button>
        </div>
      )}

      {/* =====================================================================
          CIRCULAR MULTIPLAYER BIDDING ARENA STAGE
      ===================================================================== */}
      <div className="relative w-full min-h-[485px] sm:min-h-[590px] lg:min-h-[630px] rounded-[38px] bg-[#F8F7EF] border-2 border-[#171717] shadow-[0_8px_0_0_#171717] overflow-hidden select-none">
        {/* Minimal Pastel Geometric Accents */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -left-16 w-48 h-48 rounded-full bg-[#91D5F2]/35"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 -right-16 w-56 h-56 rounded-full bg-[#FFD95A]/35"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-10 right-10 w-24 h-24 rounded-full bg-[#FF9EC4]/25 hidden sm:block"
        />

        {/* Orbital Ring & Live Connector Ray to Highest Bidder */}
        <svg
          aria-hidden="true"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 w-full h-full"
        >
          <ellipse
            cx="50"
            cy="52"
            rx="36.5"
            ry="36.5"
            fill="none"
            stroke="#171717"
            strokeOpacity="0.16"
            strokeWidth="0.35"
            strokeDasharray="1.4 1.4"
          />
          <ellipse
            cx="50"
            cy="52"
            rx="24"
            ry="24"
            fill="none"
            stroke="#171717"
            strokeOpacity="0.09"
            strokeWidth="0.28"
          />
          {leaderNode && (
            <line
              x1="50"
              y1="52"
              x2={leaderNode.xPct}
              y2={leaderNode.yPct}
              stroke="#FFD95A"
              strokeWidth="0.9"
              strokeDasharray="1.6 1"
            />
          )}
        </svg>

        {/* Arena Corner Status Chips */}
        <div className="absolute top-3.5 left-4 z-10 hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-[#171717] text-[11px] font-extrabold">
          <span className="w-2 h-2 rounded-full bg-[#35A862]" />
          <span>{players.length} Players in Ring</span>
        </div>

        <div className="absolute top-3.5 right-4 z-10 hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-[#171717] text-[11px] font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFD95A] border border-[#171717]" />
          <span>Highest Bidder Halo</span>
        </div>

        {/* ===================================================================
            EXACT CENTER FOCAL POINT: CENTRAL PROPERTY CARD
        =================================================================== */}
        <div className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 z-20 w-[156px] sm:w-[232px] md:w-[258px]">
          <div
            className={`rounded-[26px] sm:rounded-[30px] bg-white border-2 border-[#171717] shadow-[0_8px_0_0_#171717] overflow-hidden transition-transform ${
              bumpCenter ? 'animate-center-bump' : ''
            }`}
          >
            {/* Property Color Group Header */}
            <div
              className="px-3.5 py-2.5 sm:px-5 sm:py-3.5 border-b-2 border-[#171717] text-center"
              style={{
                backgroundColor: auction.colorHex,
                color: groupMeta?.textLight ? '#F8F7EF' : '#171717',
              }}
            >
              <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest opacity-90 block truncate">
                {groupMeta?.label ?? auction.colorGroup}
              </span>
              <h3 className="font-display text-sm sm:text-xl leading-snug truncate mt-0.5">
                {auction.propertyName}
              </h3>
            </div>

            {/* Original Price + Visually Dominant Boldonse Highest Bid */}
            <div className="p-3 sm:p-4 space-y-2.5 text-center bg-[#F8F7EF]">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EAEAEA] border border-[#171717]/25 text-[9px] sm:text-[11px] font-bold text-[#171717]/80">
                <span>Original</span>
                <span className="font-extrabold text-[#171717]">
                  {formatINR(space?.price ?? auction.startingBid)}
                </span>
              </div>

              <div className="p-2.5 sm:p-3.5 rounded-2xl bg-[#FFD95A] border-[1.5px] border-[#171717] shadow-[0_3px_0_0_#171717]">
                <span className="text-[8px] sm:text-[10px] font-extrabold uppercase tracking-widest text-[#171717]/75 block">
                  Current Highest Bid
                </span>
                <div className="mt-0.5">
                  <AnimatedCurrency
                    amount={auction.currentBid}
                    className="text-lg sm:text-2xl md:text-[28px] text-[#171717]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-xs font-extrabold text-[#171717]">
                {auction.highestBidderName ? (
                  <>
                    <Crown className="w-3.5 h-3.5 text-[#171717] fill-[#FFD95A]" />
                    <span className="truncate">{auction.highestBidderName} Leads</span>
                  </>
                ) : (
                  <span className="text-[#171717]/60">Awaiting First Bid</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================
            CIRCULAR FORMATION OF PLAYERS WITH FLOATING BID BUBBLES
        =================================================================== */}
        {playerNodes.map((node) => {
          const { player, xPct, yPct, isPlayerSeller, isLeader, latestBid } = node;
          const hasBid = latestBid !== undefined;
          const isMe = player.id === activePlayer.id;
          const isPopping = animatingBidderId === player.id;

          return (
            <div
              key={player.id}
              style={{ left: `${xPct}%`, top: `${yPct}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center"
            >
              {/* Floating Pill-Shaped Bid Bubble Above Circular Avatar */}
              <div
                key={`${player.id}-${latestBid ?? 'none'}`}
                className={`mb-1.5 relative flex flex-col items-center ${
                  isPopping ? 'animate-bid-bubble' : ''
                }`}
              >
                {isPlayerSeller ? (
                  <div className="px-2.5 py-1 rounded-full bg-[#FFB66E] border-[1.5px] border-[#171717] shadow-[0_2px_0_0_#171717] flex items-center gap-1 whitespace-nowrap">
                    <Lock className="w-2.5 h-2.5 text-[#171717]" />
                    <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-[#171717]">
                      Seller · Locked
                    </span>
                  </div>
                ) : isLeader && hasBid ? (
                  <div className="px-3 py-1 rounded-full bg-[#FFD95A] border-[1.5px] border-[#171717] shadow-[0_3px_0_0_#171717] flex items-center gap-1 whitespace-nowrap">
                    <Crown className="w-3 h-3 text-[#171717] shrink-0" />
                    <span className="font-display text-[10px] sm:text-xs text-[#171717]">
                      {formatINR(latestBid)}
                    </span>
                  </div>
                ) : hasBid ? (
                  <div className="px-2.5 py-1 rounded-full bg-[#FF9EC4] border-[1.5px] border-[#171717] shadow-[0_2px_0_0_#171717] whitespace-nowrap">
                    <span className="font-display text-[10px] sm:text-xs text-[#171717]">
                      {formatINR(latestBid)}
                    </span>
                  </div>
                ) : (
                  <div className="px-2.5 py-0.5 rounded-full bg-[#EAEAEA]/95 border border-dashed border-[#171717]/55 whitespace-nowrap">
                    <span className="text-[9px] sm:text-[10px] font-bold text-[#171717]/65">
                      No Bid Yet
                    </span>
                  </div>
                )}
                <div className="w-2 h-2 rotate-45 bg-[#171717] -mt-1" />
              </div>

              {/* Circular Avatar with Pastel Leader Glow / Seller Ring / Unbid Dashed State */}
              <button
                type="button"
                onClick={() => onSwitchActivePlayer(player.id)}
                title={`Switch active seat to ${player.name}`}
                className={`relative rounded-full transition-all duration-300 ${
                  isLeader
                    ? 'animate-leader-halo scale-105'
                    : isPlayerSeller
                      ? 'ring-4 ring-[#FFB66E] opacity-95'
                      : !hasBid
                        ? 'opacity-85 hover:opacity-100 hover:scale-105'
                        : 'hover:scale-105'
                }`}
              >
                <GeometricAvatar
                  shape={player.avatar}
                  tone={player.accent}
                  size="md"
                  circular
                  className={`sm:w-14 sm:h-14 ${
                    !hasBid && !isPlayerSeller ? 'border-dashed' : ''
                  }`}
                />

                {isPlayerSeller && (
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#171717] text-[#FFB66E] border border-[#F8F7EF] flex items-center justify-center">
                    <Lock className="w-2.5 h-2.5" />
                  </span>
                )}

                {isLeader && (
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#A8DDB9] text-[#171717] border border-[#171717] flex items-center justify-center text-[9px] font-extrabold">
                    #1
                  </span>
                )}
              </button>

              {/* Username Underneath in Montserrat */}
              <div className="mt-1.5 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F8F7EF]/95 border border-[#171717]/25">
                <span className="text-[11px] sm:text-xs font-extrabold text-[#171717] whitespace-nowrap">
                  {player.name}
                </span>
                {isMe && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#171717] text-[#FFD95A] text-[8px] font-extrabold uppercase">
                    You
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* =====================================================================
          BIDDING CONTROLS DOCK & LIVE ARENA STREAM
      ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <PastelCard tone="yellow" elevated className="lg:col-span-7 p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <GeometricAvatar
                shape={activePlayer.avatar}
                tone="white"
                size="sm"
                circular
              />
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#171717]/70 block">
                  Bidding Seat · Tap Any Circular Avatar to Switch
                </span>
                <span className="text-sm font-extrabold text-[#171717]">
                  {activePlayer.name} · Available {formatINR(activePlayer.cash)}
                </span>
              </div>
            </div>
            <StatusBadge dark>Min {formatINR(minNextBid)}</StatusBadge>
          </div>

          {isSeller ? (
            <div className="p-4 rounded-2xl bg-[#F8F7EF] border-[1.5px] border-[#171717] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-extrabold uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Seller Restricted ({activePlayer.name})
                </p>
                <p className="text-xs font-medium text-[#171717]/75">
                  As the seller of {auction.propertyName}, {activePlayer.name} is not permitted to
                  bid. Switch to a rival player in the circle to place a bid.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const rival = players.find((p) => p.id !== auction.sellerId && !p.isBankrupt);
                  if (rival) onSwitchActivePlayer(rival.id);
                }}
              >
                Switch to Bidder
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmitBid} className="space-y-3.5">
              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 250, 500].map((inc) => {
                  const selected = manualBid === '' && customIncrement === inc;
                  return (
                    <button
                      key={inc}
                      type="button"
                      onClick={() => {
                        setCustomIncrement(inc);
                        setManualBid('');
                      }}
                      className={`py-2 px-2 rounded-full border-[1.5px] border-[#171717] text-xs font-extrabold transition-all ${
                        selected
                          ? 'bg-[#171717] text-[#FFD95A]'
                          : 'bg-[#F8F7EF] text-[#171717] hover:bg-white'
                      }`}
                    >
                      +{formatINR(inc)}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="number"
                  min={minNextBid}
                  step={50}
                  value={manualBid !== '' ? manualBid : bidAmount}
                  onChange={(e) => setManualBid(e.target.value)}
                  className="sm:w-44 px-4 py-3.5 rounded-full bg-[#F8F7EF] border-[1.5px] border-[#171717] font-display text-base text-center focus:outline-none focus:bg-white"
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={bidAmount < minNextBid || insufficientFunds}
                >
                  <Gavel className="w-4 h-4" />
                  Place Bid · {formatINR(bidAmount)}
                </Button>
              </div>

              {insufficientFunds && (
                <p className="text-xs font-extrabold text-rose-900">
                  Bid exceeds {activePlayer.name}’s spendable cash ({formatINR(activePlayer.cash)}).
                </p>
              )}
            </form>
          )}
        </PastelCard>

        {/* Right: Live Bid Stream & Settle Gavel */}
        <PastelCard
          tone="white"
          className="lg:col-span-5 p-5 sm:p-6 flex flex-col justify-between gap-4"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-display text-sm sm:text-base text-[#171717]">Live Bid History</h4>
              <StatusBadge tone="green">{auction.bids.length} Bids</StatusBadge>
            </div>
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {auction.bids.length === 0 ? (
                <p className="text-xs font-semibold text-[#171717]/60 py-4 text-center">
                  No bids placed yet. Reserve opens at {formatINR(auction.startingBid)}.
                </p>
              ) : (
                auction.bids.map((b, idx) => (
                  <div
                    key={b.id}
                    className={`px-3.5 py-2.5 rounded-2xl border flex items-center justify-between ${
                      idx === 0
                        ? 'bg-[#A8DDB9] border-[#171717]'
                        : 'bg-[#EAEAEA]/50 border-[#171717]/15'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-extrabold text-[#171717]">
                        {b.bidderName} {idx === 0 && '· Leading'}
                      </p>
                      <p className="text-[10px] font-semibold text-[#171717]/65">{b.timestamp}</p>
                    </div>
                    <span className="font-display text-xs text-[#171717]">
                      {formatINR(b.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#171717]/15 flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#171717]/70">Award deed to leader:</span>
            <Button
              variant="secondary"
              size="sm"
              disabled={!auction.highestBidderId}
              onClick={() => onFinalizeAuction(auction.id)}
            >
              Settle Gavel →
            </Button>
          </div>
        </PastelCard>
      </div>
    </div>
  );
}

/* ============================================================================
   SCREEN 14: AUCTION RESULT
============================================================================ */
export function AuctionResultScreen({
  auction,
  players,
  onNavigate,
}: {
  auction: AuctionItem;
  players: Player[];
  onNavigate: (screen: ScreenId) => void;
}) {
  const winner = players.find((p) => p.id === auction.highestBidderId) ?? players[0];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
      <PastelCard tone="green" elevated className="relative overflow-hidden p-8 text-center space-y-6">
        {/* Subtle Geometric Celebration Shapes — No Mascots or Emojis */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-6 -left-6 w-24 h-24 rounded-full bg-[#FFD95A] border-2 border-[#171717] animate-float-slow"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-6 -right-6 w-28 h-28 rounded-3xl rotate-12 bg-[#FF9EC4] border-2 border-[#171717]"
        />

        <div className="relative z-10 flex flex-col items-center gap-3">
          <StatusBadge dark>
            <Sparkles className="w-3.5 h-3.5" />Screen 14 · Gavel Settled
          </StatusBadge>
          {auction.highestBidderId ? (
            <>
              <GeometricAvatar shape={winner.avatar} tone="yellow" size="xl" />
              <h2 className="font-display text-3xl sm:text-4xl text-[#171717] mt-1">
                Sold to {auction.highestBidderName || winner.name}!
              </h2>
              <p className="text-sm font-bold text-[#171717]/80">
                Official Title Deed for <span className="underline">{auction.propertyName}</span> has
                been transferred automatically.
              </p>
            </>
          ) : (
            <>
              <h2 className="font-display text-3xl sm:text-4xl text-[#171717] mt-1">
                Auction Expired — Unsold
              </h2>
              <p className="text-sm font-bold text-[#171717]/80">
                No bids were placed in 10 seconds.{' '}
                <span className="underline">{auction.propertyName}</span> remains with the Bank.
              </p>
            </>
          )}
        </div>

        <div className="relative z-10 p-6 rounded-[26px] bg-[#F8F7EF] border-2 border-[#171717] space-y-4 text-left">
          <div className="flex items-center justify-between border-b border-[#171717]/15 pb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/65">
              Final Winning Bid
            </span>
            <span className="font-display text-2xl text-[#171717]">
              {formatINR(auction.currentBid)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[#171717]/60 font-bold uppercase block">Winning Bidder</span>
              <span className="font-extrabold text-sm">{auction.highestBidderName}</span>
            </div>
            <div>
              <span className="text-[#171717]/60 font-bold uppercase block">Previous Seller</span>
              <span className="font-extrabold text-sm">{auction.sellerName}</span>
            </div>
            <div>
              <span className="text-[#171717]/60 font-bold uppercase block">Deed Transferred</span>
              <span className="font-extrabold text-sm">{auction.propertyName}</span>
            </div>
            <div>
              <span className="text-[#171717]/60 font-bold uppercase block">Confirmation</span>
              <span className="inline-flex items-center gap-1 font-extrabold text-[#1e6b3b]">
                <ShieldCheck className="w-4 h-4" /> Verified #{auction.id.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap justify-center gap-3">
          <Button variant="primary" size="lg" onClick={() => onNavigate('my-properties')}>
            <Award className="w-4 h-4" />
            Open Deed Vault
          </Button>
          <Button variant="secondary" size="lg" onClick={() => onNavigate('auction-market')}>
            Back to Marketplace
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </PastelCard>
    </div>
  );
}
