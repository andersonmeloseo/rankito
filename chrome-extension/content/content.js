// 🚀 PRIMEIRO LOG - Confirma que o script foi carregado
console.log('[Rankito Content] 🚀 Script loaded on WhatsApp Web - Version 1.0.1');

// Content Script for WhatsApp Web Integration
const SUPABASE_URL = 'https://jhzmgexprjnpgadkxjup.supabase.co';

// Debug mode - set to false to reduce console logs
const DEBUG = true;

function debugLog(...args) {
  if (DEBUG) {
    console.log('[Rankito Content]', ...args);
  }
}

let sidebarInjected = false;
let currentContact = { name: null, phone: null };
let apiToken = null;

// Initialize
(async function init() {
  try {
    debugLog('🚀 Initializing extension...');
    
    // Verificar se estamos no WhatsApp Web
    if (!window.location.hostname.includes('web.whatsapp.com')) {
      debugLog('⚠️ Not on WhatsApp Web, skipping initialization');
      return;
    }
    
    debugLog('✅ On WhatsApp Web, proceeding with initialization');
    
    // Get API token from storage
    const result = await chrome.storage.local.get('apiToken');
    apiToken = result.apiToken;
    
    if (!apiToken) {
      debugLog('⚠️ No API token found - showing config modal');
      
      // Show configuration modal after delay
      setTimeout(() => {
        showConfigModal();
      }, 2000);
      return;
    }
    
    debugLog('✅ Token loaded:', apiToken.substring(0, 10) + '...');
    
    // Inject sidebar after a short delay to ensure DOM is ready
    setTimeout(() => {
      debugLog('💉 Injecting sidebar...');
      injectSidebar();
      observeConversationChanges();
      
      // Force first contact update
      setTimeout(() => {
        debugLog('🔄 Forcing first contact update...');
        updateContactInfo();
      }, 1000);
    }, 2000);
  } catch (error) {
    console.error('[Rankito Content] ❌ CRITICAL ERROR in init():', error);
    console.error('[Rankito Content] Stack trace:', error.stack);
    alert('❌ ERRO CRÍTICO na extensão Rankito.\n\nDetalhes no console (F12).\n\nErro: ' + error.message);
  }
})();

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
        
        // Initialize sidebar
        setTimeout(() => {
          injectSidebar();
          observeConversationChanges();
        }, 500);
        
        alert('✅ Token configurado com sucesso!');
      } else {
        alert('❌ Erro ao salvar token');
      }
    });
  });
}

// Inject sidebar into WhatsApp Web
function injectSidebar() {
  if (sidebarInjected) return;
  
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
      <div id="connection-status" class="connection-status">⚠️ Aguardando contato...</div>
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
  debugLog('✅ Sidebar injected');
  
  // Add event listeners
  document.getElementById('rankito-close-sidebar')?.addEventListener('click', () => {
    sidebar.style.display = 'none';
  });
  
  document.getElementById('rankito-create-lead-btn')?.addEventListener('click', handleCreateLead);
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
    
    // Update status indicator
    const statusEl = document.getElementById('connection-status');
    if (statusEl) {
      if (phone) {
        statusEl.textContent = '✅ Conectado';
        statusEl.style.color = '#22c55e';
      } else {
        statusEl.textContent = '⚠️ Telefone não detectado';
        statusEl.style.color = '#f59e0b';
      }
    }
    
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
                if (statusEl) {
                  statusEl.textContent = '✅ Conectado (manual)';
                  statusEl.style.color = '#22c55e';
                }
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

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggleSidebar') {
    const sidebar = document.getElementById('rankito-sidebar');
    if (sidebar) {
      sidebar.style.display = sidebar.style.display === 'none' ? 'flex' : 'none';
    }
  }
});

// Listen for setup page messages
window.addEventListener('message', async (event) => {
  if (event.data.type === 'RANKITO_SAVE_TOKEN') {
    const token = event.data.token;
    
    // Save via background script
    chrome.runtime.sendMessage({ 
      action: 'saveToken', 
      token 
    }, (response) => {
      if (response?.success) {
        // Notify setup page
        window.postMessage({ type: 'RANKITO_TOKEN_SAVED' }, '*');
        apiToken = token;
      }
    });
  }
});

debugLog('✅ All listeners set up');