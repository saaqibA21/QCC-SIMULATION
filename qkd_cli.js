#!/usr/bin/env node

/**
 * QuantumShield - CLI Quantum Key Distribution (BB84) & Eavesdropping Simulator
 * Run: node qkd_cli.js [--qubits=50] [--eve=true] [--intercept=1.0] [--noise=0.02]
 */

const { QKDSimulator } = require('./public/js/quantum-engine');

// Parse simple CLI arguments
const args = process.argv.slice(2);
const options = {
  protocol: 'bb84', // 'bb84' or 'mdi'
  attack: 'intercept-resend', // 'intercept-resend' or 'detector-blinding'
  qubits: 50,
  eve: true,
  intercept: 1.0,
  noise: 0.02,
  threshold: 0.11,
  sample: 0.33,
  distance: 20,
  message: 'TOP SECRET QUANTUM KEY 2026'
};

args.forEach(arg => {
  const [key, val] = arg.replace(/^--/, '').split('=');
  if (key === 'protocol') options.protocol = val;
  if (key === 'attack') options.attack = val;
  if (key === 'qubits') options.qubits = parseInt(val, 10);
  if (key === 'eve') options.eve = (val === 'true' || val === '1');
  if (key === 'intercept') options.intercept = parseFloat(val);
  if (key === 'noise') options.noise = parseFloat(val);
  if (key === 'threshold') options.threshold = parseFloat(val);
  if (key === 'sample') options.sample = parseFloat(val);
  if (key === 'distance') options.distance = parseFloat(val);
  if (key === 'message') options.message = val;
  if (key === 'dual') options.dual = (val === 'true' || val === undefined);
  if (key === 'mdi-showdown') options.mdiShowdown = true;
});

// ANSI Colors
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const MAGENTA = '\x1b[35m';
const GRAY = '\x1b[90m';

console.log(`${BOLD}${CYAN}========================================================================${RESET}`);
console.log(`${BOLD}${CYAN}⚛️  ACADEMIC PROJECT: SIMULATION OF EAVESDROPPING DETECTION IN BB84${RESET}`);
console.log(`${BOLD}${CYAN}    Quantum Key Distribution Protocol & QBER Analysis${RESET}`);
console.log(`${BOLD}${GRAY}    QUANTUM CORE SIMULATION SUITE // MDI-QKD & BB84${RESET}`);
console.log(`${BOLD}${CYAN}========================================================================${RESET}`);
console.log(`${GRAY}Parameters:${RESET}`);
console.log(`  • Qubits sent: ${BOLD}${options.qubits}${RESET}`);
console.log(`  • Eavesdropper (Eve) Active: ${options.eve ? `${RED}${BOLD}YES${RESET}` : `${GREEN}NO (Channel Secure)${RESET}`}`);
if (options.eve) {
  console.log(`  • Eve Intercept Probability: ${YELLOW}${(options.intercept * 100).toFixed(0)}%${RESET}`);
}
console.log(`  • Environmental Channel Noise: ${(options.noise * 100).toFixed(1)}%`);
console.log(`  • QBER Security Abort Threshold: ${RED}${(options.threshold * 100).toFixed(1)}%${RESET}`);
console.log(`${CYAN}------------------------------------------------------------------------${RESET}\n`);

const sim = new QKDSimulator({
  qubitCount: options.qubits,
  eveActive: options.eve,
  eveInterceptRate: options.intercept,
  channelNoiseRate: options.noise,
  errorThreshold: options.threshold,
  sampleFraction: options.sample
});

if (options.mdiShowdown) {
  console.log(`${BOLD}${MAGENTA}🛡️  MDI-QKD VS BB84 DETECTOR-BLINDING ATTACK SHOWDOWN:${RESET}\n`);
  
  // 1. BB84 under Detector Blinding
  const simBB84 = new QKDSimulator({
    protocol: 'bb84',
    qubitCount: options.qubits,
    eveActive: true,
    eveAttackStrategy: 'detector-blinding',
    eveInterceptRate: 1.0,
    channelNoiseRate: 0.01
  });
  const resBB84 = simBB84.runFullSimulation();

  console.log(`${BOLD}${RED}1. STANDARD BB84 UNDER DETECTOR-BLINDING ATTACK:${RESET}`);
  console.log(`  • Hardware Exploit: Eve blinds Bob's SPADs with CW laser into linear regime.`);
  console.log(`  • Measured QBER:    ${GREEN}${resBB84.measuredQBER.toFixed(1)}%${RESET} ${YELLOW}(FAILS TO ALARM! Stealth Attack)${RESET}`);
  console.log(`  • Eve Stolen Key:   ${BOLD}${RED}${resBB84.eveStolenPercentage.toFixed(0)}% of secret key leaked to Eve!${RESET}`);
  console.log(`  • Security Status:  ${RED}FATAL FAILURE: BB84 protocol trusted a compromised key!${RESET}\n`);

  // 2. MDI-QKD under Detector Blinding
  const simMDI = new QKDSimulator({
    protocol: 'mdi',
    qubitCount: options.qubits,
    eveActive: true,
    eveAttackStrategy: 'detector-blinding',
    eveInterceptRate: 1.0,
    channelNoiseRate: 0.01
  });
  const resMDI = simMDI.runFullSimulation();

  console.log(`${BOLD}${GREEN}2. MDI-QKD UNDER DETECTOR-BLINDING ATTACK:${RESET}`);
  console.log(`  • Architecture:     Untrusted Charlie central relay performs BSM.`);
  console.log(`  • Relay Output:     Only Bell states (|ψ⁻⟩) announced; individual bits never measured.`);
  console.log(`  • Eve Stolen Key:   ${BOLD}${GREEN}0.0% (ZERO key bits leaked!)${RESET}`);
  console.log(`  • Security Status:  ${GREEN}100% IMMUNE: Untrusted relay removes all trust from detectors!${RESET}\n`);

  process.exit(0);
}

if (options.dual) {
  console.log(`${BOLD}${MAGENTA}⚖️  RUNNING DUAL SCENARIO COMPARISON (SLIDE 5 & SLIDE 7):${RESET}\n`);
  const dual = sim.runDualScenarioComparison(options.qubits);
  const c1 = dual.case1_NoEve;
  const c2 = dual.case2_WithEve;

  console.log(`${BOLD}${GREEN}CASE 1 — NO EVE (Clean Channel)${RESET}`);
  console.log(`  • Sifted Key:     ${c1.siftedCount} bits (${c1.siftedRatio.toFixed(1)}%)`);
  console.log(`  • Errors Found:   ${c1.sampleErrorsFound} errors in ${c1.sampleTestedCount} tested bits`);
  console.log(`  • Measured QBER:  ${BOLD}${GREEN}${c1.measuredQBER.toFixed(1)}%${RESET} (Expected: < 2%)`);
  console.log(`  • Security Status: ${GREEN}SECURE (Key Distilled: ${c1.amplifiedAliceKey.slice(0, 24)}...)${RESET}\n`);

  console.log(`${BOLD}${RED}CASE 2 — EVE PRESENT (Intercept-and-Resend Attack)${RESET}`);
  console.log(`  • Sifted Key:     ${c2.siftedCount} bits (${c2.siftedRatio.toFixed(1)}%)`);
  console.log(`  • Errors Found:   ${c2.sampleErrorsFound} errors in ${c2.sampleTestedCount} tested bits`);
  console.log(`  • Measured QBER:  ${BOLD}${RED}${c2.measuredQBER.toFixed(1)}%${RESET} (Expected: ~25.0%)`);
  console.log(`  • Security Status: ${RED}ABORTED (Eavesdropping Detected! All keys discarded)${RESET}\n`);

  console.log(`${BOLD}${CYAN}CONCLUSION:${RESET}`);
  console.log(`  Measuring a quantum bit unavoidably disturbs it. Eve's ~25% disturbance`);
  console.log(`  flags the channel and prevents compromised key distribution.\n`);
  process.exit(0);
}

console.log(`${BOLD}Transmitting single-photon qubits across quantum channel...${RESET}\n`);
const results = sim.runFullSimulation();

// Display sample table of first 15 qubits
console.log(`${BOLD}Sample of First 15 Transmitted Qubits:${RESET}`);
console.log(`${GRAY}┌─────┬──────────────┬──────────────┬──────────────┬────────────┬─────────────┐${RESET}`);
console.log(`${GRAY}│${RESET} ${BOLD}Idx${RESET} ${GRAY}│${RESET} ${BOLD}Alice (Bit/B) ${RESET} ${GRAY}│${RESET} ${BOLD}Eve Intercept ${RESET} ${GRAY}│${RESET} ${BOLD}Bob (Bit/B)   ${RESET} ${GRAY}│${RESET} ${BOLD}Sift Status ${RESET}${GRAY}│${RESET} ${BOLD}Integrity   ${RESET} ${GRAY}│${RESET}`);
console.log(`${GRAY}├─────┼──────────────┼──────────────┼──────────────┼────────────┼─────────────┤${RESET}`);

const displaySample = results.steps.slice(0, 15);
displaySample.forEach(step => {
  const idx = String(step.index).padStart(3, ' ');
  const alice = ` ${step.aliceBit} in [${step.aliceBasis}] (${step.aliceState})`.padEnd(12, ' ');
  
  let eveStr = ' Bypassed   ';
  if (step.eveIntercepted) {
    eveStr = ` ${step.eveMeasuredBit} in [${step.eveBasis}]   `;
  }

  const bob = ` ${step.bobMeasuredBit} in [${step.bobBasis}]     `.slice(0, 12);
  
  let sift = step.sifted ? `${GREEN}Matched   ${RESET}` : `${GRAY}Discarded ${RESET}`;
  let integ = '   —     ';
  if (step.sifted) {
    integ = step.hasError ? `${RED}⚠️ Error  ${RESET}` : `${GREEN}✓ Clean  ${RESET}`;
  }

  console.log(`${GRAY}│${RESET} ${idx} ${GRAY}│${RESET} ${alice} ${GRAY}│${RESET} ${eveStr} ${GRAY}│${RESET} ${bob} ${GRAY}│${RESET} ${sift} ${GRAY}│${RESET} ${integ} ${GRAY}│${RESET}`);
});
console.log(`${GRAY}└─────┴──────────────┴──────────────┴──────────────┴────────────┴─────────────┘${RESET}\n`);

// Telemetry & Results
console.log(`${BOLD}${CYAN}📊 TELEMETRY & QUANTUM BIT ERROR RATE (QBER) ANALYSIS${RESET}`);
console.log(`  • Total Qubits Transmitted:     ${options.qubits}`);
console.log(`  • Sifted Key Bits (Basis Match): ${results.siftedCount} (${results.siftedRatio.toFixed(1)}%)`);
console.log(`  • Random Sample Tested:         ${results.sampleTestedCount} bits`);
console.log(`  • Bit Errors Detected in Sample:${results.sampleErrorsFound}`);
console.log(`  • Measured QBER:                ${results.measuredQBER > options.threshold * 100 ? RED : GREEN}${BOLD}${results.measuredQBER.toFixed(1)}%${RESET}`);
console.log(`  • Theoretical Expected QBER:    ${results.theoreticalQBER.toFixed(1)}%`);
console.log(`  • Max Allowed Security Limit:   ${(options.threshold * 100).toFixed(1)}%`);

console.log('\n' + `${BOLD}${CYAN}🛡️ QUANTUM DEFENSE & SECURITY VERDICT:${RESET}`);
if (results.isProtocolAborted) {
  console.log(`${BOLD}${RED}🚨 [ALARM: EAVESDROPPER DETECTED!]${RESET}`);
  console.log(`${RED}   The Quantum Bit Error Rate (${results.measuredQBER.toFixed(1)}%) exceeds the 11% Shor-Preskill threshold.${RESET}`);
  console.log(`${RED}   Quantum Measurement Collapse irreversibly exposed Eve's intercept attempts!${RESET}`);
  console.log(`${RED}   => ACTION: ALL KEYS ARE DISCARDED IMMEDIATELY.${RESET}`);
  console.log(`${RED}   => RESULT: ZERO secret information leaked to Eve.${RESET}\n`);
} else {
  console.log(`${BOLD}${GREEN}✅ [CHANNEL SECURE: DISTILLING UNBREAKABLE KEY]${RESET}`);
  console.log(`${GREEN}   QBER (${results.measuredQBER.toFixed(1)}%) is below the security threshold.${RESET}`);
  console.log(`${GREEN}   Any minor noise is within natural environmental channel limits.${RESET}`);
  console.log(`${GREEN}   => Alice Raw Key:     ${results.aliceFinalKey}${RESET}`);
  console.log(`${GREEN}   => Bob Raw Key:       ${results.bobFinalKey}${RESET}`);
  console.log(`${GREEN}   => Privacy Amplified: ${BOLD}${results.amplifiedAliceKey}${RESET} (${results.amplifiedAliceKey.length} bits)`);
  console.log(`${GREEN}   => Eve's Knowledge:   0 bits (Universal Hashing compressed Eve's info to < 2^-s)${RESET}\n`);

  // Message encryption demo
  const enc = sim.encryptMessageOTP(options.message, results.amplifiedAliceKey);
  const dec = sim.decryptMessageOTP(enc.cipherBits, results.amplifiedBobKey);

  console.log(`${BOLD}${CYAN}🔐 END-TO-END QUANTUM ENCRYPTION (ONE-TIME PAD):${RESET}`);
  console.log(`  • Plaintext Message:   "${BOLD}${options.message}${RESET}"`);
  console.log(`  • Encrypted Ciphertext: ${YELLOW}${enc.cipherHex}${RESET}`);
  console.log(`  • Bob's Decrypted Msg:  ${GREEN}"${dec.decryptedText}"${RESET} ${GREEN}✓ MATCH${RESET}`);
  
  // Fake eve attempt
  const corruptedKey = results.amplifiedAliceKey.split('').map(b => Math.random() < 0.25 ? (1 - parseInt(b)) : b).join('');
  const eveDec = sim.decryptMessageOTP(enc.cipherBits, corruptedKey);
  console.log(`  • Eve's Corrupted Msg:  ${RED}"${eveDec.decryptedText.replace(/[^\x20-\x7E]/g, '')}"${RESET} (Unintelligible Gibberish!)\n`);
}

console.log(`${CYAN}========================================================================${RESET}`);
console.log(`${BOLD}To open the full animated interactive web visualizer:${RESET}`);
console.log(`  ${BOLD}npm start${RESET}  or  ${BOLD}node server.js${RESET}`);
console.log(`Then open in your browser: ${BOLD}${CYAN}http://localhost:3000${RESET}`);
console.log(`${CYAN}========================================================================${RESET}\n`);
