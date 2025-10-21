// Content Script for WhatsApp Web Integration
const SUPABASE_URL = 'https://jhzmgexprjnpgadkxjup.supabase.co';

console.log('[Rankito Content] 🚀 Script loaded on WhatsApp Web');

let sidebarInjected = false;
let currentContact = { name: null, phone: null };
let apiToken = null;

// Initialize
(async function init() {
  console.log('[Rankito Content] 🚀 Initializing...');
  
  // Get API token from storage
  const result = await chrome.storage.local.get('apiToken');
  apiToken = result.apiToken;
  
  if (!apiToken) {
    console.warn('[Rankito Content] ⚠️ No API token found - showing config modal');
    
    // Show configuration modal after delay
    setTimeout(() => {
      showConfigModal();
    }, 2000);
    return;
  }
  
  console.log('[Rankito Content] ✅ Token loaded:', apiToken.substring(0, 20) + '...');
  
  // Inject sidebar after a short delay to ensure DOM is ready
  setTimeout(() => {
    console.log('[Rankito Content] 💉 Injecting sidebar...');
    injectSidebar();
    observeConversationChanges();
    
    // Forçar primeira atualização do contato
    setTimeout(() => {
      console.log('[Rankito Content] 🔄 Forcing first contact update...');
      updateContactInfo();
    }, 1000);
  }, 2000);
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
      toast.success('Token colado!');
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
      <h3>🔥 Rankito CRM</h3>
      <button id="rankito-close-sidebar" title="Fechar">×</button>
    </div>
    <div class="rankito-sidebar-content">
      <div id="rankito-contact-info">
        <p class="rankito-label">Contato detectado:</p>
        <h4 id="rankito-contact-name">—</h4>
        <p id="rankito-contact-phone">—</p>
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
  console.log('[Rankito Content] ✅ Sidebar injected');
  
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
    console.log('[Rankito Content] 👀 Observing conversation changes');
  }
}

// Extract contact info from WhatsApp UI
function updateContactInfo() {
  try {
    // MÉTODO 1: Pegar nome do header
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
        break;
      }
    }
    
    if (!name) name = 'Contato não identificado';
    
    // MÉTODO 2: Extrair telefone da URL da conversa
    let phone = null;
    const urlMatch = window.location.href.match(/\/(\d{10,15})$/);
    if (urlMatch) {
      phone = urlMatch[1];
      console.log('[Rankito Content] 📱 Phone from URL:', phone);
    }
    
    // MÉTODO 3: Tentar pegar do span de telefone
    if (!phone) {
      const phoneElements = document.querySelectorAll('span[dir="ltr"]');
      for (const el of phoneElements) {
        const text = el.textContent;
        if (text && /^\+?\d[\d\s\-\(\)]{8,}$/.test(text)) {
          phone = text.replace(/\D/g, '');
          console.log('[Rankito Content] 📱 Phone from span:', phone);
          break;
        }
      }
    }
    
    // Update UI only if there's new info
    if (name !== currentContact.name || phone !== currentContact.phone) {
      currentContact = { name, phone };
      
      const nameEl = document.getElementById('rankito-contact-name');
      const phoneEl = document.getElementById('rankito-contact-phone');
      
      if (nameEl) nameEl.textContent = name;
      if (phoneEl) {
        phoneEl.textContent = phone || 'Clique para inserir';
        phoneEl.style.cursor = phone ? 'default' : 'pointer';
        
        // Se não tem telefone, permite clicar para inserir manualmente
        if (!phone) {
          phoneEl.onclick = () => {
            const input = prompt('Digite o telefone do contato (somente números):');
            if (input) {
              const cleanPhone = input.replace(/\D/g, '');
              if (cleanPhone.length >= 10) {
                currentContact.phone = cleanPhone;
                phoneEl.textContent = cleanPhone;
                phoneEl.style.cursor = 'default';
                phoneEl.onclick = null;
                loadHistory(cleanPhone);
              } else {
                alert('❌ Telefone inválido. Digite pelo menos 10 dígitos.');
              }
            }
          };
        } else {
          phoneEl.onclick = null;
        }
      }
      
      console.log('[Rankito Content] ✅ Contact updated:', currentContact);
      
      // Load history if we have a phone
      if (phone) {
        loadHistory(phone);
      } else {
        // Se não tem telefone, mostrar aviso
        const historyDiv = document.getElementById('rankito-history-list');
        if (historyDiv) {
          historyDiv.innerHTML = '<p class="rankito-empty">📱 Clique no telefone acima para inserir manualmente</p>';
        }
      }
    }
  } catch (error) {
    console.error('[Rankito Content] ❌ Error updating contact:', error);
  }
}

// Load CRM history for contact
async function loadHistory(phone) {
  if (!apiToken || !phone) {
    console.warn('[Rankito Content] ⚠️ Cannot load history - missing token or phone');
    return;
  }
  
  const historyDiv = document.getElementById('rankito-history-list');
  if (!historyDiv) return;
  
  console.log('[Rankito Content] 📥 Loading history for:', phone);
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
    
    console.log('[Rankito Content] 📡 History response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Rankito Content] ❌ History error:', errorText);
      throw new Error(`Failed to load history: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('[Rankito Content] ✅ History loaded:', data);
    
    if (data.total_deals > 0) {
      renderHistory(data.deals);
    } else {
      historyDiv.innerHTML = '<p class="rankito-empty">Nenhuma interação anterior</p>';
    }
  } catch (error) {
    console.error('[Rankito Content] ❌ Error loading history:', error);
    historyDiv.innerHTML = `<p class="rankito-error">Erro: ${error.message}</p>`;
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
        message: lastMessage.substring(0, 500), // Limit message length
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

console.log('[Rankito Content] ✅ All listeners set up');
