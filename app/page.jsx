"use client";
// @ts-nocheck
import { useState, useEffect } from "react";

// ─── RATER ENGINE ────────────────────────────────────────────────────────────
function generateQuoteNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `QCL-TN-${ts}-${rand}`;
}

function generatePolicyNumber(quoteNumber: string) {
  return quoteNumber.replace("QCL-TN-", "POL-TN-");
}

const BASE_RATES = {
  "single_family": 2.15,
  "multifamily_2_4": 2.75,
  "multifamily_5_8": 3.40,
};

const LIMIT_FACTORS = {
  "500k/1M": { factor: 0.82, label: "$500K / $1M" },
  "1M/2M":   { factor: 1.00, label: "$1M / $2M" },
  "2M/4M":   { factor: 1.18, label: "$2M / $4M" },
};

const TERM_FACTORS = {
  3:  { factor: 0.35, label: "3 Months" },
  6:  { factor: 0.60, label: "6 Months" },
  9:  { factor: 0.80, label: "9 Months" },
  12: { factor: 1.00, label: "12 Months" },
  18: { factor: 1.40, label: "18 Months" },
  24: { factor: 1.75, label: "24 Months" },
};

const BUILDING_TYPE_LABELS = {
  "single_family":   "Single Family Residential",
  "multifamily_2_4": "Multi-Family (2–4 Units)",
  "multifamily_5_8": "Multi-Family (5–8 Units)",
};

function rateSubmission(input: any) {
  const tcv = parseFloat(input.totalContractValue) || 0;
  const baseRate = BASE_RATES[input.buildingType];
  const basePremium = (tcv / 1000) * baseRate;

  const limitInfo = LIMIT_FACTORS[input.limits];
  const termInfo = TERM_FACTORS[parseInt(input.term)];

  const afterLimits = basePremium * limitInfo.factor;
  const afterTerm = afterLimits * termInfo.factor;
  const minimumPremium = 500;
  const minimumApplied = afterTerm < minimumPremium;
  const finalPremium = Math.max(afterTerm, minimumPremium);

  const tnSurplusLinesTax = finalPremium * 0.06;
  const stampingFee = finalPremium * 0.002;
  const policyFee = 150;
  const totalDue = finalPremium + tnSurplusLinesTax + stampingFee + policyFee;

  // Compute end date
  const start = new Date(input.startDate);
  const end = new Date(start);
  end.setMonth(end.getMonth() + parseInt(input.term));

  return {
    quoteNumber: generateQuoteNumber(),
    worksheet: {
      tcv,
      baseRate,
      basePremium,
      limitFactor: limitInfo.factor,
      limitLabel: limitInfo.label,
      afterLimits,
      termFactor: termInfo.factor,
      termLabel: termInfo.label,
      afterTerm,
      minimumPremium,
      minimumApplied,
      finalPremium,
      tnSurplusLinesTax,
      stampingFee,
      policyFee,
      totalDue,
    },
    policyPeriod: {
      start: start.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      end: end.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      startRaw: input.startDate,
    },
    input,
  };
}

const fmt = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy: #0d1f3c;
    --navy-mid: #162d56;
    --gold: #c9a84c;
    --gold-light: #e8c97a;
    --cream: #faf7f2;
    --cream-dark: #f0ebe0;
    --text: #1a1a2e;
    --text-muted: #6b7a99;
    --white: #ffffff;
    --success: #1a6b4a;
    --border: rgba(13,31,60,0.12);
    --shadow: 0 4px 24px rgba(13,31,60,0.10);
    --shadow-lg: 0 12px 48px rgba(13,31,60,0.16);
  }

  body { 
    font-family: 'DM Sans', sans-serif; 
    background: var(--cream);
    color: var(--text);
    min-height: 100vh;
  }

  .app-wrap {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* HEADER */
  .header {
    background: var(--navy);
    padding: 0 48px;
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 3px solid var(--gold);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo-mark {
    width: 38px;
    height: 38px;
    background: var(--gold);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'DM Serif Display', serif;
    font-size: 20px;
    color: var(--navy);
    font-weight: 700;
    flex-shrink: 0;
  }

  .logo-text {
    display: flex;
    flex-direction: column;
    line-height: 1.1;
  }

  .logo-name {
    font-family: 'DM Serif Display', serif;
    font-size: 18px;
    color: var(--white);
    letter-spacing: 0.01em;
  }

  .logo-tagline {
    font-size: 10px;
    color: var(--gold);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-weight: 500;
  }

  .header-badge {
    font-size: 11px;
    color: rgba(255,255,255,0.5);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  /* PROGRESS */
  .progress-bar {
    background: var(--navy-mid);
    padding: 0 48px;
    height: 52px;
    display: flex;
    align-items: center;
    gap: 0;
  }

  .step-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 20px 0 0;
    opacity: 0.45;
    transition: opacity 0.3s;
  }

  .step-item.active { opacity: 1; }
  .step-item.done { opacity: 0.7; }

  .step-dot {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    color: rgba(255,255,255,0.5);
    font-weight: 600;
    flex-shrink: 0;
    transition: all 0.3s;
  }

  .step-item.active .step-dot {
    background: var(--gold);
    border-color: var(--gold);
    color: var(--navy);
  }

  .step-item.done .step-dot {
    background: var(--success);
    border-color: var(--success);
    color: white;
  }

  .step-label {
    font-size: 12px;
    font-weight: 500;
    color: rgba(255,255,255,0.7);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .step-item.active .step-label { color: var(--white); }

  .step-divider {
    width: 32px;
    height: 1px;
    background: rgba(255,255,255,0.2);
    margin: 0 4px;
    flex-shrink: 0;
  }

  /* MAIN */
  .main {
    flex: 1;
    padding: 48px;
    max-width: 860px;
    margin: 0 auto;
    width: 100%;
  }

  .section-heading {
    margin-bottom: 32px;
  }

  .section-heading h1 {
    font-family: 'DM Serif Display', serif;
    font-size: 32px;
    color: var(--navy);
    line-height: 1.15;
    margin-bottom: 8px;
  }

  .section-heading p {
    font-size: 15px;
    color: var(--text-muted);
    font-weight: 400;
  }

  /* CARD */
  .card {
    background: var(--white);
    border-radius: 16px;
    border: 1px solid var(--border);
    box-shadow: var(--shadow);
    padding: 36px;
    margin-bottom: 24px;
  }

  .card-title {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 20px;
  }

  /* FORM ELEMENTS */
  .field {
    margin-bottom: 22px;
  }

  .field label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--navy);
    margin-bottom: 8px;
  }

  .field input, .field select {
    width: 100%;
    height: 48px;
    padding: 0 16px;
    border: 1.5px solid var(--border);
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    color: var(--text);
    background: var(--cream);
    transition: border-color 0.2s, box-shadow 0.2s;
    outline: none;
    appearance: none;
  }

  .field input:focus, .field select:focus {
    border-color: var(--navy);
    box-shadow: 0 0 0 3px rgba(13,31,60,0.08);
    background: white;
  }

  .field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .field-row-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
  }

  /* TOGGLE */
  .toggle-group {
    display: flex;
    gap: 0;
    border: 1.5px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
    background: var(--cream);
  }

  .toggle-btn {
    flex: 1;
    height: 48px;
    border: none;
    background: transparent;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.02em;
  }

  .toggle-btn.active {
    background: var(--navy);
    color: var(--white);
  }

  .toggle-btn:first-child { border-radius: 8px 0 0 8px; }
  .toggle-btn:last-child  { border-radius: 0 8px 8px 0; }

  /* OPTION CARDS */
  .option-grid {
    display: grid;
    gap: 12px;
  }

  .option-grid-3 {
    grid-template-columns: repeat(3, 1fr);
  }

  .option-grid-2 {
    grid-template-columns: repeat(2, 1fr);
  }

  .option-card {
    border: 1.5px solid var(--border);
    border-radius: 12px;
    padding: 16px 18px;
    cursor: pointer;
    transition: all 0.2s;
    background: var(--cream);
    text-align: left;
  }

  .option-card:hover {
    border-color: var(--navy);
    background: white;
  }

  .option-card.selected {
    border-color: var(--navy);
    background: var(--navy);
    color: white;
  }

  .option-card-label {
    font-size: 14px;
    font-weight: 600;
    display: block;
    margin-bottom: 2px;
  }

  .option-card-sub {
    font-size: 11px;
    opacity: 0.65;
    display: block;
  }

  /* BUTTON */
  .btn-primary {
    height: 54px;
    padding: 0 40px;
    background: var(--navy);
    color: white;
    border: none;
    border-radius: 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.02em;
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }

  .btn-primary:hover {
    background: var(--navy-mid);
    transform: translateY(-1px);
    box-shadow: var(--shadow);
  }

  .btn-gold {
    background: var(--gold);
    color: var(--navy);
  }

  .btn-gold:hover {
    background: var(--gold-light);
  }

  .btn-outline {
    height: 54px;
    padding: 0 32px;
    background: transparent;
    color: var(--navy);
    border: 1.5px solid var(--navy);
    border-radius: 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.02em;
  }

  .btn-outline:hover {
    background: var(--navy);
    color: white;
  }

  .btn-row {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-top: 8px;
  }

  /* QUOTE SHEET */
  .worksheet {
    background: var(--cream);
    border-radius: 12px;
    padding: 24px;
    margin: 24px 0;
    border: 1px solid var(--cream-dark);
  }

  .worksheet-title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 16px;
  }

  .ws-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 9px 0;
    border-bottom: 1px solid var(--cream-dark);
    font-size: 14px;
  }

  .ws-row:last-child { border-bottom: none; }

  .ws-row.indent { padding-left: 16px; color: var(--text-muted); }

  .ws-row.subtotal {
    font-weight: 600;
    color: var(--navy);
    background: white;
    border-radius: 8px;
    padding: 10px 12px;
    margin: 4px -12px;
  }

  .ws-row.total {
    font-weight: 700;
    font-size: 16px;
    color: var(--navy);
    border-top: 2px solid var(--navy);
    margin-top: 4px;
    padding-top: 14px;
    border-bottom: none;
  }

  .ws-badge {
    font-size: 10px;
    background: var(--gold);
    color: var(--navy);
    padding: 2px 7px;
    border-radius: 4px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-left: 8px;
  }

  /* QUOTE HEADER */
  .quote-header {
    background: var(--navy);
    border-radius: 16px;
    padding: 28px 32px;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .quote-number {
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 6px;
    font-weight: 600;
  }

  .quote-premium {
    font-family: 'DM Serif Display', serif;
    font-size: 42px;
    line-height: 1;
    color: white;
  }

  .quote-premium-label {
    font-size: 13px;
    color: rgba(255,255,255,0.55);
    margin-top: 4px;
  }

  .quote-period {
    text-align: right;
  }

  .quote-period-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--gold);
    margin-bottom: 4px;
    font-weight: 600;
  }

  .quote-period-dates {
    font-size: 15px;
    font-weight: 500;
    color: white;
    line-height: 1.6;
  }

  /* INSURED SUMMARY */
  .summary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 0;
  }

  .summary-item {}

  .summary-item-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 4px;
  }

  .summary-item-value {
    font-size: 15px;
    font-weight: 500;
    color: var(--navy);
  }

  /* POLICY ISSUED */
  .policy-hero {
    background: linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 100%);
    border-radius: 20px;
    padding: 48px;
    text-align: center;
    color: white;
    position: relative;
    overflow: hidden;
    margin-bottom: 24px;
  }

  .policy-hero::before {
    content: '';
    position: absolute;
    top: -60px; right: -60px;
    width: 240px; height: 240px;
    border-radius: 50%;
    background: rgba(201,168,76,0.12);
  }

  .policy-hero::after {
    content: '';
    position: absolute;
    bottom: -80px; left: -40px;
    width: 200px; height: 200px;
    border-radius: 50%;
    background: rgba(201,168,76,0.08);
  }

  .policy-check {
    width: 72px;
    height: 72px;
    background: var(--gold);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    font-size: 32px;
    position: relative;
    z-index: 1;
  }

  .policy-hero h2 {
    font-family: 'DM Serif Display', serif;
    font-size: 28px;
    margin-bottom: 8px;
    position: relative;
    z-index: 1;
  }

  .policy-hero p {
    font-size: 14px;
    color: rgba(255,255,255,0.65);
    position: relative;
    z-index: 1;
  }

  .policy-number-display {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 10px;
    padding: 14px 28px;
    display: inline-block;
    margin-top: 20px;
    position: relative;
    z-index: 1;
  }

  .policy-number-display .label {
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--gold);
    display: block;
    margin-bottom: 4px;
  }

  .policy-number-display .number {
    font-family: 'DM Serif Display', serif;
    font-size: 20px;
    color: white;
    letter-spacing: 0.05em;
  }

  /* DEC PAGE */
  .dec-page {
    background: white;
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: var(--shadow-lg);
  }

  .dec-header {
    background: var(--navy);
    padding: 28px 36px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 4px solid var(--gold);
  }

  .dec-logo-name {
    font-family: 'DM Serif Display', serif;
    font-size: 22px;
    color: white;
  }

  .dec-logo-sub {
    font-size: 10px;
    color: var(--gold);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-top: 2px;
  }

  .dec-doc-type {
    text-align: right;
  }

  .dec-doc-title {
    font-family: 'DM Serif Display', serif;
    font-size: 18px;
    color: white;
  }

  .dec-doc-sub {
    font-size: 10px;
    color: rgba(255,255,255,0.5);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-top: 2px;
  }

  .dec-body {
    padding: 32px 36px;
  }

  .dec-section {
    margin-bottom: 28px;
    padding-bottom: 28px;
    border-bottom: 1px solid var(--cream-dark);
  }

  .dec-section:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }

  .dec-section-title {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 14px;
  }

  .dec-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .dec-grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 14px;
  }

  .dec-field {}

  .dec-field-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 3px;
  }

  .dec-field-value {
    font-size: 14px;
    font-weight: 500;
    color: var(--navy);
  }

  .dec-coverage-table {
    width: 100%;
    border-collapse: collapse;
  }

  .dec-coverage-table th {
    text-align: left;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
    padding: 8px 12px;
    background: var(--cream);
    border-bottom: 1px solid var(--cream-dark);
  }

  .dec-coverage-table td {
    padding: 12px 12px;
    font-size: 14px;
    border-bottom: 1px solid var(--cream-dark);
    color: var(--text);
    font-weight: 500;
  }

  .dec-coverage-table tr:last-child td { border-bottom: none; }

  .dec-premium-box {
    background: var(--navy);
    border-radius: 12px;
    padding: 20px 24px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    color: white;
  }

  .dec-prem-item {}
  .dec-prem-label {
    font-size: 9px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.5);
    margin-bottom: 4px;
  }
  .dec-prem-value {
    font-size: 16px;
    font-weight: 600;
    color: white;
  }
  .dec-prem-value.gold {
    color: var(--gold);
    font-family: 'DM Serif Display', serif;
    font-size: 20px;
  }

  .dec-footer {
    background: var(--cream);
    border-top: 1px solid var(--cream-dark);
    padding: 16px 36px;
    font-size: 10px;
    color: var(--text-muted);
    line-height: 1.6;
  }

  /* NOTICE */
  .notice {
    background: #fff8e6;
    border: 1px solid var(--gold);
    border-radius: 10px;
    padding: 14px 18px;
    font-size: 13px;
    color: #7a5a00;
    margin-bottom: 20px;
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }

  .notice-icon { flex-shrink: 0; margin-top: 1px; }

  /* VALIDATION */
  .error-text {
    font-size: 11px;
    color: #c0392b;
    margin-top: 5px;
    display: block;
  }

  input.error, select.error {
    border-color: #c0392b;
  }

  @media (max-width: 640px) {
    .main { padding: 24px 20px; }
    .header { padding: 0 20px; }
    .progress-bar { padding: 0 20px; overflow-x: auto; }
    .field-row, .field-row-3, .option-grid-3, .summary-grid, .dec-grid, .dec-grid-3, .dec-premium-box { grid-template-columns: 1fr; }
    .option-grid-2 { grid-template-columns: 1fr 1fr; }
    .quote-header { flex-direction: column; gap: 20px; }
    .quote-period { text-align: left; }
    .dec-header { flex-direction: column; gap: 12px; }
    .dec-doc-type { text-align: left; }
  }
`;

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function Header() {
  return (
    <header className="header">
      <div className="logo">
        <div className="logo-mark">Q</div>
        <div className="logo-text">
          <span className="logo-name">Quick Cover Liability</span>
          <span className="logo-tagline">Tennessee Surplus Lines MGA</span>
        </div>
      </div>
      <span className="header-badge">POC — Quote & Bind Portal</span>
    </header>
  );
}

function ProgressBar({ step }) {
  const steps = ["Application", "Rate & Quote", "Bind", "Policy Issued"];
  return (
    <div className="progress-bar">
      {steps.map((s, i) => (
        <>
          <div key={s} className={`step-item ${i === step ? "active" : i < step ? "done" : ""}`}>
            <div className="step-dot">
              {i < step ? "✓" : i + 1}
            </div>
            <span className="step-label">{s}</span>
          </div>
          {i < steps.length - 1 && <div key={`div-${i}`} className="step-divider" />}
        </>
      ))}
    </div>
  );
}

// ─── STEP 1: APPLICATION ─────────────────────────────────────────────────────
function ApplicationStep({ onNext }) {
  const [insuredType, setInsuredType] = useState("person");
  const [form, setForm] = useState({
    firstName: "", lastName: "", dob: "",
    companyName: "",
    addressLine1: "", city: "", state: "TN", zip: "",
    buildingType: "",
    term: "",
    startDate: "",
    limits: "",
    totalContractValue: "",
  });
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function validate() {
    const e = {};
    if (insuredType === "person") {
      if (!form.firstName.trim()) e.firstName = "Required";
      if (!form.lastName.trim()) e.lastName = "Required";
      if (!form.dob) e.dob = "Required";
    } else {
      if (!form.companyName.trim()) e.companyName = "Required";
    }
    if (!form.addressLine1.trim()) e.addressLine1 = "Required";
    if (!form.city.trim()) e.city = "Required";
    if (!form.zip.trim()) e.zip = "Required";
    if (!form.buildingType) e.buildingType = "Select a building type";
    if (!form.term) e.term = "Select a policy term";
    if (!form.startDate) e.startDate = "Required";
    if (!form.limits) e.limits = "Select coverage limits";
    if (!form.totalContractValue || parseFloat(form.totalContractValue) < 10000) {
      e.totalContractValue = "Enter a valid contract value (min $10,000)";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (validate()) {
      onNext({ ...form, insuredType });
    }
  }

  const buildingTypes = [
    { id: "single_family", label: "Single Family Residential", sub: "New construction, detached" },
    { id: "multifamily_2_4", label: "Multi-Family (2–4 Units)", sub: "Duplex, triplex, quadplex" },
    { id: "multifamily_5_8", label: "Multi-Family (5–8 Units)", sub: "Small apartment construction" },
  ];

  const terms = [
    { id: "3", label: "3 Months" }, { id: "6", label: "6 Months" },
    { id: "9", label: "9 Months" }, { id: "12", label: "12 Months" },
    { id: "18", label: "18 Months" }, { id: "24", label: "24 Months" },
  ];

  const limits = [
    { id: "500k/1M", label: "$500K / $1M", sub: "Per Occ / Aggregate" },
    { id: "1M/2M", label: "$1M / $2M", sub: "Per Occ / Aggregate" },
    { id: "2M/4M", label: "$2M / $4M", sub: "Per Occ / Aggregate" },
  ];

  return (
    <div>
      <div className="section-heading">
        <h1>New Submission</h1>
        <p>Residential Builders Risk Liability — Tennessee</p>
      </div>

      {/* Insured Information */}
      <div className="card">
        <div className="card-title">Insured Information</div>

        <div className="field">
          <label>Insured Type</label>
          <div className="toggle-group">
            <button className={`toggle-btn ${insuredType === "person" ? "active" : ""}`}
              onClick={() => setInsuredType("person")}>Individual / Person</button>
            <button className={`toggle-btn ${insuredType === "company" ? "active" : ""}`}
              onClick={() => setInsuredType("company")}>Company / Entity</button>
          </div>
        </div>

        {insuredType === "person" ? (
          <>
            <div className="field-row">
              <div className="field">
                <label>First Name</label>
                <input className={errors.firstName ? "error" : ""} value={form.firstName}
                  onChange={e => set("firstName", e.target.value)} placeholder="John" />
                {errors.firstName && <span className="error-text">{errors.firstName}</span>}
              </div>
              <div className="field">
                <label>Last Name</label>
                <input className={errors.lastName ? "error" : ""} value={form.lastName}
                  onChange={e => set("lastName", e.target.value)} placeholder="Smith" />
                {errors.lastName && <span className="error-text">{errors.lastName}</span>}
              </div>
            </div>
            <div className="field" style={{ maxWidth: 220 }}>
              <label>Date of Birth</label>
              <input type="date" className={errors.dob ? "error" : ""} value={form.dob}
                onChange={e => set("dob", e.target.value)} />
              {errors.dob && <span className="error-text">{errors.dob}</span>}
            </div>
          </>
        ) : (
          <div className="field">
            <label>Company Name</label>
            <input className={errors.companyName ? "error" : ""} value={form.companyName}
              onChange={e => set("companyName", e.target.value)} placeholder="Smith Construction LLC" />
            {errors.companyName && <span className="error-text">{errors.companyName}</span>}
          </div>
        )}
      </div>

      {/* Property Address */}
      <div className="card">
        <div className="card-title">Project / Property Address</div>
        <div className="field">
          <label>Street Address</label>
          <input className={errors.addressLine1 ? "error" : ""} value={form.addressLine1}
            onChange={e => set("addressLine1", e.target.value)} placeholder="123 Builders Way" />
          {errors.addressLine1 && <span className="error-text">{errors.addressLine1}</span>}
        </div>
        <div className="field-row-3">
          <div className="field">
            <label>City</label>
            <input className={errors.city ? "error" : ""} value={form.city}
              onChange={e => set("city", e.target.value)} placeholder="Nashville" />
            {errors.city && <span className="error-text">{errors.city}</span>}
          </div>
          <div className="field">
            <label>State</label>
            <select value={form.state} onChange={e => set("state", e.target.value)}>
              <option value="TN">Tennessee (TN)</option>
            </select>
          </div>
          <div className="field">
            <label>ZIP Code</label>
            <input className={errors.zip ? "error" : ""} value={form.zip}
              onChange={e => set("zip", e.target.value)} placeholder="37201"
              maxLength={5} />
            {errors.zip && <span className="error-text">{errors.zip}</span>}
          </div>
        </div>
      </div>

      {/* Coverage Details */}
      <div className="card">
        <div className="card-title">Coverage Details</div>

        <div className="field">
          <label>Building Type</label>
          <div className="option-grid" style={{ gridTemplateColumns: "1fr" }}>
            {buildingTypes.map(bt => (
              <div key={bt.id}
                className={`option-card ${form.buildingType === bt.id ? "selected" : ""}`}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                onClick={() => set("buildingType", bt.id)}>
                <div>
                  <span className="option-card-label">{bt.label}</span>
                  <span className="option-card-sub">{bt.sub}</span>
                </div>
                {form.buildingType === bt.id &&
                  <span style={{ fontSize: 18, color: "var(--gold)" }}>✓</span>}
              </div>
            ))}
          </div>
          {errors.buildingType && <span className="error-text">{errors.buildingType}</span>}
        </div>

        <div className="field">
          <label>Policy Term</label>
          <div className="option-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            {terms.map(t => (
              <div key={t.id} className={`option-card ${form.term === t.id ? "selected" : ""}`}
                style={{ textAlign: "center" }}
                onClick={() => set("term", t.id)}>
                <span className="option-card-label">{t.label}</span>
              </div>
            ))}
          </div>
          {errors.term && <span className="error-text">{errors.term}</span>}
        </div>

        <div className="field" style={{ maxWidth: 260 }}>
          <label>Coverage Start Date</label>
          <input type="date" className={errors.startDate ? "error" : ""} value={form.startDate}
            onChange={e => set("startDate", e.target.value)} />
          {errors.startDate && <span className="error-text">{errors.startDate}</span>}
        </div>

        <div className="field">
          <label>Coverage Limits (Per Occurrence / Aggregate)</label>
          <div className="option-grid option-grid-3">
            {limits.map(l => (
              <div key={l.id} className={`option-card ${form.limits === l.id ? "selected" : ""}`}
                style={{ textAlign: "center" }}
                onClick={() => set("limits", l.id)}>
                <span className="option-card-label">{l.label}</span>
                <span className="option-card-sub">{l.sub}</span>
              </div>
            ))}
          </div>
          {errors.limits && <span className="error-text">{errors.limits}</span>}
        </div>

        <div className="field" style={{ maxWidth: 320 }}>
          <label>Total Contract Value (TCV)</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: 15 }}>$</span>
            <input
              style={{ paddingLeft: 28 }}
              className={errors.totalContractValue ? "error" : ""}
              value={form.totalContractValue}
              onChange={e => set("totalContractValue", e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="250,000"
              type="text"
              inputMode="numeric"
            />
          </div>
          {errors.totalContractValue && <span className="error-text">{errors.totalContractValue}</span>}
        </div>
      </div>

      <div className="btn-row">
        <button className="btn-primary btn-gold" onClick={handleSubmit}>
          Generate Quote →
        </button>
      </div>
    </div>
  );
}

// ─── STEP 2: QUOTE ───────────────────────────────────────────────────────────
function QuoteStep({ submission, onBind, onBack }) {
  const result = rateSubmission(submission);
  const { worksheet: ws, policyPeriod, quoteNumber } = result;

  const insuredName = submission.insuredType === "person"
    ? `${submission.firstName} ${submission.lastName}`
    : submission.companyName;

  const address = `${submission.addressLine1}, ${submission.city}, ${submission.state} ${submission.zip}`;

  return (
    <div>
      <div className="section-heading">
        <h1>Your Quote</h1>
        <p>Review the rating worksheet below before binding coverage.</p>
      </div>

      <div className="quote-header">
        <div>
          <div className="quote-number">Quote No. {quoteNumber}</div>
          <div className="quote-premium">{fmt(ws.totalDue)}</div>
          <div className="quote-premium-label">Total Due at Bind (includes taxes & fees)</div>
        </div>
        <div className="quote-period">
          <div className="quote-period-label">Policy Period</div>
          <div className="quote-period-dates">
            {policyPeriod.start}<br />{policyPeriod.end}
          </div>
        </div>
      </div>

      {/* Insured Summary */}
      <div className="card">
        <div className="card-title">Insured Summary</div>
        <div className="summary-grid">
          <div className="summary-item">
            <div className="summary-item-label">Insured</div>
            <div className="summary-item-value">{insuredName}</div>
          </div>
          {submission.insuredType === "person" && (
            <div className="summary-item">
              <div className="summary-item-label">Date of Birth</div>
              <div className="summary-item-value">{new Date(submission.dob + "T12:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
            </div>
          )}
          <div className="summary-item">
            <div className="summary-item-label">Project Address</div>
            <div className="summary-item-value">{address}</div>
          </div>
          <div className="summary-item">
            <div className="summary-item-label">Building Type</div>
            <div className="summary-item-value">{BUILDING_TYPE_LABELS[submission.buildingType]}</div>
          </div>
          <div className="summary-item">
            <div className="summary-item-label">Coverage Limits</div>
            <div className="summary-item-value">{LIMIT_FACTORS[submission.limits].label} Per Occ / Agg</div>
          </div>
          <div className="summary-item">
            <div className="summary-item-label">Total Contract Value</div>
            <div className="summary-item-value">{fmt(parseFloat(submission.totalContractValue))}</div>
          </div>
        </div>
      </div>

      {/* Rating Worksheet */}
      <div className="card">
        <div className="card-title">Rating Worksheet</div>
        <div className="notice">
          <span className="notice-icon">ℹ</span>
          <span>This worksheet shows every rating factor applied. Rates are per $1,000 of Total Contract Value for residential builders risk general liability in Tennessee.</span>
        </div>

        <div className="worksheet">
          <div className="worksheet-title">Premium Calculation</div>
          <div className="ws-row">
            <span>Total Contract Value</span>
            <span>{fmt(ws.tcv)}</span>
          </div>
          <div className="ws-row indent">
            <span>Base Rate (per $1,000 TCV)</span>
            <span>${ws.baseRate.toFixed(2)}</span>
          </div>
          <div className="ws-row subtotal">
            <span>Base Premium</span>
            <span>{fmt(ws.basePremium)}</span>
          </div>

          <div className="ws-row indent">
            <span>Limits Factor — {ws.limitLabel}</span>
            <span>× {ws.limitFactor.toFixed(2)}</span>
          </div>
          <div className="ws-row indent">
            <span>Term Factor — {ws.termLabel}</span>
            <span>× {ws.termFactor.toFixed(2)}</span>
          </div>
          <div className="ws-row subtotal">
            <span>Calculated Premium</span>
            <span>{fmt(ws.afterTerm)}</span>
          </div>

          {ws.minimumApplied && (
            <div className="ws-row indent" style={{ color: "#b8860b" }}>
              <span>Minimum Premium Applied <span className="ws-badge">Min</span></span>
              <span>{fmt(ws.minimumPremium)}</span>
            </div>
          )}

          <div className="ws-row subtotal">
            <span>Net Premium</span>
            <span>{fmt(ws.finalPremium)}</span>
          </div>

          <div style={{ height: 12 }} />
          <div className="worksheet-title">Taxes &amp; Fees (Tennessee)</div>
          <div className="ws-row indent">
            <span>TN Surplus Lines Tax (6.0%)</span>
            <span>{fmt(ws.tnSurplusLinesTax)}</span>
          </div>
          <div className="ws-row indent">
            <span>TSLAA Stamping Fee (0.2%)</span>
            <span>{fmt(ws.stampingFee)}</span>
          </div>
          <div className="ws-row indent">
            <span>Policy Fee</span>
            <span>{fmt(ws.policyFee)}</span>
          </div>

          <div className="ws-row total">
            <span>Total Due at Bind</span>
            <span>{fmt(ws.totalDue)}</span>
          </div>
        </div>
      </div>

      <div className="btn-row">
        <button className="btn-outline" onClick={onBack}>← Revise Application</button>
        <button className="btn-primary btn-gold" onClick={() => onBind(result)}>
          Bind Coverage →
        </button>
      </div>
    </div>
  );
}

// ─── STEP 3: BIND CONFIRMATION ────────────────────────────────────────────────
function BindStep({ result, onConfirm, onBack }) {
  const { worksheet: ws, policyPeriod, input } = result;
  const insuredName = input.insuredType === "person"
    ? `${input.firstName} ${input.lastName}`
    : input.companyName;

  return (
    <div>
      <div className="section-heading">
        <h1>Confirm &amp; Bind</h1>
        <p>Review the coverage summary and confirm to issue the policy.</p>
      </div>

      <div className="card">
        <div className="card-title">Bind Confirmation Summary</div>

        <div className="notice">
          <span className="notice-icon">⚠</span>
          <span><strong>POC Demo:</strong> In production, payment processing and carrier confirmation would occur here before policy issuance.</span>
        </div>

        <div className="summary-grid" style={{ marginBottom: 24 }}>
          <div className="summary-item">
            <div className="summary-item-label">Insured</div>
            <div className="summary-item-value">{insuredName}</div>
          </div>
          <div className="summary-item">
            <div className="summary-item-label">Coverage</div>
            <div className="summary-item-value">Residential Builders Risk GL</div>
          </div>
          <div className="summary-item">
            <div className="summary-item-label">Effective Date</div>
            <div className="summary-item-value">{policyPeriod.start}</div>
          </div>
          <div className="summary-item">
            <div className="summary-item-label">Expiration Date</div>
            <div className="summary-item-value">{policyPeriod.end}</div>
          </div>
          <div className="summary-item">
            <div className="summary-item-label">Limits</div>
            <div className="summary-item-value">{LIMIT_FACTORS[input.limits].label} Per Occ / Agg</div>
          </div>
          <div className="summary-item">
            <div className="summary-item-label">Total Premium Due</div>
            <div className="summary-item-value" style={{ color: "var(--navy)", fontWeight: 700, fontSize: 18 }}>
              {fmt(ws.totalDue)}
            </div>
          </div>
        </div>

        <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 24 }}>
          By binding this policy, you acknowledge that all application information is accurate and complete.
          This policy is written on a surplus lines basis and is not covered by the Tennessee Insurance Guaranty Association.
          Coverage is subject to the terms and conditions of the policy form.
        </p>

        <div className="btn-row">
          <button className="btn-outline" onClick={onBack}>← Back to Quote</button>
          <button className="btn-primary btn-gold" onClick={onConfirm}>
            Confirm &amp; Issue Policy →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── STEP 4: POLICY ISSUED ────────────────────────────────────────────────────
function PolicyStep({ result }) {
  const { quoteNumber, worksheet: ws, policyPeriod, input } = result;
  const policyNumber = generatePolicyNumber(quoteNumber);
  const issueDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const insuredName = input.insuredType === "person"
    ? `${input.firstName} ${input.lastName}`
    : input.companyName;

  const address = `${input.addressLine1}, ${input.city}, ${input.state} ${input.zip}`;

  return (
    <div>
      <div className="policy-hero">
        <div className="policy-check">✓</div>
        <h2>Policy Issued Successfully</h2>
        <p>Coverage is bound and effective as of {policyPeriod.start}</p>
        <div className="policy-number-display">
          <span className="label">Policy Number</span>
          <span className="number">{policyNumber}</span>
        </div>
      </div>

      {/* Dec Page */}
      <div className="dec-page">
        <div className="dec-header">
          <div>
            <div className="dec-logo-name">Quick Cover Liability</div>
            <div className="dec-logo-sub">Tennessee Surplus Lines MGA</div>
          </div>
          <div className="dec-doc-type">
            <div className="dec-doc-title">Declarations Page</div>
            <div className="dec-doc-sub">Residential Builders Risk GL</div>
          </div>
        </div>

        <div className="dec-body">
          {/* Policy Info */}
          <div className="dec-section">
            <div className="dec-section-title">Policy Information</div>
            <div className="dec-grid">
              <div className="dec-field">
                <div className="dec-field-label">Policy Number</div>
                <div className="dec-field-value" style={{ fontWeight: 700, fontSize: 15 }}>{policyNumber}</div>
              </div>
              <div className="dec-field">
                <div className="dec-field-label">Quote Number</div>
                <div className="dec-field-value">{quoteNumber}</div>
              </div>
              <div className="dec-field">
                <div className="dec-field-label">Issue Date</div>
                <div className="dec-field-value">{issueDate}</div>
              </div>
              <div className="dec-field">
                <div className="dec-field-label">Policy Type</div>
                <div className="dec-field-value">Surplus Lines — Occurrence</div>
              </div>
            </div>
          </div>

          {/* Insured */}
          <div className="dec-section">
            <div className="dec-section-title">Named Insured</div>
            <div className="dec-grid">
              <div className="dec-field">
                <div className="dec-field-label">Insured Name</div>
                <div className="dec-field-value">{insuredName}</div>
              </div>
              {input.insuredType === "person" && (
                <div className="dec-field">
                  <div className="dec-field-label">Date of Birth</div>
                  <div className="dec-field-value">{new Date(input.dob + "T12:00:00").toLocaleDateString("en-US")}</div>
                </div>
              )}
              <div className="dec-field">
                <div className="dec-field-label">Project Address</div>
                <div className="dec-field-value">{address}</div>
              </div>
              <div className="dec-field">
                <div className="dec-field-label">Building Type</div>
                <div className="dec-field-value">{BUILDING_TYPE_LABELS[input.buildingType]}</div>
              </div>
            </div>
          </div>

          {/* Policy Period */}
          <div className="dec-section">
            <div className="dec-section-title">Policy Period</div>
            <div className="dec-grid-3">
              <div className="dec-field">
                <div className="dec-field-label">Effective Date</div>
                <div className="dec-field-value">{policyPeriod.start}</div>
              </div>
              <div className="dec-field">
                <div className="dec-field-label">Expiration Date</div>
                <div className="dec-field-value">{policyPeriod.end}</div>
              </div>
              <div className="dec-field">
                <div className="dec-field-label">Term</div>
                <div className="dec-field-value">{TERM_FACTORS[input.term].label}</div>
              </div>
            </div>
          </div>

          {/* Coverages */}
          <div className="dec-section">
            <div className="dec-section-title">Coverages &amp; Limits</div>
            <table className="dec-coverage-table">
              <thead>
                <tr>
                  <th>Coverage</th>
                  <th>Per Occurrence Limit</th>
                  <th>Aggregate Limit</th>
                  <th>Deductible</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Commercial General Liability</td>
                  <td>{input.limits === "500k/1M" ? "$500,000" : input.limits === "1M/2M" ? "$1,000,000" : "$2,000,000"}</td>
                  <td>{input.limits === "500k/1M" ? "$1,000,000" : input.limits === "1M/2M" ? "$2,000,000" : "$4,000,000"}</td>
                  <td>None</td>
                </tr>
                <tr>
                  <td>Products &amp; Completed Operations</td>
                  <td>{input.limits === "500k/1M" ? "$500,000" : input.limits === "1M/2M" ? "$1,000,000" : "$2,000,000"}</td>
                  <td>{input.limits === "500k/1M" ? "$1,000,000" : input.limits === "1M/2M" ? "$2,000,000" : "$4,000,000"}</td>
                  <td>None</td>
                </tr>
                <tr>
                  <td>Personal &amp; Advertising Injury</td>
                  <td>{input.limits === "500k/1M" ? "$500,000" : input.limits === "1M/2M" ? "$1,000,000" : "$2,000,000"}</td>
                  <td>—</td>
                  <td>None</td>
                </tr>
                <tr>
                  <td>Damage to Rented Premises</td>
                  <td>$100,000</td>
                  <td>—</td>
                  <td>None</td>
                </tr>
                <tr>
                  <td>Medical Payments</td>
                  <td>$5,000</td>
                  <td>—</td>
                  <td>None</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Premium */}
          <div className="dec-section">
            <div className="dec-section-title">Premium Summary</div>
            <div className="dec-premium-box">
              <div className="dec-prem-item">
                <div className="dec-prem-label">Net Premium</div>
                <div className="dec-prem-value">{fmt(ws.finalPremium)}</div>
              </div>
              <div className="dec-prem-item">
                <div className="dec-prem-label">TN Surplus Lines Tax</div>
                <div className="dec-prem-value">{fmt(ws.tnSurplusLinesTax)}</div>
              </div>
              <div className="dec-prem-item">
                <div className="dec-prem-label">Stamping Fee + Policy Fee</div>
                <div className="dec-prem-value">{fmt(ws.stampingFee + ws.policyFee)}</div>
              </div>
              <div className="dec-prem-item">
                <div className="dec-prem-label">Total Premium</div>
                <div className="dec-prem-value gold">{fmt(ws.totalDue)}</div>
              </div>
            </div>
          </div>

          {/* TCV */}
          <div className="dec-section">
            <div className="dec-section-title">Underwriting Information</div>
            <div className="dec-grid">
              <div className="dec-field">
                <div className="dec-field-label">Total Contract Value</div>
                <div className="dec-field-value">{fmt(parseFloat(input.totalContractValue))}</div>
              </div>
              <div className="dec-field">
                <div className="dec-field-label">State of Filing</div>
                <div className="dec-field-value">Tennessee</div>
              </div>
              <div className="dec-field">
                <div className="dec-field-label">Surplus Lines License</div>
                <div className="dec-field-value">TN-SL-DEMO-0001</div>
              </div>
              <div className="dec-field">
                <div className="dec-field-label">NAIC / Insurer</div>
                <div className="dec-field-value">Admitted Carrier — POC Demo</div>
              </div>
            </div>
          </div>
        </div>

        <div className="dec-footer">
          THIS POLICY IS WRITTEN ON A SURPLUS LINES BASIS. THE INSURER IS NOT LICENSED BY THE STATE OF TENNESSEE AND IS NOT SUBJECT TO ITS SUPERVISION. IN THE EVENT OF INSOLVENCY OF THE INSURER, LOSSES WILL NOT BE COVERED BY THE TENNESSEE INSURANCE GUARANTY ASSOCIATION. · Quick Cover Liability · Tennessee Surplus Lines MGA · POC Version — For Demonstration Purposes Only
        </div>
      </div>

      <div className="btn-row" style={{ marginTop: 24 }}>
        <button className="btn-primary" onClick={() => window.location.reload()}>
          + Start New Quote
        </button>
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState(0);
  const [submission, setSubmission] = useState(null);
  const [quoteResult, setQuoteResult] = useState(null);

  return (
    <>
      <style>{styles}</style>
      <div className="app-wrap">
        <Header />
        <ProgressBar step={step} />
        <div className="main">
          {step === 0 && (
            <ApplicationStep onNext={(data) => { setSubmission(data); setStep(1); }} />
          )}
          {step === 1 && (
            <QuoteStep
              submission={submission}
              onBind={(result) => { setQuoteResult(result); setStep(2); }}
              onBack={() => setStep(0)}
            />
          )}
          {step === 2 && (
            <BindStep
              result={quoteResult}
              onConfirm={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <PolicyStep result={quoteResult} />
          )}
        </div>
      </div>
    </>
  );
}
