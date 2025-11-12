<?php
/**
 * Plugin Name: RankIto LeadGen
 * Description: Rastreamento automático de conversões (cliques, page views, formulários) para Rankito CRM
 * Version: 1.0.1
 * Author: Anderson Melo SEO
 * Author URI: https://andersonmeloseo.com.br
 */

if (!defined('ABSPATH')) {
    exit;
}

class RankRentTracker {
    private $settings;

    public function __construct() {
        $this->settings = get_option('rank_rent_tracker_settings', [
            'tracking_url' => '',
        ]);

        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);
        add_action('wp_footer', [$this, 'inject_tracking_pixel']);
        add_action('wp_ajax_rank_rent_test_connection', [$this, 'test_connection']);
    }

    public function add_admin_menu() {
        add_menu_page(
            'RankIto LeadGen',
            'RankIto LeadGen',
            'manage_options',
            'rank-rent-tracker',
            [$this, 'settings_page'],
            'dashicons-clipboard',
            30
        );
    }

    public function enqueue_admin_assets($hook) {
        if ($hook !== 'toplevel_page_rank-rent-tracker') {
            return;
        }
        wp_enqueue_style('rank-rent-tracker-admin', plugins_url('assets/admin.css', __FILE__));
    }

    public function inject_tracking_pixel() {
        if (empty($this->settings['tracking_url'])) {
            return;
        }

        $tracking_url = esc_url($this->settings['tracking_url']);
        ?>
        <script>
        (function() {
            'use strict';
            
            const TRACKING_URL = '<?php echo $tracking_url; ?>';
            
            // Função para enviar eventos
            async function trackEvent(eventType, data = {}) {
                try {
                    const payload = {
                        page_url: window.location.href,
                        page_title: document.title,
                        event_type: eventType,
                        ...data
                    };
                    
                    await fetch(TRACKING_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(payload)
                    });
                } catch (error) {
                    console.error('Tracking error:', error);
                }
            }
            
            // Rastrear page view
            trackEvent('page_view');
            
            // Rastrear cliques em links
            document.addEventListener('click', function(e) {
                const element = e.target.closest('a, button');
                if (!element) return;
                
                const href = element.getAttribute('href') || '';
                const text = element.textContent.trim();
                const classes = element.className;
                
                let eventType = 'button_click';
                let metadata = {
                    cta_text: text,
                    element_tag: element.tagName,
                    element_class: classes,
                    element_id: element.id || null
                };
                
                // Detectar tipo de clique
                if (href.includes('wa.me') || href.includes('whatsapp')) {
                    eventType = 'whatsapp_click';
                    metadata.href = href;
                } else if (href.startsWith('tel:')) {
                    eventType = 'phone_click';
                    metadata.phone = href.replace('tel:', '');
                } else if (href.startsWith('mailto:')) {
                    eventType = 'email_click';
                    metadata.email = href.replace('mailto:', '');
                } else if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
                    eventType = 'button_click';
                }
                
                trackEvent(eventType, { metadata });
            }, true);
            
            // Rastrear envio de formulários
            document.addEventListener('submit', function(e) {
                if (e.target.tagName === 'FORM') {
                    const formName = e.target.getAttribute('name') || e.target.getAttribute('id') || 'form';
                    trackEvent('form_submit', {
                        metadata: {
                            form_name: formName,
                            form_action: e.target.action
                        }
                    });
                }
            }, true);
        })();
        </script>
        <?php
    }

    public function test_connection() {
        check_ajax_referer('rank_rent_tracker_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Permissão negada']);
        }
        
        $tracking_url = $_POST['tracking_url'] ?? '';
        
        if (empty($tracking_url)) {
            wp_send_json_error(['message' => 'URL de rastreamento não configurada']);
        }
        
        // Enviar evento de teste via GET
        $response = wp_remote_get($tracking_url, [
            'timeout' => 15,
            'headers' => ['Accept' => 'application/json']
        ]);
        
        if (is_wp_error($response)) {
            wp_send_json_error(['message' => 'Erro de conexão: ' . $response->get_error_message()]);
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if ($status_code === 200 && ($data['success'] ?? false)) {
            wp_send_json_success([
                'message' => '✅ Conexão estabelecida! Pixel instalado com sucesso.',
                'site_name' => $data['site_name'] ?? ''
            ]);
        } else {
            wp_send_json_error(['message' => $data['message'] ?? 'Falha na conexão']);
        }
    }

    public function settings_page() {
        if (isset($_POST['rank_rent_tracker_submit'])) {
            check_admin_referer('rank_rent_tracker_settings');
            
            $this->settings['tracking_url'] = sanitize_text_field($_POST['tracking_url']);
            update_option('rank_rent_tracker_settings', $this->settings);
            
            echo '<div class="notice notice-success"><p>Configurações salvas!</p></div>';
        }
        
        $tracking_url = esc_attr($this->settings['tracking_url']);
        $nonce = wp_create_nonce('rank_rent_tracker_nonce');
        ?>
        <div class="wrap">
            <h1>⚡ RankIto LeadGen</h1>
            
            <div class="card" style="max-width: 800px; margin-top: 20px;">
                <h2>⚙️ Configuração</h2>
                
                <form method="post">
                    <?php wp_nonce_field('rank_rent_tracker_settings'); ?>
                    
                    <table class="form-table">
                        <tr>
                            <th><label for="tracking_url">URL de Rastreamento</label></th>
                            <td>
                                <input type="url" 
                                       id="tracking_url" 
                                       name="tracking_url" 
                                       value="<?php echo $tracking_url; ?>" 
                                       class="regular-text"
                                       placeholder="https://jhzmgexprjnpgadkxjup.supabase.co/functions/v1/api-track?token=..."
                                       required>
                                <p class="description">
                                    Cole aqui a URL de rastreamento fornecida pelo Rankito CRM (inclui o token)
                                </p>
                            </td>
                        </tr>
                    </table>
                    
                    <p class="submit">
                        <button type="submit" name="rank_rent_tracker_submit" class="button button-primary">
                            💾 Salvar Configurações
                        </button>
                        
                        <button type="button" id="test-connection" class="button">
                            🧪 Testar Conexão
                        </button>
                    </p>
                </form>
                
                <div id="test-result" style="margin-top: 15px;"></div>
            </div>
            
            <div class="card" style="max-width: 800px; margin-top: 20px;">
                <h2>📊 Recursos de Rastreamento</h2>
                <ul style="list-style: disc; margin-left: 20px;">
                    <li><strong>Page Views:</strong> Registra automaticamente cada visualização de página</li>
                    <li><strong>Cliques em WhatsApp:</strong> Detecta cliques em links do WhatsApp</li>
                    <li><strong>Cliques em Telefone:</strong> Rastreia cliques em links tel:</li>
                    <li><strong>Cliques em Email:</strong> Rastreia cliques em links mailto:</li>
                    <li><strong>Cliques em Botões:</strong> Monitora cliques em botões e CTAs</li>
                    <li><strong>Envio de Formulários:</strong> Detecta submissões de formulários</li>
                </ul>
            </div>
            
            <script>
            document.getElementById('test-connection')?.addEventListener('click', async function() {
                const btn = this;
                const resultDiv = document.getElementById('test-result');
                const trackingUrl = document.getElementById('tracking_url').value;
                
                if (!trackingUrl) {
                    resultDiv.innerHTML = '<div class="notice notice-error"><p>Configure a URL de rastreamento primeiro</p></div>';
                    return;
                }
                
                btn.disabled = true;
                btn.textContent = '⏳ Testando...';
                resultDiv.innerHTML = '';
                
                try {
                    const formData = new FormData();
                    formData.append('action', 'rank_rent_test_connection');
                    formData.append('nonce', '<?php echo $nonce; ?>');
                    formData.append('tracking_url', trackingUrl);
                    
                    const response = await fetch(ajaxurl, {
                        method: 'POST',
                        body: formData
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        resultDiv.innerHTML = `<div class="notice notice-success"><p>${data.data.message}</p></div>`;
                    } else {
                        resultDiv.innerHTML = `<div class="notice notice-error"><p>❌ ${data.data.message}</p></div>`;
                    }
                } catch (error) {
                    resultDiv.innerHTML = '<div class="notice notice-error"><p>Erro ao testar conexão</p></div>';
                } finally {
                    btn.disabled = false;
                    btn.textContent = '🧪 Testar Conexão';
                }
            });
            </script>
        </div>
        <?php
    }
}

new RankRentTracker();
