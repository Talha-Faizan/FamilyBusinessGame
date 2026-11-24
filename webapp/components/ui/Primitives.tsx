"use client";

import React, { useEffect, useRef, useState } from 'react';
import { AvatarShapeId, PastelTone } from '../../types/game';
import { Building2, Home, Loader2, X } from 'lucide-react';

export function formatINR(value: number, showSign = false): string {
  const num = Number(value);
  const safe = Number.isFinite(num) ? num : 0;
  const abs = Math.abs(Math.round(safe));
  const formatted = abs.toLocaleString('en-IN');
  if (safe < 0) return `-₹${formatted}`;
  if (showSign && safe > 0) return `+₹${formatted}`;
  return `₹${formatted}`;
}

export const PASTEL_BG_CLASSES: Record<PastelTone, string> = {
  yellow: 'bg-[#FFD95A]',
  pink: 'bg-[#FF9EC4]',
  blue: 'bg-[#91D5F2]',
  green: 'bg-[#A8DDB9]',
  orange: 'bg-[#FFB66E]',
  white: 'bg-[#F8F7EF]',
  gray: 'bg-[#EAEAEA]',
};

export const AVATAR_OPTIONS: { id: AvatarShapeId; label: string; tone: PastelTone }[] = [
  { id: 'prism', label: 'Solar Prism', tone: 'yellow' },
  { id: 'orbit', label: 'Orbital Ring', tone: 'blue' },
  { id: 'arch-duo', label: 'Twin Arch', tone: 'green' },
  { id: 'starburst', label: 'Octa Star', tone: 'orange' },
  { id: 'monolith', label: 'Split Pillar', tone: 'pink' },
  { id: 'crown-geo', label: 'Apex Crown', tone: 'yellow' },
  { id: 'diamond-grid', label: 'Quad Rhombus', tone: 'blue' },
  { id: 'stepped-hex', label: 'Step Terrace', tone: 'green' },
];

function AvatarGlyphSvg({
  shape,
  className = 'w-[62%] h-[62%]',
}: {
  shape: AvatarShapeId;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none">
      {shape === 'prism' && (
        <>
          <polygon
            points="20,5 34,31 6,31"
            fill="#171717"
            stroke="#171717"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="20" cy="22" r="5" fill="#F8F7EF" />
        </>
      )}
      {shape === 'orbit' && (
        <>
          <circle cx="20" cy="20" r="12" stroke="#171717" strokeWidth="3.5" />
          <circle cx="20" cy="20" r="5.5" fill="#171717" />
          <circle cx="29" cy="11" r="3.5" fill="#F8F7EF" stroke="#171717" strokeWidth="2" />
        </>
      )}
      {shape === 'arch-duo' && (
        <>
          <path
            d="M8 32V18C8 11.3726 13.3726 6 20 6C26.6274 6 32 11.3726 32 18V32H24V18C24 15.7909 22.2091 14 20 14C17.7909 14 16 15.7909 16 18V32H8Z"
            fill="#171717"
          />
          <circle cx="20" cy="25" r="3.5" fill="#171717" />
        </>
      )}
      {shape === 'starburst' && (
        <>
          <path
            d="M20 4L24.2 13.8L34 15L26.8 22L28.8 32L20 27L11.2 32L13.2 22L6 15L15.8 13.8L20 4Z"
            fill="#171717"
            stroke="#171717"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <rect x="16.5" y="16.5" width="7" height="7" rx="2" fill="#F8F7EF" />
        </>
      )}
      {shape === 'monolith' && (
        <>
          <rect x="8" y="7" width="10" height="26" rx="5" fill="#171717" />
          <rect
            x="22"
            y="13"
            width="10"
            height="20"
            rx="5"
            fill="#F8F7EF"
            stroke="#171717"
            strokeWidth="2.5"
          />
          <circle cx="27" cy="8.5" r="2.8" fill="#171717" />
        </>
      )}
      {shape === 'crown-geo' && (
        <>
          <path
            d="M6 29L9 12L16.5 19L20 9L23.5 19L31 12L34 29H6Z"
            fill="#171717"
            stroke="#171717"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <rect x="9" y="31" width="22" height="3.5" rx="1.75" fill="#171717" />
        </>
      )}
      {shape === 'diamond-grid' && (
        <>
          <rect
            x="20"
            y="5"
            width="12"
            height="12"
            rx="2.5"
            transform="rotate(45 20 5)"
            fill="#171717"
          />
          <rect
            x="20"
            y="18"
            width="12"
            height="12"
            rx="2.5"
            transform="rotate(45 20 18)"
            fill="#F8F7EF"
            stroke="#171717"
            strokeWidth="2.5"
          />
        </>
      )}
      {shape === 'stepped-hex' && (
        <>
          <rect x="7" y="23" width="26" height="8" rx="3" fill="#171717" />
          <rect x="11" y="15" width="18" height="8" rx="3" fill="#171717" />
          <rect
            x="15"
            y="7"
            width="10"
            height="8"
            rx="3"
            fill="#F8F7EF"
            stroke="#171717"
            strokeWidth="2.5"
          />
        </>
      )}
    </svg>
  );
}

export function GeometricAvatar({
  shape,
  tone = 'yellow',
  size = 'md',
  circular = false,
  className = '',
}: {
  shape: AvatarShapeId;
  tone?: PastelTone;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  circular?: boolean;
  className?: string;
}) {
  const dims = {
    xs: circular ? 'w-7 h-7 rounded-full' : 'w-7 h-7 rounded-xl',
    sm: circular ? 'w-9 h-9 rounded-full' : 'w-9 h-9 rounded-2xl',
    md: circular ? 'w-12 h-12 rounded-full' : 'w-12 h-12 rounded-2xl',
    lg: circular ? 'w-16 h-16 rounded-full' : 'w-16 h-16 rounded-[22px]',
    xl: circular ? 'w-20 h-20 rounded-full' : 'w-20 h-20 rounded-[26px]',
  }[size];

  return (
    <div
      className={`${dims} ${PASTEL_BG_CLASSES[tone]} border-[1.5px] border-[#171717] flex items-center justify-center shrink-0 select-none shadow-[0_2px_0_0_#171717] ${className}`}
      aria-hidden="true"
    >
      <AvatarGlyphSvg shape={shape} />
    </div>
  );
}

export function BoardPlayerToken({
  name,
  avatar,
  tone = 'yellow',
  isTurn = false,
  isSelf = false,
  isMoving = false,
  size = 'sm',
}: {
  name: string;
  avatar: AvatarShapeId;
  tone?: PastelTone;
  isTurn?: boolean;
  isSelf?: boolean;
  isMoving?: boolean;
  size?: 'xs' | 'sm' | 'md';
}) {
  const badgeDims =
    size === 'xs'
      ? 'w-6 h-6 rounded-full'
      : size === 'md'
        ? 'w-9 h-9 rounded-full'
        : 'w-7 h-7 rounded-full';

  return (
    <div
      title={`${name}${isSelf ? ' (You)' : ''}${isTurn ? ' · Current Turn' : ''}`}
      className={`relative inline-flex items-center justify-center shrink-0 transition-transform duration-200 ${
        isMoving ? 'animate-pawn-hop z-30 scale-115' : isTurn ? 'z-20' : 'z-10'
      }`}
    >
      {isTurn && !isMoving && (
        <span
          aria-hidden="true"
          className="absolute -inset-1 rounded-full border-2 border-[#171717] bg-[#FFD95A]/45 animate-pulse pointer-events-none"
        />
      )}
      <div
        className={`relative ${badgeDims} ${PASTEL_BG_CLASSES[tone]} border-[2px] border-[#171717] shadow-[0_2px_0_0_#171717] flex items-center justify-center overflow-hidden`}
      >
        <AvatarGlyphSvg shape={avatar} className="w-[70%] h-[70%]" />
      </div>
    </div>
  );
}

export function AnimatedCurrency({
  amount,
  className = '',
  showSign = false,
}: {
  amount: number;
  className?: string;
  showSign?: boolean;
}) {
  const [display, setDisplay] = useState(amount);
  const [deltaDir, setDeltaDir] = useState<'up' | 'down' | null>(null);
  const prevRef = useRef(amount);

  useEffect(() => {
    const start = prevRef.current;
    const end = amount;
    if (start === end) return;

    setDeltaDir(end > start ? 'up' : 'down');
    const duration = 420;
    const startTime = performance.now();
    let raf = 0;

    const step = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      } else {
        prevRef.current = end;
      }
    };

    raf = requestAnimationFrame(step);
    const clearTimer = window.setTimeout(() => setDeltaDir(null), 900);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(clearTimer);
    };
  }, [amount]);

  return (
    <span
      className={`font-display inline-block transition-transform duration-300 ${
        deltaDir === 'up'
          ? 'scale-[1.04] text-emerald-900'
          : deltaDir === 'down'
            ? 'scale-[0.98] text-rose-900'
            : ''
      } ${className}`}
    >
      {formatINR(display, showSign)}
    </span>
  );
}

export function Button({
  children,
  variant = 'primary',
  pastel = 'yellow',
  size = 'md',
  fullWidth = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'pastel' | 'ghost' | 'danger';
  pastel?: PastelTone;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'px-4 py-2 text-xs font-bold gap-1.5',
    md: 'px-5 py-3 text-sm font-bold gap-2',
    lg: 'px-7 py-4 text-base font-extrabold gap-2.5',
  }[size];

  const variantClasses = {
    primary:
      'bg-[#171717] text-[#F8F7EF] border-[1.5px] border-[#171717] shadow-[0_4px_0_0_rgba(23,23,23,0.28)] hover:-translate-y-0.5 active:translate-y-0.5',
    secondary:
      'bg-[#F8F7EF] text-[#171717] border-[1.5px] border-[#171717] shadow-[0_3px_0_0_#171717] hover:bg-white hover:-translate-y-0.5 active:translate-y-0.5',
    pastel: `${PASTEL_BG_CLASSES[pastel]} text-[#171717] border-[1.5px] border-[#171717] shadow-[0_4px_0_0_#171717] hover:-translate-y-0.5 active:translate-y-0.5`,
    ghost:
      'bg-transparent text-[#171717] border-[1.5px] border-transparent hover:bg-[#171717]/6 active:scale-[0.98]',
    danger:
      'bg-[#FF9EC4] text-[#171717] border-[1.5px] border-[#171717] shadow-[0_4px_0_0_#171717] hover:-translate-y-0.5 active:translate-y-0.5',
  }[variant];

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full inline-flex items-center justify-center transition-all duration-150 select-none ${sizeClasses} ${variantClasses} ${
        fullWidth ? 'w-full' : ''
      } ${disabled ? 'opacity-45 pointer-events-none shadow-none' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

export function IconButton({
  children,
  onClick,
  badgeCount,
  label,
  tone = 'white',
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  badgeCount?: number;
  label: string;
  tone?: PastelTone;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`relative w-11 h-11 rounded-full ${PASTEL_BG_CLASSES[tone]} border-[1.5px] border-[#171717] shadow-[0_3px_0_0_#171717] flex items-center justify-center hover:-translate-y-0.5 active:translate-y-0.5 transition-all ${className}`}
    >
      {children}
      {typeof badgeCount === 'number' && badgeCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[#FF9EC4] border-[1.5px] border-[#171717] text-[10px] font-extrabold text-[#171717] flex items-center justify-center">
          {badgeCount}
        </span>
      )}
    </button>
  );
}

export function PastelCard({
  children,
  tone = 'white',
  elevated = false,
  onClick,
  className = '',
}: {
  children: React.ReactNode;
  tone?: PastelTone;
  elevated?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const interactive = Boolean(onClick);
  return (
    <div
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={`rounded-[28px] ${PASTEL_BG_CLASSES[tone]} border-[1.5px] border-[#171717] ${
        elevated
          ? 'shadow-[0_6px_0_0_#171717]'
          : 'shadow-[0_3px_0_0_rgba(23,23,23,0.9)]'
      } ${
        interactive
          ? 'cursor-pointer hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-150'
          : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function StatusBadge({
  children,
  tone = 'yellow',
  dark = false,
  className = '',
}: {
  children: React.ReactNode;
  tone?: PastelTone;
  dark?: boolean;
  className?: string;
}) {
  if (dark) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#171717] text-[#F8F7EF] text-[11px] font-bold tracking-wide uppercase ${className}`}
      >
        {children}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${PASTEL_BG_CLASSES[tone]} border border-[#171717] text-[#171717] text-[11px] font-bold tracking-wide uppercase ${className}`}
    >
      {children}
    </span>
  );
}

export function HouseHotelIndicator({
  houses,
  hasHotel,
  isMortgaged,
  compact = false,
}: {
  houses: number;
  hasHotel: boolean;
  isMortgaged?: boolean;
  compact?: boolean;
}) {
  if (isMortgaged) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EAEAEA] border border-[#171717] text-[10px] font-extrabold uppercase tracking-wider text-[#171717]">
        Mortgaged
      </span>
    );
  }
  if (hasHotel) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FF9EC4] border border-[#171717] text-[11px] font-extrabold text-[#171717]">
        <Building2 className="w-3.5 h-3.5" />
        {!compact && '1 Hotel'}
      </span>
    );
  }
  if (houses > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#A8DDB9] border border-[#171717] text-[11px] font-extrabold text-[#171717]">
        <span className="flex items-center gap-0.5">
          {Array.from({ length: houses }).map((_, idx) => (
            <Home key={idx} className="w-3 h-3 fill-[#171717]" />
          ))}
        </span>
        {!compact && `${houses} ${houses === 1 ? 'House' : 'Houses'}`}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#F8F7EF]/90 border border-[#171717]/30 text-[10px] font-semibold text-[#171717]/70">
      Base Site
    </span>
  );
}

export function DiceFace({
  value,
  selected = false,
  rolling = false,
  size = 'md',
  onClick,
}: {
  value: number;
  selected?: boolean;
  rolling?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}) {
  const dims = {
    sm: 'w-11 h-11 rounded-2xl',
    md: 'w-16 h-16 rounded-[20px]',
    lg: 'w-24 h-24 rounded-[28px]',
  }[size];

  const pipsByValue: Record<number, [number, number][]> = {
    1: [[50, 50]],
    2: [
      [28, 28],
      [72, 72],
    ],
    3: [
      [28, 28],
      [50, 50],
      [72, 72],
    ],
    4: [
      [28, 28],
      [72, 28],
      [28, 72],
      [72, 72],
    ],
    5: [
      [28, 28],
      [72, 28],
      [50, 50],
      [28, 72],
      [72, 72],
    ],
    6: [
      [28, 24],
      [72, 24],
      [28, 50],
      [72, 50],
      [28, 76],
      [72, 76],
    ],
  };

  const pips = pipsByValue[value] ?? pipsByValue[1];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${dims} ${
        selected ? 'bg-[#FFD95A] -translate-y-0.5' : 'bg-[#F8F7EF] hover:bg-white'
      } border-2 border-[#171717] shadow-[0_5px_0_0_#171717] flex items-center justify-center transition-all ${
        rolling ? 'animate-dice' : ''
      }`}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {pips.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="9.5" fill="#171717" />
        ))}
      </svg>
    </button>
  );
}

export function ConfirmModal({
  open,
  title,
  subtitle,
  tone = 'yellow',
  confirmLabel = 'Confirm Action',
  onConfirm,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  tone?: PastelTone;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-[#171717]/55 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-[32px] bg-[#F8F7EF] border-2 border-[#171717] shadow-[0_10px_0_0_#171717] overflow-hidden animate-slide-up">
        <div className={`${PASTEL_BG_CLASSES[tone]} px-6 py-5 border-b-[1.5px] border-[#171717] flex items-start justify-between gap-4`}>
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#171717]/70">
              Verify Board Action
            </p>
            <h3 className="font-display text-lg text-[#171717] mt-1">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#F8F7EF] border border-[#171717] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {subtitle && <p className="text-sm font-medium text-[#171717]/80">{subtitle}</p>}
          {children}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmptyStateCard({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-[28px] bg-[#EAEAEA]/65 border-[1.5px] border-dashed border-[#171717]/45 p-8 text-center flex flex-col items-center justify-center gap-3">
      <div className="w-14 h-14 rounded-2xl bg-[#FFD95A] border-[1.5px] border-[#171717] flex items-center justify-center shadow-[0_3px_0_0_#171717]">
        <div className="w-5 h-5 rounded-md border-2 border-[#171717] rotate-45" />
      </div>
      <h4 className="font-display text-base text-[#171717] mt-1">{title}</h4>
      <p className="text-xs sm:text-sm font-medium text-[#171717]/70 max-w-xs">{description}</p>
      {actionLabel && onAction && (
        <div className="pt-2">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

export function LoadingSkeletonCard({ label = 'Syncing table ledger...' }: { label?: string }) {
  return (
    <div className="rounded-[28px] bg-[#F8F7EF] border-[1.5px] border-[#171717] p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-[#171717]" />
        <span className="text-xs font-bold uppercase tracking-wider text-[#171717]/75">
          {label}
        </span>
      </div>
      <div className="h-7 w-2/5 rounded-full bg-[#EAEAEA] animate-pulse" />
      <div className="grid grid-cols-3 gap-3">
        <div className="h-16 rounded-2xl bg-[#FFD95A]/45 animate-pulse" />
        <div className="h-16 rounded-2xl bg-[#91D5F2]/45 animate-pulse" />
        <div className="h-16 rounded-2xl bg-[#A8DDB9]/45 animate-pulse" />
      </div>
    </div>
  );
}
