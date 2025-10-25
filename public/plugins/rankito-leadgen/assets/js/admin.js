jQuery(document).ready(function($) {
  'use strict';
  
  // Color pickers
  if ($.fn.wpColorPicker) {
    $('.rankito-color-picker').wpColorPicker();
  }
  
  // Tabs navigation
  $('.nav-tab').on('click', function(e) {
    e.preventDefault();
    const target = $(this).attr('href');
    
    $('.nav-tab').removeClass('nav-tab-active');
    $(this).addClass('nav-tab-active');
    
    $('.tab-content').removeClass('active');
    $(target).addClass('active');
  });
  
  // Test connection
  $('#rankito-test-connection').on('click', function() {
    const btn = $(this);
    const status = $('#rankito-connection-status');
    
    btn.prop('disabled', true).text('⏳ Testando...');
    status.html('');
    
    $.ajax({
      url: rankitoAdmin.ajax_url,
      method: 'POST',
      data: {
        action: 'rankito_test_connection',
        nonce: rankitoAdmin.nonce
      },
      success: function(response) {
        if (response.success) {
          status.html('<span style="color: #27ae60; font-weight: 600;">✅ ' + response.data.message + '</span>');
        } else {
          status.html('<span style="color: #e74c3c; font-weight: 600;">❌ ' + response.data.message + '</span>');
        }
      },
      error: function() {
        status.html('<span style="color: #e74c3c; font-weight: 600;">❌ Erro ao testar conexão</span>');
      },
      complete: function() {
        btn.prop('disabled', false).text('🧪 Testar Conexão');
      }
    });
  });
  
  // Show/hide floating options
  $('input[name="rankito_settings[trigger][type]"]').on('change', function() {
    if ($(this).val() === 'floating') {
      $('.floating-options').show();
    } else {
      $('.floating-options').hide();
    }
  });
  
  // Initialize visibility
  if ($('input[name="rankito_settings[trigger][type]"]:checked').val() === 'floating') {
    $('.floating-options').show();
  }
});
