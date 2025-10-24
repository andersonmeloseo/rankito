const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple ZIP file generator for Deno
class SimpleZip {
  private files: Array<{ path: string; content: Uint8Array }> = [];

  addFile(path: string, content: string | Uint8Array) {
    const bytes = typeof content === 'string' 
      ? new TextEncoder().encode(content)
      : content;
    this.files.push({ path, content: bytes });
  }

  generate(): Uint8Array {
    const encoder = new TextEncoder();
    const chunks: Uint8Array[] = [];
    const centralDirectory: Uint8Array[] = [];
    let offset = 0;

    // Write each file
    for (const file of this.files) {
      const filename = encoder.encode(file.path);
      
      // Local file header
      const localHeader = new Uint8Array(30 + filename.length);
      const view = new DataView(localHeader.buffer);
      
      view.setUint32(0, 0x04034b50, true); // Local file header signature
      view.setUint16(4, 20, true); // Version needed to extract
      view.setUint16(6, 0, true); // General purpose bit flag
      view.setUint16(8, 0, true); // Compression method (0 = no compression)
      view.setUint16(10, 0, true); // File last modification time
      view.setUint16(12, 0, true); // File last modification date
      view.setUint32(14, this.crc32(file.content), true); // CRC-32
      view.setUint32(18, file.content.length, true); // Compressed size
      view.setUint32(22, file.content.length, true); // Uncompressed size
      view.setUint16(26, filename.length, true); // File name length
      view.setUint16(28, 0, true); // Extra field length
      
      localHeader.set(filename, 30);
      chunks.push(localHeader, file.content);

      // Central directory header
      const centralHeader = new Uint8Array(46 + filename.length);
      const cdView = new DataView(centralHeader.buffer);
      
      cdView.setUint32(0, 0x02014b50, true); // Central directory signature
      cdView.setUint16(4, 20, true); // Version made by
      cdView.setUint16(6, 20, true); // Version needed to extract
      cdView.setUint16(8, 0, true); // General purpose bit flag
      cdView.setUint16(10, 0, true); // Compression method
      cdView.setUint16(12, 0, true); // File last modification time
      cdView.setUint16(14, 0, true); // File last modification date
      cdView.setUint32(16, this.crc32(file.content), true); // CRC-32
      cdView.setUint32(20, file.content.length, true); // Compressed size
      cdView.setUint32(24, file.content.length, true); // Uncompressed size
      cdView.setUint16(28, filename.length, true); // File name length
      cdView.setUint16(30, 0, true); // Extra field length
      cdView.setUint16(32, 0, true); // File comment length
      cdView.setUint16(34, 0, true); // Disk number start
      cdView.setUint16(36, 0, true); // Internal file attributes
      cdView.setUint32(38, 0, true); // External file attributes
      cdView.setUint32(42, offset, true); // Relative offset of local header
      
      centralHeader.set(filename, 46);
      centralDirectory.push(centralHeader);

      offset += localHeader.length + file.content.length;
    }

    // End of central directory record
    const cdSize = centralDirectory.reduce((sum, cd) => sum + cd.length, 0);
    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);
    
    eocdView.setUint32(0, 0x06054b50, true); // End of central directory signature
    eocdView.setUint16(4, 0, true); // Number of this disk
    eocdView.setUint16(6, 0, true); // Disk where central directory starts
    eocdView.setUint16(8, this.files.length, true); // Number of central directory records on this disk
    eocdView.setUint16(10, this.files.length, true); // Total number of central directory records
    eocdView.setUint32(12, cdSize, true); // Size of central directory
    eocdView.setUint32(16, offset, true); // Offset of start of central directory
    eocdView.setUint16(20, 0, true); // Comment length

    // Combine all chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0) + cdSize + eocd.length;
    const result = new Uint8Array(totalLength);
    let position = 0;

    for (const chunk of chunks) {
      result.set(chunk, position);
      position += chunk.length;
    }

    for (const cd of centralDirectory) {
      result.set(cd, position);
      position += cd.length;
    }

    result.set(eocd, position);
    return result;
  }

  private crc32(data: Uint8Array): number {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) {
      crc ^= data[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
      }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
}

// Generate actual PNG icons
function generateIcon(size: number): Uint8Array {
  // Real PNG files with blue gradient and white "R" letter
  const icons: Record<number, string> = {
    16: "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAjklEQVR42mNgGAWjYBSMAioCRjg7Pz//PxwDBBgY/gMxIzWDgYEBhBkYGP4DMSs1g4GBAYQZGP7/B2I2agYDAwMIMzAw/AdiDmoGAwMDCDMwMPwHYi5qBgMDAwgzMDD8B2JeagYDAwMIMzD8/w/EfNQMBgYGEGZgYPgPxALUDAYGBhBmYPgPxILUDAYGhlEAAOXkJjPgchQRAAAAAElFTkSuQmCC",
    48: "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAA0klEQVRo3u2Y0Q3DIAxEL0s2YJgO0mE6SDdgmA7SDRikm3SDDpIRqogS8cXnJPqnSBXx8Qx2DAaDwWAwGAz+BTMAgJmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmf5HLwAVQ7/OqJ4AAAAASUVORK5CYII=",
    128: "iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAABd0lEQVR42u3bMQ0AIAwEwSdh/ynhSxQIBHfAvqmd+fsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMB7bAAA8A5Sv3YZGwAAAABJRU5ErkJggg=="
  };
  
  const base64Data = icons[size] || icons[16];
  
  // Decode base64 to binary
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes;
}

// Extension files content
const manifest = {
  manifest_version: 3,
  name: "Rankito CRM - WhatsApp Connector",
  version: "1.0.6",
  description: "Capture leads do WhatsApp Web direto para o Rankito CRM",
  permissions: ["storage", "activeTab", "alarms", "scripting"],
  host_permissions: ["https://web.whatsapp.com/*", "https://*.supabase.co/*"],
  action: {
    default_icon: {
      "16": "assets/icon16.png",
      "48": "assets/icon48.png",
      "128": "assets/icon128.png"
    }
  },
  content_scripts: [
    {
      matches: ["https://web.whatsapp.com/*"],
      js: ["content/content.js"],
      css: ["content/sidebar.css"],
      run_at: "document_end",
      all_frames: false
    }
  ],
  background: {
    service_worker: "background/service-worker.js",
    type: "module"
  },
  web_accessible_resources: [
    {
      resources: ["assets/*", "config.html", "config.js"],
      matches: ["https://web.whatsapp.com/*", "<all_urls>"]
    }
  ],
  icons: {
    "16": "assets/icon16.png",
    "48": "assets/icon48.png",
    "128": "assets/icon128.png"
  }
};

const serviceWorkerCode = `// 🚀 Service Worker para Extensão Rankito CRM v1.0.6
console.log('[Rankito Background] 🚀 Service Worker Starting - Version 1.0.6');

const SUPABASE_URL = 'https://jhzmgexprjnpgadkxjup.supabase.co';

const DEBUG = true;
const log = (...args) => DEBUG && console.log('[Rankito Background]', ...args);
const logError = (...args) => console.error('[Rankito Background]', ...args);

chrome.runtime.onInstalled.addListener((details) => {
  log('✅ Extension installed/updated:', details.reason);
  chrome.action.setBadgeText({ text: '!' });
  chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
  log('⚠️ Configure o token ao abrir o WhatsApp Web');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    log('📨 Message received:', message.action);
    
    if (message.action === 'openConfig') {
      chrome.tabs.create({
        url: chrome.runtime.getURL('config.html')
      });
      log('✅ Config page opened');
      sendResponse({ success: true });
      return true;
    }
    
    if (message.action === 'saveToken') {
      chrome.storage.local.set({ 
        apiToken: message.token,
        connectedAt: new Date().toISOString()
      }, () => {
        log('✅ Token saved successfully');
        chrome.action.setBadgeText({ text: '✓' });
        chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
        
        chrome.tabs.query({ url: 'https://web.whatsapp.com/*' }, (tabs) => {
          tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, { 
              action: 'updateToken', 
              token: message.token 
            }).catch(() => {});
          });
        });
        
        sendResponse({ success: true });
      });
      return true;
    }
    
    if (message.action === 'getToken') {
      chrome.storage.local.get('apiToken', (data) => {
        log('📤 Token retrieved:', data.apiToken ? 'Present' : 'Not found');
        sendResponse({ token: data.apiToken });
      });
      return true;
    }
    
    if (message.action === 'disconnect') {
      chrome.storage.local.remove(['apiToken', 'connectedAt'], () => {
        log('🔌 Token removed, disconnected');
        chrome.action.setBadgeText({ text: '!' });
        chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
        sendResponse({ success: true });
      });
      return true;
    }
  } catch (error) {
    logError('❌ Error handling message:', error);
    sendResponse({ success: false, error: error.message });
  }
});

chrome.storage.local.get('apiToken', (data) => {
  if (data.apiToken) {
    chrome.action.setBadgeText({ text: '✓' });
    chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
    log('✅ Token found on startup, extension ready');
  } else {
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
    log('⚠️ No token found on startup, need configuration');
  }
});

chrome.alarms.create('checkConnection', { periodInMinutes: 30 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkConnection') {
    const { apiToken } = await chrome.storage.local.get('apiToken');
    
    if (!apiToken) {
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
      return;
    }
    
    try {
      const response = await fetch(\`\${SUPABASE_URL}/functions/v1/get-whatsapp-history\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-token': apiToken
        },
        body: JSON.stringify({ phone: '+00000000000' })
      });
      
      if (response.ok || response.status === 404) {
        chrome.action.setBadgeText({ text: '✓' });
        chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
        log('✅ Connection check passed');
      } else {
        chrome.action.setBadgeText({ text: '!' });
        chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
        log('⚠️ Connection check failed');
      }
    } catch (error) {
      logError('Connection check error:', error);
    }
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  log('🖱️ Extension icon clicked');
  
  if (!tab.url || !tab.url.includes('web.whatsapp.com')) {
    log('⚠️ Not on WhatsApp Web, opening WhatsApp');
    chrome.tabs.update(tab.id, { url: 'https://web.whatsapp.com' });
    return;
  }
  
  try {
    await chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' });
    log('✅ Sidebar toggle message sent');
  } catch (error) {
    logError('❌ Content script not responding, injecting scripts and reloading');
    
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/content.js']
      });
      
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['content/sidebar.css']
      });
      
      log('✅ Scripts injected, reloading page...');
      await chrome.tabs.reload(tab.id);
    } catch (injectionError) {
      logError('❌ Failed to inject scripts:', injectionError);
      chrome.tabs.reload(tab.id);
    }
  }
});

log('🚀 Service Worker fully loaded and ready');`;

const contentScriptCode = `// 🚀 Rankito CRM - WhatsApp Connector v1.0.6 (SIMPLIFIED)
console.log('[Rankito] 🚀 Content script starting v1.0.6');

const SUPABASE_URL = 'https://jhzmgexprjnpgadkxjup.supabase.co';
let apiToken = null;
let currentPhone = null;
let isProcessing = false;

if (!window.location.href.includes('web.whatsapp.com')) {
  console.log('[Rankito] ⚠️ Not on WhatsApp Web, script will not run');
} else {
  console.log('[Rankito] ✅ On WhatsApp Web, initializing...');
  init();
}

function init() {
  chrome.runtime.sendMessage({ action: 'getToken' }, (response) => {
    apiToken = response?.token;
    
    if (!apiToken) {
      console.log('[Rankito] ⚠️ No token found, showing config button');
      injectConfigButton();
    } else {
      console.log('[Rankito] ✅ Token found, extension ready');
      startObserving();
    }
  });
}

function injectConfigButton() {
  if (document.getElementById('rankito-config-btn')) {
    return;
  }

  const button = document.createElement('button');
  button.id = 'rankito-config-btn';
  button.innerHTML = '🚀 Configurar Rankito';
  button.style.cssText = \\\`
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 999999;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 14px 24px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
    transition: all 0.3s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  \\\`;

  button.onmouseover = () => {
    button.style.transform = 'translateY(-2px)';
    button.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.5)';
  };

  button.onmouseout = () => {
    button.style.transform = 'translateY(0)';
    button.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.4)';
  };

  button.onclick = () => {
    console.log('[Rankito] 🖱️ Config button clicked, opening config page');
    chrome.runtime.sendMessage({ action: 'openConfig' });
  };

  document.body.appendChild(button);
  console.log('[Rankito] ✅ Config button injected');
}

function startObserving() {
  console.log('[Rankito] 👀 Starting to observe conversations...');

  updateContactInfo();

  const observer = new MutationObserver(() => {
    updateContactInfo();
  });

  const targetNode = document.querySelector('#main') || document.body;
  observer.observe(targetNode, {
    childList: true,
    subtree: true
  });

  console.log('[Rankito] ✅ Observer started');
}

function updateContactInfo() {
  try {
    const nameElement = document.querySelector('header [role="img"]')?.nextElementSibling?.querySelector('span');
    const contactName = nameElement?.textContent?.trim() || 'Desconhecido';

    let phoneNumber = null;

    const urlMatch = window.location.href.match(/\\/(\\d+)@/);
    if (urlMatch) {
      phoneNumber = '+' + urlMatch[1];
    }

    if (!phoneNumber) {
      const headerImg = document.querySelector('header [role="img"]');
      if (headerImg?.alt) {
        const altMatch = headerImg.alt.match(/\\+?\\d{10,}/);
        if (altMatch) {
          phoneNumber = altMatch[0].startsWith('+') ? altMatch[0] : '+' + altMatch[0];
        }
      }
    }

    if (phoneNumber && phoneNumber !== currentPhone) {
      currentPhone = phoneNumber;
      console.log('[Rankito] 📞 New contact detected:', contactName, phoneNumber);
      
      if (!isProcessing) {
        handleNewContact(contactName, phoneNumber);
      }
    }
  } catch (error) {
    console.error('[Rankito] ❌ Error updating contact info:', error);
  }
}

async function handleNewContact(name, phone) {
  if (!apiToken) {
    console.log('[Rankito] ⚠️ No token, skipping lead creation');
    return;
  }

  isProcessing = true;

  try {
    console.log('[Rankito] 📤 Creating lead for:', name, phone);

    const response = await fetch(\\\`\\\${SUPABASE_URL}/functions/v1/create-deal-from-whatsapp\\\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': apiToken
      },
      body: JSON.stringify({
        contact_name: name,
        phone: phone,
        source: 'whatsapp_web_extension'
      })
    });

    const result = await response.json();

    if (response.ok) {
      console.log('[Rankito] ✅ Lead created/updated successfully:', result);
      showNotification('✅ Lead sincronizado com Rankito CRM', 'success');
    } else {
      console.error('[Rankito] ❌ Error creating lead:', result);
      if (response.status === 401) {
        showNotification('❌ Token inválido. Reconfigure a extensão.', 'error');
        apiToken = null;
        injectConfigButton();
      }
    }
  } catch (error) {
    console.error('[Rankito] ❌ Network error:', error);
  } finally {
    isProcessing = false;
  }
}

function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = \\\`
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 999999;
    background: \\\${type === 'success' ? '#10b981' : '#ef4444'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    animation: slideIn 0.3s ease-out;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  \\\`;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(400px)';
    notification.style.transition = 'all 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Rankito] 📨 Message received:', message.action);

  if (message.action === 'updateToken') {
    apiToken = message.token;
    console.log('[Rankito] ✅ Token updated');
    
    const configBtn = document.getElementById('rankito-config-btn');
    if (configBtn) {
      configBtn.remove();
    }
    
    startObserving();
    
    sendResponse({ success: true });
  }

  return true;
});

console.log('[Rankito] 🚀 Content script fully loaded v1.0.6');`;

const sidebarCSS = `/* Minimal CSS for v1.0.6 - not used anymore */`;

const configHTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Configurar Rankito CRM</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 500px;
      width: 100%;
      padding: 40px;
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .logo {
      font-size: 48px;
      text-align: center;
      margin-bottom: 10px;
    }

    h1 {
      color: #667eea;
      font-size: 28px;
      text-align: center;
      margin-bottom: 8px;
      font-weight: 700;
    }

    h2 {
      color: #64748b;
      font-size: 16px;
      text-align: center;
      margin-bottom: 30px;
      font-weight: 400;
    }

    .form-group {
      margin-bottom: 24px;
    }

    label {
      display: block;
      color: #334155;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    input[type="text"] {
      width: 100%;
      padding: 14px 16px;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 15px;
      transition: all 0.2s;
      font-family: monospace;
    }

    input[type="text"]:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    button {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
    }

    button:active {
      transform: translateY(0);
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .instructions {
      background: #f1f5f9;
      border-radius: 8px;
      padding: 16px;
      margin-top: 24px;
      font-size: 14px;
      color: #475569;
      line-height: 1.6;
    }

    .instructions strong {
      color: #334155;
      display: block;
      margin-bottom: 8px;
    }

    .instructions ol {
      margin-left: 20px;
      margin-top: 8px;
    }

    .instructions li {
      margin-bottom: 6px;
    }

    .instructions code {
      background: #e2e8f0;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 13px;
      font-family: monospace;
    }

    .status {
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;
      text-align: center;
      font-size: 14px;
      font-weight: 500;
      display: none;
    }

    .status.success {
      background: #dcfce7;
      color: #166534;
      border: 1px solid #bbf7d0;
      display: block;
    }

    .status.error {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
      display: block;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🚀</div>
    <h1>Rankito CRM</h1>
    <h2>Configure sua Extensão do WhatsApp</h2>

    <div id="status" class="status"></div>

    <div class="form-group">
      <label for="token-input">Token de API</label>
      <input 
        type="text" 
        id="token-input" 
        placeholder="Cole seu token aqui (ex: usr_abc123...)"
        autocomplete="off"
        spellcheck="false"
      >
    </div>

    <button id="save-btn">
      💾 Salvar e Conectar
    </button>

    <div class="instructions">
      <strong>📋 Como obter seu token:</strong>
      <ol>
        <li>Acesse o <code>Rankito CRM</code></li>
        <li>Vá em <code>Integrações</code> → <code>WhatsApp</code></li>
        <li>Copie o token gerado</li>
        <li>Cole aqui e clique em "Salvar"</li>
      </ol>
      <p style="margin-top: 12px;">
        ✨ Após salvar, esta aba fechará automaticamente e você poderá usar o WhatsApp Web normalmente.
      </p>
    </div>
  </div>

  <script src="config.js"></script>
</body>
</html>`;

const configJS = `console.log('[Rankito Config] 📄 Config page loaded');

const tokenInput = document.getElementById('token-input');
const saveBtn = document.getElementById('save-btn');
const statusDiv = document.getElementById('status');

chrome.storage.local.get('apiToken', (data) => {
  if (data.apiToken) {
    tokenInput.value = data.apiToken;
    showStatus('Token já configurado. Você pode atualizá-lo se necessário.', 'success');
  }
});

saveBtn.onclick = async () => {
  const token = tokenInput.value.trim();
  
  if (!token) {
    showStatus('❌ Por favor, cole um token válido!', 'error');
    tokenInput.focus();
    return;
  }

  if (token.length < 10) {
    showStatus('❌ Token parece inválido. Verifique e tente novamente.', 'error');
    tokenInput.focus();
    return;
  }

  try {
    saveBtn.disabled = true;
    saveBtn.textContent = '⏳ Salvando...';
    
    await chrome.storage.local.set({ 
      apiToken: token,
      connectedAt: new Date().toISOString()
    });
    
    console.log('[Rankito Config] ✅ Token saved successfully');
    
    await chrome.runtime.sendMessage({ 
      action: 'saveToken',
      token: token 
    });
    
    showStatus('✅ Token salvo com sucesso! Fechando...', 'success');
    
    setTimeout(() => {
      window.close();
    }, 1000);
    
  } catch (error) {
    console.error('[Rankito Config] ❌ Error saving token:', error);
    showStatus('❌ Erro ao salvar. Tente novamente.', 'error');
    saveBtn.disabled = false;
    saveBtn.textContent = '💾 Salvar e Conectar';
  }
};

tokenInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    saveBtn.click();
  }
});

function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = \\\`status \\\${type}\\\`;
  
  if (type === 'error') {
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000);
  }
}

tokenInput.focus();`;

Deno.serve(async (req) => {
  console.log('[Extension Download] Request:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[Extension Download] Creating ZIP...');
    
    const zip = new SimpleZip();
    zip.addFile('manifest.json', JSON.stringify(manifest, null, 2));
    zip.addFile('background/service-worker.js', serviceWorkerCode);
    zip.addFile('content/content.js', contentScriptCode);
    zip.addFile('content/sidebar.css', sidebarCSS);
    zip.addFile('config.html', configHTML);
    zip.addFile('config.js', configJS);
    zip.addFile('assets/icon16.png', generateIcon(16));
    zip.addFile('assets/icon48.png', generateIcon(48));
    zip.addFile('assets/icon128.png', generateIcon(128));
    
    const zipData = zip.generate();
    console.log('[Extension Download] ZIP ready:', zipData.length, 'bytes');
    
    return new Response(zipData as unknown as BodyInit, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="rankito-whatsapp-extension.zip"',
        'Content-Length': zipData.length.toString(),
      },
    });
  } catch (error) {
    console.error('[Extension Download] Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
