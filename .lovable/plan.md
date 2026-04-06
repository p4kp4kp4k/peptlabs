
# Plano: Evolução PeptídeosHealth → SaaS Profissional

## Fase 1 — Infraestrutura & Arquitetura
- Ativar Lovable Cloud (Supabase) para banco, auth e storage
- Reorganizar estrutura de pastas: `features/`, `services/`, `hooks/`, `types/`, `schemas/`
- Criar tipos TypeScript centralizados (`types/peptide.ts`, `types/user.ts`, `types/protocol.ts`)

## Fase 2 — Banco de Dados
Tabelas:
- `profiles` (id, user_id FK, display_name, avatar_url, created_at)
- `user_roles` (id, user_id FK, role enum: admin/user)
- `peptides` (id, name, slug, category, description, benefits, dosage_info, etc.)
- `protocols` (id, user_id FK, name, description, peptides JSONB, status, created_at)
- `protocol_history` (id, protocol_id FK, action, details, created_at)
- `recommendations` (id, user_id FK, goals JSONB, recommended_peptides JSONB, created_at)
- RLS em todas as tabelas

## Fase 3 — Autenticação
- Login/cadastro com email + senha
- Reset de senha com página `/reset-password`
- Proteção de rotas (público vs autenticado vs admin)
- Hook `useAuth` centralizado
- Componente `ProtectedRoute`

## Fase 4 — Dashboard do Usuário
- Visão geral: protocolos ativos, peptídeos favoritos, recomendações
- Cards com métricas (total protocolos, dias ativo, etc.)
- Gráficos com Recharts (progresso, histórico)
- Lista de atividade recente

## Fase 5 — Painel Admin
- Rota `/admin` protegida por role
- Gestão de usuários (listar, ver detalhes)
- Métricas do sistema (total usuários, protocolos criados, etc.)
- Gestão de peptídeos (CRUD via banco)

## Fase 6 — Engine Inteligente (Recomendador)
- Questionário: objetivos de saúde (emagrecimento, longevidade, performance, etc.)
- Edge function com Lovable AI para processar respostas e recomendar peptídeos
- Exibição do plano personalizado com peptídeos sugeridos, doses e cronograma
- Salvar recomendação no banco

## Fase 7 — Funcionalidades Clínicas
- Calculadora de doses (peso do frasco, diluente, dose alvo)
- Comparador de peptídeos side-by-side
- Mapa de aplicação (locais de injeção)
- Cronograma visual de protocolo

## Fase 8 — Páginas de Conteúdo
- Manter e melhorar: Biblioteca, Finder, Learn
- Adicionar detalhes expandidos por peptídeo (`/peptide/:slug`)

## Ordem de Execução
1. Ativar Cloud + criar banco (Fases 1-2)
2. Auth + proteção de rotas (Fase 3)
3. Dashboard usuário (Fase 4)
4. Admin panel (Fase 5)
5. Engine inteligente (Fase 6)
6. Ferramentas clínicas (Fase 7)
7. Melhorias de conteúdo (Fase 8)

## Stack
- React 18 + TypeScript + Tailwind + shadcn/ui
- Lovable Cloud (Supabase) para banco, auth, storage, edge functions
- Lovable AI para engine de recomendação
- Recharts para gráficos
- Zod para validação
- Framer Motion 11 para animações
