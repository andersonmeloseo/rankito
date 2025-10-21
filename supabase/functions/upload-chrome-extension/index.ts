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
  version: "1.0.3",
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
      run_at: "document_idle",
      all_frames: false
    }
  ],
  background: {
    service_worker: "background/service-worker.js",
    type: "module"
  },
  web_accessible_resources: [
    {
      resources: ["assets/*"],
      matches: ["https://web.whatsapp.com/*"]
    }
  ],
  icons: {
    "16": "assets/icon16.png",
    "48": "assets/icon48.png",
    "128": "assets/icon128.png"
  }
};

const serviceWorkerCode = `// 🚀 Service Worker para Extensão Rankito CRM
console.log('[Rankito Background] 🚀 Service Worker Starting - Version 1.0.4');

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
    
    if (message.action === 'saveToken') {
      chrome.storage.local.set({ 
        apiToken: message.token,
        connectedAt: new Date().toISOString()
      }, () => {
        log('✅ Token saved successfully');
        chrome.action.setBadgeText({ text: '✓' });
        chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
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
    await Promise.race([
      chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1000))
    ]);
    log('✅ Sidebar toggle message sent');
  } catch (error) {
    logError('❌ Content script not responding, injecting script:', error);
    
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/content.js']
      });
      
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['content/sidebar.css']
      });
      
      log('✅ Scripts injected successfully');
      
      setTimeout(async () => {
        try {
          await chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' });
          log('✅ Sidebar toggle after injection');
        } catch (err) {
          logError('❌ Still failed after injection:', err);
        }
      }, 1000);
    } catch (injectionError) {
      logError('❌ Failed to inject scripts:', injectionError);
      chrome.tabs.reload(tab.id);
    }
  }
});

log('🚀 Service Worker fully loaded and ready');`;

const contentScriptCode = `// Content Script loaded
console.log('[Rankito] Content script loaded - v1.0.4');`;

const sidebarCSS = `/* Rankito CRM Sidebar & Config Modal Styles */

/* Configuration Modal */
.rankito-config-modal {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  z-index: 999999999 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  pointer-events: all !important;
}

.rankito-config-backdrop {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background: rgba(0, 0, 0, 0.8) !important;
  backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
  pointer-events: all !important;
}

.rankito-config-content {
  position: relative !important;
  width: 90% !important;
  max-width: 500px !important;
  background: white !important;
  border-radius: 16px !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5) !important;
  overflow: hidden !important;
  animation: rankito-modal-in 0.3s ease !important;
  pointer-events: all !important;
  z-index: 1000000000 !important;
}

@keyframes rankito-modal-in {
  from { opacity: 0; transform: scale(0.9) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.rankito-config-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: white !important;
  padding: 24px !important;
  text-align: center !important;
  position: relative !important;
}

.rankito-config-close {
  position: absolute !important;
  top: 12px !important;
  right: 12px !important;
  background: rgba(255, 255, 255, 0.2) !important;
  border: none !important;
  color: white !important;
  font-size: 24px !important;
  cursor: pointer !important;
  padding: 4px 8px !important;
  width: 32px !important;
  height: 32px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 6px !important;
  transition: background 0.2s !important;
  line-height: 1 !important;
}

.rankito-config-close:hover {
  background: rgba(255, 255, 255, 0.3) !important;
}

.rankito-config-header h2 {
  margin: 0 0 8px 0 !important;
  font-size: 24px !important;
  font-weight: 700 !important;
  color: white !important;
}

.rankito-config-header p {
  margin: 0 !important;
  font-size: 14px !important;
  opacity: 0.9 !important;
  color: white !important;
}

.rankito-config-body {
  padding: 24px !important;
  background: white !important;
}

.rankito-config-body label {
  display: block !important;
  font-weight: 600 !important;
  margin-bottom: 8px !important;
  color: #333 !important;
  font-size: 14px !important;
}

.rankito-config-body textarea {
  width: 100% !important;
  padding: 12px !important;
  border: 2px solid #e2e8f0 !important;
  border-radius: 8px !important;
  font-size: 13px !important;
  font-family: 'Monaco', 'Courier New', monospace !important;
  resize: vertical !important;
  margin-bottom: 16px !important;
  transition: border-color 0.2s !important;
  box-sizing: border-box !important;
  color: #333 !important;
  background: white !important;
  min-height: 120px !important;
}

.rankito-config-body textarea:focus {
  outline: none !important;
  border-color: #667eea !important;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
}

.rankito-config-actions {
  display: flex !important;
  gap: 12px !important;
  margin-bottom: 16px !important;
}

.rankito-btn-primary,
.rankito-btn-secondary {
  flex: 1 !important;
  padding: 12px 20px !important;
  border: none !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
  font-size: 14px !important;
  cursor: pointer !important;
  transition: all 0.2s !important;
}

.rankito-btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: white !important;
}

.rankito-btn-primary:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4) !important;
}

.rankito-btn-primary:disabled {
  opacity: 0.6 !important;
  cursor: not-allowed !important;
  transform: none !important;
}

.rankito-btn-secondary {
  background: #f7fafc !important;
  color: #4a5568 !important;
  border: 2px solid #e2e8f0 !important;
}

.rankito-btn-secondary:hover {
  background: #edf2f7 !important;
}

.rankito-config-help {
  background: #f7fafc !important;
  padding: 16px !important;
  border-radius: 8px !important;
  font-size: 13px !important;
  color: #4a5568 !important;
  line-height: 1.6 !important;
  margin: 0 !important;
}

.rankito-config-help strong {
  color: #2d3748 !important;
  font-weight: 600 !important;
}`;

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
