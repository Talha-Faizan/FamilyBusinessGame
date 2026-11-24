"use client";

import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Crown,
  Dice5,
  Globe,
  Lock,
  Plus,
  ShieldCheck,
  Sparkles,
  Tablet,
  Users,
} from 'lucide-react';
import { Plus as PixelPlus, Users as PixelUsers } from 'pixelarticons/react';
import { AvatarShapeId, GameConfig, GameMode, PastelTone, Player, ScreenId } from '../../types/game';
import {
  AVATAR_OPTIONS,
  Button,
  formatINR,
  GeometricAvatar,
  PastelCard,
  StatusBadge,
} from '../ui/Primitives';

export function WelcomeScreen({
  gameMode,
  onChangeGameMode,
  onNavigate,
}: {
  gameMode: GameMode;
  onChangeGameMode: (mode: GameMode) => void;
  onNavigate: (screen: ScreenId) => void;
  roomCode?: string;
}) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center animate-slide-up">
      <div className="w-full max-w-sm space-y-4">
        {/* Wordmark */}
        <div className="text-center space-y-1 mb-6">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#171717]/50">
            {gameMode === 'online' ? 'Online Digital Board' : 'Physical Board Companion'}
          </p>
          <h1 className="font-display text-4xl text-[#171717]">DEED CLUB</h1>
        </div>

        {/* Play Mode Toggle: Local Physical Board vs Completely Online */}
        <div className="p-1.5 rounded-[20px] bg-[#EAEAEA] border-[2px] border-[#171717] shadow-[3px_3px_0px_#171717] grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => onChangeGameMode('local')}
            className={`px-3 py-2.5 rounded-[14px] flex flex-col items-center justify-center gap-0.5 transition-all ${
              gameMode === 'local'
                ? 'bg-[#171717] text-[#FFD95A] shadow-[0_2px_0_0_rgba(23,23,23,0.2)]'
                : 'text-[#171717]/75 hover:bg-white/60'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-extrabold">
              <Tablet className="w-3.5 h-3.5" />
              <span>Local Board</span>
            </div>
            <span className={`text-[10px] font-semibold ${gameMode === 'local' ? 'text-[#F8F7EF]/80' : 'text-[#171717]/55'}`}>
              Physical companion
            </span>
          </button>

          <button
            type="button"
            onClick={() => onChangeGameMode('online')}
            className={`px-3 py-2.5 rounded-[14px] flex flex-col items-center justify-center gap-0.5 transition-all ${
              gameMode === 'online'
                ? 'bg-[#171717] text-[#A8DDB9] shadow-[0_2px_0_0_rgba(23,23,23,0.2)]'
                : 'text-[#171717]/75 hover:bg-white/60'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-extrabold">
              <Globe className="w-3.5 h-3.5" />
              <span>Play Online</span>
            </div>
            <span className={`text-[10px] font-semibold ${gameMode === 'online' ? 'text-[#F8F7EF]/80' : 'text-[#171717]/55'}`}>
              Digital board &amp; dice
            </span>
          </button>
        </div>

        {/* Create Room */}
        <button
          type="button"
          onClick={() => onNavigate('create-game')}
          className="w-full flex items-center justify-between gap-4 p-5 rounded-[20px] bg-[#FFD95A] border-[2px] border-[#171717] shadow-[4px_4px_0px_#171717] hover:translate-y-[-2px] hover:shadow-[4px_6px_0px_#171717] active:translate-y-[1px] active:shadow-[2px_2px_0px_#171717] transition-all duration-150"
        >
          <div className="text-left">
            <p className="font-display text-xl text-[#171717]">Create Room</p>
            <p className="text-xs font-semibold text-[#171717]/70 mt-0.5">
              {gameMode === 'online'
                ? 'Host online game · digital dice · animated board'
                : 'Host local board · set rules · invite players'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#171717] flex items-center justify-center shrink-0">
            <PixelPlus className="w-5 h-5 text-[#FFD95A]" />
          </div>
        </button>

        {/* Join Room */}
        <button
          type="button"
          onClick={() => onNavigate('join-game')}
          className="w-full flex items-center justify-between gap-4 p-5 rounded-[20px] bg-[#F8F7EF] border-[2px] border-[#171717] shadow-[4px_4px_0px_#171717] hover:translate-y-[-2px] hover:shadow-[4px_6px_0px_#171717] active:translate-y-[1px] active:shadow-[2px_2px_0px_#171717] transition-all duration-150"
        >
          <div className="text-left">
            <p className="font-display text-xl text-[#171717]">Join Room</p>
            <p className="text-xs font-semibold text-[#171717]/70 mt-0.5">
              Enter a room code to join a game
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#171717] flex items-center justify-center shrink-0">
            <PixelUsers className="w-5 h-5 text-[#F8F7EF]" />
          </div>
        </button>
      </div>
    </div>
  );
}

export function CreateGameScreen({
  config,
  onUpdateConfig,
  hostPlayer,
  onUpdateHost,
  onNavigate,
}: {
  config: GameConfig;
  onUpdateConfig: (patch: Partial<GameConfig>) => void;
  hostPlayer: Player;
  onUpdateHost: (name: string, avatar: AvatarShapeId, tone: PastelTone) => void | Promise<void>;
  onNavigate: (screen: ScreenId) => void;
}) {
  const [hostName, setHostName] = useState(hostPlayer.name);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarShapeId>(hostPlayer.avatar);
  const [selectedTone, setSelectedTone] = useState<PastelTone>(hostPlayer.accent);
  const [loading, setLoading] = useState(false);

  const handleLaunchLobby = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await onUpdateHost(hostName.trim() || hostPlayer.name || 'Player', selectedAvatar, selectedTone);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLaunchLobby} className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => onNavigate('welcome')}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/60">
              Screen 02 · Host Setup
            </p>
            <h2 className="font-display text-2xl sm:text-3xl text-[#171717]">Create Game Room</h2>
          </div>
        </div>
        <StatusBadge tone="yellow">Room #{config.roomCode}</StatusBadge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Game Mode, Host Identity & Room Basics */}
        <div className="lg:col-span-6 space-y-5">
          {/* Play Mode Switcher */}
          <PastelCard tone={config.gameMode === 'online' ? 'green' : 'blue'} className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#171717]">
                Play Mode Selection
              </span>
              <StatusBadge dark>
                {config.gameMode === 'online' ? 'Completely Online' : 'Local Physical Board'}
              </StatusBadge>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onUpdateConfig({ gameMode: 'local' })}
                className={`p-3.5 rounded-2xl border-[1.5px] border-[#171717] text-left transition-all ${
                  config.gameMode === 'local'
                    ? 'bg-[#171717] text-[#F8F7EF] shadow-[0_3px_0_0_rgba(23,23,23,0.3)]'
                    : 'bg-[#F8F7EF] text-[#171717] hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-2 font-display text-sm">
                  <Tablet className="w-4 h-4 shrink-0" />
                  <span>Local Board</span>
                </div>
                <p
                  className={`text-[11px] font-semibold mt-1 ${
                    config.gameMode === 'local' ? 'text-[#F8F7EF]/80' : 'text-[#171717]/70'
                  }`}
                >
                  Use physical board &amp; enter physical dice rolls.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onUpdateConfig({ gameMode: 'online' })}
                className={`p-3.5 rounded-2xl border-[1.5px] border-[#171717] text-left transition-all ${
                  config.gameMode === 'online'
                    ? 'bg-[#171717] text-[#F8F7EF] shadow-[0_3px_0_0_rgba(23,23,23,0.3)]'
                    : 'bg-[#F8F7EF] text-[#171717] hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-2 font-display text-sm">
                  <Dice5 className="w-4 h-4 shrink-0" />
                  <span>Play Online</span>
                </div>
                <p
                  className={`text-[11px] font-semibold mt-1 ${
                    config.gameMode === 'online' ? 'text-[#F8F7EF]/80' : 'text-[#171717]/70'
                  }`}
                >
                  Digital dice, animated board avatars &amp; remote turns.
                </p>
              </button>
            </div>
          </PastelCard>

          <PastelCard tone="white" className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg text-[#171717]">Host Profile & Table</h3>
              <GeometricAvatar shape={selectedAvatar} tone={selectedTone} size="md" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/75">
                Host Username
              </label>
              <input
                type="text"
                required
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="Enter your table handle"
                className="w-full px-4 py-3.5 rounded-2xl bg-[#EAEAEA]/65 border-[1.5px] border-[#171717] text-sm font-bold focus:outline-none focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/75">
                Game Session Name
              </label>
              <input
                type="text"
                required
                value={config.gameName}
                onChange={(e) => onUpdateConfig({ gameName: e.target.value })}
                className="w-full px-4 py-3.5 rounded-2xl bg-[#EAEAEA]/65 border-[1.5px] border-[#171717] text-sm font-bold focus:outline-none focus:bg-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/75">
                Choose Hero Avatar
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {AVATAR_OPTIONS.map((opt) => {
                  const active = selectedAvatar === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSelectedAvatar(opt.id);
                        setSelectedTone(opt.tone);
                      }}
                      className={`p-2.5 rounded-2xl border-[1.5px] flex flex-col items-center gap-1.5 transition-all ${
                        active
                          ? 'bg-[#FFD95A] border-[#171717] shadow-[0_3px_0_0_#171717] -translate-y-0.5'
                          : 'bg-[#F8F7EF] border-[#171717]/30 hover:border-[#171717]'
                      }`}
                    >
                      <GeometricAvatar shape={opt.id} tone={opt.tone} size="sm" />
                      <span className="text-[10px] font-bold text-[#171717] truncate w-full text-center">
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <label className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/75">
                  Min Players
                </label>
                <div className="flex items-center gap-2 mt-2">
                  {[2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() =>
                        onUpdateConfig({
                          minPlayers: n,
                          maxPlayers: Math.max(n, config.maxPlayers),
                        })
                      }
                      className={`flex-1 py-2.5 rounded-full border-[1.5px] border-[#171717] text-xs font-extrabold ${
                        config.minPlayers === n ? 'bg-[#171717] text-[#F8F7EF]' : 'bg-[#F8F7EF]'
                      }`}
                    >
                      {n}P
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/75">
                  Max Players
                </label>
                <div className="flex items-center gap-2 mt-2">
                  {[4, 5, 6].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => onUpdateConfig({ maxPlayers: Math.max(config.minPlayers, n) })}
                      className={`flex-1 py-2.5 rounded-full border-[1.5px] border-[#171717] text-xs font-extrabold ${
                        config.maxPlayers === n ? 'bg-[#171717] text-[#F8F7EF]' : 'bg-[#F8F7EF]'
                      }`}
                    >
                      {n}P
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </PastelCard>
        </div>

        {/* Right Column: Treasury & Rule Switches */}
        <div className="lg:col-span-6 space-y-5">
          <PastelCard tone="yellow" className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider block">
                  Starting Treasury Per Player
                </span>
                <span className="text-[11px] font-semibold text-[#171717]/70">
                  Dolly Plastic Standard: ₹30,000 (Coins: 10K×2, 5K×1, 1K×4, 500×1, 100×4, 50×2)
                </span>
              </div>
              <StatusBadge dark>Standard</StatusBadge>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {[30000, 25000, 50000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => onUpdateConfig({ startingMoney: amt })}
                  className={`py-3 px-3 rounded-2xl border-[1.5px] border-[#171717] font-display text-xs sm:text-sm transition-all ${
                    config.startingMoney === amt
                      ? 'bg-[#171717] text-[#F8F7EF] shadow-[0_3px_0_0_rgba(23,23,23,0.3)]'
                      : 'bg-[#F8F7EF] text-[#171717]'
                  }`}
                >
                  {formatINR(amt)}
                </button>
              ))}
            </div>
          </PastelCard>

          <PastelCard tone="white" className="p-6 space-y-4">
            <h3 className="font-display text-lg text-[#171717]">Dolly Plastic Board Rule Toggles</h3>

            {[
              {
                key: 'mustLandOnPropertyToBuy' as const,
                title: 'Must Land on Title Space to Buy',
                desc: 'Rule 3: Player can ONLY buy unowned property when pawn lands directly on that space.',
                tone: 'bg-[#FFD95A]',
              },
              {
                key: 'doublesRollAgain' as const,
                title: 'Doubles Roll Again (3 Doubles to Jail)',
                desc: 'Rule 2: Rolling doubles grants an extra roll; 3 consecutive doubles sends player to JAIL.',
                tone: 'bg-[#91D5F2]',
              },
              {
                key: 'evenBuildRule' as const,
                title: 'Even House Building Rule',
                desc: 'Rule 4: Must own full color group; build evenly across group before adding 2nd/3rd house.',
                tone: 'bg-[#A8DDB9]',
              },
              {
                key: 'doubleSetRent' as const,
                title: 'Double Base Rent on Full Color Set',
                desc: 'Rule 3: Base rent doubled on unimproved properties when owner holds complete color group.',
                tone: 'bg-[#FF9EC4]',
              },
              {
                key: 'auctionsEnabled' as const,
                title: 'Live Deed Auctions (If Declined)',
                desc: 'Rule 3: If landed player declines unowned deed, open immediately for live table bidding.',
                tone: 'bg-[#FFB66E]',
              },
              {
                key: 'bankLoansEnabled' as const,
                title: 'Central Bank Credit Line',
                desc: 'Draw bank loans subject to round interest and repayment limits.',
                tone: 'bg-[#91D5F2]',
              },
              {
                key: 'p2pLoansEnabled' as const,
                title: 'Player-to-Player Loans',
                desc: 'Allow bilateral loans, including 0% interest-free friendly deals.',
                tone: 'bg-[#A8DDB9]',
              },
            ].map((item) => {
              const enabled = config[item.key] ?? true;
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-[#EAEAEA]/45 border border-[#171717]/15"
                >
                  <div>
                    <p className="text-sm font-extrabold text-[#171717]">{item.title}</p>
                    <p className="text-xs font-medium text-[#171717]/70">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    onClick={() => onUpdateConfig({ [item.key]: !enabled })}
                    className={`w-14 h-8 rounded-full border-[1.5px] border-[#171717] p-1 transition-colors shrink-0 ${
                      enabled ? item.tone : 'bg-[#EAEAEA]'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-[#171717] transition-transform ${
                        enabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              );
            })}

            {(config.bankLoansEnabled || config.p2pLoansEnabled) && (
              <div className="p-4 rounded-2xl bg-[#91D5F2]/35 border-[1.5px] border-[#171717] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider">
                    Max Loan Interest Cap
                  </span>
                  <span className="font-display text-sm">{config.maxInterestRate}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={25}
                  step={5}
                  value={config.maxInterestRate}
                  onChange={(e) => onUpdateConfig({ maxInterestRate: Number(e.target.value) })}
                  className="w-full accent-[#171717]"
                />
                <div className="flex justify-between text-[11px] font-bold text-[#171717]/70">
                  <span>0% (Interest-Free Only)</span>
                  <span>Default {config.defaultLoanRounds} Rounds</span>
                  <span>25% Cap</span>
                </div>
              </div>
            )}
          </PastelCard>

          {/* Fixed Physical Board Economics Lock Card */}
          <div className="rounded-[24px] bg-[#EAEAEA] border-[1.5px] border-[#171717] p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#171717] text-[#FFD95A] flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#171717]">
                Fixed Physical Board Economics
              </p>
              <p className="text-xs font-medium text-[#171717]/75 mt-0.5">
                Property prices, deed rents, taxes, fines, and house/hotel construction costs are
                locked to the official physical board edition and cannot be altered.
              </p>
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
            {loading ? 'Creating Game Room...' : 'Open Multiplayer Lobby'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </form>
  );
}

export function JoinGameScreen({
  defaultRoomCode,
  onJoinLobby,
  onNavigate,
}: {
  defaultRoomCode: string;
  onJoinLobby: (roomCode: string, username: string, avatar: AvatarShapeId, tone: PastelTone) => void;
  onNavigate: (screen: ScreenId) => void;
}) {
  const [code, setCode] = useState(defaultRoomCode);
  const [username, setUsername] = useState('Rhea');
  const [avatar, setAvatar] = useState<AvatarShapeId>('spiderman');
  const [tone, setTone] = useState<PastelTone>('blue');

  useEffect(() => {
    if (defaultRoomCode) {
      setCode(defaultRoomCode);
    }
  }, [defaultRoomCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !username.trim()) return;
    onJoinLobby(code.toUpperCase().trim(), username.trim(), avatar, tone);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" onClick={() => onNavigate('welcome')}>
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/60">
            Screen 03 · Player Entry
          </p>
          <h2 className="font-display text-2xl sm:text-3xl text-[#171717]">Join Table Room</h2>
        </div>
      </div>

      <PastelCard tone="blue" elevated className="p-6 sm:p-8 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-[#171717]">
              6-Character Room Code
            </label>
            <input
              type="text"
              maxLength={8}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="BHAR-42"
              className="w-full text-center font-display text-2xl sm:text-3xl tracking-widest py-4 px-4 rounded-[22px] bg-[#F8F7EF] border-2 border-[#171717] uppercase focus:outline-none"
            />
            <div className="flex items-center justify-between text-xs font-bold px-1">
              <span className="inline-flex items-center gap-1.5 text-[#171717]">
                <ShieldCheck className="w-4 h-4" />
                Found: Friday Night Metro Club
              </span>
              <span>5 / 6 Seats Filled</span>
            </div>
          </div>

          <div className="p-5 rounded-[24px] bg-[#F8F7EF] border-[1.5px] border-[#171717] space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/75">
                Your Player Handle
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. Rhea"
                className="w-full px-4 py-3.5 rounded-2xl bg-[#EAEAEA]/65 border-[1.5px] border-[#171717] text-sm font-bold focus:outline-none focus:bg-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/75">
                Choose Your Hero Avatar
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {AVATAR_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setAvatar(opt.id);
                      setTone(opt.tone);
                    }}
                    className={`p-2.5 rounded-2xl border-[1.5px] flex flex-col items-center gap-1 transition-all ${
                      avatar === opt.id
                        ? 'bg-[#FFD95A] border-[#171717] shadow-[0_3px_0_0_#171717]'
                        : 'bg-white border-[#171717]/25 hover:border-[#171717]'
                    }`}
                  >
                    <GeometricAvatar shape={opt.id} tone={opt.tone} size="sm" />
                    <span className="text-[10px] font-bold truncate w-full text-center">
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth>
            Join Game Lobby
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      </PastelCard>
    </div>
  );
}

export function MultiplayerLobbyScreen({
  config,
  players,
  activePlayerId,
  onToggleReady,
  onAddBotPlayer,
  onStartGame,
  onNavigate,
}: {
  config: GameConfig;
  players: Player[];
  activePlayerId: string;
  onToggleReady: (playerId: string) => void;
  onAddBotPlayer: () => void;
  onStartGame: () => void;
  onNavigate: (screen: ScreenId) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(`Join "${config.gameName}" with code ${config.roomCode}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const readyCount = players.filter((p) => p.isReady).length;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => onNavigate('welcome')}>
            <ArrowLeft className="w-4 h-4" />
            Exit
          </Button>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/60">
              Screen 04 · Pre-Game Staging
            </p>
            <h2 className="font-display text-2xl sm:text-3xl text-[#171717]">{config.gameName}</h2>
          </div>
        </div>
        <StatusBadge tone="green">
          <Users className="w-3.5 h-3.5" />
          {readyCount}/{players.length} Ready
        </StatusBadge>
      </div>

      {/* Room Code Banner */}
      <PastelCard
        tone="yellow"
        elevated
        className="p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
      >
        <div className="space-y-1">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#171717]/75">
            Share Table Invitation Code
          </span>
          <div className="font-display text-3xl sm:text-4xl text-[#171717] tracking-wider">
            {config.roomCode}
          </div>
          <p className="text-xs font-semibold text-[#171717]/75">
            Mode: {config.gameMode === 'online' ? 'Online Digital Board' : 'Local Physical Board'} ·
            Starting Cash: {formatINR(config.startingMoney)} · Auctions{' '}
            {config.auctionsEnabled ? 'ON' : 'OFF'} · Max Loan Interest {config.maxInterestRate}%
          </p>
        </div>
        <Button variant="primary" size="md" onClick={handleCopy}>
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Invitation Copied!' : 'Copy Invitation'}
        </Button>
      </PastelCard>

      {/* Joined Players Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {players.map((player, idx) => (
          <PastelCard
            key={player.id}
            tone={player.id === activePlayerId ? 'green' : 'white'}
            className="p-5 flex flex-col justify-between gap-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <GeometricAvatar shape={player.avatar} tone={player.accent} size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-[#171717]">{player.name}</span>
                    {player.isHost && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#171717] text-[#FFD95A] text-[10px] font-extrabold uppercase">
                        <Crown className="w-3 h-3" />
                        Host
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-[#171717]/65">
                    Seat #{idx + 1} · Starting at START
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#171717]/12">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border border-[#171717] ${
                  player.isReady ? 'bg-[#A8DDB9]' : 'bg-[#EAEAEA]'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    player.isReady ? 'bg-[#171717]' : 'bg-[#171717]/35'
                  }`}
                />
                {player.isReady ? 'Ready' : 'Picking Token'}
              </span>

              <button
                type="button"
                onClick={() => onToggleReady(player.id)}
                className="text-xs font-extrabold underline text-[#171717] hover:opacity-75"
              >
                Toggle Ready
              </button>
            </div>
          </PastelCard>
        ))}

        {players.length < config.maxPlayers && (
          <button
            type="button"
            onClick={onAddBotPlayer}
            className="rounded-[28px] bg-[#EAEAEA]/60 border-[1.5px] border-dashed border-[#171717]/50 p-5 flex flex-col items-center justify-center gap-2 min-h-[144px] hover:bg-[#EAEAEA] transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-[#F8F7EF] border-[1.5px] border-[#171717] flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-wider">
              Seat Open ({players.length}/{config.maxPlayers}) · Add Player
            </span>
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-[28px] bg-[#171717] text-[#F8F7EF]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FFD95A] text-[#171717] flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-extrabold">
              {config.gameMode === 'online'
                ? 'Online Digital Board Ready'
                : 'Physical Board Synchronized'}
            </p>
            <p className="text-xs text-[#F8F7EF]/75">
              {config.gameMode === 'online'
                ? 'Digital dice, live avatar tokens & automated turn sync are active for all players.'
                : 'Place all physical tokens on START before pressing Start Game.'}
            </p>
          </div>
        </div>
        <Button
          variant="pastel"
          pastel="yellow"
          size="lg"
          onClick={onStartGame}
          className="w-full sm:w-auto"
        >
          Start Game Session
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
