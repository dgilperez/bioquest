/**
 * Development-only global error reporter for Framer Motion animation issues
 * Automatically enhances console errors with helpful debugging information
 */

let isInstalled = false;

export function installAnimationErrorReporter() {
  // Only run in development
  if (process.env.NODE_ENV !== 'development' || isInstalled) {
    return;
  }

  isInstalled = true;

  const originalError = console.error;
  const seenErrors = new Set<string>();

  console.error = (...args: any[]) => {
    const errorMessage = args[0]?.toString() || '';
    const errorKey = errorMessage.substring(0, 100); // Use first 100 chars as key

    // Check if this is a Framer Motion SVG error
    if (
      errorMessage.includes('attribute') &&
      (errorMessage.includes('Expected length') ||
       errorMessage.includes('Expected moveto') ||
       errorMessage.includes('undefined'))
    ) {
      // Prevent duplicate logs for the same error
      if (seenErrors.has(errorKey)) {
        return;
      }
      seenErrors.add(errorKey);

      console.group('🎯 Framer Motion SVG Animation Error Detected');
      originalError.apply(console, args);

      // Parse the error to provide specific guidance
      const attrMatch = errorMessage.match(/<(\w+)> attribute (\w+):/);
      if (attrMatch) {
        const [, element, attr] = attrMatch;

        console.warn('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.warn(`💡 DIAGNOSIS:`);
        console.warn(`   SVG Element: <${element}>`);
        console.warn(`   Attribute: ${attr}`);
        console.warn(`   Issue: Attribute value is "undefined" during render`);
        console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.warn('📋 COMMON CAUSES & FIXES:\n');

        if (attr === 'd') {
          console.warn('❌ Problem: <motion.path> d attribute is undefined');
          console.warn('');
          console.warn('✅ Solution 1: Add initial={false}');
          console.warn('   <motion.path');
          console.warn('     d="M 10 10 L 20 20"');
          console.warn('     initial={false}  ← Add this');
          console.warn('     animate={animate ? "idle" : undefined}');
          console.warn('     variants={pathVariants}');
          console.warn('   />');
          console.warn('');
          console.warn('✅ Solution 2: Add "initial" state to variants');
          console.warn('   const pathVariants = {');
          console.warn('     initial: { d: "M 10 10 L 20 20" },  ← Add this');
          console.warn('     idle: { d: [...], transition: {...} }');
          console.warn('   };');
        } else if (['cx', 'cy', 'r'].includes(attr)) {
          console.warn(`❌ Problem: <${element}> ${attr} attribute is undefined`);
          console.warn('');
          console.warn('✅ Solution 1: Use CSS transforms instead (RECOMMENDED)');
          console.warn('   // Instead of animating cx/cy, use x/y:');
          console.warn('   <motion.circle');
          console.warn(`     cx="40" cy="40"  ← Static values`);
          console.warn('     animate={{ x: [0, 10, 0], y: [0, 5, 0] }}  ← Use transforms');
          console.warn('   />');
          console.warn('');
          console.warn('✅ Solution 2: Add initial={false}');
          console.warn('   <motion.circle');
          console.warn(`     ${attr}="40"`);
          console.warn('     initial={false}  ← Add this');
          console.warn('     animate="idle"');
          console.warn('   />');
          console.warn('');
          console.warn('⚠️  Note: Animating SVG geometric attributes (cx, cy, r)');
          console.warn('    can cause performance issues. Prefer CSS transforms!');
        } else if (attr === 'points' || attr === 'viewBox') {
          console.warn(`❌ Problem: <${element}> ${attr} attribute is undefined`);
          console.warn('');
          console.warn('✅ Solution: Add initial={false}');
          console.warn('   This tells Framer Motion to use the prop value directly.');
        }

        console.warn('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.warn('🔍 DEBUGGING TIPS:');
        console.warn('   1. Check the React component stack above');
        console.warn('   2. Look for motion.* elements in that component');
        console.warn(`   3. Search for: animate=\{\{  or  animate.*${attr}`);
        console.warn('   4. Verify all variants have initial states');
        console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      }

      console.warn('📚 Documentation:');
      console.warn('   • Framer Motion: https://www.framer.com/motion/');
      console.warn('   • SVG Animations: https://www.framer.com/motion/component/#svg');
      console.warn('   • Animation Variants: https://www.framer.com/motion/animation/#variants');
      console.groupEnd();
    } else {
      // Pass through other errors normally
      originalError.apply(console, args);
    }
  };

  console.info('🎨 Animation error reporter installed (development mode)');
}

/**
 * Call this in your app's root component to enable enhanced error reporting
 */
export function setupDevTools() {
  if (process.env.NODE_ENV === 'development') {
    installAnimationErrorReporter();
  }
}
