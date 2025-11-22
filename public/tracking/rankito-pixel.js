/**
 * Rankito Universal Tracking Pixel
 * Automatic tracking for Page Views, Clicks, E-commerce Events
 * Compatible with: Shopify, WooCommerce, Generic HTML
 * Version: 1.0.0
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
      console.log('[Rankito Pixel]', ...args);
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
    panel.innerHTML = '<div style="font-weight: bold; margin-bottom: 10px; color: #00ff00;">🟢 RANKITO DEBUG MODE</div>';
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

  // Send event to API
  function sendEvent(eventType, eventData = {}) {
    if (!config.token) {
      log('Error: No token configured');
      return;
    }

    const payload = {
      site_name: document.title || window.location.hostname,
      page_url: window.location.href,
      event_type: eventType,
      cta_text: eventData.cta_text || null,
      session_id: eventData.session_id || null,
      sequence_number: eventData.sequence_number || null,
      time_spent_seconds: eventData.time_spent_seconds || null,
      exit_url: eventData.exit_url || null,
      metadata: {
        device: getDevice(),
        platform: config.platform,
        referrer: document.referrer || null,
        ...eventData
      }
    };

    log('Sending event:', eventType, payload);
    showDebugPanel(eventType, payload.metadata);

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

  // Session Management
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

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

  // Track Page View with session
  let pageEntryTime = Date.now();
  let currentPageUrl = window.location.href;

  function trackPageView() {
    const { sessionId, sequence } = getSessionId();
    log('Tracking page view with session:', sessionId, 'sequence:', sequence);
    
    pageEntryTime = Date.now();
    currentPageUrl = window.location.href;
    
    sendEvent('page_view', {
      page_title: document.title,
      page_path: window.location.pathname,
      session_id: sessionId,
      sequence_number: sequence
    });
  }

  // Track Page Exit
  function trackPageExit() {
    const { sessionId } = getSessionId();
    const timeSpent = Math.floor((Date.now() - pageEntryTime) / 1000);
    
    if (timeSpent < 1) return; // Ignore very short visits
    
    log('Tracking page exit:', timeSpent, 'seconds');
    
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

  // Track Scroll Depth
  let maxScrollDepth = 0;
  const scrollMilestones = [25, 50, 75, 100];
  const trackedScrolls = new Set();

  function trackScrollDepth() {
    const scrolled = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100;
    maxScrollDepth = Math.max(maxScrollDepth, scrolled);

    scrollMilestones.forEach(milestone => {
      if (maxScrollDepth >= milestone && !trackedScrolls.has(milestone)) {
        trackedScrolls.add(milestone);
        log(`Scroll depth: ${milestone}%`);
        sendEvent('scroll_depth', {
          scroll_depth: milestone,
          page_title: document.title
        });
      }
    });
  }

  // Track Time on Page (on page unload)
  let pageLoadTime = Date.now();

  function trackTimeOnPage() {
    const timeSpent = Math.round((Date.now() - pageLoadTime) / 1000);
    if (timeSpent > 5) { // Only track if more than 5 seconds
      log(`Time on page: ${timeSpent}s`);
      sendEvent('time_on_page', {
        time_seconds: timeSpent,
        page_title: document.title
      });
    }
  }

  // Track Clicks (WhatsApp, Phone, Email, Buttons)
  function trackClicks(event) {
    const target = event.target.closest('a, button');
    if (!target) return;

    const href = target.href || '';
    const text = target.textContent?.trim() || target.innerText?.trim() || '';

    // WhatsApp
    if (href.includes('wa.me') || href.includes('whatsapp') || href.includes('api.whatsapp.com')) {
      log('WhatsApp click detected:', text);
      sendEvent('whatsapp_click', {
        cta_text: text,
        link_url: href
      });
    }
    // Phone
    else if (href.startsWith('tel:')) {
      log('Phone click detected:', text);
      sendEvent('phone_click', {
        cta_text: text,
        phone_number: href.replace('tel:', '')
      });
    }
    // Email
    else if (href.startsWith('mailto:')) {
      log('Email click detected:', text);
      sendEvent('email_click', {
        cta_text: text,
        email: href.replace('mailto:', '')
      });
    }
    // Generic button/link
    else if (target.tagName === 'BUTTON' || (target.tagName === 'A' && text)) {
      log('Button click detected:', text);
      sendEvent('button_click', {
        cta_text: text,
        link_url: href || window.location.href
      });
    }
  }

  // ============================================
  // E-COMMERCE TRACKING
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
          currency: meta.currency?.active || 'BRL'
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
            
            log('Shopify add to cart:', productId);
            sendEvent('add_to_cart', {
              product_id: productId,
              product_name: productName
            });
          }
        }, 500);
      }
    });

    // Begin Checkout (Checkout page)
    if (window.location.pathname.includes('/checkout')) {
      setTimeout(() => {
        const total = document.querySelector('.total-line__price, [data-checkout-total-price]')?.textContent?.replace(/[^\d.,]/g, '');
        if (total) {
          log('Shopify begin_checkout');
          sendEvent('begin_checkout', {
            cart_value: parseFloat(total) || null
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
        order_name: checkout.order_number
      });
    }

    // Search tracking
    if (window.location.pathname.includes('/search')) {
      const searchTerm = new URLSearchParams(window.location.search).get('q');
      if (searchTerm) {
        log('Shopify search:', searchTerm);
        sendEvent('search', {
          search_term: searchTerm,
          results_count: document.querySelectorAll('.product-item, .grid-product').length
        });
      }
    }
  }

  // WooCommerce Integration
  function initWooCommerce() {
    if (typeof woocommerce_params === 'undefined' && typeof wc_add_to_cart_params === 'undefined') return;
    log('WooCommerce detected');

    // Product View
    const productId = document.querySelector('.product')?.dataset?.productId || 
                     document.querySelector('[name="add-to-cart"]')?.value;
    
    if (productId && document.body.classList.contains('single-product')) {
      const productName = document.querySelector('.product_title, .product-title')?.textContent?.trim();
      const price = document.querySelector('.price .amount, .price')?.textContent?.replace(/[^\d.,]/g, '');
      
      log('WooCommerce product view:', productId);
      sendEvent('product_view', {
        product_id: String(productId),
        product_name: productName,
        price: price ? parseFloat(price) : null
      });
    }

    // Add to Cart
    if (typeof jQuery !== 'undefined') {
      jQuery(document.body).on('added_to_cart', function(e, fragments, cart_hash, button) {
        const productId = button?.data('product_id');
        const productName = button?.data('product_name') || button?.closest('.product')?.find('.product-title')?.text()?.trim();
        
        log('WooCommerce add to cart:', productId);
        sendEvent('add_to_cart', {
          product_id: String(productId),
          product_name: productName
        });
      });
    }

    // Begin Checkout
    if (document.body.classList.contains('woocommerce-checkout')) {
      setTimeout(() => {
        const total = document.querySelector('.order-total .amount')?.textContent?.replace(/[^\d.,]/g, '');
        if (total) {
          log('WooCommerce begin_checkout');
          sendEvent('begin_checkout', {
            cart_value: parseFloat(total) || null
          });
        }
      }, 1000);
    }

    // Purchase (Order Received page)
    if (typeof wc_ga_data !== 'undefined' && wc_ga_data.order) {
      const order = wc_ga_data.order;
      log('WooCommerce purchase:', order);
      sendEvent('purchase', {
        order_id: String(order.id),
        revenue: parseFloat(order.total),
        currency: wc_ga_data.currency
      });
    }

    // Search tracking
    if (document.body.classList.contains('search-results')) {
      const searchTerm = new URLSearchParams(window.location.search).get('s');
      if (searchTerm) {
        log('WooCommerce search:', searchTerm);
        sendEvent('search', {
          search_term: searchTerm,
          results_count: document.querySelectorAll('.product, .product-item').length
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
            price: data.offers?.price
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
        
        log('Generic add to cart:', productId);
        sendEvent('add_to_cart', {
          product_id: productId,
          product_name: productName
        });
      }
    });

    // Fallback: Detect checkout form submissions
    document.addEventListener('submit', function(e) {
      const form = e.target;
      if (form.classList.contains('checkout-form') || 
          form.action.includes('checkout') ||
          form.action.includes('payment') ||
          form.action.includes('compra')) {
        
        log('Checkout form submitted');
        sendEvent('begin_checkout', {
          form_action: form.action,
          page_url: window.location.href
        });
      }
    });

    // Detect begin_checkout by URL
    if (window.location.pathname.includes('/checkout') || 
        window.location.pathname.includes('/cart') ||
        window.location.pathname.includes('/carrinho')) {
      setTimeout(() => {
        const cartTotal = document.querySelector('.cart-total, .total-price, [class*="total"]')?.textContent?.replace(/[^\d.,]/g, '');
        if (cartTotal) {
          log('Generic begin_checkout detected');
          sendEvent('begin_checkout', {
            cart_value: parseFloat(cartTotal) || null
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
            currency: purchaseData.currency || 'BRL'
          });
        }
        
        // Detect add_to_cart via GTM
        if (item.event === 'add_to_cart' || item.ecommerce?.add) {
          const productData = item.ecommerce?.add?.products?.[0] || item.ecommerce?.items?.[0] || {};
          log('GTM add_to_cart detected:', productData);
          sendEvent('add_to_cart', {
            product_id: String(productData.id || productData.item_id || 'gtm'),
            product_name: productData.name || productData.item_name
          });
        }

        // Detect begin_checkout via GTM
        if (item.event === 'begin_checkout' || item.ecommerce?.checkout) {
          log('GTM begin_checkout detected');
          sendEvent('begin_checkout', {
            cart_value: parseFloat(item.ecommerce?.value || 0)
          });
        }
      });
      return originalPush.apply(this, arguments);
    };
  }

  // Public API for manual tracking
  window.RankitoPixel.trackPurchase = function(orderData) {
    log('Manual purchase tracking:', orderData);
    sendEvent('purchase', {
      order_id: orderData.order_id || String(Date.now()),
      revenue: parseFloat(orderData.revenue || orderData.total || 0),
      currency: orderData.currency || 'BRL',
      order_name: orderData.order_name || null,
      payment_method: orderData.payment_method || null
    });
  };

  window.RankitoPixel.trackAddToCart = function(productData) {
    log('Manual add_to_cart tracking:', productData);
    sendEvent('add_to_cart', {
      product_id: String(productData.product_id || 'manual'),
      product_name: productData.product_name || productData.name,
      price: parseFloat(productData.price || 0),
      quantity: parseInt(productData.quantity || 1)
    });
  };

  window.RankitoPixel.trackRemoveFromCart = function(productData) {
    log('Manual remove_from_cart tracking:', productData);
    sendEvent('remove_from_cart', {
      product_id: String(productData.product_id || 'manual'),
      product_name: productData.product_name || productData.name
    });
  };

  window.RankitoPixel.trackBeginCheckout = function(cartData) {
    log('Manual begin_checkout tracking:', cartData);
    sendEvent('begin_checkout', {
      cart_value: parseFloat(cartData.cart_value || cartData.total || 0),
      items_count: parseInt(cartData.items_count || 0)
    });
  };

  window.RankitoPixel.trackSearch = function(searchData) {
    log('Manual search tracking:', searchData);
    sendEvent('search', {
      search_term: searchData.search_term || searchData.query,
      results_count: parseInt(searchData.results_count || 0)
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

    log('Initializing Rankito Pixel', config);

    // Track page view
    trackPageView();

    // Setup event listeners
    document.addEventListener('click', trackClicks, true);
    window.addEventListener('scroll', trackScrollDepth, { passive: true });
    window.addEventListener('beforeunload', trackTimeOnPage);
    
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

    log('Rankito Pixel initialized successfully');
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
