'use client';

import { motion } from 'framer-motion';

interface OrangeBranchesProps {
  shouldAnimate: boolean;
  duration: (d: number) => number;
}

export default function OrangeBranches({ shouldAnimate, duration }: OrangeBranchesProps) {
  const branchVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (delay: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        delay: duration(delay),
        duration: duration(1.2),
        ease: [0.4, 0, 0.2, 1],
      },
    }),
  } as any;

  const sporeVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (delay: number) => ({
      scale: [0, 1.3, 1],
      opacity: [0, 1, 0.9],
      transition: {
        delay: duration(delay),
        duration: duration(0.7),
        ease: 'easeOut',
      },
    }),
  } as any;

  // Main branch paths with organic curves
  const branches = [
    {
      // Top branch - flowing across top
      main: 'M 155 125 C 162 126, 169 127, 176 128 C 183 129, 190 130, 197 131 C 204 132, 211 133, 218 134 C 225 134, 232 135, 239 135 C 245 134, 251 133, 257 132',
      highlight: 'M 156 123 C 163 124, 170 125, 177 126 C 184 127, 191 128, 198 129 C 205 130, 212 131, 219 132 C 226 132, 233 133, 240 133',
      shadow: 'M 156 127 C 163 128, 170 129, 177 130 C 184 131, 191 132, 198 133 C 205 134, 212 135, 219 136 C 226 136, 233 137, 240 137',
      delay: 1.6,
    },
    {
      // Middle branch
      main: 'M 140 150 C 148 153, 156 156, 164 158 C 172 160, 180 162, 188 163 C 195 164, 202 165, 209 165 C 215 165, 221 164, 227 163',
      highlight: 'M 141 148 C 149 151, 157 154, 165 156 C 173 158, 181 160, 189 161 C 196 162, 203 163, 210 163',
      shadow: 'M 141 152 C 149 155, 157 158, 165 160 C 173 162, 181 164, 189 165 C 196 166, 203 167, 210 167',
      delay: 1.7,
    },
    {
      // Bottom branch - curves down then up
      main: 'M 175 305 C 183 307, 191 309, 199 310 C 207 311, 215 312, 223 312 C 231 312, 239 311, 247 310 C 254 308, 261 306, 268 304',
      highlight: 'M 176 303 C 184 305, 192 307, 200 308 C 208 309, 216 310, 224 310 C 232 310, 240 309, 248 308',
      shadow: 'M 176 307 C 184 309, 192 311, 200 312 C 208 313, 216 314, 224 314 C 232 314, 240 313, 248 312',
      delay: 1.8,
    },
  ];

  // Small offshoots and twigs
  const twigs = [
    // Top branch twigs
    { d: 'M 193 131 C 195 135, 197 139, 199 143 C 200 146, 201 149, 202 152', delay: 1.85, weight: 2.8 },
    { d: 'M 213 134 C 215 138, 217 142, 219 146 C 220 149, 221 152, 222 155', delay: 1.9, weight: 2.8 },
    { d: 'M 232 135 C 234 139, 236 143, 238 147 C 239 150, 240 153, 241 156', delay: 1.92, weight: 2.7 },

    // Middle branch twigs
    { d: 'M 162 158 C 164 154, 166 150, 168 146 C 169 143, 170 140, 171 137', delay: 1.95, weight: 2.6 },
    { d: 'M 186 163 C 188 159, 190 155, 192 151 C 193 148, 194 145, 195 142', delay: 1.97, weight: 2.6 },
    { d: 'M 207 165 C 209 161, 211 157, 213 153 C 214 150, 215 147, 216 144', delay: 1.99, weight: 2.5 },

    // Bottom branch twigs - pointing down
    { d: 'M 197 310 C 199 314, 201 318, 203 322 C 204 325, 205 328, 206 331', delay: 2.0, weight: 2.7 },
    { d: 'M 221 312 C 223 308, 225 304, 227 300 C 228 297, 229 294, 230 291', delay: 2.02, weight: 2.7 },
    { d: 'M 245 310 C 247 314, 249 318, 251 322 C 252 325, 253 328, 254 331', delay: 2.04, weight: 2.6 },

    // Micro twigs for detail
    { d: 'M 175 129 C 176 132, 177 135, 178 138', delay: 2.05, weight: 2.0 },
    { d: 'M 251 133 C 252 136, 253 139, 254 142', delay: 2.07, weight: 2.0 },
    { d: 'M 158 156 C 159 153, 160 150, 161 147', delay: 2.08, weight: 1.9 },
    { d: 'M 183 309 C 184 312, 185 315, 186 318', delay: 2.09, weight: 2.0 },
    { d: 'M 262 305 C 263 302, 264 299, 265 296', delay: 2.1, weight: 1.9 },
  ];

  // Spores and seeds distributed naturally
  const spores = [
    // Top branch spores
    { cx: 169, cy: 127, r: 3.5, delay: 2.5 },
    { cx: 185, cy: 130, r: 3.8, delay: 2.52 },
    { cx: 201, cy: 132, r: 3.2, delay: 2.54 },
    { cx: 217, cy: 134, r: 4.0, delay: 2.56 },
    { cx: 233, cy: 135, r: 3.5, delay: 2.58 },
    { cx: 249, cy: 133, r: 3.3, delay: 2.6 },

    // Middle branch spores
    { cx: 152, cy: 152, r: 3.6, delay: 2.65 },
    { cx: 168, cy: 158, r: 3.4, delay: 2.67 },
    { cx: 184, cy: 162, r: 3.7, delay: 2.69 },
    { cx: 200, cy: 164, r: 3.9, delay: 2.71 },
    { cx: 216, cy: 165, r: 3.3, delay: 2.73 },

    // Bottom branch spores
    { cx: 187, cy: 308, r: 3.5, delay: 2.75 },
    { cx: 203, cy: 310, r: 3.8, delay: 2.77 },
    { cx: 219, cy: 312, r: 3.6, delay: 2.79 },
    { cx: 235, cy: 312, r: 3.4, delay: 2.81 },
    { cx: 251, cy: 310, r: 3.7, delay: 2.83 },
    { cx: 267, cy: 307, r: 3.2, delay: 2.85 },

    // Additional scattered spores for richness
    { cx: 176, cy: 129, r: 2.8, delay: 2.87 },
    { cx: 192, cy: 131, r: 2.5, delay: 2.88 },
    { cx: 225, cy: 135, r: 3.0, delay: 2.89 },
    { cx: 241, cy: 134, r: 2.6, delay: 2.9 },
    { cx: 160, cy: 156, r: 2.9, delay: 2.91 },
    { cx: 176, cy: 160, r: 2.7, delay: 2.92 },
    { cx: 208, cy: 165, r: 3.1, delay: 2.93 },
    { cx: 195, cy: 309, r: 2.8, delay: 2.94 },
    { cx: 211, cy: 311, r: 3.0, delay: 2.95 },
    { cx: 227, cy: 312, r: 2.6, delay: 2.96 },
    { cx: 243, cy: 311, r: 2.9, delay: 2.97 },
    { cx: 259, cy: 308, r: 2.7, delay: 2.98 },
  ];

  return (
    <g id="orange-branches">
      {branches.map((branch, i) => (
        <g key={`branch-${i}`}>
          {/* Shadow layer - darker, slightly offset down */}
          <motion.path
            d={branch.shadow}
            stroke="#9C6D3C"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.3"
            variants={branchVariants}
            custom={branch.delay + 0.05}
            initial="hidden"
            animate={shouldAnimate ? 'visible' : 'visible'}
          />

          {/* Main branch */}
          <motion.path
            d={branch.main}
            stroke="#B8834C"
            strokeWidth="6.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            variants={branchVariants}
            custom={branch.delay}
            initial="hidden"
            animate={shouldAnimate ? 'visible' : 'visible'}
          />

          {/* Highlight layer - lighter, slightly offset up */}
          <motion.path
            d={branch.highlight}
            stroke="#D4A05C"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.5"
            variants={branchVariants}
            custom={branch.delay + 0.1}
            initial="hidden"
            animate={shouldAnimate ? 'visible' : 'visible'}
          />

          {/* Texture detail - fine lines for bark-like appearance */}
          <motion.path
            d={branch.main}
            stroke="#A87340"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeDasharray="4 3"
            fill="none"
            opacity="0.4"
            variants={branchVariants}
            custom={branch.delay + 0.15}
            initial="hidden"
            animate={shouldAnimate ? 'visible' : 'visible'}
          />
        </g>
      ))}

      {/* Twigs and offshoots */}
      {twigs.map((twig, i) => (
        <g key={`twig-${i}`}>
          {/* Twig shadow */}
          <motion.path
            d={twig.d}
            stroke="#9C6D3C"
            strokeWidth={twig.weight + 0.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.2"
            variants={branchVariants}
            custom={twig.delay + 0.02}
            initial="hidden"
            animate={shouldAnimate ? 'visible' : 'visible'}
          />

          {/* Main twig */}
          <motion.path
            d={twig.d}
            stroke="#A87340"
            strokeWidth={twig.weight}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            variants={branchVariants}
            custom={twig.delay}
            initial="hidden"
            animate={shouldAnimate ? 'visible' : 'visible'}
          />

          {/* Twig highlight */}
          <motion.path
            d={twig.d}
            stroke="#C89454"
            strokeWidth={twig.weight * 0.4}
            strokeLinecap="round"
            fill="none"
            opacity="0.6"
            variants={branchVariants}
            custom={twig.delay + 0.05}
            initial="hidden"
            animate={shouldAnimate ? 'visible' : 'visible'}
          />
        </g>
      ))}

      {/* Spores and seeds */}
      {spores.map((spore, i) => (
        <g key={`spore-${i}`}>
          {/* Spore glow/halo */}
          <motion.circle
            cx={spore.cx}
            cy={spore.cy}
            r={spore.r + 2}
            fill="#E8A05C"
            opacity="0.15"
            variants={sporeVariants}
            custom={spore.delay}
            initial="hidden"
            animate={shouldAnimate ? 'visible' : 'visible'}
          />

          {/* Main spore */}
          <motion.circle
            cx={spore.cx}
            cy={spore.cy}
            r={spore.r}
            fill="#C89454"
            variants={sporeVariants}
            custom={spore.delay}
            initial="hidden"
            animate={shouldAnimate ? 'visible' : 'visible'}
          />

          {/* Spore highlight */}
          <motion.circle
            cx={spore.cx - spore.r * 0.3}
            cy={spore.cy - spore.r * 0.3}
            r={spore.r * 0.4}
            fill="#E8BC7C"
            opacity="0.7"
            variants={sporeVariants}
            custom={spore.delay + 0.05}
            initial="hidden"
            animate={shouldAnimate ? 'visible' : 'visible'}
          />

          {/* Spore shadow */}
          <motion.ellipse
            cx={spore.cx + spore.r * 0.2}
            cy={spore.cy + spore.r * 0.4}
            rx={spore.r * 0.6}
            ry={spore.r * 0.3}
            fill="#9C6D3C"
            opacity="0.3"
            variants={sporeVariants}
            custom={spore.delay + 0.03}
            initial="hidden"
            animate={shouldAnimate ? 'visible' : 'visible'}
          />
        </g>
      ))}
    </g>
  );
}
