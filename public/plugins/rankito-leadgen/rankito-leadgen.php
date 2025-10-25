<?php
/**
 * Plugin Name: Rankito LeadGen
 * Plugin URI: https://rankito.com
 * Description: Capture leads profissionalmente com modal customizável e integração direta com RankiTO CRM
 * Version: 1.0.0
 * Author: RankiTO
 * Author URI: https://rankito.com
 * License: GPL-2.0+
 * Text Domain: rankito-leadgen
 * Domain Path: /languages
 */

if (!defined('ABSPATH')) exit;

define('RANKITO_LEADGEN_VERSION', '1.0.0');
define('RANKITO_LEADGEN_PATH', plugin_dir_path(__FILE__));
define('RANKITO_LEADGEN_URL', plugin_dir_url(__FILE__));

// Autoload
spl_autoload_register(function($class) {
    if (strpos($class, 'Rankito_LeadGen_') === 0) {
        $file = RANKITO_LEADGEN_PATH . 'includes/class-' . 
                strtolower(str_replace('_', '-', substr($class, 16))) . '.php';
        if (file_exists($file)) require_once $file;
    }
});

// Inicialização
function rankito_leadgen_init() {
    $admin = new Rankito_LeadGen_Admin();
    $frontend = new Rankito_LeadGen_Frontend();
    
    add_shortcode('rankito_button', [$frontend, 'button_shortcode']);
    add_shortcode('rankito_link', [$frontend, 'link_shortcode']);
}
add_action('plugins_loaded', 'rankito_leadgen_init');

// Ativação
register_activation_hook(__FILE__, function() {
    $defaults = [
        'api' => [
            'url' => '',
            'token' => '',
            'connection_status' => 'disconnected'
        ],
        'trigger' => [
            'type' => 'floating',
            'floating' => [
                'text' => 'Falar com Consultor',
                'icon' => 'phone',
                'bg_color' => '#0066cc',
                'text_color' => '#ffffff',
                'position' => 'bottom-right',
                'size' => 'medium'
            ]
        ],
        'fields' => [
            'name' => ['enabled' => true, 'label' => 'Nome', 'placeholder' => 'Seu nome', 'required' => true],
            'email' => ['enabled' => true, 'label' => 'Email', 'placeholder' => 'seu@email.com', 'required' => false],
            'phone' => ['enabled' => true, 'label' => 'Telefone', 'placeholder' => '(11) 99999-9999', 'required' => false],
            'company' => ['enabled' => false, 'label' => 'Empresa', 'placeholder' => '', 'required' => false],
            'message' => ['enabled' => true, 'label' => 'Mensagem', 'placeholder' => 'Como podemos ajudar?', 'required' => false],
            'custom' => []
        ],
        'modal' => [
            'layout' => 'classic',
            'size' => 'medium',
            'border_radius' => 8,
            'padding' => 30,
            'bg_color' => '#ffffff',
            'overlay_color' => '#000000',
            'overlay_opacity' => 0.6,
            'text_color' => '#333333',
            'label_color' => '#555555',
            'title' => 'Fale com nossa equipe',
            'subtitle' => 'Preencha o formulário e entraremos em contato',
            'logo_url' => ''
        ],
        'button' => [
            'text' => 'Enviar Mensagem',
            'bg_color' => '#0066cc',
            'bg_hover_color' => '#0052a3',
            'text_color' => '#ffffff',
            'width' => '100%',
            'icon' => 'check'
        ],
        'messages' => [
            'success_title' => '✓ Enviado com sucesso!',
            'success_text' => 'Obrigado! Entraremos em contato em breve.',
            'error_generic' => 'Erro ao enviar. Tente novamente.',
            'error_name_empty' => 'Por favor, digite seu nome',
            'error_email_invalid' => 'Email inválido',
            'error_phone_invalid' => 'Telefone inválido',
            'error_duplicate' => 'Você já nos enviou uma mensagem recentemente!',
            'loading_text' => 'Enviando...',
            'privacy_text' => 'Seus dados estão seguros e não serão compartilhados.'
        ],
        'advanced' => [
            'capture_url' => true,
            'capture_title' => true,
            'capture_utm' => true,
            'capture_user_agent' => true,
            'debug_mode' => false,
            'prevent_multiple' => true,
            'timeout' => 30
        ]
    ];
    add_option('rankito_leadgen_settings', $defaults);
});
