(function() {
  'use strict';
  
  const modal = document.getElementById('rankito-modal');
  const overlay = document.getElementById('rankito-overlay');
  const form = document.getElementById('rankito-form');
  const closeBtn = document.getElementById('rankito-close');
  
  if (!modal || !overlay || !form) return;
  
  const closeModal = () => {
    overlay.style.display = 'none';
    form.reset();
  };
  
  closeBtn?.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      message: formData.get('message'),
      page_url: window.location.href,
      page_title: document.title,
      source_type: 'wordpress',
    };
    
    try {
      const response = await fetch(rankitoData.api_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-token': rankitoData.api_token,
        },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        document.getElementById('rankito-success').style.display = 'block';
        form.style.display = 'none';
        setTimeout(closeModal, 3000);
      }
    } catch (error) {
      alert('Erro ao enviar. Tente novamente.');
    }
  });
})();
