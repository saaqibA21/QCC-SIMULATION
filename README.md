# ⚛️ QuantumShield: Quantum Communication & Eavesdropping Simulator

An interactive, high-fidelity quantum cryptography simulator demonstrating **Quantum Key Distribution (BB84 protocol)**, the physics of **quantum measurement collapse**, eavesdropping attacks by **Eve (Intercept-Resend & PNS attacks)**, and how quantum mechanics **detects and prevents** eavesdropping with mathematical certainty.

---

## 🌟 Quick Start

You can run the simulator in two modes:

### 1. Interactive Web Visualizer (Animated GUI)
```bash
# Start the built-in HTTP server (no external dependencies required)
npm start
# or: node server.js
```
Then open your browser at **[http://localhost:3000](http://localhost:3000)**.

### 2. Command Line Interface (CLI Simulator)
```bash
# Run with Eve eavesdropping active (will trigger breach detection & protocol abort):
node qkd_cli.js --qubits=60 --eve=true

# Run clean channel (channel secure, key distilled, OTP message encrypted):
node qkd_cli.js --qubits=60 --eve=false

# Custom parameters:
node qkd_cli.js --qubits=100 --eve=true --intercept=0.4 --noise=0.01 --threshold=0.11
```

---

## 🔬 How Quantum Communication Works (BB84 Protocol)

In classical communication (radio, fiber cables, copper wires), an eavesdropper can passively tap the cable, amplify the signal, or clone the bits without leaving any trace.

In **Quantum Communication**, information is encoded in the quantum states of single photons:

### 1. The Conjugate Bases
Alice encodes bits using two non-orthogonal (conjugate) measurement bases:
* **Rectilinear Basis ($+$)**:
  * Bit `0` $\rightarrow |0\rangle$ (Horizontal polarization, $0^\circ$)
  * Bit `1` $\rightarrow |1\rangle$ (Vertical polarization, $90^\circ$)
* **Diagonal / Hadamard Basis ($\times$)**:
  * Bit `0` $\rightarrow |+\rangle = \frac{1}{\sqrt{2}}(|0\rangle + |1\rangle)$ ($+45^\circ$)
  * Bit `1` $\rightarrow |-\rangle = \frac{1}{\sqrt{2}}(|0\rangle - |1\rangle)$ ($135^\circ$ / $-45^\circ$)

---

## 👁️ How Eve Eavesdrops (Intercept-Resend Attack)

Because single photons cannot be split or amplified without measurement:
1. Eve intercepts the flying photon in the quantum channel.
2. Because Eve does not know which basis Alice used ($+$ or $\times$), Eve must guess a basis at random.
3. Eve performs a quantum measurement in her chosen basis.
4. Eve creates a new photon in her measured state and forwards it to Bob.

---

## 🛡️ How Quantum Mechanics Detects & Prevents It

### 1. The No-Cloning Theorem (Wootters & Zurek, 1982)
It is mathematically impossible to clone an unknown quantum state:
$$U(|\psi\rangle |0\rangle) \neq |\psi\rangle |\psi\rangle$$
Eve cannot make a duplicate photon to keep for later analysis. She **must** interact with the in-flight qubit.

### 2. Quantum Measurement Collapse & Heisenberg Uncertainty
If Alice prepares a photon in basis $B_A$ and Eve measures in conjugate basis $B_E$:
* There is a **50% probability** that Eve guesses Alice's basis correctly ($P_{\text{match}} = 0.5$). In this case, the photon remains undisturbed.
* There is a **50% probability** that Eve chooses the wrong basis ($P_{\text{wrong}} = 0.5$). This forces the quantum state to **irreversibly collapse** into an eigenstate of Eve's basis:
  $$|0\rangle \xrightarrow{\text{Measure in } \times} |+\rangle \text{ or } |-\rangle$$
* When Bob subsequently measures in Alice's original basis ($+$), Bob now has a **50% probability of obtaining an error** ($1$ instead of $0$):
  $$P(\text{error} \mid \text{wrong basis}) = |\langle 1 | + \rangle|^2 = 0.5$$

### 3. The 25% Error Law
When Eve intercepts 100% of the qubits:
$$\text{QBER}_{\text{Eve}} = P(\text{wrong basis}) \times P(\text{error}) = 0.5 \times 0.5 = 25.0\%$$
If Eve intercepts a fraction $p$ of the qubits:
$$\text{QBER} = 0.25 \times p + e_{\text{channel}}$$

### 4. Public Sifting & Error Estimation
1. **Basis Sifting**: Alice and Bob publicly announce their basis choices ($+$ vs $\times$) over an authenticated classical channel. They discard all bits where their bases did not match ($\sim 50\%$).
2. **QBER Estimation**: Alice and Bob reveal a random sample (e.g. 33%) of their sifted bits to calculate the **Quantum Bit Error Rate (QBER)**:
   $$\text{QBER} = \frac{\text{errors observed}}{\text{tested sample bits}}$$

### 5. Security Threshold Gate & Protocol Abort
* **If $\text{QBER} > Q_{\text{threshold}}$ (Shor-Preskill security limit $\approx 11.0\%$):**
  * **STATUS: ALARM — EAVESDROPPER DETECTED!**
  * Alice and Bob immediately **ABORT** the protocol.
  * All sifted bits are discarded.
  * **Zero secret data is ever transmitted**. Eve obtains nothing but scrambled noise, and her presence is fully exposed.
* **If $\text{QBER} \le Q_{\text{threshold}}$:**
  * Noise is within environmental fiber tolerance.
  * Alice and Bob proceed to key distillation.

### 6. Information Reconciliation & Privacy Amplification
* **Error Correction (Cascade)**: Parity checks correct residual channel errors.
* **Privacy Amplification (Universal Hashing)**: Alice and Bob pass their key through a 2-Universal Hash function (Toeplitz matrix), compressing the key length. This squeezes Eve's mutual information exponentially down to near zero:
  $$I(A : E) \le \frac{2^{-s}}{\ln 2} \approx 0$$
* The result is an identical, provably unbreakable shared secret key used for **One-Time Pad (Vernam cipher)** encryption.

### 7. Decoy-State Protocol (PNS Attack Defense)
Real-world attenuated lasers emit weak coherent pulses where some pulses contain $\ge 2$ photons. An attacker could perform a **Photon Number Splitting (PNS)** attack (storing one photon and letting the other pass).
* **Prevention**: Alice randomly alternates pulse intensities:
  * Signal pulses ($\mu \approx 0.5$)
  * Decoy pulses ($\nu \approx 0.1$)
  * Vacuum pulses ($\mu = 0$)
* Alice and Bob compute the transmission yields $Y_n$. If Eve intercepts or filters pulses based on photon number, she distorts the expected Poisson statistics across intensity states and is immediately caught!

---

## 🖥️ Simulator Features

* **Visual Canvas Engine**: 60 FPS real-time rendering of photon wavepackets with rotating polarization arrows, optical channel fluctuations, and detector flashes.
* **Interactive Polarizer Compass**: Shows the qubit state vector on the rectilinear and diagonal axes in real-time.
* **Step-by-Step Inspector**: Inspect Alice's bit, preparation basis, Eve's intercept decision, state collapse, Bob's basis, sift outcome, and physics explanation for each individual photon.
* **Batch Simulator**: Instantly simulate up to 1,000 qubits to observe statistical convergence to the 25% QBER theoretical limit.
* **Telemetry & QBER Gauge**: Live visual gauge showing error rate vs the 11% Shor-Preskill limit.
* **End-to-End Cryptography Playground**: Encrypt real plaintext with One-Time Pad ($C = P \oplus K$), showing Bob's clean decryption versus Eve's corrupted failure.

---

## 📁 Project Architecture

```
c:\Users\SAAQIB\QCC\
├── server.js              # Native Node.js HTTP static server (Zero external dependencies)
├── qkd_cli.js             # Full-featured CLI simulator with ANSI tables & metrics
├── package.json           # Project manifest
├── README.md              # Documentation & quantum cryptography theory guide
└── public\
    ├── index.html         # Modern web application UI
    ├── css\
    │   └── styles.css     # Quantum dark-mode UI stylesheet
    └── js\
        ├── quantum-engine.js  # Core physics engine (BB84, QBER, Hashing, OTP)
        ├── visualizer.js      # Canvas & SVG particle/photon animation
        └── app.js             # State manager, event loop, and telemetry UI
```

---

## 📜 License
MIT License - Developed for Quantum Communication & Cryptography Education.
