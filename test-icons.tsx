import React from 'react';
import * as Icons from './src/components/icons/animated';

// Test render all icons to catch errors
export function TestAllIcons() {
  const iconNames = Object.keys(Icons);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', padding: '20px' }}>
      {iconNames.map((iconName) => {
        const IconComponent = (Icons as any)[iconName];
        if (!IconComponent) return null;

        return (
          <div key={iconName} style={{ textAlign: 'center' }}>
            <div style={{ border: '1px solid #ccc', padding: '10px' }}>
              <IconComponent size={64} animate={true} />
            </div>
            <div style={{ fontSize: '12px', marginTop: '5px' }}>{iconName}</div>
          </div>
        );
      })}
    </div>
  );
}
