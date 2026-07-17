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
