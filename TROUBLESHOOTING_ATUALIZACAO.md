# 🔧 Troubleshooting: Alterações Não Aplicadas no GitHub Pages

## ❌ Problema
Você fez upload dos arquivos e commit, mas as alterações não aparecem no site.

---

## ✅ SOLUÇÕES (Tente nesta ordem)

### 1. 🔄 Limpar Cache do Navegador (MAIS COMUM)

O navegador pode estar mostrando uma versão antiga em cache.

#### No Chrome/Edge:
1. Pressione **Ctrl + Shift + Delete**
2. Selecione **"Imagens e arquivos em cache"**
3. Período: **"Última hora"** ou **"Todo o período"**
4. Clique em **"Limpar dados"**
5. Recarregue a página com **Ctrl + F5** (força recarregar)

#### Ou use Modo Anônimo:
1. Pressione **Ctrl + Shift + N** (Chrome) ou **Ctrl + Shift + P** (Edge)
2. Acesse sua URL do GitHub Pages
3. Teste se as alterações aparecem

---

### 2. ⏱️ Aguardar Atualização do GitHub Pages

O GitHub Pages pode levar alguns minutos para atualizar:

1. **Aguarde 2-5 minutos** após o commit
2. Recarregue a página com **Ctrl + F5**
3. Se ainda não atualizou, aguarde mais 5 minutos

**Verificar se o GitHub processou:**
- No GitHub, vá em **Settings** → **Pages**
- Veja se há alguma mensagem de erro
- Verifique o último deploy (deve mostrar o horário do seu último commit)

---

### 3. ✅ Verificar se os Arquivos Foram Enviados Corretamente

1. No GitHub, abra o arquivo `script.js`
2. Procure pela função `updateAssigneeSelect()` (linha ~3068)
3. Verifique se ela contém:
   ```javascript
   const squadId = state.currentProject.squadId || state.currentProject.squad_id;
   ```
4. Se não encontrar, os arquivos não foram enviados corretamente

**Solução:**
- Faça upload novamente dos arquivos `script.js` e `supabase-service.js`
- Certifique-se de que está enviando os arquivos da pasta local

---

### 4. 🔍 Verificar Versão dos Arquivos no GitHub

1. No GitHub, clique no arquivo `script.js`
2. Clique em **"History"** (histórico)
3. Verifique se o último commit é o que você acabou de fazer
4. Clique no commit mais recente
5. Verifique se o arquivo tem as alterações corretas

---

### 5. 🚀 Forçar Nova Deploy do GitHub Pages

Às vezes é necessário forçar uma nova deploy:

1. No GitHub, vá em **Settings** → **Pages**
2. Mude o **Source** de `main` para outra branch (ex: `gh-pages`)
3. Clique em **Save**
4. Aguarde 30 segundos
5. Mude de volta para `main`
6. Clique em **Save** novamente
7. Aguarde 2-5 minutos

---

### 6. 📝 Fazer Commit Vazio para Forçar Atualização

1. No GitHub, clique em **"Add file"** → **"Create new file"**
2. Nome do arquivo: `.nojekyll` (com o ponto no início)
3. Deixe o conteúdo vazio
4. Commit message: `Forçar atualização do GitHub Pages`
5. Clique em **"Commit new file"**
6. Aguarde 2-5 minutos

---

### 7. 🔄 Verificar se Está Acessando a URL Correta

Certifique-se de que está acessando:
- ✅ `https://SEU_USUARIO.github.io/jira-clone/`
- ❌ NÃO `https://github.com/SEU_USUARIO/jira-clone` (essa é a página do repositório, não o site)

---

### 8. 🧪 Testar Localmente Primeiro

Antes de publicar, teste localmente:

1. Abra o arquivo `index.html` no navegador
2. Teste se as funcionalidades estão funcionando:
   - Criar tarefa e verificar campo de responsável
   - Excluir projeto
3. Se funcionar localmente, o problema é no GitHub Pages

---

### 9. 📋 Checklist de Verificação

Verifique se você:

- [ ] Fez upload dos arquivos `script.js` e `supabase-service.js`
- [ ] Fez commit das alterações
- [ ] Aguardou pelo menos 2-5 minutos
- [ ] Limpou o cache do navegador
- [ ] Está acessando a URL do GitHub Pages (não a do repositório)
- [ ] GitHub Pages está ativado (Settings → Pages)

---

### 10. 🐛 Verificar Console do Navegador para Erros

1. Abra a página do GitHub Pages
2. Pressione **F12** (abre DevTools)
3. Vá na aba **Console**
4. Veja se há erros em vermelho
5. Se houver erros, copie e me envie

**Erros comuns:**
- `Failed to load resource` - Arquivo não encontrado
- `CORS error` - Problema de configuração do Supabase
- `SyntaxError` - Erro no código JavaScript

---

## 🎯 Método Mais Confiável: Usar Git via Terminal

Se o upload via web não funcionou, use Git:

```bash
# 1. Navegar até a pasta
cd "C:\Users\28834737814\OneDrive - PRODESP\Área de Trabalho\jira"

# 2. Verificar status
git status

# 3. Adicionar arquivos
git add script.js supabase-service.js

# 4. Commit
git commit -m "Corrigir bug do campo de responsável e adicionar exclusão de projetos"

# 5. Push
git push
```

---

## 📞 Se Nada Funcionar

1. **Verifique os arquivos no GitHub:**
   - Abra `script.js` no GitHub
   - Procure por `updateAssigneeSelect` (Ctrl+F)
   - Veja se a função tem as alterações corretas

2. **Compare com os arquivos locais:**
   - Abra `script.js` localmente
   - Compare com a versão no GitHub
   - Se forem diferentes, faça upload novamente

3. **Tente editar direto no GitHub:**
   - No GitHub, clique em `script.js`
   - Clique no ícone de lápis (editar)
   - Cole o conteúdo do arquivo local
   - Faça commit

---

## ✅ Teste Final

Após seguir os passos acima:

1. Limpe o cache (Ctrl + Shift + Delete)
2. Abra em modo anônimo (Ctrl + Shift + N)
3. Acesse sua URL do GitHub Pages
4. Teste:
   - Criar uma tarefa
   - Verificar se o campo de responsável mostra os membros
   - Tentar excluir um projeto

Se ainda não funcionar, me envie:
- A URL do seu repositório GitHub
- Screenshot do console do navegador (F12)
- Qual erro específico você está vendo

