<?php
/**
 * Plugin Name: Rankito Tracking
 * Plugin URI: https://rankitocrm.com
 * Description: Rastreamento automático de conversões para Rankito CRM
 * Version: 2.0.5
 * Author: Anderson Melo SEO
 * Author URI: https://rankitocrm.com
 * Text Domain: rankito-tracking
 * License: GPL v2 or later
 */

if (!defined('ABSPATH')) exit;

class RankRentTracker {
    private $tracking_url = '';

    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));
        add_action('wp_footer', array($this, 'inject_tracking_pixel'));
        add_action('wp_ajax_test_connection', array($this, 'test_connection'));
        add_action('wp_ajax_nopriv_test_connection', array($this, 'test_connection'));
        $this->tracking_url = get_option('rank_rent_tracking_url', '');
    }

    public function add_admin_menu() {
        add_menu_page(
            'Rankito Tracking',
            'Rankito Tracking',
            'manage_options',
            'rank-rent-tracker',
            array($this, 'settings_page'),
            'dashicons-chart-line',
            30
        );
    }

    public function enqueue_admin_assets($hook) {
        if ('toplevel_page_rank-rent-tracker' !== $hook) return;
        
        wp_add_inline_style('wp-admin', '
            .rank-rent-card {
                background: #fff;
                border: 1px solid #ccd0d4;
                border-radius: 4px;
                padding: 20px;
                margin: 20px 0;
                box-shadow: 0 1px 1px rgba(0,0,0,.04);
            }
            .rank-rent-card h2 {
                margin-top: 0;
                padding-bottom: 10px;
                border-bottom: 1px solid #eee;
            }
            .rank-rent-features {
                list-style: none;
                padding: 0;
            }
            .rank-rent-features li {
                padding: 8px 0;
                font-size: 14px;
            }
            #connection-result {
                margin-top: 15px;
            }
        ');
    }

    public function inject_tracking_pixel() {
        if (empty($this->tracking_url)) return;
        ?>
        <script>
        (function() {
            const trackingUrl = '<?php echo esc_js($this->tracking_url); ?>';
            const siteName = '<?php echo esc_js(get_bloginfo('name')); ?>';
            
            // Session management with 30-minute timeout
            function getSessionId() {
                const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
                const now = Date.now();
                let sessionData = sessionStorage.getItem('rankito_session');
                
                if (sessionData) {
                    const data = JSON.parse(sessionData);
                    if (now - data.timestamp < SESSION_TIMEOUT) {
                        data.timestamp = now;
                        sessionStorage.setItem('rankito_session', JSON.stringify(data));
                        return data.id;
                    }
                }
                
                const newSessionId = 'session_' + now + '_' + Math.random().toString(36).substr(2, 9);
                sessionStorage.setItem('rankito_session', JSON.stringify({
                    id: newSessionId,
                    timestamp: now
                }));
                sessionStorage.setItem('rankito_sequence', '0');
                return newSessionId;
            }
            
            // Sequence number management
            function getSequenceNumber() {
                const current = parseInt(sessionStorage.getItem('rankito_sequence') || '0');
                const next = current + 1;
                sessionStorage.setItem('rankito_sequence', next.toString());
                return next;
            }
            
            const sessionId = getSessionId();
            const pageEntryTime = Date.now();
            
            function trackEvent(eventType, metadata = {}) {
                const data = {
                    site_name: siteName,
                    page_url: window.location.href,
                    page_title: document.title,
                    event_type: eventType,
                    session_id: sessionId,
                    sequence_number: eventType === 'page_view' ? getSequenceNumber() : undefined,
                    referrer: document.referrer || null,
                    cta_text: metadata.cta_text || null,
                    metadata: metadata
                };
                
                fetch(trackingUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                    keepalive: true
                }).catch(err => console.error('Tracking error:', err));
            }
            
            function trackPageExit() {
                const timeSpent = Math.round((Date.now() - pageEntryTime) / 1000);
                const exitData = {
                    site_name: siteName,
                    page_url: window.location.href,
                    page_title: document.title,
                    event_type: 'page_exit',
                    session_id: sessionId,
                    time_spent_seconds: timeSpent,
                    referrer: document.referrer || null,
                    metadata: {}
                };
                
                fetch(trackingUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(exitData),
                    keepalive: true
                }).catch(err => {
                    console.error('Page exit tracking error:', err);
                });
            }
            
            // Track page view on load
            trackEvent('page_view');
            
            // Track page exit on multiple events for reliability
            window.addEventListener('visibilitychange', function() {
                if (document.visibilityState === 'hidden') {
                    trackPageExit();
                }
            });
            
            window.addEventListener('beforeunload', trackPageExit);
            window.addEventListener('pagehide', trackPageExit);
            
            // Track clicks
            document.addEventListener('click', function(e) {
                const target = e.target.closest('a, button');
                if (!target) return;
                
                const href = target.href || '';
                const text = target.textContent.trim();
                
                if (href.includes('wa.me') || href.includes('whatsapp')) {
                    trackEvent('whatsapp_click', { cta_text: text, link: href });
                } else if (href.startsWith('tel:')) {
                    trackEvent('phone_click', { cta_text: text, phone: href.replace('tel:', '') });
                } else if (href.startsWith('mailto:')) {
                    trackEvent('email_click', { cta_text: text, email: href.replace('mailto:', '') });
                } else if (target.tagName === 'BUTTON' || target.classList.contains('btn')) {
                    trackEvent('button_click', { cta_text: text });
                }
            });
            
            // Track form submissions
            document.addEventListener('submit', function(e) {
                const form = e.target;
                if (form.tagName === 'FORM') {
                    trackEvent('form_submit', { form_id: form.id || 'unknown' });
                }
            });
        })();
        </script>
        <?php
    }

    public function test_connection() {
        check_ajax_referer('rank_rent_tracker_nonce', 'nonce');
        
        $url = isset($_POST['url']) ? esc_url_raw($_POST['url']) : '';
        
        if (empty($url)) {
            wp_send_json_error('URL não fornecida');
        }
        
        $response = wp_remote_get($url, array('timeout' => 10));
        
        if (is_wp_error($response)) {
            wp_send_json_error('Erro: ' . $response->get_error_message());
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        
        if ($status_code === 200) {
            wp_send_json_success('Conexão estabelecida com sucesso!');
        } else {
            wp_send_json_error('Código de status: ' . $status_code);
        }
    }

    public function settings_page() {
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && check_admin_referer('rank_rent_tracker_save')) {
            $url = isset($_POST['tracking_url']) ? esc_url_raw($_POST['tracking_url']) : '';
            update_option('rank_rent_tracking_url', $url);
            $this->tracking_url = $url;
            echo '<div class="notice notice-success"><p>Configurações salvas com sucesso!</p></div>';
        }
        ?>
        <div class="wrap">
            <h1>🎯 Rankito Tracking - Configurações</h1>
            
            <div class="rank-rent-card">
                <h2>Configuração da URL de Rastreamento</h2>
                <p>Configure a URL de rastreamento fornecida pelo sistema Rankito CRM.</p>
                
                <form method="post" action="">
                    <?php wp_nonce_field('rank_rent_tracker_save'); ?>
                    
                    <table class="form-table">
                        <tr>
                            <th scope="row">
                                <label for="tracking_url">URL de Rastreamento</label>
                            </th>
                            <td>
                                <input 
                                    type="url" 
                                    id="tracking_url" 
                                    name="tracking_url" 
                                    value="<?php echo esc_attr($this->tracking_url); ?>" 
                                    class="regular-text"
                                    placeholder="https://example.com/api/track?token=xyz"
                                    required
                                />
                                <p class="description">
                                    Cole aqui a URL de rastreamento completa fornecida pelo Rankito CRM
                                </p>
                            </td>
                        </tr>
                    </table>
                    
                    <p class="submit">
                        <button type="submit" class="button button-primary">Salvar Configurações</button>
                        <button type="button" id="test-connection" class="button">Testar Conexão</button>
                    </p>
                </form>
                
                <div id="connection-result"></div>
            </div>
            
            <div class="rank-rent-card">
                <h2>📊 Recursos de Rastreamento</h2>
                <ul class="rank-rent-features">
                    <li>✅ Rastreamento automático de visualizações de página</li>
                    <li>✅ Captura de sessões de usuário com tempo de permanência</li>
                    <li>✅ Rastreamento de sequência de navegação</li>
                    <li>✅ Medição de tempo gasto em cada página</li>
                    <li>✅ Detecção de cliques em WhatsApp</li>
                    <li>✅ Detecção de cliques em telefone</li>
                    <li>✅ Detecção de cliques em e-mail</li>
                    <li>✅ Rastreamento de envios de formulários</li>
                    <li>✅ Análise completa de jornada do usuário</li>
                    <li>✅ Cálculo de taxa de rejeição e duração média</li>
                </ul>
            </div>
        </div>
        
        <script>
        jQuery(document).ready(function($) {
            $('#test-connection').on('click', function() {
                const button = $(this);
                const resultDiv = $('#connection-result');
                const url = $('#tracking_url').val();
                
                if (!url) {
                    resultDiv.html('<div class="notice notice-error"><p>Por favor, insira uma URL primeiro.</p></div>');
                    return;
                }
                
                button.prop('disabled', true).text('Testando...');
                resultDiv.html('<div class="notice notice-info"><p>Testando conexão...</p></div>');
                
                $.ajax({
                    url: ajaxurl,
                    method: 'POST',
                    data: {
                        action: 'test_connection',
                        url: url,
                        nonce: '<?php echo wp_create_nonce('rank_rent_tracker_nonce'); ?>'
                    },
                    success: function(response) {
                        if (response.success) {
                            resultDiv.html('<div class="notice notice-success"><p>✅ ' + response.data + '</p></div>');
                        } else {
                            resultDiv.html('<div class="notice notice-error"><p>❌ ' + response.data + '</p></div>');
                        }
                    },
                    error: function() {
                        resultDiv.html('<div class="notice notice-error"><p>❌ Erro ao testar conexão.</p></div>');
                    },
                    complete: function() {
                        button.prop('disabled', false).text('Testar Conexão');
                    }
                });
            });
        });
        </script>
        <?php
    }
}

new RankRentTracker();
