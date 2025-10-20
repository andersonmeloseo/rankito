# 🎨 Como Gerar os Ícones da Extensão

## Método 1: Gerador Automático (RECOMENDADO) ✨

1. Abra o arquivo `generate-icons.html` no seu navegador
2. Clique em "Baixar TODOS os Ícones"
3. Salve os 3 arquivos PNG nesta pasta (`chrome-extension/assets/`)
4. Pronto! ✅

## Método 2: Redimensionar Manualmente 🛠️

### Usando Online (Gratuito)
1. Acesse: https://www.iloveimg.com/resize-image
2. Faça upload do `icon-source.png` (512x512)
3. Redimensione para:
   - **128x128** → Salve como `icon128.png`
   - **48x48** → Salve como `icon48.png`
   - **16x16** → Salve como `icon16.png`
4. Salve todos os arquivos nesta pasta

### Usando Photoshop/GIMP
1. Abra `icon-source.png`
2. Image → Image Size
3. Mude para cada tamanho (128, 48, 16)
4. Salve como PNG

## Método 3: Linha de Comando (ImageMagick) 💻

Se você tem ImageMagick instalado:

```bash
cd chrome-extension/assets

# Gerar icon128.png
magick icon-source.png -resize 128x128 icon128.png

# Gerar icon48.png
magick icon-source.png -resize 48x48 icon48.png

# Gerar icon16.png
magick icon-source.png -resize 16x16 icon16.png
```

## Verificar se está correto ✅

Após gerar, você deve ter 4 arquivos nesta pasta:
- ✅ `icon-source.png` (512x512) - arquivo original
- ✅ `icon128.png` (128x128) - usado no Chrome Web Store
- ✅ `icon48.png` (48x48) - usado no gerenciador de extensões
- ✅ `icon16.png` (16x16) - usado na barra de extensões

## Cores Oficiais do Rankito 🎨

- **Primary Blue:** #4D9BFF (HSL 217, 91%, 60%)
- **Primary Dark:** #3B7FE0
- **Background:** Gradiente de primary para primary-dark
- **Letra "R":** Branco (#FFFFFF)

---

**Dúvidas?** Consulte o README.md principal ou use o gerador automático HTML!
