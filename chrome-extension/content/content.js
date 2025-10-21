// 🚀 RANKITO CRM - Content Script para WhatsApp Web
console.log('[Rankito Content] 🚀 Script loaded on WhatsApp Web - Version 1.0.4');

const DEBUG = true;
const log = (...args) => DEBUG && console.log('[Rankito Content]', ...args);
const logError = (...args) => console.error('[Rankito Content]', ...args);

// Content Script for WhatsApp Web Integration
const SUPABASE_URL = 'https://jhzmgexprjnpgadkxjup.supabase.co';

let sidebarInjected = false;
let currentContact = { name: null, phone: null };
let apiToken = null;

// Verificar se está no WhatsApp Web
if (!window.location.hostname.includes('web.whatsapp.com')) {
  log('⚠️ Not on WhatsApp Web, stopping initialization');
} else {
  log('✅ On WhatsApp Web, proceeding with initialization');
  waitForWhatsAppReady().then(ready => {
    if (ready) init();
  });
}

// Wait for WhatsApp Web to be fully loaded with EXTENDED timeout
async function waitForWhatsAppReady(maxRetries = 30) {
  log('⏳ Aguardando WhatsApp Web carregar (até 15 segundos)...');
  
  for (let i = 0; i < maxRetries; i++) {
    const mainPanel = document.querySelector('[data-testid="conversation-panel-wrapper"]') ||
                     document.querySelector('div[role="main"]') ||
                     document.querySelector('#pane-side') ||
                     document.querySelector('[data-testid="chat-list"]') ||
                     document.querySelector('#main');
    
    if (mainPanel) {
      log('✅ WhatsApp Web is ready');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Extra stability wait
      return true;
    }
    
    log(`⏳ Tentativa ${i + 1}/${maxRetries}...`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  logError('❌ WhatsApp Web did not load in time');
  return false;
}

// Main initialization with AUTO-OPEN sidebar
async function init() {
  log('🚀 Initializing Rankito extension...');
  
  // Inject sidebar FIRST
  injectSidebar();
  
  // FORCE sidebar to be visible immediately
  setTimeout(() => {
    const sidebar = document.getElementById('rankito-sidebar');
    if (sidebar) {
      sidebar.style.display = 'flex';
      sidebar.style.right = '0';
      log('✅ Sidebar forçada a abrir automaticamente');
    }
  }, 500);
  
  // Get token from background
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getToken' });
    apiToken = response?.token;
    
    log('🔑 Token status:', apiToken ? `Present (${apiToken.substring(0, 10)}...)` : 'Not configured');
    
    if (!apiToken) {
      log('⚠️ No token found, showing setup prompt');
      showSetupPromptInSidebar();
      return;
    }
    
    log('✅ Token loaded successfully');
    updateConnectionStatus('connected');
    
    // Start observing conversations
    observeConversationChanges();
    
    // Force first contact update
    setTimeout(() => updateContactInfo(), 1000);
    
  } catch (error) {
    logError('❌ Error getting token:', error);
    showSetupPromptInSidebar();
  }
}

// Show configuration modal with FORCED inline styles
function showConfigModal() {
  log('📝 Mostrando modal de configuração');
  
  // Remove existing modal if present
  const existingModal = document.getElementById('rankito-config-modal');
  const existingBackdrop = document.getElementById('rankito-config-backdrop');
  if (existingModal) existingModal.remove();
  if (existingBackdrop) existingBackdrop.remove();
  log('🗑️ Modais anteriores removidos');
  
  // Create backdrop with FORCED inline styles
  const backdrop = document.createElement('div');
  backdrop.id = 'rankito-config-backdrop';
  backdrop.className = 'rankito-config-backdrop';
  backdrop.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    background: rgba(0, 0, 0, 0.8) !important;
    z-index: 999999999 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  `;
  
  // Create modal with FORCED inline styles
  const modal = document.createElement('div');
  modal.id = 'rankito-config-modal';
  modal.className = 'rankito-config-modal';
  modal.style.cssText = `
    position: fixed !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    background: white !important;
    border-radius: 12px !important;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5) !important;
    z-index: 9999999999 !important;
    width: 90% !important;
    max-width: 500px !important;
    max-height: 90vh !important;
    overflow: auto !important;
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
  `;
  
  modal.innerHTML = `
    <div class="rankito-config-header" style="padding: 24px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
      <h2 style="margin: 0; font-size: 20px; font-weight: 600; color: #111827;">🚀 Configurar Rankito CRM</h2>
      <button class="rankito-config-close" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px; transition: all 0.2s;">×</button>
    </div>
    
    <div class="rankito-config-body" style="padding: 24px;">
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500; color: #374151;">
          Token de API
        </label>
        <textarea 
          id="rankito-token-input" 
          placeholder="Cole aqui o token gerado no Rankito CRM..." 
          style="width: 100%; min-height: 120px; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-family: monospace; font-size: 13px; resize: vertical; box-sizing: border-box;"
        ></textarea>
      </div>
      
      <div style="padding: 12px; background: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 6px; margin-bottom: 16px;">
        <p style="margin: 0; font-size: 13px; color: #1e40af; line-height: 1.5;">
          <strong>💡 Como obter o token:</strong><br>
          1. Acesse o Rankito CRM<br>
          2. Vá em Configurações → Integrações<br>
          3. Copie o token gerado
        </p>
      </div>
      
      <div class="rankito-config-actions" style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="rankito-cancel-btn" class="rankito-btn-secondary" style="padding: 10px 20px; border: 1px solid #d1d5db; border-radius: 8px; background: white; color: #374151; font-weight: 500; cursor: pointer; transition: all 0.2s;">
          Cancelar
        </button>
        <button id="rankito-save-token-btn" class="rankito-btn-primary" style="padding: 10px 20px; border: none; border-radius: 8px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; font-weight: 500; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);">
          💾 Salvar Token
        </button>
      </div>
    </div>
  `;
  
  // Add to DOM
  document.body.appendChild(backdrop);
  document.body.appendChild(modal);
  
  log('✅ Modal adicionado ao DOM');
  
  // Verify visibility after 100ms
  setTimeout(() => {
    const isVisible = modal.offsetWidth > 0 && modal.offsetHeight > 0;
    const rect = modal.getBoundingClientRect();
    log(`✅ Modal is visible: ${isVisible}`);
    log(`✅ Modal dimensions: ${rect.width}px x ${rect.height}px`);
    log(`✅ Modal position: top=${rect.top}px, left=${rect.left}px`);
  }, 100);
  
  // Event listeners
  const closeBtn = modal.querySelector('.rankito-config-close');
  const cancelBtn = modal.querySelector('#rankito-cancel-btn');
  const saveBtn = modal.querySelector('#rankito-save-token-btn');
  const tokenInput = modal.querySelector('#rankito-token-input');
  
  const closeModal = () => {
    backdrop.remove();
    modal.remove();
    log('❌ Modal fechado');
  };
  
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  
  backdrop.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => e.stopPropagation());
  
  if (saveBtn && tokenInput) {
    saveBtn.addEventListener('click', () => {
      const token = tokenInput.value.trim();
      if (!token) {
        alert('Por favor, insira o token');
        return;
      }
      
      log('💾 Salvando token...');
      chrome.runtime.sendMessage({ 
        action: 'saveToken', 
        token: token 
      }, (response) => {
        if (response && response.success) {
          log('✅ Token salvo com sucesso');
          apiToken = token;
          closeModal();
          updateConnectionStatus('connected');
          observeConversationChanges();
          updateContactInfo();
        }
      });
    });
  }
}

// Show ENHANCED setup prompt in sidebar when no token
function showSetupPromptInSidebar() {
  const content = document.getElementById('rankito-sidebar-content');
  if (!content) return;
  
  content.innerHTML = `
    <div style="text-align: center; padding: 32px 20px;">
      <div style="font-size: 64px; margin-bottom: 24px; animation: pulse 2s infinite;">🔌</div>
      <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 20px; font-weight: 700;">
        Configure sua Extensão
      </h3>
      <p style="color: #6b7280; font-size: 15px; line-height: 1.7; margin-bottom: 28px;">
        Conecte ao Rankito CRM para começar a capturar leads automaticamente do WhatsApp
      </p>
      <button 
        id="rankito-open-config-btn"
        style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; padding: 16px 32px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 16px; box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4); transition: all 0.3s; width: 100%; max-width: 280px;"
        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(59, 130, 246, 0.5)';"
        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 6px 20px rgba(59, 130, 246, 0.4)';"
      >
        🚀 Configurar Token Agora
      </button>
      <p style="color: #9ca3af; font-size: 12px; margin-top: 20px; line-height: 1.5;">
        O token está disponível em:<br>
        <strong>Rankito CRM → Integrações</strong>
      </p>
    </div>
  `;
  
  const configBtn = document.getElementById('rankito-open-config-btn');
  if (configBtn) {
    configBtn.addEventListener('click', () => {
      log('🖱️ Botão CONFIGURAR clicado');
      showConfigModal();
    });
  }
}

// Mostrar erro na sidebar
function showErrorInSidebar(errorMsg) {
  const sidebar = document.getElementById('rankito-sidebar');
  if (!sidebar) return;
  
  const content = sidebar.querySelector('.rankito-sidebar-content');
  if (!content) return;
  
  content.innerHTML = `
    <div style="padding: 20px; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
      <h3 style="margin-bottom: 12px; font-size: 16px; font-weight: 600; color: #dc2626;">Erro ao Inicializar</h3>
      <p style="color: #666; margin-bottom: 12px; font-size: 14px;">
        ${errorMsg}
      </p>
      <button 
        onclick="location.reload()"
        style="
          width: 100%;
          padding: 12px;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
        "
      >
        Recarregar Página
      </button>
    </div>
  `;
}

// Inject sidebar into WhatsApp Web
function injectSidebar() {
  if (sidebarInjected) return;
  
  log('💉 Injecting sidebar into DOM...');
  
  const sidebar = document.createElement('div');
  sidebar.id = 'rankito-sidebar';
  sidebar.className = 'rankito-sidebar';
  
  sidebar.innerHTML = `
    <div class="rankito-sidebar-header">
      <div class="header-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <span>Rankito CRM</span>
      </div>
      <div id="connection-status" class="connection-status">
        <span class="status-indicator status-loading"></span>
        <span class="status-text">Carregando...</span>
      </div>
      <button id="rankito-close-sidebar" title="Fechar">×</button>
    </div>
    <div class="rankito-sidebar-content" id="rankito-sidebar-content">
      <div id="rankito-contact-info">
        <p class="rankito-label">Contato detectado:</p>
        <h4 id="rankito-contact-name">—</h4>
        <div id="rankito-contact-phone">
          <span id="phone-display">Detectando número...</span>
          <button id="manual-phone-btn" class="manual-phone-btn" style="display: none;">📝 Inserir manualmente</button>
        </div>
      </div>
      
      <button id="rankito-create-lead-btn" class="rankito-primary-btn">
        🔥 Criar Lead no CRM
      </button>
      
      <div id="rankito-lead-history">
        <p class="rankito-label">Histórico no CRM:</p>
        <div id="rankito-history-list">
          <div class="rankito-loading">Carregando...</div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(sidebar);
  sidebarInjected = true;
  
  log('✅ Sidebar injected successfully');
  
  // Update status after 500ms
  setTimeout(() => {
    updateConnectionStatus(apiToken ? 'connected' : 'disconnected');
  }, 500);
  
  // Add event listeners
  document.getElementById('rankito-close-sidebar')?.addEventListener('click', () => {
    sidebar.style.display = 'none';
  });
  
  document.getElementById('rankito-create-lead-btn')?.addEventListener('click', handleCreateLead);
}

// Update connection status in sidebar
function updateConnectionStatus(status) {
  const statusIndicator = document.querySelector('#connection-status .status-indicator');
  const statusText = document.querySelector('#connection-status .status-text');
  
  if (!statusIndicator || !statusText) return;
  
  statusIndicator.className = 'status-indicator';
  
  if (status === 'connected') {
    statusIndicator.classList.add('status-connected');
    statusText.textContent = 'Conectado';
  } else if (status === 'disconnected') {
    statusIndicator.classList.add('status-disconnected');
    statusText.textContent = 'Desconectado';
  } else {
    statusIndicator.classList.add('status-loading');
    statusText.textContent = 'Carregando...';
  }
}

// Observe conversation changes
function observeConversationChanges() {
  const observer = new MutationObserver(() => {
    updateContactInfo();
  });
  
  // Watch for changes in the main chat area
  const targetNode = document.querySelector('#main');
  if (targetNode) {
    observer.observe(targetNode, { 
      childList: true, 
      subtree: true 
    });
    log('👀 Observing conversation changes');
  }
}

// Extract contact info from WhatsApp UI
function updateContactInfo() {
  try {
    log('🔍 Updating contact info...');
    
    // METHOD 1: Get contact name from header
    const headerSelectors = [
      'header span[title]',
      'header div[title]',
      'header span[dir="auto"]',
      '[data-testid="conversation-info-header"] span'
    ];
    
    let name = null;
    for (const selector of headerSelectors) {
      const el = document.querySelector(selector);
      if (el?.textContent && el.textContent.length > 0) {
        name = el.textContent.trim();
        log('📝 Name found:', name);
        break;
      }
    }
    
    if (!name) name = 'Contato não identificado';
    
    // METHOD 2: Extract phone from URL (most reliable)
    let phone = null;
    const urlMatch = window.location.href.match(/\/(\d{10,15})/);
    if (urlMatch) {
      phone = urlMatch[1];
      log('✅ Phone found in URL:', phone);
    }
    
    // METHOD 3: Try to find phone in header title attribute
    if (!phone) {
      log('🔍 Trying header title attribute...');
      const headerTitle = document.querySelector('[data-testid="conversation-info-header"]');
      if (headerTitle) {
        const titleAttr = headerTitle.getAttribute('title') || headerTitle.textContent;
        const phoneMatch = titleAttr?.match(/\+?(\d{10,15})/);
        if (phoneMatch) {
          phone = phoneMatch[1];
          log('✅ Phone found in header:', phone);
        }
      }
    }
    
    // METHOD 4: Look for phone in any span with digits
    if (!phone) {
      log('🔍 Searching for phone in spans...');
      const phoneElements = document.querySelectorAll('span[dir="ltr"]');
      for (const el of phoneElements) {
        const text = el.textContent;
        if (text && /^\+?\d[\d\s\-\(\)]{8,}$/.test(text)) {
          const cleanPhone = text.replace(/\D/g, '');
          if (cleanPhone.length >= 10 && cleanPhone.length <= 15) {
            phone = cleanPhone;
            log('✅ Phone found in span:', phone);
            break;
          }
        }
      }
    }
    
    log('📞 Final contact:', { name, phone });
    
    // Update connection status
    updateConnectionStatus(apiToken ? 'connected' : 'disconnected');
    
    // Update UI only if there's new info
    if (name !== currentContact.name || phone !== currentContact.phone) {
      currentContact = { name, phone };
      
      const nameEl = document.getElementById('rankito-contact-name');
      const phoneDisplay = document.getElementById('phone-display');
      const manualBtn = document.getElementById('manual-phone-btn');
      
      if (nameEl) nameEl.textContent = name;
      
      if (phoneDisplay && manualBtn) {
        if (phone) {
          phoneDisplay.innerHTML = `<span style="color: #22c55e;">✅ ${phone}</span>`;
          manualBtn.style.display = 'none';
        } else {
          phoneDisplay.innerHTML = '<span style="color: #f59e0b;">⚠️ Não detectado</span>';
          manualBtn.style.display = 'inline-block';
          
          // Add click handler for manual input
          manualBtn.onclick = () => {
            const manualPhone = prompt('Digite o número do telefone (somente números, 10-15 dígitos):');
            if (manualPhone) {
              const cleanPhone = manualPhone.replace(/\D/g, '');
              if (cleanPhone.length >= 10 && cleanPhone.length <= 15) {
                currentContact.phone = cleanPhone;
                phoneDisplay.innerHTML = `<span style="color: #22c55e;">✅ ${cleanPhone}</span>`;
                manualBtn.style.display = 'none';
                loadHistory(cleanPhone);
              } else {
                alert('❌ Número inválido. Use apenas números (10-15 dígitos).');
              }
            }
          };
        }
      }
      
      log('✅ Contact updated:', currentContact);
      
      // Load history if we have a phone
      if (phone) {
        loadHistory(phone);
      } else {
        const historyDiv = document.getElementById('rankito-history-list');
        if (historyDiv) {
          historyDiv.innerHTML = '<p class="rankito-empty">⚠️ Insira o telefone manualmente para carregar histórico</p>';
        }
      }
    }
  } catch (error) {
    logError('❌ Error updating contact:', error);
  }
}

// Load CRM history for contact
async function loadHistory(phone) {
  log('📋 Loading history for:', phone);
  
  if (!apiToken) {
    log('⚠️ No API token, cannot load history');
    return;
  }
  
  const historyDiv = document.getElementById('rankito-history-list');
  if (!historyDiv) return;
  
  historyDiv.innerHTML = '<div class="rankito-loading">Carregando histórico...</div>';
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/get-whatsapp-history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': apiToken
      },
      body: JSON.stringify({ phone })
    });
    
    if (response.ok) {
      const data = await response.json();
      log('✅ History loaded:', data);
      renderHistory(data.deals || []);
    } else if (response.status === 404) {
      historyDiv.innerHTML = '<p class="rankito-empty">Nenhum histórico encontrado</p>';
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    logError('❌ Error loading history:', error);
    historyDiv.innerHTML = '<p class="rankito-error">Erro ao carregar histórico</p>';
  }
}

// Render history in sidebar
function renderHistory(deals) {
  const historyDiv = document.getElementById('rankito-history-list');
  if (!historyDiv) return;
  
  if (!deals || deals.length === 0) {
    historyDiv.innerHTML = '<p class="rankito-empty">Nenhum histórico encontrado</p>';
    return;
  }
  
  historyDiv.innerHTML = deals.map(deal => `
    <div class="history-item">
      <div class="history-header">
        <span class="history-badge badge-${deal.stage?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}">
          ${deal.stage || 'Unknown'}
        </span>
        <span class="history-date">${new Date(deal.created_at).toLocaleDateString('pt-BR')}</span>
      </div>
      <div class="history-title">${deal.title || 'Sem título'}</div>
      ${deal.notes ? `<div class="history-notes">${deal.notes}</div>` : ''}
    </div>
  `).join('');
}

// Handle create lead button click
async function handleCreateLead() {
  log('🔥 Create lead button clicked');
  
  if (!apiToken) {
    alert('❌ Token não configurado. Configure primeiro.');
    showConfigModal();
    return;
  }
  
  if (!currentContact.phone) {
    alert('❌ Número de telefone não detectado. Por favor, insira manualmente.');
    return;
  }
  
  const btn = document.getElementById('rankito-create-lead-btn');
  if (!btn) return;
  
  const originalText = btn.innerHTML;
  btn.innerHTML = '⏳ Criando...';
  btn.disabled = true;
  
  try {
    // Get last message from chat
    const messages = document.querySelectorAll('[data-testid="msg-container"]');
    const lastMessage = messages[messages.length - 1]?.textContent || '';
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-deal-from-whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': apiToken
      },
      body: JSON.stringify({
        phone: currentContact.phone,
        name: currentContact.name,
        lastMessage: lastMessage.substring(0, 500)
      })
    });
    
    if (response.ok) {
      log('✅ Lead created successfully');
      btn.innerHTML = '✅ Lead Criado!';
      
      // Reload history
      setTimeout(() => {
        loadHistory(currentContact.phone);
        btn.innerHTML = originalText;
        btn.disabled = false;
      }, 2000);
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    logError('❌ Error creating lead:', error);
    alert('❌ Erro ao criar lead. Tente novamente.');
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  log('📨 Message received:', message.action);
  
  if (message.action === 'toggleSidebar') {
    const sidebar = document.getElementById('rankito-sidebar');
    if (sidebar) {
      sidebar.style.display = sidebar.style.display === 'none' ? 'flex' : 'none';
      log('🔄 Sidebar toggled');
    }
    sendResponse({ success: true });
  }
  
  if (message.action === 'saveToken') {
    apiToken = message.token;
    log('✅ Token updated from message');
    updateConnectionStatus('connected');
    observeConversationChanges();
    updateContactInfo();
    sendResponse({ success: true });
  }
  
  return true;
});
