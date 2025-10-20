# 🎨 Ícones da Extensão Rankito

## ✅ Ícone Base Já Criado!

O arquivo `icon-source.png` (512x512) já está pronto com o design oficial do Rankito:
- Gradiente azul profissional (#4D9BFF → #3B7FE0)
- Letra "R" branca centralizada
- Cantos arredondados
- Estilo minimalista e moderno

## 📦 Você precisa gerar 3 tamanhos:

- `icon16.png` (16x16px) - Barra de extensões
- `icon48.png` (48x48px) - Gerenciador de extensões
- `icon128.png` (128x128px) - Chrome Web Store

## 🚀 Como Gerar (3 Métodos)

### Método 1: Gerador Automático HTML ⭐ MAIS RÁPIDO
```bash
# Abra o arquivo no navegador
open generate-icons.html
```
Clique em "Baixar TODOS os Ícones" e salve aqui!

### Método 2: Online (Sem instalar nada)
1. Acesse: https://www.iloveimg.com/resize-image
2. Upload `icon-source.png`
3. Redimensione para 128, 48 e 16
4. Salve os 3 arquivos aqui

### Método 3: ImageMagick (Linha de comando)
```bash
magick icon-source.png -resize 128x128 icon128.png
magick icon-source.png -resize 48x48 icon48.png
magick icon-source.png -resize 16x16 icon16.png
```

## 📋 Checklist Final

Após gerar, você deve ter:
- ✅ `icon-source.png` (512x512)
- ✅ `icon128.png` (128x128)
- ✅ `icon48.png` (48x48)
- ✅ `icon16.png` (16x16)

**Cores Oficiais Rankito:**
- Primary: #4D9BFF (HSL 217, 91%, 60%)
- Dark: #3B7FE0
- Texto: #FFFFFF (branco)

---

**Mais detalhes?** Veja `COMO-GERAR-ICONES.md`
