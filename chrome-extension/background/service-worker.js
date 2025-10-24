// 🚀 Service Worker para Extensão Rankito CRM v1.0.6
console.log('[Rankito Background] 🚀 Service Worker Starting - Version 1.0.6');

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

// 2. Message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    log('📨 Message received:', message.action);
    
    if (message.action === 'openConfig') {
      // Open config page in new tab
      chrome.tabs.create({
        url: chrome.runtime.getURL('config.html')
      });
      log('✅ Config page opened');
      sendResponse({ success: true });
      return true;
    }
    
    if (message.action === 'saveToken') {
      chrome.storage.local.set({ 
        apiToken: message.token,
        connectedAt: new Date().toISOString()
      }, () => {
        log('✅ Token saved successfully');
        
        // Update badge to green (connected)
        chrome.action.setBadgeText({ text: '✓' });
        chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
        
        // Notify all WhatsApp Web tabs about token update
        chrome.tabs.query({ url: 'https://web.whatsapp.com/*' }, (tabs) => {
          tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, { 
              action: 'updateToken', 
              token: message.token 
            }).catch(() => {
              // Ignore if tab is not ready
            });
          });
        });
        
        sendResponse({ success: true });
      });
      return true;
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
        log('✅ Connection check passed');
      } else {
        // Token might be invalid
        chrome.action.setBadgeText({ text: '!' });
        chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
        console.warn('[Rankito] ⚠️ Connection check failed');
      }
    } catch (error) {
      logError('Connection check error:', error);
    }
  }
});

// 5. Handle clicks on extension icon - Open config or WhatsApp
chrome.action.onClicked.addListener(async (tab) => {
  log('🖱️ Extension icon clicked');
  
  // Check if token exists
  const { apiToken } = await chrome.storage.local.get('apiToken');
  
  if (!apiToken) {
    // No token, open config page
    log('⚠️ No token, opening config page');
    chrome.tabs.create({
      url: chrome.runtime.getURL('config.html')
    });
    return;
  }
  
  // Token exists, open WhatsApp Web if not already there
  if (!tab.url || !tab.url.includes('web.whatsapp.com')) {
    log('✅ Token exists, opening WhatsApp Web');
    chrome.tabs.update(tab.id, { url: 'https://web.whatsapp.com' });
  } else {
    log('✅ Already on WhatsApp Web and configured');
  }
});

log('🚀 Service Worker fully loaded and ready');
