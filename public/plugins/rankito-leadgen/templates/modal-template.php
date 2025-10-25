<?php
$settings = get_option('rankito_leadgen_settings');
$modal = $settings['modal'];
$fields = $settings['fields'];
$button = $settings['button'];
$messages = $settings['messages'];
?>

<div id="rankito-leadgen-overlay" class="rankito-overlay" style="display:none;">
  <div id="rankito-leadgen-modal" 
       class="rankito-modal rankito-layout-<?php echo esc_attr($modal['layout']); ?>"
       style="--modal-bg: <?php echo esc_attr($modal['bg_color']); ?>;
              --modal-text: <?php echo esc_attr($modal['text_color']); ?>;
              --modal-padding: <?php echo esc_attr($modal['padding']); ?>px;
              --modal-radius: <?php echo esc_attr($modal['border_radius']); ?>px;
              --modal-size: <?php echo $modal['size'] === 'small' ? '400px' : ($modal['size'] === 'large' ? '800px' : '600px'); ?>;">
    
    <button class="rankito-close" aria-label="Fechar">&times;</button>
    
    <?php if (!empty($modal['logo_url'])): ?>
    <div class="rankito-header">
      <img src="<?php echo esc_url($modal['logo_url']); ?>" alt="Logo" class="rankito-logo" />
    </div>
    <?php endif; ?>
    
    <div class="rankito-content">
      <h2 class="rankito-title"><?php echo esc_html($modal['title']); ?></h2>
      <p class="rankito-subtitle"><?php echo esc_html($modal['subtitle']); ?></p>
      
      <form id="rankito-leadgen-form" class="rankito-form">
        
        <?php foreach ($fields as $field_key => $field): ?>
          <?php if ($field_key === 'custom') continue; ?>
          <?php if (!$field['enabled']) continue; ?>
          
          <div class="rankito-field">
            <label for="rankito-<?php echo esc_attr($field_key); ?>">
              <?php echo esc_html($field['label']); ?>
              <?php if ($field['required']): ?><span class="rankito-required">*</span><?php endif; ?>
            </label>
            
            <?php if ($field_key === 'message'): ?>
              <textarea
                id="rankito-<?php echo esc_attr($field_key); ?>"
                name="<?php echo esc_attr($field_key); ?>"
                placeholder="<?php echo esc_attr($field['placeholder']); ?>"
                <?php if ($field['required']): ?>required<?php endif; ?>
                rows="4"
              ></textarea>
            <?php else: ?>
              <input
                type="<?php echo $field_key === 'email' ? 'email' : 'text'; ?>"
                id="rankito-<?php echo esc_attr($field_key); ?>"
                name="<?php echo esc_attr($field_key); ?>"
                placeholder="<?php echo esc_attr($field['placeholder']); ?>"
                <?php if ($field['required']): ?>required<?php endif; ?>
              />
            <?php endif; ?>
            
            <span class="rankito-error" id="rankito-<?php echo esc_attr($field_key); ?>-error"></span>
          </div>
        <?php endforeach; ?>
        
        <?php if (!empty($fields['custom'])): ?>
          <?php foreach ($fields['custom'] as $custom_field): ?>
            <div class="rankito-field">
              <label for="rankito-custom-<?php echo esc_attr($custom_field['id']); ?>">
                <?php echo esc_html($custom_field['label']); ?>
                <?php if ($custom_field['required']): ?><span class="rankito-required">*</span><?php endif; ?>
              </label>
              <input
                type="<?php echo esc_attr($custom_field['type']); ?>"
                id="rankito-custom-<?php echo esc_attr($custom_field['id']); ?>"
                name="custom_<?php echo esc_attr($custom_field['id']); ?>"
                placeholder="<?php echo esc_attr($custom_field['placeholder']); ?>"
                <?php if ($custom_field['required']): ?>required<?php endif; ?>
              />
            </div>
          <?php endforeach; ?>
        <?php endif; ?>
        
        <p class="rankito-privacy"><?php echo esc_html($messages['privacy_text']); ?></p>
        
        <button type="submit" 
                class="rankito-submit"
                style="background-color: <?php echo esc_attr($button['bg_color']); ?>;
                       color: <?php echo esc_attr($button['text_color']); ?>;">
          <span class="rankito-submit-text"><?php echo esc_html($button['text']); ?></span>
          <span class="rankito-submit-loader" style="display:none;">⏳</span>
        </button>
      </form>
      
      <div id="rankito-success-message" class="rankito-success" style="display:none;">
        <div class="rankito-success-icon">✓</div>
        <h3><?php echo esc_html($messages['success_title']); ?></h3>
        <p><?php echo esc_html($messages['success_text']); ?></p>
      </div>
      
    </div>
  </div>
</div>
