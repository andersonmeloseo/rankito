<?php
/**
 * Plugin Name: Rankito LeadGen
 * Plugin URI: https://rankitocrm.com
 * Description: Captura leads profissionalmente com modal customizável e integração direta com RankiTO CRM
 * Version: 1.0.0
 * Author: RankiTO
 * Author URI: https://rankitocrm.com
 * Text Domain: rankito-leadgen
 * License: GPL v2 or later
 */

if (!defined('ABSPATH')) exit;

// Constants
define('RANKITO_LEADGEN_VERSION', '1.0.0');
define('RANKITO_LEADGEN_PATH', plugin_dir_path(__FILE__));
define('RANKITO_LEADGEN_URL', plugin_dir_url(__FILE__));

// Autoload classes
spl_autoload_register(function ($class) {
    if (strpos($class, 'Rankito_LeadGen_') === 0) {
        $file = RANKITO_LEADGEN_PATH . 'includes/' . strtolower(str_replace('_', '-', $class)) . '.php';
        if (file_exists($file)) {
            require_once $file;
        }
    }
});

// Initialize plugin
function rankito_leadgen_init() {
    new Rankito_LeadGen_Admin();
    new Rankito_LeadGen_Frontend();
    
    // Register shortcodes
    add_shortcode('rankito_button', ['Rankito_LeadGen_Frontend', 'button_shortcode']);
    add_shortcode('rankito_link', ['Rankito_LeadGen_Frontend', 'link_shortcode']);
}
add_action('plugins_loaded', 'rankito_leadgen_init');

// Set default settings on activation
register_activation_hook(__FILE__, function() {
    $default_settings = [
        'api' => [
            'url' => 'https://app.rankitocrm.com/api/external-leads',
            'token' => '',
        ],
        'trigger' => [
            'type' => 'floating', // floating, shortcode, both
            'position' => 'bottom-right', // bottom-right, bottom-left
            'icon' => 'message',
            'size' => 'medium',
            'enabled' => true,
        ],
        'fields' => [
            'name' => ['enabled' => true, 'required' => true, 'label' => 'Nome', 'placeholder' => 'Seu nome completo'],
            'email' => ['enabled' => true, 'required' => false, 'label' => 'E-mail', 'placeholder' => 'seu@email.com'],
            'phone' => ['enabled' => true, 'required' => false, 'label' => 'Telefone', 'placeholder' => '(11) 99999-9999'],
            'message' => ['enabled' => true, 'required' => false, 'label' => 'Mensagem', 'placeholder' => 'Como podemos ajudar?'],
        ],
        'custom_fields' => [], // User-defined custom fields
        'modal' => [
            'logo' => '',
            'title' => 'Entre em contato',
            'subtitle' => 'Preencha o formulário e retornaremos em breve',
            'layout' => 'vertical', // vertical, horizontal
            'bg_color' => '#ffffff',
            'text_color' => '#000000',
            'primary_color' => '#4F46E5',
            'width' => 'medium', // small, medium, large, full
            'padding' => 'normal',
            'border_radius' => '8',
        ],
        'button' => [
            'text' => 'Fale Conosco',
            'bg_color' => '#4F46E5',
            'text_color' => '#ffffff',
            'hover_bg_color' => '#4338CA',
        ],
        'messages' => [
            'success_title' => 'Mensagem enviada!',
            'success_text' => 'Obrigado pelo contato. Retornaremos em breve.',
            'error_title' => 'Erro ao enviar',
            'error_text' => 'Tente novamente ou entre em contato por telefone.',
            'privacy_text' => 'Seus dados estão protegidos e não serão compartilhados com terceiros.',
        ],
        'advanced' => [
            'capture_utm' => true,
            'capture_user_agent' => true,
            'duplicate_prevention_hours' => 24,
            'require_privacy_consent' => false,
        ],
    ];
    
    add_option('rankito_leadgen_settings', $default_settings);
});
