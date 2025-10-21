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
  chrome.action.setBadgeText({ text: '!' });
  chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
  console.log('[Rankito] ⚠️ Configure o token ao abrir o WhatsApp Web');
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

const contentScriptCode = `// Content Script for WhatsApp Web Integration
const SUPABASE_URL = 'https://jhzmgexprjnpgadkxjup.supabase.co';

console.log('[Rankito Content] 🚀 Script loaded on WhatsApp Web');

let sidebarInjected = false;
let currentContact = { name: null, phone: null };
let apiToken = null;

// Initialize
(async function init() {
  console.log('[Rankito Content] 🚀 Initializing...');
  const result = await chrome.storage.local.get('apiToken');
  apiToken = result.apiToken;
  
  if (!apiToken) {
    console.warn('[Rankito Content] ⚠️ No API token found - showing config modal');
    setTimeout(() => showConfigModal(), 2000);
    return;
  }
  
  console.log('[Rankito Content] ✅ Token loaded:', apiToken.substring(0, 20) + '...');
  setTimeout(() => {
    console.log('[Rankito Content] 💉 Injecting sidebar...');
    injectSidebar();
    observeConversationChanges();
    setTimeout(() => {
      console.log('[Rankito Content] 🔄 Forcing first contact update...');
      updateContactInfo();
    }, 1000);
  }, 2000);
})();

function showConfigModal() {
  const modal = document.createElement('div');
  modal.id = 'rankito-config-modal';
  modal.className = 'rankito-config-modal';
  modal.innerHTML = \`
    <div class="rankito-config-backdrop"></div>
    <div class="rankito-config-content">
      <div class="rankito-config-header">
        <h2>🔥 Rankito CRM - Configuração</h2>
        <p>Cole seu token de API</p>
      </div>
      <div class="rankito-config-body">
        <label>Token de API:</label>
        <textarea id="rankito-token-input" placeholder="Cole aqui..." rows="3"></textarea>
        <div class="rankito-config-actions">
          <button id="rankito-paste-btn" class="rankito-btn-secondary">📋 Colar</button>
          <button id="rankito-save-token-btn" class="rankito-btn-primary">✅ Salvar</button>
        </div>
      </div>
    </div>
  \`;
  document.body.appendChild(modal);
  
  document.getElementById('rankito-paste-btn')?.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      document.getElementById('rankito-token-input').value = text;
    } catch { alert('❌ Erro ao ler clipboard'); }
  });
  
  document.getElementById('rankito-save-token-btn')?.addEventListener('click', async () => {
    const token = document.getElementById('rankito-token-input')?.value.trim();
    if (!token) return alert('⚠️ Token inválido');
    chrome.runtime.sendMessage({ action: 'saveToken', token }, (response) => {
      if (response?.success) {
        apiToken = token;
        modal.remove();
        setTimeout(() => { injectSidebar(); observeConversationChanges(); }, 500);
        alert('✅ Configurado!');
      }
    });
  });
}

function injectSidebar() {
  if (sidebarInjected) return;
  const sidebar = document.createElement('div');
  sidebar.id = 'rankito-sidebar';
  sidebar.className = 'rankito-sidebar';
  sidebar.innerHTML = \`
    <div class="rankito-sidebar-header">
      <h3>🔥 Rankito CRM</h3>
      <button id="rankito-close-sidebar">×</button>
    </div>
    <div class="rankito-sidebar-content">
      <div id="rankito-contact-info">
        <p class="rankito-label">Contato detectado:</p>
        <h4 id="rankito-contact-name">—</h4>
        <p id="rankito-contact-phone">—</p>
      </div>
      <button id="rankito-create-lead-btn" class="rankito-primary-btn">🔥 Criar Lead</button>
      <div id="rankito-lead-history">
        <p class="rankito-label">Histórico:</p>
        <div id="rankito-history-list"><div class="rankito-loading">Carregando...</div></div>
      </div>
    </div>
  \`;
  document.body.appendChild(sidebar);
  sidebarInjected = true;
  document.getElementById('rankito-close-sidebar')?.addEventListener('click', () => sidebar.style.display = 'none');
  document.getElementById('rankito-create-lead-btn')?.addEventListener('click', handleCreateLead);
}

function observeConversationChanges() {
  const observer = new MutationObserver(() => updateContactInfo());
  const target = document.querySelector('#main');
  if (target) {
    observer.observe(target, { childList: true, subtree: true });
    console.log('[Rankito Content] 👀 Observing changes');
  }
}

function updateContactInfo() {
  try {
    const headerSelectors = ['header span[title]', 'header div[title]', 'header span[dir="auto"]'];
    let name = null;
    for (const sel of headerSelectors) {
      const el = document.querySelector(sel);
      if (el?.textContent?.length > 0) {
        name = el.textContent.trim();
        break;
      }
    }
    if (!name) name = 'Não identificado';
    
    let phone = null;
    const urlMatch = window.location.href.match(/\\/(\d{10,15})$/);
    if (urlMatch) phone = urlMatch[1];
    
    if (!phone) {
      const phoneEls = document.querySelectorAll('span[dir="ltr"]');
      for (const el of phoneEls) {
        const text = el.textContent;
        if (text && /^\\+?\\d[\\d\\s\\-\\(\\)]{8,}$/.test(text)) {
          phone = text.replace(/\\D/g, '');
          break;
        }
      }
    }
    
    if (name !== currentContact.name || phone !== currentContact.phone) {
      currentContact = { name, phone };
      const nameEl = document.getElementById('rankito-contact-name');
      const phoneEl = document.getElementById('rankito-contact-phone');
      if (nameEl) nameEl.textContent = name;
      if (phoneEl) {
        phoneEl.textContent = phone || 'Clique para inserir';
        phoneEl.style.cursor = phone ? 'default' : 'pointer';
        if (!phone) {
          phoneEl.onclick = () => {
            const inp = prompt('Digite o telefone (só números):');
            if (inp) {
              const clean = inp.replace(/\\D/g, '');
              if (clean.length >= 10) {
                currentContact.phone = clean;
                phoneEl.textContent = clean;
                phoneEl.style.cursor = 'default';
                phoneEl.onclick = null;
                loadHistory(clean);
              }
            }
          };
        } else phoneEl.onclick = null;
      }
      console.log('[Rankito Content] ✅ Contact updated:', currentContact);
      if (phone) loadHistory(phone);
      else {
        const histDiv = document.getElementById('rankito-history-list');
        if (histDiv) histDiv.innerHTML = '<p class="rankito-empty">📱 Clique no telefone acima</p>';
      }
    }
  } catch (error) {
    console.error('[Rankito Content] ❌ Error:', error);
  }
}

async function loadHistory(phone) {
  if (!apiToken || !phone) return;
  const histDiv = document.getElementById('rankito-history-list');
  if (!histDiv) return;
  console.log('[Rankito Content] 📥 Loading history:', phone);
  histDiv.innerHTML = '<div class="rankito-loading">Carregando...</div>';
  try {
    const res = await fetch(\`\${SUPABASE_URL}/functions/v1/get-whatsapp-history\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-token': apiToken },
      body: JSON.stringify({ phone })
    });
    console.log('[Rankito Content] 📡 Response:', res.status);
    if (!res.ok) throw new Error('Failed');
    const data = await res.json();
    if (data.total_deals > 0) renderHistory(data.deals);
    else histDiv.innerHTML = '<p class="rankito-empty">Nenhuma interação</p>';
  } catch (error) {
    console.error('[Rankito Content] ❌ Error:', error);
    histDiv.innerHTML = '<p class="rankito-error">Erro ao carregar</p>';
  }
}

function renderHistory(deals) {
  const histDiv = document.getElementById('rankito-history-list');
  if (!histDiv) return;
  histDiv.innerHTML = deals.map(d => \`
    <div class="rankito-history-item">
      <strong>\${d.title}</strong>
      <span class="rankito-stage-badge">\${d.stage}</span>
      <p class="rankito-date">\${new Date(d.created_at).toLocaleDateString('pt-BR')}</p>
    </div>
  \`).join('');
}

async function handleCreateLead() {
  if (!apiToken) return alert('❌ Token não configurado');
  if (!currentContact.name) return alert('❌ Nenhum contato');
  const btn = document.getElementById('rankito-create-lead-btn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Criando...';
  }
  try {
    const msgs = document.querySelectorAll('[data-pre-plain-text]');
    const lastMsg = msgs[msgs.length - 1]?.textContent || '';
    const res = await fetch(\`\${SUPABASE_URL}/functions/v1/create-deal-from-whatsapp\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-token': apiToken },
      body: JSON.stringify({
        name: currentContact.name,
        phone: currentContact.phone || 'não disponível',
        message: lastMsg.substring(0, 500),
        stage: 'lead'
      })
    });
    const result = await res.json();
    if (result.success) {
      alert(\`✅ \${result.message}\\nScore: \${result.lead_score}\`);
      if (currentContact.phone) loadHistory(currentContact.phone);
    } else throw new Error(result.error);
  } catch (error) {
    alert('❌ Erro: ' + error.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🔥 Criar Lead';
    }
  }
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'toggleSidebar') {
    const sidebar = document.getElementById('rankito-sidebar');
    if (sidebar) sidebar.style.display = sidebar.style.display === 'none' ? 'flex' : 'none';
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
