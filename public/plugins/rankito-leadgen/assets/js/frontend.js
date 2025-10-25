(function() {
  'use strict';
  
  const modal = document.getElementById('rankito-leadgen-modal');
  const overlay = document.getElementById('rankito-leadgen-overlay');
  const form = document.getElementById('rankito-leadgen-form');
  const closeBtn = document.querySelector('.rankito-close');
  const successMsg = document.getElementById('rankito-success-message');
  
  // Abrir modal
  document.addEventListener('click', function(e) {
    if (e.target.matches('[data-rankito-trigger]') || e.target.closest('[data-rankito-trigger]')) {
      e.preventDefault();
      overlay.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  });
  
  // Fechar modal
  function closeModal() {
    overlay.style.display = 'none';
    document.body.style.overflow = '';
    form.reset();
    form.style.display = 'block';
    successMsg.style.display = 'none';
    clearErrors();
  }
  
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeModal();
  });
  
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && overlay.style.display === 'flex') {
      closeModal();
    }
  });
  
  // Validação
  function validateField(field, value) {
    const validations = {
      name: v => v.trim().length >= 2,
      email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      phone: v => v.replace(/\D/g, '').length >= 10
    };
    return validations[field] ? validations[field](value) : true;
  }
  
  function showError(fieldName, message) {
    const errorEl = document.getElementById('rankito-' + fieldName + '-error');
    const inputEl = document.getElementById('rankito-' + fieldName);
    if (errorEl && inputEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
      inputEl.classList.add('rankito-error-field');
    }
  }
  
  function clearErrors() {
    document.querySelectorAll('.rankito-error').forEach(el => {
      el.textContent = '';
      el.style.display = 'none';
    });
    document.querySelectorAll('.rankito-error-field').forEach(el => {
      el.classList.remove('rankito-error-field');
    });
  }
  
  // Captura de dados
  function getURLParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name) || '';
  }
  
  function getLeadData(formData) {
    const data = {
      name: formData.get('name') || '',
      email: formData.get('email') || '',
      phone: formData.get('phone') || '',
      company: formData.get('company') || '',
      message: formData.get('message') || '',
      page_url: window.location.href,
      page_title: document.title,
      source_type: 'wordpress_widget',
      custom_fields: {}
    };
    
    if (rankitoSettings.settings.advanced.capture_utm) {
      data.utm_source = getURLParameter('utm_source');
      data.utm_campaign = getURLParameter('utm_campaign');
      data.utm_medium = getURLParameter('utm_medium');
    }
    
    if (rankitoSettings.settings.advanced.capture_user_agent) {
      data.user_agent = navigator.userAgent;
    }
    
    // Campos customizados
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('custom_')) {
        data.custom_fields[key.replace('custom_', '')] = value;
      }
    }
    
    return data;
  }
  
  // Submissão
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    clearErrors();
    
    const formData = new FormData(form);
    const leadData = getLeadData(formData);
    
    // Validação client-side
    const messages = rankitoSettings.settings.messages;
    
    if (!validateField('name', leadData.name)) {
      showError('name', messages.error_name_empty);
      return;
    }
    
    if (leadData.email && !validateField('email', leadData.email)) {
      showError('email', messages.error_email_invalid);
      return;
    }
    
    if (leadData.phone && !validateField('phone', leadData.phone)) {
      showError('phone', messages.error_phone_invalid);
      return;
    }
    
    // Estado de loading
    const submitBtn = form.querySelector('.rankito-submit');
    const submitText = submitBtn.querySelector('.rankito-submit-text');
    const submitLoader = submitBtn.querySelector('.rankito-submit-loader');
    
    submitBtn.disabled = true;
    submitText.textContent = messages.loading_text;
    submitLoader.style.display = 'inline-block';
    
    try {
      const response = await fetch(rankitoSettings.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-token': rankitoSettings.apiToken
        },
        body: JSON.stringify(leadData),
        timeout: rankitoSettings.settings.advanced.timeout * 1000
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        // Sucesso
        form.style.display = 'none';
        successMsg.style.display = 'block';
        
        if (rankitoSettings.settings.advanced.debug_mode) {
          console.log('Rankito Lead captured:', result);
        }
        
        // Fechar após 5s
        setTimeout(closeModal, 5000);
      } else {
        // Erro da API
        handleAPIError(response.status, result);
      }
      
    } catch (error) {
      console.error('Rankito submission error:', error);
      alert(messages.error_generic);
    } finally {
      submitBtn.disabled = false;
      submitText.textContent = rankitoSettings.settings.button.text;
      submitLoader.style.display = 'none';
    }
  });
  
  function handleAPIError(status, result) {
    const messages = rankitoSettings.settings.messages;
    
    switch(status) {
      case 400:
        if (result.code === 'INVALID_NAME') {
          showError('name', messages.error_name_empty);
        } else if (result.code === 'INVALID_EMAIL') {
          showError('email', messages.error_email_invalid);
        }
        break;
      case 401:
        alert('Erro de configuração. Contate o administrador.');
        break;
      case 409:
        alert(messages.error_duplicate);
        break;
      default:
        alert(messages.error_generic);
    }
  }
  
})();
