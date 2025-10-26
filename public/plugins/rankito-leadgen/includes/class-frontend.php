<?php
class Rankito_LeadGen_Frontend {
    
    private $settings;
    
    public function __construct() {
        $this->settings = get_option('rankito_leadgen_settings');
        
        add_action('wp_enqueue_scripts', [$this, 'enqueue_frontend_assets']);
        add_action('wp_footer', [$this, 'render_modal']);
    }
    
    public function enqueue_frontend_assets() {
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
        
        wp_localize_script('rankito-frontend-js', 'rankitoData', [
            'api_url' => $this->settings['api']['url'] ?? '',
            'api_token' => $this->settings['api']['token'] ?? '',
            'capture_utm' => $this->settings['advanced']['capture_utm'] ?? true,
            'capture_user_agent' => $this->settings['advanced']['capture_user_agent'] ?? true,
        ]);
    }
    
    public function render_modal() {
        if (!isset($this->settings['api']['token']) || empty($this->settings['api']['token'])) {
            return;
        }
        
        include RANKITO_LEADGEN_PATH . 'templates/modal-template.php';
        
        // Render floating button if enabled
        if (($this->settings['trigger']['type'] ?? 'floating') === 'floating' && 
            ($this->settings['trigger']['enabled'] ?? true)) {
            echo $this->render_floating_button();
        }
    }
    
    private function render_floating_button() {
        $position = $this->settings['trigger']['position'] ?? 'bottom-right';
        $size = $this->settings['trigger']['size'] ?? 'medium';
        $icon = $this->settings['trigger']['icon'] ?? 'message';
        
        $position_class = $position === 'bottom-left' ? 'rankito-floating-left' : 'rankito-floating-right';
        $size_class = 'rankito-btn-' . $size;
        
        return sprintf(
            '<button id="rankito-floating-trigger" class="rankito-floating-btn %s %s" aria-label="Abrir formulário de contato">%s</button>',
            esc_attr($position_class),
            esc_attr($size_class),
            $this->get_icon_svg($icon)
        );
    }
    
    private function get_icon_svg($icon) {
        $icons = [
            'message' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
            'phone' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
            'mail' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
        ];
        
        return $icons[$icon] ?? $icons['message'];
    }
    
    public static function button_shortcode($atts) {
        $atts = shortcode_atts(['text' => 'Fale Conosco', 'class' => ''], $atts);
        return sprintf(
            '<button class="rankito-trigger-btn %s">%s</button>',
            esc_attr($atts['class']),
            esc_html($atts['text'])
        );
    }
    
    public static function link_shortcode($atts) {
        $atts = shortcode_atts(['text' => 'Clique aqui', 'class' => ''], $atts);
        return sprintf(
            '<a href="#" class="rankito-trigger-link %s">%s</a>',
            esc_attr($atts['class']),
            esc_html($atts['text'])
        );
    }
}
