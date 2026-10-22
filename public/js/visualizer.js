/**
 * QuantumShield - Interactive Visualizer
 * Renders:
 * - Animated Quantum Channel (Alice -> [Eve Intercept] -> Bob)
 * - Flying Photons with rotating polarization arrows and wavepacket envelopes
 * - Polarization Circle / Bloch disc
 * - Measurement collapse effects and visual detector flashes
 */

(function(exports) {
  'use strict';

  class QuantumVisualizer {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.dpr = window.devicePixelRatio || 1;

      // Animation state
      this.activePhotons = [];
      this.particles = [];
      this.animId = null;
      this.isRunning = true;

      // Stations layout coordinates
      this.stations = {
        alice: { x: 100, y: 0, w: 110, h: 140 },
        eve: { x: 0, y: 0, w: 120, h: 140 },
        bob: { x: 0, y: 0, w: 110, h: 140 }
      };

      this.width = this.canvas.clientWidth || 800;
      this.height = this.canvas.clientHeight || 250;
      this.resize();

      window.addEventListener('resize', () => this.resize());
      this.startLoop();
    }

    resize() {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      this.width = rect.width || this.canvas.clientWidth || 800;
      this.height = rect.height || this.canvas.clientHeight || 250;
      this.canvas.width = this.width * this.dpr;
      this.canvas.height = this.height * this.dpr;
      this.ctx.scale(this.dpr, this.dpr);
      this.recalculatePositions();
    }

    recalculatePositions() {
      if (!this.stations || !this.stations.alice) return;
      const centerY = this.height / 2;
      this.stations.alice.x = 130;
      this.stations.alice.y = centerY;

      this.stations.bob.x = Math.max(340, this.width - 130);
      this.stations.bob.y = centerY;

      this.stations.eve.x = this.width / 2;
      this.stations.eve.y = centerY;
    }

    startLoop() {
      const render = () => {
        this.update();
        this.draw();
        this.animId = requestAnimationFrame(render);
      };
      this.animId = requestAnimationFrame(render);
    }

    /**
     * Dispatch an animated photon flight across the channel
     * Supports both BB84 single flight and MDI-QKD dual-flight to central relay
     */
    launchPhoton(stepData, speed = 1.0, onComplete = null) {
      const centerY = this.height / 2;

      if (stepData.protocol === 'mdi') {
        // MDI-QKD Dual Photon Flight:
        // Alice photon travels left-to-right to Charlie
        // Bob photon travels right-to-left to Charlie
        const startAliceX = this.stations.alice.x + 54;
        const startBobX = this.stations.bob.x - 54;
        const targetCharlieX = this.stations.eve.x;

        const photonA = {
          x: startAliceX,
          y: centerY,
          startX: startAliceX,
          speed: 4.5 * speed,
          targetX: targetCharlieX,
          stage: 'flying_to_charlie',
          stepData: stepData,
          color: this.getStateColor(stepData.aliceBasis === '+' ? (stepData.aliceBit === 0 ? 0 : 90) : (stepData.aliceBit === 0 ? 45 : 135)),
          label: stepData.aliceState
        };

        const photonB = {
          x: startBobX,
          y: centerY,
          startX: startBobX,
          speed: -4.5 * speed,
          targetX: targetCharlieX,
          stage: 'flying_to_charlie',
          stepData: stepData,
          color: this.getStateColor(stepData.bobBasis === '+' ? (stepData.bobBit === 0 ? 0 : 90) : (stepData.bobBit === 0 ? 45 : 135)),
          label: stepData.bobState,
          isBobPhoton: true,
          onComplete: onComplete
        };

        this.activePhotons.push(photonA, photonB);
        return;
      }

      // Standard BB84 Single Photon Flight
      const startX = this.stations.alice.x + 54;
      const targetEveX = this.stations.eve.x;
      const targetBobX = this.stations.bob.x - 54;

      const photon = {
        x: startX,
        y: centerY,
        startY: centerY,
        startX: startX,
        stepData: stepData,
        speed: 4.5 * speed,
        phase: 0,
        stage: 'alice_to_eve',
        targetBobX: targetBobX,
        targetEveX: targetEveX,
        eveWaitTicks: 0,
        bobWaitTicks: 0,
        color: this.getStateColor(stepData.aliceAngle),
        label: stepData.aliceState,
        onComplete: onComplete
      };

      this.activePhotons.push(photon);
    }

    getStateColor(angle) {
      switch (angle) {
        case 0: return '#ffffff';    // H (0°): Crisp Pure White
        case 90: return '#e27838';   // V (90°): Warm Copper Glow
        case 45: return '#f59e0b';   // D+ (45°): Luminous Amber
        case 135: return '#ef4444';  // D- (135°): Crimson Pulse
        default: return '#fb923c';
      }
    }

    createSparks(x, y, color, count = 12) {
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 1 + Math.random() * 3.5;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          alpha: 1.0,
          color: color,
          size: 1.5 + Math.random() * 2
        });
      }
    }

    update() {
      // Update particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.035;
        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
        }
      }

      // Update active photons
      for (let i = this.activePhotons.length - 1; i >= 0; i--) {
        const ph = this.activePhotons[i];
        ph.phase += 0.15;

        // MDI-QKD Inward Flight to Charlie
        if (ph.stage === 'flying_to_charlie') {
          ph.x += ph.speed;
          const reachedTarget = ph.speed > 0 ? (ph.x >= ph.targetX) : (ph.x <= ph.targetX);
          if (reachedTarget) {
            ph.stage = 'done';
            const sparkColor = ph.stepData.bellStateDetected ? '#34d399' : '#f59e0b';
            this.createSparks(ph.targetX, ph.y, sparkColor, 18);
            if (ph.isBobPhoton && ph.onComplete) {
              ph.onComplete(ph.stepData);
            }
            this.activePhotons.splice(i, 1);
          }
          continue;
        }

        if (ph.stage === 'alice_to_eve') {
          if (ph.stepData.eveIntercepted) {
            ph.x += ph.speed;
            if (ph.x >= ph.targetEveX) {
              ph.x = ph.targetEveX;
              ph.stage = 'eve_processing';
              ph.eveWaitTicks = 18;
              this.createSparks(ph.x, ph.y, '#f59e0b', 16);
            }
          } else {
            ph.x += ph.speed;
            if (ph.x >= ph.targetBobX) {
              ph.x = ph.targetBobX;
              ph.stage = 'bob_measuring';
              ph.bobWaitTicks = 14;
              this.createSparks(ph.x, ph.y, ph.color, 14);
            }
          }
        } else if (ph.stage === 'eve_processing') {
          ph.eveWaitTicks--;
          if (ph.eveWaitTicks <= 0) {
            ph.stage = 'eve_to_bob';
            // Change color to Eve's state if state changed
            const eveAngle = ph.stepData.eveBasis === '+' 
              ? (ph.stepData.eveMeasuredBit === 0 ? 0 : 90)
              : (ph.stepData.eveMeasuredBit === 0 ? 45 : 135);
            ph.color = this.getStateColor(eveAngle);
          }
        } else if (ph.stage === 'eve_to_bob') {
          ph.x += ph.speed;
          if (ph.x >= ph.targetBobX) {
            ph.x = ph.targetBobX;
            ph.stage = 'bob_measuring';
            ph.bobWaitTicks = 16;
            this.createSparks(ph.x, ph.y, ph.color, 16);
          }
        } else if (ph.stage === 'bob_measuring') {
          ph.bobWaitTicks--;
          if (ph.bobWaitTicks <= 0) {
            ph.stage = 'done';
            if (ph.onComplete) ph.onComplete(ph.stepData);
            this.activePhotons.splice(i, 1);
          }
        }
      }
    }

    draw() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.width, this.height);

      // Draw background grid lines
      this.drawGrid();

      // Draw Quantum Optical Fiber Channel
      this.drawChannel();

      // Draw Stations
      this.drawAliceStation();
      this.drawEveStation();
      this.drawBobStation();

      // Draw Photons
      this.drawPhotons();

      // Draw Particles
      this.drawParticles();
    }

    drawGrid() {
      const ctx = this.ctx;
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      const step = 32;
      for (let x = 0; x < this.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, this.height);
        ctx.stroke();
      }
      for (let y = 0; y < this.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.width, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawChannel() {
      const ctx = this.ctx;
      const centerY = this.height / 2;
      const startX = this.stations.alice.x + 54;
      const eveX = this.stations.eve.x;
      const endX = this.stations.bob.x - 54;
      const isActive = window.isEveActive !== undefined ? window.isEveActive : true;

      ctx.save();
      // Outer fiber ambient glow with warm copper tint
      ctx.beginPath();
      ctx.moveTo(startX, centerY);
      ctx.lineTo(endX, centerY);
      ctx.lineWidth = 22;
      ctx.strokeStyle = isActive ? 'rgba(226, 120, 56, 0.15)' : 'rgba(245, 158, 11, 0.1)';
      ctx.stroke();

      // Dashed quantum channel line
      ctx.beginPath();
      ctx.moveTo(startX, centerY);
      ctx.lineTo(isActive ? (eveX - 54) : endX, centerY);
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#e27838';
      ctx.setLineDash([10, 8]);
      ctx.stroke();

      if (isActive) {
        ctx.beginPath();
        ctx.moveTo(eveX + 54, centerY);
        ctx.lineTo(endX, centerY);
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#f59e0b';
        ctx.setLineDash([10, 8]);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Flowing quantum vacuum fluctuation waves
      const time = Date.now() * 0.002;
      ctx.beginPath();
      for (let x = startX; x <= endX; x += 10) {
        const wave = Math.sin(x * 0.04 - time) * 4;
        if (x === startX) ctx.moveTo(x, centerY + wave);
        else ctx.lineTo(x, centerY + wave);
      }
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.stroke();

      // Channel description caption comfortably above line
      const isMDI = window.currentProtocol === 'mdi';
      ctx.fillStyle = '#fed7aa';
      ctx.font = '700 12px monospace';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '1px';
      ctx.fillText(
        isMDI 
          ? 'MDI-QKD: ALICE & BOB TRANSMIT INWARD TO UNTRUSTED BSM RELAY' 
          : 'QUBITS TRAVEL THROUGH QUANTUM OPTICAL FIBER CHANNEL', 
        (startX + endX) / 2, 
        centerY - 38
      );

      ctx.restore();
    }

    drawAliceStation() {
      const ctx = this.ctx;
      const { x, y } = this.stations.alice;

      ctx.save();
      // Outer ring
      ctx.beginPath();
      ctx.arc(x, y, 66, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Inner circular node
      ctx.beginPath();
      ctx.arc(x, y, 52, 0, Math.PI * 2);
      ctx.fillStyle = '#1c1c20';
      ctx.fill();
      ctx.strokeStyle = '#e2e2e7';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Node Letter "A"
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 34px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('A', x, y);

      // Label below
      ctx.font = '800 15px system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('ALICE', x, y + 76);
      ctx.font = '600 11px system-ui, sans-serif';
      ctx.fillStyle = '#8e8e98';
      ctx.fillText('Qubit Transmitter', x, y + 94);

      ctx.restore();
    }

    drawEveStation() {
      const ctx = this.ctx;
      const { x, y } = this.stations.eve;
      const isMDI = window.currentProtocol === 'mdi';
      const isActive = window.isEveActive !== undefined ? window.isEveActive : true;
      const isBlinding = window.currentAttackStrategy === 'detector-blinding';

      ctx.save();
      if (isMDI) {
        // CHARLIE: Untrusted Relay in MDI-QKD
        ctx.beginPath();
        ctx.arc(x, y, 66, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, y, 52, 0, Math.PI * 2);
        ctx.fillStyle = '#1e1c18';
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#fed7aa';
        ctx.font = '900 34px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('C', x, y);

        ctx.font = '800 15px system-ui, sans-serif';
        ctx.fillStyle = '#fed7aa';
        ctx.fillText('CHARLIE', x, y + 76);
        ctx.font = '600 11px system-ui, sans-serif';
        ctx.fillStyle = '#f59e0b';
        ctx.fillText('Untrusted BSM Relay', x, y + 94);
        ctx.fillStyle = '#34d399';
        ctx.fillText('Immune to Detector Blinding', x, y + 108);
      } else if (isActive) {
        // Pulsing warm copper-amber warning aura
        const time = Date.now() * 0.003;
        const pulseR = 66 + Math.sin(time) * 5;
        ctx.beginPath();
        ctx.arc(x, y, pulseR, 0, Math.PI * 2);
        ctx.strokeStyle = isBlinding ? 'rgba(239, 68, 68, 0.7)' : 'rgba(226, 120, 56, 0.6)';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Inner circular node
        ctx.beginPath();
        ctx.arc(x, y, 52, 0, Math.PI * 2);
        ctx.fillStyle = isBlinding ? '#3b1010' : '#26140d';
        ctx.fill();
        ctx.strokeStyle = isBlinding ? '#ef4444' : '#e27838';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Node Letter "E"
        ctx.fillStyle = isBlinding ? '#f87171' : '#fb923c';
        ctx.font = '900 34px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('E', x, y);

        // Label below
        ctx.font = '800 15px system-ui, sans-serif';
        ctx.fillStyle = isBlinding ? '#f87171' : '#fb923c';
        ctx.fillText('EVE', x, y + 76);
        ctx.font = '600 11px system-ui, sans-serif';
        ctx.fillStyle = isBlinding ? '#fca5a5' : '#fed7aa';
        ctx.fillText(isBlinding ? 'Detector-Blinding Attack' : 'Intercept & Resend', x, y + 94);
      } else {
        // Inactive / Bypassed Eve
        ctx.beginPath();
        ctx.arc(x, y, 52, 0, Math.PI * 2);
        ctx.fillStyle = '#141417';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#5a5a64';
        ctx.font = '900 30px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('E', x, y);

        ctx.font = '700 13px system-ui, sans-serif';
        ctx.fillStyle = '#5a5a64';
        ctx.fillText('EVE (OFF)', x, y + 76);
        ctx.font = '600 11px system-ui, sans-serif';
        ctx.fillText('Bypassed', x, y + 94);
      }

      ctx.restore();
    }

    drawBobStation() {
      const ctx = this.ctx;
      const { x, y } = this.stations.bob;

      ctx.save();
      // Outer glowing ring
      ctx.beginPath();
      ctx.arc(x, y, 66, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Inner circular node
      ctx.beginPath();
      ctx.arc(x, y, 52, 0, Math.PI * 2);
      ctx.fillStyle = '#1f1b14';
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Node Letter "B"
      ctx.fillStyle = '#fde68a';
      ctx.font = '900 34px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('B', x, y);

      // Label below
      ctx.font = '800 15px system-ui, sans-serif';
      ctx.fillStyle = '#fde68a';
      ctx.fillText('BOB', x, y + 76);
      ctx.font = '600 11px system-ui, sans-serif';
      ctx.fillStyle = '#8e8e98';
      ctx.fillText('Qubit Detector', x, y + 94);

      ctx.restore();
    }

    drawPhotons() {
      const ctx = this.ctx;

      this.activePhotons.forEach(ph => {
        ctx.save();
        ctx.translate(ph.x, ph.y);

        // Glowing wavepacket aura
        const gradient = ctx.createRadialGradient(0, 0, 5, 0, 0, 34);
        gradient.addColorStop(0, ph.color);
        gradient.addColorStop(0.5, ph.color + '88');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, 34, 0, Math.PI * 2);
        ctx.fill();

        // Core bright photon sphere
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();

        // Polarization vector arrow
        const angleRad = (ph.stepData.aliceAngle * Math.PI) / 180;
        const arrowLen = 22;
        const dx = Math.cos(angleRad) * arrowLen;
        const dy = -Math.sin(angleRad) * arrowLen;

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(-dx, -dy);
        ctx.lineTo(dx, dy);
        ctx.stroke();

        // Label above photon
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(ph.stepData.aliceState, 0, -32);

        ctx.restore();
      });
    }

    drawParticles() {
      const ctx = this.ctx;
      this.particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    roundRect(ctx, x, y, width, height, radius, fill, stroke) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      if (fill) ctx.fill();
      if (stroke) ctx.stroke();
    }
  }

  /**
   * Polarization State Compass (renders the 4 states: |0⟩, |1⟩, |+⟩, |-⟩)
   */
  class StateCompass {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.dpr = window.devicePixelRatio || 1;
      this.w = this.canvas.clientWidth || 220;
      this.h = this.canvas.clientHeight || 180;
      this.canvas.width = this.w * this.dpr;
      this.canvas.height = this.h * this.dpr;
      this.ctx.scale(this.dpr, this.dpr);

      this.currentAngle = 0;
      this.currentStateLabel = '|0⟩';
      this.draw();
    }

    setState(angle, label) {
      this.currentAngle = angle;
      this.currentStateLabel = label;
      this.draw();
    }

    draw() {
      const ctx = this.ctx;
      const cx = this.w / 2;
      const cy = this.h / 2;
      const r = Math.min(cx, cy) - 28;

      ctx.clearRect(0, 0, this.w, this.h);

      // Outer circle
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // Rectilinear axes (+ basis)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(cx - r, cy);
      ctx.lineTo(cx + r, cy);
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx, cy + r);
      ctx.stroke();

      // Diagonal axes (x basis)
      ctx.strokeStyle = 'rgba(226, 120, 56, 0.45)';
      ctx.beginPath();
      const d = r * Math.cos(Math.PI / 4);
      ctx.moveTo(cx - d, cy - d);
      ctx.lineTo(cx + d, cy + d);
      ctx.moveTo(cx - d, cy + d);
      ctx.lineTo(cx + d, cy - d);
      ctx.stroke();
      ctx.setLineDash([]);

      // Axis labels
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('|0⟩ (H)', cx + r + 20, cy + 4);
      ctx.fillText('|1⟩ (V)', cx, cy - r - 10);

      ctx.fillStyle = '#e27838';
      ctx.fillText('|+⟩ (45°)', cx + d + 16, cy - d);
      ctx.fillText('|-⟩ (135°)', cx - d - 20, cy - d);

      // Active state vector
      const rad = (this.currentAngle * Math.PI) / 180;
      const vx = Math.cos(rad) * (r - 6);
      const vy = -Math.sin(rad) * (r - 6);

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + vx, cy + vy);
      ctx.stroke();

      // Arrowhead / tip
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(cx + vx, cy + vy, 6, 0, Math.PI * 2);
      ctx.fill();

      // Center pivot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();

      // State text inside center
      ctx.fillStyle = '#fed7aa';
      ctx.font = '900 15px monospace';
      ctx.fillText(this.currentStateLabel, cx, cy + 30);
    }
  }

  exports.QuantumVisualizer = QuantumVisualizer;
  exports.StateCompass = StateCompass;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.QuantumVisualizerModule = {}));
