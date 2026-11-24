"use client";

import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CheckCheck,
  CheckCircle2,
  HandCoins,
  Landmark,
  Percent,
  ReceiptText,
  Send,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import {
  AppNotification,
  GameConfig,
  LoanContract,
  PastelTone,
  Player,
  ScreenId,
  TransactionCategory,
  TransactionItem,
} from '../../types/game';
import {
  AnimatedCurrency,
  Button,
  ConfirmModal,
  EmptyStateCard,
  formatINR,
  GeometricAvatar,
  PastelCard,
  StatusBadge,
} from '../ui/Primitives';

/* ============================================================================
   SCREEN 15: LOANS DASHBOARD
============================================================================ */
export function LoansDashboardScreen({
  activePlayer,
  loans,
  onSelectLoan,
  onNavigate,
}: {
  activePlayer: Player;
  loans: LoanContract[];
  onSelectLoan: (loanId: string) => void;
  onNavigate: (screen: ScreenId) => void;
}) {
  const [tab, setTab] = useState<'taken' | 'given'>('taken');

  const loansTaken = loans.filter((l) => l.borrowerId === activePlayer.id);
  const loansGiven = loans.filter((l) => l.lenderId === activePlayer.id);
  const list = tab === 'taken' ? loansTaken : loansGiven;

  const totalOwed = loansTaken.reduce(
    (s, l) => s + Math.max(0, l.totalRepayment - l.amountRepaid),
    0
  );
  const totalReceivable = loansGiven.reduce(
    (s, l) => s + Math.max(0, l.totalRepayment - l.amountRepaid),
    0
  );

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/60">
            Screen 15 · Credit & Bilateral Banking
          </p>
          <h2 className="font-display text-2xl sm:text-3xl text-[#171717]">Loans Dashboard</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" onClick={() => onNavigate('request-loan')}>
            Request Loan
          </Button>
          <Button
            variant="pastel"
            pastel="green"
            size="sm"
            onClick={() => onNavigate('give-loan')}
          >
            Give Loan
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onNavigate('bankruptcy')}>
            Bankruptcy Desk
          </Button>
        </div>
      </div>

      {/* Summary Pair */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PastelCard tone="pink" className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/70">
              Total Outstanding Taken
            </span>
            <div className="font-display text-2xl text-[#171717] mt-1">{formatINR(totalOwed)}</div>
            <p className="text-xs font-bold text-[#171717]/75 mt-0.5">
              {loansTaken.length} active or settled agreements
            </p>
          </div>
          <Landmark className="w-8 h-8 text-[#171717]/75" />
        </PastelCard>

        <PastelCard tone="green" className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/70">
              Total Loans Given Receivable
            </span>
            <div className="font-display text-2xl text-[#171717] mt-1">
              {formatINR(totalReceivable)}
            </div>
            <p className="text-xs font-bold text-[#171717]/75 mt-0.5">
              {loansGiven.length} player credit agreements
            </p>
          </div>
          <HandCoins className="w-8 h-8 text-[#171717]/75" />
        </PastelCard>
      </div>

      {/* Two Separate Tabs: Loans Taken | Loans Given */}
      <div className="inline-flex p-1.5 rounded-full bg-[#EAEAEA] border-[1.5px] border-[#171717]">
        <button
          type="button"
          onClick={() => setTab('taken')}
          className={`px-5 py-2 rounded-full text-xs font-extrabold transition-all ${
            tab === 'taken' ? 'bg-[#171717] text-[#F8F7EF]' : 'text-[#171717]'
          }`}
        >
          Loans Taken ({loansTaken.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('given')}
          className={`px-5 py-2 rounded-full text-xs font-extrabold transition-all ${
            tab === 'given' ? 'bg-[#171717] text-[#F8F7EF]' : 'text-[#171717]'
          }`}
        >
          Loans Given ({loansGiven.length})
        </button>
      </div>

      {list.length === 0 ? (
        <EmptyStateCard
          title={tab === 'taken' ? 'No Loans Taken' : 'No Loans Given Yet'}
          description={
            tab === 'taken'
              ? 'You have zero borrowed liabilities. Request a bank or player loan anytime.'
              : 'Extend an interest-free or interest-bearing loan to another player at the table.'
          }
          actionLabel={tab === 'taken' ? 'Request Loan' : 'Give Loan'}
          onAction={() => onNavigate(tab === 'taken' ? 'request-loan' : 'give-loan')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((loan) => {
            const outstanding = Math.max(0, loan.totalRepayment - loan.amountRepaid);
            const pct =
              loan.totalRepayment > 0
                ? Math.min(100, Math.round((loan.amountRepaid / loan.totalRepayment) * 100))
                : 100;

            return (
              <PastelCard
                key={loan.id}
                tone="white"
                onClick={() => onSelectLoan(loan.id)}
                className="p-5 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#171717]/60">
                      {loan.agreementCode} · {loan.createdAt}
                    </span>
                    <h3 className="font-display text-lg text-[#171717] mt-0.5">
                      {loan.lenderName} → {loan.borrowerName}
                    </h3>
                  </div>
                  <StatusBadge
                    tone={
                      loan.status === 'settled'
                        ? 'green'
                        : loan.status === 'pending-approval'
                          ? 'orange'
                          : loan.status === 'auto-garnish'
                            ? 'pink'
                            : 'blue'
                    }
                  >
                    {loan.status}
                  </StatusBadge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#EAEAEA]/55">
                    <span className="text-[10px] font-bold uppercase text-[#171717]/60 block">
                      Principal
                    </span>
                    <span className="font-extrabold">{formatINR(loan.principal)}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#EAEAEA]/55">
                    <span className="text-[10px] font-bold uppercase text-[#171717]/60 block">
                      Interest
                    </span>
                    <span className="font-extrabold">
                      {loan.interestRate === 0 ? '0% Free' : `${loan.interestRate}%`}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FFD95A]/65">
                    <span className="text-[10px] font-bold uppercase text-[#171717]/70 block">
                      Total Due
                    </span>
                    <span className="font-extrabold">{formatINR(loan.totalRepayment)}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Repaid: {formatINR(loan.amountRepaid)}</span>
                    <span>Outstanding: {formatINR(outstanding)}</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-[#EAEAEA] border border-[#171717] overflow-hidden">
                    <div
                      className="h-full bg-[#35A862] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
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
   SCREEN 16: REQUEST LOAN
============================================================================ */
export function RequestLoanScreen({
  activePlayer,
  players,
  config,
  onRequestLoan,
  onNavigate,
}: {
  activePlayer: Player;
  players: Player[];
  config: GameConfig;
  onRequestLoan: (lenderId: string, amount: number, rate: number, terms: string) => void;
  onNavigate: (screen: ScreenId) => void;
}) {
  const [lenderId, setLenderId] = useState<string>('bank');
  const [amount, setAmount] = useState(5000);
  const [interestRate, setInterestRate] = useState(0);
  const [terms, setTerms] = useState('4 Board Rounds');

  const totalRepayment = Math.round(amount * (1 + interestRate / 100));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;
    onRequestLoan(lenderId, amount, interestRate, terms);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" onClick={() => onNavigate('loans-dashboard')}>
          <ArrowLeft className="w-4 h-4" />
          Loans
        </Button>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/60">
            Screen 16 · Borrower Proposal
          </p>
          <h2 className="font-display text-2xl sm:text-3xl text-[#171717]">Request Loan</h2>
        </div>
      </div>

      <PastelCard tone="blue" elevated className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Lender Picker */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-[#171717]">
              Select Lender
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setLenderId('bank');
                  setInterestRate(10);
                }}
                className={`p-3 rounded-2xl border-[1.5px] text-left transition-all ${
                  lenderId === 'bank'
                    ? 'bg-[#FFD95A] border-[#171717] shadow-[0_3px_0_0_#171717]'
                    : 'bg-[#F8F7EF] border-[#171717]/40'
                }`}
              >
                <Landmark className="w-4 h-4 mb-1" />
                <span className="text-xs font-extrabold block">Central Bank</span>
                <span className="text-[10px] font-semibold text-[#171717]/70">Instant Credit</span>
              </button>

              {players
                .filter((p) => p.id !== activePlayer.id && !p.isBankrupt)
                .map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setLenderId(p.id)}
                    className={`p-3 rounded-2xl border-[1.5px] text-left transition-all ${
                      lenderId === p.id
                        ? 'bg-[#FFD95A] border-[#171717] shadow-[0_3px_0_0_#171717]'
                        : 'bg-[#F8F7EF] border-[#171717]/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <GeometricAvatar shape={p.avatar} tone={p.accent} size="xs" />
                      <span className="text-xs font-extrabold truncate">{p.name}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-[#171717]/70">
                      {formatINR(p.cash)}
                    </span>
                  </button>
                ))}
            </div>
          </div>

          <div className="p-5 rounded-[24px] bg-[#F8F7EF] border-[1.5px] border-[#171717] space-y-5">
            {/* Loan Amount */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/75">
                Loan Amount (₹)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[2500, 5000, 10000, 15000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset)}
                    className={`py-2 rounded-full border border-[#171717] text-xs font-extrabold ${
                      amount === preset ? 'bg-[#171717] text-[#F8F7EF]' : 'bg-[#EAEAEA]/60'
                    }`}
                  >
                    {formatINR(preset)}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={500}
                step={500}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-2xl bg-white border-[1.5px] border-[#171717] font-display text-xl"
              />
            </div>

            {/* Proposed Interest Rate + Interest-Free Option */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/75">
                  Proposed Interest Rate
                </label>
                <button
                  type="button"
                  onClick={() => setInterestRate(0)}
                  className={`px-3 py-1 rounded-full border border-[#171717] text-[11px] font-extrabold ${
                    interestRate === 0 ? 'bg-[#A8DDB9]' : 'bg-white'
                  }`}
                >
                  0% Interest-Free
                </button>
              </div>
              <input
                type="range"
                min={0}
                max={config.maxInterestRate}
                step={1}
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full accent-[#171717]"
              />
              <div className="flex justify-between text-xs font-bold">
                <span>Proposed: {interestRate}%</span>
                <span>Rule Max: {config.maxInterestRate}%</span>
              </div>
            </div>

            {/* Repayment Terms */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/75">
                Repayment Terms
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['3 Board Rounds', '4 Board Rounds', 'Next 2 START Passes'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTerms(t)}
                    className={`p-2.5 rounded-xl border border-[#171717] text-[11px] font-extrabold ${
                      terms === t ? 'bg-[#FFD95A]' : 'bg-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#171717] text-[#F8F7EF] flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F8F7EF]/75">
              Total Scheduled Repayment
            </span>
            <span className="font-display text-xl text-[#FFD95A]">
              {formatINR(totalRepayment)}
            </span>
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth>
            Submit Loan Request
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      </PastelCard>
    </div>
  );
}

/* ============================================================================
   SCREEN 17: GIVE LOAN
============================================================================ */
export function GiveLoanScreen({
  activePlayer,
  players,
  loans,
  config,
  onGiveLoan,
  onApprovePendingLoan,
  onNavigate,
}: {
  activePlayer: Player;
  players: Player[];
  loans: LoanContract[];
  config: GameConfig;
  onGiveLoan: (borrowerId: string, amount: number, rate: number, terms: string) => void;
  onApprovePendingLoan: (loanId: string, finalRate: number) => void;
  onNavigate: (screen: ScreenId) => void;
}) {
  const eligibleBorrowers = players.filter((p) => p.id !== activePlayer.id);
  const [borrowerId, setBorrowerId] = useState(eligibleBorrowers[0]?.id ?? '');
  const [amount, setAmount] = useState(4000);
  const [interestFree, setInterestFree] = useState(false);
  const [rate, setRate] = useState(5);
  const [terms, setTerms] = useState('3 Board Rounds');

  const effectiveRate = interestFree ? 0 : rate;
  const pendingRequests = loans.filter(
    (l) => l.lenderId === activePlayer.id && l.status === 'pending-approval'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowerId || amount <= 0 || amount > activePlayer.cash) return;
    onGiveLoan(borrowerId, amount, effectiveRate, terms);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" onClick={() => onNavigate('loans-dashboard')}>
          <ArrowLeft className="w-4 h-4" />
          Loans
        </Button>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/60">
            Screen 17 · Lender Underwriting Desk
          </p>
          <h2 className="font-display text-2xl sm:text-3xl text-[#171717]">Give Player Loan</h2>
        </div>
      </div>

      {/* Pending Incoming Requests to Accept */}
      {pendingRequests.length > 0 && (
        <PastelCard tone="yellow" className="p-5 space-y-3">
          <StatusBadge dark>Incoming Borrower Request</StatusBadge>
          {pendingRequests.map((req) => (
            <div
              key={req.id}
              className="p-4 rounded-2xl bg-[#F8F7EF] border-[1.5px] border-[#171717] flex flex-wrap items-center justify-between gap-4"
            >
              <div>
                <p className="text-sm font-extrabold text-[#171717]">
                  {req.borrowerName} requested {formatINR(req.principal)}
                </p>
                <p className="text-xs font-semibold text-[#171717]/75">
                  Proposed {req.interestRate}% · {req.terms}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="pastel"
                  pastel="green"
                  size="sm"
                  onClick={() => onApprovePendingLoan(req.id, 0)}
                >
                  Accept Interest-Free (0%)
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onApprovePendingLoan(req.id, req.interestRate)}
                >
                  Accept at {req.interestRate}%
                </Button>
              </div>
            </div>
          ))}
        </PastelCard>
      )}

      <PastelCard tone="green" elevated className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-[#171717]">
              Select Borrower
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {eligibleBorrowers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setBorrowerId(p.id)}
                  className={`p-3 rounded-2xl border-[1.5px] flex flex-col items-center gap-1.5 ${
                    borrowerId === p.id
                      ? 'bg-[#FFD95A] border-[#171717] shadow-[0_3px_0_0_#171717]'
                      : 'bg-[#F8F7EF] border-[#171717]/40'
                  }`}
                >
                  <GeometricAvatar shape={p.avatar} tone={p.accent} size="sm" />
                  <span className="text-xs font-extrabold">{p.name}</span>
                  <span className="text-[10px] font-bold text-[#171717]/65">
                    {formatINR(p.cash)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-[24px] bg-[#F8F7EF] border-[1.5px] border-[#171717] space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/75">
                Principal to Disburse
              </label>
              <span className="text-xs font-bold">Available: {formatINR(activePlayer.cash)}</span>
            </div>
            <input
              type="number"
              min={500}
              max={activePlayer.cash}
              step={500}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-2xl bg-white border-[1.5px] border-[#171717] font-display text-xl"
            />

            {/* Lender-Controlled Interest Switch */}
            <div className="p-4 rounded-2xl bg-[#EAEAEA]/60 border border-[#171717]/20 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase text-[#171717]">
                    Interest-Free Friendly Loan (0%)
                  </p>
                  <p className="text-[11px] font-medium text-[#171717]/70">
                    Lender decides whether to charge interest up to {config.maxInterestRate}%.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setInterestFree(!interestFree)}
                  className={`px-3.5 py-1.5 rounded-full border border-[#171717] text-xs font-extrabold ${
                    interestFree ? 'bg-[#171717] text-[#FFD95A]' : 'bg-white'
                  }`}
                >
                  {interestFree ? '0% Active' : 'Charge Interest'}
                </button>
              </div>

              {!interestFree && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Lender Interest Rate</span>
                    <span className="font-display">{rate}%</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={config.maxInterestRate}
                    value={rate}
                    onChange={(e) => setRate(Number(e.target.value))}
                    className="w-full accent-[#171717]"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/75">
                Repayment Schedule
              </label>
              <input
                type="text"
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#171717] text-xs font-bold"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={amount > activePlayer.cash || amount <= 0}
          >
            <Percent className="w-4 h-4" />
            Accept & Disburse {formatINR(amount)} ({effectiveRate}% Interest)
          </Button>
        </form>
      </PastelCard>
    </div>
  );
}

/* ============================================================================
   SCREEN 18: LOAN DETAILS
============================================================================ */
export function LoanDetailsScreen({
  loan,
  activePlayer,
  onRepayLoan,
  onNavigate,
}: {
  loan: LoanContract;
  activePlayer: Player;
  onRepayLoan: (loanId: string, amount: number) => void;
  onNavigate: (screen: ScreenId) => void;
}) {
  const outstanding = Math.max(0, loan.totalRepayment - loan.amountRepaid);
  const pct =
    loan.totalRepayment > 0
      ? Math.min(100, Math.round((loan.amountRepaid / loan.totalRepayment) * 100))
      : 100;
  const installment = Math.min(outstanding, 2000);
  const isBorrower = loan.borrowerId === activePlayer.id;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => onNavigate('loans-dashboard')}>
            <ArrowLeft className="w-4 h-4" />
            All Loans
          </Button>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/60">
              Screen 18 · Contract #{loan.agreementCode}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl text-[#171717]">Loan Details</h2>
          </div>
        </div>
        <StatusBadge tone={outstanding === 0 ? 'green' : 'yellow'}>
          {outstanding === 0 ? 'Settled' : `${pct}% Repaid`}
        </StatusBadge>
      </div>

      <PastelCard tone="white" elevated className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#171717]/15">
          <div>
            <span className="text-xs font-extrabold uppercase text-[#171717]/60">
              Bilateral Loan Agreement
            </span>
            <h3 className="font-display text-xl text-[#171717] mt-1">
              {loan.lenderName} → {loan.borrowerName}
            </h3>
            <p className="text-xs font-semibold text-[#171717]/70 mt-0.5">{loan.terms}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-extrabold uppercase text-[#171717]/60 block">
              Outstanding Balance
            </span>
            <AnimatedCurrency amount={outstanding} className="text-2xl sm:text-3xl text-[#171717]" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#EAEAEA]/55">
            <span className="text-[10px] font-extrabold uppercase text-[#171717]/60 block">
              Original Principal
            </span>
            <span className="font-display text-sm mt-1 block">{formatINR(loan.principal)}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#EAEAEA]/55">
            <span className="text-[10px] font-extrabold uppercase text-[#171717]/60 block">
              Interest Rate
            </span>
            <span className="font-display text-sm mt-1 block">{loan.interestRate}%</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#A8DDB9]/55">
            <span className="text-[10px] font-extrabold uppercase text-[#171717]/70 block">
              Amount Repaid
            </span>
            <span className="font-display text-sm mt-1 block">{formatINR(loan.amountRepaid)}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#FFD95A]/65">
            <span className="text-[10px] font-extrabold uppercase text-[#171717]/70 block">
              Total Contract
            </span>
            <span className="font-display text-sm mt-1 block">
              {formatINR(loan.totalRepayment)}
            </span>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-extrabold">
            <span>Repayment Progress</span>
            <span>{pct}%</span>
          </div>
          <div className="w-full h-4 rounded-full bg-[#EAEAEA] border-[1.5px] border-[#171717] overflow-hidden">
            <div
              className="h-full bg-[#35A862] transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Repayment Actions */}
        {outstanding > 0 && (
          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              disabled={!isBorrower || activePlayer.cash < installment}
              onClick={() => onRepayLoan(loan.id, installment)}
            >
              Pay Installment ({formatINR(installment)})
            </Button>
            <Button
              variant="pastel"
              pastel="green"
              disabled={!isBorrower || activePlayer.cash < outstanding}
              onClick={() => onRepayLoan(loan.id, outstanding)}
            >
              Settle Full Balance ({formatINR(outstanding)})
            </Button>
            {!isBorrower && (
              <span className="text-xs font-semibold text-[#171717]/65 self-center">
                Switch active player to {loan.borrowerName} to make a borrower payment.
              </span>
            )}
          </div>
        )}

        {/* Repayment History */}
        <div className="space-y-2.5 pt-2 border-t border-[#171717]/15">
          <h4 className="font-display text-sm text-[#171717]">Repayment History</h4>
          {loan.repayments.length === 0 ? (
            <p className="text-xs font-semibold text-[#171717]/60">No repayments recorded yet.</p>
          ) : (
            loan.repayments.map((rp) => (
              <div
                key={rp.id}
                className="p-3 rounded-xl bg-[#EAEAEA]/45 flex items-center justify-between text-xs font-bold"
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#1e6b3b]" />
                  {rp.timestamp} ·{' '}
                  {rp.source === 'auto-garnish' ? 'Auto-Garnish Sweep' : 'Manual Payment'}
                </span>
                <span className="font-display">{formatINR(rp.amount)}</span>
              </div>
            ))
          )}
        </div>
      </PastelCard>
    </div>
  );
}

/* ============================================================================
   SCREEN 19: BANKRUPTCY
============================================================================ */
export function BankruptcyScreen({
  players,
  loans,
  onSimulateIncomingGarnish,
  onNavigate,
}: {
  players: Player[];
  loans: LoanContract[];
  onSimulateIncomingGarnish: (playerId: string, incomingAmount: number) => void;
  onNavigate: (screen: ScreenId) => void;
}) {
  const bankruptPlayer = players.find((p) => p.isBankrupt) ?? players[players.length - 1];
  const garnishLoans = loans.filter(
    (l) => l.borrowerId === bankruptPlayer.id && l.totalRepayment > l.amountRepaid
  );
  const totalRemaining = garnishLoans.reduce(
    (s, l) => s + Math.max(0, l.totalRepayment - l.amountRepaid),
    0
  );
  const totalOriginal = garnishLoans.reduce((s, l) => s + l.totalRepayment, 0);
  const totalPaid = garnishLoans.reduce((s, l) => s + l.amountRepaid, 0);
  const overallPct =
    totalOriginal > 0 ? Math.min(100, Math.round((totalPaid / totalOriginal) * 100)) : 100;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => onNavigate('loans-dashboard')}>
            <ArrowLeft className="w-4 h-4" />
            Loans
          </Button>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/60">
              Screen 19 · Insolvent Recovery Protocol
            </p>
            <h2 className="font-display text-2xl sm:text-3xl text-[#171717]">
              Bankruptcy & Auto-Repayment
            </h2>
          </div>
        </div>
        <StatusBadge tone="pink">
          <ShieldAlert className="w-3.5 h-3.5" /> Garnish Lock Active
        </StatusBadge>
      </div>

      <PastelCard tone="pink" elevated className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <GeometricAvatar shape={bankruptPlayer.avatar} tone="white" size="lg" />
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/75">
                Protected Debtor Account
              </span>
              <h3 className="font-display text-2xl text-[#171717]">{bankruptPlayer.name}</h3>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            disabled={totalRemaining === 0}
            onClick={() => onSimulateIncomingGarnish(bankruptPlayer.id, 3000)}
          >
            <Sparkles className="w-4 h-4" />
            Simulate +₹3,000 Incoming Cash
          </Button>
        </div>

        {/* Spendable Balance vs Remaining Liabilities */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-[#F8F7EF] border-[1.5px] border-[#171717]">
            <span className="text-xs font-extrabold uppercase text-[#171717]/65 block">
              Spendable Balance
            </span>
            <AnimatedCurrency
              amount={bankruptPlayer.cash}
              className="text-3xl text-[#171717] mt-1"
            />
            <p className="text-[11px] font-bold text-[#171717]/65 mt-1">
              Unlocks once all lender queues reach ₹0
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#171717] text-[#F8F7EF] border-[1.5px] border-[#171717]">
            <span className="text-xs font-extrabold uppercase text-[#FF9EC4] block">
              Remaining Liabilities
            </span>
            <AnimatedCurrency amount={totalRemaining} className="text-3xl text-[#FFD95A] mt-1" />
            <p className="text-[11px] font-semibold text-[#F8F7EF]/75 mt-1">
              Across {garnishLoans.length} priority creditors
            </p>
          </div>
        </div>

        {/* Rule Explanation Box */}
        <div className="p-4 rounded-2xl bg-[#FFD95A] border-[1.5px] border-[#171717] flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm font-bold text-[#171717]">
            Automatic Allocation Rule: Every rupee of incoming money (START salary, rent collected,
            or player transfers) is automatically routed to outstanding lenders in priority order
            before any cash becomes spendable.
          </p>
        </div>

        {/* Overall Recovery Progress + Lender Breakdown */}
        <div className="p-5 rounded-[24px] bg-[#F8F7EF] border-[1.5px] border-[#171717] space-y-4">
          <div className="flex justify-between text-xs font-extrabold">
            <span>Automatic Repayment Progress</span>
            <span>{overallPct}% Recovered</span>
          </div>
          <div className="w-full h-4 rounded-full bg-[#EAEAEA] border border-[#171717] overflow-hidden">
            <div
              className="h-full bg-[#35A862] transition-all duration-500"
              style={{ width: `${overallPct}%` }}
            />
          </div>

          <div className="space-y-2.5 pt-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/65">
              Creditor Priority Queue
            </span>
            {garnishLoans.length === 0 ? (
              <p className="text-sm font-extrabold text-[#1e6b3b]">
                All debts cleared! {bankruptPlayer.name}’s cash is now 100% spendable.
              </p>
            ) : (
              garnishLoans.map((ln, idx) => {
                const rem = Math.max(0, ln.totalRepayment - ln.amountRepaid);
                return (
                  <div
                    key={ln.id}
                    className="p-3.5 rounded-2xl bg-[#EAEAEA]/60 border border-[#171717]/20 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-extrabold text-[#171717]">
                        Priority #{idx + 1} · {ln.lenderName}
                      </p>
                      <p className="text-xs font-semibold text-[#171717]/65">
                        Repaid {formatINR(ln.amountRepaid)} of {formatINR(ln.totalRepayment)}
                      </p>
                    </div>
                    <span className="font-display text-sm text-[#171717]">{formatINR(rem)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </PastelCard>
    </div>
  );
}

/* ============================================================================
   SCREEN 20: SEND MONEY
============================================================================ */
export function SendMoneyScreen({
  activePlayer,
  players,
  onSendMoney,
  onNavigate,
}: {
  activePlayer: Player;
  players: Player[];
  onSendMoney: (recipientId: string, amount: number, note: string) => void;
  onNavigate: (screen: ScreenId) => void;
}) {
  const recipients = players.filter((p) => p.id !== activePlayer.id);
  const [recipientId, setRecipientId] = useState(recipients[0]?.id ?? '');
  const [amount, setAmount] = useState(1500);
  const [note, setNote] = useState('Trade Deal Settlement');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const selectedRecipient = players.find((p) => p.id === recipientId);
  const invalid = amount <= 0 || amount > activePlayer.cash || !recipientId;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" onClick={() => onNavigate('dashboard')}>
          <ArrowLeft className="w-4 h-4" />
          Home
        </Button>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/60">
            Screen 20 · Instant Cash Transfer
          </p>
          <h2 className="font-display text-2xl sm:text-3xl text-[#171717]">Send Money</h2>
        </div>
      </div>

      <PastelCard tone="yellow" elevated className="p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F8F7EF] border-[1.5px] border-[#171717]">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/70">
            Your Available Balance
          </span>
          <AnimatedCurrency amount={activePlayer.cash} className="text-xl text-[#171717]" />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-extrabold uppercase tracking-wider text-[#171717]">
            Choose Recipient Player
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {recipients.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setRecipientId(p.id)}
                className={`p-3 rounded-2xl border-[1.5px] flex flex-col items-center gap-1.5 transition-all ${
                  recipientId === p.id
                    ? 'bg-[#171717] text-[#F8F7EF] border-[#171717]'
                    : 'bg-[#F8F7EF] text-[#171717] border-[#171717]/40'
                }`}
              >
                <GeometricAvatar shape={p.avatar} tone={p.accent} size="sm" />
                <span className="text-xs font-extrabold">{p.name}</span>
                <span className="text-[10px] opacity-75 font-bold">{formatINR(p.cash)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-[24px] bg-[#F8F7EF] border-[1.5px] border-[#171717] space-y-4">
          <label className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/70 block">
            Transfer Amount (₹)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[500, 1000, 2000, 5000].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmount(v)}
                className={`py-2 rounded-full border border-[#171717] text-xs font-extrabold ${
                  amount === v ? 'bg-[#FF9EC4]' : 'bg-white'
                }`}
              >
                {formatINR(v)}
              </button>
            ))}
          </div>
          <input
            type="number"
            min={100}
            step={100}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full px-4 py-3.5 rounded-2xl bg-white border-[1.5px] border-[#171717] font-display text-2xl"
          />
          {amount > activePlayer.cash && (
            <p className="text-xs font-extrabold text-rose-800">
              Amount exceeds your spendable balance of {formatINR(activePlayer.cash)}.
            </p>
          )}
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Memo (e.g., Trade Deal, Immunity Pass)"
            className="w-full px-4 py-2.5 rounded-xl bg-[#EAEAEA]/60 border border-[#171717]/30 text-xs font-bold"
          />
        </div>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={invalid}
          onClick={() => setConfirmOpen(true)}
        >
          <Send className="w-4 h-4" />
          Review & Send {formatINR(amount)}
        </Button>
      </PastelCard>

      <ConfirmModal
        open={confirmOpen}
        title={`Send ${formatINR(amount)} to ${selectedRecipient?.name}?`}
        subtitle="Balances and leaderboard net worth update immediately across all devices."
        tone="pink"
        confirmLabel="Confirm Transfer"
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          onSendMoney(recipientId, amount, note);
          setConfirmOpen(false);
        }}
      >
        <div className="p-3.5 rounded-2xl bg-[#EAEAEA]/60 text-xs font-bold space-y-1">
          <div className="flex justify-between">
            <span>From:</span>
            <span>{activePlayer.name}</span>
          </div>
          <div className="flex justify-between">
            <span>To:</span>
            <span>{selectedRecipient?.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Memo:</span>
            <span>{note}</span>
          </div>
        </div>
      </ConfirmModal>
    </div>
  );
}

/* ============================================================================
   SCREEN 21: TRANSACTION HISTORY
============================================================================ */
const TX_CATEGORY_META: Record<
  string,
  { label: string; tone: PastelTone }
> = {
  'rent-paid': { label: 'Rent Paid', tone: 'pink' },
  'rent-received': { label: 'Rent Received', tone: 'green' },
  rent: { label: 'Rent', tone: 'pink' },
  transfer: { label: 'Transfers', tone: 'blue' },
  'property-purchase': { label: 'Purchases', tone: 'yellow' },
  purchase: { label: 'Purchases', tone: 'yellow' },
  house_build: { label: 'Houses', tone: 'yellow' },
  hotel_build: { label: 'Hotels', tone: 'yellow' },
  mortgage: { label: 'Mortgages', tone: 'orange' },
  unmortgage: { label: 'Mortgages', tone: 'green' },
  auction: { label: 'Auctions', tone: 'orange' },
  auction_payment: { label: 'Auctions', tone: 'orange' },
  'loan-repayment': { label: 'Loans', tone: 'blue' },
  loan_disbursement: { label: 'Loans', tone: 'blue' },
  loan_repayment: { label: 'Loans', tone: 'blue' },
  debt_recovery: { label: 'Debt Recovery', tone: 'pink' },
  tax: { label: 'Taxes', tone: 'pink' },
  jail: { label: 'Jail', tone: 'pink' },
  jail_fine: { label: 'Jail Fine', tone: 'pink' },
  reward: { label: 'Rewards', tone: 'green' },
  start_reward: { label: 'START Reward', tone: 'green' },
  club_fee: { label: 'Club', tone: 'yellow' },
  special_card: { label: 'Card Event', tone: 'blue' },
};

const MAIN_TX_CATEGORIES: TransactionCategory[] = [
  'rent-paid',
  'rent-received',
  'transfer',
  'property-purchase',
  'auction',
  'loan-repayment',
  'tax',
  'reward',
];

export function TransactionHistoryScreen({
  transactions,
}: {
  transactions: TransactionItem[];
}) {
  const [selectedCat, setSelectedCat] = useState<'all' | string>('all');

  const visible =
    selectedCat === 'all'
      ? transactions
      : transactions.filter((t) => t.category === selectedCat);

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/60">
            Screen 21 · Complete Table Ledger
          </p>
          <h2 className="font-display text-2xl sm:text-3xl text-[#171717]">Transaction History</h2>
        </div>
        <StatusBadge tone="yellow">
          <ReceiptText className="w-3.5 h-3.5" /> {transactions.length} Entries
        </StatusBadge>
      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedCat('all')}
          className={`px-3.5 py-1.5 rounded-full border border-[#171717] text-xs font-extrabold ${
            selectedCat === 'all' ? 'bg-[#171717] text-[#F8F7EF]' : 'bg-[#F8F7EF]'
          }`}
        >
          All Activity
        </button>
        {MAIN_TX_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCat(cat)}
            className={`px-3.5 py-1.5 rounded-full border border-[#171717] text-xs font-extrabold ${
              selectedCat === cat ? 'bg-[#171717] text-[#F8F7EF]' : 'bg-[#F8F7EF]'
            }`}
          >
            {TX_CATEGORY_META[cat]?.label || cat}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyStateCard
          title="No Transactions in This Filter"
          description="Switch back to All Activity to inspect rent, deeds, gavel wins, loans, taxes, and START rewards."
          actionLabel="Show All"
          onAction={() => setSelectedCat('all')}
        />
      ) : (
        <div className="space-y-3">
          {visible.map((tx) => {
            const meta = TX_CATEGORY_META[tx.category] || {
              label: tx.title || tx.category || 'Transaction',
              tone: (tx.pastel || (tx.direction === 'in' ? 'green' : tx.direction === 'out' ? 'pink' : 'yellow')) as PastelTone,
            };
            return (
              <PastelCard key={tx.id} tone="white" className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <PastelCard
                      tone={meta.tone}
                      className="w-11 h-11 !rounded-2xl flex items-center justify-center shrink-0 !shadow-none"
                    >
                      {tx.direction === 'in' ? (
                        <ArrowDownLeft className="w-5 h-5" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5" />
                      )}
                    </PastelCard>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-[#171717] truncate">
                          {tx.title}
                        </span>
                        <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                      </div>
                      <p className="text-xs font-medium text-[#171717]/70 mt-0.5 truncate">
                        {tx.fromName} → {tx.toName} · {tx.subtitle} · {tx.timestamp}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`font-display text-sm sm:text-base ${
                        tx.direction === 'in' ? 'text-[#1e6b3b]' : 'text-[#171717]'
                      }`}
                    >
                      {tx.direction === 'in' ? '+' : '-'}
                      {formatINR(tx.amount)}
                    </span>
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
   SCREEN 22: NOTIFICATIONS
============================================================================ */
export function NotificationsScreen({
  notifications,
  onMarkAllRead,
  onOpenNotification,
}: {
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onOpenNotification: (notif: AppNotification) => void;
}) {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const list = unreadOnly ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#171717]/60">
            Screen 22 · Live Alert Center
          </p>
          <h2 className="font-display text-2xl sm:text-3xl text-[#171717]">Notifications</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setUnreadOnly(!unreadOnly)}
          >
            {unreadOnly ? 'Show All' : 'Unread Only'}
          </Button>
          <Button variant="primary" size="sm" onClick={onMarkAllRead}>
            <CheckCheck className="w-4 h-4" />
            Mark All Read
          </Button>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyStateCard
          title="All Caught Up"
          description="Zero unread rent requests, auction outbids, or loan alerts right now."
          actionLabel="View All Alerts"
          onAction={() => setUnreadOnly(false)}
        />
      ) : (
        <div className="space-y-3">
          {list.map((notif) => (
            <PastelCard
              key={notif.id}
              tone={notif.read ? 'white' : notif.pastel}
              onClick={() => onOpenNotification(notif)}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#171717] text-[#F8F7EF] flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    {!notif.read && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#171717] shrink-0" />
                    )}
                    <h3 className="text-sm sm:text-base font-extrabold text-[#171717]">
                      {notif.title}
                    </h3>
                    <span className="text-[11px] font-bold text-[#171717]/60">
                      {notif.timestamp}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-[#171717]/80 mt-1">
                    {notif.message}
                  </p>
                </div>
              </div>

              {notif.ctaLabel && (
                <Button variant="primary" size="sm" className="shrink-0">
                  {notif.ctaLabel}
                </Button>
              )}
            </PastelCard>
          ))}
        </div>
      )}
    </div>
  );
}
