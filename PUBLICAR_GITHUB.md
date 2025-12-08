# 🚀 Guia: Publicar Projeto no GitHub e Gerar URL Pública

## 📋 Pré-requisitos

- Conta no GitHub (já tem ✅)
- Git instalado no seu computador
- Projeto funcionando localmente

---

## 🎯 PASSO 1: Verificar se Git está Instalado

1. Abra o **PowerShell** ou **Prompt de Comando**
2. Digite:
   ```bash
   git --version
   ```
3. Se aparecer uma versão (ex: `git version 2.40.0`), está instalado ✅
4. Se aparecer erro, instale o Git: https://git-scm.com/download/win

---

## 📦 PASSO 2: Criar Repositório no GitHub

1. Acesse https://github.com e faça login
2. Clique no botão **"+"** no canto superior direito
3. Selecione **"New repository"**
4. Preencha:
   - **Repository name**: `jira-clone` (ou o nome que preferir)
   - **Description**: "Sistema de gerenciamento de projetos estilo JIRA"
   - **Visibility**: 
     - ✅ **Public** (para GitHub Pages gratuito)
     - ⚠️ **Private** (se quiser manter privado, mas GitHub Pages ainda funciona)
   - **NÃO marque** "Initialize this repository with a README"
5. Clique em **"Create repository"**

---

## 🔧 PASSO 3: Configurar Git no Projeto (Primeira Vez)

1. Abra o **PowerShell** ou **Prompt de Comando**
2. Navegue até a pasta do projeto:
   ```bash
   cd "C:\Users\28834737814\OneDrive - PRODESP\Área de Trabalho\jira"
   ```
3. Inicialize o Git (se ainda não foi feito):
   ```bash
   git init
   ```
4. Configure seu nome e email (se ainda não configurou):
   ```bash
   git config --global user.name "Seu Nome"
   git config --global user.email "seu.email@exemplo.com"
   ```

---

## 📝 PASSO 4: Criar Arquivo .gitignore

Crie um arquivo `.gitignore` na raiz do projeto para não enviar arquivos desnecessários:

**Conteúdo do `.gitignore`:**
```
# Arquivos do sistema
.DS_Store
Thumbs.db
desktop.ini

# Arquivos de backup
*.bak
*.tmp
*~

# Logs
*.log

# Arquivos temporários
.temp/
temp/
```

---

## 📤 PASSO 5: Fazer Primeiro Commit e Push

1. Adicione todos os arquivos:
   ```bash
   git add .
   ```

2. Faça o primeiro commit:
   ```bash
   git commit -m "Primeira versão do projeto JIRA Clone"
   ```

3. Conecte ao repositório do GitHub (substitua `SEU_USUARIO` pelo seu usuário do GitHub):
   ```bash
   git remote add origin https://github.com/SEU_USUARIO/jira-clone.git
   ```

4. Envie os arquivos para o GitHub:
   ```bash
   git branch -M main
   git push -u origin main
   ```

5. Você será solicitado a fazer login no GitHub. Siga as instruções.

---

## 🌐 PASSO 6: Ativar GitHub Pages

1. No GitHub, vá para o seu repositório
2. Clique em **"Settings"** (Configurações)
3. No menu lateral esquerdo, clique em **"Pages"**
4. Em **"Source"**, selecione:
   - **Branch**: `main`
   - **Folder**: `/ (root)`
5. Clique em **"Save"**
6. Aguarde alguns minutos (pode levar 1-5 minutos)
7. Sua URL será: `https://SEU_USUARIO.github.io/jira-clone/`

---

## 🔗 PASSO 7: Acessar e Compartilhar

1. Após alguns minutos, acesse a URL:
   ```
   https://SEU_USUARIO.github.io/jira-clone/
   ```
2. Se ainda não estiver disponível, aguarde mais alguns minutos
3. Compartilhe esta URL com seus usuários! 🎉

---

## 🔄 PASSO 8: Atualizar o Projeto (Quando Fizer Alterações)

Sempre que fizer alterações no código:

1. Adicione as alterações:
   ```bash
   git add .
   ```

2. Faça commit:
   ```bash
   git commit -m "Descrição das alterações"
   ```

3. Envie para o GitHub:
   ```bash
   git push
   ```

4. Aguarde alguns minutos para o GitHub Pages atualizar (geralmente 1-2 minutos)

---

## ⚠️ IMPORTANTE: Configurar Supabase para Produção

### Problema de CORS

O Supabase pode bloquear requisições de domínios diferentes. Você precisa:

1. Acesse o painel do Supabase
2. Vá em **Settings** → **API**
3. Em **"Allowed Request Origins"**, adicione:
   ```
   https://SEU_USUARIO.github.io
   ```
4. Clique em **"Save"**

### Alternativa: Usar Domínio Personalizado

Se quiser usar um domínio próprio:
1. No GitHub Pages, configure um domínio personalizado
2. Adicione o domínio nas configurações do Supabase

---

## 🎨 Personalizar URL (Opcional)

Se quiser uma URL mais amigável:

1. No GitHub, vá em **Settings** → **Pages**
2. Em **"Custom domain"**, adicione seu domínio
3. Configure o DNS do seu domínio apontando para o GitHub Pages

---

## 🐛 Troubleshooting

### Erro: "Repository not found"
- **Solução**: Verifique se o nome do repositório está correto
- Verifique se você tem permissão para acessar o repositório

### Erro: "Authentication failed"
- **Solução**: Use um Personal Access Token:
  1. GitHub → Settings → Developer settings → Personal access tokens
  2. Generate new token
  3. Use o token como senha ao fazer push

### GitHub Pages não atualiza
- **Solução**: 
  1. Aguarde mais alguns minutos (pode levar até 10 minutos)
  2. Verifique se há erros em Settings → Pages
  3. Tente fazer um novo commit vazio para forçar atualização

### Supabase bloqueando requisições
- **Solução**: Adicione a URL do GitHub Pages nas configurações do Supabase (veja seção acima)

---

## 📚 Recursos Adicionais

- **Documentação GitHub Pages**: https://docs.github.com/en/pages
- **Documentação Git**: https://git-scm.com/doc
- **GitHub Desktop** (interface gráfica): https://desktop.github.com/

---

## ✅ Checklist Final

- [ ] Git instalado e configurado
- [ ] Repositório criado no GitHub
- [ ] Código enviado para o GitHub
- [ ] GitHub Pages ativado
- [ ] URL funcionando
- [ ] Supabase configurado para aceitar requisições do GitHub Pages
- [ ] Testado em navegador anônimo

---

## 🎉 Pronto!

Agora você tem uma URL pública que pode compartilhar com seus usuários!

**URL do seu projeto**: `https://SEU_USUARIO.github.io/jira-clone/`

**Dica**: Você pode criar um arquivo `README.md` no repositório com instruções de uso para seus usuários!




