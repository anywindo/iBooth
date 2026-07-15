import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Image as ImageIcon, Search, Trash2, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useStore, normalizeTemplate } from '../core/useStore.js';
import { AppShell } from '../components/AppShell.jsx';
import { Button } from '../components/Button.jsx';
import { useAuthStore } from '../store/authStore';
import packageJson from '../../package.json';
import aboutImage from '../assets/about.png';
import { TemplateDrawer, formatTemplateDate } from '../components/TemplateDrawer.jsx';

function CollapsibleSection({ title, note, headingClassName = 'section-heading', children, defaultCollapsed = false }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  return (
    <section className="panel-section">
      <div
        className={headingClassName}
        onClick={() => setCollapsed(!collapsed)}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', userSelect: 'none' }}
      >
        <span style={{
          marginRight: '8px',
          transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
          transition: 'transform 0.15s ease',
          display: 'inline-block',
          fontSize: '10px'
        }}>▼</span>
        <h2 className="panel-title" style={{ flex: 1, margin: 0 }}>{title}</h2>
        {note && <span className="section-note">{note}</span>}
      </div>
      <div style={{ display: collapsed ? 'none' : 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
        {children}
      </div>
    </section>
  );
}



export const TemplateThumbnail = ({ template }) => {
  const aspectRatio = (template.width || 1200) / (template.height || 1800);
  const tWidth = template.width || 1200;
  const tHeight = template.height || 1800;

  return (
    <div style={{
      position: 'relative',
      height: '100%', // Take full height of container
      maxHeight: '240px',
      aspectRatio,
      margin: '0 auto',
      background: '#fff',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      {!(template.frameImage || template.frame_image_url) && template.slots?.map(slot => (
        <div key={slot.id} style={{ 
          position: 'absolute', 
          left: `${(slot.x / tWidth) * 100}%`, 
          top: `${(slot.y / tHeight) * 100}%`, 
          width: `${(slot.width / tWidth) * 100}%`, 
          height: `${(slot.height / tHeight) * 100}%`, 
          borderRadius: slot.radius ? `${(slot.radius / tWidth) * 100}%` : 0, 
          backgroundColor: '#e2e8f0',
          border: '1px solid #cbd5e1',
          transform: `rotate(${slot.rotation || 0}deg)`
        }} />
      ))}
      {(template.frameImage || template.frame_image_url) && (
        <img src={template.frameImage || template.frame_image_url} alt={template.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} draggable="false" />
      )}
    </div>
  );
};



export function getInitials(name) {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export function getRandomColor(name) {
  if (!name) return '#aa3bff';
  const colors = ['#aa3bff', '#f28df8', '#f2d34d', '#3b82f6', '#10b981', '#f97316', '#ec4899'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export default function CatalogScreen({ navigate }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [filterFormat, setFilterFormat] = useState('all');
  const [filterSlots, setFilterSlots] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterFormat, filterSlots, activeTab]);

  const { user, isAuthenticated } = useAuthStore();

  const setTemplate = useStore((store) => store.setTemplate);
  const resetTemplate = useStore((store) => store.resetTemplate);
  const setSelectedSlotId = useStore((store) => store.setSelectedSlotId);
  const showToast = useStore((store) => store.showToast);

  const fetchTemplatesMethod = useStore((store) => store.fetchTemplates);

  const [helpMenuOpen, setHelpMenuOpen] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);


  const handleEditorClick = () => {
    if (!isAuthenticated) {
      showToast('You will need to login to access the editor', 'warning');
      return;
    }
    resetTemplate();
    navigate('/editor', { state: { returnTo: '/catalog' } });
  };

  const menu = (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button className="menu-dropdown-button" onClick={handleEditorClick}>Editor</button>
      <button className="menu-dropdown-button" onClick={() => navigate('/catalog')}>Catalog</button>
      {/* <div className="menu-dropdown" onMouseLeave={() => setHelpMenuOpen(false)}>
        <button className="menu-dropdown-button" onPointerDown={() => setHelpMenuOpen(!helpMenuOpen)}>Help</button>
        {helpMenuOpen && (
          <div className="menu-dropdown-content" onClick={() => setHelpMenuOpen(false)}>
            <button className="menu-dropdown-item" onClick={() => setShowAboutModal(true)}>
              About iBooth
            </button>
          </div>
        )}
      </div> */}
    </div>
  );

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetchTemplatesMethod(); // Fetch all templates without userId
        if (!res.success) throw new Error(res.error);
        setTemplates(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, fetchTemplatesMethod]);

  const processedTemplates = useMemo(() => {
    return templates.map(t => {
      let layout = t.slots ? t : (t.layout || t);
      if (typeof layout === 'string') {
        try { layout = JSON.parse(layout); } catch (e) { }
      }
      const norm = typeof normalizeTemplate === 'function' ? normalizeTemplate(layout) : layout;
      const slotsCount = norm?.slots?.length || 0;

      let format = 'Grid';
      if (norm?.type) {
        format = norm.type.charAt(0).toUpperCase() + norm.type.slice(1);
      } else if (norm?.width && norm?.height) {
        const ratio = norm.width / norm.height;
        if (ratio < 0.5) format = 'Strip';
        else if (ratio > 1.2) format = 'Landscape';
        else format = 'Grid';
      }

      return {
        ...t,
        details: {
          slotsCount,
          format,
          normalized: { ...norm, id: t.id, frameImage: t.frame_image_url || norm?.frameImage }
        }
      };
    });
  }, [templates]);

  const popularKeywords = useMemo(() => {
    const counts = {};
    processedTemplates.forEach(template => {
      if (template.tags && Array.isArray(template.tags)) {
        template.tags.forEach(tag => {
          const t = tag.trim().toLowerCase();
          if (t) counts[t] = (counts[t] || 0) + 1;
        });
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(entry => entry[0]);
  }, [processedTemplates]);

  const filteredTemplates = useMemo(() => {
    return processedTemplates
      .filter((template) => {
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = !query || 
          (template.name || '').toLowerCase().includes(query) || 
          (template.tags && Array.isArray(template.tags) && template.tags.some(tag => tag.toLowerCase().includes(query)));

        let matchesTab = true;
        if (activeTab === 'mine') {
          matchesTab = template.owner_id === user?.id;
        } else if (activeTab === 'community') {
          matchesTab = template.owner_id !== user?.id;
        }

        let matchesFormat = true;
        if (filterFormat !== 'all') {
          matchesFormat = template.details.format.toLowerCase() === filterFormat;
        }

        let matchesSlots = true;
        if (filterSlots !== 'all') {
          const slots = template.details.slotsCount;
          if (filterSlots === '5+') {
            matchesSlots = slots >= 5;
          } else {
            matchesSlots = slots === parseInt(filterSlots, 10);
          }
        }

        return matchesSearch && matchesTab && matchesFormat && matchesSlots;
      })
      .sort((a, b) => {
        if (sortOrder === 'newest') return new Date(b.created_at) - new Date(a.created_at);
        if (sortOrder === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
        if (sortOrder === 'a-z') return (a.name || '').localeCompare(b.name || '');
        if (sortOrder === 'z-a') return (b.name || '').localeCompare(a.name || '');
        return 0;
      });
  }, [processedTemplates, searchQuery, activeTab, filterFormat, filterSlots, sortOrder, user]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredTemplates.length / itemsPerPage));
  }, [filteredTemplates.length, itemsPerPage]);

  const paginatedTemplates = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTemplates.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTemplates, currentPage, itemsPerPage]);

  async function deleteTemplate(id, event) {
    event.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      const deleteMethod = useStore.getState().deleteTemplate;
      const res = await deleteMethod(id, user?.id);
      if (!res.success) throw new Error(res.error);
      setTemplates((current) => current.filter((template) => template.id !== id));
      showToast('Template deleted', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete template: ' + err.message, 'error');
    }
  }

  function getNormalizedTemplate(template) {
    // Template from Supabase should already be an object
    let layout = template.slots ? template : (template.layout || template);
    if (typeof layout === 'string') {
      try {
        layout = JSON.parse(layout);
      } catch {
        console.error('Failed to parse layout JSON string');
      }
    }
    const normalized = typeof normalizeTemplate === 'function' ? normalizeTemplate(layout) : layout;
    if (template.frame_image_url && !normalized.frameImage) normalized.frameImage = template.frame_image_url;
    normalized.id = template.id;
    normalized.owner_id = template.owner_id;
    return normalized;
  }

  function loadTemplateToEditor(template) {
    if (!template) return;
    const normalized = getNormalizedTemplate(template);
    setTemplate(normalized);
    setSelectedSlotId(normalized.slots?.[0]?.id || null);
    navigate('/editor', { state: { returnTo: '/catalog', isExplicitEdit: true } });
  }

  function startBoothSession(template) {
    if (!template) return;
    const normalized = getNormalizedTemplate(template);
    setTemplate(normalized);
    setSelectedSlotId(normalized.slots?.[0]?.id || null);
    navigate(`/booth/${normalized.id}`, { state: { returnTo: '/catalog' } });
  }

  function resetFilters() {
    setSearchQuery('');
    setSortOrder('newest');
    setFilterFormat('all');
    setFilterSlots('all');
    setActiveTab('all');
    setCurrentPage(1);
  }

  return (
    <AppShell
      title="Template Catalog"
      showBackButton
      onBack={() => navigate('/')}
      statusLabel={loading ? 'Loading' : 'Clear'}
      menu={menu}
      actions={isAuthenticated && <Button variant="primary" onClick={() => navigate('/editor')}>New Template</Button>}
      statusBar={<div>iBooth v{packageJson.version}</div>}
      statusBarRight={<div>Part of <a href="https://arwndoprtma.space" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>arwndoprtma.space</a></div>}
    >
      <main className="editor-layout" style={{ gridTemplateColumns: '300px minmax(640px, 1fr)' }}>
        <aside className="panel" style={{ overflowY: 'auto' }}>
          <div style={{ padding: '24px 20px 16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-h)', lineHeight: '1.2' }}>Template Catalog</h1>
            <p style={{ fontSize: '12px', color: 'var(--text)', margin: '8px 0 0 0', lineHeight: '1.4' }}>Pick a strip to start a photo booth session.</p>
          </div>
          <CollapsibleSection title="FILTERS" note="Find templates">
            <label>
              Search
              <div className="catalog-search">
                <Search size={15} />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>
            </label>

            <label style={{ marginTop: '12px', display: 'block' }}>
              Format
              <select value={filterFormat} onChange={(event) => setFilterFormat(event.target.value)}>
                <option value="all">All Formats</option>
                <option value="strip">Strip Layouts</option>
                <option value="grid">Grid Layouts</option>
                <option value="landscape">Landscape Layouts</option>
              </select>
            </label>

            <label style={{ marginTop: '12px', display: 'block' }}>
              Slot Count
              <select value={filterSlots} onChange={(event) => setFilterSlots(event.target.value)}>
                <option value="all">Any Slots</option>
                <option value="1">1 Photo</option>
                <option value="2">2 Photos</option>
                <option value="3">3 Photos</option>
                <option value="4">4 Photos</option>
                <option value="5+">5+ Photos</option>
              </select>
            </label>

            <label style={{ marginTop: '12px', display: 'block' }}>
              Sort By
              <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="a-z">A - Z</option>
                <option value="z-a">Z - A</option>
              </select>
            </label>

            <Button 
              style={{ marginTop: '16px', width: '100%' }} 
              onClick={resetFilters}
              disabled={!(searchQuery || sortOrder !== 'newest' || filterFormat !== 'all' || filterSlots !== 'all' || activeTab !== 'all')}
            >
              Reset Filters
            </Button>
          </CollapsibleSection>
          
          <CollapsibleSection title="POPULAR KEYWORDS" note="Click to search">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {popularKeywords.map(keyword => {
                const isActive = searchQuery.toLowerCase().trim() === keyword;
                return (
                  <button
                    key={keyword}
                    onClick={() => setSearchQuery(isActive ? '' : keyword)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: isActive ? 600 : 500,
                      borderRadius: '16px',
                      background: isActive ? 'var(--primary)' : 'var(--bg)',
                      color: isActive ? '#fff' : 'var(--text)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'all 0.1s ease',
                      boxShadow: isActive ? 'inset 0 1px 1px rgba(255,255,255,0.2)' : 'none'
                    }}
                  >
                    #{keyword}
                  </button>
                );
              })}
              {popularKeywords.length === 0 && (
                <div style={{ fontSize: '12px', color: 'var(--muted)', width: '100%', textAlign: 'center', padding: '12px 0' }}>No tags found.</div>
              )}
            </div>
          </CollapsibleSection>
        </aside>

        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
          {/* Tabbed Navigation */}
          <div className="catalog-tab-bar" style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', padding: '8px 40px', borderBottom: '1px solid var(--border)', alignItems: 'center', background: 'var(--panel)', flex: '0 0 auto' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { id: 'all', label: 'All Templates', count: templates.length },
                { id: 'mine', label: 'My Templates', authenticatedOnly: true, count: templates.filter(t => t.owner_id === user?.id).length }
              ].map(tab => {
                if (tab.authenticatedOnly && !isAuthenticated) return null;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    className={`catalog-tab ${active ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      background: active
                        ? 'linear-gradient(180deg, #71abf5 0%, #4d84eb 100%)'
                        : 'linear-gradient(180deg, var(--bg) 0%, var(--border) 100%)',
                      border: active
                        ? '1px solid #26437d'
                        : '1px solid var(--border)',
                      borderTopColor: active ? '#71abf5' : 'var(--border)',
                      borderBottomColor: active ? '#26437d' : 'var(--border)',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: active ? 700 : 500,
                      color: active ? '#ffffff' : 'var(--text)',
                      cursor: 'pointer',
                      transition: 'all 0.1s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: active
                        ? '0 1px 2px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255,255,255,0.3)'
                        : '0 1px 2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.4)',
                      textShadow: active ? '0 -1px 0 rgba(0,0,0,0.2)' : 'none',
                      transform: active ? 'translateY(1px)' : 'none'
                    }}
                  >
                    <span>{tab.label}</span>
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      background: active ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)',
                      color: active ? '#ffffff' : 'var(--text)',
                      borderRadius: '10px',
                      fontWeight: 700,
                      boxShadow: active ? 'none' : 'inset 0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Pagination & Navigation controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Show Limit Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <span style={{ color: 'var(--text)', fontWeight: 500 }}>Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(parseInt(e.target.value, 10));
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: 'linear-gradient(180deg, var(--bg) 0%, var(--border) 100%)',
                    color: 'var(--text-h)',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.4)',
                    outline: 'none'
                  }}
                >
                  <option value={8}>8</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              {/* Navigation controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: currentPage === 1 ? 'var(--border)' : 'linear-gradient(180deg, var(--bg) 0%, var(--border) 100%)',
                    color: currentPage === 1 ? 'var(--text)' : 'var(--text-h)',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 1 ? 0.5 : 1,
                    boxShadow: currentPage === 1 ? 'none' : '0 1px 2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.4)',
                    fontWeight: 600
                  }}
                >
                  Prev
                </button>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-h)', minWidth: '60px', textAlign: 'center' }}>
                  {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: currentPage === totalPages ? 'var(--border)' : 'linear-gradient(180deg, var(--bg) 0%, var(--border) 100%)',
                    color: currentPage === totalPages ? 'var(--text)' : 'var(--text-h)',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    opacity: currentPage === totalPages ? 0.5 : 1,
                    boxShadow: currentPage === totalPages ? 'none' : '0 1px 2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.4)',
                    fontWeight: 600
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <section className="workspace catalog-workspace" style={{ padding: '40px', overflowY: 'auto', position: 'relative', flex: '1 1 auto' }}>
            <div className="catalog-content" style={{ position: 'relative', zIndex: 1 }}>

              {/* Active Filter Chips */}
              {(searchQuery || filterFormat !== 'all' || filterSlots !== 'all') && (
                <div className="catalog-filter-chips" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>

                  {filterFormat !== 'all' && (
                    <span className="catalog-chip" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '999px', background: 'var(--bg)', cursor: 'pointer' }} onClick={() => setFilterFormat('all')}>
                      Format: {filterFormat} <X size={12} />
                    </span>
                  )}
                  {filterSlots !== 'all' && (
                    <span className="catalog-chip" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '999px', background: 'var(--bg)', cursor: 'pointer' }} onClick={() => setFilterSlots('all')}>
                      Slots: {filterSlots} <X size={12} />
                    </span>
                  )}
                </div>
              )}

              {loading && <div className="catalog-state">Loading templates...</div>}
              {error && <div className="catalog-state error">Error: {error}</div>}

              {!loading && !error && templates.length === 0 && (
                <div className="catalog-state catalog-empty-state">
                  <ImageIcon size={30} />
                  <span>No templates yet. Create your first layout in the editor.</span>
                  <Button variant="primary" onClick={handleEditorClick}>Open Editor</Button>
                </div>
              )}

              {!loading && !error && templates.length > 0 && filteredTemplates.length === 0 && (
                <div className="catalog-state">No templates match your search filters.</div>
              )}

              {!loading && !error && filteredTemplates.length > 0 && (
                <motion.div
                  className="catalog-grid"
                  initial="hidden"
                  animate="show"
                  variants={{ show: { transition: { staggerChildren: 0.04 } } }}
                >
                  {paginatedTemplates.map((template) => {
                    const lastKnownName = localStorage.getItem('lastKnownName') || 'Guest';
                    const creatorName = template.creator_name || template.profiles?.display_name || user?.name || lastKnownName;
                    return (
                      <motion.article
                        key={template.id}
                        className="catalog-card"
                        onClick={() => setSelectedTemplate(template)}
                        style={{ cursor: 'pointer' }}
                        variants={{
                          hidden: { opacity: 0, y: 14 },
                          show: { opacity: 1, y: 0 }
                        }}
                      >
                        <div className="catalog-preview">
                          <div className="catalog-preview-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              background: getRandomColor(creatorName),
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '8px',
                              fontWeight: 800
                            }}>
                              {getInitials(creatorName)}
                            </div>
                            <span>{creatorName}</span>
                          </div>
                          <TemplateThumbnail template={template} />
                        </div>
                        <div className="catalog-card-body">
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                              <h3 style={{ margin: 0 }}>{template.name}</h3>
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                <span className="catalog-badge" style={{ fontSize: '10px', padding: '2px 6px', background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: '4px', fontWeight: 700 }}>
                                  {template.details.format}
                                </span>
                                <span className="catalog-badge" style={{ fontSize: '10px', padding: '2px 6px', background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '4px', fontWeight: 700 }}>
                                  {template.details.slotsCount} slots
                                </span>
                              </div>
                            </div>
                            <p style={{ marginTop: '8px' }}>Created {formatTemplateDate(template.created_at)}</p>
                          </div>
                          <div className="catalog-card-actions">
                          {(isAuthenticated && (user?.role === 'super_admin' || user?.id === template.owner_id)) && (
                            <Button onClick={(e) => { e.stopPropagation(); loadTemplateToEditor(template); }}>Edit</Button>
                          )}
                          <Button variant="primary" onClick={(e) => { e.stopPropagation(); startBoothSession(template); }}>Start</Button>
                          {(isAuthenticated && (user?.role === 'super_admin' || user?.id === template.owner_id)) && (
                              <Button
                                className="catalog-delete-button"
                                title="Delete template"
                                aria-label={`Delete ${template.name}`}
                                onClick={(event) => { event.stopPropagation(); deleteTemplate(template.id, event); }}
                              >
                                <Trash2 size={15} />
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                  {Array.from({ length: Math.max(0, itemsPerPage - paginatedTemplates.length) }).map((_, index) => (
                    <motion.article
                      key={`placeholder-${index}`}
                      className="catalog-card"
                      style={{ opacity: 0.2, borderStyle: 'dashed', borderColor: 'var(--border)', background: 'transparent', boxShadow: 'none' }}
                      variants={{
                        hidden: { opacity: 0, y: 14 },
                        show: { opacity: 0.2, y: 0 }
                      }}
                    >
                      <div className="catalog-preview" style={{ background: 'transparent', borderBottomStyle: 'dashed', boxShadow: 'none' }}>
                        <div className="catalog-preview-empty" style={{ border: 'none' }}>
                          Empty Slot
                        </div>
                      </div>
                      <div className="catalog-card-body" style={{ alignItems: 'center', justifyContent: 'center' }}>
                        <p style={{ color: 'var(--text-h)', fontWeight: 600 }}>Available space</p>
                      </div>
                    </motion.article>
                  ))}
                </motion.div>
              )}
            </div>
          </section>
        </div>
      </main>

      <TemplateDrawer
        template={selectedTemplate}
        user={user}
        isAuthenticated={isAuthenticated}
        onClose={() => setSelectedTemplate(null)}
        onStart={() => {
          startBoothSession(selectedTemplate);
          setSelectedTemplate(null);
        }}
        onEdit={() => {
          loadTemplateToEditor(selectedTemplate);
          setSelectedTemplate(null);
        }}
      />

      {showAboutModal && (
        <div
          onClick={() => setShowAboutModal(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(3px)'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '800px',
              maxWidth: '90vw',
            }}
          >
            <img
              src={aboutImage}
              alt="About iBooth"
              style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }}
            />

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                top: '22%',
                left: '43%',
                width: '44%',
                minHeight: '38%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '0.8rem',
                padding: '1.2rem 1.4rem',
                color: '#f7f7f7',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <motion.div
                  whileHover={{ x: 3 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                  style={{ fontSize: 'clamp(1.2rem, 2.2vw, 1.8rem)', fontWeight: 800, letterSpacing: '0.02em' }}
                >
                  About iBooth
                </motion.div>
                <motion.div
                  whileHover={{ y: -2, scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                >
                  <Button
                    type="button"
                    onClick={() => setShowAboutModal(false)}
                    aria-label="Close about dialog"
                    style={{
                      minWidth: '38px',
                      width: '38px',
                      height: '38px',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginRight: '-8px',
                      transition: 'filter 0.2s ease',
                    }}
                  >
                    <X size={20} />
                  </Button>
                </motion.div>
              </div>
              <div style={{ fontSize: 'clamp(0.78rem, 1.3vw, 0.96rem)', lineHeight: 1.6, color: 'rgba(255,255,255,0.88)' }}>
                iBooth is a completely free photobooth app built for creating,
                capturing, and printing photo strip experiences.
              </div>
              <div style={{ fontSize: 'clamp(0.72rem, 1.15vw, 0.88rem)', lineHeight: 1.55, color: 'rgba(255,255,255,0.68)' }}>
                This app may still feel buggy or slow in some places.
              </div>
              <div
                style={{
                  fontSize: 'clamp(0.72rem, 1.15vw, 0.88rem)',
                  lineHeight: 1.55,
                  color: 'rgba(255,255,255,0.68)',
                }}
              >
                Part of{' '}
                <motion.a
                  href="https://arwndoprtma.space"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ x: 3 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                  style={{
                    display: 'inline-block',
                    color: 'rgba(174, 214, 255, 0.92)',
                    textDecoration: 'underline',
                  }}
                >
                  arwndoprtma.space
                </motion.a>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
