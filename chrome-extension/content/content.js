// 🚀 RANKITO CRM - Content Script para WhatsApp Web
console.log('[Rankito Content] 🚀 Script loaded on WhatsApp Web - Version 1.0.2');

const DEBUG = true;
const MAX_RETRIES = 3;
let retryCount = 0;

// Content Script for WhatsApp Web Integration
const SUPABASE_URL = 'https://jhzmgexprjnpgadkxjup.supabase.co';

function debugLog(...args) {
  if (DEBUG) {
    console.log('[Rankito Content]', ...args);
  }
}

let sidebarInjected = false;
let currentContact = { name: null, phone: null };
let apiToken = null;

// Verificar se está no WhatsApp Web
if (!window.location.hostname.includes('web.whatsapp.com')) {
  console.log('[Rankito Content] ⚠️ Not on WhatsApp Web, stopping initialization');
} else {
  console.log('[Rankito Content] ✅ On WhatsApp Web, proceeding with initialization');
  
  // Aguardar WhatsApp carregar completamente antes de inicializar
  waitForWhatsAppReady();
}

// Função para aguardar WhatsApp estar realmente pronto
function waitForWhatsAppReady() {
  console.log('[Rankito Content] ⏳ Waiting for WhatsApp Web to be fully loaded...');
  
  const checkReady = setInterval(() => {
    // Verificar se elementos principais do WhatsApp existem
    const hasMainElement = document.querySelector('[data-testid="conversation-panel-wrapper"]') || 
                          document.querySelector('#main') ||
                          document.querySelector('[role="main"]');
    
    if (hasMainElement || retryCount >= MAX_RETRIES) {
      clearInterval(checkReady);
      
      if (hasMainElement) {
        console.log('[Rankito Content] ✅ WhatsApp Web is ready, initializing extension...');
        setTimeout(() => init(), 1000); // Delay adicional de 1s para segurança
      } else {
        console.warn('[Rankito Content] ⚠️ WhatsApp not ready after max retries, trying anyway...');
        init();
      }
    } else {
      retryCount++;
      console.log(`[Rankito Content] ⏳ Retry ${retryCount}/${MAX_RETRIES}...`);
    }
  }, 2000); // Verificar a cada 2 segundos
}

// Inicializar extensão
async function init() {
  try {
    console.log('[Rankito Content] 🔧 Initializing extension...');
    
    // SEMPRE injetar sidebar primeiro (mesmo sem token)
    injectSidebar();
    
    // Buscar token salvo
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getToken' });
      apiToken = response?.token;
      
      console.log('[Rankito Content] 🔑 Token status:', apiToken ? `Present (${apiToken.substring(0, 10)}...)` : 'Not configured');
    } catch (err) {
      console.warn('[Rankito Content] ⚠️ Could not get token from background:', err);
    }
    
    // Atualizar UI da sidebar baseado no token
    if (!apiToken) {
      console.log('[Rankito Content] ⚠️ No token configured, showing setup prompt in sidebar');
      showSetupPromptInSidebar();
    } else {
      console.log('[Rankito Content] ✅ Token found, starting monitoring');
      observeConversationChanges();
      
      // Force first contact update
      setTimeout(() => {
        debugLog('🔄 Forcing first contact update...');
        updateContactInfo();
      }, 1000);
    }
    
    console.log('[Rankito Content] ✅ Extension fully initialized');
  } catch (error) {
    console.error('[Rankito Content] ❌ Critical initialization error:', error);
    
    // Mesmo com erro, tentar injetar sidebar
    if (!document.getElementById('rankito-sidebar')) {
      injectSidebar();
      showErrorInSidebar(error.message);
    }
  }
}

// Show configuration modal
function showConfigModal() {
  const modal = document.createElement('div');
  modal.id = 'rankito-config-modal';
  modal.className = 'rankito-config-modal';
  
  modal.innerHTML = `
    <div class="rankito-config-backdrop"></div>
    <div class="rankito-config-content">
      <div class="rankito-config-header">
        <h2>🔥 Rankito CRM - Configuração</h2>
        <p>Cole seu token de API para começar a usar</p>
      </div>
      
      <div class="rankito-config-body">
        <label for="rankito-token-input">Token de API:</label>
        <textarea 
          id="rankito-token-input" 
          placeholder="Cole seu token aqui..."
          rows="3"
        ></textarea>
        
        <div class="rankito-config-actions">
          <button id="rankito-paste-btn" class="rankito-btn-secondary">
            📋 Colar da Área de Transferência
          </button>
          <button id="rankito-save-token-btn" class="rankito-btn-primary">
            ✅ Salvar e Conectar
          </button>
        </div>
        
        <p class="rankito-config-help">
          💡 <strong>Onde encontrar o token?</strong><br>
          Acesse o Dashboard do Rankito → Integrações → Extensão Chrome → Copiar Token
        </p>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Add event listeners
  document.getElementById('rankito-paste-btn')?.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      const input = document.getElementById('rankito-token-input');
      if (input) input.value = text;
      alert('✅ Token colado!');
    } catch (error) {
      alert('❌ Erro ao ler área de transferência. Cole manualmente com Ctrl+V');
    }
  });
  
  document.getElementById('rankito-save-token-btn')?.addEventListener('click', async () => {
    const input = document.getElementById('rankito-token-input');
    const token = input?.value.trim();
    
    if (!token) {
      alert('⚠️ Por favor, insira um token válido');
      return;
    }
    
    // Save token
    chrome.runtime.sendMessage({ 
      action: 'saveToken', 
      token 
    }, (response) => {
      if (response?.success) {
        apiToken = token;
        modal.remove();
        
        // Atualizar status e inicializar
        updateConnectionStatus('connected');
        observeConversationChanges();
        updateContactInfo();
        
        alert('✅ Token configurado com sucesso!');
      } else {
        alert('❌ Erro ao salvar token');
      }
    });
  });
}

// Mostrar prompt de configuração na sidebar
function showSetupPromptInSidebar() {
  const sidebar = document.getElementById('rankito-sidebar');
  if (!sidebar) return;
  
  const content = sidebar.querySelector('.rankito-sidebar-content');
  if (!content) return;
  
  content.innerHTML = `
    <div style="padding: 20px; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 16px;">🔧</div>
      <h3 style="margin-bottom: 12px; font-size: 16px; font-weight: 600;">Configure sua Extensão</h3>
      <p style="color: #666; margin-bottom: 20px; font-size: 14px;">
        Para começar a capturar leads do WhatsApp, você precisa configurar seu token de API.
      </p>
      <button 
        id="rankito-open-config-btn"
        style="
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
        "
      >
        Configurar Token
      </button>
    </div>
  `;
  
  // Listener para abrir modal
  document.getElementById('rankito-open-config-btn')?.addEventListener('click', () => {
    showConfigModal();
  });
  
  updateConnectionStatus('disconnected');
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
  
  debugLog('💉 Injecting sidebar into DOM...');
  
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
    <div class="rankito-sidebar-content">
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
  
  console.log('[Rankito Content] ✅ Sidebar injected successfully');
  
  // Atualizar status após 500ms
  setTimeout(() => {
    updateConnectionStatus(apiToken ? 'connected' : 'disconnected');
  }, 500);
  
  // Add event listeners
  document.getElementById('rankito-close-sidebar')?.addEventListener('click', () => {
    sidebar.style.display = 'none';
  });
  
  document.getElementById('rankito-create-lead-btn')?.addEventListener('click', handleCreateLead);
}

// Atualizar status de conexão na sidebar
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
    debugLog('👀 Observing conversation changes');
  }
}

// Extract contact info from WhatsApp UI - IMPROVED VERSION
function updateContactInfo() {
  try {
    debugLog('🔍 Updating contact info...');
    
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
        debugLog('📝 Name found:', name);
        break;
      }
    }
    
    if (!name) name = 'Contato não identificado';
    
    // METHOD 2: Extract phone from URL (most reliable)
    let phone = null;
    const urlMatch = window.location.href.match(/\/(\d{10,15})/);
    if (urlMatch) {
      phone = urlMatch[1];
      debugLog('✅ Phone found in URL:', phone);
    }
    
    // METHOD 3: Try to find phone in header title attribute
    if (!phone) {
      debugLog('🔍 Trying header title attribute...');
      const headerTitle = document.querySelector('[data-testid="conversation-info-header"]');
      if (headerTitle) {
        const titleAttr = headerTitle.getAttribute('title') || headerTitle.textContent;
        const phoneMatch = titleAttr?.match(/\+?(\d{10,15})/);
        if (phoneMatch) {
          phone = phoneMatch[1];
          debugLog('✅ Phone found in header:', phone);
        }
      }
    }
    
    // METHOD 4: Look for phone in any span with digits
    if (!phone) {
      debugLog('🔍 Searching for phone in spans...');
      const phoneElements = document.querySelectorAll('span[dir="ltr"]');
      for (const el of phoneElements) {
        const text = el.textContent;
        if (text && /^\+?\d[\d\s\-\(\)]{8,}$/.test(text)) {
          const cleanPhone = text.replace(/\D/g, '');
          if (cleanPhone.length >= 10 && cleanPhone.length <= 15) {
            phone = cleanPhone;
            debugLog('✅ Phone found in span:', phone);
            break;
          }
        }
      }
    }
    
    debugLog('📞 Final contact:', { name, phone });
    
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
      
      debugLog('✅ Contact updated:', currentContact);
      
      // Load history if we have a phone
      if (phone) {
        loadHistory(phone);
      } else {
        // If no phone, show warning
        const historyDiv = document.getElementById('rankito-history-list');
        if (historyDiv) {
          historyDiv.innerHTML = '<p class="rankito-empty">⚠️ Insira o telefone manualmente para carregar histórico</p>';
        }
      }
    }
  } catch (error) {
    console.error('[Rankito Content] ❌ Error updating contact:', error);
  }
}

// Load CRM history for contact
async function loadHistory(phone) {
  debugLog('📋 Loading history for:', phone);
  
  if (!apiToken) {
    debugLog('⚠️ No token available');
    return;
  }
  
  if (!phone) {
    debugLog('⚠️ No phone number provided');
    const historyDiv = document.getElementById('rankito-history-list');
    if (historyDiv) {
      historyDiv.innerHTML = '<div class="rankito-empty">⚠️ Número de telefone não disponível</div>';
    }
    return;
  }
  
  const historyDiv = document.getElementById('rankito-history-list');
  if (!historyDiv) return;
  
  historyDiv.innerHTML = '<div class="rankito-loading">Carregando histórico...</div>';
  
  try {
    debugLog('🌐 Fetching history from API...');
    const response = await fetch(`${SUPABASE_URL}/functions/v1/get-whatsapp-history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': apiToken
      },
      body: JSON.stringify({ phone })
    });
    
    debugLog('📡 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Rankito Content] ❌ API error:', errorText);
      throw new Error(`Failed to load history: ${response.status}`);
    }
    
    const data = await response.json();
    debugLog('✅ History loaded:', data.total_deals, 'deals');
    
    if (data.total_deals > 0) {
      renderHistory(data.deals);
    } else {
      historyDiv.innerHTML = '<p class="rankito-empty">Nenhuma interação anterior</p>';
    }
  } catch (error) {
    console.error('[Rankito Content] ❌ Error loading history:', error);
    historyDiv.innerHTML = `<p class="rankito-error">❌ Erro ao carregar: ${error.message}<br><small>Verifique o console (F12)</small></p>`;
  }
}

// Render history in sidebar
function renderHistory(deals) {
  const historyDiv = document.getElementById('rankito-history-list');
  if (!historyDiv) return;
  
  historyDiv.innerHTML = deals.map(deal => `
    <div class="rankito-history-item">
      <strong>${deal.title}</strong>
      <span class="rankito-stage-badge">${deal.stage}</span>
      <p class="rankito-date">${new Date(deal.created_at).toLocaleDateString('pt-BR')}</p>
      <p class="rankito-activity">${deal.last_activity}</p>
    </div>
  `).join('');
}

// Handle create lead button
async function handleCreateLead() {
  if (!apiToken) {
    alert('❌ Token não configurado. Configure a extensão primeiro.');
    return;
  }
  
  if (!currentContact.name) {
    alert('❌ Nenhum contato selecionado');
    return;
  }
  
  const btn = document.getElementById('rankito-create-lead-btn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Criando...';
  }
  
  try {
    // Try to capture last message
    const messageElements = document.querySelectorAll('[data-pre-plain-text]');
    const lastMessage = messageElements.length > 0 
      ? messageElements[messageElements.length - 1]?.textContent || ''
      : '';
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-deal-from-whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': apiToken
      },
      body: JSON.stringify({
        name: currentContact.name,
        phone: currentContact.phone || 'não disponível',
        message: lastMessage.substring(0, 500),
        stage: 'lead',
        metadata: {
          conversation_url: window.location.href,
          captured_at: new Date().toISOString(),
          message_count: messageElements.length
        }
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert(`✅ ${result.message}\nScore: ${result.lead_score} pontos`);
      // Reload history
      if (currentContact.phone) {
        loadHistory(currentContact.phone);
      }
    } else {
      throw new Error(result.error || 'Erro desconhecido');
    }
  } catch (error) {
    console.error('[Rankito Content] Error creating lead:', error);
    alert('❌ Erro ao criar lead: ' + error.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🔥 Criar Lead no CRM';
    }
  }
}

// Listener para mensagens do background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Rankito Content] 📨 Message received:', message.action);
  
  if (message.action === 'toggleSidebar') {
    const sidebar = document.getElementById('rankito-sidebar');
    if (sidebar) {
      const isHidden = sidebar.style.display === 'none';
      sidebar.style.display = isHidden ? 'flex' : 'none';
      console.log('[Rankito Content] 👁️ Sidebar toggled:', isHidden ? 'shown' : 'hidden');
    } else {
      console.warn('[Rankito Content] ⚠️ Sidebar not found, injecting...');
      init(); // Re-inicializar se sidebar não existir
    }
    sendResponse({ success: true });
  }
  
  if (message.action === 'saveToken') {
    apiToken = message.token;
    console.log('[Rankito Content] ✅ Token saved from setup page');
    
    // Fechar modal se estiver aberto
    const modal = document.getElementById('rankito-config-modal');
    if (modal) {
      modal.remove();
    }
    
    // Atualizar status
    updateConnectionStatus('connected');
    
    // Inicializar monitoramento
    observeConversationChanges();
    updateContactInfo();
    
    sendResponse({ success: true });
  }
  
  return true; // Keep channel open for async response
});
