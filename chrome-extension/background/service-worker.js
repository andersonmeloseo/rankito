// Service Worker for Rankito CRM Extension

const SUPABASE_URL = 'https://jhzmgexprjnpgadkxjup.supabase.co';

// 1. On install, set badge status
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Rankito] Extension installed/updated:', details.reason);
  
  // Set badge as red (disconnected) initially
  chrome.action.setBadgeText({ text: '!' });
  chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
  
  console.log('[Rankito] ⚠️ Configure o token ao abrir o WhatsApp Web');
});

// 2. Message listener for saving token
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Rankito] Message received:', message.action);
  
  if (message.action === 'saveToken') {
    chrome.storage.local.set({ 
      apiToken: message.token,
      connectedAt: new Date().toISOString()
    }, () => {
      console.log('[Rankito] ✅ Token saved successfully');
      
      // Update badge to green (connected)
      chrome.action.setBadgeText({ text: '✓' });
      chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
      
      sendResponse({ success: true });
    });
    return true; // Keep channel open for async response
  }
  
  if (message.action === 'getToken') {
    chrome.storage.local.get('apiToken', (data) => {
      sendResponse({ token: data.apiToken });
    });
    return true;
  }

  if (message.action === 'disconnect') {
    chrome.storage.local.remove(['apiToken', 'connectedAt'], () => {
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
      sendResponse({ success: true });
    });
    return true;
  }
});

// 3. Check connection status on startup
chrome.storage.local.get('apiToken', (data) => {
  if (data.apiToken) {
    chrome.action.setBadgeText({ text: '✓' });
    chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
    console.log('[Rankito] ✅ Token found, extension ready');
  } else {
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
    console.log('[Rankito] ⚠️ No token found, need configuration');
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
chrome.action.onClicked.addListener((tab) => {
  // Check if on WhatsApp Web
  if (tab.url?.includes('web.whatsapp.com')) {
    // Toggle sidebar visibility
    chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' });
  } else {
    // Open WhatsApp Web
    chrome.tabs.create({ url: 'https://web.whatsapp.com' });
  }
});

console.log('[Rankito] 🚀 Service Worker loaded');
