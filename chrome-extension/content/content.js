// 🚀 Rankito CRM - WhatsApp Connector v1.0.6 (SIMPLIFIED)
console.log('[Rankito] 🚀 Content script starting v1.0.6');

const SUPABASE_URL = 'https://jhzmgexprjnpgadkxjup.supabase.co';
let apiToken = null;
let currentPhone = null;
let isProcessing = false;

// ============================================
// 1. INITIALIZATION
// ============================================

// Check if we're on WhatsApp Web
if (!window.location.href.includes('web.whatsapp.com')) {
  console.log('[Rankito] ⚠️ Not on WhatsApp Web, script will not run');
} else {
  console.log('[Rankito] ✅ On WhatsApp Web, initializing...');
  init();
}

function init() {
  // Get token from storage
  chrome.runtime.sendMessage({ action: 'getToken' }, (response) => {
    apiToken = response?.token;
    
    if (!apiToken) {
      console.log('[Rankito] ⚠️ No token found, showing config button');
      injectConfigButton();
    } else {
      console.log('[Rankito] ✅ Token found, extension ready');
      startObserving();
    }
  });
}

// ============================================
// 2. CONFIG BUTTON (only shown if no token)
// ============================================

function injectConfigButton() {
  // Check if button already exists
  if (document.getElementById('rankito-config-btn')) {
    return;
  }

  const button = document.createElement('button');
  button.id = 'rankito-config-btn';
  button.innerHTML = '🚀 Configurar Rankito';
  button.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 999999;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 14px 24px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
    transition: all 0.3s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  button.onmouseover = () => {
    button.style.transform = 'translateY(-2px)';
    button.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.5)';
  };

  button.onmouseout = () => {
    button.style.transform = 'translateY(0)';
    button.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.4)';
  };

  button.onclick = () => {
    console.log('[Rankito] 🖱️ Config button clicked, opening config page');
    chrome.runtime.sendMessage({ action: 'openConfig' });
  };

  document.body.appendChild(button);
  console.log('[Rankito] ✅ Config button injected');
}

// ============================================
// 3. CONVERSATION OBSERVER
// ============================================

function startObserving() {
  console.log('[Rankito] 👀 Starting to observe conversations...');

  // Initial check
  updateContactInfo();

  // Watch for conversation changes
  const observer = new MutationObserver(() => {
    updateContactInfo();
  });

  // Observe the main chat container
  const targetNode = document.querySelector('#main') || document.body;
  observer.observe(targetNode, {
    childList: true,
    subtree: true
  });

  console.log('[Rankito] ✅ Observer started');
}

// ============================================
// 4. CONTACT INFO EXTRACTION
// ============================================

function updateContactInfo() {
  try {
    // Try to get contact name from header
    const nameElement = document.querySelector('header [role="img"]')?.nextElementSibling?.querySelector('span');
    const contactName = nameElement?.textContent?.trim() || 'Desconhecido';

    // Try to get phone number from various possible locations
    let phoneNumber = null;

    // Method 1: From chat URL
    const urlMatch = window.location.href.match(/\/(\d+)@/);
    if (urlMatch) {
      phoneNumber = '+' + urlMatch[1];
    }

    // Method 2: From header attributes
    if (!phoneNumber) {
      const headerImg = document.querySelector('header [role="img"]');
      if (headerImg?.alt) {
        const altMatch = headerImg.alt.match(/\+?\d{10,}/);
        if (altMatch) {
          phoneNumber = altMatch[0].startsWith('+') ? altMatch[0] : '+' + altMatch[0];
        }
      }
    }

    if (phoneNumber && phoneNumber !== currentPhone) {
      currentPhone = phoneNumber;
      console.log('[Rankito] 📞 New contact detected:', contactName, phoneNumber);
      
      // Automatically create/update lead
      if (!isProcessing) {
        handleNewContact(contactName, phoneNumber);
      }
    }
  } catch (error) {
    console.error('[Rankito] ❌ Error updating contact info:', error);
  }
}

// ============================================
// 5. LEAD CREATION
// ============================================

async function handleNewContact(name, phone) {
  if (!apiToken) {
    console.log('[Rankito] ⚠️ No token, skipping lead creation');
    return;
  }

  isProcessing = true;

  try {
    console.log('[Rankito] 📤 Creating lead for:', name, phone);

    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-deal-from-whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': apiToken
      },
      body: JSON.stringify({
        contact_name: name,
        phone: phone,
        source: 'whatsapp_web_extension'
      })
    });

    const result = await response.json();

    if (response.ok) {
      console.log('[Rankito] ✅ Lead created/updated successfully:', result);
      showNotification('✅ Lead sincronizado com Rankito CRM', 'success');
    } else {
      console.error('[Rankito] ❌ Error creating lead:', result);
      if (response.status === 401) {
        showNotification('❌ Token inválido. Reconfigure a extensão.', 'error');
        apiToken = null;
        injectConfigButton();
      }
    }
  } catch (error) {
    console.error('[Rankito] ❌ Network error:', error);
  } finally {
    isProcessing = false;
  }
}

// ============================================
// 6. NOTIFICATIONS
// ============================================

function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 999999;
    background: ${type === 'success' ? '#10b981' : '#ef4444'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    animation: slideIn 0.3s ease-out;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(400px)';
    notification.style.transition = 'all 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ============================================
// 7. MESSAGE LISTENER
// ============================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Rankito] 📨 Message received:', message.action);

  if (message.action === 'updateToken') {
    apiToken = message.token;
    console.log('[Rankito] ✅ Token updated');
    
    // Remove config button if it exists
    const configBtn = document.getElementById('rankito-config-btn');
    if (configBtn) {
      configBtn.remove();
    }
    
    // Start observing
    startObserving();
    
    sendResponse({ success: true });
  }

  return true;
});

console.log('[Rankito] 🚀 Content script fully loaded v1.0.6');
