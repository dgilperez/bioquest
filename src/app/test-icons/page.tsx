'use client';

import {
  FungiIcon,
  InsectaIcon,
  PlantaeIcon,
  FernIcon,
  AnimaliaIcon,
  AvesIcon,
  MolluscaIcon,
} from '@/components/icons/animated';

/**
 * Test page to showcase all animated taxon icons
 * Navigate to /test-icons to see the icons in action
 */
export default function TestIconsPage() {
  const icons = [
    { name: 'Fungi', Component: FungiIcon, description: 'Mushroom with breathing animation' },
    { name: 'Insecta', Component: InsectaIcon, description: 'Beetle with antenna wave and wing movement' },
    { name: 'Plantae', Component: PlantaeIcon, description: 'Leaf with swaying motion and vein network' },
    { name: 'Plantae (Fern)', Component: FernIcon, description: 'Unfurling fern fiddlehead with spiral crozier' },
    { name: 'Animalia', Component: AnimaliaIcon, description: 'Bear with lumbering walk and head bob' },
    { name: 'Aves', Component: AvesIcon, description: 'Chickadee/tit on branch with head tilts and wing flutter' },
    { name: 'Mollusca', Component: MolluscaIcon, description: 'Nautilus profile with chambered shell and tentacles' },
  ];

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-nature-50 to-nature-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-display font-bold mb-2 text-nature-800 dark:text-nature-200">
          Animated Taxon Icons
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Interactive SVG icons for the Tree of Life. Click or tap on any icon to see the tap animation.
        </p>

        {/* Large showcase */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-12">
          {icons.map(({ name, Component, description }) => (
            <div
              key={name}
              className="flex flex-col items-center p-6 rounded-xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow"
            >
              <Component size={120} animate={true} />
              <h3 className="mt-4 text-xl font-semibold text-gray-800 dark:text-gray-200">
                {name}
              </h3>
              <p className="mt-2 text-sm text-center text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>

        {/* Size comparison */}
        <div className="mt-12 p-6 rounded-xl bg-white dark:bg-gray-800 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Size Variants
          </h2>
          <div className="flex items-end gap-6 flex-wrap">
            {[24, 32, 48, 64, 96].map((size) => (
              <div key={size} className="flex flex-col items-center gap-2">
                <FungiIcon size={size} animate={true} />
                <span className="text-xs text-muted-foreground">{size}px</span>
              </div>
            ))}
          </div>
        </div>

        {/* Animation controls */}
        <div className="mt-12 p-6 rounded-xl bg-white dark:bg-gray-800 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Animation Toggle
          </h2>
          <div className="flex gap-8 items-center">
            <div className="flex flex-col items-center gap-2">
              <FungiIcon size={80} animate={true} />
              <span className="text-sm text-muted-foreground">Animated</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <FungiIcon size={80} animate={false} />
              <span className="text-sm text-muted-foreground">Static</span>
            </div>
          </div>
        </div>

        {/* Usage example */}
        <div className="mt-12 p-6 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Usage in TaxonCard
          </h2>
          <p className="text-muted-foreground mb-4">
            These icons are integrated into the TaxonCard component on the Tree of Life page.
            They appear next to taxon names and animate subtly to draw attention.
          </p>
          <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`import { TaxonIcon } from '@/lib/icons/taxon-icon-mapper';

// In your component:
<TaxonIcon name="Fungi" size={48} animate={true} />`}
          </pre>
        </div>

        {/* Back link */}
        <div className="mt-8 text-center">
          <a
            href="/tree-of-life"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-nature-600 hover:bg-nature-700 text-white font-semibold transition-colors"
          >
            View on Tree of Life Page
          </a>
        </div>
      </div>
    </div>
  );
}
