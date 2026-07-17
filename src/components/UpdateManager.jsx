import React, { useEffect, useState } from 'react';
import { isElectron } from '../core/platform.js';
import Dialog from './Dialog.jsx';
import { Button } from './Button.jsx';
import { useStore } from '../core/useStore.js';

export function UpdateManager() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const { addToast } = useStore();

  useEffect(() => {
    if (!isElectron() || !window.electronAPI?.updater) return;

    const { onUpdateAvailable, onUpdateDownloaded, onUpdateError } = window.electronAPI.updater;

    onUpdateAvailable((info) => {
      setUpdateInfo(info);
      setUpdateAvailable(true);
      addToast({ message: `Update ${info.version} is downloading...`, type: 'info' });
    });

    onUpdateDownloaded((info) => {
      setUpdateDownloaded(true);
    });

    onUpdateError((err) => {
      console.error('Update error:', err);
    });
  }, [addToast]);

  const handleInstall = () => {
    if (window.electronAPI?.updater?.installUpdate) {
      window.electronAPI.updater.installUpdate();
    }
  };

  return (
    <>
      <Dialog
        isOpen={updateDownloaded}
        onClose={() => setUpdateDownloaded(false)}
        title="Update Ready to Install"
        size="sm"
        footer={
          <>
            <Button onClick={() => setUpdateDownloaded(false)}>Later</Button>
            <Button variant="primary" onClick={handleInstall}>Restart & Install</Button>
          </>
        }
      >
        <p>A new version {updateInfo?.version ? `(${updateInfo.version}) ` : ''}has been downloaded and is ready to install.</p>
        <p style={{ marginTop: '8px' }}>Would you like to restart iBooth to apply the update now?</p>
      </Dialog>
    </>
  );
}
