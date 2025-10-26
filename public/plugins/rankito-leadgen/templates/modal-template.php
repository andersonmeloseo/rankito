<?php
/**
 * Modal Template
 * HTML structure for the lead capture modal
 */

if (!defined('ABSPATH')) exit;

$settings = get_option('rankito_leadgen_settings');
$modal = $settings['modal'] ?? [];
$fields = $settings['fields'] ?? [];
$custom_fields = $settings['custom_fields'] ?? [];
$messages = $settings['messages'] ?? [];
?>

<div id="rankito-overlay" class="rankito-overlay" style="display: none;">
  <div 
    id="rankito-modal" 
    class="rankito-modal rankito-layout-<?php echo esc_attr($modal['layout'] ?? 'vertical'); ?>"
    style="
      background-color: <?php echo esc_attr($modal['bg_color'] ?? '#ffffff'); ?>;
      color: <?php echo esc_attr($modal['text_color'] ?? '#000000'); ?>;
      max-width: <?php echo esc_attr($modal['width'] === 'small' ? '400px' : ($modal['width'] === 'large' ? '800px' : ($modal['width'] === 'full' ? '95vw' : '600px'))); ?>;
      padding: <?php echo esc_attr($modal['padding'] === 'compact' ? '20px' : ($modal['padding'] === 'spacious' ? '40px' : '30px')); ?>;
      border-radius: <?php echo esc_attr($modal['border_radius'] ?? '8'); ?>px;
    "
  >
    <button 
      id="rankito-close" 
      class="rankito-close" 
      aria-label="Fechar"
      style="color: <?php echo esc_attr($modal['text_color'] ?? '#000000'); ?>;"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>

    <div class="rankito-header">
      <?php if (!empty($modal['logo'])): ?>
        <img src="<?php echo esc_url($modal['logo']); ?>" alt="Logo" class="rankito-logo">
      <?php endif; ?>
      
      <h2 class="rankito-title"><?php echo esc_html($modal['title'] ?? 'Entre em contato'); ?></h2>
      
      <?php if (!empty($modal['subtitle'])): ?>
        <p class="rankito-subtitle"><?php echo esc_html($modal['subtitle']); ?></p>
      <?php endif; ?>
    </div>

    <form id="rankito-form" class="rankito-form">
      <?php
      // Standard fields
      foreach ($fields as $field_name => $field_config):
        if (!($field_config['enabled'] ?? false)) continue;
        
        $is_required = $field_config['required'] ?? false;
        $label = $field_config['label'] ?? ucfirst($field_name);
        $placeholder = $field_config['placeholder'] ?? '';
      ?>
        <div class="rankito-field">
          <label for="rankito-<?php echo esc_attr($field_name); ?>">
            <?php echo esc_html($label); ?>
            <?php if ($is_required): ?>
              <span class="rankito-required">*</span>
            <?php endif; ?>
          </label>
          
          <?php if ($field_name === 'message'): ?>
            <textarea
              id="rankito-<?php echo esc_attr($field_name); ?>"
              name="<?php echo esc_attr($field_name); ?>"
              placeholder="<?php echo esc_attr($placeholder); ?>"
              <?php echo $is_required ? 'required' : ''; ?>
              rows="4"
            ></textarea>
          <?php else: ?>
            <input
              type="<?php echo $field_name === 'email' ? 'email' : 'text'; ?>"
              id="rankito-<?php echo esc_attr($field_name); ?>"
              name="<?php echo esc_attr($field_name); ?>"
              placeholder="<?php echo esc_attr($placeholder); ?>"
              <?php echo $is_required ? 'required' : ''; ?>
            >
          <?php endif; ?>
          
          <span class="rankito-error" id="rankito-error-<?php echo esc_attr($field_name); ?>"></span>
        </div>
      <?php endforeach; ?>

      <?php
      // Custom fields
      foreach ($custom_fields as $index => $custom_field):
        if (!($custom_field['enabled'] ?? true)) continue;
        
        $field_id = 'custom_' . $index;
        $is_required = $custom_field['required'] ?? false;
        $field_type = $custom_field['type'] ?? 'text';
      ?>
        <div class="rankito-field">
          <label for="rankito-<?php echo esc_attr($field_id); ?>">
            <?php echo esc_html($custom_field['label']); ?>
            <?php if ($is_required): ?>
              <span class="rankito-required">*</span>
            <?php endif; ?>
          </label>
          
          <?php if ($field_type === 'textarea'): ?>
            <textarea
              id="rankito-<?php echo esc_attr($field_id); ?>"
              name="<?php echo esc_attr($field_id); ?>"
              placeholder="<?php echo esc_attr($custom_field['placeholder'] ?? ''); ?>"
              <?php echo $is_required ? 'required' : ''; ?>
              rows="3"
            ></textarea>
          <?php elseif ($field_type === 'select'): ?>
            <select
              id="rankito-<?php echo esc_attr($field_id); ?>"
              name="<?php echo esc_attr($field_id); ?>"
              <?php echo $is_required ? 'required' : ''; ?>
            >
              <option value="">Selecione...</option>
              <?php foreach (($custom_field['options'] ?? []) as $option): ?>
                <option value="<?php echo esc_attr($option); ?>"><?php echo esc_html($option); ?></option>
              <?php endforeach; ?>
            </select>
          <?php else: ?>
            <input
              type="<?php echo esc_attr($field_type); ?>"
              id="rankito-<?php echo esc_attr($field_id); ?>"
              name="<?php echo esc_attr($field_id); ?>"
              placeholder="<?php echo esc_attr($custom_field['placeholder'] ?? ''); ?>"
              <?php echo $is_required ? 'required' : ''; ?>
            >
          <?php endif; ?>
          
          <span class="rankito-error" id="rankito-error-<?php echo esc_attr($field_id); ?>"></span>
        </div>
      <?php endforeach; ?>

      <?php if (!empty($messages['privacy_text'])): ?>
        <p class="rankito-privacy"><?php echo esc_html($messages['privacy_text']); ?></p>
      <?php endif; ?>

      <button 
        type="submit" 
        class="rankito-submit"
        style="
          background-color: <?php echo esc_attr($modal['primary_color'] ?? '#4F46E5'); ?>;
          color: white;
        "
      >
        <span class="rankito-submit-text">Enviar</span>
        <span class="rankito-submit-loading" style="display: none;">
          <svg class="rankito-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Enviando...
        </span>
      </button>
    </form>

    <div id="rankito-success" class="rankito-success" style="display: none;">
      <div class="rankito-success-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
      <h3 class="rankito-success-title"><?php echo esc_html($messages['success_title'] ?? 'Mensagem enviada!'); ?></h3>
      <p class="rankito-success-text"><?php echo esc_html($messages['success_text'] ?? 'Obrigado pelo contato.'); ?></p>
    </div>
  </div>
</div>

<script>
  // Trigger modal on shortcode buttons/links
  document.addEventListener('DOMContentLoaded', function() {
    const triggers = document.querySelectorAll('.rankito-trigger-btn, .rankito-trigger-link');
    const floatingTrigger = document.getElementById('rankito-floating-trigger');
    
    triggers.forEach(trigger => {
      trigger.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('rankito-overlay').style.display = 'flex';
      });
    });
    
    if (floatingTrigger) {
      floatingTrigger.addEventListener('click', function() {
        document.getElementById('rankito-overlay').style.display = 'flex';
      });
    }
  });
</script>
