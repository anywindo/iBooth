import { app, dialog } from 'electron';
import fs from 'fs';
import path from 'path';

let userDataPath = '';

export function initStorage() {
  userDataPath = app.getPath('userData');
  const dirs = [
    'templates',
    'templates/frames',
    'sessions',
    'sessions/photos',
    'sync'
  ];

  dirs.forEach(dir => {
    const fullPath = path.join(userDataPath, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });

  // Initialize templates index if it doesn't exist
  const templatesIndex = path.join(userDataPath, 'templates/index.json');
  if (!fs.existsSync(templatesIndex)) {
    fs.writeFileSync(templatesIndex, JSON.stringify([]));
  }

  // Initialize sessions index if it doesn't exist
  const sessionsIndex = path.join(userDataPath, 'sessions/index.json');
  if (!fs.existsSync(sessionsIndex)) {
    fs.writeFileSync(sessionsIndex, JSON.stringify([]));
  }
}

export function listTemplates() {
  const templatesIndex = path.join(userDataPath, 'templates/index.json');
  try {
    const data = fs.readFileSync(templatesIndex, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to list templates', error);
    return [];
  }
}

export async function saveTemplate(template) {
  const templatesIndex = path.join(userDataPath, 'templates/index.json');
  let templates = [];
  try {
    const data = fs.readFileSync(templatesIndex, 'utf8');
    templates = JSON.parse(data);
  } catch (error) {
    // Ignore, use empty array
  }

  const existingIndex = templates.findIndex(t => t.id === template.id);
  if (existingIndex >= 0) {
    templates[existingIndex] = { ...templates[existingIndex], ...template, updated_at: new Date().toISOString() };
  } else {
    templates.push({ ...template, updated_at: new Date().toISOString() });
  }

  fs.writeFileSync(templatesIndex, JSON.stringify(templates, null, 2));
  return template;
}

export async function deleteTemplate(id) {
  const templatesIndex = path.join(userDataPath, 'templates/index.json');
  let templates = [];
  try {
    const data = fs.readFileSync(templatesIndex, 'utf8');
    templates = JSON.parse(data);
  } catch (error) {
    // Ignore
  }

  templates = templates.filter(t => t.id !== id);
  fs.writeFileSync(templatesIndex, JSON.stringify(templates, null, 2));
  
  // Try to delete associated frame if exists locally, but we don't track the filename precisely here yet 
  // unless it's a file:// URL. We can just leave it for now or implement cleanup later.
  return true;
}

export async function importFrame(window) {
  const result = await dialog.showOpenDialog(window, {
    title: 'Import Frame',
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }
    ],
    properties: ['openFile']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const sourcePath = result.filePaths[0];
  const ext = path.extname(sourcePath);
  const fileName = `frame_${Date.now()}${ext}`;
  const destPath = path.join(userDataPath, 'templates/frames', fileName);

  fs.copyFileSync(sourcePath, destPath);
  return destPath;
}
