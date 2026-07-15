import { create } from 'zustand';
import { DEFAULT_PRESET_ID, OUTPUT, SESSION_KEY, STORAGE_KEY, THEME_KEY, applyTheme, getCanvasPreset, getInitialTheme } from "./constants.js";
import { supabase } from '../utils/supabase.js';
import { useAuthStore } from '../store/authStore.js';
import notifSound from '../assets/notif.mp3';

// Utility to generate a unique ID
export function uid() {
  return Math.random().toString(36).substring(2, 9);
}

export function createDefaultTemplate() {
  return {
    id: "default-template",
    name: "Untitled",
    presetId: DEFAULT_PRESET_ID,
    dpi: 300,
    width: OUTPUT.width,
    height: OUTPUT.height,
    bleed: 2,
    frameImage: "",
    slots: [
      { id: uid(), name: "Slot 1", x: 62, y: 80, width: 478, height: 392, rotation: 0, radius: 18, fit: "cover", mirror: true },
      { id: uid(), name: "Slot 2", x: 62, y: 510, width: 478, height: 392, rotation: 0, radius: 18, fit: "cover", mirror: true },
      { id: uid(), name: "Slot 3", x: 62, y: 940, width: 478, height: 392, rotation: 0, radius: 18, fit: "cover", mirror: true },
      { id: uid(), name: "Slot 4", x: 62, y: 1370, width: 478, height: 300, rotation: 0, radius: 18, fit: "cover", mirror: true }
    ]
  };
}

export function normalizeTemplate(template) {
  const preset = getCanvasPreset(template.presetId);
  const slots = Array.isArray(template.slots) ? template.slots : [];
  return {
    ...template,
    presetId: template.presetId || preset.id,
    dpi: Number(template.dpi) || preset.dpi || 300,
    width: Number(template.width) || preset.width,
    height: Number(template.height) || preset.height,
    bleed: template.bleed !== undefined ? Number(template.bleed) : 2,
    frameImage: template.frameImage || template.frame_image_url || "",
    
    description: template.description || "",
    tags: template.tags || [],
    theme: template.theme || "General",
    colorStyle: template.color_style || "Light",
    photoCount: template.photoCount || slots.length || 3,

    slots: slots.map((slot, index) => ({
      id: slot.id || uid(),
      name: slot.name || `Slot ${index + 1}`,
      x: Number(slot.x) || 0,
      y: Number(slot.y) || 0,
      width: Number(slot.width) || 200,
      height: Number(slot.height) || 200,
      rotation: Number(slot.rotation) || 0,
      radius: Number(slot.radius) || 0,
      fit: slot.fit || "cover",
      mirror: Boolean(slot.mirror)
    }))
  };
}

function loadTemplate() {
  const fallback = createDefaultTemplate();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved?.slots?.length ? normalizeTemplate(saved) : fallback;
  } catch {
    return fallback;
  }
}

let toastTimeoutId = null;

export const useStore = create((set, get) => {
  const initialTemplate = loadTemplate();
  const initialTheme = getInitialTheme();
  applyTheme(initialTheme);

  return {
    template: initialTemplate,
    pastTemplates: [],
    futureTemplates: [],
    selectedSlotId: initialTemplate.slots[0]?.id || null,
    zoom: 0.42,
    pan: { x: 0, y: 0 },
    cameraStream: null,
    booth: null,
    previewZoom: 0.44,
    theme: initialTheme,
    toast: { message: '', type: 'info', visible: false, id: null },

    setTemplate: (template) => set({ template }),
    setSelectedSlotId: (id) => set({ selectedSlotId: id }),
    setZoom: (zoom) => set({ zoom }),
    setPan: (pan) => set({ pan }),
    setCameraStream: (stream) => set({ cameraStream: stream }),
    setBooth: (booth) => set({ booth }),
    setPreviewZoom: (previewZoom) => set({ previewZoom }),
    setTheme: (theme) => {
      const nextTheme = theme === 'dark' ? 'dark' : 'light';
      set({ theme: nextTheme });
      try {
        localStorage.setItem(THEME_KEY, nextTheme);
      } catch {
        // Ignore storage failures.
      }
      applyTheme(nextTheme);
    },
    toggleTheme: () => {
      const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
      get().setTheme(nextTheme);
    },

    showToast: (message, type = 'info') => {
      set({ toast: { message, type, visible: true, id: Date.now() } });
      try {
        const audio = new Audio(notifSound);
        audio.play().catch(() => {});
      } catch (err) {
        console.error('Failed to play toast notification sound', err);
      }
      
      if (toastTimeoutId) {
        clearTimeout(toastTimeoutId);
      }
      
      toastTimeoutId = setTimeout(() => {
        set((state) => ({ ...state, toast: { ...state.toast, visible: false } }));
        toastTimeoutId = null;
      }, 5000);
    },

    resetTemplate: () => {
      localStorage.removeItem(STORAGE_KEY);
      const template = createDefaultTemplate();
      set({ template, selectedSlotId: template.slots[0]?.id || null });
    },

    saveTemplateQuietly: () => {
      const current = get().template;
      const toSave = { ...current, isLocallySaved: true };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    },

    commitTemplate: () => {
      set((state) => {
        const past = [...state.pastTemplates, structuredClone(state.template)];
        if (past.length > 50) past.shift();
        return {
          pastTemplates: past,
          futureTemplates: []
        };
      });
    },

    undo: () => {
      set((state) => {
        if (state.pastTemplates.length === 0) return state;
        const previous = state.pastTemplates[state.pastTemplates.length - 1];
        const newPast = state.pastTemplates.slice(0, -1);
        return {
          template: previous,
          pastTemplates: newPast,
          futureTemplates: [structuredClone(state.template), ...state.futureTemplates]
        };
      });
      get().saveTemplateQuietly();
    },

    redo: () => {
      set((state) => {
        if (state.futureTemplates.length === 0) return state;
        const next = state.futureTemplates[0];
        const newFuture = state.futureTemplates.slice(1);
        return {
          template: next,
          pastTemplates: [...state.pastTemplates, structuredClone(state.template)],
          futureTemplates: newFuture
        };
      });
      get().saveTemplateQuietly();
    },

    getSelectedSlot: () => {
      const { template, selectedSlotId } = get();
      return template.slots.find((slot) => slot.id === selectedSlotId) || null;
    },

    createBoothSession: () => {
      const { booth, template } = get();
      if (!booth) {
        const newBooth = {
          id: uid(),
          currentIndex: 0,
          captures: template.slots.map(() => null),
          countdownTimer: null,
          countdownCancel: null
        };
        set({ booth: newBooth });
        return newBooth;
      }
      return booth;
    },

    stopCameraStream: () => {
      const { cameraStream } = get();
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        set({ cameraStream: null });
      }
    },

    fetchTemplates: async (userId) => {
      try {
        const templates = JSON.parse(localStorage.getItem('templates') || '[]');
        
        // Fetch missing creator names for old templates that only have owner_id
        const uniqueOwnerIds = [...new Set(templates.filter(t => !t.creator_name && t.owner_id && t.owner_id !== 'local-user').map(t => t.owner_id))];
        
        if (uniqueOwnerIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name')
            .in('id', uniqueOwnerIds);

          if (profiles) {
            const profileMap = Object.fromEntries(profiles.map(p => [p.id, p.display_name]));
            let updated = false;
            
            // Clean up 'You'
            templates.forEach(t => {
              if (t.creator_name === 'You') {
                t.creator_name = 'Local User';
                updated = true;
              }
            });

            // Backfill from Supabase
            templates.forEach(t => {
              if (!t.creator_name && profileMap[t.owner_id]) {
                t.creator_name = profileMap[t.owner_id];
                updated = true;
              }
            });

            // Attach current user's name to their own templates permanently
            const currentUser = useAuthStore.getState().user;
            if (currentUser) {
              templates.forEach(t => {
                if (!t.creator_name && (t.owner_id === currentUser.id || t.owner_id === 'local-user')) {
                  t.creator_name = currentUser.name;
                  updated = true;
                }
              });
            }
            
            // Persist the names so we don't have to fetch them again
            if (updated) {
              localStorage.setItem('templates', JSON.stringify(templates));
            }
          }
        }

        return { success: true, data: templates.map(normalizeTemplate) };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },

    saveTemplate: async (template, userId, frameFile = null) => {
      try {
        let publicUrl = template.frameImage || null;

        if (frameFile) {
          // Since we have no backend, convert frameFile to base64
          publicUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(frameFile);
          });
        }

        const currentUser = useAuthStore.getState().user;
        const lastKnownName = localStorage.getItem('lastKnownName') || 'Guest';
        const creatorName = template.creator_name === 'You' ? 'Local User' : (template.creator_name || template.profiles?.display_name || currentUser?.name || lastKnownName);

        const toSave = {
          id: template.id === 'default-template' ? uid() : template.id,
          owner_id: userId || 'local-user',
          creator_name: creatorName,
          name: template.name,
          preset_id: template.presetId,
          dpi: template.dpi,
          width: template.width,
          height: template.height,
          slots: template.slots,
          frame_image_url: publicUrl,
          description: template.description,
          tags: template.tags,
          theme: template.theme,
          color_style: template.colorStyle,
          created_at: template.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const templates = JSON.parse(localStorage.getItem('templates') || '[]');
        const index = templates.findIndex(t => t.id === toSave.id);
        
        if (index > -1) {
          templates[index] = toSave;
        } else {
          templates.unshift(toSave);
        }
        
        localStorage.setItem('templates', JSON.stringify(templates));

        const savedTemplate = normalizeTemplate(toSave);
        get().setTemplate(savedTemplate);
        get().saveTemplateQuietly();
        
        return { success: true, data: savedTemplate };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },

    deleteTemplate: async (templateId, userId) => {
      if (!templateId || templateId === 'default-template') return { success: false, error: 'Invalid template ID' };
      try {
        const templates = JSON.parse(localStorage.getItem('templates') || '[]');
        const newTemplates = templates.filter(t => t.id !== templateId);
        localStorage.setItem('templates', JSON.stringify(newTemplates));
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  };
});

export function loadFinalSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || {};
  } catch {
    return {};
  }
}

export function storeFinalSession(payload) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
}
