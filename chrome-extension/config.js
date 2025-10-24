// 🚀 Rankito CRM - Página de Configuração
console.log('[Rankito Config] 📄 Config page loaded');

const tokenInput = document.getElementById('token-input');
const saveBtn = document.getElementById('save-btn');
const statusDiv = document.getElementById('status');

// Carregar token existente (se houver)
chrome.storage.local.get('apiToken', (data) => {
  if (data.apiToken) {
    tokenInput.value = data.apiToken;
    showStatus('Token já configurado. Você pode atualizá-lo se necessário.', 'success');
  }
});

// Salvar token
saveBtn.onclick = async () => {
  const token = tokenInput.value.trim();
  
  if (!token) {
    showStatus('❌ Por favor, cole um token válido!', 'error');
    tokenInput.focus();
    return;
  }

  // Validação básica do formato do token
  if (token.length < 10) {
    showStatus('❌ Token parece inválido. Verifique e tente novamente.', 'error');
    tokenInput.focus();
    return;
  }

  try {
    saveBtn.disabled = true;
    saveBtn.textContent = '⏳ Salvando...';
    
    // Salvar no storage
    await chrome.storage.local.set({ 
      apiToken: token,
      connectedAt: new Date().toISOString()
    });
    
    console.log('[Rankito Config] ✅ Token saved successfully');
    
    // Notificar background script
    await chrome.runtime.sendMessage({ 
      action: 'saveToken',
      token: token 
    });
    
    showStatus('✅ Token salvo com sucesso! Fechando...', 'success');
    
    // Fechar aba após 1 segundo
    setTimeout(() => {
      window.close();
    }, 1000);
    
  } catch (error) {
    console.error('[Rankito Config] ❌ Error saving token:', error);
    showStatus('❌ Erro ao salvar. Tente novamente.', 'error');
    saveBtn.disabled = false;
    saveBtn.textContent = '💾 Salvar e Conectar';
  }
};

// Permitir salvar com Enter
tokenInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    saveBtn.click();
  }
});

// Função para mostrar status
function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  
  if (type === 'error') {
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000);
  }
}

// Auto-focus no input
tokenInput.focus();
