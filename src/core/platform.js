export const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI && window.electronAPI.platform && window.electronAPI.platform.isElectron;
};

export const getPlatform = () => {
  if (isElectron()) {
    return window.electronAPI.platform.platform; // 'darwin', 'win32', etc.
  }
  return 'web';
};

export const isMac = () => {
  return getPlatform() === 'darwin';
};

export const getLocalMediaUrl = (path) => {
  if (!path) return path;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('blob:')) return path;
  if (path.startsWith('data:')) return path;

  let cleanPath = path;
  if (path.startsWith('file://')) {
    cleanPath = path.slice(7);
  }

  if (isElectron() && window.electronAPI && window.electronAPI.localServerPort) {
    return `http://127.0.0.1:${window.electronAPI.localServerPort}/local-media?path=${encodeURIComponent(cleanPath)}`;
  }
  
  return cleanPath;
};
