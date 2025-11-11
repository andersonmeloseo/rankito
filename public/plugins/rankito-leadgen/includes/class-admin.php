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
        register_setting('rankito_leadgen_settings_group', 'rankito_leadgen_settings', [
            'sanitize_callback' => [$this, 'sanitize_settings']
        ]);
    }
    
    public function sanitize_settings($input) {
        $sanitized = $input;
        
        // Sanitize API URL
        if (isset($input['api']['url'])) {
            $sanitized['api']['url'] = esc_url_raw($input['api']['url']);
        }
        
        // Sanitize colors
        $color_fields = ['bg_color', 'text_color', 'bg_hover_color', 'overlay_color', 'label_color'];
        foreach ($color_fields as $field) {
            if (isset($input['trigger']['floating'][$field])) {
                $sanitized['trigger']['floating'][$field] = sanitize_hex_color($input['trigger']['floating'][$field]);
            }
            if (isset($input['modal'][$field])) {
                $sanitized['modal'][$field] = sanitize_hex_color($input['modal'][$field]);
            }
            if (isset($input['button'][$field])) {
                $sanitized['button'][$field] = sanitize_hex_color($input['button'][$field]);
            }
        }
        
        return $sanitized;
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
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Permissão negada']);
        }
        
        $settings = get_option('rankito_leadgen_settings');
        $api_url = $settings['api']['url'] ?? '';
        $token = $settings['api']['token'] ?? '';
        
        if (empty($api_url) || empty($token)) {
            wp_send_json_error(['message' => 'Configure URL e Token primeiro']);
        }
        
        // Usar GET para teste de conexão (adicionar token como query parameter)
        $test_url = add_query_arg('token', $token, $api_url);
        
        $response = wp_remote_get($test_url, [
            'timeout' => 15,
            'headers' => [
                'x-api-token' => $token
            ]
        ]);
        
        if (is_wp_error($response)) {
            wp_send_json_error(['message' => 'Erro de conexão: ' . $response->get_error_message()]);
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        // Parse da resposta do endpoint de teste
        if ($status_code === 200 && ($data['success'] ?? false)) {
            $integration_name = $data['integration']['name'] ?? 'integração';
            $total_leads = $data['integration']['stats']['total_leads'] ?? 0;
            
            $message = sprintf(
                '✅ %s conectado! %d leads capturados',
                $integration_name,
                $total_leads
            );
            
            wp_send_json_success([
                'message' => $message,
                'integration' => $data['integration'] ?? null
            ]);
        } else {
            wp_send_json_error(['message' => $data['message'] ?? 'Falha na conexão']);
        }
    }
    
    public function render_admin_page() {
        include RANKITO_LEADGEN_PATH . 'templates/admin-settings.php';
    }
}
