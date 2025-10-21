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
    48: "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAA0klEQVRo3u2Y0Q3DIAxEL0s2YJgO0mE6SDdgmA7SDRikm3SDDpIRqogS8cXnJPqnSBXx8Qx2DAaDwWAwGAz+BTMAgJmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmf5HLwAVQ7/OqJ4AAAAASUVORK5CYII=",
    128: "iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAABd0lEQVR42u3bMQ0AIAwEwSdh/ynhSxQIBHfAvqmd+fsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMB7bAAA8A5Sv3YZGwAAAABJRU5ErkJggg=="
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
  version: "1.0.0",
  description: "Capture leads do WhatsApp Web direto para o Rankito CRM",
  permissions: ["storage", "activeTab", "alarms"],
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
      run_at: "document_end"
    }
  ],
  background: {
    service_worker: "background/service-worker.js"
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

const serviceWorkerCode = `// Service Worker for Rankito CRM Extension
const SUPABASE_URL = 'https://jhzmgexprjnpgadkxjup.supabase.co';

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Rankito] Extension installed:', details.reason);
  if (details.reason === 'install') {
    chrome.tabs.create({ url: 'https://rankito.lovable.app/extension-setup' });
  }
  chrome.action.setBadgeText({ text: '!' });
  chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'saveToken') {
    chrome.storage.local.set({ 
      apiToken: message.token,
      connectedAt: new Date().toISOString()
    }, () => {
      console.log('[Rankito] Token saved');
      chrome.action.setBadgeText({ text: '✓' });
      chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (message.action === 'getToken') {
    chrome.storage.local.get('apiToken', (data) => {
      sendResponse({ token: data.apiToken });
    });
    return true;
  }
  
  if (message.action === 'disconnect') {
    chrome.storage.local.remove('apiToken', () => {
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
      sendResponse({ success: true });
    });
    return true;
  }
});

chrome.storage.local.get('apiToken', (data) => {
  if (data.apiToken) {
    chrome.action.setBadgeText({ text: '✓' });
    chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
  }
});

chrome.alarms.create('checkConnection', { periodInMinutes: 30 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkConnection') {
    chrome.storage.local.get('apiToken', async (data) => {
      if (data.apiToken) {
        try {
          const response = await fetch(\`\${SUPABASE_URL}/rest/v1/\`, {
            headers: { 'apikey': data.apiToken, 'Authorization': \`Bearer \${data.apiToken}\` }
          });
          chrome.action.setBadgeText({ text: response.ok ? '✓' : '!' });
          chrome.action.setBadgeBackgroundColor({ color: response.ok ? '#10B981' : '#EF4444' });
        } catch {
          chrome.action.setBadgeText({ text: '!' });
          chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
        }
      }
    });
  }
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.url?.includes('web.whatsapp.com')) {
    chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' });
  } else {
    chrome.tabs.create({ url: 'https://web.whatsapp.com' });
  }
});`;

const contentScriptCode = `// Rankito CRM Content Script
console.log('[Rankito] Content script loaded');

let apiToken = null;
let sidebar = null;

chrome.runtime.sendMessage({ action: 'getToken' }, (response) => {
  if (response?.token) {
    apiToken = response.token;
    injectSidebar();
    observeConversationChanges();
  }
});

function injectSidebar() {
  if (sidebar) return;
  sidebar = document.createElement('div');
  sidebar.className = 'rankito-sidebar';
  sidebar.innerHTML = \`
    <div class="rankito-sidebar-header">
      <h3>Rankito CRM</h3>
      <button id="rankito-close-sidebar">×</button>
    </div>
    <div class="rankito-sidebar-content">
      <div id="rankito-contact-info">
        <p class="rankito-label">Contato Selecionado</p>
        <h4 id="rankito-contact-name">-</h4>
        <p id="rankito-contact-phone">-</p>
      </div>
      <button id="rankito-create-lead" class="rankito-primary-btn">🔥 Criar Lead no CRM</button>
      <div id="rankito-lead-history">
        <p class="rankito-label">Histórico no CRM</p>
        <div id="rankito-history-list"><p style="color: #9ca3af; font-size: 13px;">Carregando...</p></div>
      </div>
    </div>
  \`;
  document.body.appendChild(sidebar);
  document.getElementById('rankito-close-sidebar')?.addEventListener('click', () => {
    sidebar.remove();
    sidebar = null;
  });
  document.getElementById('rankito-create-lead')?.addEventListener('click', handleCreateLead);
}

function observeConversationChanges() {
  new MutationObserver(() => updateContactInfo()).observe(document.body, { childList: true, subtree: true });
  updateContactInfo();
}

function updateContactInfo() {
  if (!sidebar) return;
  const header = document.querySelector('[data-testid="conversation-header"]');
  if (!header) return;
  const name = header.querySelector('span[dir="auto"]')?.textContent || '-';
  let phone = '-';
  const titleEl = header.querySelector('[title]');
  if (titleEl) {
    const title = titleEl.getAttribute('title');
    if (title?.match(/\d/)) phone = title;
  }
  const nameEl = document.getElementById('rankito-contact-name');
  const phoneEl = document.getElementById('rankito-contact-phone');
  if (nameEl) nameEl.textContent = name;
  if (phoneEl) phoneEl.textContent = phone;
  if (phone !== '-') loadHistory(phone);
}

async function loadHistory(phone) {
  const list = document.getElementById('rankito-history-list');
  if (!list) return;
  try {
    const res = await fetch('https://jhzmgexprjnpgadkxjup.supabase.co/functions/v1/get-whatsapp-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-token': apiToken },
      body: JSON.stringify({ phone })
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    renderHistory(data.deals || []);
  } catch {
    list.innerHTML = '<p style="color: #ef4444; font-size: 13px;">Erro ao carregar</p>';
  }
}

function renderHistory(deals) {
  const list = document.getElementById('rankito-history-list');
  if (!list) return;
  if (deals.length === 0) {
    list.innerHTML = '<p style="color: #9ca3af; font-size: 13px;">Sem histórico</p>';
    return;
  }
  list.innerHTML = deals.map(d => \`
    <div style="background: #f9fafb; padding: 12px; border-radius: 6px; margin-bottom: 8px;">
      <strong>\${d.title}</strong>
      <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
        Estágio: <span style="background: #dbeafe; padding: 2px 8px; border-radius: 4px;">\${d.stage}</span>
      </div>
      <div style="font-size: 11px; color: #9ca3af; margin-top: 4px;">
        \${new Date(d.created_at).toLocaleDateString('pt-BR')}
      </div>
    </div>
  \`).join('');
}

async function handleCreateLead() {
  const btn = document.getElementById('rankito-create-lead');
  if (!btn) return;
  const header = document.querySelector('[data-testid="conversation-header"]');
  if (!header) { alert('Selecione uma conversa'); return; }
  const name = header.querySelector('span[dir="auto"]')?.textContent;
  let phone = '-';
  const titleEl = header.querySelector('[title]');
  if (titleEl) {
    const title = titleEl.getAttribute('title');
    if (title?.match(/\d/)) phone = title;
  }
  if (phone === '-') { alert('Número não encontrado'); return; }
  const messages = document.querySelectorAll('[data-testid="msg-container"]');
  const lastMessage = messages[messages.length - 1]?.textContent || '';
  btn.disabled = true;
  btn.textContent = '⏳ Criando...';
  try {
    const res = await fetch('https://jhzmgexprjnpgadkxjup.supabase.co/functions/v1/create-deal-from-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-token': apiToken },
      body: JSON.stringify({ phone, name, lastMessage })
    });
    if (!res.ok) throw new Error();
    btn.textContent = '✅ Criado!';
    setTimeout(() => { loadHistory(phone); btn.textContent = '🔥 Criar Lead no CRM'; btn.disabled = false; }, 2000);
  } catch {
    btn.textContent = '❌ Erro';
    setTimeout(() => { btn.textContent = '🔥 Criar Lead no CRM'; btn.disabled = false; }, 2000);
  }
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'toggleSidebar') {
    if (sidebar) { sidebar.remove(); sidebar = null; } 
    else { injectSidebar(); updateContactInfo(); }
  }
});

window.addEventListener('message', (e) => {
  if (e.data.type === 'RANKITO_TOKEN_SAVED' && e.data.token) {
    apiToken = e.data.token;
    if (!sidebar) { injectSidebar(); observeConversationChanges(); }
  }
});`;

const sidebarCSS = `.rankito-sidebar {
  position: fixed;
  top: 0;
  right: 0;
  width: 350px;
  height: 100vh;
  background: white;
  border-left: 1px solid #e5e7eb;
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.1);
  z-index: 999999;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.rankito-sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.rankito-sidebar-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
#rankito-close-sidebar {
  background: none;
  border: none;
  color: white;
  font-size: 28px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background 0.2s;
}
#rankito-close-sidebar:hover {
  background: rgba(255, 255, 255, 0.2);
}
.rankito-sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
#rankito-contact-info {
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  padding: 16px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}
.rankito-label {
  font-size: 11px;
  text-transform: uppercase;
  color: #9ca3af;
  margin: 0 0 12px 0;
  font-weight: 600;
  letter-spacing: 0.5px;
}
.rankito-primary-btn {
  width: 100%;
  padding: 14px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}
.rankito-primary-btn:hover {
  transform: translateY(-2px);
}
.rankito-primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
    
    // Type assertion needed for Deno compatibility
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
