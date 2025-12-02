# JIRA Clone - Sistema de Gerenciamento de Projetos

Um sistema completo de gerenciamento de projetos inspirado no JIRA, desenvolvido com HTML, CSS e JavaScript puro.

## 🚀 Funcionalidades

### ✅ Gerenciamento de Projetos
- Criar novos projetos com nome, chave e descrição
- Visualizar todos os projetos em uma grade
- Estatísticas de cada projeto (total de issues, concluídas)

### ✅ Gerenciamento de Issues (Tarefas)
- Criar issues com:
  - Título e descrição
  - Tipo (Tarefa, Bug, História, Épico)
  - Prioridade (Baixa, Média, Alta, Crítica)
  - Status (A Fazer, Em Progresso, Concluído)
  - Responsável
- Editar issues existentes
- Excluir issues
- Numeração automática por projeto (ex: PROJ-1, PROJ-2)

### ✅ Board Kanban
- Visualização em colunas (A Fazer, Em Progresso, Concluído)
- **Drag and Drop**: Arraste issues entre colunas para alterar o status
- Filtros para visualizar issues por status
- Contadores de issues em cada coluna

### ✅ Backlog
- Visualização de todas as issues do projeto
- Ordenação por data de criação (mais recentes primeiro)
- Informações completas de cada issue

### ✅ Persistência de Dados
- Integração com **Supabase** para armazenamento em nuvem
- Fallback automático para **localStorage** se Supabase não estiver configurado
- Dados sincronizados entre dispositivos quando usando Supabase
- Dados persistem mesmo após fechar o navegador

## 📁 Estrutura de Arquivos

```
jira/
├── index.html      # Estrutura HTML principal
├── styles.css      # Estilos e design
├── script.js       # Lógica e funcionalidades
└── README.md       # Este arquivo
```

## 🌐 Acesso Online

O projeto está disponível online via GitHub Pages:
- **URL**: `https://SEU_USUARIO.github.io/jira-clone/`
- Acesse de qualquer dispositivo com internet
- Dados salvos no Supabase (se configurado)

## 🎯 Como Usar

### Opção 1: Versão Online (Recomendado)
1. Acesse a URL do GitHub Pages
2. Comece a usar imediatamente

### Opção 2: Versão Local
1. **Abra o arquivo `index.html` no seu navegador**
   - Não é necessário servidor, pode abrir diretamente
   - Funciona em qualquer navegador moderno

2. **Criar seu primeiro projeto**
   - Clique em "Novo Projeto" no cabeçalho
   - Preencha o nome, chave (ex: PROJ) e descrição
   - Clique em "Criar Projeto"

3. **Selecionar um projeto**
   - Use o seletor de projetos no cabeçalho
   - Ou clique em um projeto na visualização de projetos

4. **Criar issues**
   - Clique em "Criar Issue"
   - Preencha os dados da issue
   - Clique em "Criar Issue"

5. **Gerenciar issues no board**
   - Arraste e solte issues entre as colunas para alterar o status
   - Clique em uma issue para editá-la
   - Use os filtros para visualizar issues específicas

6. **Visualizar backlog**
   - Clique em "Backlog" na barra lateral
   - Veja todas as issues do projeto selecionado

## 🎨 Design

- Interface moderna e limpa inspirada no JIRA
- Cores e estilos similares ao JIRA original
- Totalmente responsivo (funciona em mobile e desktop)
- Animações suaves e feedback visual

## 💾 Armazenamento

### Com Supabase (Recomendado)
- ✅ Dados salvos em nuvem
- ✅ Sincronização entre dispositivos
- ✅ Backup automático
- ✅ Acesso de qualquer lugar

### Sem Supabase (localStorage)
- ✅ Dados persistem entre sessões
- ✅ Não precisa de servidor ou banco de dados
- ⚠️ Dados são específicos do navegador (não sincronizam entre dispositivos)
- ⚠️ Dados podem ser limpos se você limpar o cache do navegador

### Configurar Supabase
1. Crie uma conta em https://supabase.com
2. Crie um novo projeto
3. Execute o script SQL fornecido em `SUPABASE_SETUP.md`
4. Configure as credenciais em `supabase-config.js`
5. Adicione a URL do GitHub Pages nas configurações do Supabase (Settings → API → Allowed Request Origins)

## 🔧 Tecnologias Utilizadas

- **HTML5**: Estrutura semântica
- **CSS3**: Estilos modernos com variáveis CSS e Grid/Flexbox
- **JavaScript (ES6+)**: Lógica da aplicação
- **Font Awesome**: Ícones
- **Supabase**: Banco de dados em nuvem (PostgreSQL)
- **localStorage API**: Persistência de dados local (fallback)

## 📝 Notas

- Este é um clone simplificado do JIRA para uso pessoal
- Não possui funcionalidades avançadas como:
  - Autenticação de usuários
  - Sprints e planejamento
  - Relatórios avançados
  - Integrações com outras ferramentas
  - Colaboração em tempo real

## 🚀 Melhorias Futuras Possíveis

- [ ] Exportar/importar dados
- [ ] Sprints e planejamento
- [ ] Filtros avançados e busca
- [ ] Gráficos e relatórios
- [ ] Temas personalizáveis
- [ ] Múltiplos usuários e permissões

## 📄 Licença

Este projeto é de código aberto e pode ser usado livremente.

---

Desenvolvido com ❤️ para gerenciamento de projetos pessoais

