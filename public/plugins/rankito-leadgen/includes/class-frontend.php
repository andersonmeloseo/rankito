<?php
class Rankito_LeadGen_Frontend {
    
    public function __construct() {
        add_action('wp_enqueue_scripts', [$this, 'enqueue_frontend_assets']);
        add_action('wp_footer', [$this, 'render_modal']);
    }
    
    public function enqueue_frontend_assets() {
        $settings = get_option('rankito_leadgen_settings');
        
        wp_enqueue_style(
            'rankito-frontend-css',
            RANKITO_LEADGEN_URL . 'assets/css/frontend.css',
            [],
            RANKITO_LEADGEN_VERSION
        );
        
        wp_enqueue_script(
            'rankito-frontend-js',
            RANKITO_LEADGEN_URL . 'assets/js/frontend.js',
            [],
            RANKITO_LEADGEN_VERSION,
            true
        );
        
        wp_localize_script('rankito-frontend-js', 'rankitoSettings', [
            'apiUrl' => $settings['api']['url'] ?? '',
            'apiToken' => $settings['api']['token'] ?? '',
            'settings' => $settings,
        ]);
    }
    
    public function render_modal() {
        $settings = get_option('rankito_leadgen_settings');
        
        if (empty($settings['api']['token'])) return;
        
        include RANKITO_LEADGEN_PATH . 'templates/modal-template.php';
        
        // Renderizar botão flutuante se configurado
        if ($settings['trigger']['type'] === 'floating') {
            $this->render_floating_button($settings);
        }
    }
    
    private function render_floating_button($settings) {
        $config = $settings['trigger']['floating'];
        $position_class = $config['position'] === 'bottom-left' ? 'rankito-floating-left' : 'rankito-floating-right';
        $size_class = 'rankito-btn-' . $config['size'];
        
        echo '<button class="rankito-floating-btn ' . esc_attr($position_class) . ' ' . esc_attr($size_class) . '" 
                      data-rankito-trigger
                      style="background-color: ' . esc_attr($config['bg_color']) . '; 
                             color: ' . esc_attr($config['text_color']) . ';">';
        
        if ($config['icon'] !== 'none') {
            echo $this->get_icon_svg($config['icon']);
        }
        
        echo '<span>' . esc_html($config['text']) . '</span>';
        echo '</button>';
    }
    
    private function get_icon_svg($icon) {
        $icons = [
            'phone' => '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>',
            'message' => '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
            'email' => '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>',
            'rocket' => '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path></svg>',
        ];
        return $icons[$icon] ?? '';
    }
    
    public function button_shortcode($atts) {
        $atts = shortcode_atts([
            'text' => 'Fale Conosco',
            'style' => ''
        ], $atts);
        
        return '<button class="rankito-open-btn" data-rankito-trigger style="' . esc_attr($atts['style']) . '">' . 
               esc_html($atts['text']) . '</button>';
    }
    
    public function link_shortcode($atts) {
        $atts = shortcode_atts(['text' => 'Abrir formulário'], $atts);
        return '<a href="#" class="rankito-open" data-rankito-trigger>' . esc_html($atts['text']) . '</a>';
    }
}
