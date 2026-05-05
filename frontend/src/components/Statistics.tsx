import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { GermanyMap } from './GermanyMap';
import type { AuthorityData } from './DataTable';
import './Statistics.css';

interface StatisticsProps {
  data: AuthorityData[];
}

export const Statistics: React.FC<StatisticsProps> = ({ data }) => {
  // Count authorities by state
  const stateCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(item => {
      if (item.state && item.state !== 'Unknown' && item.state !== 'Unbekannt') {
        counts[item.state] = (counts[item.state] || 0) + 1;
      }
    });
    return counts;
  }, [data]);

  // Count authorities by city size
  const sizeCounts = useMemo(() => {
    const counts = {
      Klein: 0,
      Mittel: 0,
      'Groß': 0,
      Unbekannt: 0
    };
    data.forEach(item => {
      const size = (item.stadtgroesse as keyof typeof counts) || 'Unbekannt';
      if (counts.hasOwnProperty(size)) {
        counts[size]++;
      } else {
        counts.Unbekannt++;
      }
    });
    return counts;
  }, [data]);

  const maxCount = Math.max(...Object.values(sizeCounts));

  return (
    <motion.div 
      className="statistics-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="stats-header">
        <h2>Geografische Übersicht</h2>
        <p>Verteilung der Ausländerbehörden nach Bundesland</p>
      </div>

      <div className="stats-content">
        <div className="map-card">
          <GermanyMap stateCounts={stateCounts} />
        </div>
        
        <div className="info-card">
          <h3>Statistiken</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Gesamtanzahl Behörden</span>
              <span className="stat-value">{data.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Bundesländer erfasst</span>
              <span className="stat-value">{Object.keys(stateCounts).length}</span>
            </div>
          </div>

          <div className="chart-section">
            <h4>Stadtgrößen Verteilung</h4>
            <div className="size-chart">
              {[
                { label: 'Klein (< 10k)', key: 'Klein', class: 'klein' },
                { label: 'Mittel (10k - 100k)', key: 'Mittel', class: 'mittel' },
                { label: 'Groß (> 100k)', key: 'Groß', class: 'gross' },
                { label: 'Unbekannt', key: 'Unbekannt', class: 'unbekannt' }
              ].map(item => {
                const count = sizeCounts[item.key as keyof typeof sizeCounts];
                const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                return (
                  <div key={item.key} className="chart-item">
                    <div className="chart-labels">
                      <span className="chart-label">{item.label}</span>
                      <span className="chart-count">{count}</span>
                    </div>
                    <div className="chart-bar-bg">
                      <motion.div 
                        className={`chart-bar-fill ${item.class}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
