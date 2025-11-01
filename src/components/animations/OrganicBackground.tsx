'use client';

import { motion, useAnimationControls } from 'framer-motion';
import { useMemo, useState, useEffect } from 'react';

interface Organism {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  type: 'cell' | 'spore' | 'microbe' | 'particle' | 'morula' | 'euglena' | 'tardigrade' | 'bacterium' | 'algae' | 'pollen';
  opacity: number;
  colorVariant: number; // 0-1 for color variation
}

/**
 * OrganicBackground - Subtle animation inspired by microscopic life
 *
 * Features:
 * - Cells dividing and merging
 * - Spores floating and drifting
 * - Microorganisms pulsing
 * - Growth and decay cycles
 * - All in subtle, natural motion
 */
export function OrganicBackground() {
  // Generate organisms with varied characteristics
  const organisms = useMemo(() => {
    const items: Organism[] = [];
    const count = 50; // 1.66x organisms to ensure 3-4 complex ones (morula/euglena/tardigrade) are visible

    for (let i = 0; i < count; i++) {
      items.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 40 + 20, // 20-60px (middle ground)
        duration: Math.random() * 80 + 60, // 60-140 seconds (3-4x longer for more wandering)
        delay: Math.random() * -20, // Stagger starts
        // Distribution: bacteria & pollen (10x each), simple organisms (5x each), complex organisms (1x each)
        // This gives ~42% bacteria/pollen, ~52% simple, ~6% complex (morula/euglena/tardigrade will be 2-3 total)
        type: [
          // Bacteria (10x)
          'bacterium', 'bacterium', 'bacterium', 'bacterium', 'bacterium',
          'bacterium', 'bacterium', 'bacterium', 'bacterium', 'bacterium',
          // Pollen (10x)
          'pollen', 'pollen', 'pollen', 'pollen', 'pollen',
          'pollen', 'pollen', 'pollen', 'pollen', 'pollen',
          // Simple organisms (5x each)
          'cell', 'cell', 'cell', 'cell', 'cell',
          'spore', 'spore', 'spore', 'spore', 'spore',
          'microbe', 'microbe', 'microbe', 'microbe', 'microbe',
          'particle', 'particle', 'particle', 'particle', 'particle',
          'algae', 'algae', 'algae', 'algae', 'algae',
          // Complex organisms (1x each) - very rare, only 2-3 will appear out of 30 organisms
          'morula', 'euglena', 'tardigrade',
        ][Math.floor(Math.random() * 48)] as Organism['type'],
        opacity: Math.random() * 0.15 + 0.15, // More visible: 0.15-0.30 (doubled from 0.05-0.20)
        colorVariant: Math.random(), // 0-1 for color mixing
      });
    }

    return items;
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {organisms.map((organism) => {
        // Calculate journey across screen with life cycle
        const startX = organism.x;
        const startY = organism.y;

        // Random direction and distance
        const travelX = (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 50);
        const travelY = (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 40);

        // Different animation patterns for different types - all with birth → life → death
        const getAnimation = () => {
          switch (organism.type) {
            case 'cell':
              // Cells: drift across screen, grow from division, then die
              return {
                x: [0, travelX * 0.3, travelX * 0.7, travelX],
                y: [0, travelY * 0.2, travelY * 0.6, travelY],
                scale: [0.3, 1.2, 1.3, 0.2], // Born small (division), grow, mature, shrink (death)
                opacity: [0, organism.opacity * 2.2, organism.opacity * 2.5, organism.opacity * 1.8, 0], // Peak visibility during maturity
                rotate: [0, 40, 80, 120],
              };
            case 'spore':
              // Spores: swim with flagella motion, born → live → die
              return {
                x: [0, travelX * 0.4, travelX * 0.6, travelX * 0.9, travelX],
                y: [0, travelY * 0.3, travelY * 0.2, travelY * 0.7, travelY],
                rotate: [0, -25, -45, -60, -80], // Flagella propulsion
                scale: [0.2, 1.1, 1.3, 1.0, 0.3], // Born, grow, mature, die
                opacity: [0, organism.opacity * 2.0, organism.opacity * 2.5, organism.opacity * 2.2, organism.opacity * 1.5, 0], // Brightest during maturity
              };
            case 'microbe':
              // Microbes: erratic wandering, pulsing as it moves, born → die
              return {
                x: [0, travelX * 0.3, travelX * 0.6, travelX * 0.4, travelX * 0.9, travelX],
                y: [0, travelY * 0.5, travelY * 0.3, travelY * 0.8, travelY * 0.6, travelY],
                scale: [0.3, 1.4, 1.0, 1.5, 1.2, 0.2], // Pulsing + life cycle
                opacity: [0, organism.opacity * 2.3, organism.opacity * 2.0, organism.opacity * 2.6, organism.opacity * 2.2, organism.opacity * 1.6, 0], // Most visible mid-life
                rotate: [0, 40, -30, 70, -20, 80],
              };
            case 'particle':
              // Diatoms: sink slowly, tumbling, then disappear at bottom
              return {
                x: [0, travelX * 0.2, travelX * 0.4, travelX * 0.5],
                y: [0, travelY * 0.4, travelY * 0.75, travelY],
                rotate: [0, 120, 240, 360],
                scale: [0.3, 1.1, 1.0, 0.5],
                opacity: [0, organism.opacity * 2.0, organism.opacity * 2.3, organism.opacity * 1.8, 0], // More visible while floating
              };
            case 'morula':
              // Morula: 1 cell → divides to 2 → 4 → 8 → 16 (morula stage) → loses cells → decays
              return {
                x: [0, travelX * 0.25, travelX * 0.5, travelX * 0.7, travelX * 0.85, travelX],
                y: [0, travelY * 0.2, travelY * 0.4, travelY * 0.6, travelY * 0.8, travelY],
                scale: [0.5, 0.8, 1.0, 1.2, 1.0, 0.4], // Grows as cells divide, shrinks as it decays
                opacity: [0, organism.opacity * 2.0, organism.opacity * 2.5, organism.opacity * 2.3, organism.opacity * 1.5, 0],
                rotate: [0, 30, 60, 90, 120, 150],
              };
            case 'euglena':
              // Euglena: swims with characteristic undulating motion, rotating as it moves
              return {
                x: [0, travelX * 0.3, travelX * 0.5, travelX * 0.7, travelX * 0.9, travelX],
                y: [0, travelY * 0.4, travelY * 0.3, travelY * 0.6, travelY * 0.5, travelY],
                rotate: [0, 90, 180, 270, 360, 450], // Continuous spiral rotation
                scale: [0.3, 1.1, 1.2, 1.3, 1.1, 0.3], // Born, mature, die
                opacity: [0, organism.opacity * 2.0, organism.opacity * 2.6, organism.opacity * 2.4, organism.opacity * 1.8, 0],
              };
            case 'tardigrade':
              // Tardigrade: slow lumbering walk with slight rocking motion
              return {
                x: [0, travelX * 0.2, travelX * 0.4, travelX * 0.6, travelX * 0.8, travelX],
                y: [0, travelY * 0.3, travelY * 0.25, travelY * 0.5, travelY * 0.45, travelY],
                rotate: [0, 5, -5, 8, -8, 0], // Subtle rocking as it walks
                scale: [0.3, 1.0, 1.1, 1.2, 1.0, 0.2], // Born small, grows, dies
                opacity: [0, organism.opacity * 2.2, organism.opacity * 2.8, organism.opacity * 2.6, organism.opacity * 2.0, 0],
              };
            case 'bacterium':
              // Bacterium: Simple rod shape, tumbling motion
              return {
                x: [0, travelX * 0.4, travelX * 0.6, travelX * 0.9, travelX],
                y: [0, travelY * 0.3, travelY * 0.6, travelY * 0.4, travelY],
                rotate: [0, 90, 180, 270, 360], // Tumbling
                scale: [0.4, 1.0, 1.2, 1.0, 0.4], // Born, grow, die
                opacity: [0, organism.opacity * 2.5, organism.opacity * 2.8, organism.opacity * 2.2, 0],
              };
            case 'algae':
              // Algae: Simple spherical cell, gentle drift
              return {
                x: [0, travelX * 0.3, travelX * 0.5, travelX * 0.8, travelX],
                y: [0, travelY * 0.2, travelY * 0.5, travelY * 0.7, travelY],
                rotate: [0, 30, 60, 90, 120], // Slow rotation
                scale: [0.3, 1.1, 1.3, 1.1, 0.3], // Born, grow, die
                opacity: [0, organism.opacity * 2.3, organism.opacity * 2.7, organism.opacity * 2.0, 0],
              };
            case 'pollen':
              // Pollen: Spiky sphere, gentle tumbling
              return {
                x: [0, travelX * 0.4, travelX * 0.5, travelX * 0.7, travelX],
                y: [0, travelY * 0.4, travelY * 0.3, travelY * 0.6, travelY],
                rotate: [0, 45, 90, 135, 180], // Gentle rotation
                scale: [0.4, 1.0, 1.2, 1.0, 0.4], // Born, mature, die
                opacity: [0, organism.opacity * 2.4, organism.opacity * 2.6, organism.opacity * 2.1, 0],
              };
          }
        };

        const animation = getAnimation();

        return (
          <motion.div
            key={organism.id}
            className="absolute rounded-full"
            style={{
              left: `${startX}%`,
              top: `${startY}%`,
              width: organism.size,
              height: organism.size,
            }}
            animate={animation}
            transition={{
              duration: organism.duration,
              delay: organism.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {/* Different visual styles for different organisms */}
            {organism.type === 'cell' && (
              <CellOrganism size={organism.size} opacity={organism.opacity} colorVariant={organism.colorVariant} />
            )}
            {organism.type === 'spore' && (
              <SporeOrganism size={organism.size} opacity={organism.opacity} colorVariant={organism.colorVariant} />
            )}
            {organism.type === 'microbe' && (
              <MicrobeOrganism size={organism.size} opacity={organism.opacity} colorVariant={organism.colorVariant} />
            )}
            {organism.type === 'particle' && (
              <ParticleOrganism size={organism.size} opacity={organism.opacity} colorVariant={organism.colorVariant} />
            )}
            {organism.type === 'morula' && (
              <MorulaOrganism
                size={organism.size}
                opacity={organism.opacity}
                colorVariant={organism.colorVariant}
                duration={organism.duration}
                delay={organism.delay}
              />
            )}
            {organism.type === 'euglena' && (
              <EuglenaOrganism size={organism.size} opacity={organism.opacity} colorVariant={organism.colorVariant} />
            )}
            {organism.type === 'tardigrade' && (
              <TardigradeOrganism size={organism.size} opacity={organism.opacity} colorVariant={organism.colorVariant} />
            )}
            {organism.type === 'bacterium' && (
              <BacteriumOrganism size={organism.size} opacity={organism.opacity} colorVariant={organism.colorVariant} />
            )}
            {organism.type === 'algae' && (
              <AlgaeOrganism size={organism.size} opacity={organism.opacity} colorVariant={organism.colorVariant} />
            )}
            {organism.type === 'pollen' && (
              <PollenOrganism size={organism.size} opacity={organism.opacity} colorVariant={organism.colorVariant} />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// Cell organism - organic blob with prominent nucleus and organelles
function CellOrganism({ size, opacity, colorVariant }: { size: number; opacity: number; colorVariant: number }) {
  const cellId = useMemo(() => `cell-${Math.random()}`, []);

  // Color palette: #2D5016 (forest), #4A7C59 (sage), #588157 (nature), #3a5a40 (dark nature)
  // Mix between these based on colorVariant - memoized for SSR consistency
  const membraneColor = useMemo(() => colorVariant < 0.33 ? '#4A7C59' : colorVariant < 0.66 ? '#588157' : '#3a5a40', [colorVariant]);
  const cytoplasmColor = useMemo(() => colorVariant < 0.5 ? '#2D5016' : '#3a5a40', [colorVariant]);
  const nucleusColor1 = useMemo(() => colorVariant < 0.4 ? '#8B7355' : colorVariant < 0.7 ? '#4A7C59' : '#588157', [colorVariant]);
  const nucleusColor2 = useMemo(() => colorVariant < 0.5 ? '#4A7C59' : '#588157', [colorVariant]);

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <radialGradient id={`${cellId}-membrane`}>
          <stop offset="0%" stopColor={membraneColor} stopOpacity={opacity * 0.8} />
          <stop offset="100%" stopColor={cytoplasmColor} stopOpacity={opacity * 0.3} />
        </radialGradient>
        <radialGradient id={`${cellId}-nucleus`}>
          <stop offset="0%" stopColor={nucleusColor1} stopOpacity={opacity * 1.8} />
          <stop offset="100%" stopColor={nucleusColor2} stopOpacity={opacity * 1.2} />
        </radialGradient>
      </defs>

      {/* Organic blob cell membrane (not a perfect circle) */}
      <path
        d="M 50 5 Q 70 8, 85 25 Q 95 45, 90 65 Q 78 88, 55 95 Q 30 93, 15 75 Q 5 50, 12 28 Q 25 8, 50 5 Z"
        fill={`url(#${cellId}-membrane)`}
        stroke={membraneColor}
        strokeWidth="1.5"
        opacity={opacity * 1.5}
      />

      {/* Cytoplasm details (organelles) */}
      <circle cx="35" cy="35" r="4" fill={cytoplasmColor} opacity={opacity * 1.2} />
      <circle cx="68" cy="38" r="3" fill={cytoplasmColor} opacity={opacity * 1.1} />
      <circle cx="38" cy="68" r="3.5" fill={cytoplasmColor} opacity={opacity * 1.3} />
      <ellipse cx="25" cy="55" rx="3" ry="5" fill={cytoplasmColor} opacity={opacity * 1.15} />

      {/* Prominent nucleus with nucleolus */}
      <circle cx="50" cy="50" r="18" fill={`url(#${cellId}-nucleus)`} stroke={nucleusColor1} strokeWidth="1" opacity={opacity * 2} />
      <circle cx="50" cy="50" r="6" fill="#D4A574" opacity={opacity * 2.5} />
    </svg>
  );
}

// Spore organism - teardrop shape with visible flagellum
function SporeOrganism({ size, opacity, colorVariant }: { size: number; opacity: number; colorVariant: number }) {
  const sporeId = useMemo(() => `spore-${Math.random()}`, []);

  // Earth tones: #D4A574 (sand), #8B7355 (brown), #A89968 (olive-brown) - memoized for SSR consistency
  const bodyColor1 = useMemo(() => colorVariant < 0.4 ? '#D4A574' : colorVariant < 0.7 ? '#C9A66B' : '#A89968', [colorVariant]);
  const bodyColor2 = useMemo(() => colorVariant < 0.5 ? '#8B7355' : '#9A7D5F', [colorVariant]);
  const strokeColor = useMemo(() => colorVariant < 0.5 ? '#8B7355' : '#A89968', [colorVariant]);

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <radialGradient id={`${sporeId}-body`}>
          <stop offset="0%" stopColor={bodyColor1} stopOpacity={opacity * 2} />
          <stop offset="100%" stopColor={bodyColor2} stopOpacity={opacity * 0.8} />
        </radialGradient>
      </defs>

      {/* Long flagellum (whip-like tail) */}
      <path
        d="M 50 65 Q 48 80, 52 90 Q 49 100, 48 110 Q 50 115, 52 118"
        stroke={strokeColor}
        strokeWidth="1.5"
        fill="none"
        opacity={opacity * 2}
        strokeLinecap="round"
      />

      {/* Spore body (teardrop) */}
      <ellipse cx="50" cy="45" rx="18" ry="28" fill={`url(#${sporeId}-body)`} stroke={strokeColor} strokeWidth="1" opacity={opacity * 2} />

      {/* Internal detail */}
      <ellipse cx="50" cy="42" rx="8" ry="12" fill={bodyColor2} opacity={opacity * 1.5} />
    </svg>
  );
}

// Microbe organism - amoeba-like with multiple cilia
function MicrobeOrganism({ size, opacity, colorVariant }: { size: number; opacity: number; colorVariant: number }) {
  const microbeId = useMemo(() => `microbe-${Math.random()}`, []);

  // Green tones: #4A7C59 (sage), #588157 (nature), #3a5a40 (dark nature), #2D5016 (forest) - memoized for SSR consistency
  const bodyColor1 = useMemo(() => colorVariant < 0.35 ? '#4A7C59' : colorVariant < 0.65 ? '#588157' : '#5a8a6d', [colorVariant]);
  const bodyColor2 = useMemo(() => colorVariant < 0.5 ? '#2D5016' : '#3a5a40', [colorVariant]);
  const ciliaColor = useMemo(() => colorVariant < 0.4 ? '#4A7C59' : colorVariant < 0.7 ? '#588157' : '#5a8a6d', [colorVariant]);

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <radialGradient id={`${microbeId}-body`}>
          <stop offset="0%" stopColor={bodyColor1} stopOpacity={opacity * 1.5} />
          <stop offset="60%" stopColor={bodyColor2} stopOpacity={opacity * 1} />
          <stop offset="100%" stopColor={bodyColor2} stopOpacity={opacity * 0.3} />
        </radialGradient>
      </defs>

      {/* Multiple cilia around the body (hair-like projections) */}
      <line x1="72" y1="30" x2="82" y2="25" stroke={ciliaColor} strokeWidth="1" opacity={opacity * 2} strokeLinecap="round" />
      <line x1="77" y1="40" x2="90" y2="38" stroke={ciliaColor} strokeWidth="1" opacity={opacity * 2} strokeLinecap="round" />
      <line x1="78" y1="50" x2="92" y2="52" stroke={ciliaColor} strokeWidth="1" opacity={opacity * 2} strokeLinecap="round" />
      <line x1="75" y1="60" x2="88" y2="65" stroke={ciliaColor} strokeWidth="1" opacity={opacity * 2} strokeLinecap="round" />
      <line x1="68" y1="70" x2="78" y2="78" stroke={ciliaColor} strokeWidth="1" opacity={opacity * 2} strokeLinecap="round" />

      <line x1="28" y1="30" x2="18" y2="25" stroke={ciliaColor} strokeWidth="1" opacity={opacity * 2} strokeLinecap="round" />
      <line x1="23" y1="40" x2="10" y2="38" stroke={ciliaColor} strokeWidth="1" opacity={opacity * 2} strokeLinecap="round" />
      <line x1="22" y1="50" x2="8" y2="52" stroke={ciliaColor} strokeWidth="1" opacity={opacity * 2} strokeLinecap="round" />
      <line x1="25" y1="60" x2="12" y2="65" stroke={ciliaColor} strokeWidth="1" opacity={opacity * 2} strokeLinecap="round" />
      <line x1="32" y1="70" x2="22" y2="78" stroke={ciliaColor} strokeWidth="1" opacity={opacity * 2} strokeLinecap="round" />

      {/* Irregular amoeba body */}
      <path
        d="M 50 18 Q 68 20, 78 35 Q 82 50, 78 65 Q 68 78, 50 80 Q 32 78, 22 65 Q 18 50, 22 35 Q 32 20, 50 18 Z"
        fill={`url(#${microbeId}-body)`}
        stroke={bodyColor1}
        strokeWidth="1"
        opacity={opacity * 2}
      />

      {/* Internal structures (vacuoles) */}
      <circle cx="45" cy="40" r="6" fill={bodyColor2} opacity={opacity * 1.8} />
      <circle cx="58" cy="48" r="5" fill={bodyColor2} opacity={opacity * 1.6} />
      <circle cx="48" cy="60" r="4" fill={bodyColor2} opacity={opacity * 1.7} />
    </svg>
  );
}

// Particle organism - diatom (algae with detailed shell pattern)
function ParticleOrganism({ size, opacity, colorVariant }: { size: number; opacity: number; colorVariant: number }) {
  const particleId = useMemo(() => `particle-${Math.random()}`, []);

  // Golden/amber tones: #D4A574 (sand), #C9A66B (tan), #B8956A (dark tan), #8B7355 (brown) - memoized for SSR consistency
  const shellColor1 = useMemo(() => colorVariant < 0.3 ? '#D4A574' : colorVariant < 0.6 ? '#C9A66B' : '#E0B982', [colorVariant]);
  const shellColor2 = useMemo(() => colorVariant < 0.5 ? '#8B7355' : '#9A7D5F', [colorVariant]);
  const patternColor = useMemo(() => colorVariant < 0.4 ? '#8B7355' : colorVariant < 0.7 ? '#9A7D5F' : '#A68968', [colorVariant]);

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <radialGradient id={`${particleId}-shell`}>
          <stop offset="0%" stopColor={shellColor1} stopOpacity={opacity * 2.5} />
          <stop offset="100%" stopColor={shellColor2} stopOpacity={opacity * 1} />
        </radialGradient>
      </defs>

      {/* Diatom shell (pill-shaped with pattern) */}
      <ellipse cx="50" cy="50" rx="35" ry="20" fill={`url(#${particleId}-shell)`} stroke={shellColor2} strokeWidth="1.5" opacity={opacity * 2.2} />

      {/* Shell pattern (radial lines) */}
      <line x1="50" y1="30" x2="50" y2="42" stroke={patternColor} strokeWidth="1" opacity={opacity * 2} />
      <line x1="50" y1="58" x2="50" y2="70" stroke={patternColor} strokeWidth="1" opacity={opacity * 2} />
      <line x1="40" y1="34" x2="44" y2="44" stroke={patternColor} strokeWidth="0.8" opacity={opacity * 1.8} />
      <line x1="60" y1="34" x2="56" y2="44" stroke={patternColor} strokeWidth="0.8" opacity={opacity * 1.8} />
      <line x1="40" y1="66" x2="44" y2="56" stroke={patternColor} strokeWidth="0.8" opacity={opacity * 1.8} />
      <line x1="60" y1="66" x2="56" y2="56" stroke={patternColor} strokeWidth="0.8" opacity={opacity * 1.8} />

      {/* Central division line */}
      <line x1="20" y1="50" x2="80" y2="50" stroke={patternColor} strokeWidth="1" opacity={opacity * 2.5} />

      {/* Dots pattern */}
      <circle cx="35" cy="45" r="1.5" fill={patternColor} opacity={opacity * 2} />
      <circle cx="35" cy="55" r="1.5" fill={patternColor} opacity={opacity * 2} />
      <circle cx="50" cy="45" r="1.5" fill={patternColor} opacity={opacity * 2} />
      <circle cx="50" cy="55" r="1.5" fill={patternColor} opacity={opacity * 2} />
      <circle cx="65" cy="45" r="1.5" fill={patternColor} opacity={opacity * 2} />
      <circle cx="65" cy="55" r="1.5" fill={patternColor} opacity={opacity * 2} />
    </svg>
  );
}

// Morula organism - multicellular cluster that divides: 1 → 2 → 4 → 8 → 16 cells, then loses cells and decays
function MorulaOrganism({ size, opacity, colorVariant, duration, delay }: { size: number; opacity: number; colorVariant: number; duration: number; delay: number }) {
  const morulaId = useMemo(() => `morula-${Math.random()}`, []);

  // Color palette: sage greens with slight blue tint (embryonic) - memoized for SSR consistency
  const cellColor1 = useMemo(() => colorVariant < 0.35 ? '#4A7C59' : colorVariant < 0.65 ? '#588157' : '#5a8a6d', [colorVariant]);
  const cellColor2 = useMemo(() => colorVariant < 0.5 ? '#3a5a40' : '#2D5016', [colorVariant]);

  // Animate cell count through division stages
  const [cellCount, setCellCount] = useState(1);

  useEffect(() => {
    // Cell division stages: 1 → 2 → 4 → 8 → 16 → mature → decay (12 → 4 → 0)
    const stageDurations = [
      duration * 0.167,  // 1 → 2 cells (stay at 1 for this duration)
      duration * 0.167,  // 2 → 4 cells (stay at 2 for this duration)
      duration * 0.167,  // 4 → 8 cells
      duration * 0.167,  // 8 → 16 cells
      duration * 0.166,  // 16 cells (mature - stay here)
      duration * 0.083,  // 16 → 12 (start losing)
      duration * 0.083,  // 12 → 4 (decay)
      duration * 0.083,  // 4 → 0 (death)
    ];

    const stages = [1, 2, 4, 8, 16, 12, 4, 0];
    let currentStage = 0;

    const advanceStage = () => {
      setCellCount(stages[currentStage]);
      const nextDuration = stageDurations[currentStage];
      currentStage = (currentStage + 1) % stages.length;
      setTimeout(advanceStage, nextDuration);
    };

    const initialDelay = Math.abs(delay) * 1000;
    const timeoutId = setTimeout(advanceStage, initialDelay);

    return () => clearTimeout(timeoutId);
  }, [duration, delay]);

  // Calculate cell positions in a cluster (approximating sphere packing)
  const getCellPositions = (count: number): { x: number; y: number; r: number }[] => {
    if (count === 0) return [];
    if (count === 1) return [{ x: 50, y: 50, r: 12 }];
    if (count === 2) return [
      { x: 40, y: 50, r: 10 },
      { x: 60, y: 50, r: 10 },
    ];
    if (count <= 4) {
      // 2x2 grid
      return [
        { x: 40, y: 40, r: 8 },
        { x: 60, y: 40, r: 8 },
        { x: 40, y: 60, r: 8 },
        { x: 60, y: 60, r: 8 },
      ].slice(0, count);
    }
    if (count <= 8) {
      // Compact cluster (2 layers)
      return [
        { x: 35, y: 35, r: 7 },
        { x: 50, y: 30, r: 7 },
        { x: 65, y: 35, r: 7 },
        { x: 35, y: 50, r: 7 },
        { x: 65, y: 50, r: 7 },
        { x: 35, y: 65, r: 7 },
        { x: 50, y: 70, r: 7 },
        { x: 65, y: 65, r: 7 },
      ].slice(0, count);
    }
    // 16 cells - morula (3D-ish sphere packing)
    return [
      // Inner layer (4 cells)
      { x: 42, y: 42, r: 6 },
      { x: 58, y: 42, r: 6 },
      { x: 42, y: 58, r: 6 },
      { x: 58, y: 58, r: 6 },
      // Middle layer (8 cells)
      { x: 32, y: 35, r: 5.5 },
      { x: 50, y: 28, r: 5.5 },
      { x: 68, y: 35, r: 5.5 },
      { x: 32, y: 50, r: 5.5 },
      { x: 68, y: 50, r: 5.5 },
      { x: 32, y: 65, r: 5.5 },
      { x: 50, y: 72, r: 5.5 },
      { x: 68, y: 65, r: 5.5 },
      // Outer layer (4 cells)
      { x: 25, y: 42, r: 5 },
      { x: 75, y: 42, r: 5 },
      { x: 25, y: 58, r: 5 },
      { x: 75, y: 58, r: 5 },
    ].slice(0, count);
  };

  const cells = getCellPositions(cellCount);

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <radialGradient id={`${morulaId}-cell`}>
          <stop offset="0%" stopColor={cellColor1} stopOpacity={opacity * 2.5} />
          <stop offset="70%" stopColor={cellColor2} stopOpacity={opacity * 1.5} />
          <stop offset="100%" stopColor={cellColor2} stopOpacity={opacity * 0.5} />
        </radialGradient>
      </defs>

      {/* Render each cell */}
      {cells.map((cell, index) => (
        <g key={index}>
          {/* Cell membrane */}
          <circle
            cx={cell.x}
            cy={cell.y}
            r={cell.r}
            fill={`url(#${morulaId}-cell)`}
            stroke={cellColor1}
            strokeWidth="0.8"
            opacity={opacity * 2.2}
          />
          {/* Small nucleus */}
          <circle cx={cell.x} cy={cell.y} r={cell.r * 0.35} fill={cellColor2} opacity={opacity * 2.8} />
        </g>
      ))}
    </svg>
  );
}

// Euglena organism - elongated green cell with red eyespot and flagellum
function EuglenaOrganism({ size, opacity, colorVariant }: { size: number; opacity: number; colorVariant: number }) {
  const euglenaId = useMemo(() => `euglena-${Math.random()}`, []);

  // Color palette: Green body (chloroplasts), red eyespot - memoized for SSR consistency
  const bodyColor1 = useMemo(() => colorVariant < 0.35 ? '#4A7C59' : colorVariant < 0.65 ? '#588157' : '#6B9C70', [colorVariant]);
  const bodyColor2 = useMemo(() => colorVariant < 0.5 ? '#3a5a40' : '#2D5016', [colorVariant]);
  const chloroplastColor = useMemo(() => colorVariant < 0.4 ? '#2D5016' : colorVariant < 0.7 ? '#3a5a40' : '#4A7C59', [colorVariant]);
  const eyespotColor = '#D32F2F'; // Distinctive red eyespot (stigma)

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        {/* Body gradient - elongated green */}
        <linearGradient id={`${euglenaId}-body`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={bodyColor1} stopOpacity={opacity * 2.5} />
          <stop offset="50%" stopColor={bodyColor2} stopOpacity={opacity * 2.0} />
          <stop offset="100%" stopColor={bodyColor1} stopOpacity={opacity * 1.8} />
        </linearGradient>

        {/* Eyespot gradient - red with bright center */}
        <radialGradient id={`${euglenaId}-eyespot`}>
          <stop offset="0%" stopColor="#FF5252" stopOpacity={opacity * 3.5} />
          <stop offset="50%" stopColor={eyespotColor} stopOpacity={opacity * 3.0} />
          <stop offset="100%" stopColor="#B71C1C" stopOpacity={opacity * 2.5} />
        </radialGradient>
      </defs>

      {/* Flagellum (whip-like tail extending from front) */}
      <path
        d="M 50 15 Q 45 8, 42 0 Q 40 -5, 38 -8"
        stroke={bodyColor2}
        strokeWidth="1.2"
        fill="none"
        opacity={opacity * 2.2}
        strokeLinecap="round"
      />

      {/* Main elongated body (snake-like shape) */}
      <ellipse
        cx="50"
        cy="50"
        rx="12"
        ry="35"
        fill={`url(#${euglenaId}-body)`}
        stroke={bodyColor1}
        strokeWidth="1"
        opacity={opacity * 2.3}
      />

      {/* Chloroplasts (small green ovals scattered in body) */}
      <ellipse cx="45" cy="30" rx="3" ry="6" fill={chloroplastColor} opacity={opacity * 2.5} />
      <ellipse cx="55" cy="35" rx="3" ry="6" fill={chloroplastColor} opacity={opacity * 2.4} />
      <ellipse cx="47" cy="45" rx="3" ry="6" fill={chloroplastColor} opacity={opacity * 2.6} />
      <ellipse cx="53" cy="50" rx="3" ry="6" fill={chloroplastColor} opacity={opacity * 2.3} />
      <ellipse cx="48" cy="60" rx="3" ry="6" fill={chloroplastColor} opacity={opacity * 2.5} />
      <ellipse cx="52" cy="65" rx="3" ry="6" fill={chloroplastColor} opacity={opacity * 2.4} />

      {/* Red eyespot (stigma) - distinctive feature at anterior end */}
      <circle
        cx="50"
        cy="22"
        r="4"
        fill={`url(#${euglenaId}-eyespot)`}
        opacity={opacity * 3.2}
      />

      {/* Nucleus (slightly posterior) */}
      <circle cx="50" cy="48" r="5" fill={bodyColor2} opacity={opacity * 2.8} />

      {/* Pellicle stripes (subtle helical stripes on body surface) */}
      <path
        d="M 40 25 Q 52 27, 60 25"
        stroke={bodyColor2}
        strokeWidth="0.5"
        fill="none"
        opacity={opacity * 1.5}
      />
      <path
        d="M 40 40 Q 52 42, 60 40"
        stroke={bodyColor2}
        strokeWidth="0.5"
        fill="none"
        opacity={opacity * 1.5}
      />
      <path
        d="M 40 55 Q 52 57, 60 55"
        stroke={bodyColor2}
        strokeWidth="0.5"
        fill="none"
        opacity={opacity * 1.5}
      />
      <path
        d="M 40 70 Q 52 72, 60 70"
        stroke={bodyColor2}
        strokeWidth="0.5"
        fill="none"
        opacity={opacity * 1.5}
      />
    </svg>
  );
}

// Tardigrade organism - water bear with 8 legs, segmented body, claws
function TardigradeOrganism({ size, opacity, colorVariant }: { size: number; opacity: number; colorVariant: number }) {
  const tardigradeId = useMemo(() => `tardigrade-${Math.random()}`, []);

  // Color palette: Translucent grayish-brown (realistic tardigrade colors) - memoized for SSR consistency
  const bodyColor1 = useMemo(() => colorVariant < 0.35 ? '#8B7355' : colorVariant < 0.65 ? '#9A8470' : '#A89968', [colorVariant]);
  const bodyColor2 = useMemo(() => colorVariant < 0.5 ? '#6B5D4F' : '#7A6E5C', [colorVariant]);
  const segmentColor = useMemo(() => colorVariant < 0.4 ? '#6B5D4F' : colorVariant < 0.7 ? '#7A6E5C' : '#8B7D6B', [colorVariant]);
  const legColor = useMemo(() => colorVariant < 0.5 ? '#7A6E5C' : '#8B7355', [colorVariant]);

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        {/* Body gradient - translucent appearance */}
        <radialGradient id={`${tardigradeId}-body`}>
          <stop offset="0%" stopColor={bodyColor1} stopOpacity={opacity * 2.0} />
          <stop offset="60%" stopColor={bodyColor2} stopOpacity={opacity * 1.8} />
          <stop offset="100%" stopColor={bodyColor2} stopOpacity={opacity * 1.2} />
        </radialGradient>
      </defs>

      {/* Tardigrade body - 4 segments */}

      {/* Head segment (narrower, with mouth) */}
      <ellipse
        cx="50"
        cy="35"
        rx="11"
        ry="9"
        fill={`url(#${tardigradeId}-body)`}
        stroke={segmentColor}
        strokeWidth="1"
        opacity={opacity * 2.2}
      />

      {/* Segment 1 (first pair of legs) */}
      <ellipse
        cx="50"
        cy="47"
        rx="13"
        ry="10"
        fill={`url(#${tardigradeId}-body)`}
        stroke={segmentColor}
        strokeWidth="0.8"
        opacity={opacity * 2.3}
      />

      {/* Segment 2 (second pair of legs) */}
      <ellipse
        cx="50"
        cy="59"
        rx="13"
        ry="10"
        fill={`url(#${tardigradeId}-body)`}
        stroke={segmentColor}
        strokeWidth="0.8"
        opacity={opacity * 2.3}
      />

      {/* Segment 3 (third pair of legs) */}
      <ellipse
        cx="50"
        cy="71"
        rx="12"
        ry="9"
        fill={`url(#${tardigradeId}-body)`}
        stroke={segmentColor}
        strokeWidth="0.8"
        opacity={opacity * 2.2}
      />

      {/* Tail segment (fourth pair of legs) */}
      <ellipse
        cx="50"
        cy="82"
        rx="10"
        ry="8"
        fill={`url(#${tardigradeId}-body)`}
        strokeWidth="0.8"
        opacity={opacity * 2.1}
      />

      {/* HEAD FEATURES */}
      {/* Mouth tube (buccal tube) */}
      <circle cx="50" cy="32" r="2" fill={bodyColor2} opacity={opacity * 2.5} />

      {/* Simple eyespots (two dark spots) */}
      <circle cx="46" cy="34" r="1.5" fill={bodyColor2} opacity={opacity * 3.0} />
      <circle cx="54" cy="34" r="1.5" fill={bodyColor2} opacity={opacity * 3.0} />

      {/* LEGS - 8 legs total (4 pairs), each with claws - SHORT AND CHUBBY */}

      {/* Pair 1 - Front legs (attached to segment 1) */}
      {/* Left leg 1 - shorter, chunkier */}
      <path
        d="M 37 45 L 32 44 L 28 46"
        stroke={legColor}
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity * 2.4}
      />
      {/* Claws on left leg 1 */}
      <line x1="28" y1="46" x2="26" y2="45" stroke={legColor} strokeWidth="1.5" opacity={opacity * 2.2} />
      <line x1="28" y1="46" x2="26" y2="47" stroke={legColor} strokeWidth="1.5" opacity={opacity * 2.2} />

      {/* Right leg 1 - shorter, chunkier */}
      <path
        d="M 63 45 L 68 44 L 72 46"
        stroke={legColor}
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity * 2.4}
      />
      {/* Claws on right leg 1 */}
      <line x1="72" y1="46" x2="74" y2="45" stroke={legColor} strokeWidth="1.5" opacity={opacity * 2.2} />
      <line x1="72" y1="46" x2="74" y2="47" stroke={legColor} strokeWidth="1.5" opacity={opacity * 2.2} />

      {/* Pair 2 - Second legs (attached to segment 2) */}
      {/* Left leg 2 - shorter, chunkier */}
      <path
        d="M 37 57 L 32 57 L 28 59"
        stroke={legColor}
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity * 2.4}
      />
      <line x1="28" y1="59" x2="26" y2="58" stroke={legColor} strokeWidth="1.5" opacity={opacity * 2.2} />
      <line x1="28" y1="59" x2="26" y2="60" stroke={legColor} strokeWidth="1.5" opacity={opacity * 2.2} />

      {/* Right leg 2 - shorter, chunkier */}
      <path
        d="M 63 57 L 68 57 L 72 59"
        stroke={legColor}
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity * 2.4}
      />
      <line x1="72" y1="59" x2="74" y2="58" stroke={legColor} strokeWidth="1.5" opacity={opacity * 2.2} />
      <line x1="72" y1="59" x2="74" y2="60" stroke={legColor} strokeWidth="1.5" opacity={opacity * 2.2} />

      {/* Pair 3 - Third legs (attached to segment 3) */}
      {/* Left leg 3 - shorter, chunkier */}
      <path
        d="M 37 69 L 32 70 L 28 72"
        stroke={legColor}
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity * 2.4}
      />
      <line x1="28" y1="72" x2="26" y2="71" stroke={legColor} strokeWidth="1.5" opacity={opacity * 2.2} />
      <line x1="28" y1="72" x2="26" y2="73" stroke={legColor} strokeWidth="1.5" opacity={opacity * 2.2} />

      {/* Right leg 3 - shorter, chunkier */}
      <path
        d="M 63 69 L 68 70 L 72 72"
        stroke={legColor}
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity * 2.4}
      />
      <line x1="72" y1="72" x2="74" y2="71" stroke={legColor} strokeWidth="1.5" opacity={opacity * 2.2} />
      <line x1="72" y1="72" x2="74" y2="73" stroke={legColor} strokeWidth="1.5" opacity={opacity * 2.2} />

      {/* Pair 4 - Rear legs (attached to tail segment, pointing backward) */}
      {/* Left leg 4 - shorter, chunkier */}
      <path
        d="M 40 82 L 35 84 L 30 86"
        stroke={legColor}
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity * 2.4}
      />
      <line x1="30" y1="86" x2="28" y2="85" stroke={legColor} strokeWidth="1.5" opacity={opacity * 2.2} />
      <line x1="30" y1="86" x2="28" y2="87" stroke={legColor} strokeWidth="1.5" opacity={opacity * 2.2} />

      {/* Right leg 4 - shorter, chunkier */}
      <path
        d="M 60 82 L 65 84 L 70 86"
        stroke={legColor}
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity * 2.4}
      />
      <line x1="70" y1="86" x2="72" y2="85" stroke={legColor} strokeWidth="1.5" opacity={opacity * 2.2} />
      <line x1="70" y1="86" x2="72" y2="87" stroke={legColor} strokeWidth="1.5" opacity={opacity * 2.2} />

      {/* Internal details - simple digestive tract suggestion */}
      <ellipse cx="50" cy="50" rx="6" ry="18" fill={bodyColor2} opacity={opacity * 1.5} />
      <ellipse cx="50" cy="65" rx="5" ry="12" fill={bodyColor2} opacity={opacity * 1.3} />
    </svg>
  );
}

// BacteriumOrganism: Simple rod-shaped bacterium with tumbling motion
function BacteriumOrganism({ size, opacity, colorVariant }: OrganismProps) {
  const bacteriumId = useMemo(() => `bacterium-${Math.random()}`, []);

  const bodyColor = useMemo(() =>
    colorVariant < 0.33 ? '#8B7355' : colorVariant < 0.66 ? '#A0826D' : '#6B5D52',
    [colorVariant]
  );
  const accentColor = useMemo(() =>
    colorVariant < 0.5 ? '#5D4E37' : '#4A3C2F',
    [colorVariant]
  );

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id={`${bacteriumId}-gradient`}>
          <stop offset="0%" stopColor={bodyColor} stopOpacity={opacity * 2.5} />
          <stop offset="50%" stopColor={accentColor} stopOpacity={opacity * 2.2} />
          <stop offset="100%" stopColor={bodyColor} stopOpacity={opacity * 1.8} />
        </radialGradient>
      </defs>

      {/* Simple rod shape */}
      <rect
        x="35"
        y="42"
        width="30"
        height="16"
        rx="8"
        ry="8"
        fill={`url(#${bacteriumId}-gradient)`}
      />

      {/* Internal granules */}
      <circle cx="42" cy="50" r="2" fill={accentColor} opacity={opacity * 2.0} />
      <circle cx="50" cy="50" r="2" fill={accentColor} opacity={opacity * 2.0} />
      <circle cx="58" cy="50" r="2" fill={accentColor} opacity={opacity * 2.0} />
    </svg>
  );
}

// AlgaeOrganism: Simple spherical green cell
function AlgaeOrganism({ size, opacity, colorVariant }: OrganismProps) {
  const algaeId = useMemo(() => `algae-${Math.random()}`, []);

  const cellColor = useMemo(() =>
    colorVariant < 0.33 ? '#4A7C59' : colorVariant < 0.66 ? '#588157' : '#3a5a40',
    [colorVariant]
  );
  const chloroplastColor = useMemo(() =>
    colorVariant < 0.5 ? '#2D5016' : '#1B4332',
    [colorVariant]
  );

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id={`${algaeId}-gradient`}>
          <stop offset="0%" stopColor={cellColor} stopOpacity={opacity * 2.5} />
          <stop offset="60%" stopColor={chloroplastColor} stopOpacity={opacity * 2.3} />
          <stop offset="100%" stopColor={cellColor} stopOpacity={opacity * 1.8} />
        </radialGradient>
      </defs>

      {/* Main cell body */}
      <circle
        cx="50"
        cy="50"
        r="18"
        fill={`url(#${algaeId}-gradient)`}
      />

      {/* Chloroplasts */}
      <ellipse cx="45" cy="47" rx="4" ry="6" fill={chloroplastColor} opacity={opacity * 2.2} />
      <ellipse cx="55" cy="47" rx="4" ry="6" fill={chloroplastColor} opacity={opacity * 2.2} />
      <ellipse cx="50" cy="55" rx="5" ry="4" fill={chloroplastColor} opacity={opacity * 2.2} />
    </svg>
  );
}

// PollenOrganism: Spiky sphere with gentle tumbling
function PollenOrganism({ size, opacity, colorVariant }: OrganismProps) {
  const pollenId = useMemo(() => `pollen-${Math.random()}`, []);

  const grainColor = useMemo(() =>
    colorVariant < 0.33 ? '#F4A460' : colorVariant < 0.66 ? '#D2B48C' : '#DEB887',
    [colorVariant]
  );
  const spikeColor = useMemo(() =>
    colorVariant < 0.5 ? '#CD853F' : '#B8860B',
    [colorVariant]
  );

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id={`${pollenId}-gradient`}>
          <stop offset="0%" stopColor={grainColor} stopOpacity={opacity * 2.6} />
          <stop offset="70%" stopColor={spikeColor} stopOpacity={opacity * 2.4} />
          <stop offset="100%" stopColor={grainColor} stopOpacity={opacity * 2.0} />
        </radialGradient>
      </defs>

      {/* Main grain body */}
      <circle
        cx="50"
        cy="50"
        r="14"
        fill={`url(#${pollenId}-gradient)`}
      />

      {/* Spikes radiating outward */}
      <line x1="50" y1="36" x2="50" y2="30" stroke={spikeColor} strokeWidth="1.5" opacity={opacity * 2.4} />
      <line x1="50" y1="64" x2="50" y2="70" stroke={spikeColor} strokeWidth="1.5" opacity={opacity * 2.4} />
      <line x1="36" y1="50" x2="30" y2="50" stroke={spikeColor} strokeWidth="1.5" opacity={opacity * 2.4} />
      <line x1="64" y1="50" x2="70" y2="50" stroke={spikeColor} strokeWidth="1.5" opacity={opacity * 2.4} />
      <line x1="40" y1="40" x2="35" y2="35" stroke={spikeColor} strokeWidth="1.5" opacity={opacity * 2.4} />
      <line x1="60" y1="60" x2="65" y2="65" stroke={spikeColor} strokeWidth="1.5" opacity={opacity * 2.4} />
      <line x1="60" y1="40" x2="65" y2="35" stroke={spikeColor} strokeWidth="1.5" opacity={opacity * 2.4} />
      <line x1="40" y1="60" x2="35" y2="65" stroke={spikeColor} strokeWidth="1.5" opacity={opacity * 2.4} />

      {/* Surface texture dots */}
      <circle cx="47" cy="47" r="1.5" fill={spikeColor} opacity={opacity * 2.2} />
      <circle cx="53" cy="47" r="1.5" fill={spikeColor} opacity={opacity * 2.2} />
      <circle cx="50" cy="53" r="1.5" fill={spikeColor} opacity={opacity * 2.2} />
    </svg>
  );
}
