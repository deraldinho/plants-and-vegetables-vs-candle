import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const width = 2400;
const height = 3200;

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Outfit:wght@200;300;400;600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: ${width}px;
    height: ${height}px;
    background-color: #06110a;
    color: #e2f1e6;
    font-family: 'JetBrains Mono', monospace;
    overflow: hidden;
    position: relative;
    -webkit-font-smoothing: antialiased;
  }

  /* Microscopic Grid Background */
  .grid-bg {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(20, 56, 36, 0.28) 1px, transparent 1px),
      linear-gradient(90deg, rgba(20, 56, 36, 0.28) 1px, transparent 1px),
      linear-gradient(rgba(35, 90, 58, 0.15) 2px, transparent 2px),
      linear-gradient(90deg, rgba(35, 90, 58, 0.15) 2px, transparent 2px);
    background-size: 40px 40px, 40px 40px, 200px 200px, 200px 200px;
    opacity: 0.85;
  }

  /* Radial Ambient Glow */
  .glow-core {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 1400px;
    height: 1400px;
    background: radial-gradient(circle, rgba(38, 166, 91, 0.16) 0%, rgba(243, 156, 18, 0.06) 45%, transparent 70%);
    pointer-events: none;
  }

  .canvas-frame {
    position: absolute;
    inset: 100px;
    border: 1px solid rgba(80, 160, 110, 0.35);
    pointer-events: none;
  }

  .canvas-inner-frame {
    position: absolute;
    inset: 120px;
    border: 1px solid rgba(80, 160, 110, 0.18);
    pointer-events: none;
  }

  /* SVG Graphics Layer */
  svg.master-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  /* Typography Layer */
  .title-block {
    position: absolute;
    top: 145px;
    left: 150px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .classification {
    font-size: 16px;
    letter-spacing: 0.35em;
    color: #4cd48a;
    font-weight: 500;
    text-transform: uppercase;
  }
  .main-title {
    font-family: 'Outfit', sans-serif;
    font-size: 54px;
    font-weight: 300;
    letter-spacing: -0.02em;
    color: #f0fdf4;
    line-height: 1.1;
  }
  .main-title strong {
    font-weight: 700;
    color: #ffd166;
  }
  .subtitle {
    font-size: 15px;
    color: #8da496;
    letter-spacing: 0.15em;
    max-width: 680px;
    line-height: 1.6;
  }

  .tech-meta-tr {
    position: absolute;
    top: 145px;
    right: 150px;
    text-align: right;
    font-size: 14px;
    color: #799786;
    line-height: 1.9;
    letter-spacing: 0.12em;
  }
  .tech-meta-tr strong {
    color: #4cd48a;
    font-weight: 600;
  }

  .footer-meta-bl {
    position: absolute;
    bottom: 145px;
    left: 150px;
    font-size: 14px;
    color: #799786;
    line-height: 1.8;
    letter-spacing: 0.12em;
  }
  .footer-meta-bl strong {
    color: #ffd166;
    font-weight: 600;
  }

  .footer-meta-br {
    position: absolute;
    bottom: 145px;
    right: 150px;
    text-align: right;
    font-size: 14px;
    color: #799786;
    line-height: 1.8;
    letter-spacing: 0.15em;
  }
  .footer-meta-br .cert-seal {
    display: inline-block;
    padding: 6px 16px;
    border: 1px solid rgba(76, 212, 138, 0.4);
    background: rgba(10, 36, 22, 0.4);
    color: #4cd48a;
    font-weight: 600;
    border-radius: 4px;
    margin-top: 8px;
    font-size: 13px;
  }
</style>
</head>
<body>
<div class="grid-bg"></div>
<div class="glow-core"></div>
<div class="canvas-frame"></div>
<div class="canvas-inner-frame"></div>

<svg class="master-canvas" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Gradients -->
    <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffd166" stop-opacity="0.8"/>
      <stop offset="35%" stop-color="#06d6a0" stop-opacity="0.4"/>
      <stop offset="70%" stop-color="#118ab2" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#073b4c" stop-opacity="0"/>
    </radialGradient>

    <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06d6a0" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#054f38" stop-opacity="0.3"/>
    </linearGradient>

    <linearGradient id="amberThermal" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ef476f" stop-opacity="0.75"/>
      <stop offset="50%" stop-color="#f78c6b" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#ffd166" stop-opacity="0.1"/>
    </linearGradient>

    <!-- Marker Symbol -->
    <pattern id="dotLattice" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="10" cy="10" r="1.2" fill="#2d6a4f" opacity="0.5"/>
    </pattern>
  </defs>

  <!-- Scalar Calibration Marks along Border -->
  <g stroke="rgba(76, 212, 138, 0.4)" stroke-width="1.5">
    ${Array.from({ length: 47 }, (_, i) => {
      const x = 120 + i * 46.95;
      return `<line x1="${x}" y1="95" x2="${x}" y2="${i % 5 === 0 ? "82" : "90"}"/>
              <line x1="${x}" y1="3105" x2="${x}" y2="${i % 5 === 0 ? "3118" : "3110"}"/>`;
    }).join("")}
    ${Array.from({ length: 63 }, (_, i) => {
      const y = 120 + i * 46.95;
      return `<line x1="95" y1="${y}" x2="${i % 5 === 0 ? "82" : "90"}" y2="${y}"/>
              <line x1="2305" y1="${y}" x2="${i % 5 === 0 ? "2318" : "2310"}" y2="${y}"/>`;
    }).join("")}
  </g>

  <!-- Axis Crosshairs -->
  <line x1="1200" y1="140" x2="1200" y2="3060" stroke="rgba(45, 106, 79, 0.25)" stroke-dasharray="6,6" stroke-width="1"/>
  <line x1="140" y1="1600" x2="2260" y2="1600" stroke="rgba(45, 106, 79, 0.25)" stroke-dasharray="6,6" stroke-width="1"/>

  <!-- ========================================== -->
  <!-- CENTRAL CELLULAR BOTANICAL ARCHITECTURE   -->
  <!-- ========================================== -->
  <g transform="translate(1200, 1600)">
    <!-- Monumental Outer Concentric Orbital Boundary -->
    <circle r="860" fill="none" stroke="rgba(76, 212, 138, 0.15)" stroke-width="1.5" stroke-dasharray="4,8"/>
    <circle r="780" fill="none" stroke="rgba(76, 212, 138, 0.35)" stroke-width="1.5"/>
    <circle r="740" fill="none" stroke="rgba(255, 209, 102, 0.25)" stroke-width="1" stroke-dasharray="12,6"/>
    <circle r="660" fill="none" stroke="rgba(76, 212, 138, 0.4)" stroke-width="2"/>
    <circle r="560" fill="none" stroke="rgba(6, 214, 160, 0.25)" stroke-width="1.5" stroke-dasharray="2,4"/>
    <circle r="460" fill="none" stroke="rgba(76, 212, 138, 0.5)" stroke-width="2.5"/>
    <circle r="360" fill="none" stroke="rgba(255, 209, 102, 0.45)" stroke-width="1.5"/>
    <circle r="240" fill="none" stroke="rgba(6, 214, 160, 0.6)" stroke-width="2"/>
    <circle r="120" fill="url(#sunGrad)"/>
    <circle r="120" fill="none" stroke="#ffd166" stroke-width="2.5"/>

    <!-- Concentric 360-degree Calibrated Tick Rings -->
    ${Array.from({ length: 120 }, (_, i) => {
      const angle = (i * 3 * Math.PI) / 180;
      const r1 = 660;
      const r2 = i % 10 === 0 ? 695 : i % 5 === 0 ? 682 : 672;
      const x1 = Math.cos(angle) * r1;
      const y1 = Math.sin(angle) * r1;
      const x2 = Math.cos(angle) * r2;
      const y2 = Math.sin(angle) * r2;
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" 
                    stroke="${i % 10 === 0 ? '#4cd48a' : 'rgba(76, 212, 138, 0.35)'}" stroke-width="${i % 10 === 0 ? '2' : '1'}"/>`;
    }).join("")}

    <!-- 12-Fold Sacred Hexagonal Radial Lattice (Cellular Geometry) -->
    ${Array.from({ length: 12 }, (_, i) => {
      const angle = (i * 30 * Math.PI) / 180;
      const x = Math.cos(angle) * 780;
      const y = Math.sin(angle) * 780;
      return `
        <line x1="0" y1="0" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(76, 212, 138, 0.2)" stroke-width="1.2"/>
        <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="#ffd166" opacity="0.8"/>
        <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="14" fill="none" stroke="#4cd48a" stroke-width="1" opacity="0.5"/>
      `;
    }).join("")}

    <!-- Interlocking Hexagonal Cellular Chambers (The Stomata & Cellulose Matrix) -->
    ${[160, 280, 420, 580].map((radius, rIdx) => {
      const count = 6 * (rIdx + 1);
      return Array.from({ length: count }, (_, j) => {
        const a = (j * (360 / count) * Math.PI) / 180;
        const cx = Math.cos(a) * radius;
        const cy = Math.sin(a) * radius;
        const hexR = 24 + rIdx * 6;
        const hexPts = Array.from({ length: 6 }, (__, k) => {
          const ha = ((k * 60 + 30) * Math.PI) / 180;
          return `${(cx + Math.cos(ha) * hexR).toFixed(1)},${(cy + Math.sin(ha) * hexR).toFixed(1)}`;
        }).join(" ");
        return `<polygon points="${hexPts}" fill="rgba(6, 214, 160, 0.04)" stroke="rgba(76, 212, 138, ${0.45 - rIdx * 0.08})" stroke-width="1.5"/>
                <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="2" fill="#ffd166" opacity="0.6"/>`;
      }).join("");
    }).join("")}

    <!-- Opposing Thermal Incursion Wave arcs (Candle / Heat Entropy dissipated by Botanical barrier) -->
    ${[790, 810, 830, 850].map((r, idx) => {
      // East quadrant thermal arcs (representing incoming burning sucrose entropy being stopped)
      const startAngle = -Math.PI / 4;
      const endAngle = Math.PI / 4;
      const x1 = Math.cos(startAngle) * r;
      const y1 = Math.sin(startAngle) * r;
      const x2 = Math.cos(endAngle) * r;
      const y2 = Math.sin(endAngle) * r;
      return `<path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" 
                    fill="none" stroke="rgba(239, 71, 111, ${0.7 - idx * 0.15})" stroke-width="${3 - idx * 0.5}" stroke-dasharray="${16 + idx * 8}, ${8 + idx * 4}"/>`;
    }).join("")}

    <!-- Dissipation Vectors at Frontier -->
    ${Array.from({ length: 15 }, (_, i) => {
      const a = ((-40 + i * 5.7) * Math.PI) / 180;
      const rIn = 780;
      const rOut = 880 + (i % 3) * 25;
      const xi = Math.cos(a) * rIn;
      const yi = Math.sin(a) * rIn;
      const xo = Math.cos(a) * rOut;
      const yo = Math.sin(a) * rOut;
      return `<line x1="${xi.toFixed(1)}" y1="${yi.toFixed(1)}" x2="${xo.toFixed(1)}" y2="${yo.toFixed(1)}" 
                    stroke="rgba(247, 140, 107, 0.6)" stroke-width="1.5"/>
              <circle cx="${xo.toFixed(1)}" cy="${yo.toFixed(1)}" r="3" fill="#ef476f"/>`;
    }).join("")}

    <!-- Mathematical Spirals (Fibonacci Phyllotaxis Sequence) -->
    ${Array.from({ length: 80 }, (_, n) => {
      const theta = n * 137.5 * (Math.PI / 180);
      const r = Math.sqrt(n) * 44;
      const px = Math.cos(theta) * r;
      const py = Math.sin(theta) * r;
      return `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${Math.max(1.5, 4.5 - n * 0.04)}" fill="#4cd48a" opacity="${Math.max(0.2, 0.85 - n * 0.008)}"/>`;
    }).join("")}

    <!-- Central Solar Core Glyph -->
    <polygon points="0,-75 65,37 -65,37" fill="none" stroke="#ffd166" stroke-width="2"/>
    <polygon points="0,75 65,-37 -65,-37" fill="none" stroke="#ffd166" stroke-width="2"/>
    <circle cx="0" cy="0" r="16" fill="#ffd166"/>
  </g>

  <!-- ========================================== -->
  <!-- FOUR TECHNICAL ANALYTICAL MARGINALIA SECTORS -->
  <!-- ========================================== -->

  <!-- SECTOR A (Upper Left): Microscopic Stomata & Cellular Array -->
  <g transform="translate(180, 520)">
    <rect width="420" height="260" fill="rgba(8, 28, 18, 0.6)" stroke="rgba(76, 212, 138, 0.4)" stroke-width="1.2" rx="4"/>
    <text x="24" y="36" fill="#4cd48a" font-size="14" font-weight="700" letter-spacing="0.2em">FIG. 01 — CELLULAR HEXAGONAL ARRAY</text>
    <text x="24" y="58" fill="#8da496" font-size="12" letter-spacing="0.1em">TURGOR HYDRAULIC REINFORCEMENT</text>
    <line x1="24" y1="72" x2="396" y2="72" stroke="rgba(76, 212, 138, 0.25)" stroke-width="1"/>
    
    <!-- Mini Hex Grid -->
    <g transform="translate(40, 95)">
      ${Array.from({ length: 4 }, (_, r) => 
        Array.from({ length: 6 }, (__, c) => {
          const hx = c * 52 + (r % 2) * 26;
          const hy = r * 30;
          return `<polygon points="${hx},${hy-12} ${hx+20},${hy-4} ${hx+20},${hy+12} ${hx},${hy+20} ${hx-20},${hy+12} ${hx-20},${hy-4}" 
                          fill="rgba(6, 214, 160, 0.08)" stroke="#4cd48a" stroke-width="1.2"/>
                  <circle cx="${hx}" cy="${hy+4}" r="2" fill="#ffd166"/>`;
        }).join("")
      ).join("")}
    </g>

    <text x="24" y="240" fill="#a2b8ab" font-size="11" letter-spacing="0.15em">LATTICE INTEGRITY: 99.98% · COMPR. RATIO 1.618</text>
  </g>

  <!-- SECTOR B (Upper Right): Photonic Spectral Absorption Curve -->
  <g transform="translate(1800, 520)">
    <rect width="420" height="260" fill="rgba(8, 28, 18, 0.6)" stroke="rgba(76, 212, 138, 0.4)" stroke-width="1.2" rx="4"/>
    <text x="24" y="36" fill="#4cd48a" font-size="14" font-weight="700" letter-spacing="0.2em">FIG. 02 — SPECTRAL CHLOROPHYLL FLUX</text>
    <text x="24" y="58" fill="#8da496" font-size="12" letter-spacing="0.1em">PHOTON HARVESTING AT λ = 430nm / 662nm</text>
    <line x1="24" y1="72" x2="396" y2="72" stroke="rgba(76, 212, 138, 0.25)" stroke-width="1"/>
    
    <!-- Waveform Chart -->
    <path d="M 30 200 Q 80 90, 110 110 T 170 190 T 260 185 T 320 100 T 380 200" fill="none" stroke="#ffd166" stroke-width="2.5"/>
    <path d="M 30 200 Q 80 90, 110 110 T 170 190 T 260 185 T 320 100 T 380 200 L 380 210 L 30 210 Z" fill="rgba(255, 209, 102, 0.08)"/>
    <line x1="30" y1="210" x2="390" y2="210" stroke="rgba(76, 212, 138, 0.5)" stroke-width="1"/>
    <line x1="110" y1="80" x2="110" y2="210" stroke="rgba(255, 209, 102, 0.5)" stroke-dasharray="3,3" stroke-width="1"/>
    <line x1="320" y1="80" x2="320" y2="210" stroke="rgba(255, 209, 102, 0.5)" stroke-dasharray="3,3" stroke-width="1"/>
    
    <text x="110" y="75" fill="#ffd166" font-size="10" text-anchor="middle">PEAK α (430)</text>
    <text x="320" y="75" fill="#ffd166" font-size="10" text-anchor="middle">PEAK β (662)</text>
    <text x="24" y="240" fill="#a2b8ab" font-size="11" letter-spacing="0.15em">EFFICIENCY: +88.4% OVER COMBUSTION YIELD</text>
  </g>

  <!-- SECTOR C (Lower Left): Turgor Pressure Hydraulic Balance -->
  <g transform="translate(180, 2420)">
    <rect width="420" height="260" fill="rgba(8, 28, 18, 0.6)" stroke="rgba(76, 212, 138, 0.4)" stroke-width="1.2" rx="4"/>
    <text x="24" y="36" fill="#4cd48a" font-size="14" font-weight="700" letter-spacing="0.2em">FIG. 03 — ROOT HYDRAULIC PRESSURE</text>
    <text x="24" y="58" fill="#8da496" font-size="12" letter-spacing="0.1em">HYDROSTATIC VASCULAR TENSION</text>
    <line x1="24" y1="72" x2="396" y2="72" stroke="rgba(76, 212, 138, 0.25)" stroke-width="1"/>
    
    <!-- Dial / Concentric Barometer -->
    <g transform="translate(210, 150)">
      <circle r="60" fill="none" stroke="rgba(76, 212, 138, 0.3)" stroke-width="8"/>
      <circle r="60" fill="none" stroke="#4cd48a" stroke-width="8" stroke-dasharray="270 377" stroke-dashoffset="0"/>
      <circle r="44" fill="none" stroke="rgba(255, 209, 102, 0.35)" stroke-width="1.5"/>
      <line x1="0" y1="0" x2="35" y2="-28" stroke="#ffd166" stroke-width="2.5"/>
      <circle cx="0" cy="0" r="5" fill="#ffd166"/>
      <text x="0" y="32" fill="#e2f1e6" font-size="12" font-weight="700" text-anchor="middle">1.42 MPa</text>
    </g>

    <text x="24" y="240" fill="#a2b8ab" font-size="11" letter-spacing="0.15em">OSMOTIC POTENTIAL: MAXIMAL RESISTANCE</text>
  </g>

  <!-- SECTOR D (Lower Right): Thermal Deflection & Wax Liquefaction Phase -->
  <g transform="translate(1800, 2420)">
    <rect width="420" height="260" fill="rgba(8, 28, 18, 0.6)" stroke="rgba(76, 212, 138, 0.4)" stroke-width="1.2" rx="4"/>
    <text x="24" y="36" fill="#4cd48a" font-size="14" font-weight="700" letter-spacing="0.2em">FIG. 04 — THERMAL PHASE TRANSITION</text>
    <text x="24" y="58" fill="#8da496" font-size="12" letter-spacing="0.1em">SACCHARINE MELT DISSIPATION</text>
    <line x1="24" y1="72" x2="396" y2="72" stroke="rgba(76, 212, 138, 0.25)" stroke-width="1"/>
    
    <!-- Step / Barrier Curve -->
    <path d="M 30 200 L 160 200 L 220 110 L 390 110" fill="none" stroke="#ef476f" stroke-width="2.5"/>
    <line x1="220" y1="80" x2="220" y2="210" stroke="rgba(239, 71, 111, 0.4)" stroke-dasharray="3,3"/>
    <rect x="30" y="110" width="130" height="90" fill="rgba(76, 212, 138, 0.08)"/>
    <text x="95" y="155" fill="#4cd48a" font-size="11" text-anchor="middle">ORGANIC SOLID</text>
    <text x="305" y="155" fill="#ef476f" font-size="11" text-anchor="middle">ENTROPIC DISSOLVE</text>

    <text x="24" y="240" fill="#a2b8ab" font-size="11" letter-spacing="0.15em">WAX THRESHOLD: NEUTRALIZED AT 62.5°C</text>
  </g>

  <!-- Technical Coordinate Markers & Subtitle Labels (Sparse, Clinical) -->
  <text x="1200" y="710" fill="#4cd48a" font-size="13" letter-spacing="0.3em" text-anchor="middle">VECTOR EQUILIBRIUM: POLAR RADIAL SYMMETRY // SYSTEMIC CELLULAR SHIELD</text>
  <text x="1200" y="2490" fill="#ffd166" font-size="13" letter-spacing="0.25em" text-anchor="middle">MATHEMATICAL PHYTODEFENSE CARTOGRAPHY · SPECIMEN 07-S2</text>
  <text x="1200" y="2515" fill="#799786" font-size="11" letter-spacing="0.15em" text-anchor="middle">PRECISE COORDINATES: [X: 1200.00 / Y: 1600.00] · ZERO ENTROPIC PERCOLATION OBSERVED</text>
</svg>

<div class="title-block">
  <span class="classification">SPECULATIVE BOTANICAL CARTOGRAPHY // ARCHIVE SERIES 07</span>
  <h1 class="main-title">Chlorophyll <strong>Geometry</strong></h1>
  <p class="subtitle">Systematic diagram of cellular hydraulic fortitude, photonic absorption networks, and thermal entropy dissipation at the biological frontier.</p>
</div>

<div class="tech-meta-tr">
  <div>PLATE NO: <strong>VII-BOTANICA</strong></div>
  <div>COORDINATE: <strong>51°10'44"N 1°49'34"W</strong></div>
  <div>TURGOR CONSTANT: <strong>k = 1.618033</strong></div>
  <div>SERIES: <strong>PLANTS VS CONFECTION</strong></div>
  <div>FIDELITY: <strong>ARCHIVAL 300 DPI</strong></div>
</div>

<div class="footer-meta-bl">
  <div>MUSEUM ACCESSION: <strong>INV-2026.09.27</strong></div>
  <div>RESEARCH CORPS: <strong>HEALTHY FAMILY INSTITUTE OF SPECULATIVE PHYTOLOGY</strong></div>
  <div>SUBSTRATE: <strong>CALIBRATED ARCHIVAL VELLUM // PIGMENT RESISTANT</strong></div>
</div>

<div class="footer-meta-br">
  <div>CURATED WITH MASTER CRAFTSMANSHIP</div>
  <div>ALL RIGHTS RESERVED // MASTER EDITION</div>
  <div class="cert-seal">AUTHENTICATED MASTER ART OBJECT</div>
</div>

</body>
</html>`;

const outputPathAssets = path.resolve("assets", "canvas-design-chlorophyll-geometry.png");
const outputPathDocs = path.resolve("docs", "canvas-design-chlorophyll-geometry.png");

// Ensure dirs exist
fs.mkdirSync(path.dirname(outputPathAssets), { recursive: true });
fs.mkdirSync(path.dirname(outputPathDocs), { recursive: true });

console.log("Launching Chromium for 2400x3200 render...");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width, height },
  deviceScaleFactor: 1
});

await page.setContent(htmlContent, { waitUntil: "networkidle" });
// Wait for fonts
await page.evaluate(() => document.fonts.ready);

console.log("Capturing master artwork PNG...");
const imageBuffer = await page.screenshot({ type: "png", fullPage: true });

fs.writeFileSync(outputPathAssets, imageBuffer);
fs.writeFileSync(outputPathDocs, imageBuffer);

console.log(`Saved master artwork:
- ${outputPathAssets} (${imageBuffer.length} bytes)
- ${outputPathDocs} (${imageBuffer.length} bytes)`);

await browser.close();
