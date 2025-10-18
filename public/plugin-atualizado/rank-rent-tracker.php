<?php
/**
 * Plugin Name: Rank & Rent Tracker
 * Plugin URI: https://example.com
 * Description: Rastreamento automático de conversões para sites Rank & Rent com logs detalhados para debug
 * Version: 2.0.0
 * Author: Seu Nome
 * Author URI: https://example.com
 * License: GPL2
 */

if (!defined('ABSPATH')) {
    exit;
}

class RankRentTracker {
    private $option_name = 'rank_rent_tracking_url';
    
    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('wp_footer', array($this, 'inject_tracking_pixel'), 999);
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_styles'));
        add_action('wp_ajax_test_connection', array($this, 'test_connection'));
    }
    
    public function add_admin_menu() {
        add_options_page(
            'Rank & Rent Tracker',
            'Rank & Rent Tracker',
            'manage_options',
            'rank-rent-tracker',
            array($this, 'settings_page')
        );
    }
    
    public function register_settings() {
        register_setting('rank_rent_tracker', $this->option_name);
    }
    
    public function enqueue_admin_styles($hook) {
        if ($hook !== 'settings_page_rank-rent-tracker') {
            return;
        }
        wp_enqueue_style(
            'rank-rent-admin',
            plugins_url('assets/admin.css', __FILE__)
        );
    }
    
    public function inject_tracking_pixel() {
        $tracking_url = get_option($this->option_name);
        
        if (empty($tracking_url)) {
            return;
        }
        
        ?>
        <script>
        (function() {
            'use strict';
            
            const TRACKING_URL = <?php echo json_encode($tracking_url); ?>;
            
            // Log de inicialização
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('✅ [Rank&Rent] Plugin v2.0 inicializado');
            console.log('📍 [Rank&Rent] Tracking URL:', TRACKING_URL);
            console.log('📍 [Rank&Rent] Página:', window.location.href);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            // Detectar tipo de dispositivo
            function getDeviceType() {
                return /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
            }
            
            // Extrair telefones da página
            function extractPhones() {
                const phoneRegex = /(\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}|\d{11})/g;
                const bodyText = document.body.innerText;
                return bodyText.match(phoneRegex) || [];
            }
            
            // Função principal de rastreamento
            function track(eventType, ctaText = null, metadata = {}) {
                const payload = {
                    page_url: window.location.href,
                    event_type: eventType,
                    cta_text: ctaText,
                    metadata: {
                        referrer: document.referrer || null,
                        device: getDeviceType(),
                        page_title: document.title,
                        detected_phone: extractPhones()[0] || null,
                        timestamp: new Date().toISOString(),
                        ...metadata
                    }
                };
                
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('🚀 [Rank&Rent] Tracking Event');
                console.log('   📌 Tipo:', eventType);
                console.log('   📌 CTA Text:', ctaText);
                console.log('   📌 URL:', TRACKING_URL);
                console.log('   📦 Payload completo:', JSON.stringify(payload, null, 2));
                
                fetch(TRACKING_URL, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(payload),
                    mode: 'cors',
                    credentials: 'omit',
                    keepalive: true
                })
                .then(response => {
                    console.log('✅ [Rank&Rent] Resposta recebida');
                    console.log('   📊 Status:', response.status, response.statusText);
                    console.log('   📊 Headers:', [...response.headers.entries()]);
                    
                    if (!response.ok) {
                        console.error('❌ [Rank&Rent] HTTP Error:', response.status);
                        return response.text().then(text => {
                            console.error('   📄 Body do erro:', text);
                            throw new Error(`HTTP ${response.status}: ${text}`);
                        });
                    }
                    
                    return response.json();
                })
                .then(data => {
                    console.log('✅ [Rank&Rent] Sucesso!');
                    console.log('   📊 Resposta:', data);
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                })
                .catch(error => {
                    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.error('❌ [Rank&Rent] ERRO NO TRACKING');
                    console.error('   🔴 Nome:', error.name);
                    console.error('   🔴 Mensagem:', error.message);
                    console.error('   🔴 Stack:', error.stack);
                    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                });
            }
            
            // Rastrear pageview automaticamente
            console.log('📊 [Rank&Rent] Registrando pageview automático...');
            track('page_view');
            
            // Rastrear cliques
            console.log('👂 [Rank&Rent] Instalando listener de cliques...');
            document.addEventListener('click', function(e) {
                const target = e.target.closest('a, button, [role="button"]');
                
                if (!target) {
                    return;
                }
                
                const href = target.getAttribute('href') || '';
                const text = target.textContent.trim().substring(0, 100);
                
                console.log('🖱️ [Rank&Rent] Click detectado:', {
                    element: target.tagName,
                    href: href,
                    text: text,
                    id: target.id,
                    class: target.className
                });
                
                let eventType = 'button_click';
                
                if (href.startsWith('tel:')) {
                    eventType = 'phone_click';
                    console.log('   📞 [Rank&Rent] Tipo: TELEFONE');
                } else if (href.startsWith('mailto:')) {
                    eventType = 'email_click';
                    console.log('   ✉️ [Rank&Rent] Tipo: EMAIL');
                } else if (href.includes('wa.me') || href.includes('whatsapp') || href.includes('api.whatsapp')) {
                    eventType = 'whatsapp_click';
                    console.log('   💬 [Rank&Rent] Tipo: WHATSAPP');
                }
                
                track(eventType, text, {
                    href: href,
                    element_id: target.id || null,
                    element_class: target.className || null,
                    element_tag: target.tagName
                });
            }, true);
            
            // Rastrear formulários
            console.log('👂 [Rank&Rent] Instalando listener de formulários...');
            document.addEventListener('submit', function(e) {
                if (e.target.matches('form')) {
                    console.log('📝 [Rank&Rent] Form submit detectado:', e.target);
                    track('form_submit', 'Form Submission', {
                        form_id: e.target.id || null,
                        form_action: e.target.action || null
                    });
                }
            }, true);
            
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('✅ [Rank&Rent] Plugin totalmente carregado!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
        })();
        </script>
        <?php
    }
    
    public function test_connection() {
        check_ajax_referer('rank_rent_test', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Sem permissão');
        }
        
        $tracking_url = get_option($this->option_name);
        
        if (empty($tracking_url)) {
            wp_send_json_error('URL não configurada');
        }
        
        $response = wp_remote_post($tracking_url, array(
            'headers' => array('Content-Type' => 'application/json'),
            'body' => json_encode(array(
                'page_url' => home_url(),
                'event_type' => 'test',
                'metadata' => array(
                    'test' => true,
                    'timestamp' => current_time('mysql')
                )
            )),
            'timeout' => 15
        ));
        
        if (is_wp_error($response)) {
            wp_send_json_error('Erro: ' . $response->get_error_message());
        }
        
        $code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        
        if ($code === 200) {
            wp_send_json_success('Conexão validada! Plugin funcionando corretamente.');
        } else {
            wp_send_json_error("Erro HTTP $code: $body");
        }
    }
    
    public function settings_page() {
        if (!current_user_can('manage_options')) {
            return;
        }
        
        if (isset($_POST['submit'])) {
            check_admin_referer('rank_rent_tracker_settings');
            update_option($this->option_name, sanitize_text_field($_POST[$this->option_name]));
            echo '<div class="notice notice-success"><p>Configurações salvas!</p></div>';
        }
        
        $tracking_url = get_option($this->option_name);
        ?>
        <div class="wrap rank-rent-settings">
            <h1>⚡ Rank & Rent Tracker v2.0</h1>
            
            <div class="rank-rent-card">
                <h2>🔗 Configuração da URL de Rastreamento</h2>
                <form method="post" action="">
                    <?php wp_nonce_field('rank_rent_tracker_settings'); ?>
                    
                    <table class="form-table">
                        <tr>
                            <th scope="row">
                                <label for="<?php echo $this->option_name; ?>">URL de Rastreamento</label>
                            </th>
                            <td>
                                <input 
                                    type="url" 
                                    id="<?php echo $this->option_name; ?>"
                                    name="<?php echo $this->option_name; ?>" 
                                    value="<?php echo esc_attr($tracking_url); ?>" 
                                    class="regular-text"
                                    placeholder="https://seu-dominio.supabase.co/functions/v1/track-rank-rent-conversion?token=..."
                                    required
                                />
                                <p class="description">
                                    Cole a URL completa fornecida pelo sistema Rank & Rent (inclui o token)
                                </p>
                            </td>
                        </tr>
                    </table>
                    
                    <?php submit_button('Salvar Configurações'); ?>
                </form>
                
                <?php if (!empty($tracking_url)): ?>
                <hr>
                <h3>🧪 Testar Conexão</h3>
                <button type="button" class="button button-secondary" id="test-connection">
                    Testar Agora
                </button>
                <div id="test-result" style="margin-top: 10px;"></div>
                
                <script>
                document.getElementById('test-connection').addEventListener('click', function() {
                    var btn = this;
                    var result = document.getElementById('test-result');
                    
                    btn.disabled = true;
                    btn.textContent = 'Testando...';
                    result.innerHTML = '';
                    
                    fetch(ajaxurl, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                        body: 'action=test_connection&nonce=<?php echo wp_create_nonce('rank_rent_test'); ?>'
                    })
                    .then(r => r.json())
                    .then(data => {
                        if (data.success) {
                            result.innerHTML = '<div class="notice notice-success inline"><p>✅ ' + data.data + '</p></div>';
                        } else {
                            result.innerHTML = '<div class="notice notice-error inline"><p>❌ ' + data.data + '</p></div>';
                        }
                    })
                    .catch(err => {
                        result.innerHTML = '<div class="notice notice-error inline"><p>❌ Erro: ' + err.message + '</p></div>';
                    })
                    .finally(() => {
                        btn.disabled = false;
                        btn.textContent = 'Testar Agora';
                    });
                });
                </script>
                <?php endif; ?>
            </div>
            
            <div class="rank-rent-card">
                <h2>✨ Funcionalidades (v2.0 - Atualizado)</h2>
                <ul class="rank-rent-features">
                    <li>✅ Rastreamento automático de pageviews</li>
                    <li>✅ Detecção de cliques em telefone</li>
                    <li>✅ Detecção de cliques em email</li>
                    <li>✅ Detecção de cliques em WhatsApp</li>
                    <li>✅ Rastreamento de envios de formulários</li>
                    <li>✅ Detecção automática de tipo de dispositivo</li>
                    <li>✅ Extração automática de números de telefone</li>
                    <li>✅ <strong>NOVO: Logs detalhados no console para debug</strong></li>
                    <li>✅ <strong>NOVO: Fetch API com tratamento de erro completo</strong></li>
                    <li>✅ <strong>NOVO: KeepAlive para garantir envio</strong></li>
                </ul>
            </div>
            
            <div class="rank-rent-card">
                <h2>🔍 Como Debugar (v2.0)</h2>
                <ol>
                    <li>Abra o site em uma aba do navegador</li>
                    <li>Pressione <kbd>F12</kbd> para abrir o Console do Desenvolvedor</li>
                    <li>Procure por mensagens com <code>[Rank&Rent]</code></li>
                    <li>Clique em um botão do WhatsApp ou telefone</li>
                    <li>Verifique se aparece <code>✅ Sucesso!</code> ou <code>❌ ERRO</code></li>
                    <li>Se aparecer erro, copie toda a mensagem e envie para suporte</li>
                </ol>
                <p><strong>Logs que você deve ver:</strong></p>
                <ul>
                    <li><code>✅ [Rank&Rent] Plugin v2.0 inicializado</code></li>
                    <li><code>📊 [Rank&Rent] Registrando pageview automático...</code></li>
                    <li><code>🖱️ [Rank&Rent] Click detectado</code> (ao clicar)</li>
                    <li><code>✅ [Rank&Rent] Sucesso!</code> (conversão registrada)</li>
                </ul>
            </div>
            
            <div class="rank-rent-card">
                <h2>📚 Suporte</h2>
                <p>
                    <strong>Versão:</strong> 2.0.0<br>
                    <strong>Última atualização:</strong> <?php echo date('d/m/Y'); ?>
                </p>
                <p>
                    Para suporte, envie os logs do console (F12) junto com sua dúvida.
                </p>
            </div>
        </div>
        <?php
    }
}

// Inicializar plugin
new RankRentTracker();
