import Image from 'next/image';

interface AmbientLogoProps {
  /**
   * Position preset or custom positioning classes
   * Presets: 'top-right', 'top-left', 'bottom-right', 'bottom-left', 'center'
   */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center' | string;
  /**
   * Size in pixels (default: 384)
   */
  size?: number;
  /**
   * Opacity level (0-100, default: 3 for light mode, 2 for dark mode)
   */
  opacity?: number;
  /**
   * Rotation in degrees (default: 0)
   */
  rotate?: number;
  /**
   * Z-index (default: 0)
   */
  zIndex?: number;
}

const positionPresets = {
  'top-right': 'top-20 right-10',
  'top-left': 'top-20 left-10',
  'bottom-right': 'bottom-20 right-10',
  'bottom-left': 'bottom-20 left-10',
  'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
};

/**
 * Ambient Logo Watermark Component
 *
 * Adds a subtle, translucent version of the BioQuest logo as a background
 * decorative element. Perfect for creating organic, nature-inspired ambiance.
 *
 * @example
 * // Top right corner, default settings
 * <AmbientLogo position="top-right" />
 *
 * @example
 * // Center, larger, slightly more visible
 * <AmbientLogo position="center" size={600} opacity={5} />
 *
 * @example
 * // Custom position with rotation
 * <AmbientLogo
 *   position="top-1/4 left-3/4"
 *   rotate={45}
 *   opacity={2}
 * />
 */
export function AmbientLogo({
  position = 'top-right',
  size = 384,
  opacity = 3,
  rotate = 0,
  zIndex = 0,
}: AmbientLogoProps) {
  // Use preset or custom position
  const positionClasses = positionPresets[position as keyof typeof positionPresets] || position;

  // Calculate opacity for light and dark modes
  const lightOpacity = opacity / 100;
  const darkOpacity = (opacity * 0.67) / 100; // Darker in dark mode

  const rotateClass = rotate !== 0 ? `rotate-[${rotate}deg]` : '';

  return (
    <div
      className={`
        fixed ${positionClasses} ${rotateClass}
        pointer-events-none
      `}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        zIndex,
        opacity: lightOpacity,
        // Use CSS variable for dark mode opacity
        ['--dark-opacity' as string]: darkOpacity,
      }}
    >
      <div className="w-full h-full dark:opacity-[var(--dark-opacity)]">
        <Image
          src="/images/logo-watermark.png"
          alt=""
          width={size}
          height={size}
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
}

/**
 * Preset: Multiple ambient logos for rich background
 *
 * @example
 * <AmbientLogoSet />
 */
export function AmbientLogoSet() {
  return (
    <>
      <AmbientLogo position="top-right" size={400} rotate={12} opacity={3} />
      <AmbientLogo position="bottom-left" size={350} rotate={-15} opacity={3} />
      <AmbientLogo position="center" size={550} opacity={2} />
    </>
  );
}
