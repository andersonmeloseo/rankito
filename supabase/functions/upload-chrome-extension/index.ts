import { JSZip } from 'https://deno.land/x/jszip@0.11.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Conteúdo dos arquivos da extensão
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
    chrome.tabs.create({ url: chrome.runtime.getURL('../../extension-setup') });
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
});

chrome.storage.local.get('apiToken', (data) => {
  if (data.apiToken) {
    chrome.action.setBadgeText({ text: '✓' });
    chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
  }
});

console.log('[Rankito] Service Worker loaded');`;

const contentScriptCode = `// Rankito CRM Content Script
console.log('[Rankito] Content script loaded');

let apiToken = null;
let sidebar = null;

chrome.runtime.sendMessage({ action: 'getToken' }, (response) => {
  if (response?.token) {
    apiToken = response.token;
    injectSidebar();
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
      <button id="rankito-create-lead" class="rankito-primary-btn">
        🔥 Criar Lead no CRM
      </button>
      <div id="rankito-lead-history">
        <p class="rankito-label">Histórico no CRM</p>
        <div id="rankito-history-list"></div>
      </div>
    </div>
  \`;
  
  document.body.appendChild(sidebar);
  
  document.getElementById('rankito-close-sidebar')?.addEventListener('click', () => {
    sidebar.remove();
    sidebar = null;
  });
  
  document.getElementById('rankito-create-lead')?.addEventListener('click', handleCreateLead);
  
  observeConversationChanges();
}

function observeConversationChanges() {
  const observer = new MutationObserver(() => {
    updateContactInfo();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  updateContactInfo();
}

function updateContactInfo() {
  const header = document.querySelector('[data-testid="conversation-header"]');
  const name = header?.querySelector('span')?.textContent || '-';
  const phone = header?.querySelector('span[title]')?.getAttribute('title') || '-';
  
  const nameEl = document.getElementById('rankito-contact-name');
  const phoneEl = document.getElementById('rankito-contact-phone');
  
  if (nameEl) nameEl.textContent = name;
  if (phoneEl) phoneEl.textContent = phone;
}

async function handleCreateLead() {
  const btn = document.getElementById('rankito-create-lead');
  if (!btn) return;
  
  const header = document.querySelector('[data-testid="conversation-header"]');
  const name = header?.querySelector('span')?.textContent;
  const phone = header?.querySelector('span[title]')?.getAttribute('title');
  
  btn.disabled = true;
  btn.textContent = '⏳ Criando...';
  
  try {
    const response = await fetch('https://jhzmgexprjnpgadkxjup.supabase.co/functions/v1/create-deal-from-whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': apiToken
      },
      body: JSON.stringify({ phone, name })
    });
    
    if (response.ok) {
      btn.textContent = '✅ Lead Criado!';
      setTimeout(() => {
        btn.textContent = '🔥 Criar Lead no CRM';
        btn.disabled = false;
      }, 2000);
    } else {
      throw new Error('Erro ao criar lead');
    }
  } catch (error) {
    btn.textContent = '❌ Erro';
    setTimeout(() => {
      btn.textContent = '🔥 Criar Lead no CRM';
      btn.disabled = false;
    }, 2000);
  }
}

window.addEventListener('message', (event) => {
  if (event.data.type === 'RANKITO_TOKEN_SAVED') {
    chrome.runtime.sendMessage({ action: 'getToken' }, (response) => {
      if (response?.token) {
        apiToken = response.token;
        injectSidebar();
      }
    });
  }
});`;

const sidebarCSS = `.rankito-sidebar {
  position: fixed;
  top: 0;
  right: 0;
  width: 320px;
  height: 100vh;
  background: white;
  border-left: 1px solid #e5e7eb;
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  display: flex;
  flex-direction: column;
}

.rankito-sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

#rankito-close-sidebar {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
}

.rankito-sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

#rankito-contact-info {
  background: #f9fafb;
  padding: 12px;
  border-radius: 8px;
}

.rankito-label {
  font-size: 11px;
  text-transform: uppercase;
  color: #6b7280;
  margin: 0 0 8px 0;
  font-weight: 600;
}

.rankito-primary-btn {
  width: 100%;
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Creating ZIP file...');
    
    const zip = new JSZip();
    
    // Add files to ZIP
    zip.addFile('manifest.json', JSON.stringify(manifest, null, 2));
    zip.folder('background').addFile('service-worker.js', serviceWorkerCode);
    zip.folder('content').addFile('content.js', contentScriptCode);
    zip.folder('content').addFile('sidebar.css', sidebarCSS);
    
    // Generate ZIP
    const zipData = await zip.generateAsync({ type: 'uint8array' });
    
    console.log('ZIP generated successfully');
    
    return new Response(zipData as unknown as BodyInit, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="rankito-whatsapp-extension.zip"',
      },
      status: 200
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error).message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
