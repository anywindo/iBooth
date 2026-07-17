import { create } from 'zustand';
import { DEFAULT_PRESET_ID, OUTPUT, SESSION_KEY, STORAGE_KEY, THEME_KEY, PRINTER_SETTINGS_KEY, applyTheme, getCanvasPreset, getInitialTheme } from "./constants.js";
import { supabase } from '../utils/supabase.js';
import { useAuthStore } from '../store/authStore.js';
import { isElectron } from './platform.js';

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
  const presetId = template.presetId || template.preset_id;
  const preset = getCanvasPreset(presetId);
  const slots = Array.isArray(template.slots) ? template.slots : [];
  return {
    ...template,
    presetId: presetId || preset.id,
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

async function deleteFromCloudinary(url) {
  try {
    if (!url) return;
    
    // Extract public ID from Cloudinary URL
    const matches = url.match(/\/upload\/(?:v\d+\/)?([^\s?#]+)\.[a-zA-Z0-9]+(?:[?#]|$)/);
    const publicId = matches ? matches[1] : null;
    if (!publicId) return;

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
    const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.warn("Cloudinary credentials missing in .env, skipping Cloudinary deletion.");
      return;
    }

    const cryptoObj = window.crypto || globalThis.crypto;
    if (!cryptoObj || !cryptoObj.subtle) {
      console.error("Web Crypto API (crypto.subtle) is not available (requires secure context HTTPS or localhost). Cannot delete from Cloudinary.");
      return;
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    
    // Compute SHA-1 signature using Web Crypto API
    const utf8 = new TextEncoder().encode(stringToSign);
    const hashBuffer = await cryptoObj.subtle.digest('SHA-1', utf8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('timestamp', timestamp);
    formData.append('api_key', apiKey);
    formData.append('signature', signature);

    await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST',
      body: formData
    });
  } catch (error) {
    console.error("Failed to delete from Cloudinary:", error);
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
    printerSettings: (() => {
      try {
        return JSON.parse(localStorage.getItem(PRINTER_SETTINGS_KEY)) || { enabled: false, deviceName: '', copies: 1 };
      } catch { return { enabled: false, deviceName: '', copies: 1 }; }
    })(),

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
      
      if (toastTimeoutId) {
        clearTimeout(toastTimeoutId);
      }
      
      toastTimeoutId = setTimeout(() => {
        set((state) => ({ ...state, toast: { ...state.toast, visible: false } }));
        toastTimeoutId = null;
      }, 5000);
    },

    setPrinterSettings: (settings) => {
      set({ printerSettings: settings });
      try {
        localStorage.setItem(PRINTER_SETTINGS_KEY, JSON.stringify(settings));
      } catch {}
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
        if (isElectron()) {
          const localTemplates = await window.electronAPI.templates.list();
          const normalizedLocal = localTemplates.map(normalizeTemplate);
          
          if (userId && userId !== 'local') {
            // Merge with cloud templates for this user
            const { data, error } = await supabase
              .from('templates')
              .select(`*, profiles!templates_owner_id_fkey(display_name)`)
              .eq('owner_id', userId)
              .order('created_at', { ascending: false });
              
            if (!error && data) {
              const cloudTemplates = data.map(t => {
                const tNormalized = { ...t };
                tNormalized.creator_name = t.profiles?.display_name || 'Unknown User';
                return normalizeTemplate(tNormalized);
              });
              
              const merged = [...normalizedLocal];
              const localIds = new Set(normalizedLocal.map(t => t.id));
              const localCloudIds = new Set(normalizedLocal.map(t => t.cloud_id).filter(Boolean));
              
              cloudTemplates.forEach(ct => {
                if (!localIds.has(ct.id) && !localCloudIds.has(ct.id)) {
                  merged.push(ct);
                }
              });
              
              merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
              return { success: true, data: merged };
            }
          }
          
          return { success: true, data: normalizedLocal };
        }

        let query = supabase
          .from('templates')
          .select(`
            *,
            profiles!templates_owner_id_fkey(display_name)
          `)
          .order('created_at', { ascending: false });

        if (userId) {
          query = query.eq('owner_id', userId);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Map data to the normalized format, including creator_name from profiles
        const templates = data.map(t => {
          const tNormalized = { ...t };
          tNormalized.creator_name = t.profiles?.display_name || 'Unknown User';
          return normalizeTemplate(tNormalized);
        });

        return { success: true, data: templates };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },

    fetchCloudTemplates: async () => {
      try {
        let query = supabase
          .from('templates')
          .select(`
            *,
            profiles!templates_owner_id_fkey(display_name)
          `)
          .order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;

        const templates = data.map(t => {
          const tNormalized = { ...t };
          tNormalized.creator_name = t.profiles?.display_name || 'Unknown User';
          return normalizeTemplate(tNormalized);
        });

        return { success: true, data: templates };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },

    uploadTemplateToCloud: async (template) => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          return { success: false, error: 'You must be logged in to upload to the cloud.' };
        }
        
        let publicUrl = template.frameImage || template.frame_image_url || null;
        
        if (publicUrl && publicUrl.startsWith('data:')) {
          const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
          const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
          if (!cloudName || !uploadPreset) return { success: false, error: "Cloudinary credentials missing" };
          
          const formData = new FormData();
          formData.append('file', publicUrl);
          formData.append('upload_preset', uploadPreset);
          formData.append('folder', `ibooth/templates/${user.id}`);
          
          const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST', body: formData,
          });
          
          if (!uploadRes.ok) throw new Error("Cloudinary Upload Error");
          const uploadData = await uploadRes.json();
          publicUrl = uploadData.secure_url || uploadData.url;
        }
        
        const toSave = {
          id: template.id,
          owner_id: user.id,
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
          updated_at: new Date().toISOString(),
          created_at: template.created_at || new Date().toISOString()
        };
        
        const { data, error } = await supabase.from('templates').upsert(toSave, { onConflict: 'id' }).select().single();
        if (error) throw new Error(error.message);
        
        if (isElectron()) {
          await window.electronAPI.templates.delete(template.id);
          return { success: true, data: normalizeTemplate(data) };
        }
        
        return { success: true, data: normalizeTemplate(data) };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },

    saveTemplate: async (template, userId, frameFile = null) => {
      try {
        if (isElectron()) {
          const isCloudTemplate = template.is_cloud || (template.owner_id && template.owner_id !== 'local');
          if (!isCloudTemplate) {
            const finalId = template.id === 'default-template' ? crypto.randomUUID() : template.id;
            const toSave = {
              ...template,
              id: finalId,
              owner_id: 'local',
              updated_at: new Date().toISOString()
            };
            if (!toSave.created_at) toSave.created_at = new Date().toISOString();
            
            const savedData = await window.electronAPI.templates.save(toSave);
            const savedTemplate = normalizeTemplate(savedData);
            get().setTemplate(savedTemplate);
            get().saveTemplateQuietly();
            return { success: true, data: savedTemplate };
          }
        }

        const {
          data: { user },
          error: authError
        } = await supabase.auth.getUser();

        if (authError || !user) {
          return { success: false, error: 'You must be logged in to save to the cloud.' };
        }
        
        const ownerId = user.id;

        let publicUrl = template.frameImage || template.frame_image_url || null;
        
        // If the publicUrl is a Base64 string, it's a new upload. Upload it to Cloudinary!
        if (publicUrl && publicUrl.startsWith('data:')) {
          const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
          const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
          
          if (!cloudName || !uploadPreset) {
            return { success: false, error: "Cloudinary credentials missing in .env" };
          }
 
          const formData = new FormData();
          formData.append('file', publicUrl);
          formData.append('upload_preset', uploadPreset);
          formData.append('folder', `ibooth/templates/${ownerId}`);
 
          const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData,
          });
 
          if (!uploadRes.ok) {
            const errData = await uploadRes.json();
            return { success: false, error: `Cloudinary Upload Error: ${errData.error?.message || uploadRes.statusText}` };
          }
 
          const uploadData = await uploadRes.json();
          // Use the secure Cloudinary URL
          publicUrl = uploadData.secure_url || uploadData.url;
          
          if (!publicUrl) {
            return { success: false, error: "Cloudinary upload succeeded but no URL was returned." };
          }
        }
 
        // If the template belongs to someone else, we must save it as a new template (remix)
        const isNotOwner = user?.id && (!template.owner_id || template.owner_id !== user.id);
        const finalId = (template.id === 'default-template' || isNotOwner) ? crypto.randomUUID() : template.id;



        const toSave = {
          id: finalId,
          owner_id: ownerId,
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
          updated_at: new Date().toISOString()
        };

        if (template.created_at && !isNotOwner) {
          toSave.created_at = template.created_at;
        }

        const { data, error } = await supabase
          .from('templates')
          .upsert(toSave, { onConflict: 'id' })
          .select()
          .single();

        if (error) return { success: false, error: 'DATABASE_ERROR: ' + error.message };

        const currentUser = useAuthStore.getState().user;
        const savedData = { ...data, creator_name: currentUser?.name || 'Unknown User' };

        const savedTemplate = normalizeTemplate(savedData);
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
          if (isElectron()) {
            const localTemplates = await window.electronAPI.templates.list();
            const isLocal = localTemplates.some(t => t.id === templateId);
            if (isLocal) {
              await window.electronAPI.templates.delete(templateId);
              return { success: true };
            }
          }

         // Fetch the template first to get its frame_image_url
         const { data: templateData, error: fetchError } = await supabase
           .from('templates')
           .select('frame_image_url')
           .eq('id', templateId)
           .maybeSingle();

         if (!fetchError && templateData?.frame_image_url) {
           // Delete from Cloudinary (triggers asynchronously so database delete is not blocked)
           deleteFromCloudinary(templateData.frame_image_url);
         }

         const { error } = await supabase
           .from('templates')
           .delete()
           .eq('id', templateId);
           
         if (error) throw error;
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
