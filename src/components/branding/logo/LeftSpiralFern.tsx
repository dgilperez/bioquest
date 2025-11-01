'use client';

import { motion } from 'framer-motion';

interface LeftSpiralFernProps {
  shouldAnimate: boolean;
  duration: (d: number) => number;
}

export default function LeftSpiralFern({ shouldAnimate, duration }: LeftSpiralFernProps) {
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
    <g id="left-tentacle">
      {/* Tentacle shadow layer */}
      <path
        d="M 85 250
           C 85 242, 86 234, 88 226
           C 90 218, 93 210, 97 203
           C 102 195, 108 188, 115 182
           C 123 176, 132 171, 142 168
           C 152 165, 163 164, 174 165
           C 185 166, 195 169, 204 175
           C 212 181, 218 189, 221 198
           C 224 207, 224 217, 220 226
           C 216 235, 209 242, 200 247
           C 191 252, 180 254, 169 253
           C 158 252, 148 248, 140 241
           C 133 234, 128 225, 125 215
           C 123 205, 123 195, 126 186
           C 129 177, 135 169, 143 163"
        stroke="#3A5A2E"
        strokeWidth="28"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.2"
      />

      {/* Main tentacle body - base layer (darkest) */}
      <motion.path
        d="M 85 250
           C 85 242, 86 234, 88 226
           C 90 218, 93 210, 97 203
           C 102 195, 108 188, 115 182
           C 123 176, 132 171, 142 168
           C 152 165, 163 164, 174 165
           C 185 166, 195 169, 204 175
           C 212 181, 218 189, 221 198
           C 224 207, 224 217, 220 226
           C 216 235, 209 242, 200 247
           C 191 252, 180 254, 169 253
           C 158 252, 148 248, 140 241
           C 133 234, 128 225, 125 215
           C 123 205, 123 195, 126 186
           C 129 177, 135 169, 143 163"
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
        d="M 86 249
           C 86 241, 87 233, 89 225
           C 91 217, 94 209, 98 202
           C 103 194, 109 187, 116 181
           C 124 175, 133 170, 143 167
           C 153 164, 164 163, 175 164
           C 186 165, 196 168, 205 174
           C 213 180, 219 188, 222 197
           C 225 206, 225 216, 221 225"
        stroke="#5A8C4A"
        strokeWidth="22"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.8"
        variants={tentacleVariants}
        initial={false}
        animate={shouldAnimate ? 'visible' : 'visible'}
      />

      {/* Highlight layer - lighter green on outer edge */}
      <motion.path
        d="M 88 248
           C 88 240, 89 232, 91 224
           C 93 216, 96 208, 100 201
           C 105 193, 111 186, 118 180
           C 126 174, 135 169, 145 166"
        stroke="#6B9D78"
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
        variants={tentacleVariants}
        initial={false}
        animate={shouldAnimate ? 'visible' : 'visible'}
      />

      {/* Inner highlight - on inner curve */}
      <motion.path
        d="M 143 163
           C 151 160, 160 159, 169 160
           C 178 161, 187 164, 195 169
           C 203 174, 209 181, 213 189"
        stroke="#7CAD89"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
        variants={tentacleVariants}
        initial={false}
        animate={shouldAnimate ? 'visible' : 'visible'}
      />

      {/* Suction cups along inner curve - larger at base, smaller at tip */}
      {[
        // Base section - larger cups
        { cx: 95, cy: 220, r: 5, delay: 0.8 },
        { cx: 102, cy: 208, r: 5.2, delay: 0.82 },
        { cx: 110, cy: 196, r: 5.5, delay: 0.84 },
        { cx: 119, cy: 185, r: 5.8, delay: 0.86 },
        { cx: 129, cy: 175, r: 6, delay: 0.88 },

        // Mid section
        { cx: 140, cy: 167, r: 6.2, delay: 0.9 },
        { cx: 151, cy: 162, r: 6.3, delay: 0.92 },
        { cx: 163, cy: 160, r: 6.2, delay: 0.94 },
        { cx: 175, cy: 161, r: 6, delay: 0.96 },

        // Tip section - smaller cups
        { cx: 186, cy: 165, r: 5.5, delay: 0.98 },
        { cx: 196, cy: 171, r: 5, delay: 1.0 },
        { cx: 205, cy: 179, r: 4.5, delay: 1.02 },
        { cx: 213, cy: 189, r: 4, delay: 1.04 },
        { cx: 219, cy: 200, r: 3.5, delay: 1.06 },
        { cx: 222, cy: 212, r: 3, delay: 1.08 },
      ].map((cup, i) => (
        <motion.g
          key={`suction-${i}`}
          variants={suctionVariants}
          custom={cup.delay}
          initial={false}
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
        'M 90 240 C 92 234, 94 228, 96 222',
        'M 100 218 C 104 212, 108 206, 113 200',
        'M 117 193 C 122 188, 128 183, 134 179',
        'M 138 175 C 144 172, 150 170, 157 168',
        'M 160 167 C 167 167, 174 168, 181 170',
        'M 184 172 C 190 175, 196 179, 201 184',
        'M 204 187 C 208 192, 212 198, 215 204',
        'M 217 208 C 219 214, 220 220, 221 226',
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
          initial={false}
          animate={shouldAnimate ? 'visible' : 'visible'}
        />
      ))}

      {/* Subtle ridges along length */}
      {[
        { d: 'M 88 245 C 89 238, 91 231, 93 224', opacity: 0.25 },
        { d: 'M 97 218 C 100 212, 104 206, 108 200', opacity: 0.25 },
        { d: 'M 115 192 C 120 187, 126 182, 132 178', opacity: 0.3 },
        { d: 'M 140 172 C 147 170, 154 169, 161 169', opacity: 0.3 },
        { d: 'M 170 170 C 177 172, 184 175, 190 179', opacity: 0.25 },
        { d: 'M 198 183 C 204 189, 209 196, 213 203', opacity: 0.25 },
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
          initial={false}
          animate={shouldAnimate ? 'visible' : 'visible'}
        />
      ))}
    </g>
  );
}
