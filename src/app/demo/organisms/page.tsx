'use client';

import dynamic from 'next/dynamic';

// Dynamically import OrganicBackground with SSR disabled to avoid hydration issues
// (component uses Math.random() for organism generation)
const OrganicBackground = dynamic(
  () => import('@/components/animations/OrganicBackground').then(mod => ({ default: mod.OrganicBackground })),
  { ssr: false }
);

export default function OrganismsShowcasePage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-nature-900 via-nature-800 to-nature-900">
      {/* The living background - key ensures it persists across re-renders */}
      <OrganicBackground key="organic-bg-persistent" />

      {/* Overlay with organism descriptions */}
      <div className="relative z-10 p-8 max-w-6xl mx-auto">
        <div className="bg-black/40 backdrop-blur-sm rounded-lg p-8 text-white">
          <h1 className="text-5xl font-display font-bold mb-4">
            Microscopic Life Showcase
          </h1>
          <p className="text-xl text-nature-100 mb-8">
            Watch the living ecosystem in the background. Each organism lives, moves, and dies in a continuous cycle.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cell */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-nature-200 mb-3">🦠 Cell</h2>
              <p className="text-nature-100 mb-2">
                Basic eukaryotic cell with visible nucleus, nucleolus, and organelles in the cytoplasm.
              </p>
              <ul className="text-sm text-nature-200 list-disc list-inside space-y-1">
                <li>Organic blob shape (not perfect circle)</li>
                <li>Prominent nucleus with nucleolus</li>
                <li>Multiple organelles visible</li>
                <li>Drifts slowly while rotating</li>
              </ul>
            </div>

            {/* Spore */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-nature-200 mb-3">🌾 Spore</h2>
              <p className="text-nature-100 mb-2">
                Teardrop-shaped spore with long flagellum for propulsion.
              </p>
              <ul className="text-sm text-nature-200 list-disc list-inside space-y-1">
                <li>Earth tone colors (sand/brown)</li>
                <li>Long wavy flagellum (whip-like tail)</li>
                <li>Swimming motion with rotation</li>
                <li>Internal details visible</li>
              </ul>
            </div>

            {/* Microbe (Amoeba) */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-nature-200 mb-3">🦠 Amoeba</h2>
              <p className="text-nature-100 mb-2">
                Amoeba-like microbe with 10 visible cilia for movement.
              </p>
              <ul className="text-sm text-nature-200 list-disc list-inside space-y-1">
                <li>Irregular blob body</li>
                <li>10 cilia (hair-like projections)</li>
                <li>3 internal vacuoles</li>
                <li>Erratic wandering movement</li>
              </ul>
            </div>

            {/* Diatom */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-nature-200 mb-3">💎 Diatom</h2>
              <p className="text-nature-100 mb-2">
                Microscopic algae with intricate silica shell pattern.
              </p>
              <ul className="text-sm text-nature-200 list-disc list-inside space-y-1">
                <li>Golden/amber pill-shaped shell</li>
                <li>Radial striations pattern</li>
                <li>Dots pattern (pores)</li>
                <li>Sinks slowly while tumbling</li>
              </ul>
            </div>

            {/* Morula */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-nature-200 mb-3">🫧 Morula (Dividing Embryo)</h2>
              <p className="text-nature-100 mb-2">
                Early embryo undergoing cell division: 1 → 2 → 4 → 8 → 16 cells.
              </p>
              <ul className="text-sm text-nature-200 list-disc list-inside space-y-1">
                <li>Starts as single cell (zygote)</li>
                <li>Divides through stages: 2, 4, 8, 16 cells</li>
                <li>Reaches morula stage (16-cell ball)</li>
                <li>Loses cells randomly, then decays</li>
                <li>Complete life cycle: 60-140 seconds</li>
              </ul>
            </div>

            {/* Euglena */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-nature-200 mb-3">🐍 Euglena</h2>
              <p className="text-nature-100 mb-2">
                Elongated green protist with distinctive red eyespot and flagellum.
              </p>
              <ul className="text-sm text-nature-200 list-disc list-inside space-y-1">
                <li>Snake-like green body</li>
                <li><strong className="text-red-400">Bright red eyespot (stigma)</strong> - most distinctive feature!</li>
                <li>Long flagellum for swimming</li>
                <li>6 visible chloroplasts</li>
                <li>Pellicle stripes on surface</li>
                <li>Spiral swimming motion</li>
              </ul>
            </div>

            {/* Tardigrade */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10 md:col-span-2">
              <h2 className="text-2xl font-bold text-nature-200 mb-3">🐻 Tardigrade (Water Bear)</h2>
              <p className="text-nature-100 mb-2">
                Microscopic 8-legged animal with segmented body - the toughest organism on Earth!
              </p>
              <ul className="text-sm text-nature-200 list-disc list-inside space-y-1 grid md:grid-cols-2 gap-2">
                <li><strong>5 body segments</strong> (head + 4 body segments)</li>
                <li><strong>8 legs with claws</strong> (4 pairs, properly jointed)</li>
                <li>Buccal tube (mouth tube)</li>
                <li>Two eyespots on head</li>
                <li>Translucent grayish-brown body</li>
                <li>Visible digestive tract</li>
                <li>Slow lumbering gait with rocking motion</li>
                <li>Each leg ends in visible claws</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 bg-nature-700/30 rounded-lg p-6 border border-nature-500/30">
            <h3 className="text-xl font-bold text-nature-100 mb-3">Animation Details</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-nature-200">
              <div>
                <strong className="block text-nature-100 mb-1">Life Cycle:</strong>
                Each organism is born (fades in), lives and moves (60-140 seconds), then dies (fades out) before being reborn.
              </div>
              <div>
                <strong className="block text-nature-100 mb-1">Movement:</strong>
                30 organisms wander across the screen simultaneously with different speeds, paths, and behaviors.
              </div>
              <div>
                <strong className="block text-nature-100 mb-1">Visibility:</strong>
                Organisms are most visible during their mature phase (middle of life cycle), creating a dynamic spotlight effect.
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-nature-300 text-sm">
              Watch carefully - can you spot the red eyespot on Euglena? The dividing morula? The lumbering tardigrade?
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
