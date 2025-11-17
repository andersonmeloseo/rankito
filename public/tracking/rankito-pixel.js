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
      metadata: {
        device: getDevice(),
        platform: config.platform,
        referrer: document.referrer || null,
        ...eventData
      }
    };

    log('Sending event:', eventType, payload);

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

  // Track Page View
  function trackPageView() {
    log('Tracking page view');
    sendEvent('page_view', {
      page_title: document.title,
      page_path: window.location.pathname
    });
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
  }

  // Initialize E-commerce tracking
  function initEcommerce() {
    if (!config.enableEcommerce) {
      log('E-commerce tracking disabled');
      return;
    }

    config.platform = detectPlatform();
    log('Platform detected:', config.platform);

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
