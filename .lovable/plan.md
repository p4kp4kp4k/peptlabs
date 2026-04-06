

# Plano: Biblioteca de Peptídeos - Landing Page

## Resumo
Criar uma página completa de biblioteca de peptídeos inspirada no PeptídeosHealth, com design próprio usando o tema escuro com acentos em teal/ciano. Inclui todos os 70 peptídeos extraídos do site, com sistema de categorias, busca, e cards visuais.

## Conteúdo Extraído
- 70 peptídeos com nome, categoria e descrição curta
- 16 categorias: Anti-aging, Antioxidante, Biorregulador, Cardiovascular, Emagrecimento, Estética, GH/Secretagogos, Hormonal, Imunidade, Metabolismo, Neuroproteção, Nootrópicos, Performance, Recuperação, Sexual, Sono/Recuperação
- Peptídeo do dia em destaque (Tirzepatide)

## Estrutura da Página

### 1. Design System (index.css)
- Tema escuro: background `#0f1419`, cards `#1a2332`
- Acento principal: teal/ciano `#00d4aa`
- Texto: branco e cinza claro
- Bordas sutis com gradientes

### 2. Componentes

**Header/Navbar** - Logo "PeptídeosHealth", barra de busca, navegação lateral simplificada como menu horizontal

**Hero - Peptídeo do Dia** - Card destacado com Tirzepatide, badge "Peptídeo do Dia", botão CTA "Explorar Agora"

**Filtros por Categoria** - Chips/badges clicáveis para filtrar por categoria, com "Todos" selecionado por padrão

**Barra de Busca** - Input para buscar por nome, categoria ou variante

**Grid de Peptídeos** - Cards responsivos (5 colunas desktop, 2 mobile) com:
  - Gradient placeholder colorido por categoria (sem imagens externas)
  - Badge de categoria
  - Badge PRO/Grátis
  - Nome e descrição curta

**CTA Bottom** - Banner para upgrade com "Desbloqueie todos os peptídeos"

### 3. Funcionalidades
- Filtro por categoria (client-side)
- Busca por nome (client-side)
- Estado ativo nos filtros
- Responsive design

### 4. Arquivos
- `src/pages/Index.tsx` - Página principal com toda a lógica
- `src/index.css` - Tema escuro atualizado
- `src/App.css` - Limpar estilos default

## Detalhes Técnicos
- Dados dos peptídeos como array estático em arquivo separado `src/data/peptides.ts`
- useState para filtro ativo e termo de busca
- Cores de gradiente por categoria para visual rico sem imagens externas
- Lucide icons para ícones (Search, Lock, Sparkles, etc.)

