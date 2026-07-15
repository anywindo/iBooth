import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { AppShell } from '../components/AppShell';
import { useAuthStore } from '../store/authStore';
import { useStore, normalizeTemplate } from '../core/useStore';
import { User, Settings, Image as ImageIcon, Shield, Key, Search, X, ChevronLeft, ChevronRight, Filter, Edit2, Trash2, Plus, Layout, Camera, BarChart2 } from 'lucide-react';
import aboutImage from '../assets/about.png';
import { TemplateThumbnail, getInitials, getRandomColor } from './CatalogScreen';
import { TemplateDrawer } from '../components/TemplateDrawer';
import { Button } from '../components/Button';
import Dialog from '../components/Dialog';

function CollapsibleSection({ title, note, noteClassName = "section-note", headingClassName = "section-heading", children, defaultCollapsed = false }) {
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
        {note && <span className={noteClassName}>{note}</span>}
      </div>
      <div style={{ display: collapsed ? 'none' : 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
        {children}
      </div>
    </section>
  );
}

export default function ProfileScreen({ navigate }) {
  const location = useLocation();
  const { user, updateProfile, updatePassword } = useAuthStore();
  const [helpMenuOpen, setHelpMenuOpen] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const menu = (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button className="menu-dropdown-button" onClick={() => navigate('/editor', { state: { returnTo: '/profile' } })}>Editor</button>
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

  const defaultTab = new URLSearchParams(location.search).get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  // Profile state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileStatus, setProfileStatus] = useState(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // User Strips state
  const [userStrips, setUserStrips] = useState([]);
  const [isLoadingStrips, setIsLoadingStrips] = useState(true);

  // Table filters & pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFormat, setFilterFormat] = useState('all');
  const [filterSlots, setFilterSlots] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedStrip, setSelectedStrip] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState(null);
  const [stripToDelete, setStripToDelete] = useState(null);

  const fetchTemplatesMethod = useStore((store) => store.fetchTemplates);
  const deleteTemplateMethod = useStore((store) => store.deleteTemplate);
  const setTemplate = useStore((store) => store.setTemplate);
  const setSelectedSlotId = useStore((store) => store.setSelectedSlotId);
  const showToast = useStore((store) => store.showToast);

  const loadTemplateToEditor = (template) => {
    if (!template) return;
    const normalized = normalizeTemplate(template);
    setTemplate(normalized);
    setSelectedSlotId(normalized.slots?.[0]?.id || null);
    navigate('/editor', { state: { returnTo: '/profile?tab=strips', isExplicitEdit: true } });
  };

  const startBoothSession = (template) => {
    if (!template) return;
    const normalized = normalizeTemplate(template);
    setTemplate(normalized);
    setSelectedSlotId(normalized.slots?.[0]?.id || null);
    navigate(`/booth/${normalized.id}`, { state: { returnTo: '/profile?tab=strips' } });
  };

  const handleDeleteTemplate = (templateId, event) => {
    event.stopPropagation();
    setStripToDelete(templateId);
  };

  const confirmDeleteStrip = async () => {
    if (!stripToDelete) return;
    const res = await deleteTemplateMethod(stripToDelete, user?.id);
    if (res.success) {
      setDeleteStatus('Strip deleted successfully.');
      setTimeout(() => setDeleteStatus(null), 3000);
      // re-fetch strips
      const response = await fetchTemplatesMethod(user?.id);
      if (response.success) setUserStrips(response.data);
      if (selectedStrip && selectedStrip.id === stripToDelete) {
         setSelectedStrip(null);
      }
    } else {
      showToast(res.error || 'Failed to delete template', 'error');
    }
    setStripToDelete(null);
  };

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');

      // Fetch user's strips
      const fetchStrips = async () => {
        setIsLoadingStrips(true);
        try {
          const response = await fetchTemplatesMethod(user.id);
          if (response.success) {
            setUserStrips(response.data);
          }
        } catch (error) {
          console.error("Failed to fetch strips", error);
        } finally {
          setIsLoadingStrips(false);
        }
      };

      fetchStrips();
    }
  }, [user, fetchTemplatesMethod]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileStatus(null);

    const result = await updateProfile({ name, email });

    setIsUpdatingProfile(false);
    if (result.success) {
      setProfileStatus({ type: 'success', message: 'Profile updated successfully.' });
      setTimeout(() => setProfileStatus(null), 3000);
    } else {
      setProfileStatus({ type: 'error', message: result.error });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordStatus(null);

    const result = await updatePassword({
      current_password: currentPassword,
      password: newPassword,
      password_confirmation: confirmPassword
    });

    setIsUpdatingPassword(false);
    if (result.success) {
      setPasswordStatus({ type: 'success', message: 'Password updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordStatus(null), 3000);
    } else {
      setPasswordStatus({ type: 'error', message: result.error });
    }
  };

  const processedStripsForStats = useMemo(() => {
    return userStrips.map((strip) => {
      const norm = normalizeTemplate(strip);
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
        ...strip,
        processedFormat: format,
        processedSlotsCount: norm?.slots?.length || 0,
      };
    });
  }, [userStrips]);

  const totalStrips = processedStripsForStats.length;
  const totalPhotos = processedStripsForStats.reduce((sum, strip) => sum + strip.processedSlotsCount, 0);

  const popularFormat = useMemo(() => {
    if (processedStripsForStats.length === 0) return 'N/A';
    const counts = processedStripsForStats.reduce((acc, strip) => {
      acc[strip.processedFormat] = (acc[strip.processedFormat] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }, [processedStripsForStats]);

  const chartData = useMemo(() => {
    const sortedStrips = [...processedStripsForStats].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const grouped = sortedStrips.reduce((acc, strip) => {
      if (!strip.created_at) return acc;
      const date = new Date(strip.created_at);
      const dayStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const lastItem = acc[acc.length - 1];
      if (lastItem && lastItem.name === dayStr) {
        lastItem.Strips += 1;
      } else {
        acc.push({ name: dayStr, Strips: 1 });
      }
      return acc;
    }, []);
    return grouped;
  }, [processedStripsForStats]);

  const recentStrips = useMemo(() => {
    return [...processedStripsForStats]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 5);
  }, [processedStripsForStats]);

  const renderContent = () => {
    if (activeTab === 'profile') {
      return (
        <motion.div
          key="profile"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="profile-page"
        >
          {/* Hero Section */}
          <div style={{
            marginBottom: '48px',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            height: '220px',
            backgroundImage: 'url(/mainsite_bg.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '32px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 6px', color: 'white', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                {user?.name || 'My Account'}
              </h1>
              <p style={{ margin: 0, fontSize: '16px', color: 'rgba(255,255,255,0.85)', fontWeight: '500', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                {user?.email || 'No email provided'}
              </p>
            </div>
          </div>

          {/* Dashboard Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="profile-settings-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)' }}>
                <Layout size={18} />
                <span style={{ fontSize: '14px', fontWeight: '600', textTransform: 'uppercase' }}>Total Strips</span>
              </div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--ink)' }}>{totalStrips}</div>
            </div>
            <div className="profile-settings-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)' }}>
                <Camera size={18} />
                <span style={{ fontSize: '14px', fontWeight: '600', textTransform: 'uppercase' }}>Photos Taken</span>
              </div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--ink)' }}>{totalPhotos}</div>
            </div>
            <div className="profile-settings-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)' }}>
                <ImageIcon size={18} />
                <span style={{ fontSize: '14px', fontWeight: '600', textTransform: 'uppercase' }}>Favorite Format</span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--ink)', lineHeight: '1.2' }}>{popularFormat}</div>
            </div>
          </div>

          <div className="profile-settings-card" style={{ marginBottom: '48px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--ink)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={18} style={{ color: 'var(--accent)' }} /> Timeline
            </h3>
            {chartData.length > 0 ? (
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorStrips" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted)' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted)' }} />
                    <Tooltip 
                      contentStyle={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      itemStyle={{ color: 'var(--ink)', fontWeight: 600 }}
                      labelStyle={{ color: 'var(--muted)', marginBottom: '4px' }}
                    />
                    <Area type="monotone" dataKey="Strips" stroke="var(--accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorStrips)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
                No activity data to display yet.
              </div>
            )}
          </div>

          <div className="profile-settings-card" style={{ marginBottom: '48px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--ink)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={18} style={{ color: 'var(--accent)' }} /> Top 5 Recent Strips
              </span>
              <Button variant="ghost" onClick={() => setActiveTab('strips')} style={{ fontSize: '12px', padding: '4px 8px' }}>View All</Button>
            </h3>
            
            {recentStrips.length > 0 ? (
              <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '12px' }}>
                {recentStrips.map(strip => (
                  <div 
                    key={strip.id} 
                    onClick={() => setSelectedStrip(strip)}
                    style={{ 
                      minWidth: '160px', 
                      background: 'var(--bg)', 
                      borderRadius: '8px', 
                      border: '1px solid var(--line)', 
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      flex: '0 0 auto'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ width: '100%', height: '180px', background: 'var(--panel)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TemplateThumbnail template={strip} />
                    </div>
                    <div style={{ padding: '10px 12px', background: 'var(--bg)', borderTop: '1px solid var(--line)' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{strip.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>{new Date(strip.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--line)' }}>
                No strips created yet.
              </div>
            )}
          </div>
        </motion.div>
      );
    }

    if (activeTab === 'strips') {
      const processedStrips = userStrips.map((strip) => {
        const norm = normalizeTemplate(strip);
        let format = 'Grid';
        if (norm?.type) {
          format = norm.type.charAt(0).toUpperCase() + norm.type.slice(1);
        } else if (norm?.width && norm?.height) {
          const ratio = norm.width / norm.height;
          if (ratio < 0.5) format = 'Strip';
          else if (ratio > 1.2) format = 'Landscape';
          else format = 'Grid';
        }
        const slotsCount = norm?.slots?.length || 0;
        return { ...strip, processedFormat: format, processedSlotsCount: slotsCount };
      });

      const filteredStrips = processedStrips.filter(strip => {
        const matchesSearch = strip.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFormat = filterFormat === 'all' || strip.processedFormat.toLowerCase() === filterFormat.toLowerCase();

        let matchesSlots = true;
        if (filterSlots !== 'all') {
          const count = strip.processedSlotsCount;
          if (filterSlots === '1-2') matchesSlots = count >= 1 && count <= 2;
          else if (filterSlots === '3') matchesSlots = count === 3;
          else if (filterSlots === '4') matchesSlots = count === 4;
          else if (filterSlots === '5+') matchesSlots = count >= 5;
        }
        return matchesSearch && matchesFormat && matchesSlots;
      });

      const totalPages = Math.max(1, Math.ceil(filteredStrips.length / itemsPerPage));
      // Ensure currentPage is within valid range after filtering
      const validCurrentPage = Math.min(currentPage, totalPages);
      if (validCurrentPage !== currentPage && validCurrentPage > 0) {
        setCurrentPage(validCurrentPage);
      }

      const paginatedStrips = filteredStrips.slice((validCurrentPage - 1) * itemsPerPage, validCurrentPage * itemsPerPage);

      return (
        <motion.div
          key="strips"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="profile-page"
        >
          {/* Your Strips Area */}
          <div style={{ padding: '0 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: 'var(--ink)' }}>
                  My Strips
                </h2>
                <span style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: '600' }}>
                  {userStrips.length} {userStrips.length === 1 ? 'Strip' : 'Strips'}
                </span>
              </div>
              <Button variant="primary" onClick={() => navigate('/editor', { state: { returnTo: '/profile' } })} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={16} /> Create New Strip
              </Button>
            </div>

            {deleteStatus && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#10b981', color: '#fff', padding: '12px 24px', borderRadius: '8px', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontWeight: 600 }}
              >
                {deleteStatus}
              </motion.div>
            )}

            {isLoadingStrips ? (
              <div className="profile-empty-card" style={{ padding: '32px' }}>Loading your strips...</div>
            ) : userStrips.length > 0 ? (
              <div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 12px', flex: '1', minWidth: '200px', maxWidth: '300px', gap: '8px', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1), 0 1px 0 rgba(255,255,255,0.5)' }}>
                    <Search size={14} style={{ color: 'var(--muted)', filter: 'drop-shadow(0 1px 0 rgba(255,255,255,0.8))' }} />
                    <input
                      type="text"
                      placeholder="Search strips..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--ink)', fontSize: '13px', width: '100%', textShadow: '0 1px 0 rgba(255,255,255,0.8)' }}
                    />
                    {searchQuery && <X size={14} style={{ cursor: 'pointer', color: 'var(--muted)' }} onClick={() => { setSearchQuery(''); setCurrentPage(1); }} />}
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Filter size={14} style={{ color: 'var(--muted)' }} />
                      <select
                        value={filterFormat}
                        onChange={(e) => { setFilterFormat(e.target.value); setCurrentPage(1); }}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'linear-gradient(180deg, var(--bg) 0%, var(--border) 100%)', boxShadow: '0 1px 2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.4)', color: 'var(--ink)', fontSize: '12px', fontWeight: 600, outline: 'none', cursor: 'pointer', textShadow: '0 1px 0 rgba(255,255,255,0.8)' }}
                      >
                        <option value="all">All Formats</option>
                        <option value="strip">Strip</option>
                        <option value="landscape">Landscape</option>
                        <option value="grid">Grid</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <select
                        value={filterSlots}
                        onChange={(e) => { setFilterSlots(e.target.value); setCurrentPage(1); }}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'linear-gradient(180deg, var(--bg) 0%, var(--border) 100%)', boxShadow: '0 1px 2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.4)', color: 'var(--ink)', fontSize: '12px', fontWeight: 600, outline: 'none', cursor: 'pointer', textShadow: '0 1px 0 rgba(255,255,255,0.8)' }}
                      >
                        <option value="all">All Slots</option>
                        <option value="1-2">1-2 Slots</option>
                        <option value="3">3 Slots</option>
                        <option value="4">4 Slots</option>
                        <option value="5+">5+ Slots</option>
                      </select>
                    </div>
                  </div>
                </div>

                {filteredStrips.length === 0 ? (
                  <div className="profile-empty-card" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--muted)', background: 'var(--panel)', borderRadius: '8px', border: '1px solid var(--line)' }}>
                    No strips match your search or filters.
                  </div>
                ) : (
                  <>
                    <div style={{ overflowX: 'auto', background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '8px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--line)', background: 'var(--bg)' }}>
                            <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--muted)', fontSize: '12px', textTransform: 'uppercase', width: '80px' }}>Preview</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--muted)', fontSize: '12px', textTransform: 'uppercase' }}>Name</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--muted)', fontSize: '12px', textTransform: 'uppercase' }}>Format</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--muted)', fontSize: '12px', textTransform: 'uppercase' }}>Slots</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--muted)', fontSize: '12px', textTransform: 'uppercase' }}>Created</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--muted)', fontSize: '12px', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedStrips.map((strip) => {
                            return (
                              <tr
                                key={strip.id}
                                onClick={() => setSelectedStrip(strip)}
                                style={{ cursor: 'pointer', borderBottom: '1px solid var(--line)', transition: 'background 0.15s ease' }}
                                onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg)'}
                                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                <td style={{ padding: '12px 16px' }}>
                                  <div style={{ width: '60px', height: '80px', background: 'var(--bg)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--line)' }}>
                                    <TemplateThumbnail template={strip} />
                                  </div>
                                </td>
                                <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--ink)' }}>{strip.name}</td>
                                <td style={{ padding: '12px 16px' }}>
                                  {strip.processedFormat && (
                                    <span className="catalog-badge" style={{ fontSize: '10px', padding: '2px 6px', background: 'var(--accent-bg)', color: 'var(--accent)', borderRadius: '4px', fontWeight: 700 }}>
                                      {strip.processedFormat}
                                    </span>
                                  )}
                                </td>
                                <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: '14px' }}>
                                  {strip.processedSlotsCount}
                                </td>
                                <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: '14px' }}>
                                  {new Date(strip.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                    <Button
                                      variant="ghost"
                                      onClick={(e) => { e.stopPropagation(); loadTemplateToEditor(strip); }}
                                      style={{ padding: '6px' }}
                                      title="Edit Strip"
                                    >
                                      <Edit2 size={16} />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      onClick={(e) => handleDeleteTemplate(strip.id, e)}
                                      style={{ padding: '6px', color: '#ef4444' }}
                                      title="Delete Strip"
                                    >
                                      <Trash2 size={16} />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Rows per page:</span>
                        <select
                          value={itemsPerPage}
                          onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'linear-gradient(180deg, var(--bg) 0%, var(--border) 100%)', boxShadow: '0 1px 2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.4)', color: 'var(--ink)', fontSize: '12px', fontWeight: 600, outline: 'none', cursor: 'pointer', textShadow: '0 1px 0 rgba(255,255,255,0.8)' }}
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                          Showing {(validCurrentPage - 1) * itemsPerPage + 1} to {Math.min(validCurrentPage * itemsPerPage, filteredStrips.length)} of {filteredStrips.length}
                        </span>

                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={validCurrentPage === 1}
                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: validCurrentPage === 1 ? 'var(--bg)' : 'linear-gradient(180deg, var(--bg) 0%, var(--border) 100%)', boxShadow: validCurrentPage === 1 ? 'none' : '0 1px 2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.4)', color: validCurrentPage === 1 ? 'var(--muted)' : 'var(--ink)', cursor: validCurrentPage === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', opacity: validCurrentPage === 1 ? 0.5 : 1 }}
                          >
                            <ChevronLeft size={16} style={{ filter: validCurrentPage === 1 ? 'none' : 'drop-shadow(0 1px 0 rgba(255,255,255,0.8))' }} />
                          </button>
                          <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={validCurrentPage === totalPages}
                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: validCurrentPage === totalPages ? 'var(--bg)' : 'linear-gradient(180deg, var(--bg) 0%, var(--border) 100%)', boxShadow: validCurrentPage === totalPages ? 'none' : '0 1px 2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.4)', color: validCurrentPage === totalPages ? 'var(--muted)' : 'var(--ink)', cursor: validCurrentPage === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', opacity: validCurrentPage === totalPages ? 0.5 : 1 }}
                          >
                            <ChevronRight size={16} style={{ filter: validCurrentPage === totalPages ? 'none' : 'drop-shadow(0 1px 0 rgba(255,255,255,0.8))' }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="profile-empty-state">
                <div className="profile-empty-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                  <ImageIcon size={48} opacity={0.3} style={{ color: 'var(--muted)' }} />
                  <div className="profile-empty-title">No strips yet</div>
                  <div className="profile-empty-copy">
                    Your saved photo strips will appear here. Start creating beautiful memories in the editor!
                  </div>
                  <button className="primary" style={{ marginTop: '24px' }} onClick={() => navigate('/editor', { state: { returnTo: '/profile' } })}>
                    Go to Editor
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      );
    }

    if (activeTab === 'settings') {
      return (
        <motion.div
          key="settings"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="profile-page profile-settings-page"
        >
          <div className="profile-settings-card">
            <h2 className="profile-section-title">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={20} style={{ color: 'var(--accent)' }} /> Profile Information
              </span>
            </h2>
            <p className="profile-settings-copy">
              Update your account's profile information and email address.
            </p>

            {profileStatus && (
              <div className={`profile-status-message ${profileStatus.type}`}>
                {profileStatus.message}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="profile-settings-form">
              <div className="profile-field">
                <label className="profile-field-label">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="profile-field-input"
                  required
                />
              </div>
              <div className="profile-field">
                <label className="profile-field-label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="profile-field-input"
                  required
                />
              </div>
              <div className="profile-form-actions">
                <button
                  type="submit"
                  className="primary"
                  disabled={isUpdatingProfile}
                >
                  {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          <div className="profile-settings-card">
            <h2 className="profile-section-title">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={20} style={{ color: 'var(--accent)' }} /> Update Password
              </span>
            </h2>
            <p className="profile-settings-copy">
              Ensure your account is using a long, random password to stay secure.
            </p>

            {passwordStatus && (
              <div className={`profile-status-message ${passwordStatus.type}`}>
                {passwordStatus.message}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="profile-settings-form">
              <div className="profile-field">
                <label className="profile-field-label">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="profile-field-input"
                  required
                />
              </div>
              <div className="profile-field">
                <label className="profile-field-label">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="profile-field-input"
                  required
                />
              </div>
              <div className="profile-field">
                <label className="profile-field-label">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="profile-field-input"
                  required
                />
              </div>
              <div className="profile-form-actions">
                <button
                  type="submit"
                  className="primary"
                  disabled={isUpdatingPassword}
                >
                  {isUpdatingPassword ? 'Saving...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      );
    }
  };

  return (
    <AppShell
      title="My Account"
      showBackButton={true}
      onBack={() => navigate('/')}
      menu={menu}
    >
      <main className="editor-layout" style={{ gridTemplateColumns: '300px 1fr' }}>
        <aside className="panel">
          <CollapsibleSection title="ACCOUNT" note="Manage profile" defaultCollapsed={false}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div
                onClick={() => setActiveTab('profile')}
                style={{
                  cursor: 'pointer',
                  opacity: activeTab === 'profile' ? 1 : 0.6,
                  transition: 'opacity 0.2s ease'
                }}
              >
                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={16} /> Profile
                </strong>
                <br />View your info.
              </div>
              <hr style={{ width: '100%', border: 'none', borderTop: '1px solid var(--line)', margin: '4px 0' }} />
              <div
                onClick={() => setActiveTab('strips')}
                style={{
                  cursor: 'pointer',
                  opacity: activeTab === 'strips' ? 1 : 0.6,
                  transition: 'opacity 0.2s ease'
                }}
              >
                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ImageIcon size={16} /> My Strips
                </strong>
                <br />View your creations.
              </div>
              <hr style={{ width: '100%', border: 'none', borderTop: '1px solid var(--line)', margin: '4px 0' }} />
              <div
                onClick={() => setActiveTab('settings')}
                style={{
                  cursor: 'pointer',
                  opacity: activeTab === 'settings' ? 1 : 0.6,
                  transition: 'opacity 0.2s ease'
                }}
              >
                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Settings size={16} /> Settings
                </strong>
                <br />Edit email and password.
              </div>
            </div>
          </CollapsibleSection>
        </aside>

        <section className="workspace catalog-workspace" style={{ padding: '2rem', overflowY: 'auto', flex: 1, position: 'relative' }}>
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </section>
      </main>

      <TemplateDrawer
        template={selectedStrip}
        user={user}
        isAuthenticated={!!user}
        onClose={() => setSelectedStrip(null)}
        onStart={() => {
          startBoothSession(selectedStrip);
          setSelectedStrip(null);
        }}
        onEdit={() => {
          loadTemplateToEditor(selectedStrip);
          setSelectedStrip(null);
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
          <img
            onClick={(e) => e.stopPropagation()}
            src={aboutImage}
            alt="About iBooth"
            style={{ width: '800px', maxWidth: '90vw', height: 'auto', display: 'block', objectFit: 'contain' }}
          />
        </div>
      )}

      <Dialog
        isOpen={Boolean(stripToDelete)}
        onClose={() => setStripToDelete(null)}
        title="Delete Strip?"
        size="sm"
        footer={
          <>
            <Button onClick={() => setStripToDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDeleteStrip}>Delete</Button>
          </>
        }
      >
        Are you sure you want to delete this strip? This action cannot be undone.
      </Dialog>
    </AppShell>
  );
}
