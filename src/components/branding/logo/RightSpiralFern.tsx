'use client';

import { motion } from 'framer-motion';

interface RightSpiralFernProps {
  shouldAnimate: boolean;
  duration: (d: number) => number;
}

export default function RightSpiralFern({ shouldAnimate, duration }: RightSpiralFernProps) {
  const tentacleVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: duration(2.5), ease: 'easeOut' },
        opacity: { duration: duration(0.4) },
      },
    },
  };

  const suctionVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (delay: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: duration(delay),
        duration: duration(0.3),
        type: 'spring',
        stiffness: 150,
      },
    }),
  };

  return (
    <g id="right-tentacle">
      {/* Tentacle shadow layer */}
      <path
        d="M 315 190
           C 314 198, 312 206, 309 214
           C 306 222, 302 230, 296 237
           C 290 244, 283 250, 275 255
           C 266 260, 257 264, 247 266
           C 237 268, 226 268, 216 266
           C 206 264, 197 260, 189 253
           C 182 246, 176 238, 173 228
           C 170 218, 170 207, 173 197
           C 176 187, 182 178, 191 171
           C 200 164, 211 159, 223 157
           C 235 155, 247 156, 258 160
           C 269 164, 278 171, 285 180
           C 292 189, 296 200, 298 211
           C 300 222, 299 233, 296 243"
        stroke="#3A5A2E"
        strokeWidth="28"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.2"
      />

      {/* Main tentacle body - base layer (darkest) */}
      <motion.path
        d="M 315 190
           C 314 198, 312 206, 309 214
           C 306 222, 302 230, 296 237
           C 290 244, 283 250, 275 255
           C 266 260, 257 264, 247 266
           C 237 268, 226 268, 216 266
           C 206 264, 197 260, 189 253
           C 182 246, 176 238, 173 228
           C 170 218, 170 207, 173 197
           C 176 187, 182 178, 191 171
           C 200 164, 211 159, 223 157
           C 235 155, 247 156, 258 160
           C 269 164, 278 171, 285 180
           C 292 189, 296 200, 298 211
           C 300 222, 299 233, 296 243"
        stroke="#4A6B3A"
        strokeWidth="26"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={false}
        variants={tentacleVariants}
        animate={shouldAnimate ? 'visible' : 'visible'}
      />

      {/* Mid-tone layer */}
      <motion.path
        d="M 314 191
           C 313 199, 311 207, 308 215
           C 305 223, 301 231, 295 238
           C 289 245, 282 251, 274 256
           C 265 261, 256 265, 246 267
           C 236 269, 225 269, 215 267
           C 205 265, 196 261, 188 254"
        stroke="#5A8C4A"
        strokeWidth="22"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.8"
        variants={tentacleVariants}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : 'visible'}
      />

      {/* Highlight layer - lighter green on outer edge */}
      <motion.path
        d="M 312 192
           C 311 200, 309 208, 306 216
           C 303 224, 299 232, 293 239
           C 287 246, 280 252, 272 257
           C 263 262, 254 266, 244 268"
        stroke="#6B9D78"
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
        variants={tentacleVariants}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : 'visible'}
      />

      {/* Inner highlight - on inner curve */}
      <motion.path
        d="M 244 268
           C 234 266, 225 262, 217 256
           C 209 250, 203 242, 199 233
           C 195 224, 193 214, 194 204"
        stroke="#7CAD89"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
        variants={tentacleVariants}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : 'visible'}
      />

      {/* Suction cups along inner curve - larger at base, smaller at tip */}
      {[
        // Base section - larger cups
        { cx: 305, cy: 205, r: 5, delay: 0.8 },
        { cx: 300, cy: 218, r: 5.2, delay: 0.82 },
        { cx: 294, cy: 230, r: 5.5, delay: 0.84 },
        { cx: 287, cy: 241, r: 5.8, delay: 0.86 },
        { cx: 279, cy: 251, r: 6, delay: 0.88 },

        // Mid section
        { cx: 270, cy: 259, r: 6.2, delay: 0.9 },
        { cx: 260, cy: 265, r: 6.3, delay: 0.92 },
        { cx: 249, cy: 269, r: 6.2, delay: 0.94 },
        { cx: 238, cy: 271, r: 6, delay: 0.96 },

        // Tip section - smaller cups
        { cx: 227, cy: 270, r: 5.5, delay: 0.98 },
        { cx: 217, cy: 267, r: 5, delay: 1.0 },
        { cx: 207, cy: 262, r: 4.5, delay: 1.02 },
        { cx: 198, cy: 255, r: 4, delay: 1.04 },
        { cx: 191, cy: 246, r: 3.5, delay: 1.06 },
        { cx: 185, cy: 236, r: 3, delay: 1.08 },
      ].map((cup, i) => (
        <motion.g
          key={`suction-${i}`}
          variants={suctionVariants}
          custom={cup.delay}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : 'visible'}
        >
          {/* Outer rim */}
          <circle
            cx={cup.cx}
            cy={cup.cy}
            r={cup.r}
            fill="#4A6B3A"
            opacity="0.6"
          />
          {/* Inner cup */}
          <circle
            cx={cup.cx}
            cy={cup.cy}
            r={cup.r * 0.65}
            fill="#3A5A2E"
            opacity="0.8"
          />
          {/* Center depression */}
          <circle
            cx={cup.cx}
            cy={cup.cy}
            r={cup.r * 0.3}
            fill="#2A4A1E"
          />
          {/* Highlight */}
          <ellipse
            cx={cup.cx - cup.r * 0.2}
            cy={cup.cy - cup.r * 0.2}
            rx={cup.r * 0.35}
            ry={cup.r * 0.25}
            fill="#6B9D78"
            opacity="0.4"
          />
        </motion.g>
      ))}

      {/* Texture detail lines for organic appearance */}
      {[
        'M 310 198 C 308 206, 306 214, 303 222',
        'M 298 230 C 294 237, 289 244, 284 250',
        'M 277 256 C 271 261, 265 265, 258 268',
        'M 250 270 C 243 271, 236 271, 229 270',
        'M 222 268 C 215 265, 208 261, 202 256',
        'M 196 250 C 191 244, 187 237, 184 230',
        'M 182 223 C 180 216, 179 209, 179 202',
        'M 180 195 C 181 188, 183 181, 186 175',
      ].map((d, i) => (
        <motion.path
          key={`texture-${i}`}
          d={d}
          stroke="#5A8C4A"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.3"
          variants={tentacleVariants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : 'visible'}
        />
      ))}

      {/* Subtle ridges along length */}
      {[
        { d: 'M 312 195 C 310 203, 308 211, 305 219', opacity: 0.25 },
        { d: 'M 299 227 C 295 234, 290 241, 285 247', opacity: 0.25 },
        { d: 'M 278 253 C 272 258, 266 262, 259 265', opacity: 0.3 },
        { d: 'M 251 268 C 244 269, 237 269, 230 268', opacity: 0.3 },
        { d: 'M 223 266 C 216 263, 210 259, 204 254', opacity: 0.25 },
        { d: 'M 198 248 C 193 242, 189 235, 186 228', opacity: 0.25 },
      ].map((ridge, i) => (
        <motion.path
          key={`ridge-${i}`}
          d={ridge.d}
          stroke="#3A5A2E"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity={ridge.opacity}
          variants={tentacleVariants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : 'visible'}
        />
      ))}
    </g>
  );
}
