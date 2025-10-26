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
    <h1>🚀 Rankito LeadGen - Configurações</h1>
    
    <form method="post" action="" id="rankito-settings-form">
        <?php wp_nonce_field('rankito_settings_save'); ?>
        
        <h2 class="nav-tab-wrapper">
            <a href="#tab-integration" class="nav-tab nav-tab-active">🔗 Integração</a>
            <a href="#tab-trigger" class="nav-tab">🎯 Gatilho</a>
            <a href="#tab-fields" class="nav-tab">📝 Campos</a>
            <a href="#tab-custom-fields" class="nav-tab">⚡ Campos Personalizados</a>
            <a href="#tab-visual" class="nav-tab">🎨 Visual</a>
            <a href="#tab-messages" class="nav-tab">💬 Mensagens</a>
            <a href="#tab-advanced" class="nav-tab">⚙️ Avançado</a>
            <a href="#tab-preview" class="nav-tab">👀 Preview</a>
        </h2>
        
        <!-- TAB 1: INTEGRAÇÃO -->
        <div id="tab-integration" class="tab-content active">
            <h2>🔗 Integração com RankiTO CRM</h2>
            <table class="form-table">
                <tr>
                    <th>URL da API</th>
                    <td>
                        <input type="url" 
                               name="rankito_settings[api][url]" 
                               value="<?php echo esc_attr($settings['api']['url'] ?? 'https://app.rankitocrm.com/api/external-leads'); ?>"
                               class="regular-text"
                               placeholder="https://app.rankitocrm.com/api/external-leads" />
                        <p class="description">URL padrão: <code>https://app.rankitocrm.com/api/external-leads</code></p>
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
                        <p class="description">Token fornecido pela integração WordPress no RankiTO CRM</p>
                    </td>
                </tr>
                <tr>
                    <th>Testar Conexão</th>
                    <td>
                        <button type="button" id="rankito-test-connection" class="button button-secondary">
                            🧪 Testar Conexão
                        </button>
                        <span id="rankito-connection-status"></span>
                        <p class="description">Verifique se a integração está funcionando</p>
                    </td>
                </tr>
            </table>
        </div>
        
        <!-- TAB 2: GATILHO -->
        <div id="tab-trigger" class="tab-content">
            <h2>🎯 Configuração do Gatilho</h2>
            <table class="form-table">
                <tr>
                    <th>Tipo de Gatilho</th>
                    <td>
                        <label style="display: block; margin-bottom: 8px;">
                            <input type="radio" name="rankito_settings[trigger][type]" value="floating" 
                                   <?php checked($settings['trigger']['type'] ?? 'floating', 'floating'); ?> />
                            <strong>Botão Flutuante</strong> - Fixo na tela (recomendado)
                        </label>
                        <label style="display: block; margin-bottom: 8px;">
                            <input type="radio" name="rankito_settings[trigger][type]" value="shortcode"
                                   <?php checked($settings['trigger']['type'] ?? 'floating', 'shortcode'); ?> />
                            <strong>Shortcode</strong> - Use <code>[rankito_button]</code>
                        </label>
                        <label style="display: block;">
                            <input type="radio" name="rankito_settings[trigger][type]" value="link"
                                   <?php checked($settings['trigger']['type'] ?? 'floating', 'link'); ?> />
                            <strong>Link de Texto</strong> - Use <code>[rankito_link]</code>
                        </label>
                    </td>
                </tr>
                <tr class="floating-options">
                    <th>Texto do Botão Flutuante</th>
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
                            <option value="bottom-right" <?php selected($settings['trigger']['floating']['position'] ?? 'bottom-right', 'bottom-right'); ?>>Inferior Direito</option>
                            <option value="bottom-left" <?php selected($settings['trigger']['floating']['position'] ?? 'bottom-right', 'bottom-left'); ?>>Inferior Esquerdo</option>
                        </select>
                    </td>
                </tr>
            </table>
        </div>

        <!-- TAB 3: CAMPOS PADRÃO -->
        <div id="tab-fields" class="tab-content">
            <h2>📝 Campos do Formulário</h2>
            <p class="description" style="margin-bottom: 20px;">Ative ou desative os campos padrão do formulário</p>
            <table class="form-table">
                <tr>
                    <th>Campo Nome</th>
                    <td>
                        <label>
                            <input type="checkbox" name="rankito_settings[fields][name][enabled]" value="1" <?php checked($settings['fields']['name']['enabled'] ?? true, true); ?> disabled />
                            Ativo (obrigatório)
                        </label>
                        <input type="hidden" name="rankito_settings[fields][name][enabled]" value="1" />
                        <br>
                        <input type="text" name="rankito_settings[fields][name][label]" value="<?php echo esc_attr($settings['fields']['name']['label'] ?? 'Nome'); ?>" placeholder="Label" class="regular-text" style="margin-top: 8px;" />
                        <input type="text" name="rankito_settings[fields][name][placeholder]" value="<?php echo esc_attr($settings['fields']['name']['placeholder'] ?? 'Seu nome'); ?>" placeholder="Placeholder" class="regular-text" style="margin-top: 4px;" />
                    </td>
                </tr>
                <tr>
                    <th>Campo Email</th>
                    <td>
                        <label>
                            <input type="checkbox" name="rankito_settings[fields][email][enabled]" value="1" <?php checked($settings['fields']['email']['enabled'] ?? true, true); ?> />
                            Ativo
                        </label>
                        <label style="margin-left: 20px;">
                            <input type="checkbox" name="rankito_settings[fields][email][required]" value="1" <?php checked($settings['fields']['email']['required'] ?? false, true); ?> />
                            Obrigatório
                        </label>
                        <br>
                        <input type="text" name="rankito_settings[fields][email][label]" value="<?php echo esc_attr($settings['fields']['email']['label'] ?? 'Email'); ?>" placeholder="Label" class="regular-text" style="margin-top: 8px;" />
                        <input type="text" name="rankito_settings[fields][email][placeholder]" value="<?php echo esc_attr($settings['fields']['email']['placeholder'] ?? 'seu@email.com'); ?>" placeholder="Placeholder" class="regular-text" style="margin-top: 4px;" />
                    </td>
                </tr>
                <tr>
                    <th>Campo Telefone</th>
                    <td>
                        <label>
                            <input type="checkbox" name="rankito_settings[fields][phone][enabled]" value="1" <?php checked($settings['fields']['phone']['enabled'] ?? true, true); ?> />
                            Ativo
                        </label>
                        <label style="margin-left: 20px;">
                            <input type="checkbox" name="rankito_settings[fields][phone][required]" value="1" <?php checked($settings['fields']['phone']['required'] ?? false, true); ?> />
                            Obrigatório
                        </label>
                        <br>
                        <input type="text" name="rankito_settings[fields][phone][label]" value="<?php echo esc_attr($settings['fields']['phone']['label'] ?? 'Telefone'); ?>" placeholder="Label" class="regular-text" style="margin-top: 8px;" />
                        <input type="text" name="rankito_settings[fields][phone][placeholder]" value="<?php echo esc_attr($settings['fields']['phone']['placeholder'] ?? '(11) 99999-9999'); ?>" placeholder="Placeholder" class="regular-text" style="margin-top: 4px;" />
                    </td>
                </tr>
                <tr>
                    <th>Campo Empresa</th>
                    <td>
                        <label>
                            <input type="checkbox" name="rankito_settings[fields][company][enabled]" value="1" <?php checked($settings['fields']['company']['enabled'] ?? false, true); ?> />
                            Ativo
                        </label>
                        <label style="margin-left: 20px;">
                            <input type="checkbox" name="rankito_settings[fields][company][required]" value="1" <?php checked($settings['fields']['company']['required'] ?? false, true); ?> />
                            Obrigatório
                        </label>
                        <br>
                        <input type="text" name="rankito_settings[fields][company][label]" value="<?php echo esc_attr($settings['fields']['company']['label'] ?? 'Empresa'); ?>" placeholder="Label" class="regular-text" style="margin-top: 8px;" />
                        <input type="text" name="rankito_settings[fields][company][placeholder]" value="<?php echo esc_attr($settings['fields']['company']['placeholder'] ?? 'Nome da empresa'); ?>" placeholder="Placeholder" class="regular-text" style="margin-top: 4px;" />
                    </td>
                </tr>
                <tr>
                    <th>Campo Mensagem</th>
                    <td>
                        <label>
                            <input type="checkbox" name="rankito_settings[fields][message][enabled]" value="1" <?php checked($settings['fields']['message']['enabled'] ?? true, true); ?> />
                            Ativo
                        </label>
                        <label style="margin-left: 20px;">
                            <input type="checkbox" name="rankito_settings[fields][message][required]" value="1" <?php checked($settings['fields']['message']['required'] ?? false, true); ?> />
                            Obrigatório
                        </label>
                        <br>
                        <input type="text" name="rankito_settings[fields][message][label]" value="<?php echo esc_attr($settings['fields']['message']['label'] ?? 'Mensagem'); ?>" placeholder="Label" class="regular-text" style="margin-top: 8px;" />
                        <input type="text" name="rankito_settings[fields][message][placeholder]" value="<?php echo esc_attr($settings['fields']['message']['placeholder'] ?? 'Como podemos ajudar?'); ?>" placeholder="Placeholder" class="regular-text" style="margin-top: 4px;" />
                    </td>
                </tr>
            </table>
        </div>

        <!-- TAB 4: CAMPOS PERSONALIZADOS -->
        <div id="tab-custom-fields" class="tab-content">
            <h2>⚡ Campos Personalizados</h2>
            <p class="description" style="margin-bottom: 20px;">Crie campos customizados para capturar informações específicas (estilo Leadster)</p>
            
            <div id="rankito-custom-fields-list">
                <?php
                $customFields = $settings['fields']['custom'] ?? [];
                if (empty($customFields)) {
                    echo '<p style="color: #999; font-style: italic;">Nenhum campo personalizado criado ainda</p>';
                }
                ?>
            </div>

            <button type="button" id="rankito-add-custom-field" class="button button-primary" style="margin-top: 15px;">
                ➕ Adicionar Campo Personalizado
            </button>

            <div id="rankito-custom-field-modal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 999999; align-items: center; justify-content: center;">
                <div style="background: white; padding: 30px; border-radius: 8px; max-width: 500px; width: 90%;">
                    <h3 style="margin-top: 0;">Novo Campo Personalizado</h3>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Tipo de Campo:</label>
                        <select id="custom-field-type" style="width: 100%; padding: 8px;">
                            <option value="text">Texto</option>
                            <option value="email">Email</option>
                            <option value="tel">Telefone</option>
                            <option value="number">Número</option>
                            <option value="textarea">Área de Texto</option>
                            <option value="select">Lista Suspensa (Select)</option>
                            <option value="radio">Múltipla Escolha (Radio)</option>
                            <option value="checkbox">Caixas de Seleção (Checkbox)</option>
                        </select>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Label (título):</label>
                        <input type="text" id="custom-field-label" placeholder="Ex: Qual seu orçamento?" style="width: 100%; padding: 8px;" />
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Placeholder:</label>
                        <input type="text" id="custom-field-placeholder" placeholder="Texto de exemplo..." style="width: 100%; padding: 8px;" />
                    </div>

                    <div style="margin-bottom: 15px;" id="custom-field-options-wrapper" style="display: none;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Opções (uma por linha):</label>
                        <textarea id="custom-field-options" rows="4" placeholder="Opção 1&#10;Opção 2&#10;Opção 3" style="width: 100%; padding: 8px;"></textarea>
                        <small style="color: #666;">Para select/radio/checkbox - uma opção por linha</small>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <label>
                            <input type="checkbox" id="custom-field-required" />
                            Campo Obrigatório
                        </label>
                    </div>

                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button type="button" id="rankito-cancel-custom-field" class="button">Cancelar</button>
                        <button type="button" id="rankito-save-custom-field" class="button button-primary">Adicionar Campo</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- TAB 5: VISUAL -->
        <div id="tab-visual" class="tab-content">
            <h2>🎨 Visual do Modal</h2>
            <table class="form-table">
                <tr>
                    <th>Título do Modal</th>
                    <td>
                        <input type="text" name="rankito_settings[modal][title]" value="<?php echo esc_attr($settings['modal']['title'] ?? 'Fale com nossa equipe'); ?>" class="regular-text" />
                    </td>
                </tr>
                <tr>
                    <th>Subtítulo</th>
                    <td>
                        <input type="text" name="rankito_settings[modal][subtitle]" value="<?php echo esc_attr($settings['modal']['subtitle'] ?? 'Preencha o formulário e entraremos em contato'); ?>" class="large-text" />
                    </td>
                </tr>
                <tr>
                    <th>Logo (URL)</th>
                    <td>
                        <input type="url" name="rankito_settings[modal][logo_url]" value="<?php echo esc_attr($settings['modal']['logo_url'] ?? ''); ?>" class="large-text" placeholder="https://..." />
                        <p class="description">URL da imagem do logo (opcional)</p>
                    </td>
                </tr>
                <tr>
                    <th>Cor de Fundo</th>
                    <td>
                        <input type="text" name="rankito_settings[modal][bg_color]" value="<?php echo esc_attr($settings['modal']['bg_color'] ?? '#ffffff'); ?>" class="rankito-color-picker" />
                    </td>
                </tr>
                <tr>
                    <th>Cor do Texto</th>
                    <td>
                        <input type="text" name="rankito_settings[modal][text_color]" value="<?php echo esc_attr($settings['modal']['text_color'] ?? '#333333'); ?>" class="rankito-color-picker" />
                    </td>
                </tr>
                <tr>
                    <th>Tamanho do Modal</th>
                    <td>
                        <select name="rankito_settings[modal][size]">
                            <option value="small" <?php selected($settings['modal']['size'] ?? 'medium', 'small'); ?>>Pequeno (400px)</option>
                            <option value="medium" <?php selected($settings['modal']['size'] ?? 'medium', 'medium'); ?>>Médio (600px)</option>
                            <option value="large" <?php selected($settings['modal']['size'] ?? 'medium', 'large'); ?>>Grande (800px)</option>
                        </select>
                    </td>
                </tr>
                <tr>
                    <th>Texto do Botão Enviar</th>
                    <td>
                        <input type="text" name="rankito_settings[button][text]" value="<?php echo esc_attr($settings['button']['text'] ?? 'Enviar Mensagem'); ?>" class="regular-text" />
                    </td>
                </tr>
                <tr>
                    <th>Cor do Botão</th>
                    <td>
                        <input type="text" name="rankito_settings[button][bg_color]" value="<?php echo esc_attr($settings['button']['bg_color'] ?? '#0066cc'); ?>" class="rankito-color-picker" />
                    </td>
                </tr>
                <tr>
                    <th>Cor do Texto do Botão</th>
                    <td>
                        <input type="text" name="rankito_settings[button][text_color]" value="<?php echo esc_attr($settings['button']['text_color'] ?? '#ffffff'); ?>" class="rankito-color-picker" />
                    </td>
                </tr>
            </table>
        </div>

        <!-- TAB 6: MENSAGENS -->
        <div id="tab-messages" class="tab-content">
            <h2>💬 Mensagens do Sistema</h2>
            <table class="form-table">
                <tr>
                    <th>Título de Sucesso</th>
                    <td>
                        <input type="text" name="rankito_settings[messages][success_title]" value="<?php echo esc_attr($settings['messages']['success_title'] ?? '✓ Enviado com sucesso!'); ?>" class="regular-text" />
                    </td>
                </tr>
                <tr>
                    <th>Texto de Sucesso</th>
                    <td>
                        <textarea name="rankito_settings[messages][success_text]" rows="2" class="large-text"><?php echo esc_textarea($settings['messages']['success_text'] ?? 'Obrigado! Entraremos em contato em breve.'); ?></textarea>
                    </td>
                </tr>
                <tr>
                    <th>Erro Genérico</th>
                    <td>
                        <input type="text" name="rankito_settings[messages][error_generic]" value="<?php echo esc_attr($settings['messages']['error_generic'] ?? 'Erro ao enviar. Tente novamente.'); ?>" class="large-text" />
                    </td>
                </tr>
                <tr>
                    <th>Texto de Privacidade</th>
                    <td>
                        <textarea name="rankito_settings[messages][privacy_text]" rows="2" class="large-text"><?php echo esc_textarea($settings['messages']['privacy_text'] ?? 'Seus dados estão seguros e não serão compartilhados.'); ?></textarea>
                    </td>
                </tr>
            </table>
        </div>

        <!-- TAB 7: AVANÇADO -->
        <div id="tab-advanced" class="tab-content">
            <h2>⚙️ Configurações Avançadas</h2>
            <table class="form-table">
                <tr>
                    <th>Captura de Dados</th>
                    <td>
                        <label style="display: block; margin-bottom: 8px;">
                            <input type="checkbox" name="rankito_settings[advanced][capture_url]" value="1" <?php checked($settings['advanced']['capture_url'] ?? true, true); ?> />
                            Capturar URL da página
                        </label>
                        <label style="display: block; margin-bottom: 8px;">
                            <input type="checkbox" name="rankito_settings[advanced][capture_title]" value="1" <?php checked($settings['advanced']['capture_title'] ?? true, true); ?> />
                            Capturar título da página
                        </label>
                        <label style="display: block; margin-bottom: 8px;">
                            <input type="checkbox" name="rankito_settings[advanced][capture_utm]" value="1" <?php checked($settings['advanced']['capture_utm'] ?? true, true); ?> />
                            Capturar parâmetros UTM (utm_source, utm_campaign, utm_medium)
                        </label>
                        <label style="display: block;">
                            <input type="checkbox" name="rankito_settings[advanced][capture_user_agent]" value="1" <?php checked($settings['advanced']['capture_user_agent'] ?? true, true); ?> />
                            Capturar User Agent (navegador/dispositivo)
                        </label>
                    </td>
                </tr>
                <tr>
                    <th>Modo Debug</th>
                    <td>
                        <label>
                            <input type="checkbox" name="rankito_settings[advanced][debug_mode]" value="1" <?php checked($settings['advanced']['debug_mode'] ?? false, true); ?> />
                            Ativar logs no console do navegador
                        </label>
                        <p class="description">Útil para debugging (F12 no navegador)</p>
                    </td>
                </tr>
                <tr>
                    <th>Timeout (segundos)</th>
                    <td>
                        <input type="number" name="rankito_settings[advanced][timeout]" value="<?php echo esc_attr($settings['advanced']['timeout'] ?? 30); ?>" min="5" max="60" />
                        <p class="description">Tempo máximo para envio do formulário</p>
                    </td>
                </tr>
            </table>
        </div>

        <!-- TAB 8: PREVIEW -->
        <div id="tab-preview" class="tab-content">
            <h2>👀 Preview & Testes</h2>
            <p class="description" style="margin-bottom: 20px;">Visualize como o modal ficará para seus visitantes</p>
            
            <div style="background: #f5f5f5; padding: 30px; border-radius: 8px; text-align: center;">
                <button type="button" id="rankito-preview-modal" class="button button-large button-primary" style="font-size: 16px; padding: 10px 30px;">
                    👁️ Ver Preview do Modal
                </button>
                <p style="margin-top: 15px; color: #666;">
                    <small>Teste a aparência e funcionamento sem enviar dados reais</small>
                </p>
            </div>

            <div style="margin-top: 30px; padding: 20px; background: white; border: 1px solid #ddd; border-radius: 8px;">
                <h3 style="margin-top: 0;">📊 Estatísticas de Uso</h3>
                <p style="color: #666;">As estatísticas de captura aparecerão aqui após você começar a receber leads via plugin.</p>
            </div>
        </div>
        
        <p class="submit">
            <button type="submit" name="rankito_save_settings" class="button button-primary button-large">
                💾 Salvar Todas as Configurações
            </button>
        </p>
    </form>
</div>

<script>
jQuery(document).ready(function($) {
    'use strict';
    
    // Color pickers
    if ($.fn.wpColorPicker) {
        $('.rankito-color-picker').wpColorPicker();
    }
    
    // Tabs navigation
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
                    status.html('<span style="color: #27ae60; font-weight: 600;">✅ ' + response.data.message + '</span>');
                } else {
                    status.html('<span style="color: #e74c3c; font-weight: 600;">❌ ' + response.data.message + '</span>');
                }
            },
            error: function() {
                status.html('<span style="color: #e74c3c; font-weight: 600;">❌ Erro ao testar conexão</span>');
            },
            complete: function() {
                btn.prop('disabled', false).text('🧪 Testar Conexão');
            }
        });
    });
    
    // Show/hide floating options
    $('input[name="rankito_settings[trigger][type]"]').on('change', function() {
        if ($(this).val() === 'floating') {
            $('.floating-options').show();
        } else {
            $('.floating-options').hide();
        }
    }).trigger('change');

    // Custom Fields Management
    let customFieldsData = [];
    
    // Show/hide options field based on type
    $('#custom-field-type').on('change', function() {
        const type = $(this).val();
        if (type === 'select' || type === 'radio' || type === 'checkbox') {
            $('#custom-field-options-wrapper').show();
        } else {
            $('#custom-field-options-wrapper').hide();
        }
    });

    // Add custom field button
    $('#rankito-add-custom-field').on('click', function() {
        $('#rankito-custom-field-modal').css('display', 'flex');
        $('#custom-field-type').val('text').trigger('change');
        $('#custom-field-label').val('');
        $('#custom-field-placeholder').val('');
        $('#custom-field-options').val('');
        $('#custom-field-required').prop('checked', false);
    });

    // Cancel custom field
    $('#rankito-cancel-custom-field').on('click', function() {
        $('#rankito-custom-field-modal').hide();
    });

    // Save custom field
    $('#rankito-save-custom-field').on('click', function() {
        const label = $('#custom-field-label').val().trim();
        if (!label) {
            alert('Por favor, preencha o Label do campo');
            return;
        }

        const fieldData = {
            id: 'field_' + Date.now(),
            type: $('#custom-field-type').val(),
            label: label,
            placeholder: $('#custom-field-placeholder').val(),
            required: $('#custom-field-required').is(':checked'),
            options: $('#custom-field-options').val().split('\n').filter(o => o.trim())
        };

        customFieldsData.push(fieldData);
        renderCustomFields();
        $('#rankito-custom-field-modal').hide();
    });

    function renderCustomFields() {
        const container = $('#rankito-custom-fields-list');
        if (customFieldsData.length === 0) {
            container.html('<p style="color: #999; font-style: italic;">Nenhum campo personalizado criado ainda</p>');
            return;
        }

        let html = '<div style="display: grid; gap: 15px;">';
        customFieldsData.forEach((field, index) => {
            html += `
                <div style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 15px; position: relative;">
                    <button type="button" class="rankito-remove-custom-field" data-index="${index}" style="position: absolute; top: 10px; right: 10px; background: #dc3545; color: white; border: none; border-radius: 4px; padding: 5px 10px; cursor: pointer;">❌ Remover</button>
                    <h4 style="margin: 0 0 10px 0;">${field.label} ${field.required ? '<span style="color: red;">*</span>' : ''}</h4>
                    <p style="margin: 0; color: #666; font-size: 13px;">
                        <strong>Tipo:</strong> ${field.type} | 
                        <strong>ID:</strong> ${field.id}
                        ${field.options.length > 0 ? '<br><strong>Opções:</strong> ' + field.options.join(', ') : ''}
                    </p>
                    <input type="hidden" name="rankito_settings[fields][custom][]" value='${JSON.stringify(field)}' />
                </div>
            `;
        });
        html += '</div>';
        container.html(html);

        // Remove field handler
        $('.rankito-remove-custom-field').on('click', function() {
            const index = $(this).data('index');
            customFieldsData.splice(index, 1);
            renderCustomFields();
        });
    }

    // Preview modal button
    $('#rankito-preview-modal').on('click', function() {
        alert('🚧 Preview em desenvolvimento!\n\nEm breve você poderá ver o modal exatamente como seus visitantes verão.');
    });
});
</script>

<style>
.rankito-admin-wrap { 
    max-width: 1200px; 
}
.tab-content { 
    display: none; 
    padding: 20px 0; 
}
.tab-content.active { 
    display: block; 
}
.form-table th { 
    width: 220px; 
    font-weight: 600; 
}
.floating-options {
    display: none;
}
</style>