const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Conteúdo dos arquivos da extensão
const manifest = {
  manifest_version: 3,
  name: "Rankito CRM - WhatsApp Lead Capture",
  version: "1.0.0",
  description: "Capture leads do WhatsApp Web diretamente no Rankito CRM",
  permissions: ["storage", "tabs"],
  host_permissions: ["https://web.whatsapp.com/*"],
  background: {
    service_worker: "background/service-worker.js",
    type: "module"
  },
  content_scripts: [
    {
      matches: ["https://web.whatsapp.com/*"],
      js: ["content/content.js"],
      css: ["content/sidebar.css"],
      run_at: "document_idle"
    }
  ],
  action: {
    default_title: "Rankito CRM"
  },
  icons: {
    "16": "assets/icon16.png",
    "48": "assets/icon48.png",
    "128": "assets/icon128.png"
  }
};

const serviceWorker = `// Rankito CRM Service Worker
let apiToken = '';
let apiUrl = '';

chrome.storage.local.get(['rankitoToken', 'rankitoApiUrl'], (result) => {
  apiToken = result.rankitoToken || '';
  apiUrl = result.rankitoApiUrl || '';
  updateBadge();
});

function updateBadge() {
  const isConfigured = apiToken && apiUrl;
  chrome.action.setBadgeText({ text: isConfigured ? '✓' : '!' });
  chrome.action.setBadgeBackgroundColor({ color: isConfigured ? '#22c55e' : '#ef4444' });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'RANKITO_CONFIG_UPDATE') {
    apiToken = message.token;
    apiUrl = message.apiUrl;
    updateBadge();
    sendResponse({ success: true });
  }
  
  if (message.type === 'RANKITO_GET_CONFIG') {
    sendResponse({ token: apiToken, apiUrl: apiUrl });
  }
  
  if (message.type === 'RANKITO_CREATE_LEAD') {
    createLead(message.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function createLead(leadData) {
  if (!apiToken || !apiUrl) {
    throw new Error('Extensão não configurada');
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${apiToken}\`
    },
    body: JSON.stringify(leadData)
  });

  if (!response.ok) {
    throw new Error(\`Erro ao criar lead: \${response.status}\`);
  }

  return await response.json();
}

console.log('Rankito CRM Service Worker loaded');`;

const contentScript = `// Rankito CRM Content Script
console.log('Rankito CRM: Content script loaded');

let config = { token: '', apiUrl: '' };

chrome.runtime.sendMessage({ type: 'RANKITO_GET_CONFIG' }, (response) => {
  if (response) {
    config = response;
    console.log('Rankito CRM: Config loaded', config.apiUrl ? 'Configured' : 'Not configured');
  }
});

window.addEventListener('message', (event) => {
  if (event.data.type === 'RANKITO_CONFIGURE') {
    config.token = event.data.token;
    config.apiUrl = event.data.apiUrl;
    
    chrome.storage.local.set({
      rankitoToken: config.token,
      rankitoApiUrl: config.apiUrl
    });
    
    chrome.runtime.sendMessage({
      type: 'RANKITO_CONFIG_UPDATE',
      token: config.token,
      apiUrl: config.apiUrl
    });
    
    window.postMessage({ type: 'RANKITO_TOKEN_SAVED' }, '*');
  }
});

function createSidebar() {
  const sidebar = document.createElement('div');
  sidebar.id = 'rankito-sidebar';
  sidebar.innerHTML = \`
    <div class="rankito-header">
      <h3>Rankito CRM</h3>
    </div>
    <div class="rankito-content">
      <button id="rankito-capture-btn" class="rankito-btn">
        📋 Capturar Lead
      </button>
      <div id="rankito-status"></div>
    </div>
  \`;
  
  document.body.appendChild(sidebar);
  document.getElementById('rankito-capture-btn')?.addEventListener('click', captureLead);
}

async function captureLead() {
  const statusEl = document.getElementById('rankito-status');
  
  if (!config.token || !config.apiUrl) {
    showStatus('❌ Extensão não configurada', 'error');
    return;
  }
  
  try {
    showStatus('⏳ Capturando lead...', 'loading');
    
    const phoneNumber = extractPhoneNumber();
    const contactName = extractContactName();
    const lastMessage = extractLastMessage();
    
    if (!phoneNumber) {
      showStatus('❌ Não foi possível identificar o número', 'error');
      return;
    }
    
    chrome.runtime.sendMessage({
      type: 'RANKITO_CREATE_LEAD',
      data: {
        phone: phoneNumber,
        name: contactName || 'WhatsApp Lead',
        message: lastMessage,
        source: 'whatsapp_extension'
      }
    }, (response) => {
      if (response?.success) {
        showStatus('✅ Lead capturado com sucesso!', 'success');
      } else {
        showStatus(\`❌ Erro: \${response?.error || 'Desconhecido'}\`, 'error');
      }
    });
    
  } catch (error) {
    showStatus(\`❌ Erro: \${error.message}\`, 'error');
  }
}

function extractPhoneNumber() {
  const header = document.querySelector('[data-testid="conversation-header"]');
  const titleSpan = header?.querySelector('span[title]');
  return titleSpan?.getAttribute('title') || '';
}

function extractContactName() {
  const header = document.querySelector('[data-testid="conversation-header"]');
  return header?.querySelector('span')?.textContent || '';
}

function extractLastMessage() {
  const messages = document.querySelectorAll('[data-testid="msg-container"]');
  const lastMsg = messages[messages.length - 1];
  return lastMsg?.querySelector('.selectable-text')?.textContent || '';
}

function showStatus(message, type) {
  const statusEl = document.getElementById('rankito-status');
  if (statusEl) {
    statusEl.textContent = message;
    statusEl.className = \`rankito-status rankito-status-\${type}\`;
    
    if (type !== 'loading') {
      setTimeout(() => {
        statusEl.textContent = '';
        statusEl.className = 'rankito-status';
      }, 3000);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createSidebar);
} else {
  createSidebar();
}`;

const sidebarCSS = `#rankito-sidebar {
  position: fixed;
  right: 0;
  top: 0;
  width: 300px;
  height: 100vh;
  background: white;
  border-left: 1px solid #e5e7eb;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  display: flex;
  flex-direction: column;
}

.rankito-header {
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.rankito-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.rankito-content {
  padding: 16px;
  flex: 1;
}

.rankito-btn {
  width: 100%;
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.rankito-btn:hover {
  transform: translateY(-2px);
}

.rankito-btn:active {
  transform: translateY(0);
}

.rankito-status {
  margin-top: 16px;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
}

.rankito-status-success {
  background: #dcfce7;
  color: #166534;
}

.rankito-status-error {
  background: #fee2e2;
  color: #991b1b;
}

.rankito-status-loading {
  background: #dbeafe;
  color: #1e40af;
}`;

// Criar ZIP manualmente (formato ZIP simplificado)
function createSimpleZip(): Uint8Array {
  const files = [
    { name: 'manifest.json', content: JSON.stringify(manifest, null, 2) },
    { name: 'background/service-worker.js', content: serviceWorker },
    { name: 'content/content.js', content: contentScript },
    { name: 'content/sidebar.css', content: sidebarCSS },
  ];

  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  
  // ZIP file header
  const zipHeader = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
  
  files.forEach(file => {
    const content = encoder.encode(file.content);
    const filename = encoder.encode(file.name);
    
    // Local file header
    chunks.push(zipHeader);
    chunks.push(new Uint8Array([0x14, 0x00])); // Version
    chunks.push(new Uint8Array([0x00, 0x00])); // Flags
    chunks.push(new Uint8Array([0x00, 0x00])); // Compression
    chunks.push(new Uint8Array([0x00, 0x00, 0x00, 0x00])); // Time/Date
    chunks.push(new Uint8Array([0x00, 0x00, 0x00, 0x00])); // CRC32
    
    // Sizes
    const size = content.length;
    chunks.push(new Uint8Array([size & 0xff, (size >> 8) & 0xff, (size >> 16) & 0xff, (size >> 24) & 0xff]));
    chunks.push(new Uint8Array([size & 0xff, (size >> 8) & 0xff, (size >> 16) & 0xff, (size >> 24) & 0xff]));
    
    // Filename length
    chunks.push(new Uint8Array([filename.length & 0xff, (filename.length >> 8) & 0xff]));
    chunks.push(new Uint8Array([0x00, 0x00])); // Extra length
    
    chunks.push(filename);
    chunks.push(content);
  });
  
  // End of central directory
  chunks.push(new Uint8Array([0x50, 0x4b, 0x05, 0x06]));
  chunks.push(new Uint8Array(18).fill(0));
  
  // Concatenar
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  
  chunks.forEach(chunk => {
    result.set(chunk, offset);
    offset += chunk.length;
  });
  
  return result;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Gerando ZIP da extensão...');
    const zipContent = createSimpleZip();
    
    console.log('Fazendo upload para Storage...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Upload usando fetch direto
    const uploadResponse = await fetch(
      `${supabaseUrl}/storage/v1/object/extensions/rankito-whatsapp-extension.zip`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/zip',
          'x-upsert': 'true',
        },
        body: zipContent as unknown as BodyInit,
      }
    );

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      console.error('Erro no upload:', error);
      throw new Error(error);
    }

    console.log('Upload concluído com sucesso!');

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/extensions/rankito-whatsapp-extension.zip`;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Extensão carregada com sucesso!',
        url: publicUrl
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Erro:', error);
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
