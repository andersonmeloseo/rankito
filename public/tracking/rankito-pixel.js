/**
 * Rankito Universal Tracking Pixel
 * Automatic tracking for Page Views, Clicks, E-commerce Events, Session Journey
 * Compatible with: Shopify, WooCommerce, Generic HTML
 * Version: 2.1.0 - Automatic WooCommerce DOM Scraping (zero config)
 */

(function() {
  'use strict';

  // Initialize Rankito Pixel
  window.RankitoPixel = window.RankitoPixel || {
    token: null,
    platform: 'generic',
    queue: [],
    ready: false,
    enableEcommerce: true,
    debug: false
  };

  // Merge user config
  if (window.RankitoConfig) {
    Object.assign(window.RankitoPixel, window.RankitoConfig);
  }

  // Enable debug mode via URL parameter
  if (window.location.search.includes('rankito_debug=1')) {
    window.RankitoPixel.debug = true;
  }

  const config = window.RankitoPixel;
  const API_URL = 'https://jhzmgexprjnpgadkxjup.supabase.co/functions/v1/api-track';

  // Debug logger
  function log(...args) {
    if (config.debug) {
      console.log('[Rankito Pixel v2.1]', ...args);
    }
  }

  // Debug visual panel
  function createDebugPanel() {
    const panel = document.createElement('div');
    panel.id = 'rankito-debug';
    panel.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 400px;
      max-height: 500px;
      overflow-y: auto;
      background: rgba(0, 0, 0, 0.95);
      color: #00ff00;
      font-family: monospace;
      font-size: 11px;
      padding: 15px;
      border-radius: 8px;
      z-index: 999999;
      box-shadow: 0 4px 20px rgba(0,255,0,0.3);
    `;
    panel.innerHTML = '<div style="font-weight: bold; margin-bottom: 10px; color: #00ff00;">🟢 RANKITO DEBUG v2.1 (DOM Scraping)</div>';
    document.body.appendChild(panel);
    return panel;
  }

  function showDebugPanel(eventType, data) {
    if (!config.debug) return;
    
    const panel = document.getElementById('rankito-debug') || createDebugPanel();
    const eventLog = document.createElement('div');
    eventLog.style.cssText = `
      margin-bottom: 10px;
      padding: 8px;
      background: rgba(0, 255, 0, 0.1);
      border-left: 3px solid #00ff00;
      border-radius: 4px;
    `;
    const timestamp = new Date().toLocaleTimeString();
    eventLog.innerHTML = `
      <div style="color: #00ff00; font-weight: bold;">[${timestamp}] ${eventType}</div>
      <pre style="margin: 5px 0 0 0; font-size: 10px; color: #33ff33; white-space: pre-wrap;">${JSON.stringify(data, null, 2)}</pre>
    `;
    panel.appendChild(eventLog);
    
    // Keep only last 10 events
    while (panel.children.length > 11) {
      panel.removeChild(panel.children[1]);
    }
  }

  // Detect platform
  function detectPlatform() {
    if (window.Shopify) return 'shopify';
    if (typeof woocommerce_params !== 'undefined' || typeof wc_add_to_cart_params !== 'undefined') return 'woocommerce';
    if (window.dataLayer) return 'gtm';
    return 'generic';
  }

  // Detect device
  function getDevice() {
    const ua = navigator.userAgent.toLowerCase();
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'Tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'Mobile';
    }
    return 'Desktop';
  }

  // Session Management
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  let pageEntryTime = Date.now();
  let currentPageUrl = window.location.href;

  // ============================================
  // ADS CLICK ID & UTM CAPTURE (PHASE 1)
  // Captures gclid, fbclid, fbc, fbp for Google/Meta Ads integration
  // ============================================
  
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  function getAdsTrackingData() {
    const storageKey = 'rankito_ads_tracking';
    let storedData = sessionStorage.getItem(storageKey);
    
    if (storedData) {
      try {
        return JSON.parse(storedData);
      } catch (e) {
        log('Error parsing ads tracking data:', e);
      }
    }
    
    // Capture from current URL and cookies on first page view
    const params = new URLSearchParams(window.location.search);
    
    const adsData = {
      // Google Ads Click ID
      gclid: params.get('gclid') || null,
      
      // Meta Ads Click ID and cookies
      fbclid: params.get('fbclid') || null,
      fbc: getCookie('_fbc') || null,
      fbp: getCookie('_fbp') || null,
      
      // UTM Parameters
      utm_source: params.get('utm_source') || null,
      utm_medium: params.get('utm_medium') || null,
      utm_campaign: params.get('utm_campaign') || null,
      utm_content: params.get('utm_content') || null,
      utm_term: params.get('utm_term') || null
    };
    
    // Only store if we have at least one value
    const hasData = Object.values(adsData).some(v => v !== null);
    if (hasData) {
      sessionStorage.setItem(storageKey, JSON.stringify(adsData));
      log('Ads tracking data captured:', adsData);
    }
    
    return adsData;
  }

  function getSessionId() {
    const storageKey = 'rankito_session';
    let sessionData = sessionStorage.getItem(storageKey);
    
    if (sessionData) {
      try {
        const { id, lastActivity, sequence } = JSON.parse(sessionData);
        if (Date.now() - lastActivity < SESSION_TIMEOUT) {
          // Update activity and increment sequence
          sessionData = { id, lastActivity: Date.now(), sequence: sequence + 1 };
          sessionStorage.setItem(storageKey, JSON.stringify(sessionData));
          return { sessionId: id, sequence: sessionData.sequence };
        }
      } catch (e) {
        log('Error parsing session data:', e);
      }
    }
    
    // Create new session
    const newId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const newData = { id: newId, lastActivity: Date.now(), sequence: 1 };
    sessionStorage.setItem(storageKey, JSON.stringify(newData));
    return { sessionId: newId, sequence: 1 };
  }

  // ============================================
  // PHASE 1: REFACTORED sendEvent() - UNIVERSAL SESSION TRACKING
  // ============================================
  
  function sendEvent(eventType, eventData = {}) {
    if (!config.token) {
      log('Error: No token configured');
      return;
    }

    // ✅ ALWAYS get session data automatically
    const { sessionId, sequence } = getSessionId();
    
    // ✅ Get ads tracking data (gclid, fbclid, UTM)
    const adsData = getAdsTrackingData();
    
    // Calculate time spent on current page
    const timeOnCurrentPage = Math.floor((Date.now() - pageEntryTime) / 1000);
    const currentScrollDepth = Math.round((window.scrollY / Math.max(document.documentElement.scrollHeight - window.innerHeight, 1)) * 100);

    // ✅ Build standardized metadata structure (PHASE 7)
    const metadata = {
      // Device context
      device: getDevice(),
      platform: config.platform,
      screen_width: window.innerWidth,
      screen_height: window.innerHeight,
      
      // Page context
      page_title: document.title,
      page_path: window.location.pathname,
      referrer: document.referrer || null,
      
      // Session context
      viewport_scroll: currentScrollDepth,
      time_on_current_page: timeOnCurrentPage,
      
      // Event-specific data
      ...eventData
    };

    const payload = {
      site_name: document.title || window.location.hostname,
      page_url: window.location.href,
      event_type: eventType,
      cta_text: eventData.cta_text || null,
      session_id: sessionId,  // ✅ ALWAYS included
      sequence_number: sequence,  // ✅ ALWAYS included
      time_spent_seconds: eventData.time_spent_seconds || null,
      exit_url: eventData.exit_url || null,
      // ✅ Ads tracking fields (Google Ads + Meta Ads)
      gclid: adsData.gclid,
      fbclid: adsData.fbclid,
      fbc: adsData.fbc,
      fbp: adsData.fbp,
      utm_source: adsData.utm_source,
      utm_medium: adsData.utm_medium,
      utm_campaign: adsData.utm_campaign,
      utm_content: adsData.utm_content,
      utm_term: adsData.utm_term,
      metadata: metadata
    };

    log('Sending event:', eventType, payload);
    showDebugPanel(eventType, { ...payload.metadata, session_id: sessionId, sequence: sequence });

    fetch(`${API_URL}?token=${config.token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      log('Event sent successfully:', eventType, data);
    })
    .catch(error => {
      log('Error sending event:', error);
      // Add to retry queue
      config.queue.push({ eventType, eventData, retries: 0 });
    });
  }

  // Retry failed events
  function processQueue() {
    if (config.queue.length === 0) return;

    const item = config.queue.shift();
    if (item.retries < 3) {
      item.retries++;
      sendEvent(item.eventType, item.eventData);
    }
  }

  // Process queue every 30 seconds
  setInterval(processQueue, 30000);

  // ============================================
  // PAGE VIEW & EXIT TRACKING
  // ============================================

  function trackPageView() {
    log('Tracking page view with automatic session');
    
    pageEntryTime = Date.now();
    currentPageUrl = window.location.href;
    
    sendEvent('page_view', {
      page_title: document.title,
      page_path: window.location.pathname
    });
  }

  function trackPageExit() {
    const timeSpent = Math.floor((Date.now() - pageEntryTime) / 1000);
    
    if (timeSpent < 1) return; // Ignore very short visits
    
    log('Tracking page exit:', timeSpent, 'seconds');
    
    const { sessionId } = getSessionId();
    
    // Use sendBeacon for reliable delivery on page unload
    const payload = {
      site_name: document.title || window.location.hostname,
      page_url: currentPageUrl,
      event_type: 'page_exit',
      cta_text: null,
      session_id: sessionId,
      time_spent_seconds: timeSpent,
      exit_url: window.location.href,
      metadata: {
        device: getDevice(),
        platform: config.platform,
        referrer: document.referrer || null
      }
    };

    const beaconUrl = `${API_URL}?token=${config.token}`;
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    
    if (navigator.sendBeacon) {
      navigator.sendBeacon(beaconUrl, blob);
    } else {
      // Fallback for older browsers
      fetch(beaconUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(err => log('Error sending page_exit:', err));
    }
  }

  // ============================================
  // PHASE 4: SCROLL DEPTH WITH SESSION TRACKING
  // ============================================
  
  let maxScrollDepth = 0;
  const scrollMilestones = [25, 50, 75, 100];
  const trackedScrolls = new Set();
  let scrollTimeout;

  function trackScrollDepth() {
    // ✅ PHASE 9: Debounce scroll tracking for performance
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const scrolled = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100;
      maxScrollDepth = Math.max(maxScrollDepth, scrolled);

      scrollMilestones.forEach(milestone => {
        if (maxScrollDepth >= milestone && !trackedScrolls.has(milestone)) {
          trackedScrolls.add(milestone);
          log(`Scroll depth: ${milestone}%`);
          sendEvent('scroll_depth', {
            scroll_depth: milestone,
            max_scroll: Math.round(maxScrollDepth)
          });
        }
      });
    }, 150); // Debounce 150ms
  }

  // ============================================
  // PHASE 2: CLICK TRACKING WITH RICH METADATA
  // ============================================
  
  function trackClicks(event) {
    const target = event.target.closest('a, button');
    if (!target) return;

    const href = target.href || '';
    const text = target.textContent?.trim() || target.innerText?.trim() || '';
    
    // ✅ Rich metadata about the clicked element
    const elementMetadata = {
      element_type: target.tagName.toLowerCase(),
      element_classes: target.className || null,
      element_id: target.id || null,
      scroll_position: Math.round((window.scrollY / Math.max(document.documentElement.scrollHeight - window.innerHeight, 1)) * 100)
    };

    // WhatsApp
    if (href.includes('wa.me') || href.includes('whatsapp') || href.includes('api.whatsapp.com')) {
      log('WhatsApp click detected:', text);
      sendEvent('whatsapp_click', {
        cta_text: text,
        link_url: href,
        ...elementMetadata
      });
    }
    // Phone
    else if (href.startsWith('tel:')) {
      log('Phone click detected:', text);
      sendEvent('phone_click', {
        cta_text: text,
        phone_number: href.replace('tel:', ''),
        ...elementMetadata
      });
    }
    // Email
    else if (href.startsWith('mailto:')) {
      log('Email click detected:', text);
      sendEvent('email_click', {
        cta_text: text,
        email: href.replace('mailto:', ''),
        ...elementMetadata
      });
    }
    // Generic button/link
    else if (target.tagName === 'BUTTON' || (target.tagName === 'A' && text)) {
      log('Button click detected:', text);
      sendEvent('button_click', {
        cta_text: text,
        link_url: href || window.location.href,
        ...elementMetadata
      });
    }
  }

  // ============================================
  // PHASE 5: FORM SUBMISSION TRACKING
  // ============================================
  
  function trackFormSubmission(event) {
    const form = event.target;
    if (!form.tagName || form.tagName !== 'FORM') return;
    
    const formData = new FormData(form);
    const fields = {};
    
    // Capture field status (without sensitive values)
    formData.forEach((value, key) => {
      // Skip sensitive fields
      if (!key.match(/password|senha|card|cvv|cpf|rg|ssn/i)) {
        fields[key] = value ? 'filled' : 'empty';
      }
    });
    
    log('Form submission detected:', form.action);
    sendEvent('form_submit', {
      form_action: form.action || window.location.href,
      form_method: form.method || 'POST',
      form_id: form.id || null,
      form_classes: form.className || null,
      fields_count: Object.keys(fields).length,
      is_checkout: form.action.includes('checkout') || form.classList.contains('checkout-form')
    });
  }

  // ============================================
  // PHASE 3 & 8: E-COMMERCE TRACKING WITH SESSION
  // ============================================

  // Shopify Integration
  function initShopify() {
    if (!window.Shopify) return;
    log('Shopify detected');

    // Product View
    if (window.Shopify.designMode === false) {
      const meta = window.ShopifyAnalytics?.meta;
      if (meta?.page?.pageType === 'product' && meta.product) {
        log('Shopify product view:', meta.product);
        sendEvent('product_view', {
          product_id: String(meta.product.id),
          product_name: meta.product.title,
          price: meta.product.price,
          currency: meta.currency?.active || 'BRL',
          category: meta.product.type || null,
          variant: meta.product.variant || null,
          is_ecommerce_event: true  // ✅ E-commerce flag
        });
      }
    }

    // Add to Cart (Ajax API)
    document.addEventListener('click', function(e) {
      const addButton = e.target.closest('[name="add"], .product-form__submit, [type="submit"].btn--add-to-cart');
      if (addButton) {
        setTimeout(() => {
          const form = addButton.closest('form[action*="/cart/add"]');
          if (form) {
            const productId = form.querySelector('[name="id"]')?.value;
            const productName = document.querySelector('.product-title, .product__title, h1')?.textContent?.trim();
            const price = document.querySelector('.price, .product-price')?.textContent?.replace(/[^\d.,]/g, '');
            
            log('Shopify add to cart:', productId);
            sendEvent('add_to_cart', {
              product_id: String(productId),
              product_name: productName,
              price: price ? parseFloat(price) : null,
              quantity: 1,
              is_ecommerce_event: true
            });
          }
        }, 500);
      }
    });

    // ✅ PHASE 8: Remove from Cart detection
    let previousCart = null;
    setInterval(() => {
      fetch('/cart.js')
        .then(r => r.json())
        .then(cart => {
          if (previousCart && cart.items.length < previousCart.items.length) {
            // Find removed items
            const removedItems = previousCart.items.filter(prevItem => 
              !cart.items.find(item => item.id === prevItem.id)
            );
            
            removedItems.forEach(item => {
              log('Shopify remove from cart detected:', item);
              sendEvent('remove_from_cart', {
                product_id: String(item.product_id),
                product_name: item.product_title,
                is_ecommerce_event: true
              });
            });
          }
          previousCart = cart;
        })
        .catch(err => log('Error tracking cart changes:', err));
    }, 2000);

    // Begin Checkout (Checkout page)
    if (window.location.pathname.includes('/checkout')) {
      setTimeout(() => {
        const total = document.querySelector('.total-line__price, [data-checkout-total-price]')?.textContent?.replace(/[^\d.,]/g, '');
        const itemsCount = document.querySelectorAll('.product, .line-item').length;
        
        if (total) {
          log('Shopify begin_checkout');
          sendEvent('begin_checkout', {
            cart_value: parseFloat(total) || null,
            items_count: itemsCount || null,
            currency: window.Shopify?.currency?.active || 'BRL',
            is_ecommerce_event: true
          });
        }
      }, 1000);
    }

    // Purchase (Thank You page)
    if (window.Shopify.checkout) {
      const checkout = window.Shopify.checkout;
      log('Shopify purchase:', checkout);
      sendEvent('purchase', {
        order_id: String(checkout.order_id),
        revenue: parseFloat(checkout.total_price),
        currency: checkout.currency,
        order_name: checkout.order_number,
        items_count: checkout.line_items?.length || null,
        is_ecommerce_event: true
      });
    }

    // Search tracking
    if (window.location.pathname.includes('/search')) {
      const searchTerm = new URLSearchParams(window.location.search).get('q');
      if (searchTerm) {
        log('Shopify search:', searchTerm);
        sendEvent('search', {
          search_term: searchTerm,
          results_count: document.querySelectorAll('.product-item, .grid-product').length,
          is_ecommerce_event: true
        });
      }
    }
  }

  // ============================================
  // WOOCOMMERCE DOM SCRAPING - AUTOMATIC PURCHASE DATA CAPTURE
  // Zero configuration required from client
  // ============================================
  
  function scrapeWooCommercePurchase() {
    // Detect if on WooCommerce order confirmation page
    const url = window.location.href.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    
    const isOrderReceivedPage = 
      path.includes('/order-received/') ||
      path.includes('/pedido-recebido/') ||
      path.includes('/checkout/order-received') ||
      path.includes('/finalizar-compra/pedido-recebido') ||
      (path.includes('/checkout') && url.includes('order-received')) ||
      document.querySelector('.woocommerce-order-received') !== null ||
      document.querySelector('.woocommerce-thankyou') !== null ||
      document.body.classList.contains('woocommerce-order-received');
    
    if (!isOrderReceivedPage) {
      return null;
    }
    
    log('WooCommerce order confirmation page detected, starting DOM scraping...');
    
    // Extract order ID from URL
    let orderId = null;
    const orderMatch = path.match(/(?:order-received|pedido-recebido)[\/=](\d+)/i) ||
                       url.match(/[?&]order[_-]?id=(\d+)/i) ||
                       path.match(/\/(\d{4,})\/?$/);
    if (orderMatch) {
      orderId = orderMatch[1];
    }
    
    // Fallback: try to get from DOM
    if (!orderId) {
      const orderElement = document.querySelector('.woocommerce-order-overview__order strong, .order-number strong, .wc-block-order-confirmation-summary-list-item__value');
      if (orderElement) {
        const text = orderElement.textContent.trim();
        const match = text.match(/\d+/);
        if (match) orderId = match[0];
      }
    }
    
    if (!orderId) {
      log('Could not extract order ID from page');
      return null;
    }
    
    // Extract total value - try multiple selectors
    let revenue = null;
    const totalSelectors = [
      '.woocommerce-order-overview__total .amount',
      '.woocommerce-order-overview__total .woocommerce-Price-amount',
      '.order-total .amount',
      '.order-total .woocommerce-Price-amount',
      '.wc-block-order-confirmation-totals-wrapper .wc-block-components-totals-footer-item .wc-block-components-totals-item__value',
      '.total .amount',
      '[class*="order-total"] .amount',
      '.woocommerce-table--order-details tfoot .amount:last-child'
    ];
    
    for (const selector of totalSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent.trim();
        // Parse Brazilian format (R$ 1.234,56) or international ($ 1,234.56)
        const cleanValue = text.replace(/[^\d.,]/g, '');
        // Detect format: if has comma as decimal separator
        if (cleanValue.includes(',')) {
          // Brazilian format: 1.234,56 -> 1234.56
          revenue = parseFloat(cleanValue.replace(/\./g, '').replace(',', '.'));
        } else {
          // International format: 1,234.56 -> 1234.56
          revenue = parseFloat(cleanValue.replace(/,/g, ''));
        }
        if (!isNaN(revenue) && revenue > 0) {
          log('Total value found:', revenue, 'from selector:', selector);
          break;
        }
      }
    }
    
    // Extract product names
    const products = [];
    const productSelectors = [
      '.order_item .product-name',
      'td.product-name',
      '.woocommerce-table__product-name',
      '.wc-block-order-confirmation-summary-list-item .wc-block-components-order-summary-item__description',
      '.wc-block-components-order-summary-item__name',
      '.product-name a'
    ];
    
    for (const selector of productSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        elements.forEach(el => {
          let name = el.textContent.trim();
          // Clean up: remove quantity indicators like "× 2"
          name = name.replace(/\s*[×x]\s*\d+\s*$/i, '').trim();
          // Remove extra whitespace
          name = name.replace(/\s+/g, ' ');
          if (name && !products.includes(name)) {
            products.push(name);
          }
        });
        if (products.length > 0) {
          log('Products found:', products, 'from selector:', selector);
          break;
        }
      }
    }
    
    // Extract payment method
    let paymentMethod = null;
    const paymentSelectors = [
      '.woocommerce-order-overview__payment-method strong',
      '.woocommerce-order-overview__payment-method',
      '.wc-block-order-confirmation-summary-list-item:last-child .wc-block-order-confirmation-summary-list-item__value',
      '.payment_method',
      '[class*="payment-method"]'
    ];
    
    for (const selector of paymentSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        paymentMethod = element.textContent.trim().toLowerCase();
        // Clean up payment method name
        paymentMethod = paymentMethod.replace(/^(método de pagamento|payment method):?\s*/i, '');
        if (paymentMethod) {
          log('Payment method found:', paymentMethod, 'from selector:', selector);
          break;
        }
      }
    }
    
    // Extract currency
    let currency = 'BRL';
    const currencyElement = document.querySelector('.woocommerce-Price-currencySymbol, [class*="currency"]');
    if (currencyElement) {
      const symbol = currencyElement.textContent.trim();
      if (symbol === '$' || symbol === 'USD') currency = 'USD';
      else if (symbol === '€' || symbol === 'EUR') currency = 'EUR';
      else if (symbol === 'R$' || symbol === 'BRL') currency = 'BRL';
    }
    
    // Extract quantity (items count)
    let itemsCount = products.length || 1;
    const quantityElements = document.querySelectorAll('.product-quantity, td.product-quantity');
    if (quantityElements.length > 0) {
      let totalQty = 0;
      quantityElements.forEach(el => {
        const match = el.textContent.match(/\d+/);
        if (match) totalQty += parseInt(match[0]);
      });
      if (totalQty > 0) itemsCount = totalQty;
    }
    
    return {
      order_id: orderId,
      revenue: revenue,
      currency: currency,
      payment_method: paymentMethod,
      products: products,
      items_count: itemsCount,
      detection_method: 'dom_scraping'
    };
  }

  // WooCommerce Integration
  function initWooCommerce() {
    // Check for WooCommerce - also detect via body classes
    const isWooCommerce = 
      typeof woocommerce_params !== 'undefined' || 
      typeof wc_add_to_cart_params !== 'undefined' ||
      document.body.classList.contains('woocommerce') ||
      document.body.classList.contains('woocommerce-page') ||
      document.querySelector('.woocommerce') !== null;
    
    if (!isWooCommerce) return;
    log('WooCommerce detected');

    // Product View
    const productId = document.querySelector('.product')?.dataset?.productId || 
                     document.querySelector('[name="add-to-cart"]')?.value;
    
    if (productId && document.body.classList.contains('single-product')) {
      const productName = document.querySelector('.product_title, .product-title')?.textContent?.trim();
      const price = document.querySelector('.price .amount, .price')?.textContent?.replace(/[^\d.,]/g, '');
      const category = document.querySelector('.product_meta .posted_in a')?.textContent?.trim();
      
      log('WooCommerce product view:', productId);
      sendEvent('product_view', {
        product_id: String(productId),
        product_name: productName,
        price: price ? parseFloat(price) : null,
        category: category || null,
        is_ecommerce_event: true
      });
    }

    // Add to Cart
    if (typeof jQuery !== 'undefined') {
      jQuery(document.body).on('added_to_cart', function(e, fragments, cart_hash, button) {
        const productId = button?.data('product_id');
        const productName = button?.data('product_name') || button?.closest('.product')?.find('.product-title')?.text()?.trim();
        const quantity = button?.data('quantity') || 1;
        
        log('WooCommerce add to cart:', productId);
        sendEvent('add_to_cart', {
          product_id: String(productId),
          product_name: productName,
          quantity: quantity,
          is_ecommerce_event: true
        });
      });

      // ✅ PHASE 8: Remove from Cart
      jQuery(document.body).on('removed_from_cart', function(e, fragments, cart_hash, button) {
        const productId = button?.data('product_id');
        const productName = button?.data('product_name');
        
        log('WooCommerce remove from cart:', productId);
        sendEvent('remove_from_cart', {
          product_id: String(productId),
          product_name: productName,
          is_ecommerce_event: true
        });
      });
    }

    // Begin Checkout
    if (document.body.classList.contains('woocommerce-checkout')) {
      setTimeout(() => {
        const total = document.querySelector('.order-total .amount')?.textContent?.replace(/[^\d.,]/g, '');
        const itemsCount = document.querySelectorAll('.cart-item, .cart_item').length;
        
        if (total) {
          log('WooCommerce begin_checkout');
          sendEvent('begin_checkout', {
            cart_value: parseFloat(total) || null,
            items_count: itemsCount || null,
            is_ecommerce_event: true
          });
        }
      }, 1000);
    }

    // Purchase Detection - Priority order:
    // 1. wc_ga_data (if GA4/GTM plugin installed)
    // 2. DOM scraping (automatic, no plugin needed)
    
    let purchaseSent = false;
    
    // Method 1: wc_ga_data (requires GA4/GTM plugin)
    if (typeof wc_ga_data !== 'undefined' && wc_ga_data.order) {
      const order = wc_ga_data.order;
      log('WooCommerce purchase via wc_ga_data:', order);
      sendEvent('purchase', {
        order_id: String(order.id),
        revenue: parseFloat(order.total),
        currency: wc_ga_data.currency,
        payment_method: order.payment_method || null,
        detection_method: 'wc_ga_data',
        is_ecommerce_event: true
      });
      purchaseSent = true;
    }
    
    // Method 2: DOM Scraping (automatic, zero config)
    if (!purchaseSent) {
      // Wait a bit for page to fully render
      setTimeout(() => {
        const scrapedData = scrapeWooCommercePurchase();
        if (scrapedData && scrapedData.order_id) {
          log('WooCommerce purchase via DOM scraping:', scrapedData);
          sendEvent('purchase', {
            order_id: String(scrapedData.order_id),
            revenue: scrapedData.revenue,
            currency: scrapedData.currency,
            payment_method: scrapedData.payment_method,
            products: scrapedData.products,
            product_name: scrapedData.products?.join(', ') || null,
            items_count: scrapedData.items_count,
            detection_method: 'dom_scraping',
            is_ecommerce_event: true
          });
          purchaseSent = true;
        }
      }, 1500); // Wait for page render
    }

    // Search tracking
    if (document.body.classList.contains('search-results')) {
      const searchTerm = new URLSearchParams(window.location.search).get('s');
      if (searchTerm) {
        log('WooCommerce search:', searchTerm);
        sendEvent('search', {
          search_term: searchTerm,
          results_count: document.querySelectorAll('.product, .product-item').length,
          is_ecommerce_event: true
        });
      }
    }
  }

  // Generic HTML - Schema.org Detection
  function initGenericEcommerce() {
    // Detect Product via JSON-LD
    const jsonLd = document.querySelector('script[type="application/ld+json"]');
    if (jsonLd) {
      try {
        const data = JSON.parse(jsonLd.textContent);
        if (data['@type'] === 'Product') {
          log('Generic product detected via JSON-LD');
          sendEvent('product_view', {
            product_id: data.sku || data.productID || 'generic',
            product_name: data.name,
            price: data.offers?.price,
            currency: data.offers?.priceCurrency || 'BRL',
            is_ecommerce_event: true
          });
        }
      } catch (e) {
        log('Error parsing JSON-LD:', e);
      }
    }

    // Detect Add to Cart via data attributes
    document.addEventListener('click', function(e) {
      const button = e.target.closest('[data-product-id], .add-to-cart, .buy-button');
      if (button) {
        const productId = button.dataset.productId || button.dataset.id || 'generic';
        const productName = button.dataset.productName || button.dataset.name || '';
        const price = button.dataset.price || null;
        
        log('Generic add to cart:', productId);
        sendEvent('add_to_cart', {
          product_id: productId,
          product_name: productName,
          price: price ? parseFloat(price) : null,
          is_ecommerce_event: true
        });
      }
      
      // ✅ PHASE 8: Generic remove from cart
      const removeBtn = e.target.closest('[data-remove], .remove-item, [class*="remove-from-cart"]');
      if (removeBtn) {
        const productId = removeBtn.dataset.productId || removeBtn.dataset.itemId;
        const productName = removeBtn.dataset.productName || removeBtn.dataset.name;
        
        if (productId) {
          log('Generic remove from cart:', productId);
          sendEvent('remove_from_cart', {
            product_id: productId,
            product_name: productName,
            is_ecommerce_event: true
          });
        }
      }
    });

    // Detect begin_checkout by URL
    if (window.location.pathname.includes('/checkout') || 
        window.location.pathname.includes('/cart') ||
        window.location.pathname.includes('/carrinho')) {
      setTimeout(() => {
        const cartTotal = document.querySelector('.cart-total, .total-price, [class*="total"]')?.textContent?.replace(/[^\d.,]/g, '');
        const itemsCount = document.querySelectorAll('.cart-item, [class*="product"]').length;
        
        if (cartTotal) {
          log('Generic begin_checkout detected');
          sendEvent('begin_checkout', {
            cart_value: parseFloat(cartTotal) || null,
            items_count: itemsCount || null,
            is_ecommerce_event: true
          });
        }
      }, 1000);
    }
  }

  // GTM dataLayer Purchase Detection
  function initGTMTracking() {
    if (!window.dataLayer) return;
    log('GTM dataLayer detected');

    const originalPush = window.dataLayer.push;
    window.dataLayer.push = function() {
      const args = Array.from(arguments);
      args.forEach(item => {
        if (item.event === 'purchase' || item.ecommerce?.purchase) {
          const purchaseData = item.ecommerce?.purchase || item.ecommerce || item;
          log('GTM purchase detected:', purchaseData);
          sendEvent('purchase', {
            order_id: String(purchaseData.transaction_id || purchaseData.actionField?.id || purchaseData.id || Date.now()),
            revenue: parseFloat(purchaseData.value || purchaseData.actionField?.revenue || purchaseData.revenue || 0),
            currency: purchaseData.currency || 'BRL',
            is_ecommerce_event: true
          });
        }
        
        // Detect add_to_cart via GTM
        if (item.event === 'add_to_cart' || item.ecommerce?.add) {
          const productData = item.ecommerce?.add?.products?.[0] || item.ecommerce?.items?.[0] || {};
          log('GTM add_to_cart detected:', productData);
          sendEvent('add_to_cart', {
            product_id: String(productData.id || productData.item_id || 'gtm'),
            product_name: productData.name || productData.item_name,
            price: productData.price || null,
            is_ecommerce_event: true
          });
        }

        // Detect remove_from_cart via GTM
        if (item.event === 'remove_from_cart' || item.ecommerce?.remove) {
          const productData = item.ecommerce?.remove?.products?.[0] || item.ecommerce?.items?.[0] || {};
          log('GTM remove_from_cart detected:', productData);
          sendEvent('remove_from_cart', {
            product_id: String(productData.id || productData.item_id || 'gtm'),
            product_name: productData.name || productData.item_name,
            is_ecommerce_event: true
          });
        }

        // Detect begin_checkout via GTM
        if (item.event === 'begin_checkout' || item.ecommerce?.checkout) {
          log('GTM begin_checkout detected');
          sendEvent('begin_checkout', {
            cart_value: parseFloat(item.ecommerce?.value || 0),
            is_ecommerce_event: true
          });
        }
      });
      return originalPush.apply(this, arguments);
    };
  }

  // ============================================
  // PHASE 6: PUBLIC API WITH AUTOMATIC SESSION TRACKING
  // ============================================
  
  window.RankitoPixel.trackPurchase = function(orderData) {
    log('Manual purchase tracking:', orderData);
    sendEvent('purchase', {
      order_id: orderData.order_id || String(Date.now()),
      revenue: parseFloat(orderData.revenue || orderData.total || 0),
      currency: orderData.currency || 'BRL',
      order_name: orderData.order_name || null,
      payment_method: orderData.payment_method || null,
      items_count: orderData.items_count || null,
      is_ecommerce_event: true,
      is_manual_tracking: true  // ✅ Flag for manual tracking
    });
  };

  window.RankitoPixel.trackAddToCart = function(productData) {
    log('Manual add_to_cart tracking:', productData);
    sendEvent('add_to_cart', {
      product_id: String(productData.product_id || 'manual'),
      product_name: productData.product_name || productData.name,
      price: parseFloat(productData.price || 0),
      quantity: parseInt(productData.quantity || 1),
      is_ecommerce_event: true,
      is_manual_tracking: true
    });
  };

  window.RankitoPixel.trackRemoveFromCart = function(productData) {
    log('Manual remove_from_cart tracking:', productData);
    sendEvent('remove_from_cart', {
      product_id: String(productData.product_id || 'manual'),
      product_name: productData.product_name || productData.name,
      is_ecommerce_event: true,
      is_manual_tracking: true
    });
  };

  window.RankitoPixel.trackBeginCheckout = function(cartData) {
    log('Manual begin_checkout tracking:', cartData);
    sendEvent('begin_checkout', {
      cart_value: parseFloat(cartData.cart_value || cartData.total || 0),
      items_count: parseInt(cartData.items_count || 0),
      currency: cartData.currency || 'BRL',
      is_ecommerce_event: true,
      is_manual_tracking: true
    });
  };

  window.RankitoPixel.trackSearch = function(searchData) {
    log('Manual search tracking:', searchData);
    sendEvent('search', {
      search_term: searchData.search_term || searchData.query,
      results_count: parseInt(searchData.results_count || 0),
      is_ecommerce_event: true,
      is_manual_tracking: true
    });
  };

  window.RankitoPixel.trackProductView = function(productData) {
    log('Manual product_view tracking:', productData);
    sendEvent('product_view', {
      product_id: String(productData.product_id || 'manual'),
      product_name: productData.product_name || productData.name,
      price: parseFloat(productData.price || 0),
      currency: productData.currency || 'BRL',
      category: productData.category || null,
      is_ecommerce_event: true,
      is_manual_tracking: true
    });
  };

  // Initialize E-commerce tracking
  function initEcommerce() {
    if (!config.enableEcommerce) {
      log('E-commerce tracking disabled');
      return;
    }

    config.platform = detectPlatform();
    log('Platform detected:', config.platform);

    // Always init GTM tracking if available
    initGTMTracking();

    switch (config.platform) {
      case 'shopify':
        initShopify();
        break;
      case 'woocommerce':
        initWooCommerce();
        break;
      default:
        initGenericEcommerce();
    }
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  function init() {
    if (config.ready) return;
    config.ready = true;

    log('Initializing Rankito Pixel v2.1 with WooCommerce DOM Scraping', config);

    // Track page view
    trackPageView();

    // Setup event listeners
    document.addEventListener('click', trackClicks, true);
    document.addEventListener('submit', trackFormSubmission, true);  // ✅ PHASE 5
    window.addEventListener('scroll', trackScrollDepth, { passive: true });
    
    // Session tracking - page exit listeners
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'hidden') {
        trackPageExit();
      }
    });
    
    window.addEventListener('beforeunload', trackPageExit);
    window.addEventListener('pagehide', trackPageExit);

    // Initialize e-commerce tracking
    initEcommerce();

    log('✅ Rankito Pixel v2.1 initialized - WooCommerce purchases now auto-captured via DOM scraping');
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
