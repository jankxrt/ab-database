import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  Mail,
  MapPin,
  User,
  Building2,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  SearchX,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import './DataTable.css';

export interface AuthorityData {
  id: string;
  officeName: string;
  phoneNumber: string;
  emailAddress: string;
  physicalAddress: string;
  state: string;
  contacted: string;
  contactPerson: string;
  stadtgroesse: string;
}

interface DataTableProps {
  data: AuthorityData[];
  searchQuery: string;
  selectedState: string;
  selectedSize: string;
}

type SortField = keyof AuthorityData;
type SortOrder = 'asc' | 'desc';

const SIZE_ORDER: Record<string, number> = { Klein: 0, Mittel: 1, 'Groß': 2, Unbekannt: 3 };

export const DataTable: React.FC<DataTableProps> = ({ data, searchQuery, selectedState, selectedSize }) => {
  const [sortField, setSortField] = useState<SortField>('officeName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedData = useMemo(() => {
    // Filter
    const filtered = data.filter((item) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = (
        item.officeName.toLowerCase().includes(searchLower) ||
        item.emailAddress.toLowerCase().includes(searchLower) ||
        item.physicalAddress.toLowerCase().includes(searchLower) ||
        item.contactPerson.toLowerCase().includes(searchLower)
      );

      const matchesState = selectedState === 'Alle Bundesländer' || item.state === selectedState;
      const matchesSize  = selectedSize  === 'Alle Größen'       || item.stadtgroesse === selectedSize;

      return matchesSearch && matchesState && matchesSize;
    });

    // Sort
    return filtered.sort((a, b) => {
      if (sortField === 'stadtgroesse') {
        const diff = (SIZE_ORDER[a.stadtgroesse] ?? 99) - (SIZE_ORDER[b.stadtgroesse] ?? 99);
        return sortOrder === 'asc' ? diff : -diff;
      }
      const aValue = String(a[sortField]).toLowerCase();
      const bValue = String(b[sortField]).toLowerCase();

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, searchQuery, selectedState, selectedSize, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to first page when search or filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedState]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown className="sort-icon" />;
    return sortOrder === 'asc' ?
      <ChevronUp className="sort-icon active" /> :
      <ChevronDown className="sort-icon active" />;
  };

  return (
    <div className="table-container">
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>
                <div className="th-content" onClick={() => handleSort('officeName')}>
                  Behörde <SortIcon field="officeName" />
                </div>
              </th>
              <th>
                <div className="th-content" onClick={() => handleSort('physicalAddress')}>
                  Standort <SortIcon field="physicalAddress" />
                </div>
              </th>
              <th>
                <div className="th-content" onClick={() => handleSort('emailAddress')}>
                  Kontakt <SortIcon field="emailAddress" />
                </div>
              </th>
              <th>
                <div className="th-content" onClick={() => handleSort('contactPerson')}>
                  Kontaktperson <SortIcon field="contactPerson" />
                </div>
              </th>
              <th>
                <div className="th-content" onClick={() => handleSort('contacted')}>
                  Kontaktiert <SortIcon field="contacted" />
                </div>
              </th>
              <th>
                <div className="th-content" onClick={() => handleSort('stadtgroesse')}>
                  Stadtgröße <SortIcon field="stadtgroesse" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode='popLayout'>
              {paginatedData.length > 0 ? (
                paginatedData.map((row) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    layout
                  >
                    <td>
                      <div className="cell-content">
                        <Building2 className="cell-icon" />
                        <span style={{ fontWeight: 500 }}>{row.officeName}</span>
                      </div>
                    </td>
                    <td>
                      <div className="cell-content">
                        <MapPin className="cell-icon" />
                        <span>{row.physicalAddress}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div className="cell-content" style={{ fontSize: '0.85rem' }}>
                          <Mail className="cell-icon" style={{ width: 14, height: 14 }} />
                          <span style={{ color: 'var(--text-muted)' }}>N.N.</span>
                        </div>
                        <div className="cell-content" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          <Phone className="cell-icon" style={{ width: 14, height: 14 }} />
                          <span>N.N.</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="cell-content">
                        <User className="cell-icon" />
                        <span className="badge">N.N.</span>
                      </div>
                    </td>
                    <td>
                      <div className="cell-content">
                        {row.contacted === 'Ja' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
                            <CheckCircle2 size={18} />
                            <span>Ja</span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                            <XCircle size={18} />
                            <span>Nein</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`size-badge size-badge--${(row.stadtgroesse ?? 'Unbekannt').toLowerCase().replace('ß','ss')}`}>
                        {row.stadtgroesse ?? 'Unbekannt'}
                      </span>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <td colSpan={6}>
                    <div className="empty-state">
                      <SearchX className="empty-icon" />
                      <h3>Keine Ergebnisse gefunden</h3>
                      <p>Versuchen Sie, Ihre Suchanfrage anzupassen.</p>
                    </div>
                  </td>
                </motion.tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <div className="page-info">
            Zeige <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> bis{' '}
            <strong>{Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)}</strong> von{' '}
            <strong>{filteredAndSortedData.length}</strong> Einträgen
          </div>
          <div className="page-controls">
            <button
              className="page-btn"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </button>

            {/* Simple page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
              // Show pages around current page
              let pageNum = currentPage - 2 + idx;
              if (currentPage <= 3) pageNum = idx + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + idx;

              if (pageNum > 0 && pageNum <= totalPages) {
                return (
                  <button
                    key={pageNum}
                    className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              }
              return null;
            })}

            <button
              className="page-btn"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
