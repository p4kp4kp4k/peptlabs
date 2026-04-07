
# PeptiLab — Plano de Refatoração Profissional

## Fase 1: Estrutura de Pastas e Types (agora)
- `src/types/` — tipos centralizados (peptide, protocol, stack, user, subscription)
- `src/services/` — camada de acesso a dados (peptideService, protocolService, stackService, userService)
- `src/lib/constants.ts` — constantes reutilizáveis
- Refatorar páginas para usar services em vez de queries inline

## Fase 2: Engine Inteligente
- `src/engine/analyzer.ts` — analisa objetivos do usuário
- `src/engine/scorer.ts` — pontua peptídeos por relevância
- `src/engine/generator.ts` — gera protocolo completo
- `src/engine/rules.ts` — regras de compatibilidade e dosagem
- Integrar com Finder (recomendador)

## Fase 3: Stripe + Assinaturas
- Habilitar Stripe via ferramenta nativa
- Tabelas: subscriptions, payments
- Edge function para webhook
- Lógica de bloqueio de conteúdo premium
- Planos: Gratuito, PRO Mensal (R$147), PRO Vitalício (R$397), Premium (R$997)

## Fase 4: Admin Expandido
- CRUD de peptídeos (criar/editar/excluir)
- Gerenciamento de usuários (roles, status)
- Métricas e analytics
- Gerenciamento de stacks/protocolos

## Fase 5: Funcionalidades Avançadas
- Histórico real do usuário (atividade, protocolos salvos)
- Dashboard dinâmico com dados reais
- Comparador de peptídeos
- Stack builder interativo
- Upload de arquivos (exames, protocolos)
