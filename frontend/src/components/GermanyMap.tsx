import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';

const geoUrl = '/germany-states.json';

interface GermanyMapProps {
  stateCounts?: Record<string, number>;
}

export const GermanyMap: React.FC<GermanyMapProps> = ({ stateCounts = {} }) => {
  const [tooltipContent, setTooltipContent] = useState('');

  // Find max value for color scale
  const maxValue = Math.max(1, ...Object.values(stateCounts));
  
  // Custom color scale based on the requested subtle orange theme
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const colorScale = (scaleLinear as any)()
    .domain([0, maxValue])
    .range(['rgba(249, 115, 22, 0.1)', 'rgba(249, 115, 22, 0.9)']) as (v: number) => string;

  // Map JSON state names to the ones in our dataset if needed
  // The JSON uses names like "Baden-Württemberg", which should match exactly.

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '500px' }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 3000,
          center: [10.4515, 51.1657] // Long, Lat for center of Germany
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup center={[10.4515, 51.1657]} zoom={1} minZoom={1} maxZoom={4}>
          <Geographies geography={geoUrl}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo: any) => {
                const stateName = geo.properties.name || geo.properties.NAME_1; // Depends on the exact GeoJSON properties
                // Try to match the state name (handling variations)
                const count = stateCounts[stateName] || 
                              stateCounts[stateName.replace('ü', 'u')] || 
                              stateCounts[Object.keys(stateCounts).find(k => k.includes(stateName) || stateName.includes(k)) || ''] || 0;
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => {
                      setTooltipContent(`${stateName}: ${count} Behörden`);
                    }}
                    onMouseLeave={() => {
                      setTooltipContent('');
                    }}
                    style={{
                      default: {
                        fill: count > 0 ? colorScale(count) : 'rgba(255, 255, 255, 0.05)',
                        stroke: 'var(--border-color)',
                        strokeWidth: 0.5,
                        outline: 'none',
                        transition: 'all 250ms'
                      },
                      hover: {
                        fill: 'var(--accent-primary)',
                        stroke: '#fff',
                        strokeWidth: 1,
                        outline: 'none',
                        cursor: 'pointer',
                        filter: 'drop-shadow(0 0 8px var(--accent-glow))'
                      },
                      pressed: {
                        fill: 'var(--accent-primary-hover)',
                        outline: 'none',
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
      
      {/* Custom Tooltip */}
      {tooltipContent && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'var(--bg-surface)',
          padding: '10px 15px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--accent-primary)',
          color: 'var(--text-primary)',
          boxShadow: 'var(--shadow-glow)',
          fontWeight: 500,
          pointerEvents: 'none',
          zIndex: 10
        }}>
          {tooltipContent}
        </div>
      )}
    </div>
  );
};
