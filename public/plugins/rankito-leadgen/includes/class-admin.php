<?php
class Rankito_LeadGen_Admin {
    
    public function __construct() {
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);
        add_action('wp_ajax_rankito_test_connection', [$this, 'test_connection']);
    }
    
    public function add_admin_menu() {
        add_menu_page(
            'Rankito LeadGen',
            'Rankito LeadGen',
            'manage_options',
            'rankito-leadgen',
            [$this, 'render_admin_page'],
            'dashicons-email-alt',
            30
        );
    }
    
    public function register_settings() {
        register_setting('rankito_leadgen_settings_group', 'rankito_leadgen_settings');
    }
    
    public function enqueue_admin_assets($hook) {
        if ($hook !== 'toplevel_page_rankito-leadgen') return;
        
        wp_enqueue_style('wp-color-picker');
        wp_enqueue_script('wp-color-picker');
        wp_enqueue_style(
            'rankito-admin-css',
            RANKITO_LEADGEN_URL . 'assets/css/admin.css',
            [],
            RANKITO_LEADGEN_VERSION
        );
        wp_enqueue_script(
            'rankito-admin-js',
            RANKITO_LEADGEN_URL . 'assets/js/admin.js',
            ['jquery', 'wp-color-picker'],
            RANKITO_LEADGEN_VERSION,
            true
        );
        wp_localize_script('rankito-admin-js', 'rankitoAdmin', [
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('rankito_ajax')
        ]);
    }
    
    public function test_connection() {
        check_ajax_referer('rankito_ajax', 'nonce');
        
        $settings = get_option('rankito_leadgen_settings');
        $api_url = $settings['api']['url'] ?? '';
        $token = $settings['api']['token'] ?? '';
        
        if (empty($api_url) || empty($token)) {
            wp_send_json_error(['message' => 'Configure URL e Token primeiro']);
        }
        
        // Usar endpoint de teste específico
        $test_url = str_replace('/api/external-leads', '/api/external-leads/test', $api_url) . '?token=' . urlencode($token);
        
        $response = wp_remote_get($test_url, [
            'timeout' => 10,
            'headers' => ['x-api-token' => $token]
        ]);
        
        if (is_wp_error($response)) {
            wp_send_json_error(['message' => $response->get_error_message()]);
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if ($data['success'] ?? false) {
            $name = $data['integration']['name'] ?? 'integração';
            $leads = $data['integration']['stats']['total_leads'] ?? 0;
            wp_send_json_success(['message' => "✅ {$name} conectado! {$leads} leads capturados"]);
        } else {
            wp_send_json_error(['message' => $data['message'] ?? 'Falha na conexão']);
        }
    }
    
    public function render_admin_page() {
        include RANKITO_LEADGEN_PATH . 'templates/admin-settings.php';
    }
}
