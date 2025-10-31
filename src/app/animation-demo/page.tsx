import AnimatedLogo from '@/components/AnimatedLogo';

export default function AnimationDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            BioQuest Animated Logo Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Exploring organic growth animation with Framer Motion. Watch as the
            logo comes to life with spiraling ferns, sprouting mushrooms, and
            unfurling leaves.
          </p>
        </div>

        {/* Main showcase */}
        <div className="bg-white rounded-xl shadow-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            Default Animation (with continuous breathing)
          </h2>
          <div className="flex justify-center">
            <AnimatedLogo size={500} loop={true} />
          </div>
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              ✨ Features organic growth sequence followed by subtle continuous
              motion
            </p>
            <p className="mt-2">
              🎮 Click the play/pause button in the corner to control the
              animation
            </p>
          </div>
        </div>

        {/* Different configurations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Config 1: Normal speed, no loop */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-center">
              Growth Only
            </h3>
            <div className="flex justify-center mb-4">
              <AnimatedLogo size={300} loop={false} speed={1} />
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <strong>Speed:</strong> Normal (1x)
              </p>
              <p>
                <strong>Loop:</strong> No
              </p>
              <p>
                <strong>Use case:</strong> Page load animation
              </p>
            </div>
          </div>

          {/* Config 2: Fast speed */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-center">
              Fast Growth
            </h3>
            <div className="flex justify-center mb-4">
              <AnimatedLogo size={300} loop={true} speed={2} />
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <strong>Speed:</strong> Fast (2x)
              </p>
              <p>
                <strong>Loop:</strong> Yes
              </p>
              <p>
                <strong>Use case:</strong> Impatient users, loading states
              </p>
            </div>
          </div>

          {/* Config 3: Slow, meditative */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-center">
              Slow & Meditative
            </h3>
            <div className="flex justify-center mb-4">
              <AnimatedLogo size={300} loop={true} speed={0.5} />
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <strong>Speed:</strong> Slow (0.5x)
              </p>
              <p>
                <strong>Loop:</strong> Yes
              </p>
              <p>
                <strong>Use case:</strong> Hero sections, ambient background
              </p>
            </div>
          </div>
        </div>

        {/* Technical explanation */}
        <div className="bg-gray-900 text-white rounded-xl shadow-2xl p-8">
          <h2 className="text-3xl font-bold mb-6">
            How It Works: Framer Motion Magic ✨
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-green-400">
                Animation Techniques
              </h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">▹</span>
                  <div>
                    <strong>Path Drawing:</strong> SVG paths animate from 0 to
                    100% length, creating the "drawing" effect for spirals and
                    vines
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">▹</span>
                  <div>
                    <strong>Spring Physics:</strong> Mushrooms use spring
                    animations for natural, bouncy growth
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">▹</span>
                  <div>
                    <strong>Staggered Timing:</strong> Each element has a
                    different delay, creating organic, non-uniform growth
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">▹</span>
                  <div>
                    <strong>Continuous Motion:</strong> Subtle rotation and
                    scaling creates a "breathing" effect
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4 text-blue-400">
                Why Framer Motion?
              </h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">✓</span>
                  <div>
                    <strong>Lightweight:</strong> ~30KB vs Three.js (~600KB)
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">✓</span>
                  <div>
                    <strong>Declarative:</strong> Animation logic lives with
                    components
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">✓</span>
                  <div>
                    <strong>Accessible:</strong> Respects prefers-reduced-motion
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">✓</span>
                  <div>
                    <strong>Performant:</strong> Uses CSS transforms (GPU
                    accelerated)
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">✓</span>
                  <div>
                    <strong>React Native:</strong> Easy to adapt for React
                    Native
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gray-800 rounded-lg">
            <h4 className="text-lg font-semibold mb-3 text-yellow-400">
              Code Example
            </h4>
            <pre className="text-sm text-gray-300 overflow-x-auto">
              <code>{`const spiralVariants = {
  hidden: {
    pathLength: 0,      // Start invisible
    opacity: 0,
    rotate: -20,        // Slightly rotated
  },
  visible: {
    pathLength: 1,      // Draw to full length
    opacity: 1,
    rotate: 0,
    transition: {
      pathLength: { duration: 2.5, ease: 'easeOut' },
      opacity: { duration: 0.5 },
    },
  },
  breathe: {
    rotate: [0, 5, 0],  // Gentle rotation loop
    transition: {
      duration: 8,
      repeat: Infinity,
    },
  },
};

<motion.path
  d="M 100 200 Q 100 150..."  // SVG path data
  variants={spiralVariants}
  initial="hidden"
  animate={["visible", "breathe"]}
/>`}</code>
            </pre>
          </div>
        </div>

        {/* Usage instructions */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Using in Your App</h2>
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold text-lg mb-2">
                1. Import the component
              </h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                <code>{`import AnimatedLogo from '@/components/AnimatedLogo';`}</code>
              </pre>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">
                2. Use with props
              </h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                <code>{`// Simple usage
<AnimatedLogo size={400} />

// Advanced configuration
<AnimatedLogo
  size={500}
  autoPlay={true}
  speed={1}            // 1x speed (2 = double, 0.5 = half)
  loop={true}          // Continuous breathing animation
  onComplete={() => {  // Callback when animation finishes
    console.log('Animation complete!');
  }}
/>`}</code>
              </pre>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">3. Common use cases</h3>
              <ul className="space-y-2">
                <li className="flex gap-2">
                  <span>🏠</span>
                  <div>
                    <strong>Homepage hero:</strong>{' '}
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {`<AnimatedLogo size={600} loop={true} speed={0.7} />`}
                    </code>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span>⏳</span>
                  <div>
                    <strong>Loading screen:</strong>{' '}
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {`<AnimatedLogo size={300} loop={true} speed={1.5} />`}
                    </code>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span>🎉</span>
                  <div>
                    <strong>Welcome animation:</strong>{' '}
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {`<AnimatedLogo size={400} loop={false} onComplete={showDashboard} />`}
                    </code>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Accessibility note */}
        <div className="mt-8 bg-green-50 border-l-4 border-green-500 p-6 rounded">
          <h3 className="font-semibold text-lg mb-2 text-green-900">
            ♿ Accessibility Built-in
          </h3>
          <p className="text-green-800">
            The animation automatically respects the user's{' '}
            <code className="bg-green-100 px-2 py-1 rounded">
              prefers-reduced-motion
            </code>{' '}
            setting. Users who have motion sensitivity will see a static logo
            instead of the animated version. This is a web standard and
            accessibility best practice.
          </p>
        </div>
      </div>
    </div>
  );
}
