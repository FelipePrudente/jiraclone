# ⚡ Comandos Rápidos - Publicar no GitHub

## 🚀 Comandos para Executar (Copie e Cole)

### 1. Navegar até a pasta do projeto
```bash
cd "C:\Users\28834737814\OneDrive - PRODESP\Área de Trabalho\jira"
```

### 2. Inicializar Git (se ainda não fez)
```bash
git init
```

### 3. Configurar Git (primeira vez apenas)
```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu.email@exemplo.com"
```

### 4. Adicionar todos os arquivos
```bash
git add .
```

### 5. Fazer primeiro commit
```bash
git commit -m "Primeira versão do projeto JIRA Clone"
```

### 6. Conectar ao GitHub (substitua SEU_USUARIO)
```bash
git remote add origin https://github.com/SEU_USUARIO/jira-clone.git
```

### 7. Enviar para o GitHub
```bash
git branch -M main
git push -u origin main
```

---

## 📝 Para Atualizações Futuras

Sempre que fizer alterações, execute:

```bash
git add .
git commit -m "Descrição das alterações"
git push
```

---

## 🌐 Ativar GitHub Pages

1. No GitHub: **Settings** → **Pages**
2. **Source**: `main` branch, `/ (root)` folder
3. **Save**
4. Aguarde alguns minutos
5. Acesse: `https://SEU_USUARIO.github.io/jira-clone/`

---

## ⚙️ Configurar Supabase para Produção

1. Supabase Dashboard → **Settings** → **API**
2. **Allowed Request Origins**: Adicione `https://SEU_USUARIO.github.io`
3. **Save**

---

## ✅ Pronto!

Sua URL pública será: `https://SEU_USUARIO.github.io/jira-clone/`

Compartilhe com seus usuários! 🎉

