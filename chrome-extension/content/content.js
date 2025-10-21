// 🚀 Rankito CRM - WhatsApp Connector - Content Script
// Version 1.0.5 - EXECUÇÃO FORÇADA E FALLBACKS
console.log('[Rankito Content] 🚀 Script loaded on WhatsApp Web - Version 1.0.5');

// Check if we're on WhatsApp Web
if (!window.location.href.includes('web.whatsapp.com')) {
  console.log('[Rankito Content] ⚠️ Not on WhatsApp Web, script will not run');
}

const SUPABASE_URL = 'https://jhzmgexprjnpgadkxjup.supabase.co';
let apiToken = null;
let currentPhone = null;
let lastMessageText = null;

// ============================================
// 🔥 EXECUÇÃO FORÇADA - SEM ESPERAR NADA
// ============================================
console.log('[Rankito Content] ⚡ Scheduling FORCED init in 3 seconds...');

setTimeout(() => {
  console.log('[Rankito Content] ⚡ FORÇANDO INIT AGORA - 3 segundos passados');
  init();
}, 3000);

// Botão de emergência após 3.5 segundos
setTimeout(() => {
  console.log('[Rankito Content] 🆘 Injetando botão de emergência...');
  injectEmergencyButton();
}, 3500);

// ============================================
// 🎯 INIT - PRINCIPAL
// ============================================
async function init() {
  console.log('[Rankito Content] 🚀 Initializing Rankito extension...');
  
  try {
    // 1. Inject sidebar
    console.log('[Rankito Content] 💉 Injecting sidebar into DOM...');
    injectSidebar();
    console.log('[Rankito Content] ✅ Sidebar injected successfully');
    
    // 2. Get token from background
    console.log('[Rankito Content] 🔑 Requesting token from background...');
    chrome.runtime.sendMessage({ action: 'getToken' }, (response) => {
      console.log('[Rankito Content] 📨 Token response:', response);
      
      if (response && response.token) {
        apiToken = response.token;
        console.log('[Rankito Content] ✅ Token found:', apiToken.substring(0, 20) + '...');
        updateConnectionStatus('connected');
      } else {
        console.log('[Rankito Content] ⚠️ No token found, showing setup prompt');
        updateConnectionStatus('disconnected');
        showSetupPromptInSidebar();
      }
    });
    
    // 3. Start observing conversations
    console.log('[Rankito Content] 👀 Starting conversation observer...');
    observeConversationChanges();
    console.log('[Rankito Content] ✅ Observer started');
    
  } catch (error) {
    console.error('[Rankito Content] ❌ Error in init:', error);
    showErrorInSidebar(error.message);
  }
}

// ============================================
// 🆘 BOTÃO DE EMERGÊNCIA FIXO
// ============================================
function injectEmergencyButton() {
  // Check if already exists
  if (document.getElementById('rankito-emergency-btn')) {
    console.log('[Rankito Content] ⚠️ Emergency button already exists');
    return;
  }
  
  const btn = document.createElement('button');
  btn.id = 'rankito-emergency-btn';
  btn.style.cssText = `
    position: fixed !important;
    bottom: 20px !important;
    right: 20px !important;
    z-index: 999999999 !important;
    background: #ef4444 !important;
    color: white !important;
    padding: 16px 24px !important;
    border-radius: 50px !important;
    border: none !important;
    cursor: pointer !important;
    font-weight: bold !important;
    box-shadow: 0 4px 20px rgba(239, 68, 68, 0.5) !important;
    font-size: 14px !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    transition: all 0.3s ease !important;
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
  `;
  btn.innerHTML = '🚀 Configurar Rankito';
  
  btn.onmouseover = () => {
    btn.style.transform = 'scale(1.05)';
    btn.style.boxShadow = '0 6px 30px rgba(239, 68, 68, 0.7)';
  };
  
  btn.onmouseout = () => {
    btn.style.transform = 'scale(1)';
    btn.style.boxShadow = '0 4px 20px rgba(239, 68, 68, 0.5)';
  };
  
  btn.onclick = () => {
    console.log('[Rankito Content] 🆘 Emergency button clicked!');
    showConfigModal();
  };
  
  document.body.appendChild(btn);
  console.log('[Rankito Content] 🆘 Botão de emergência injetado com sucesso');
}

// ============================================
// 🎨 MODAL DE CONFIGURAÇÃO COM FALLBACK
// ============================================
function showConfigModal() {
  console.log('[Rankito Content] 🎨 Opening configuration modal...');
  
  // Remove existing modal
  const existingModal = document.getElementById('rankito-config-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Create modal overlay
  const modal = document.createElement('div');
  modal.id = 'rankito-config-modal';
  modal.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    background: rgba(0, 0, 0, 0.8) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    z-index: 999999999 !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
  `;
  
  // Modal content
  modal.innerHTML = `
    <div style="
      background: white !important;
      padding: 32px !important;
      border-radius: 16px !important;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3) !important;
      max-width: 500px !important;
      width: 90% !important;
      color: #1f2937 !important;
    ">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="font-size: 48px; margin-bottom: 16px;">🚀</div>
        <h2 style="font-size: 24px; font-weight: bold; margin: 0 0 8px 0; color: #1f2937 !important;">
          Configurar Rankito CRM
        </h2>
        <p style="color: #6b7280 !important; margin: 0; font-size: 14px;">
          Cole o token de integração do seu dashboard
        </p>
      </div>
      
      <div style="margin-bottom: 24px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151 !important; font-size: 14px;">
          Token de API
        </label>
        <input 
          type="text" 
          id="rankito-token-input" 
          placeholder="Cole seu token aqui..."
          style="
            width: 100% !important;
            padding: 12px !important;
            border: 2px solid #e5e7eb !important;
            border-radius: 8px !important;
            font-size: 14px !important;
            box-sizing: border-box !important;
            font-family: monospace !important;
            color: #1f2937 !important;
            background: white !important;
          "
        />
      </div>
      
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button 
          id="rankito-cancel-btn"
          style="
            padding: 12px 24px !important;
            border: 2px solid #e5e7eb !important;
            background: white !important;
            color: #6b7280 !important;
            border-radius: 8px !important;
            font-weight: 600 !important;
            cursor: pointer !important;
            font-size: 14px !important;
            transition: all 0.2s !important;
          "
        >
          Cancelar
        </button>
        <button 
          id="rankito-save-btn"
          style="
            padding: 12px 24px !important;
            border: none !important;
            background: #10b981 !important;
            color: white !important;
            border-radius: 8px !important;
            font-weight: 600 !important;
            cursor: pointer !important;
            font-size: 14px !important;
            transition: all 0.2s !important;
          "
        >
          Conectar Extensão
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  console.log('[Rankito Content] ✅ Modal adicionado ao DOM');
  
  // Check if modal is visible after 1 second
  setTimeout(() => {
    const isVisible = modal.offsetWidth > 0 && modal.offsetHeight > 0;
    console.log('[Rankito Content] 🔍 Modal visibility check:', isVisible);
    
    if (!isVisible) {
      console.warn('[Rankito Content] ⚠️ Modal DOM não visível, tentando fallback...');
      modal.remove();
      showPromptFallback();
    }
  }, 1000);
  
  // Event listeners
  const input = document.getElementById('rankito-token-input');
  const saveBtn = document.getElementById('rankito-save-btn');
  const cancelBtn = document.getElementById('rankito-cancel-btn');
  
  input.focus();
  
  saveBtn.onclick = () => {
    const token = input.value.trim();
    console.log('[Rankito Content] 💾 Save button clicked, token length:', token.length);
    
    if (token) {
      chrome.runtime.sendMessage({ 
        action: 'saveToken', 
        token: token 
      }, (response) => {
        console.log('[Rankito Content] 📨 Save token response:', response);
        
        if (response && response.success) {
          apiToken = token;
          modal.remove();
          
          // Remove emergency button
          const emergencyBtn = document.getElementById('rankito-emergency-btn');
          if (emergencyBtn) emergencyBtn.remove();
          
          updateConnectionStatus('connected');
          alert('✅ Extensão conectada com sucesso!');
        }
      });
    } else {
      alert('❌ Por favor, cole um token válido');
    }
  };
  
  cancelBtn.onclick = () => {
    console.log('[Rankito Content] ❌ Cancel button clicked');
    modal.remove();
  };
  
  // Close on overlay click
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  };
  
  // Enter key to save
  input.onkeypress = (e) => {
    if (e.key === 'Enter') {
      saveBtn.click();
    }
  };
}

// ============================================
// 🆘 FALLBACK COM PROMPT NATIVO
// ============================================
function showPromptFallback() {
  console.log('[Rankito Content] 🆘 Usando prompt nativo como fallback');
  
  const token = window.prompt(
    '🚀 Rankito CRM - Configuração\n\n' +
    'Cole o token de API do seu dashboard:'
  );
  
  if (token && token.trim()) {
    console.log('[Rankito Content] 💾 Token recebido via prompt, salvando...');
    
    chrome.runtime.sendMessage({ 
      action: 'saveToken', 
      token: token.trim() 
    }, (response) => {
      console.log('[Rankito Content] 📨 Save token response:', response);
      
      if (response && response.success) {
        apiToken = token.trim();
        
        // Remove emergency button
        const emergencyBtn = document.getElementById('rankito-emergency-btn');
        if (emergencyBtn) emergencyBtn.remove();
        
        updateConnectionStatus('connected');
        alert('✅ Extensão conectada com sucesso!');
      }
    });
  } else {
    console.log('[Rankito Content] ❌ Nenhum token fornecido no prompt');
  }
}

// ============================================
// 💉 INJETAR SIDEBAR
// ============================================
function injectSidebar() {
  // Check if sidebar already exists
  if (document.getElementById('rankito-sidebar')) {
    console.log('[Rankito Content] ⚠️ Sidebar already exists, skipping injection');
    return;
  }
  
  const sidebar = document.createElement('div');
  sidebar.id = 'rankito-sidebar';
  sidebar.className = 'rankito-sidebar';
  
  sidebar.innerHTML = `
    <div class="rankito-header">
      <div class="rankito-logo">🚀 Rankito CRM</div>
      <div id="rankito-status" class="rankito-status">
        <span class="status-dot"></span>
        <span class="status-text">Carregando...</span>
      </div>
    </div>
    <div class="rankito-content" id="rankito-content">
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Inicializando...</p>
      </div>
    </div>
  `;
  
  document.body.appendChild(sidebar);
  console.log('[Rankito Content] ✅ Sidebar structure created');
}

// ============================================
// 🎨 SETUP PROMPT IN SIDEBAR
// ============================================
function showSetupPromptInSidebar() {
  const content = document.getElementById('rankito-content');
  if (!content) return;
  
  content.innerHTML = `
    <div class="setup-prompt">
      <div class="setup-icon">⚙️</div>
      <h3>Configure a Extensão</h3>
      <p>Para começar a capturar leads, você precisa conectar sua extensão ao Rankito CRM.</p>
      
      <button class="btn-primary" id="open-config-btn">
        🔑 Configurar Token Agora
      </button>
      
      <div class="setup-instructions">
        <p><strong>Como obter o token:</strong></p>
        <ol>
          <li>Abra o Dashboard do Rankito</li>
          <li>Vá em Integrações</li>
          <li>Crie uma integração "Extensão Chrome"</li>
          <li>Copie o token gerado</li>
        </ol>
      </div>
    </div>
  `;
  
  document.getElementById('open-config-btn').onclick = showConfigModal;
}

// ============================================
// ❌ ERROR IN SIDEBAR
// ============================================
function showErrorInSidebar(errorMsg) {
  const content = document.getElementById('rankito-content');
  if (!content) return;
  
  content.innerHTML = `
    <div class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Erro de Conexão</h3>
      <p>${errorMsg}</p>
      <button class="btn-secondary" onclick="location.reload()">
        🔄 Recarregar Página
      </button>
    </div>
  `;
}

// ============================================
// 🔌 UPDATE CONNECTION STATUS
// ============================================
function updateConnectionStatus(status) {
  const statusElement = document.getElementById('rankito-status');
  if (!statusElement) return;
  
  const statusDot = statusElement.querySelector('.status-dot');
  const statusText = statusElement.querySelector('.status-text');
  
  if (status === 'connected') {
    statusDot.className = 'status-dot status-connected';
    statusText.textContent = 'Conectado';
  } else if (status === 'disconnected') {
    statusDot.className = 'status-dot status-disconnected';
    statusText.textContent = 'Desconectado';
  } else {
    statusDot.className = 'status-dot status-loading';
    statusText.textContent = 'Carregando...';
  }
}

// ============================================
// 👀 OBSERVE CONVERSATION CHANGES
// ============================================
function observeConversationChanges() {
  const observer = new MutationObserver(() => {
    updateContactInfo();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Initial update
  updateContactInfo();
}

// ============================================
// 📱 UPDATE CONTACT INFO
// ============================================
function updateContactInfo() {
  try {
    // Try to get contact name from header
    const headerSelectors = [
      '[data-testid="conversation-header"] span[title]',
      'header span[title]',
      '[data-testid="conversation-info-header"] span',
      'header [role="button"] span'
    ];
    
    let contactName = null;
    for (const selector of headerSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent) {
        contactName = element.textContent.trim();
        if (contactName) break;
      }
    }
    
    // Try to get phone number
    let phoneNumber = null;
    const urlMatch = window.location.href.match(/\/(\d+)$/);
    if (urlMatch) {
      phoneNumber = '+' + urlMatch[1];
    }
    
    if (!contactName || !phoneNumber) {
      console.log('[Rankito Content] ⚠️ Could not extract contact info');
      return;
    }
    
    // Only update if changed
    if (phoneNumber === currentPhone) return;
    
    currentPhone = phoneNumber;
    console.log('[Rankito Content] 📱 Contact updated:', contactName, phoneNumber);
    
    // Get last message
    const messages = document.querySelectorAll('[data-testid="msg-container"]');
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const textElement = lastMessage.querySelector('.copyable-text span');
      if (textElement) {
        lastMessageText = textElement.textContent;
      }
    }
    
    // Load history if we have token
    if (apiToken) {
      loadHistory(phoneNumber);
    }
    
  } catch (error) {
    console.error('[Rankito Content] ❌ Error updating contact:', error);
  }
}

// ============================================
// 📊 LOAD HISTORY
// ============================================
async function loadHistory(phone) {
  if (!apiToken) return;
  
  const content = document.getElementById('rankito-content');
  if (!content) return;
  
  content.innerHTML = `
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Carregando histórico...</p>
    </div>
  `;
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/get-whatsapp-history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': apiToken
      },
      body: JSON.stringify({ phone })
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        // No deals found
        renderHistory([]);
      } else {
        throw new Error('Erro ao carregar histórico');
      }
    } else {
      const data = await response.json();
      renderHistory(data.deals || []);
    }
  } catch (error) {
    console.error('[Rankito Content] ❌ Error loading history:', error);
    content.innerHTML = `
      <div class="error-state">
        <p>Erro ao carregar histórico</p>
      </div>
    `;
  }
}

// ============================================
// 🎨 RENDER HISTORY
// ============================================
function renderHistory(deals) {
  const content = document.getElementById('rankito-content');
  if (!content) return;
  
  if (deals.length === 0) {
    content.innerHTML = `
      <div class="contact-info">
        <div class="contact-header">
          <div class="contact-avatar">👤</div>
          <div class="contact-details">
            <div class="contact-phone">${currentPhone}</div>
          </div>
        </div>
        
        <div class="no-history">
          <div class="empty-icon">📭</div>
          <p>Nenhum histórico encontrado</p>
          <p class="empty-subtitle">Crie o primeiro lead agora!</p>
        </div>
        
        <button class="btn-create-lead" id="create-lead-btn">
          🔥 Criar Lead no CRM
        </button>
      </div>
    `;
    
    document.getElementById('create-lead-btn').onclick = handleCreateLead;
    return;
  }
  
  const dealsHTML = deals.map(deal => `
    <div class="deal-card">
      <div class="deal-header">
        <span class="deal-status">${deal.status}</span>
        <span class="deal-date">${new Date(deal.created_at).toLocaleDateString('pt-BR')}</span>
      </div>
      <div class="deal-title">${deal.title}</div>
      ${deal.notes ? `<div class="deal-notes">${deal.notes}</div>` : ''}
    </div>
  `).join('');
  
  content.innerHTML = `
    <div class="contact-info">
      <div class="contact-header">
        <div class="contact-avatar">👤</div>
        <div class="contact-details">
          <div class="contact-phone">${currentPhone}</div>
          <div class="deal-count">${deals.length} negociação(ões)</div>
        </div>
      </div>
      
      <div class="deals-list">
        ${dealsHTML}
      </div>
      
      <button class="btn-create-lead" id="create-lead-btn">
        ➕ Criar Nova Negociação
      </button>
    </div>
  `;
  
  document.getElementById('create-lead-btn').onclick = handleCreateLead;
}

// ============================================
// 🔥 CREATE LEAD
// ============================================
async function handleCreateLead() {
  if (!apiToken || !currentPhone) {
    alert('❌ Informações incompletas');
    return;
  }
  
  const btn = document.getElementById('create-lead-btn');
  const originalText = btn.textContent;
  btn.textContent = '⏳ Criando...';
  btn.disabled = true;
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-deal-from-whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': apiToken
      },
      body: JSON.stringify({
        phone: currentPhone,
        message: lastMessageText || 'Novo lead do WhatsApp'
      })
    });
    
    if (!response.ok) throw new Error('Erro ao criar lead');
    
    const data = await response.json();
    alert('✅ Lead criado com sucesso!');
    
    // Reload history
    loadHistory(currentPhone);
    
  } catch (error) {
    console.error('[Rankito Content] ❌ Error creating lead:', error);
    alert('❌ Erro ao criar lead: ' + error.message);
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

// ============================================
// 📨 MESSAGE LISTENER
// ============================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Rankito Content] 📨 Message received:', message.action);
  
  if (message.action === 'toggleSidebar') {
    const sidebar = document.getElementById('rankito-sidebar');
    if (sidebar) {
      sidebar.classList.toggle('hidden');
    }
    sendResponse({ success: true });
  }
  
  if (message.action === 'updateToken') {
    apiToken = message.token;
    updateConnectionStatus('connected');
    
    // Remove emergency button
    const emergencyBtn = document.getElementById('rankito-emergency-btn');
    if (emergencyBtn) emergencyBtn.remove();
    
    if (currentPhone) {
      loadHistory(currentPhone);
    }
    sendResponse({ success: true });
  }
  
  return true;
});

console.log('[Rankito Content] ✅ Script fully loaded and waiting for forced init');
