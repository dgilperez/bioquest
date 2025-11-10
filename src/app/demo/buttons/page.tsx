'use client';

import { useState } from 'react';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { Button } from '@/components/ui/button';

export default function ButtonDemoPage() {
  const [loading, setLoading] = useState(false);

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-nature-50 to-nature-100 dark:from-nature-950 dark:to-nature-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-display font-bold text-nature-900 dark:text-nature-50 mb-2">
            Button Animation Demo
          </h1>
          <p className="text-nature-600 dark:text-nature-400">
            Interactive showcase of enhanced button animations with ripple effects and loading states.
          </p>
        </div>

        {/* AnimatedButton Variants */}
        <section className="bg-white dark:bg-nature-800 rounded-lg p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-display font-bold mb-4">AnimatedButton Variants</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Click buttons to see press animation and ripple effect
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <AnimatedButton variant="primary" onClick={() => console.log('Primary clicked')}>
                Primary Button
              </AnimatedButton>
              <AnimatedButton variant="secondary" onClick={() => console.log('Secondary clicked')}>
                Secondary Button
              </AnimatedButton>
              <AnimatedButton variant="outline" onClick={() => console.log('Outline clicked')}>
                Outline Button
              </AnimatedButton>
              <AnimatedButton variant="ghost" onClick={() => console.log('Ghost clicked')}>
                Ghost Button
              </AnimatedButton>
            </div>
          </div>
        </section>

        {/* Button Sizes */}
        <section className="bg-white dark:bg-nature-800 rounded-lg p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-display font-bold mb-4">Button Sizes</h2>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <AnimatedButton size="sm" onClick={() => console.log('Small clicked')}>
              Small
            </AnimatedButton>
            <AnimatedButton size="md" onClick={() => console.log('Medium clicked')}>
              Medium
            </AnimatedButton>
            <AnimatedButton size="lg" onClick={() => console.log('Large clicked')}>
              Large
            </AnimatedButton>
          </div>
        </section>

        {/* Loading State */}
        <section className="bg-white dark:bg-nature-800 rounded-lg p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-display font-bold mb-4">Loading State</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Animated SVG spinner replaces emoji for clean, professional look
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <AnimatedButton loading={true}>
              Processing...
            </AnimatedButton>
            <AnimatedButton variant="secondary" loading={true}>
              Loading Data...
            </AnimatedButton>
            <AnimatedButton onClick={handleLoadingDemo} loading={loading}>
              {loading ? 'Processing...' : 'Click to Test (3s)'}
            </AnimatedButton>
          </div>
        </section>

        {/* Disabled State */}
        <section className="bg-white dark:bg-nature-800 rounded-lg p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-display font-bold mb-4">Disabled State</h2>
            <p className="text-sm text-muted-foreground mb-4">
              No hover, press, or ripple animations when disabled
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <AnimatedButton disabled variant="primary">
              Disabled Primary
            </AnimatedButton>
            <AnimatedButton disabled variant="outline">
              Disabled Outline
            </AnimatedButton>
          </div>
        </section>

        {/* Ripple Control */}
        <section className="bg-white dark:bg-nature-800 rounded-lg p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-display font-bold mb-4">Ripple Control</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Use <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">showRipple=false</code> to disable ripple effect
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <AnimatedButton showRipple={true}>
              With Ripple (default)
            </AnimatedButton>
            <AnimatedButton showRipple={false}>
              Without Ripple
            </AnimatedButton>
          </div>
        </section>

        {/* Comparison with shadcn Button */}
        <section className="bg-white dark:bg-nature-800 rounded-lg p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-display font-bold mb-4">Comparison</h2>
            <p className="text-sm text-muted-foreground mb-4">
              AnimatedButton vs standard shadcn/ui Button
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-2">AnimatedButton (Enhanced)</h3>
              <div className="flex flex-col gap-2">
                <AnimatedButton>Click for Ripple Effect</AnimatedButton>
                <ul className="text-sm text-muted-foreground list-disc list-inside">
                  <li>Hover scale animation</li>
                  <li>Press animation (scale down)</li>
                  <li>Material Design ripple effect</li>
                  <li>Animated SVG loading spinner</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Standard Button</h3>
              <div className="flex flex-col gap-2">
                <Button className="bg-nature-600 hover:bg-nature-700">Standard Button</Button>
                <ul className="text-sm text-muted-foreground list-disc list-inside">
                  <li>Basic hover color change</li>
                  <li>No press animation</li>
                  <li>No ripple effect</li>
                  <li>Standard loading state</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Details */}
        <section className="bg-white dark:bg-nature-800 rounded-lg p-6 space-y-4">
          <h2 className="text-2xl font-display font-bold">Technical Details</h2>

          <div className="space-y-3 text-sm">
            <div>
              <h3 className="font-semibold mb-1">Press Animation</h3>
              <p className="text-muted-foreground">
                Uses Framer Motion&apos;s <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">whileTap</code> with scale: 0.95 for tactile feedback
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">Ripple Effect</h3>
              <p className="text-muted-foreground">
                Material Design-inspired ripple calculated from click position using mouse coordinates and button&apos;s bounds.
                Ripples animate scale: 0 → 2 and opacity: 0.5 → 0 over 600ms.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">Loading Spinner</h3>
              <p className="text-muted-foreground">
                SVG circle with strokeDasharray animated via Framer Motion&apos;s rotate transform.
                Size adapts to button size (sm: 14px, md: 16px, lg: 20px).
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">Performance</h3>
              <p className="text-muted-foreground">
                Ripples auto-cleanup after 600ms. Uses CSS transforms (GPU-accelerated).
                AnimatePresence ensures smooth ripple exit animations.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
