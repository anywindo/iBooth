import fs from 'fs';
import path from 'path';
import { app } from 'electron';

export function getSyncState() {
  const userDataPath = app.getPath('userData');
  const syncStatePath = path.join(userDataPath, 'sync/sync-state.json');
  try {
    if (fs.existsSync(syncStatePath)) {
      const data = fs.readFileSync(syncStatePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to read sync state', error);
  }
  return { lastSyncAt: null, templates: {} };
}

export function saveSyncState(state) {
  const userDataPath = app.getPath('userData');
  const syncDir = path.join(userDataPath, 'sync');
  const syncStatePath = path.join(syncDir, 'sync-state.json');
  try {
    if (!fs.existsSync(syncDir)) {
      fs.mkdirSync(syncDir, { recursive: true });
    }
    fs.writeFileSync(syncStatePath, JSON.stringify(state, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to save sync state', error);
    return false;
  }
}
