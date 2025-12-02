# 🔄 Guia de Migração para Supabase

## ✅ Checklist de Configuração

- [ ] **Passo 1**: Criar projeto no Supabase
- [ ] **Passo 2**: Obter credenciais (URL e anon key)
- [ ] **Passo 3**: Executar script SQL para criar tabelas
- [ ] **Passo 4**: Configurar `supabase-config.js` com suas credenciais
- [ ] **Passo 5**: Testar a aplicação

---

## 📝 Passo a Passo Detalhado

### 1️⃣ Criar Projeto no Supabase

1. Acesse https://supabase.com
2. Faça login ou crie uma conta
3. Clique em **"New Project"**
4. Preencha:
   - **Name**: `jira-clone`
   - **Database Password**: (anote esta senha!)
   - **Region**: South America (ou a mais próxima)
5. Aguarde a criação (1-2 minutos)

### 2️⃣ Obter Credenciais

1. No painel do Supabase, vá em **Settings** → **API**
2. Copie:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3️⃣ Criar Tabelas

1. No painel, vá em **SQL Editor**
2. Abra o arquivo `SUPABASE_SETUP.md` que foi criado
3. Copie o script SQL completo
4. Cole no SQL Editor
5. Clique em **"Run"**
6. Verifique se as tabelas foram criadas em **Table Editor**

### 4️⃣ Configurar Credenciais

1. Abra o arquivo `supabase-config.js`
2. Substitua:
   ```javascript
   url: 'SUA_PROJECT_URL_AQUI',
   anonKey: 'SUA_ANON_KEY_AQUI'
   ```
3. Pelas suas credenciais reais:
   ```javascript
   url: 'https://seu-projeto.supabase.co',
   anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
   ```

### 5️⃣ Testar

1. Abra o `index.html` no navegador
2. Abra o Console do navegador (F12)
3. Você deve ver:
   - ✅ `Supabase inicializado com sucesso`
   - ✅ `Dados carregados do Supabase`
4. Se aparecer avisos sobre localStorage, é normal (fallback)

---

## 🔍 Como Funciona a Integração

### Modo Híbrido (Atual)

A aplicação funciona em **modo híbrido**:

1. **Primeiro tenta Supabase**: Se configurado, carrega/salva no Supabase
2. **Fallback para localStorage**: Se Supabase não estiver disponível, usa localStorage
3. **Sincronização**: Ambos são mantidos sincronizados

### Quando os Dados São Salvos

- **Squads**: Ao criar/editar/deletar squad
- **Projetos**: Ao criar/editar projeto
- **Issues**: Ao criar/editar/deletar tarefa
- **Sprints**: Ao criar/editar sprint
- **Companies**: Ao criar/editar/deletar empresa
- **Stages**: Ao criar/editar etapa

---

## 🐛 Troubleshooting

### Erro: "Biblioteca do Supabase não foi carregada"
- **Solução**: Verifique se o script do Supabase está no HTML antes do `script.js`

### Erro: "Credenciais do Supabase não configuradas"
- **Solução**: Configure o `supabase-config.js` com suas credenciais

### Erro: "Erro ao carregar do Supabase"
- **Solução**: 
  1. Verifique se as credenciais estão corretas
  2. Verifique se as tabelas foram criadas
  3. Verifique se o RLS (Row Level Security) está configurado corretamente

### Dados não aparecem
- **Solução**: 
  1. Verifique o Console do navegador para erros
  2. Verifique se os dados estão no Supabase (Table Editor)
  3. Tente recarregar a página

---

## 📊 Migração de Dados Existentes

Se você já tem dados no localStorage e quer migrar para o Supabase:

1. Abra o Console do navegador (F12)
2. Execute este código para exportar dados:

```javascript
const data = {
    projects: JSON.parse(localStorage.getItem('jira-projects') || '[]'),
    issues: JSON.parse(localStorage.getItem('jira-issues') || '[]'),
    stages: JSON.parse(localStorage.getItem('jira-stages') || '[]'),
    sprints: JSON.parse(localStorage.getItem('jira-sprints') || '[]'),
    squads: JSON.parse(localStorage.getItem('jira-squads') || '[]'),
    companies: JSON.parse(localStorage.getItem('jira-companies') || '[]')
};
console.log(JSON.stringify(data, null, 2));
```

3. Copie o JSON gerado
4. Use o script de migração (será criado se necessário)

---

## 🔐 Segurança

⚠️ **IMPORTANTE**: A chave `anon key` é pública e pode ser vista no código. Isso é normal e seguro porque:

1. O Supabase usa **Row Level Security (RLS)** para proteger os dados
2. As políticas definidas no SQL controlam quem pode acessar o quê
3. Atualmente, as políticas permitem tudo (você pode restringir depois)

Para produção, considere:
- Restringir as políticas RLS
- Implementar autenticação de usuários
- Usar políticas baseadas em usuário

---

## 📚 Próximos Passos

Após a integração básica funcionar, você pode:

1. ✅ Implementar autenticação de usuários
2. ✅ Adicionar políticas RLS mais restritivas
3. ✅ Implementar sincronização em tempo real
4. ✅ Adicionar backup automático
5. ✅ Criar dashboard de analytics

---

## 💡 Dicas

- **Desenvolvimento**: Use localStorage para testes rápidos
- **Produção**: Use Supabase para dados persistentes
- **Backup**: O localStorage continua como backup automático
- **Performance**: Supabase é mais rápido para grandes volumes de dados

---

## 🆘 Precisa de Ajuda?

Se encontrar problemas:

1. Verifique o Console do navegador (F12)
2. Verifique os logs do Supabase (Dashboard → Logs)
3. Verifique se as tabelas existem (Table Editor)
4. Verifique se as políticas RLS estão corretas

