<?php
if (!defined('ABSPATH')) exit;

$settings = get_option('rankito_leadgen_settings');

if (isset($_POST['rankito_save_settings']) && check_admin_referer('rankito_settings_save')) {
    update_option('rankito_leadgen_settings', $_POST['rankito_settings']);
    echo '<div class="notice notice-success"><p>Configurações salvas com sucesso!</p></div>';
    $settings = get_option('rankito_leadgen_settings');
}
?>

<div class="wrap rankito-admin-wrap">
    <h1>Rankito LeadGen - Configurações</h1>
    
    <form method="post" action="">
        <?php wp_nonce_field('rankito_settings_save'); ?>
        
        <h2 class="nav-tab-wrapper">
            <a href="#tab-integration" class="nav-tab nav-tab-active">Integração RankiTO</a>
            <a href="#tab-trigger" class="nav-tab">Botão/Link</a>
            <a href="#tab-fields" class="nav-tab">Campos do Formulário</a>
            <a href="#tab-visual" class="nav-tab">Visual do Modal</a>
            <a href="#tab-messages" class="nav-tab">Mensagens</a>
            <a href="#tab-advanced" class="nav-tab">Avançado</a>
            <a href="#tab-preview" class="nav-tab">Preview & Testes</a>
        </h2>
        
        <div id="tab-integration" class="tab-content active">
            <h2>🔗 Integração com RankiTO</h2>
            <table class="form-table">
                <tr>
                    <th>URL da API</th>
                    <td>
                        <input type="url" 
                               name="rankito_settings[api][url]" 
                               value="<?php echo esc_attr($settings['api']['url'] ?? ''); ?>"
                               class="regular-text"
                               placeholder="https://seu-site.com/api/external-leads" />
                        <p class="description">Cole a URL da API fornecida pelo RankiTO</p>
                    </td>
                </tr>
                <tr>
                    <th>Token de Autenticação</th>
                    <td>
                        <input type="password" 
                               name="rankito_settings[api][token]" 
                               value="<?php echo esc_attr($settings['api']['token'] ?? ''); ?>"
                               class="regular-text"
                               placeholder="rkt_..." />
                        <p class="description">Token fornecido pela integração RankiTO</p>
                    </td>
                </tr>
                <tr>
                    <th>Testar Conexão</th>
                    <td>
                        <button type="button" id="rankito-test-connection" class="button button-secondary">
                            🧪 Testar Conexão
                        </button>
                        <span id="rankito-connection-status"></span>
                        <p class="description">Verifique se a integração está funcionando corretamente</p>
                    </td>
                </tr>
            </table>
        </div>
        
        <div id="tab-trigger" class="tab-content">
            <h2>🎯 Configuração do Botão/Link</h2>
            <table class="form-table">
                <tr>
                    <th>Tipo de Gatilho</th>
                    <td>
                        <label>
                            <input type="radio" name="rankito_settings[trigger][type]" value="floating" 
                                   <?php checked($settings['trigger']['type'] ?? 'floating', 'floating'); ?> />
                            Botão Flutuante
                        </label><br>
                        <label>
                            <input type="radio" name="rankito_settings[trigger][type]" value="shortcode"
                                   <?php checked($settings['trigger']['type'] ?? 'floating', 'shortcode'); ?> />
                            Shortcode [rankito_button]
                        </label><br>
                        <label>
                            <input type="radio" name="rankito_settings[trigger][type]" value="link"
                                   <?php checked($settings['trigger']['type'] ?? 'floating', 'link'); ?> />
                            Link de Texto
                        </label>
                    </td>
                </tr>
                <tr class="floating-options">
                    <th>Texto do Botão</th>
                    <td>
                        <input type="text" 
                               name="rankito_settings[trigger][floating][text]" 
                               value="<?php echo esc_attr($settings['trigger']['floating']['text'] ?? 'Falar com Consultor'); ?>"
                               class="regular-text" />
                    </td>
                </tr>
                <tr class="floating-options">
                    <th>Cor de Fundo</th>
                    <td>
                        <input type="text" 
                               name="rankito_settings[trigger][floating][bg_color]" 
                               value="<?php echo esc_attr($settings['trigger']['floating']['bg_color'] ?? '#0066cc'); ?>"
                               class="rankito-color-picker" />
                    </td>
                </tr>
                <tr class="floating-options">
                    <th>Cor do Texto</th>
                    <td>
                        <input type="text" 
                               name="rankito_settings[trigger][floating][text_color]" 
                               value="<?php echo esc_attr($settings['trigger']['floating']['text_color'] ?? '#ffffff'); ?>"
                               class="rankito-color-picker" />
                    </td>
                </tr>
                <tr class="floating-options">
                    <th>Posição</th>
                    <td>
                        <select name="rankito_settings[trigger][floating][position]">
                            <option value="bottom-right" <?php selected($settings['trigger']['floating']['position'] ?? 'bottom-right', 'bottom-right'); ?>>
                                Inferior Direito
                            </option>
                            <option value="bottom-left" <?php selected($settings['trigger']['floating']['position'] ?? 'bottom-right', 'bottom-left'); ?>>
                                Inferior Esquerdo
                            </option>
                        </select>
                    </td>
                </tr>
            </table>
        </div>
        
        <!-- Outras abas seriam implementadas de forma similar -->
        
        <p class="submit">
            <button type="submit" name="rankito_save_settings" class="button button-primary button-large">
                💾 Salvar Configurações
            </button>
        </p>
    </form>
</div>

<script>
jQuery(document).ready(function($) {
    // Color pickers
    $('.rankito-color-picker').wpColorPicker();
    
    // Tabs
    $('.nav-tab').on('click', function(e) {
        e.preventDefault();
        const target = $(this).attr('href');
        $('.nav-tab').removeClass('nav-tab-active');
        $(this).addClass('nav-tab-active');
        $('.tab-content').removeClass('active');
        $(target).addClass('active');
    });
    
    // Test connection
    $('#rankito-test-connection').on('click', function() {
        const btn = $(this);
        const status = $('#rankito-connection-status');
        
        btn.prop('disabled', true).text('⏳ Testando...');
        status.html('');
        
        $.ajax({
            url: rankitoAdmin.ajax_url,
            method: 'POST',
            data: {
                action: 'rankito_test_connection',
                nonce: rankitoAdmin.nonce
            },
            success: function(response) {
                if (response.success) {
                    status.html('<span style="color: green;">✅ ' + response.data.message + '</span>');
                } else {
                    status.html('<span style="color: red;">❌ ' + response.data.message + '</span>');
                }
            },
            error: function() {
                status.html('<span style="color: red;">❌ Erro ao testar conexão</span>');
            },
            complete: function() {
                btn.prop('disabled', false).text('🧪 Testar Conexão');
            }
        });
    });
});
</script>

<style>
.rankito-admin-wrap { max-width: 1200px; }
.tab-content { display: none; padding: 20px 0; }
.tab-content.active { display: block; }
.form-table th { width: 220px; }
</style>
