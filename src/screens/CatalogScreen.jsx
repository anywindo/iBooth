import React, { useEffect, useMemo, useState } from 'react';
import { Image as ImageIcon, Search, Trash2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore, normalizeTemplate } from '../core/useStore.js';
import { AppShell } from '../components/AppShell.jsx';
import { Button } from '../components/Button.jsx';
import { useAuthStore } from '../store/authStore';
import packageJson from '../../package.json';
import aboutImage from '../assets/about.png';

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

function formatTemplateDate(value) {
  if (!value) return 'No date saved';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No date saved';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CatalogScreen({ navigate }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  const { user, isAuthenticated } = useAuthStore();

  const setTemplate = useStore((store) => store.setTemplate);
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
    navigate('/editor');
  };

  const menu = (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button className="menu-dropdown-button" onClick={handleEditorClick}>Editor</button>
      <button className="menu-dropdown-button" onClick={() => navigate('/catalog')}>Catalog</button>
      <div className="menu-dropdown" onMouseLeave={() => setHelpMenuOpen(false)}>
        <button className="menu-dropdown-button" onPointerDown={() => setHelpMenuOpen(!helpMenuOpen)}>Help</button>
        {helpMenuOpen && (
          <div className="menu-dropdown-content" onClick={() => setHelpMenuOpen(false)}>
            <button className="menu-dropdown-item" onClick={() => setShowAboutModal(true)}>
              About iBooth
            </button>
          </div>
        )}
      </div>
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

  const filteredTemplates = useMemo(() => {
    return templates
      .filter((template) => (template.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        if (sortOrder === 'newest') return new Date(b.created_at) - new Date(a.created_at);
        if (sortOrder === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
        if (sortOrder === 'a-z') return (a.name || '').localeCompare(b.name || '');
        if (sortOrder === 'z-a') return (b.name || '').localeCompare(a.name || '');
        return 0;
      });
  }, [templates, searchQuery, sortOrder]);

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
        <aside className="panel">
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
            <label>
              Sort By
              <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="a-z">A - Z</option>
                <option value="z-a">Z - A</option>
              </select>
            </label>
            {(searchQuery || sortOrder !== 'newest') && (
              <Button onClick={resetFilters}>Reset Filters</Button>
            )}
          </CollapsibleSection>
        </aside>

        <section className="workspace catalog-workspace" style={{ padding: '40px', overflowY: 'auto', position: 'relative' }}>
          <div className="catalog-grid-bg" aria-hidden="true" />
          <div className="catalog-content" style={{ position: 'relative', zIndex: 1 }}>
            <div className="catalog-hero">
              <div>
                {/* <span className="catalog-kicker">Cloud Library</span> */}
                <h2>Pick a strip, edit or launch the booth.</h2>
                {/* <p>Browse saved templates with clearer previews, quick controls, and a compact workflow for editing or starting a session.</p> */}
              </div>
              {/* <div className="catalog-summary">
                <strong>{templates.length}</strong>
                <span>Templates</span>
                <small>{filteredTemplates.length} currently shown</small>
              </div> */}
            </div>

            {loading && <div className="catalog-state">Loading templates...</div>}
            {error && <div className="catalog-state error">Error: {error}</div>}

            {!loading && !error && templates.length === 0 && (
              <div className="catalog-state catalog-empty-state">
                <ImageIcon size={30} />
                <span>No templates yet. Create your first layout in the editor.</span>
                <Button variant="primary" onClick={() => navigate('/editor')}>Open Editor</Button>
              </div>
            )}

            {!loading && !error && templates.length > 0 && filteredTemplates.length === 0 && (
              <div className="catalog-state">No templates match your search.</div>
            )}

            {!loading && !error && filteredTemplates.length > 0 && (
              <motion.div
                className="catalog-grid"
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.04 } } }}
              >
                {filteredTemplates.map((template) => (
                  <motion.article
                    key={template.id}
                    className="catalog-card"
                    variants={{
                      hidden: { opacity: 0, y: 14 },
                      show: { opacity: 1, y: 0 }
                    }}
                  >
                    <div className="catalog-preview">
                      <div className="catalog-preview-label">{template.profiles?.display_name || user?.name || 'Unknown Creator'}</div>
                      {template.frame_image_url ? (
                        <img src={template.frame_image_url} alt={template.name} />
                      ) : (
                        <div className="catalog-preview-empty">
                          <ImageIcon size={24} />
                          No Preview
                        </div>
                      )}
                    </div>
                    <div className="catalog-card-body">
                      <div>
                        <h3>{template.name}</h3>
                        <p>Saved {formatTemplateDate(template.created_at)}</p>
                      </div>
                      <div className="catalog-card-actions">
                        {(isAuthenticated && (user?.role === 'super_admin' || user?.id === template.owner_id)) && (
                          <Button onClick={() => loadTemplateToEditor(template)}>Edit</Button>
                        )}
                        <Button variant="primary" onClick={() => startBoothSession(template)}>Start</Button>
                        {(isAuthenticated && (user?.role === 'super_admin' || user?.id === template.owner_id)) && (
                          <Button
                            className="catalog-delete-button"
                            title="Delete template"
                            aria-label={`Delete ${template.name}`}
                            onClick={(event) => deleteTemplate(template.id, event)}
                          >
                            <Trash2 size={15} />
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.article>
                ))}
              </motion.div>
            )}
          </div>
        </section>
      </main>

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
