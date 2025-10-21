// 🚀 Service Worker para Extensão Rankito CRM
console.log('[Rankito Background] 🚀 Service Worker Starting - Version 1.0.3');

const SUPABASE_URL = 'https://jhzmgexprjnpgadkxjup.supabase.co';

// Debug mode
const DEBUG = true;
const log = (...args) => {
  if (DEBUG) console.log('[Rankito Background]', ...args);
};
const logError = (...args) => {
  console.error('[Rankito Background]', ...args);
};

// 1. On install, set badge status
chrome.runtime.onInstalled.addListener((details) => {
  log('✅ Extension installed/updated:', details.reason);
  
  // Set badge as red (disconnected) initially
  chrome.action.setBadgeText({ text: '!' });
  chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
  
  log('⚠️ Configure o token ao abrir o WhatsApp Web');
});

// 2. Message listener for saving token
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    log('📨 Message received:', message.action);
    
    if (message.action === 'saveToken') {
      chrome.storage.local.set({ 
        apiToken: message.token,
        connectedAt: new Date().toISOString()
      }, () => {
        log('✅ Token saved successfully');
        
        // Update badge to green (connected)
        chrome.action.setBadgeText({ text: '✓' });
        chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
        
        sendResponse({ success: true });
      });
      return true; // Keep channel open for async response
    }
    
    if (message.action === 'getToken') {
      chrome.storage.local.get('apiToken', (data) => {
        log('📤 Token retrieved:', data.apiToken ? 'Present' : 'Not found');
        sendResponse({ token: data.apiToken });
      });
      return true;
    }

    if (message.action === 'disconnect') {
      chrome.storage.local.remove(['apiToken', 'connectedAt'], () => {
        log('🔌 Token removed, disconnected');
        chrome.action.setBadgeText({ text: '!' });
        chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
        sendResponse({ success: true });
      });
      return true;
    }
  } catch (error) {
    logError('❌ Error handling message:', error);
    sendResponse({ success: false, error: error.message });
  }
});

// 3. Check connection status on startup
chrome.storage.local.get('apiToken', (data) => {
  if (data.apiToken) {
    chrome.action.setBadgeText({ text: '✓' });
    chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
    log('✅ Token found on startup, extension ready');
  } else {
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
    log('⚠️ No token found on startup, need configuration');
  }
});

// 4. Periodic connection check (every 30 minutes)
chrome.alarms.create('checkConnection', { periodInMinutes: 30 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkConnection') {
    const { apiToken } = await chrome.storage.local.get('apiToken');
    
    if (!apiToken) {
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
      return;
    }
    
    try {
      // Simple ping to verify token is still valid
      const response = await fetch(`${SUPABASE_URL}/functions/v1/get-whatsapp-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-token': apiToken
        },
        body: JSON.stringify({ phone: '+00000000000' }) // Test call
      });
      
      if (response.ok || response.status === 404) {
        // Token is valid (404 just means no deals found, but auth worked)
        chrome.action.setBadgeText({ text: '✓' });
        chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
        console.log('[Rankito] ✅ Connection check passed');
      } else {
        // Token might be invalid
        chrome.action.setBadgeText({ text: '!' });
        chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
        console.warn('[Rankito] ⚠️ Connection check failed');
      }
    } catch (error) {
      console.error('[Rankito] Connection check error:', error);
    }
  }
});

// 5. Handle clicks on extension icon
chrome.action.onClicked.addListener(async (tab) => {
  log('🖱️ Extension icon clicked');
  
  // Check if it's WhatsApp Web
  if (!tab.url || !tab.url.includes('web.whatsapp.com')) {
    log('⚠️ Not on WhatsApp Web, opening WhatsApp');
    chrome.tabs.update(tab.id, { url: 'https://web.whatsapp.com' });
    return;
  }
  
  try {
    // Try to send message to content script with timeout
    await Promise.race([
      chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1000))
    ]);
    log('✅ Sidebar toggle message sent');
  } catch (error) {
    // If content script is not loaded or timeout, inject and initialize
    logError('❌ Content script not responding, injecting script:', error);
    
    try {
      // Inject content script
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/content.js']
      });
      
      // Inject CSS
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['content/sidebar.css']
      });
      
      log('✅ Scripts injected successfully');
      
      // Wait a bit and try to toggle sidebar
      setTimeout(async () => {
        try {
          await chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' });
          log('✅ Sidebar toggle after injection');
        } catch (err) {
          logError('❌ Still failed after injection:', err);
        }
      }, 1000);
    } catch (injectionError) {
      logError('❌ Failed to inject scripts:', injectionError);
      // Last resort: reload page
      chrome.tabs.reload(tab.id);
    }
  }
});

log('🚀 Service Worker fully loaded and ready');
