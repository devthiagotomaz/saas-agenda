# ServiçoApp - Sistema de Agendamento de Serviços

Um sistema completo para agendamento de serviços entre prestadores e clientes, construído com React, TypeScript e Supabase.

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js 18+ instalado
- Conta no Supabase
- Git

### 1. Clone e Instale Dependências

```bash
git clone <url-do-repositorio>
cd service-booking-app
npm install
```

### 2. Configure o Supabase

1. **Crie um projeto no Supabase:**
   - Acesse [supabase.com](https://supabase.com)
   - Crie uma nova conta ou faça login
   - Clique em "New Project"
   - Escolha uma organização e dê um nome ao projeto
   - Aguarde a criação (pode levar alguns minutos)

2. **Configure as variáveis de ambiente:**
   - Copie o arquivo `.env.example` para `.env`
   - No painel do Supabase, vá em Settings → API
   - Copie a "Project URL" e "anon public" key
   - Cole no arquivo `.env`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

3. **Execute as migrações do banco:**
   - No painel do Supabase, vá em SQL Editor
   - Copie todo o conteúdo do arquivo `supabase/migrations/20250616180229_late_heart.sql`
   - Cole no editor SQL e execute (botão "Run")

4. **Configure as URLs permitidas:**
   - Vá em Authentication → Settings
   - Na seção "Site URLs", adicione:
     - `http://localhost:5173`
     - `http://127.0.0.1:5173`
   - Clique em "Save"

### 3. Execute o Projeto

```bash
npm run dev
```

O projeto estará disponível em `http://localhost:5173`

## 🔧 Resolução de Problemas

### Problema: Erro de DNS/Conexão com Supabase

**Sintomas:**
- `ERR_NAME_NOT_RESOLVED`
- `Failed to fetch`
- Timeout nas requisições

**Causa:** Antivírus Kaspersky bloqueando conexões

**Solução:**
1. Abra o Kaspersky Internet Security
2. Vá para **Configurações → Proteção → Firewall**
3. Clique em **"Configurar regras de aplicativo"**
4. Encontre o **Google Chrome** na lista
5. Altere para **"Permitir tudo"**
6. **OU** vá para **Proteção → Anti-Phishing**
7. Adicione **`*.supabase.co`** aos sites confiáveis

### Problema: Tabelas não encontradas

**Sintomas:**
- `relation "user_profiles" does not exist`
- Erro 404 nas consultas

**Solução:**
1. Acesse o painel do Supabase
2. Vá em SQL Editor
3. Execute o arquivo de migração completo

### Problema: Erro de CORS

**Sintomas:**
- Erro de CORS no console
- Requisições bloqueadas

**Solução:**
1. No painel Supabase, vá em Authentication → Settings
2. Adicione `http://localhost:5173` nas Site URLs
3. Salve e aguarde alguns segundos

## 🩺 Diagnóstico Automático

Se estiver com problemas, acesse `/diagnostics` no navegador para executar um diagnóstico completo:

```
http://localhost:5173/diagnostics
```

Este sistema irá verificar:
- ✅ Variáveis de ambiente
- ✅ Detecção de antivírus
- ✅ Conectividade internet
- ✅ Conexão com Supabase
- ✅ Estrutura do banco
- ✅ Operações CRUD

## 📋 Funcionalidades

### Para Clientes:
- Buscar prestadores por localização e especialidade
- Visualizar perfis e avaliações
- Agendar serviços
- Acompanhar status dos agendamentos
- Avaliar prestadores

### Para Prestadores:
- Cadastrar serviços e preços
- Definir horários de atendimento
- Receber e gerenciar solicitações
- Até 5 agendamentos gratuitos
- Painel de controle completo

### Para Administradores:
- Painel administrativo completo
- Gerenciar usuários
- Verificar prestadores
- Estatísticas do sistema
- Configurações globais

## 🛠 Tecnologias Utilizadas

- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, RLS)
- **Roteamento:** React Router DOM
- **Ícones:** Lucide React
- **Datas:** date-fns
- **Build:** Vite

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
├── contexts/           # Contextos React (Auth, etc)
├── lib/               # Configurações (Supabase)
├── pages/             # Páginas da aplicação
└── types/             # Tipos TypeScript

supabase/
└── migrations/        # Migrações do banco de dados
```

## 🔐 Segurança

- Row Level Security (RLS) habilitado
- Autenticação JWT via Supabase
- Políticas de acesso granulares
- Validação de dados no frontend e backend

## 📞 Suporte

Se continuar com problemas:

1. Execute o diagnóstico em `/diagnostics`
2. Verifique se seguiu todos os passos de configuração
3. Consulte a documentação do Supabase
4. Verifique se o antivírus não está bloqueando

## 🎯 Próximos Passos

Após configurar o projeto:

1. **Como Cliente:** Acesse `/` para buscar prestadores
2. **Como Prestador:** Registre-se e configure seus serviços em `/services`
3. **Como Admin:** Acesse `/admin` com email autorizado

---

**Importante:** Este projeto requer conexão com internet e pode ser afetado por antivírus que bloqueiam requisições de rede. Use o sistema de diagnóstico para identificar e resolver problemas rapidamente.