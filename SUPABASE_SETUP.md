# Guia de Integração do Supabase - Passo a Passo

## 📋 Pré-requisitos
- Conta no Supabase (gratuita): https://supabase.com
- Node.js instalado (opcional, para usar npm)

---

## 🚀 PASSO 1: Criar Projeto no Supabase

1. Acesse https://supabase.com e faça login
2. Clique em **"New Project"**
3. Preencha:
   - **Name**: `jira-clone` (ou o nome que preferir)
   - **Database Password**: Anote esta senha! Você precisará dela
   - **Region**: Escolha a região mais próxima (ex: South America)
4. Aguarde a criação do projeto (pode levar 1-2 minutos)

---

## 🔑 PASSO 2: Obter Credenciais do Supabase

1. No painel do Supabase, vá em **Settings** (ícone de engrenagem) → **API**
2. Anote as seguintes informações:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: (mantenha segredo, não exponha no frontend)

---

## 📊 PASSO 3: Criar Tabelas no Supabase

1. No painel do Supabase, vá em **SQL Editor** (ícone de banco de dados)
2. Execute o script SQL abaixo (copie e cole completo):

```sql
-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Squads
CREATE TABLE IF NOT EXISTS squads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    members JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Projetos
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    key TEXT NOT NULL UNIQUE,
    description TEXT,
    squad_id UUID REFERENCES squads(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Stages (Etapas)
CREATE TABLE IF NOT EXISTS stages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    key TEXT NOT NULL,
    color TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Sprints
CREATE TABLE IF NOT EXISTS sprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    weeks INTEGER NOT NULL,
    goal TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'planned',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Issues (Tarefas)
CREATE TABLE IF NOT EXISTS issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    priority TEXT NOT NULL,
    status TEXT NOT NULL,
    assignee TEXT,
    parent_id UUID REFERENCES issues(id) ON DELETE SET NULL,
    story_points INTEGER,
    sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
    sprint_order INTEGER,
    attachments JSONB DEFAULT '[]'::jsonb,
    activities JSONB DEFAULT '[]'::jsonb,
    start_date TIMESTAMP WITH TIME ZONE,
    completed_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, number)
);

-- Tabela de Companies (Empresas/Áreas)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contract_code TEXT,
    contract_value NUMERIC(10, 2),
    contract_start DATE,
    contract_end DATE,
    is_prodesp_area BOOLEAN DEFAULT FALSE,
    area_name TEXT,
    service TEXT,
    professional_types JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_issues_project_id ON issues(project_id);
CREATE INDEX IF NOT EXISTS idx_issues_sprint_id ON issues(sprint_id);
CREATE INDEX IF NOT EXISTS idx_issues_parent_id ON issues(parent_id);
CREATE INDEX IF NOT EXISTS idx_sprints_project_id ON sprints(project_id);
CREATE INDEX IF NOT EXISTS idx_stages_project_id ON stages(project_id);

-- Habilitar Row Level Security (RLS) - por enquanto desabilitado para facilitar
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (permitir tudo por enquanto - você pode restringir depois)
CREATE POLICY "Allow all operations on squads" ON squads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on projects" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on stages" ON stages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on sprints" ON sprints FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on issues" ON issues FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on companies" ON companies FOR ALL USING (true) WITH CHECK (true);
```

3. Clique em **"Run"** para executar o script
4. Verifique se todas as tabelas foram criadas em **Table Editor**

---

## 📦 PASSO 4: Instalar Biblioteca do Supabase

Você tem duas opções:

### Opção A: Via CDN (Mais Simples - Recomendado)
Não precisa instalar nada! Vamos usar o CDN diretamente no HTML.

### Opção B: Via NPM (Se preferir)
```bash
npm install @supabase/supabase-js
```

---

## ⚙️ PASSO 5: Configurar Supabase no Projeto

1. Crie um arquivo `supabase-config.js` na raiz do projeto
2. Cole as credenciais que você anotou no Passo 2

---

## 🔄 PASSO 6: Migrar Dados do localStorage (Opcional)

Se você já tem dados salvos no localStorage, podemos criar um script de migração.

---

## ✅ Próximos Passos

Após seguir estes passos, vou criar os arquivos necessários para você:
- `supabase-config.js` - Configuração do Supabase
- `supabase-service.js` - Funções para interagir com o banco
- Atualização do `script.js` - Substituir localStorage por Supabase

**Você já criou o projeto no Supabase e executou o SQL?** Se sim, me avise e eu crio os arquivos de integração para você!

