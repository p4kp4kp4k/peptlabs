
# PeptiLab — Plano de Refatoração Completa

## O que já existe (preservar):
- Auth (useAuth, ProtectedRoute, profiles, user_roles)
- Tabelas: peptides (70 registros), protocols, protocol_history, recommendations, stacks
- Engine (analyzer, scorer, generator, rules)
- Páginas: Dashboard, Library, Finder, Calculator, Stacks, Interactions, BodyMap, Admin
- Services + hooks + types organizados

---

## Fase 1: Design System + Layout Premium
- Atualizar tokens CSS (Primary #0B0F1A, Accent #00E5FF, Highlight #7C3AED)
- Tipografia Inter
- Refatorar Sidebar + Header com busca e menu do usuário
- Componentes: StatCard, estados Loading/Empty/Error
- Migrar rotas para /app/* prefix

## Fase 2: Novas Tabelas + RLS
- Criar: protocol_items, stack_items, calculations, history, subscriptions
- RLS user-scoped em todas
- Atualizar services/types para novas tabelas

## Fase 3: Novas Páginas
- /app/compare (Comparador de peptídeos)
- /app/history (Histórico unificado)
- /app/settings (Configurações do usuário)
- Dashboard com gráficos Recharts reais

## Fase 4: Stripe + Billing
- Habilitar Stripe
- Edge functions: checkout, webhook
- Tabela subscriptions
- /app/billing com status e upgrade
- Feature gating (free vs premium)

## Fase 5: Engine IA (Lovable AI)
- Edge function com Lovable AI para geração de protocolos
- Fluxo: objetivo → peso → experiência → protocolo gerado
- Disclaimer compliance-first
- Salvar em protocols + history

## Fase 6: Polish
- Testes básicos
- Responsividade mobile
- Micro-interações e animações
- Admin expandido
