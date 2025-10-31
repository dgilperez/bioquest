'use client';

import { motion } from 'framer-motion';

interface BlueLeavesProps {
  shouldAnimate: boolean;
  duration: (d: number) => number;
}

export default function BlueLeaves({ shouldAnimate, duration }: BlueLeavesProps) {
  const leafVariants = {
    hidden: { scale: 0, opacity: 0, rotate: -25 },
    visible: (delay: number) => ({
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: {
        delay: duration(delay),
        duration: duration(1.1),
        type: 'spring',
        stiffness: 75,
        damping: 12,
      },
    }),
  };

  const veinVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (delay: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        delay: duration(delay),
        duration: duration(0.6),
        ease: 'easeOut',
      },
    }),
  };

  return (
    <g id="blue-leaves">
      {/* ===== LARGE TOP LEAF ===== */}
      <motion.g
        style={{ transformOrigin: '340px 200px' }}
        variants={leafVariants}
        custom={1.2}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : 'visible'}
      >
        {/* Leaf shadow layer */}
        <path
          d="M 302 200
             Q 305 194, 310 190
             Q 318 184, 328 182
             Q 338 180, 348 182
             Q 358 184, 366 188
             Q 374 194, 378 200
             Q 374 206, 366 212
             Q 358 216, 348 218
             Q 338 220, 328 218
             Q 318 216, 310 210
             Q 305 206, 302 200
             Z"
          fill="#3A6B7C"
          opacity="0.4"
        />

        {/* Main leaf body */}
        <path
          d="M 303 200
             Q 306 194, 311 190
             Q 319 184, 329 182
             Q 339 180, 349 182
             Q 359 184, 367 188
             Q 375 194, 378 200
             Q 375 206, 367 212
             Q 359 216, 349 218
             Q 339 220, 329 218
             Q 319 216, 311 210
             Q 306 206, 303 200
             Z"
          fill="#4A7B8C"
        />

        {/* Leaf lighter mid-tone */}
        <path
          d="M 306 200
             Q 309 195, 314 191
             Q 322 186, 332 184
             Q 341 183, 350 185
             Q 358 187, 365 191
             Q 371 196, 374 200
             Q 371 204, 365 209
             Q 358 213, 350 215
             Q 341 217, 332 216
             Q 322 214, 314 209
             Q 309 205, 306 200
             Z"
          fill="#5A8B9C"
          opacity="0.7"
        />

        {/* Serrated edges */}
        {Array.from({ length: 14 }).map((_, i) => {
          const angle = (i * 25) - 180;
          const rad = (angle * Math.PI) / 180;
          const cx = 340 + Math.cos(rad) * 38;
          const cy = 200 + Math.sin(rad) * 13;
          return (
            <circle
              key={`edge-top-${i}`}
              cx={cx}
              cy={cy}
              r="1.2"
              fill="#3A6B7C"
              opacity="0.6"
            />
          );
        })}

        {/* Central midrib (main vein) */}
        <motion.path
          d="M 304 200 L 376 200"
          stroke="#3D6B7C"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          variants={veinVariants}
          custom={1.5}
        />

        {/* Secondary veins - branching from midrib */}
        {[
          { d: 'M 315 200 Q 318 194, 322 190', delay: 1.52 },
          { d: 'M 328 200 Q 331 193, 335 188', delay: 1.54 },
          { d: 'M 340 200 Q 343 192, 348 187', delay: 1.56 },
          { d: 'M 352 200 Q 355 193, 359 189', delay: 1.58 },
          { d: 'M 365 200 Q 368 194, 371 191', delay: 1.6 },
          { d: 'M 315 200 Q 318 206, 322 210', delay: 1.52 },
          { d: 'M 328 200 Q 331 207, 335 212', delay: 1.54 },
          { d: 'M 340 200 Q 343 208, 348 213', delay: 1.56 },
          { d: 'M 352 200 Q 355 207, 359 211', delay: 1.58 },
          { d: 'M 365 200 Q 368 206, 371 209', delay: 1.6 },
        ].map((vein, i) => (
          <motion.path
            key={`vein-top-${i}`}
            d={vein.d}
            stroke="#3D6B7C"
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
            variants={veinVariants}
            custom={vein.delay}
          />
        ))}

        {/* Tertiary veins - fine network */}
        {[
          'M 320 192 L 325 195',
          'M 333 190 L 338 194',
          'M 346 189 L 351 193',
          'M 357 191 L 362 195',
          'M 320 208 L 325 205',
          'M 333 210 L 338 206',
          'M 346 211 L 351 207',
          'M 357 209 L 362 205',
        ].map((d, i) => (
          <motion.path
            key={`vein-tertiary-top-${i}`}
            d={d}
            stroke="#3D6B7C"
            strokeWidth="0.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.4"
            variants={veinVariants}
            custom={1.65}
          />
        ))}

        {/* Leaf highlights */}
        <ellipse
          cx="325"
          cy="195"
          rx="12"
          ry="5"
          fill="#FFFFFF"
          opacity="0.18"
        />
        <ellipse
          cx="355"
          cy="196"
          rx="10"
          ry="4"
          fill="#FFFFFF"
          opacity="0.15"
        />
      </motion.g>

      {/* ===== MEDIUM MIDDLE LEAF ===== */}
      <motion.g
        style={{ transformOrigin: '352px 230px' }}
        variants={leafVariants}
        custom={1.3}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : 'visible'}
      >
        {/* Leaf shadow layer */}
        <path
          d="M 320 230
             Q 323 225, 327 222
             Q 335 217, 344 216
             Q 352 215, 360 217
             Q 368 219, 374 224
             Q 379 228, 382 233
             Q 379 238, 374 242
             Q 368 246, 360 248
             Q 352 249, 344 247
             Q 335 245, 327 240
             Q 323 236, 320 230
             Z"
          fill="#3A6B7C"
          opacity="0.4"
        />

        {/* Main leaf body */}
        <path
          d="M 321 230
             Q 324 225, 328 222
             Q 336 217, 345 216
             Q 353 215, 361 217
             Q 369 219, 375 224
             Q 380 228, 383 233
             Q 380 238, 375 242
             Q 369 246, 361 248
             Q 353 249, 345 247
             Q 336 245, 328 240
             Q 324 236, 321 230
             Z"
          fill="#5A8B9C"
        />

        {/* Leaf lighter mid-tone */}
        <path
          d="M 324 230
             Q 327 226, 331 223
             Q 338 219, 346 218
             Q 353 217, 360 219
             Q 367 221, 372 225
             Q 376 229, 378 233
             Q 376 237, 372 241
             Q 367 244, 360 246
             Q 353 247, 346 246
             Q 338 244, 331 240
             Q 327 237, 324 230
             Z"
          fill="#6A9BAC"
          opacity="0.65"
        />

        {/* Serrated edges */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30) - 180;
          const rad = (angle * Math.PI) / 180;
          const cx = 352 + Math.cos(rad) * 33;
          const cy = 230 + Math.sin(rad) * 11;
          return (
            <circle
              key={`edge-mid-${i}`}
              cx={cx}
              cy={cy}
              r="1"
              fill="#3A6B7C"
              opacity="0.6"
            />
          );
        })}

        {/* Central midrib */}
        <motion.path
          d="M 322 230 L 382 233"
          stroke="#3D6B7C"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
          variants={veinVariants}
          custom={1.6}
        />

        {/* Secondary veins */}
        {[
          { d: 'M 332 229 Q 335 224, 338 220', delay: 1.62 },
          { d: 'M 344 229 Q 347 223, 351 219', delay: 1.64 },
          { d: 'M 356 230 Q 359 224, 363 221', delay: 1.66 },
          { d: 'M 368 231 Q 371 226, 374 223', delay: 1.68 },
          { d: 'M 332 231 Q 335 236, 338 240', delay: 1.62 },
          { d: 'M 344 231 Q 347 237, 351 241', delay: 1.64 },
          { d: 'M 356 232 Q 359 238, 363 242', delay: 1.66 },
          { d: 'M 368 233 Q 371 238, 374 241', delay: 1.68 },
        ].map((vein, i) => (
          <motion.path
            key={`vein-mid-${i}`}
            d={vein.d}
            stroke="#3D6B7C"
            strokeWidth="0.9"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
            variants={veinVariants}
            custom={vein.delay}
          />
        ))}

        {/* Tertiary veins */}
        {[
          'M 336 225 L 340 227',
          'M 349 224 L 353 227',
          'M 361 226 L 365 228',
          'M 336 235 L 340 233',
          'M 349 237 L 353 234',
          'M 361 237 L 365 235',
        ].map((d, i) => (
          <motion.path
            key={`vein-tertiary-mid-${i}`}
            d={d}
            stroke="#3D6B7C"
            strokeWidth="0.45"
            strokeLinecap="round"
            fill="none"
            opacity="0.4"
            variants={veinVariants}
            custom={1.72}
          />
        ))}

        {/* Leaf highlights */}
        <ellipse
          cx="338"
          cy="226"
          rx="10"
          ry="4"
          fill="#FFFFFF"
          opacity="0.16"
        />
        <ellipse
          cx="365"
          cy="228"
          rx="8"
          ry="3"
          fill="#FFFFFF"
          opacity="0.14"
        />
      </motion.g>

      {/* ===== SMALL BOTTOM LEAF ===== */}
      <motion.g
        style={{ transformOrigin: '338px 258px' }}
        variants={leafVariants}
        custom={1.4}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : 'visible'}
      >
        {/* Leaf shadow layer */}
        <path
          d="M 310 258
             Q 312 253, 316 250
             Q 323 246, 331 245
             Q 338 244, 345 246
             Q 352 248, 357 252
             Q 361 256, 363 260
             Q 361 265, 357 269
             Q 352 272, 345 274
             Q 338 275, 331 273
             Q 323 271, 316 267
             Q 312 263, 310 258
             Z"
          fill="#3A6B7C"
          opacity="0.4"
        />

        {/* Main leaf body */}
        <path
          d="M 311 258
             Q 313 253, 317 250
             Q 324 246, 332 245
             Q 339 244, 346 246
             Q 353 248, 358 252
             Q 362 256, 364 260
             Q 362 265, 358 269
             Q 353 272, 346 274
             Q 339 275, 332 273
             Q 324 271, 317 267
             Q 313 263, 311 258
             Z"
          fill="#5A8B9C"
        />

        {/* Leaf lighter mid-tone */}
        <path
          d="M 314 258
             Q 316 254, 320 251
             Q 326 248, 333 247
             Q 339 246, 345 248
             Q 351 250, 355 254
             Q 358 257, 360 261
             Q 358 264, 355 268
             Q 351 271, 345 272
             Q 339 273, 333 272
             Q 326 270, 320 266
             Q 316 263, 314 258
             Z"
          fill="#6A9BAC"
          opacity="0.65"
        />

        {/* Serrated edges */}
        {Array.from({ length: 10 }).map((_, i) => {
          const angle = (i * 36) - 180;
          const rad = (angle * Math.PI) / 180;
          const cx = 338 + Math.cos(rad) * 30;
          const cy = 258 + Math.sin(rad) * 12;
          return (
            <circle
              key={`edge-bot-${i}`}
              cx={cx}
              cy={cy}
              r="0.9"
              fill="#3A6B7C"
              opacity="0.6"
            />
          );
        })}

        {/* Central midrib */}
        <motion.path
          d="M 312 258 L 364 260"
          stroke="#3D6B7C"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
          variants={veinVariants}
          custom={1.7}
        />

        {/* Secondary veins */}
        {[
          { d: 'M 320 257 Q 323 252, 326 249', delay: 1.72 },
          { d: 'M 331 257 Q 334 252, 337 248', delay: 1.74 },
          { d: 'M 342 258 Q 345 252, 349 249', delay: 1.76 },
          { d: 'M 353 259 Q 356 254, 359 251', delay: 1.78 },
          { d: 'M 320 259 Q 323 264, 326 268', delay: 1.72 },
          { d: 'M 331 259 Q 334 265, 337 269', delay: 1.74 },
          { d: 'M 342 260 Q 345 266, 349 270', delay: 1.76 },
          { d: 'M 353 260 Q 356 265, 359 268', delay: 1.78 },
        ].map((vein, i) => (
          <motion.path
            key={`vein-bot-${i}`}
            d={vein.d}
            stroke="#3D6B7C"
            strokeWidth="0.8"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
            variants={veinVariants}
            custom={vein.delay}
          />
        ))}

        {/* Tertiary veins */}
        {[
          'M 324 254 L 328 256',
          'M 335 253 L 339 256',
          'M 347 254 L 351 256',
          'M 324 262 L 328 260',
          'M 335 264 L 339 261',
          'M 347 265 L 351 262',
        ].map((d, i) => (
          <motion.path
            key={`vein-tertiary-bot-${i}`}
            d={d}
            stroke="#3D6B7C"
            strokeWidth="0.4"
            strokeLinecap="round"
            fill="none"
            opacity="0.4"
            variants={veinVariants}
            custom={1.82}
          />
        ))}

        {/* Leaf highlights */}
        <ellipse
          cx="326"
          cy="255"
          rx="8"
          ry="3"
          fill="#FFFFFF"
          opacity="0.15"
        />
        <ellipse
          cx="350"
          cy="257"
          rx="7"
          ry="2.5"
          fill="#FFFFFF"
          opacity="0.13"
        />
      </motion.g>
    </g>
  );
}
