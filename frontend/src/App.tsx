import { useState, useMemo } from 'react';
import { Search, List, BarChart2 } from 'lucide-react';
import { DataTable } from './components/DataTable';
import { Statistics } from './components/Statistics';
import type { AuthorityData } from './components/DataTable';
import initialData from './data.json';
import './App.css';

function App() {
  const [activeView, setActiveView] = useState<'directory' | 'statistics'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('Alle Bundesländer');
  const [selectedSize, setSelectedSize] = useState('Alle Größen');
  const [data] = useState<AuthorityData[]>(initialData);

  // Extract unique states for the filter
  const states = useMemo(() => {
    const uniqueStates = Array.from(new Set(data.map(item => item.state)))
      .filter(state => state && state !== 'Unknown')
      .sort();
    return ['Alle Bundesländer', ...uniqueStates];
  }, [data]);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-title">
          <div className="title-text">
            <h1>Ausländerbehörden Datenverzeichnis</h1>
          </div>
        </div>
        
        <div className="header-nav">
          <button 
            className={`nav-item ${activeView === 'directory' ? 'active' : ''}`}
            onClick={() => setActiveView('directory')}
          >
            <List size={18} />
            <span>Verzeichnis</span>
          </button>
          <button 
            className={`nav-item ${activeView === 'statistics' ? 'active' : ''}`}
            onClick={() => setActiveView('statistics')}
          >
            <BarChart2 size={18} />
            <span>Statistiken</span>
          </button>
        </div>

        <div className="header-actions">
          {activeView === 'directory' && (
            <>
              <div className="filter-container">
                <select 
                  className="state-select"
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                >
                  {states.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>

                <select
                  className="state-select"
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                >
                  {['Alle Größen', 'Klein', 'Mittel', 'Groß', 'Unbekannt'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="search-container">
                <Search className="search-icon" />
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Suche nach Name, Stadt, Email..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
      </header>

      <main className="main-content">
        {activeView === 'directory' ? (
          <DataTable data={data} searchQuery={searchQuery} selectedState={selectedState} selectedSize={selectedSize} />
        ) : (
          <Statistics data={data} />
        )}
      </main>
    </div>
  );
}

export default App;
