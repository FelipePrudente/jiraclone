// Estado da aplicação
let state = {
    projects: [],
    currentProject: null,
    issues: [],
    stages: [],
    sprints: [],
    squads: [],
    companies: [],
    currentView: 'boards'
};

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar Supabase (se configurado)
    if (typeof initSupabase === 'function') {
        initSupabase();
    }
    
    await loadData();
    initializeEventListeners();
    renderProjects();
    updateProjectSelector();
    showView('boards');
});

// Carregar dados (Supabase ou localStorage)
async function loadData() {
    try {
        // Tentar carregar do Supabase primeiro
        if (typeof loadSquads === 'function' && isSupabaseAvailable()) {
            state.squads = await loadSquads();
            state.projects = await loadProjects();
            state.issues = await loadIssues();
            state.stages = await loadStages();
            state.sprints = await loadSprints();
            state.companies = await loadCompanies();
            
            // Se não houver stages, inicializar padrão
            if (state.stages.length === 0) {
                initializeDefaultStages();
            }
            
            console.log('✅ Dados carregados do Supabase');
            return;
        }
    } catch (error) {
        console.warn('⚠️ Erro ao carregar do Supabase, usando localStorage:', error);
    }
    
    // Fallback para localStorage
    const savedProjects = localStorage.getItem('jira-projects');
    const savedIssues = localStorage.getItem('jira-issues');
    const savedStages = localStorage.getItem('jira-stages');
    const savedSprints = localStorage.getItem('jira-sprints');
    const savedSquads = localStorage.getItem('jira-squads');
    const savedCompanies = localStorage.getItem('jira-companies');
    
    if (savedProjects) {
        state.projects = JSON.parse(savedProjects);
    }
    
    if (savedIssues) {
        state.issues = JSON.parse(savedIssues);
    }
    
    if (savedStages) {
        state.stages = JSON.parse(savedStages);
    } else {
        // Inicializar com etapas padrão
        initializeDefaultStages();
    }
    
    if (savedSprints) {
        state.sprints = JSON.parse(savedSprints);
    }
    
    if (savedSquads) {
        state.squads = JSON.parse(savedSquads);
    }
    
    if (savedCompanies) {
        state.companies = JSON.parse(savedCompanies);
    }
    
    console.log('✅ Dados carregados do localStorage');
}

// Inicializar etapas padrão
function initializeDefaultStages() {
    state.stages = [
        // Primeira coluna: Backlog (depósito de todas as atividades)
        { id: 'backlog', name: 'Backlog', key: 'backlog', color: '#42526e', order: 0 },
        // Segunda coluna: Refinamento Técnico
        { id: 'refinamento', name: 'Refinamento Técnico', key: 'refinamento', color: '#ffab00', order: 1 },
        // Terceira coluna: Em Progresso
        { id: 'in-progress', name: 'Em Progresso', key: 'in-progress', color: '#0052cc', order: 2 },
        // Quarta coluna: Concluído
        { id: 'done', name: 'Concluído', key: 'done', color: '#36b37e', order: 3 }
    ];
    saveData();
}

// Salvar dados (Supabase ou localStorage)
async function saveData() {
    // Se Supabase estiver disponível, os dados são salvos individualmente
    // quando cada item é criado/editado (via saveSquad, saveProject, etc.)
    // Aqui mantemos o localStorage como backup
    try {
        localStorage.setItem('jira-projects', JSON.stringify(state.projects));
        localStorage.setItem('jira-issues', JSON.stringify(state.issues));
        localStorage.setItem('jira-stages', JSON.stringify(state.stages));
        localStorage.setItem('jira-sprints', JSON.stringify(state.sprints));
        localStorage.setItem('jira-squads', JSON.stringify(state.squads));
        localStorage.setItem('jira-companies', JSON.stringify(state.companies));
    } catch (error) {
        console.error('Erro ao salvar no localStorage:', error);
    }
}

// Inicializar event listeners
function initializeEventListeners() {
    // Navegação
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            showView(view);
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Botões de criar
    document.getElementById('create-issue-btn').addEventListener('click', () => {
        if (!state.currentProject) {
            alert('Por favor, selecione um projeto primeiro.');
            return;
        }
        openIssueModal();
    });

    document.getElementById('create-project-btn').addEventListener('click', () => {
        openProjectModal();
    });

    // Seletor de projeto
    document.getElementById('project-selector').addEventListener('change', (e) => {
        const projectId = e.target.value;
        if (projectId) {
            state.currentProject = state.projects.find(p => p.id === projectId);
            renderBoard();
            updatePageTitle();
            updateAssigneeSelect();
        } else {
            state.currentProject = null;
            clearBoard();
            updateAssigneeSelect();
        }
    });

    // Filtros do board
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            filterBoard(filter);
        });
    });

    // Modais - Issue
    document.getElementById('close-issue-modal').addEventListener('click', closeIssueModal);
    document.getElementById('cancel-issue-btn').addEventListener('click', closeIssueModal);
    document.getElementById('issue-form').addEventListener('submit', handleCreateIssue);
    
    // Atualizar campo parent quando tipo mudar
    document.getElementById('issue-type').addEventListener('change', updateParentField);
    
    // Mostrar/ocultar seção de atividades quando responsável mudar
    const issueAssignee = document.getElementById('issue-assignee');
    if (issueAssignee) {
        issueAssignee.addEventListener('change', () => {
            const activitiesSection = document.getElementById('activities-section');
            if (activitiesSection) {
                activitiesSection.style.display = issueAssignee.value ? 'block' : 'none';
            }
        });
    }
    
    // Botão adicionar atividade (criação)
    const addActivityBtn = document.getElementById('add-activity-btn');
    if (addActivityBtn) {
        addActivityBtn.addEventListener('click', () => addActivityField('activities-list'));
    }
    
    // Botão adicionar atividade (edição)
    const addEditActivityBtn = document.getElementById('add-edit-activity-btn');
    if (addEditActivityBtn) {
        addEditActivityBtn.addEventListener('click', () => addActivityField('edit-activities-list'));
    }
    
    // Mostrar/ocultar seção de atividades quando responsável mudar (edição)
    const editIssueAssignee = document.getElementById('edit-issue-assignee');
    if (editIssueAssignee) {
        editIssueAssignee.addEventListener('change', () => {
            const activitiesSection = document.getElementById('edit-activities-section');
            if (activitiesSection) {
                activitiesSection.style.display = editIssueAssignee.value ? 'block' : 'none';
            }
        });
    }

    // Modais - Projeto
    document.getElementById('close-project-modal').addEventListener('click', closeProjectModal);
    document.getElementById('cancel-project-btn').addEventListener('click', closeProjectModal);
    document.getElementById('project-form').addEventListener('submit', handleCreateProject);

    // Modais - Squad
    const closeSquadModalBtn = document.getElementById('close-squad-modal');
    if (closeSquadModalBtn) {
        closeSquadModalBtn.addEventListener('click', closeSquadModal);
    }
    const cancelSquadBtn = document.getElementById('cancel-squad-btn');
    if (cancelSquadBtn) {
        cancelSquadBtn.addEventListener('click', closeSquadModal);
    }
    const squadForm = document.getElementById('squad-form');
    if (squadForm) {
        squadForm.addEventListener('submit', handleSaveSquad);
    }
    const addMemberBtn = document.getElementById('add-member-btn');
    if (addMemberBtn) {
        addMemberBtn.addEventListener('click', addMemberField);
    }

    // Modais - Editar Issue
    document.getElementById('close-edit-modal').addEventListener('click', closeEditModal);
    document.getElementById('cancel-edit-btn').addEventListener('click', closeEditModal);
    document.getElementById('edit-issue-form').addEventListener('submit', handleUpdateIssue);
    document.getElementById('delete-issue-btn').addEventListener('click', handleDeleteIssue);
    document.getElementById('edit-issue-type').addEventListener('change', updateEditParentField);

    // Botão gerenciar etapas
    document.getElementById('manage-stages-btn').addEventListener('click', () => {
        openStagesModal();
    });

    // Modais - Etapas
    document.getElementById('close-stages-modal').addEventListener('click', closeStagesModal);
    document.getElementById('cancel-stage-btn').addEventListener('click', cancelStageForm);
    document.getElementById('add-stage-btn').addEventListener('click', () => {
        showStageForm();
    });
    document.getElementById('stage-form').addEventListener('submit', handleSaveStage);

    // Botão criar sprint
    const createSprintBtn = document.getElementById('create-sprint-btn');
    if (createSprintBtn) {
        createSprintBtn.addEventListener('click', () => {
            if (!state.currentProject) {
                alert('Por favor, selecione um projeto primeiro.');
                return;
            }
            openSprintModal();
        });
    }

    // Botão adicionar à sprint
    const addToSprintBtn = document.getElementById('add-to-sprint-btn');
    if (addToSprintBtn) {
        addToSprintBtn.addEventListener('click', () => {
            openAddToSprintModal();
        });
    }

    // Modais - Sprint
    const closeSprintModalBtn = document.getElementById('close-sprint-modal');
    if (closeSprintModalBtn) {
        closeSprintModalBtn.addEventListener('click', closeSprintModal);
    }
    const cancelSprintBtn = document.getElementById('cancel-sprint-btn');
    if (cancelSprintBtn) {
        cancelSprintBtn.addEventListener('click', closeSprintModal);
    }
    const sprintForm = document.getElementById('sprint-form');
    if (sprintForm) {
        sprintForm.addEventListener('submit', handleSaveSprint);
    }
    const closeSprintBtn = document.getElementById('close-sprint-btn');
    if (closeSprintBtn) {
        closeSprintBtn.addEventListener('click', handleCloseSprint);
    }
    const activateSprintBtn = document.getElementById('activate-sprint-btn');
    if (activateSprintBtn) {
        activateSprintBtn.addEventListener('click', handleActivateSprint);
    }
    const deleteSprintBtn = document.getElementById('delete-sprint-btn');
    if (deleteSprintBtn) {
        deleteSprintBtn.addEventListener('click', handleDeleteSprint);
    }
    const addItemsToSprintBtn = document.getElementById('add-items-to-sprint-btn');
    if (addItemsToSprintBtn) {
        addItemsToSprintBtn.addEventListener('click', openAddToSprintModal);
    }

    // Modais - Adicionar à Sprint
    const closeAddToSprintModalBtn = document.getElementById('close-add-to-sprint-modal');
    if (closeAddToSprintModalBtn) {
        closeAddToSprintModalBtn.addEventListener('click', closeAddToSprintModal);
    }
    const cancelAddToSprintBtn = document.getElementById('cancel-add-to-sprint-btn');
    if (cancelAddToSprintBtn) {
        cancelAddToSprintBtn.addEventListener('click', closeAddToSprintModal);
    }
    const confirmAddToSprintBtn = document.getElementById('confirm-add-to-sprint-btn');
    if (confirmAddToSprintBtn) {
        confirmAddToSprintBtn.addEventListener('click', handleAddItemsToSprint);
    }

    // Botão criar squad
    const createSquadBtn = document.getElementById('create-squad-btn');
    if (createSquadBtn) {
        createSquadBtn.addEventListener('click', openSquadModal);
    }

    // Botão criar empresa
    const createCompanyBtn = document.getElementById('create-company-btn');
    if (createCompanyBtn) {
        createCompanyBtn.addEventListener('click', openCompanyModal);
    }

    // Modais - Empresa
    const closeCompanyModalBtn = document.getElementById('close-company-modal');
    if (closeCompanyModalBtn) {
        closeCompanyModalBtn.addEventListener('click', closeCompanyModal);
    }
    const cancelCompanyBtn = document.getElementById('cancel-company-btn');
    if (cancelCompanyBtn) {
        cancelCompanyBtn.addEventListener('click', closeCompanyModal);
    }
    const companyForm = document.getElementById('company-form');
    if (companyForm) {
        companyForm.addEventListener('submit', handleSaveCompany);
    }
    const addProfessionalTypeBtn = document.getElementById('add-professional-type-btn');
    if (addProfessionalTypeBtn) {
        addProfessionalTypeBtn.addEventListener('click', addProfessionalTypeField);
    }

    // Modal - Lançamentos (Financeiro)
    const openLancamentosModalBtn = document.getElementById('open-lancamentos-modal-btn');
    const closeLancamentosModalBtn = document.getElementById('close-lancamentos-modal');
    const closeLancamentosModalFooterBtn = document.getElementById('close-lancamentos-modal-footer');
    if (openLancamentosModalBtn) {
        openLancamentosModalBtn.addEventListener('click', () => {
            openLancamentosModal();
        });
    }
    if (closeLancamentosModalBtn) {
        closeLancamentosModalBtn.addEventListener('click', closeLancamentosModal);
    }
    if (closeLancamentosModalFooterBtn) {
        closeLancamentosModalFooterBtn.addEventListener('click', closeLancamentosModal);
    }

    // Fechar modal ao clicar fora
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// Mostrar view
function showView(viewName) {
    state.currentView = viewName;
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.getElementById(`${viewName}-view`).classList.add('active');
    
    if (viewName === 'projects') {
        renderProjects();
    } else if (viewName === 'backlog') {
        renderBacklog();
    } else if (viewName === 'boards') {
        if (state.currentProject) {
            renderBoard();
        }
    } else if (viewName === 'sprints') {
        renderSprints();
    } else if (viewName === 'squads') {
        renderSquads();
    } else if (viewName === 'financeiro') {
        renderCompanies();
    } else if (viewName === 'lancamentos') {
        renderLancamentosView();
    }
    
    updatePageTitle();
}

// Atualizar título da página
function updatePageTitle() {
    const titles = {
        'boards': 'Boards',
        'projects': 'Projetos',
        'backlog': 'Backlog',
        'sprints': 'Sprints',
        'squads': 'Squads',
        'financeiro': 'Financeiro',
        'lancamentos': 'Lançamentos'
    };
    document.getElementById('page-title').textContent = titles[state.currentView] || 'Boards';
}

// Renderizar view de Lançamentos (estado vazio / mensagem de ajuda)
function renderLancamentosView() {
    const container = document.getElementById('lancamentos-summary-container');
    if (!container) return;
    // Quando o usuário abrir o modal de lançamentos, o resumo detalhado será renderizado lá.
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-info-circle"></i>
            <h3>Nenhum resumo carregado</h3>
            <p>Clique no botão "Ver Resumo de Lançamentos" para visualizar o consolidado de horas e valores.</p>
        </div>
    `;
}

// Renderizar projetos
function renderProjects() {
    const grid = document.getElementById('projects-grid');
    
    if (state.projects.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fas fa-folder-open"></i>
                <h3>Nenhum projeto encontrado</h3>
                <p>Crie seu primeiro projeto para começar a gerenciar suas tarefas</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = state.projects.map(project => {
        const projectIssues = state.issues.filter(i => i.projectId === project.id);
        const todoCount = projectIssues.filter(i => i.status === 'todo').length;
        const inProgressCount = projectIssues.filter(i => i.status === 'in-progress').length;
        const doneCount = projectIssues.filter(i => i.status === 'done').length;

        return `
            <div class="project-card" data-project-id="${project.id}">
                <div class="project-card-header">
                    <div>
                        <h3>${escapeHtml(project.name)}</h3>
                        <span class="project-key">${escapeHtml(project.key)}</span>
                    </div>
                    <button class="btn-delete-project" data-project-id="${project.id}" title="Excluir projeto">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                ${project.description ? `<p class="project-description">${escapeHtml(project.description)}</p>` : ''}
                <div class="project-stats">
                    <span><i class="fas fa-tasks"></i> ${projectIssues.length} tarefas</span>
                    <span><i class="fas fa-check-circle"></i> ${doneCount} concluídas</span>
                </div>
            </div>
        `;
    }).join('');

    // Adicionar event listeners aos cards de projeto
    document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Não abrir o projeto se clicar no botão de exclusão
            if (e.target.closest('.btn-delete-project')) {
                return;
            }
            const projectId = card.dataset.projectId;
            state.currentProject = state.projects.find(p => p.id === projectId);
            document.getElementById('project-selector').value = projectId;
            showView('boards');
            renderBoard();
        });
    });

    // Adicionar event listeners aos botões de exclusão
    document.querySelectorAll('.btn-delete-project').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const projectId = btn.dataset.projectId;
            await handleDeleteProject(projectId);
        });
    });
}

// Atualizar seletor de projetos
function updateProjectSelector() {
    const selector = document.getElementById('project-selector');
    const currentValue = selector.value;
    
    selector.innerHTML = '<option value="">Selecione um projeto</option>' +
        state.projects.map(project => 
            `<option value="${project.id}">${project.name} (${project.key})</option>`
        ).join('');

    if (currentValue && state.projects.find(p => p.id === currentValue)) {
        selector.value = currentValue;
    }
}

// Renderizar board
function renderBoard() {
    if (!state.currentProject) {
        clearBoard();
        return;
    }

    // Verificar se o elemento existe
    const boardColumns = document.getElementById('board-columns');
    if (!boardColumns) {
        console.warn('Elemento board-columns não encontrado');
        return;
    }

    const activeSprint = getActiveSprint();

    // Definir título do board
    if (activeSprint) {
        document.getElementById('board-title').textContent = `${state.currentProject.name} - ${activeSprint.name}`;
    } else {
        document.getElementById('board-title').textContent = `${state.currentProject.name} - Backlog`;
    }
    document.getElementById('manage-stages-btn').style.display = 'inline-flex';
    
    // Exibir itens do backlog (sem sprint) e, se houver sprint ativa, também os itens da sprint
    const projectIssues = state.issues.filter(i => {
        if (i.projectId !== state.currentProject.id) return false;
        // Sempre mostrar tarefas sem sprint (backlog)
        if (!i.sprintId || i.sprintId === null) return true;
        // Se houver sprint ativa, também mostrar tarefas da sprint
        if (activeSprint && i.sprintId === activeSprint.id) return true;
        return false;
    });
    
    // Verificar se há etapas
    if (!state.stages || state.stages.length === 0) {
        console.warn('Nenhuma etapa encontrada. Inicializando etapas padrão.');
        initializeDefaultStages();
    }
    
    // Ordenar etapas por ordem
    const sortedStages = [...state.stages].sort((a, b) => a.order - b.order);
    
    // Renderizar colunas dinamicamente
    boardColumns.innerHTML = sortedStages.map(stage => {
        const stageIssues = projectIssues.filter(i => i.status === stage.key);
        const count = stageIssues.length;
        
        return `
            <div class="column" data-status="${stage.key}">
                <div class="column-header" style="border-left: 3px solid ${stage.color};">
                    <h3>${escapeHtml(stage.name)}</h3>
                    <span class="issue-count" id="count-${stage.key}">${count}</span>
                </div>
                <div class="column-content" id="column-${stage.key}" ondrop="drop(event)" ondragover="allowDrop(event)">
                    ${renderColumnContent(stageIssues)}
                </div>
            </div>
        `;
    }).join('');
    
    // Adicionar event listeners aos cards
    boardColumns.querySelectorAll('.issue-card').forEach(card => {
        card.addEventListener('click', () => {
            openEditModal(card.dataset.issueId);
        });
    });
    
    // Atualizar filtros
    updateBoardFilters();
}

// Renderizar conteúdo da coluna
function renderColumnContent(issues) {
    if (issues.length === 0) {
        return '<div class="empty-state" style="padding: 20px;"><p>Nenhuma issue</p></div>';
    }
    return issues.map(issue => createIssueCard(issue)).join('');
}

// Criar card de issue
function createIssueCard(issue) {
    const project = state.projects.find(p => p.id === issue.projectId);
    const issueKey = `${project.key}-${issue.number}`;
    const assigneeInitials = issue.assignee 
        ? issue.assignee.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
        : '?';

    const storyPointsBadge = issue.storyPoints 
        ? `<span class="issue-story-points">${issue.storyPoints} pts</span>` 
        : '';
    
    // Buscar parent se existir
    let parentInfo = '';
    if (issue.parentId) {
        const parent = state.issues.find(i => i.id === issue.parentId);
        if (parent) {
            const parentProject = state.projects.find(p => p.id === parent.projectId);
            const parentKey = `${parentProject.key}-${parent.number}`;
            const parentTypeLabel = parent.type === 'epic' ? 'Épico' : parent.type === 'story' ? 'História' : '';
            parentInfo = `<div style="font-size: 11px; color: var(--primary-color); margin-top: 4px; font-weight: 500;">
                <i class="fas fa-level-up-alt" style="transform: rotate(90deg);"></i> ${parentTypeLabel}: ${parentKey}
            </div>`;
        }
    }

    return `
        <div class="issue-card" 
             draggable="true" 
             data-issue-id="${issue.id}"
             ondragstart="dragStart(event)"
             ondragend="dragEnd(event)">
            <div class="issue-header">
                <span class="issue-key">${issueKey}</span>
                <span class="issue-type ${issue.type}">
                    <i class="fas fa-${getIssueTypeIcon(issue.type)}"></i>
                </span>
            </div>
            <div class="issue-title">${escapeHtml(issue.title)}</div>
            ${parentInfo}
            ${issue.description ? `<div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">${escapeHtml(issue.description.substring(0, 50))}${issue.description.length > 50 ? '...' : ''}</div>` : ''}
            <div class="issue-footer">
                <span class="issue-priority ${issue.priority}">${getPriorityLabel(issue.priority)}</span>
                ${storyPointsBadge}
                <span class="issue-assignee" title="${issue.assignee || 'Não atribuído'}">${assigneeInitials}</span>
            </div>
        </div>
    `;
}

// Atualizar filtros do board
function updateBoardFilters() {
    const filtersContainer = document.getElementById('board-filters');
    const sortedStages = [...state.stages].sort((a, b) => a.order - b.order);
    
    filtersContainer.innerHTML = `
        <button class="filter-btn active" data-filter="all">Todos</button>
        ${sortedStages.map(stage => 
            `<button class="filter-btn" data-filter="${stage.key}">${escapeHtml(stage.name)}</button>`
        ).join('')}
    `;
    
    // Re-adicionar event listeners
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            filterBoard(filter);
        });
    });
}

// Limpar board
function clearBoard() {
    document.getElementById('board-title').textContent = 'Selecione um projeto para ver o board';
    document.getElementById('manage-stages-btn').style.display = 'none';
    document.getElementById('board-columns').innerHTML = '';
}

// Filtrar board
function filterBoard(filter) {
    if (!state.currentProject) return;
    
    const projectIssues = state.issues.filter(i => i.projectId === state.currentProject.id);
    const sortedStages = [...state.stages].sort((a, b) => a.order - b.order);
    
    sortedStages.forEach(stage => {
        const column = document.getElementById(`column-${stage.key}`);
        if (!column) return;
        
        let stageIssues = projectIssues.filter(i => i.status === stage.key);
        
        if (filter !== 'all') {
            stageIssues = stageIssues.filter(i => i.status === filter);
        }
        
        column.innerHTML = renderColumnContent(stageIssues);
        
        // Re-adicionar event listeners
        column.querySelectorAll('.issue-card').forEach(card => {
            card.addEventListener('click', () => {
                openEditModal(card.dataset.issueId);
            });
        });
    });
}

// Renderizar backlog
function renderBacklog() {
    const backlogList = document.getElementById('backlog-list');
    
    if (!state.currentProject) {
        backlogList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-list"></i>
                <h3>Selecione um projeto</h3>
                <p>Selecione um projeto para ver o backlog</p>
            </div>
        `;
        return;
    }

    // Ordenar por hierarquia: épicos primeiro, depois histórias, depois tarefas
    // Filtrar apenas issues do backlog (sem sprintId)
    const backlogIssues = state.issues.filter(i => 
        i.projectId === state.currentProject.id && 
        (!i.sprintId || i.sprintId === null)
    );
    
    // Ordenar por hierarquia: épicos primeiro, depois histórias, depois tarefas
    const projectIssues = backlogIssues.sort((a, b) => {
            // Ordenar por tipo (épico > história > tarefa/bug)
            const typeOrder = { 'epic': 1, 'story': 2, 'task': 3, 'bug': 3 };
            const aOrder = typeOrder[a.type] || 4;
            const bOrder = typeOrder[b.type] || 4;
            if (aOrder !== bOrder) return aOrder - bOrder;
            
            // Se tiver parent, ordenar por parent primeiro
            if (a.parentId && !b.parentId) return 1;
            if (!a.parentId && b.parentId) return -1;
            if (a.parentId && b.parentId && a.parentId !== b.parentId) {
                const aParent = state.issues.find(i => i.id === a.parentId);
                const bParent = state.issues.find(i => i.id === b.parentId);
                if (aParent && bParent) {
                    if (aParent.number !== bParent.number) return aParent.number - bParent.number;
                }
            }
            
            return a.number - b.number;
        });

    if (projectIssues.length === 0) {
        backlogList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-list"></i>
                <h3>Backlog vazio</h3>
                <p>Crie tarefas para aparecerem no backlog</p>
            </div>
        `;
        return;
    }

    backlogList.innerHTML = projectIssues.map(issue => {
        const project = state.projects.find(p => p.id === issue.projectId);
        const issueKey = `${project.key}-${issue.number}`;
        const assigneeInitials = issue.assignee 
            ? issue.assignee.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
            : '?';

        const storyPointsBadge = issue.storyPoints 
            ? `<span class="issue-story-points" style="margin-right: 8px;">${issue.storyPoints} pts</span>` 
            : '';
        
        // Buscar parent se existir
        let parentInfo = '';
        if (issue.parentId) {
            const parent = state.issues.find(i => i.id === issue.parentId);
            if (parent) {
                const parentProject = state.projects.find(p => p.id === parent.projectId);
                const parentKey = `${parentProject.key}-${parent.number}`;
                const parentTypeLabel = parent.type === 'epic' ? 'Épico' : parent.type === 'story' ? 'História' : '';
                parentInfo = `<div style="font-size: 11px; color: var(--primary-color); margin-top: 2px;">
                    <i class="fas fa-level-up-alt" style="transform: rotate(90deg);"></i> ${parentTypeLabel}: ${parentKey}
                </div>`;
            }
        }
        
        // Indentação visual para itens filhos
        const indentStyle = issue.parentId ? 'margin-left: 24px; border-left: 3px solid var(--primary-color); padding-left: 12px;' : '';

        return `
            <div class="backlog-item" data-issue-id="${issue.id}" style="${indentStyle}">
                <div class="backlog-item-left">
                    <span class="issue-type ${issue.type}">
                        <i class="fas fa-${getIssueTypeIcon(issue.type)}"></i>
                    </span>
                    <div>
                        <div style="font-weight: 600; margin-bottom: 4px;">
                            <span class="issue-key" style="margin-right: 8px;">${issueKey}</span>
                            ${escapeHtml(issue.title)}
                        </div>
                        ${parentInfo}
                        ${issue.description ? `<div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">${escapeHtml(issue.description.substring(0, 100))}${issue.description.length > 100 ? '...' : ''}</div>` : ''}
                    </div>
                </div>
                <div class="backlog-item-right">
                    ${storyPointsBadge}
                    <span class="issue-priority ${issue.priority}">${getPriorityLabel(issue.priority)}</span>
                    <span class="issue-assignee" title="${issue.assignee || 'Não atribuído'}">${assigneeInitials}</span>
                    <span style="font-size: 12px; color: var(--text-secondary);">${getStatusLabel(issue.status)}</span>
                </div>
            </div>
        `;
    }).join('');

    // Adicionar event listeners
    document.querySelectorAll('.backlog-item').forEach(item => {
        item.addEventListener('click', () => {
            openEditModal(item.dataset.issueId);
        });
    });
}

// Abrir modal de criar issue
function openIssueModal() {
    document.getElementById('issue-modal').classList.add('active');
    document.getElementById('issue-form').reset();
    updateParentSelect();
    updateParentField();
    updateAssigneeSelect();
    // Limpar pontos de história
    const sp = document.getElementById('issue-story-points');
    if (sp) sp.value = '';
    // Limpar anexos
    const attachInput = document.getElementById('issue-attachments');
    if (attachInput) attachInput.value = '';
    
    // Limpar atividades
    const activitiesList = document.getElementById('activities-list');
    if (activitiesList) activitiesList.innerHTML = '';
    const activitiesSection = document.getElementById('activities-section');
    if (activitiesSection) activitiesSection.style.display = 'none';
}

// Atualizar campo de parent baseado no tipo
function updateParentField() {
    const type = document.getElementById('issue-type').value;
    const parentGroup = document.getElementById('parent-issue-group');
    const parentSelect = document.getElementById('issue-parent');
    const helpText = document.getElementById('parent-help-text');
    
    if (type === 'epic') {
        // Épicos não podem ter parent
        parentGroup.style.display = 'none';
        parentSelect.value = '';
    } else if (type === 'story') {
        // Histórias podem pertencer a épicos
        parentGroup.style.display = 'block';
        helpText.textContent = 'Selecione um Épico para esta História';
        updateParentSelect('epic');
    } else if (type === 'task' || type === 'bug') {
        // Tarefas e bugs podem pertencer a épicos ou histórias
        parentGroup.style.display = 'block';
        helpText.textContent = 'Selecione um Épico ou História para esta Tarefa';
        updateParentSelect('both');
    }
}

// Atualizar select de parent
function updateParentSelect(filterType = 'both') {
    if (!state.currentProject) return;
    
    const parentSelect = document.getElementById('issue-parent');
    const projectIssues = state.issues.filter(i => i.projectId === state.currentProject.id);
    
    let availableParents = [];
    
    if (filterType === 'epic') {
        // Apenas épicos
        availableParents = projectIssues.filter(i => i.type === 'epic');
    } else if (filterType === 'both') {
        // Épicos e histórias
        availableParents = projectIssues.filter(i => i.type === 'epic' || i.type === 'story');
    }
    
    // Ordenar por número
    availableParents.sort((a, b) => a.number - b.number);
    
    const project = state.projects.find(p => p.id === state.currentProject.id);
    parentSelect.innerHTML = '<option value="">Nenhum (item independente)</option>' +
        availableParents.map(issue => {
            const issueKey = `${project.key}-${issue.number}`;
            const typeLabel = issue.type === 'epic' ? 'Épico' : issue.type === 'story' ? 'História' : issue.type;
            return `<option value="${issue.id}">[${typeLabel}] ${issueKey} - ${escapeHtml(issue.title)}</option>`;
        }).join('');
}

// Fechar modal de issue
function closeIssueModal() {
    document.getElementById('issue-modal').classList.remove('active');
}

// Abrir modal de criar projeto
function openProjectModal() {
    document.getElementById('project-modal').classList.add('active');
    document.getElementById('project-form').reset();
    updateSquadSelect();
}

// Atualizar select de squads
function updateSquadSelect() {
    const squadSelect = document.getElementById('project-squad');
    if (!squadSelect) return;
    
    squadSelect.innerHTML = '<option value="">Selecione uma Squad</option>' +
        state.squads.map(squad => 
            `<option value="${squad.id}">${escapeHtml(squad.name)}</option>`
        ).join('');
}

// Fechar modal de projeto
function closeProjectModal() {
    document.getElementById('project-modal').classList.remove('active');
}

// Abrir modal de editar issue
function openEditModal(issueId) {
    const issue = state.issues.find(i => i.id === issueId);
    if (!issue) return;

    updateStatusSelects();
    updateEditParentSelect(issue.type);
    updateEditParentField();
    updateAssigneeSelect();
    
    document.getElementById('edit-issue-id').value = issue.id;
    document.getElementById('edit-issue-title').value = issue.title;
    document.getElementById('edit-issue-description').value = issue.description || '';
    document.getElementById('edit-issue-type').value = issue.type;
    document.getElementById('edit-issue-priority').value = issue.priority;
    const editStatus = document.getElementById('edit-issue-status');
    if (editStatus) {
        editStatus.value = issue.status;
    }
    // Setar o valor do responsável após atualizar o select
    setTimeout(() => {
        const editAssigneeSelect = document.getElementById('edit-issue-assignee');
        if (editAssigneeSelect) {
            editAssigneeSelect.value = issue.assignee || '';
        }
    }, 100);
    document.getElementById('edit-issue-parent').value = issue.parentId || '';
    const editSp = document.getElementById('edit-issue-story-points');
    if (editSp) {
        editSp.value = issue.storyPoints != null ? String(issue.storyPoints) : '';
    }

    // Renderizar anexos existentes
    const listContainer = document.getElementById('edit-attachments-list');
    if (listContainer) {
        // Reset marcações de remoção
        listContainer.dataset.removeIds = JSON.stringify([]);

        const attachments = issue.attachments || [];
        if (attachments.length === 0) {
            listContainer.innerHTML = '<p style="font-size: 12px; color: var(--text-secondary);">Nenhum anexo cadastrado.</p>';
        } else {
            listContainer.innerHTML = attachments.map(att => {
                const safeName = escapeHtml(att.name || 'arquivo');
                const sizeKb = att.size ? ` (${Math.round(att.size / 1024)} KB)` : '';
                const addedAt = att.addedAt ? ` - ${new Date(att.addedAt).toLocaleString('pt-BR')}` : '';
                return `
                    <div class="attachment-item" data-attachment-id="${att.id}">
                        <a href="${att.dataUrl}" download="${safeName}" style="margin-right: 8px;">
                            <i class="fas fa-paperclip"></i> ${safeName}${sizeKb}
                        </a>
                        <small style="color: var(--text-secondary);">${addedAt}</small>
                        <button type="button" class="btn btn-secondary btn-sm" style="margin-left: 8px;"
                                onclick="markAttachmentForRemoval('${att.id}')">
                            Remover
                        </button>
                    </div>
                `;
            }).join('');
        }
    }

    // Limpar seleção de novos anexos
    const editAttachInput = document.getElementById('edit-issue-attachments');
    if (editAttachInput) editAttachInput.value = '';
    
    // Renderizar atividades existentes
    const activitiesList = document.getElementById('edit-activities-list');
    const activitiesSection = document.getElementById('edit-activities-section');
    if (activitiesList) {
        activitiesList.innerHTML = '';
        const activities = issue.activities || [];
        if (activities.length > 0) {
            activities.forEach(activity => {
                addActivityField('edit-activities-list', activity);
            });
        }
    }
    
    // Mostrar seção de atividades se houver responsável
    if (activitiesSection) {
        activitiesSection.style.display = issue.assignee ? 'block' : 'none';
    }
    
    document.getElementById('edit-issue-modal').classList.add('active');
}

// Atualizar campo de parent no modal de edição
function updateEditParentField() {
    const type = document.getElementById('edit-issue-type').value;
    const parentGroup = document.getElementById('edit-parent-issue-group');
    const parentSelect = document.getElementById('edit-issue-parent');
    const helpText = document.getElementById('edit-parent-help-text');
    
    if (type === 'epic') {
        parentGroup.style.display = 'none';
        parentSelect.value = '';
    } else if (type === 'story') {
        parentGroup.style.display = 'block';
        helpText.textContent = 'Selecione um Épico para esta História';
        updateEditParentSelect('epic');
    } else if (type === 'task' || type === 'bug') {
        parentGroup.style.display = 'block';
        helpText.textContent = 'Selecione um Épico ou História para esta Tarefa';
        updateEditParentSelect('both');
    }
}

// Atualizar select de parent no modal de edição
function updateEditParentSelect(filterType = 'both') {
    if (!state.currentProject) return;
    
    const parentSelect = document.getElementById('edit-issue-parent');
    const currentIssueId = document.getElementById('edit-issue-id').value;
    const projectIssues = state.issues.filter(i => 
        i.projectId === state.currentProject.id && i.id !== currentIssueId
    );
    
    let availableParents = [];
    
    if (filterType === 'epic') {
        availableParents = projectIssues.filter(i => i.type === 'epic');
    } else if (filterType === 'both') {
        availableParents = projectIssues.filter(i => i.type === 'epic' || i.type === 'story');
    }
    
    availableParents.sort((a, b) => a.number - b.number);
    
    const project = state.projects.find(p => p.id === state.currentProject.id);
    parentSelect.innerHTML = '<option value="">Nenhum (item independente)</option>' +
        availableParents.map(issue => {
            const issueKey = `${project.key}-${issue.number}`;
            const typeLabel = issue.type === 'epic' ? 'Épico' : issue.type === 'story' ? 'História' : issue.type;
            return `<option value="${issue.id}">[${typeLabel}] ${issueKey} - ${escapeHtml(issue.title)}</option>`;
        }).join('');
}

// Atualizar selects de status com etapas dinâmicas
function updateStatusSelects() {
    const sortedStages = [...state.stages].sort((a, b) => a.order - b.order);
    const options = sortedStages.map(stage => 
        `<option value="${stage.key}">${escapeHtml(stage.name)}</option>`
    ).join('');
    
    const createStatusSelect = document.getElementById('issue-status');
    const editStatusSelect = document.getElementById('edit-issue-status');

    if (createStatusSelect) {
        createStatusSelect.innerHTML = options;
    }
    if (editStatusSelect) {
        editStatusSelect.innerHTML = options;
    }
}

// Fechar modal de editar
function closeEditModal() {
    document.getElementById('edit-issue-modal').classList.remove('active');
}

// Ler arquivos como DataURL para salvar no localStorage
function readFilesAsDataUrls(fileList) {
    const files = Array.from(fileList || []);
    const maxBytes = 2 * 1024 * 1024; // 2MB por arquivo

    return Promise.all(files.map(file => {
        return new Promise((resolve, reject) => {
            if (file.size > maxBytes) {
                alert(`O arquivo "${file.name}" excede o limite de 2MB e não será anexado.`);
                return resolve(null);
            }
            const reader = new FileReader();
            reader.onload = () => {
                resolve({
                    id: generateId(),
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    dataUrl: reader.result,
                    addedAt: new Date().toISOString()
                });
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    })).then(results => results.filter(Boolean));
}

// Criar issue
async function handleCreateIssue(e) {
    e.preventDefault();
    
    if (!state.currentProject) {
        alert('Por favor, selecione um projeto primeiro.');
        return;
    }

    const projectIssues = state.issues.filter(i => i.projectId === state.currentProject.id);
    const nextNumber = projectIssues.length > 0 
        ? Math.max(...projectIssues.map(i => i.number)) + 1 
        : 1;

    const issueType = document.getElementById('issue-type').value;
    const parentId = document.getElementById('issue-parent').value || null;
    const storyPointsValue = document.getElementById('issue-story-points') 
        ? document.getElementById('issue-story-points').value 
        : '';
    const storyPoints = storyPointsValue ? parseInt(storyPointsValue, 10) : null;

    const attachInput = document.getElementById('issue-attachments');
    const attachments = attachInput && attachInput.files && attachInput.files.length > 0
        ? await readFilesAsDataUrls(attachInput.files)
        : [];
    
    // Validações de hierarquia
    if (issueType === 'epic' && parentId) {
        alert('Épicos não podem pertencer a outros itens.');
        return;
    }
    
    if (issueType === 'story' && parentId) {
        const parentIssue = state.issues.find(i => i.id === parentId);
        if (parentIssue && parentIssue.type !== 'epic') {
            alert('Histórias só podem pertencer a Épicos.');
            return;
        }
    }
    
    if ((issueType === 'task' || issueType === 'bug') && parentId) {
        const parentIssue = state.issues.find(i => i.id === parentId);
        if (parentIssue && parentIssue.type !== 'epic' && parentIssue.type !== 'story') {
            alert('Tarefas e Bugs só podem pertencer a Épicos ou Histórias.');
            return;
        }
    }

    // Validação de pontos de história (obrigatório apenas para histórias)
    if (issueType === 'story' && (storyPoints == null || Number.isNaN(storyPoints))) {
        alert('Para itens do tipo História, é obrigatório informar os Pontos de História.');
        return;
    }

    // Nova issue sempre vai para o backlog (não tem sprintId e status padrão)
    const sortedStages = [...state.stages].sort((a, b) => a.order - b.order);
    const defaultStatus = sortedStages.length > 0 ? sortedStages[0].key : 'todo';
    
    // Coletar atividades (lançamentos de horas)
    const activities = collectActivities('activities-list');
    
    // Calcular valores das atividades
    const assigneeName = document.getElementById('issue-assignee').value;
    if (activities && activities.length > 0) {
        activities.forEach(activity => {
            activity.value = calculateActivityValue(activity, assigneeName, state.currentProject.id);
        });
    }
    
    const issue = {
        id: 'temp-' + generateId(), // ID temporário para Supabase gerar o UUID
        projectId: state.currentProject.id,
        number: nextNumber,
        title: document.getElementById('issue-title').value,
        description: document.getElementById('issue-description').value,
        type: issueType,
        priority: document.getElementById('issue-priority').value,
        status: defaultStatus, // Sempre começa na primeira etapa (backlog)
        assignee: assigneeName,
        parentId: parentId,
        attachments: attachments,
        storyPoints: storyPoints,
        activities: activities || [],
        sprintId: null, // Não adiciona à sprint automaticamente - fica no backlog
        sprintOrder: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    state.issues.push(issue);
    
    // Salvar no Supabase (se disponível)
    if (typeof saveIssue === 'function') {
        try {
            const savedIssue = await saveIssue(issue);
            // Atualizar com o ID real do Supabase
            const index = state.issues.findIndex(i => i.id === issue.id);
            if (index !== -1 && savedIssue.id) {
                state.issues[index] = savedIssue;
            }
        } catch (error) {
            console.error('Erro ao salvar issue no Supabase:', error);
        }
    }
    
    saveData();
    renderBoard();
    closeIssueModal();
    
    if (state.currentView === 'backlog') {
        renderBacklog();
    }
}

// Atualizar issue
async function handleUpdateIssue(e) {
    e.preventDefault();
    
    const issueId = document.getElementById('edit-issue-id').value;
    const issue = state.issues.find(i => i.id === issueId);
    
    if (!issue) return;

    const oldStatus = issue.status;
    
    const newType = document.getElementById('edit-issue-type').value;
    const parentId = document.getElementById('edit-issue-parent').value || null;
    const storyPointsValue = document.getElementById('edit-issue-story-points')
        ? document.getElementById('edit-issue-story-points').value
        : '';
    const storyPoints = storyPointsValue ? parseInt(storyPointsValue, 10) : null;

    // Anexos: remover marcados e adicionar novos
    const listContainer = document.getElementById('edit-attachments-list');
    const toRemoveRaw = listContainer ? (listContainer.dataset.removeIds || '[]') : '[]';
    let toRemoveIds = [];
    try {
        toRemoveIds = JSON.parse(toRemoveRaw);
    } catch (err) {
        toRemoveIds = [];
    }

    const existingAttachments = (issue.attachments || []).filter(att => !toRemoveIds.includes(att.id));

    const newAttachInput = document.getElementById('edit-issue-attachments');
    const newAttachments = newAttachInput && newAttachInput.files && newAttachInput.files.length > 0
        ? await readFilesAsDataUrls(newAttachInput.files)
        : [];
    
    // Validações de hierarquia
    if (newType === 'epic' && parentId) {
        alert('Épicos não podem pertencer a outros itens.');
        return;
    }
    
    if (newType === 'story' && parentId) {
        const parentIssue = state.issues.find(i => i.id === parentId);
        if (parentIssue && parentIssue.type !== 'epic') {
            alert('Histórias só podem pertencer a Épicos.');
            return;
        }
    }
    
    if ((newType === 'task' || newType === 'bug') && parentId) {
        const parentIssue = state.issues.find(i => i.id === parentId);
        if (parentIssue && parentIssue.type !== 'epic' && parentIssue.type !== 'story') {
            alert('Tarefas e Bugs só podem pertencer a Épicos ou Histórias.');
            return;
        }
    }
    
    // Verificar se não está criando ciclo (item não pode ser pai de si mesmo ou de seus ancestrais)
    if (parentId && hasCircularReference(issue.id, parentId)) {
        alert('Não é possível criar uma referência circular. Um item não pode ser pai de si mesmo ou de seus ancestrais.');
        return;
    }

    // Validação de pontos de história (obrigatório apenas para histórias)
    if (newType === 'story' && (storyPoints == null || Number.isNaN(storyPoints))) {
        alert('Para itens do tipo História, é obrigatório informar os Pontos de História.');
        return;
    }

    issue.title = document.getElementById('edit-issue-title').value;
    issue.description = document.getElementById('edit-issue-description').value;
    issue.type = newType;
    issue.priority = document.getElementById('edit-issue-priority').value;
    const editStatus = document.getElementById('edit-issue-status');
    if (editStatus) {
        issue.status = editStatus.value;
    }
    const assigneeName = document.getElementById('edit-issue-assignee').value;
    issue.assignee = assigneeName;
    issue.parentId = parentId;
    issue.storyPoints = storyPoints;
    issue.attachments = [...existingAttachments, ...newAttachments];
    
    // Coletar atividades (lançamentos de horas)
    const activities = collectActivities('edit-activities-list');
    
    // Calcular valores das atividades
    if (activities && activities.length > 0) {
        activities.forEach(activity => {
            activity.value = calculateActivityValue(activity, assigneeName, issue.projectId);
        });
    }
    
    issue.activities = activities || [];
    issue.updatedAt = new Date().toISOString();

    // Salvar no Supabase (se disponível)
    if (typeof saveIssue === 'function') {
        try {
            await saveIssue(issue);
        } catch (error) {
            console.error('Erro ao salvar issue no Supabase:', error);
        }
    }
    
    saveData();
    closeEditModal();
    
    if (state.currentView === 'boards') {
        renderBoard();
    } else if (state.currentView === 'backlog') {
        renderBacklog();
    }
}

// Verificar referência circular
function hasCircularReference(issueId, potentialParentId) {
    let currentId = potentialParentId;
    while (currentId) {
        if (currentId === issueId) {
            return true; // Ciclo detectado
        }
        const currentIssue = state.issues.find(i => i.id === currentId);
        if (!currentIssue || !currentIssue.parentId) {
            break;
        }
        currentId = currentIssue.parentId;
    }
    return false;
}

// ==================== GERENCIAMENTO DE ATIVIDADES (LANÇAMENTOS DE HORAS) ====================

// Adicionar campo de lançamento de horas
function addActivityField(containerId, activity = null) {
    const activitiesList = document.getElementById(containerId);
    if (!activitiesList) return;
    
    const activityId = activity ? activity.id : generateId();
    const activityField = document.createElement('div');
    activityField.className = 'activity-field';
    activityField.dataset.activityId = activityId;
    activityField.style.cssText = 'border: 1px solid var(--border-color); padding: 12px; margin-bottom: 8px; border-radius: 6px; background: var(--bg-primary);';
    activityField.innerHTML = `
        <div style="display: flex; gap: 8px; align-items: flex-end;">
            <div class="form-group" style="flex: 1;">
                <label>Data *</label>
                <input type="date" class="activity-date-input" required value="${activity ? activity.date : ''}">
            </div>
            <div class="form-group" style="flex: 1;">
                <label>Horas Trabalhadas *</label>
                <input type="number" class="activity-hours-input" step="0.5" min="0" placeholder="0.0" required value="${activity ? activity.hours : ''}">
            </div>
            <div class="form-group" style="flex: 2;">
                <label>Descrição</label>
                <input type="text" class="activity-description-input" placeholder="Descreva a atividade realizada" value="${activity ? (activity.description || '') : ''}">
            </div>
            <button type="button" class="btn btn-danger btn-sm" onclick="removeActivityField('${activityId}', '${containerId}')">
                <i class="fas fa-times"></i>
            </button>
        </div>
        ${activity ? `<div style="margin-top: 8px; font-size: 12px; color: var(--text-secondary);">
            <strong>Valor:</strong> R$ ${activity.value ? activity.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}
        </div>` : ''}
    `;
    activitiesList.appendChild(activityField);
}

// Remover campo de lançamento de horas
window.removeActivityField = function(activityId, containerId) {
    const activityField = document.querySelector(`.activity-field[data-activity-id="${activityId}"]`);
    if (activityField) {
        activityField.remove();
    }
};

// Coletar atividades do formulário
function collectActivities(containerId) {
    const activitiesList = document.getElementById(containerId);
    if (!activitiesList) return [];
    
    const activityFields = activitiesList.querySelectorAll('.activity-field');
    const activities = [];
    
    activityFields.forEach(field => {
        const date = field.querySelector('.activity-date-input')?.value;
        const hours = parseFloat(field.querySelector('.activity-hours-input')?.value);
        const description = field.querySelector('.activity-description-input')?.value.trim();
        
        if (date && !isNaN(hours) && hours > 0) {
            activities.push({
                id: field.dataset.activityId,
                date: date,
                hours: hours,
                description: description || '',
                value: 0 // Será calculado depois
            });
        }
    });
    
    return activities;
}

// Calcular valor de uma atividade baseado no responsável
function calculateActivityValue(activity, assigneeName, projectId) {
    if (!assigneeName || !projectId) return 0;
    
    const project = state.projects.find(p => p.id === projectId);
    if (!project) return 0;
    
    const squadId = project.squadId || project.squad_id;
    if (!squadId) return 0;
    
    const squad = state.squads.find(s => s.id === squadId);
    if (!squad) return 0;
    
    const member = squad.members.find(m => m.name === assigneeName);
    if (!member) return 0;
    
    let valuePerHour = 0;
    
    // Buscar valor hora baseado no tipo de contrato
    if (member.contract === 'Terceirizado' && member.companyProviderId) {
        const company = state.companies.find(c => c.id === member.companyProviderId);
        if (company && company.professionalTypes) {
            const professionalType = company.professionalTypes.find(pt => pt.name === member.role);
            if (professionalType) {
                valuePerHour = professionalType.valuePerHour;
            }
        }
    } else if (member.contract === 'CLT' && member.prodespAreaId) {
        const area = state.companies.find(c => c.id === member.prodespAreaId && c.isProdespArea === true);
        if (area && area.professionalTypes) {
            const professionalType = area.professionalTypes.find(pt => pt.name === member.role);
            if (professionalType) {
                valuePerHour = professionalType.valuePerHour;
            }
        }
    }
    // Para Estagiário e PJ, não há valor hora cadastrado, então retorna 0
    
    return activity.hours * valuePerHour;
}

// Abrir modal de Resumo de Lançamentos
function openLancamentosModal() {
    if (!state.currentProject) {
        alert('Por favor, selecione um projeto primeiro.');
        return;
    }

    renderLancamentosSummary();

    const modal = document.getElementById('lancamentos-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

// Fechar modal de Resumo de Lançamentos
function closeLancamentosModal() {
    const modal = document.getElementById('lancamentos-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Gerar resumo de lançamentos (nome, empresa, horas totais, valor total) do projeto atual
function renderLancamentosSummary() {
    const container = document.getElementById('lancamentos-summary-container');
    if (!container || !state.currentProject) return;

    // Filtra issues do projeto selecionado
    const projectIssues = state.issues.filter(i => i.projectId === state.currentProject.id);

    // Mapa: chave = colaborador, valor = agregado de horas e valor
    const summaryMap = new Map();

    projectIssues.forEach(issue => {
        if (!issue.activities || issue.activities.length === 0) {
            return;
        }

        // Mesmo que a tarefa esteja sem responsável, ainda consideramos as horas lançadas
        const assigneeName = issue.assignee && issue.assignee.trim()
            ? issue.assignee
            : 'Sem responsável';

        const squadId = state.currentProject.squadId || state.currentProject.squad_id;
        const squad = squadId
            ? state.squads.find(s => s.id === squadId)
            : null;
        const member = squad ? squad.members.find(m => m.name === issue.assignee) : null;

        const companyName = (() => {
            if (!member) return '-';
            if (member.contract === 'Terceirizado' && member.companyProviderId) {
                const company = state.companies.find(c => c.id === member.companyProviderId);
                return company ? company.name : '-';
            }
            if (member.contract === 'CLT' && member.prodespAreaId) {
                const area = state.companies.find(c => c.id === member.prodespAreaId && c.isProdespArea === true);
                return area ? area.name : '-';
            }
            return '-';
        })();

        const key = `${assigneeName}||${companyName}`;

        if (!summaryMap.has(key)) {
            summaryMap.set(key, {
                assigneeName,
                companyName,
                totalHours: 0,
                totalValue: 0
            });
        }

        const entry = summaryMap.get(key);

        issue.activities.forEach(activity => {
            const hours = Number(activity.hours) || 0;
            const value = Number(activity.value) || 0;
            entry.totalHours += hours;
            entry.totalValue += value;
        });
    });

    if (summaryMap.size === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-invoice-dollar"></i>
                <h3>Nenhum lançamento encontrado</h3>
                <p>Registre atividades com horas nas tarefas deste projeto para visualizar o resumo financeiro.</p>
            </div>
        `;
        return;
    }

    // Ordenar por nome do colaborador
    const rows = Array.from(summaryMap.values()).sort((a, b) => a.assigneeName.localeCompare(b.assigneeName));

    let totalHoursGeral = 0;
    let totalValueGeral = 0;

    rows.forEach(r => {
        totalHoursGeral += r.totalHours;
        totalValueGeral += r.totalValue;
    });

    const formatCurrency = (value) =>
        `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    container.innerHTML = `
        <div class="lancamentos-content">
            <table class="lancamentos-table">
                <thead>
                    <tr>
                        <th>Colaborador</th>
                        <th>Empresa / Área</th>
                        <th style="text-align: right;">Total de Horas</th>
                        <th style="text-align: right;">Valor Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(r => `
                        <tr>
                            <td>${r.assigneeName}</td>
                            <td>${r.companyName}</td>
                            <td style="text-align: right;">${r.totalHours.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td style="text-align: right;">${formatCurrency(r.totalValue)}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="2" style="text-align: right;">Totais do Projeto:</td>
                        <td style="text-align: right;">${totalHoursGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td style="text-align: right;">${formatCurrency(totalValueGeral)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;
}

// Deletar issue
function handleDeleteIssue() {
    const issueId = document.getElementById('edit-issue-id').value;
    const issue = state.issues.find(i => i.id === issueId);
    
    if (!issue) return;
    
    // Verificar se tem filhos
    const children = state.issues.filter(i => i.parentId === issueId);
    if (children.length > 0) {
        const typeLabel = issue.type === 'epic' ? 'Épico' : issue.type === 'story' ? 'História' : 'Tarefa';
        if (!confirm(`Este ${typeLabel} possui ${children.length} item(ns) filho(s). Ao excluir, os itens filhos ficarão sem pai. Deseja continuar?`)) {
            return;
        }
        // Remover parentId dos filhos
        children.forEach(child => {
            child.parentId = null;
            child.updatedAt = new Date().toISOString();
        });
    }
    
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) {
        return;
    }

    state.issues = state.issues.filter(i => i.id !== issueId);
    
    saveData();
    closeEditModal();
    
    if (state.currentView === 'boards') {
        renderBoard();
    } else if (state.currentView === 'backlog') {
        renderBacklog();
    }
}

async function handleDeleteProject(projectId) {
    const project = state.projects.find(p => p.id === projectId);
    if (!project) return;
    
    // Verificar se há issues, sprints ou stages associados ao projeto
    const projectIssues = state.issues.filter(i => i.projectId === projectId);
    const projectSprints = state.sprints.filter(s => s.projectId === projectId);
    const projectStages = state.stages.filter(s => s.project_id === projectId || (s.projectId && s.projectId === projectId));
    
    const totalItems = projectIssues.length + projectSprints.length + projectStages.length;
    
    if (totalItems > 0) {
        let message = `Este projeto possui:\n`;
        if (projectIssues.length > 0) message += `- ${projectIssues.length} tarefa(s)\n`;
        if (projectSprints.length > 0) message += `- ${projectSprints.length} sprint(s)\n`;
        if (projectStages.length > 0) message += `- ${projectStages.length} etapa(s)\n`;
        message += `\nAo excluir o projeto, todos esses itens também serão excluídos. Deseja continuar?`;
        
        if (!confirm(message)) {
            return;
        }
    } else {
        if (!confirm(`Tem certeza que deseja excluir o projeto "${project.name}"?`)) {
            return;
        }
    }
    
    // Excluir todas as issues do projeto
    if (projectIssues.length > 0) {
        for (const issue of projectIssues) {
            await deleteIssue(issue.id);
        }
        // Remover do state local
        state.issues = state.issues.filter(i => i.projectId !== projectId);
    }
    
    // Excluir todas as sprints do projeto
    if (projectSprints.length > 0) {
        for (const sprint of projectSprints) {
            if (isSupabaseAvailable() && typeof supabaseClient !== 'undefined') {
                try {
                    await supabaseClient
                        .from('sprints')
                        .delete()
                        .eq('id', sprint.id);
                } catch (error) {
                    console.error('Erro ao excluir sprint:', error);
                }
            }
        }
        // Remover do state local
        state.sprints = state.sprints.filter(s => s.projectId !== projectId);
    }
    
    // Excluir todas as stages do projeto
    if (projectStages.length > 0) {
        for (const stage of projectStages) {
            if (isSupabaseAvailable() && typeof supabaseClient !== 'undefined') {
                try {
                    await supabaseClient
                        .from('stages')
                        .delete()
                        .eq('id', stage.id);
                } catch (error) {
                    console.error('Erro ao excluir stage:', error);
                }
            }
        }
        // Remover do state local
        state.stages = state.stages.filter(s => {
            const stageProjectId = s.project_id || s.projectId;
            return stageProjectId !== projectId;
        });
    }
    
    // Excluir o projeto
    const success = await deleteProject(projectId);
    if (success) {
        // Remover do state local
        state.projects = state.projects.filter(p => p.id !== projectId);
        
        // Se o projeto excluído era o atual, limpar seleção
        if (state.currentProject && state.currentProject.id === projectId) {
            state.currentProject = null;
            document.getElementById('project-selector').value = '';
        }
        
        // Salvar dados
        saveData();
        
        // Atualizar interface
        renderProjects();
        updateProjectSelector();
        
        // Se estiver na view de boards e o projeto foi excluído, mostrar mensagem
        if (state.currentView === 'boards' && state.currentProject === null) {
            showView('projects');
        }
    } else {
        alert('Erro ao excluir o projeto. Tente novamente.');
    }
}

// Criar projeto
async function handleCreateProject(e) {
    e.preventDefault();
    
    const name = document.getElementById('project-name').value;
    const key = document.getElementById('project-key').value.toUpperCase();
    const description = document.getElementById('project-description').value;
    const squadId = document.getElementById('project-squad').value;

    if (!squadId) {
        alert('Por favor, selecione uma Squad para o projeto.');
        return;
    }

    // Validar chave única
    if (state.projects.some(p => p.key === key)) {
        alert('Já existe um projeto com esta chave. Por favor, escolha outra.');
        return;
    }

    const project = {
        id: 'temp-' + generateId(), // ID temporário para Supabase gerar o UUID
        name: name,
        key: key,
        description: description,
        squadId: squadId,
        createdAt: new Date().toISOString()
    };

    state.projects.push(project);
    
    // Salvar no Supabase (se disponível)
    if (typeof saveProject === 'function') {
        try {
            const savedProject = await saveProject(project);
            // Atualizar com o ID real do Supabase
            const index = state.projects.findIndex(p => p.id === project.id);
            if (index !== -1 && savedProject.id) {
                state.projects[index] = savedProject;
                project.id = savedProject.id; // Para usar abaixo
            }
        } catch (error) {
            console.error('Erro ao salvar projeto no Supabase:', error);
        }
    }
    
    saveData();
    updateProjectSelector();
    renderProjects();
    closeProjectModal();
    
    // Selecionar o projeto recém-criado
    state.currentProject = project;
    document.getElementById('project-selector').value = project.id;
    showView('boards');
    renderBoard();
}

// Drag and Drop
let draggedElement = null;

function allowDrop(ev) {
    ev.preventDefault();
}

function dragStart(ev) {
    draggedElement = ev.target;
    ev.target.classList.add('dragging');
    ev.dataTransfer.effectAllowed = 'move';
}

function dragEnd(ev) {
    ev.target.classList.remove('dragging');
}

async function drop(ev) {
    ev.preventDefault();
    
    if (!draggedElement || !state.currentProject) return;

    const issueId = draggedElement.dataset.issueId;
    const issue = state.issues.find(i => i.id === issueId);
    
    if (!issue || issue.projectId !== state.currentProject.id) return;

    // Garantir que apenas itens dentro da sprint atual possam ser movidos no board
    const activeSprint = getActiveSprint();
    if (!activeSprint || issue.sprintId !== activeSprint.id) {
        alert('Esta tarefa precisa estar em uma sprint em andamento para mudar de etapa.');
        return;
    }

    const column = ev.currentTarget.closest('.column');
    if (!column) return;

    const newStatus = column.dataset.status;

    // Regra: enquanto a sprint não estiver ativa, nenhuma tarefa pode sair da 2ª etapa
    if (activeSprint.status !== 'active') {
        const sortedStages = [...state.stages].sort((a, b) => a.order - b.order);
        if (sortedStages.length >= 2) {
            const secondStage = sortedStages[1];
            if (issue.status === secondStage.key && newStatus !== secondStage.key) {
                alert('A sprint ainda não foi iniciada. As tarefas não podem avançar da segunda etapa antes do início da sprint.');
                return;
            }
        }
    }

    if (issue.status !== newStatus) {
        issue.status = newStatus;
        issue.updatedAt = new Date().toISOString();

        // Persistir no Supabase quando disponível
        if (typeof saveIssue === 'function' && isSupabaseAvailable()) {
            try {
                await saveIssue(issue);
            } catch (error) {
                console.error('Erro ao salvar issue no Supabase ao mover etapa:', error);
            }
        }

        saveData();
        renderBoard();
    }
    
    draggedElement = null;
}

// Funções auxiliares
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getIssueTypeIcon(type) {
    const icons = {
        'task': 'check-square',
        'bug': 'bug',
        'story': 'book',
        'epic': 'flag'
    };
    return icons[type] || 'check-square';
}

function getPriorityLabel(priority) {
    const labels = {
        'low': 'Baixa',
        'medium': 'Média',
        'high': 'Alta',
        'critical': 'Crítica'
    };
    return labels[priority] || priority;
}

function getStatusLabel(status) {
    const stage = state.stages.find(s => s.key === status);
    return stage ? stage.name : status;
}

// Marcar anexo para remoção (função global para uso no HTML)
window.markAttachmentForRemoval = function(attachmentId) {
    const listContainer = document.getElementById('edit-attachments-list');
    if (!listContainer) return;

    let current = [];
    try {
        current = JSON.parse(listContainer.dataset.removeIds || '[]');
    } catch (err) {
        current = [];
    }

    if (!current.includes(attachmentId)) {
        current.push(attachmentId);
    }
    listContainer.dataset.removeIds = JSON.stringify(current);

    const item = listContainer.querySelector(`[data-attachment-id="${attachmentId}"]`);
    if (item) {
        item.style.opacity = '0.5';
        const btn = item.querySelector('button');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Marcado para remoção';
        }
    }
};

// ==================== GERENCIAMENTO DE ETAPAS ====================

// Abrir modal de gerenciar etapas
function openStagesModal() {
    document.getElementById('stages-modal').classList.add('active');
    renderStagesList();
    hideStageForm();
}

// Fechar modal de etapas
function closeStagesModal() {
    document.getElementById('stages-modal').classList.remove('active');
    hideStageForm();
    
    // Atualizar board ao fechar o modal
    if (state.currentProject) {
        renderBoard();
    }
}

// Renderizar lista de etapas
function renderStagesList() {
    const stagesList = document.getElementById('stages-list');
    const sortedStages = [...state.stages].sort((a, b) => a.order - b.order);
    
    if (sortedStages.length === 0) {
        stagesList.innerHTML = '<p style="color: var(--text-secondary);">Nenhuma etapa cadastrada.</p>';
        return;
    }
    
    stagesList.innerHTML = sortedStages.map(stage => `
        <div class="stage-item" data-stage-id="${stage.id}">
            <div class="stage-item-left">
                <div class="stage-color-indicator" style="background-color: ${stage.color};"></div>
                <div class="stage-item-info">
                    <div class="stage-item-name">${escapeHtml(stage.name)}</div>
                    <div class="stage-item-key">Chave: ${escapeHtml(stage.key)} | Ordem: ${stage.order}</div>
                </div>
            </div>
            <div class="stage-item-actions">
                <button class="stage-item-btn edit" onclick="editStage('${stage.id}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="stage-item-btn delete" onclick="deleteStage('${stage.id}')" ${state.stages.length <= 1 ? 'disabled' : ''}>
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        </div>
    `).join('');
}

// Mostrar formulário de etapa
function showStageForm(stageId = null) {
    const formContainer = document.getElementById('stage-form-container');
    const formTitle = document.getElementById('stage-form-title');
    const form = document.getElementById('stage-form');
    
    formContainer.style.display = 'block';
    
    if (stageId) {
        formTitle.textContent = 'Editar Etapa';
        const stage = state.stages.find(s => s.id === stageId);
        if (stage) {
            document.getElementById('stage-id').value = stage.id;
            document.getElementById('stage-name').value = stage.name;
            document.getElementById('stage-key').value = stage.key;
            document.getElementById('stage-color').value = stage.color;
            document.getElementById('stage-order').value = stage.order;
        }
    } else {
        formTitle.textContent = 'Nova Etapa';
        form.reset();
        document.getElementById('stage-id').value = '';
        // Definir ordem padrão como última
        const maxOrder = state.stages.length > 0 
            ? Math.max(...state.stages.map(s => s.order)) 
            : -1;
        document.getElementById('stage-order').value = maxOrder + 1;
    }
    
    // Scroll para o formulário
    formContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Ocultar formulário de etapa
function hideStageForm() {
    document.getElementById('stage-form-container').style.display = 'none';
    document.getElementById('stage-form').reset();
}

// Cancelar formulário de etapa
function cancelStageForm() {
    hideStageForm();
}

// Editar etapa (tornar global para uso no HTML)
window.editStage = function(stageId) {
    showStageForm(stageId);
};

// Deletar etapa (tornar global para uso no HTML)
window.deleteStage = function(stageId) {
    if (state.stages.length <= 1) {
        alert('Você precisa ter pelo menos uma etapa.');
        return;
    }
    
    const stage = state.stages.find(s => s.id === stageId);
    if (!stage) return;
    
    // Verificar se há issues usando esta etapa
    const issuesUsingStage = state.issues.filter(i => i.status === stage.key);
    
    if (issuesUsingStage.length > 0) {
        if (!confirm(`Esta etapa está sendo usada por ${issuesUsingStage.length} tarefa(s). Ao excluir, essas tarefas serão movidas para a primeira etapa disponível. Deseja continuar?`)) {
            return;
        }
        
        // Mover issues para a primeira etapa disponível
        const firstStage = [...state.stages]
            .filter(s => s.id !== stageId)
            .sort((a, b) => a.order - b.order)[0];
        
        if (firstStage) {
            issuesUsingStage.forEach(issue => {
                issue.status = firstStage.key;
                issue.updatedAt = new Date().toISOString();
            });
        }
    }
    
    state.stages = state.stages.filter(s => s.id !== stageId);
    saveData();
    renderStagesList();
    
    // Sempre atualizar board se houver projeto selecionado
    if (state.currentProject) {
        renderBoard();
    }
    
    updateStatusSelects();
}

// Salvar etapa
function handleSaveStage(e) {
    e.preventDefault();
    
    const stageId = document.getElementById('stage-id').value;
    const name = document.getElementById('stage-name').value.trim();
    const key = document.getElementById('stage-key').value.trim().toLowerCase();
    const color = document.getElementById('stage-color').value;
    const order = parseInt(document.getElementById('stage-order').value) || 0;
    
    // Validar chave
    if (!/^[a-z0-9-]+$/.test(key)) {
        alert('A chave deve conter apenas letras minúsculas, números e hífens.');
        return;
    }
    
    if (stageId) {
        // Editar etapa existente
        const stage = state.stages.find(s => s.id === stageId);
        if (!stage) return;
        
        // Verificar se a chave já existe em outra etapa
        if (key !== stage.key && state.stages.some(s => s.key === key && s.id !== stageId)) {
            alert('Já existe uma etapa com esta chave.');
            return;
        }
        
        // Se a chave mudou, atualizar todas as issues que usam esta etapa
        if (key !== stage.key) {
            const issuesUsingStage = state.issues.filter(i => i.status === stage.key);
            issuesUsingStage.forEach(issue => {
                issue.status = key;
                issue.updatedAt = new Date().toISOString();
            });
        }
        
        stage.name = name;
        stage.key = key;
        stage.color = color;
        stage.order = order;
    } else {
        // Criar nova etapa
        // Verificar se a chave já existe
        if (state.stages.some(s => s.key === key)) {
            alert('Já existe uma etapa com esta chave.');
            return;
        }
        
        const newStage = {
            id: generateId(),
            name: name,
            key: key,
            color: color,
            order: order
        };
        
        state.stages.push(newStage);
    }
    
    saveData();
    renderStagesList();
    hideStageForm();
    
    // Sempre atualizar board se houver projeto selecionado
    if (state.currentProject) {
        renderBoard();
    }
    
    updateStatusSelects();
}

// ==================== GERENCIAMENTO DE SPRINTS ====================

// Obter sprint ativa ou em refinamento do projeto atual
function getActiveSprint() {
    if (!state.currentProject) return null;
    return state.sprints.find(s => 
        s.projectId === state.currentProject.id && 
        (s.status === 'active' || s.status === 'refinamento')
    );
}

// Renderizar sprints
function renderSprints() {
    if (!state.currentProject) {
        const sprintsList = document.getElementById('sprints-list');
        if (sprintsList) {
            sprintsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-running"></i>
                    <h3>Selecione um projeto</h3>
                    <p>Selecione um projeto para gerenciar sprints</p>
                </div>
            `;
        }
        return;
    }

    const activeSprint = getActiveSprint();
    const projectSprints = state.sprints
        .filter(s => s.projectId === state.currentProject.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Renderizar sprint ativa
    if (activeSprint) {
        renderActiveSprint(activeSprint);
    } else {
        const activeSection = document.getElementById('active-sprint-section');
        if (activeSection) activeSection.style.display = 'none';
    }

    // Renderizar histórico
    const closedSprints = projectSprints.filter(s => s.status === 'closed');
    renderSprintsHistory(closedSprints);
}

// Renderizar sprint ativa
function renderActiveSprint(sprint) {
    const activeSection = document.getElementById('active-sprint-section');
    if (!activeSection) return;
    
    activeSection.style.display = 'block';
    const nameEl = document.getElementById('active-sprint-name');
    const datesEl = document.getElementById('active-sprint-dates');
    const statusEl = document.getElementById('active-sprint-status');
    const activateBtn = document.getElementById('activate-sprint-btn');
    
    if (nameEl) nameEl.textContent = sprint.name;
    
    if (statusEl) {
        if (sprint.status === 'refinamento') {
            statusEl.textContent = 'Status: Em Refinamento Técnico';
            statusEl.style.color = 'var(--warning)';
            statusEl.style.fontWeight = '600';
        } else if (sprint.status === 'active') {
            statusEl.textContent = 'Status: Sprint Ativa';
            statusEl.style.color = 'var(--success)';
            statusEl.style.fontWeight = '600';
        } else {
            statusEl.textContent = 'Status: Fechada';
            statusEl.style.color = 'var(--text-secondary)';
        }
    }
    
    if (datesEl) {
        if ((sprint.status === 'active' || sprint.status === 'refinamento') && sprint.startDate && sprint.endDate) {
            const startDate = new Date(sprint.startDate).toLocaleDateString('pt-BR');
            const endDate = new Date(sprint.endDate).toLocaleDateString('pt-BR');
            const today = new Date();
            const endDateObj = new Date(sprint.endDate);
            const daysRemaining = Math.ceil((endDateObj - today) / (1000 * 60 * 60 * 24));
            
            datesEl.textContent = `${startDate} - ${endDate}`;
            if (daysRemaining > 0) {
                datesEl.innerHTML += ` <span style="color: var(--primary-color); font-weight: 600;">(${daysRemaining} dias restantes)</span>`;
            } else if (daysRemaining === 0) {
                datesEl.innerHTML += ` <span style="color: var(--warning); font-weight: 600;">(Último dia!)</span>`;
            } else {
                datesEl.innerHTML += ` <span style="color: var(--danger); font-weight: 600;">(Atrasada ${Math.abs(daysRemaining)} dias)</span>`;
            }
        } else {
            datesEl.textContent = `Duração: ${sprint.weeks} semana(s) - Aguardando datas`;
        }
    }
    
    // Mostrar/ocultar botão de ativar
    if (activateBtn) {
        if (sprint.status === 'refinamento') {
            activateBtn.style.display = 'inline-flex';
        } else {
            activateBtn.style.display = 'none';
        }
    }

    // Exibir botão de excluir apenas enquanto a sprint não estiver ativa
    const deleteSprintBtn = document.getElementById('delete-sprint-btn');
    if (deleteSprintBtn) {
        if (sprint.status === 'refinamento') {
            deleteSprintBtn.style.display = 'inline-flex';
        } else {
            deleteSprintBtn.style.display = 'none';
        }
    }

    // Buscar itens da sprint e ordenar por sprintOrder
    const sprintItems = state.issues
        .filter(i => i.sprintId === sprint.id)
        .sort((a, b) => {
            const orderA = a.sprintOrder !== undefined ? a.sprintOrder : 9999;
            const orderB = b.sprintOrder !== undefined ? b.sprintOrder : 9999;
            return orderA - orderB;
        });
    const doneCount = sprintItems.filter(i => i.status === 'done').length;
    const inProgressCount = sprintItems.filter(i => i.status === 'in-progress').length;

    const itemsCountEl = document.getElementById('sprint-items-count');
    const doneCountEl = document.getElementById('sprint-done-count');
    const inProgressCountEl = document.getElementById('sprint-in-progress-count');
    
    if (itemsCountEl) itemsCountEl.textContent = sprintItems.length;
    if (doneCountEl) doneCountEl.textContent = doneCount;
    if (inProgressCountEl) inProgressCountEl.textContent = inProgressCount;

    // Renderizar itens
    renderSprintItems(sprintItems);
}

// Renderizar itens da sprint
function renderSprintItems(items) {
    const itemsList = document.getElementById('sprint-items-list');
    if (!itemsList) return;
    
    if (items.length === 0) {
        itemsList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Nenhum item na sprint. Adicione itens do backlog.</p>';
        return;
    }

    const project = state.projects.find(p => p.id === state.currentProject.id);
    itemsList.innerHTML = items.map((issue, index) => {
        const issueKey = `${project.key}-${issue.number}`;
        const statusLabel = getStatusLabel(issue.status);
        const typeLabel = issue.type === 'epic' ? 'Épico' : issue.type === 'story' ? 'História' : issue.type === 'task' ? 'Tarefa' : 'Bug';
        const storyPointsText = issue.storyPoints ? ` • ${issue.storyPoints} pts` : '';
        
        return `
            <div class="sprint-item" 
                 draggable="true" 
                 data-issue-id="${issue.id}"
                 data-sprint-order="${index}"
                 ondragstart="dragSprintItemStart(event)"
                 ondragover="allowSprintItemDrop(event)"
                 ondrop="dropSprintItem(event)"
                 ondragend="dragSprintItemEnd(event)">
                <div class="sprint-item-drag-handle" style="cursor: move; color: var(--text-secondary); padding: 4px 8px;">
                    <i class="fas fa-grip-vertical"></i>
                </div>
                <div class="sprint-item-info">
                    <span class="issue-type ${issue.type}">
                        <i class="fas fa-${getIssueTypeIcon(issue.type)}"></i>
                    </span>
                    <div>
                        <div style="font-weight: 600;">
                            <span class="issue-key" style="margin-right: 8px;">${issueKey}</span>
                            ${escapeHtml(issue.title)}
                        </div>
                        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                            ${typeLabel} • ${statusLabel}${storyPointsText}
                        </div>
                    </div>
                </div>
                <div class="sprint-item-actions">
                    <button class="btn btn-secondary btn-sm" onclick="removeFromSprint('${issue.id}')">
                        <i class="fas fa-times"></i> Remover
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Renderizar histórico de sprints
function renderSprintsHistory(sprints) {
    const sprintsList = document.getElementById('sprints-list');
    if (!sprintsList) return;
    
    if (sprints.length === 0) {
        sprintsList.innerHTML = '<p style="color: var(--text-secondary);">Nenhuma sprint concluída ainda.</p>';
        return;
    }

    const project = state.projects.find(p => p.id === state.currentProject.id);
    sprintsList.innerHTML = sprints.map(sprint => {
        const startDate = new Date(sprint.startDate).toLocaleDateString('pt-BR');
        const endDate = new Date(sprint.endDate).toLocaleDateString('pt-BR');
        const sprintItems = state.issues.filter(i => i.sprintId === sprint.id);
        const doneCount = sprintItems.filter(i => i.status === 'done').length;
        
        return `
            <div class="sprint-history-item closed">
                <div>
                    <h4>${escapeHtml(sprint.name)}</h4>
                    <p style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                        ${startDate} - ${endDate} • ${sprintItems.length} itens • ${doneCount} concluídos
                    </p>
                </div>
            </div>
        `;
    }).join('');
}

// Abrir modal de sprint
function openSprintModal() {
    const activeSprint = getActiveSprint();
    if (activeSprint && activeSprint.status === 'active') {
        alert('Já existe uma sprint ativa. Feche a sprint atual antes de criar uma nova.');
        return;
    }
    
    const modal = document.getElementById('sprint-modal');
    if (!modal) {
        console.error('Modal de sprint não encontrado');
        return;
    }
    
    modal.classList.add('active');
    const form = document.getElementById('sprint-form');
    if (form) form.reset();
    
    const sprintId = document.getElementById('sprint-id');
    if (sprintId) sprintId.value = '';
    
    const title = document.getElementById('sprint-modal-title');
    if (title) title.textContent = 'Criar Nova Sprint';
    
    const saveBtn = document.getElementById('save-sprint-btn');
    if (saveBtn) saveBtn.textContent = 'Criar Sprint';
    
    // Definir semanas padrão como 3
    const weeksSelect = document.getElementById('sprint-weeks');
    if (weeksSelect) weeksSelect.value = '3';

    // Definir data de início padrão como hoje
    const startDateInput = document.getElementById('sprint-start-date');
    if (startDateInput) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        startDateInput.value = today.toISOString().split('T')[0];
    }
}

// Fechar modal de sprint
function closeSprintModal() {
    const modal = document.getElementById('sprint-modal');
    if (modal) modal.classList.remove('active');
}

// Salvar sprint
async function handleSaveSprint(e) {
    e.preventDefault();
    
    if (!state.currentProject) {
        alert('Por favor, selecione um projeto primeiro.');
        return;
    }

    const activeSprint = getActiveSprint();
    if (activeSprint && activeSprint.status === 'active') {
        alert('Já existe uma sprint ativa. Feche a sprint atual antes de criar uma nova.');
        return;
    }

    const name = document.getElementById('sprint-name');
    const weeks = document.getElementById('sprint-weeks');
    const goal = document.getElementById('sprint-goal');
    const startDateInput = document.getElementById('sprint-start-date');
    
    if (!name || !weeks) return;

    const sprintName = name.value.trim();
    const sprintWeeks = parseInt(weeks.value);
    const sprintGoal = goal ? goal.value.trim() : '';
    const startDateValue = startDateInput ? startDateInput.value : '';
    const startDate = startDateValue ? new Date(startDateValue) : null;

    if (!startDate) {
        alert('Defina a data de início da sprint.');
        return;
    }

    // calcular data de término a partir da data de início e duração
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (sprintWeeks * 7));

    const sprint = {
        id: 'temp-' + generateId(), // ID temporário para permitir insert no Supabase
        projectId: state.currentProject.id,
        name: sprintName,
        weeks: sprintWeeks,
        goal: sprintGoal,
        status: 'refinamento', // Status inicial: em refinamento
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        activatedAt: null,
        createdAt: new Date().toISOString()
    };

    state.sprints.push(sprint);

    // Salvar no Supabase se disponível e substituir pelo registro real
    if (typeof saveSprint === 'function' && isSupabaseAvailable()) {
        try {
            const savedSprint = await saveSprint(sprint);
            if (savedSprint && savedSprint.id) {
                const index = state.sprints.findIndex(s => s.id === sprint.id);
                if (index !== -1) {
                    state.sprints[index] = savedSprint;
                    sprint.id = savedSprint.id; // manter referência consistente
                }
            }
        } catch (error) {
            console.error('Erro ao salvar sprint no Supabase:', error);
        }
    }

    saveData();
    closeSprintModal();
    renderSprints();
    updateBacklogHeader();
    
    // Abrir modal para adicionar issues à sprint
    setTimeout(() => {
        openAddToSprintModal();
    }, 300);
}

// Ativar sprint
async function handleActivateSprint() {
    const activeSprint = getActiveSprint();
    if (!activeSprint || activeSprint.status !== 'refinamento') return;

    const sprintItems = state.issues.filter(i => i.sprintId === activeSprint.id);
    if (sprintItems.length === 0) {
        alert('Adicione pelo menos um item à sprint antes de ativá-la.');
        return;
    }

    // Verificar se todas as tarefas estão na segunda etapa ou além (não podem estar no backlog)
    const sortedStages = [...state.stages].sort((a, b) => a.order - b.order);
    if (sortedStages.length < 2) {
        alert('É necessário ter pelo menos 2 etapas configuradas no fluxo.');
        return;
    }

    const firstStage = sortedStages[0]; // Primeira etapa = Backlog
    const itemsInBacklog = sprintItems.filter(i => i.status === firstStage.key);
    
    if (itemsInBacklog.length > 0) {
        alert(`Não é possível ativar a sprint. Existem ${itemsInBacklog.length} item(ns) ainda no backlog. Todas as tarefas devem estar na segunda etapa ou além para iniciar a sprint.`);
        return;
    }

    if (!confirm(`Tem certeza que deseja ativar esta sprint? A sprint terá duração de ${activeSprint.weeks} semana(s) e o prazo começará a contar a partir de agora.`)) {
        return;
    }

    // Definir datas de início e fim respeitando a data planejada
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const plannedStart = activeSprint.startDate ? new Date(activeSprint.startDate) : today;
    const start = plannedStart > today ? plannedStart : today; // não iniciar no passado
    const endDate = new Date(start);
    endDate.setDate(start.getDate() + (activeSprint.weeks * 7));

    activeSprint.status = 'active';
    activeSprint.startDate = start.toISOString().split('T')[0];
    activeSprint.endDate = endDate.toISOString().split('T')[0];
    activeSprint.activatedAt = new Date().toISOString();

    // Persistir sprint no Supabase, se disponível
    if (typeof saveSprint === 'function' && isSupabaseAvailable()) {
        try {
            await saveSprint(activeSprint);
        } catch (error) {
            console.error('Erro ao atualizar sprint no Supabase:', error);
        }
    }

    saveData();
    renderSprints();
    if (state.currentView === 'boards') {
        renderBoard();
    }
}

// Fechar sprint
async function handleCloseSprint() {
    const activeSprint = getActiveSprint();
    if (!activeSprint) return;

    if (!confirm('Tem certeza que deseja fechar esta sprint? Os itens não concluídos voltarão para o backlog.')) {
        return;
    }

    activeSprint.status = 'closed';
    activeSprint.closedAt = new Date().toISOString();
    
    // Remover sprintId dos itens não concluídos
    const sprintItems = state.issues.filter(i => i.sprintId === activeSprint.id);
    sprintItems.forEach(issue => {
        if (issue.status !== 'done') {
            issue.sprintId = null;
            issue.updatedAt = new Date().toISOString();
        }
    });

    // Persistir sprint no Supabase, se disponível
    if (typeof saveSprint === 'function' && isSupabaseAvailable()) {
        try {
            await saveSprint(activeSprint);
        } catch (error) {
            console.error('Erro ao atualizar sprint no Supabase:', error);
        }
    }

    saveData();
    renderSprints();
    if (state.currentView === 'backlog') {
        renderBacklog();
    }
    updateBacklogHeader();
}

// Excluir sprint (apenas em refinamento)
async function handleDeleteSprint() {
    const activeSprint = getActiveSprint();
    if (!activeSprint || activeSprint.status !== 'refinamento') {
        alert('Só é possível excluir sprints em refinamento.');
        return;
    }

    if (!confirm('Tem certeza que deseja excluir esta sprint? Itens voltarão para o backlog.')) {
        return;
    }

    // Remover vínculo da sprint das issues
    const sprintItems = state.issues.filter(i => i.sprintId === activeSprint.id);
    sprintItems.forEach(issue => {
        issue.sprintId = null;
        issue.sprintOrder = undefined;
        issue.updatedAt = new Date().toISOString();
    });

    // Remover sprint do estado
    state.sprints = state.sprints.filter(s => s.id !== activeSprint.id);

    // Persistir no Supabase, se disponível
    if (typeof deleteSprintById === 'function' && isSupabaseAvailable()) {
        try {
            await deleteSprintById(activeSprint.id);
        } catch (error) {
            console.error('Erro ao excluir sprint no Supabase:', error);
        }
    }

    // Salvar issues atualizadas no Supabase
    if (typeof saveIssue === 'function' && isSupabaseAvailable() && sprintItems.length > 0) {
        try {
            await Promise.all(sprintItems.map(issue => saveIssue(issue)));
        } catch (error) {
            console.error('Erro ao salvar issues após excluir sprint:', error);
        }
    }

    saveData();
    renderSprints();
    updateBacklogHeader();
    if (state.currentView === 'backlog') renderBacklog();
    if (state.currentView === 'boards') renderBoard();
}

// Abrir modal de adicionar à sprint
function openAddToSprintModal() {
    const activeSprint = getActiveSprint();
    if (!activeSprint) {
        alert('Não há sprint ativa. Crie uma sprint primeiro.');
        return;
    }

    // Se a sprint já está ativa, avisar que é um caso excepcional
    if (activeSprint.status === 'active') {
        if (!confirm('A sprint já está ativa. Adicionar tarefas agora é um caso excepcional. Deseja continuar?')) {
            return;
        }
    }

    const modal = document.getElementById('add-to-sprint-modal');
    if (modal) {
        modal.classList.add('active');
        renderBacklogChecklist(activeSprint.id);
    }
}

// Fechar modal de adicionar à sprint
function closeAddToSprintModal() {
    const modal = document.getElementById('add-to-sprint-modal');
    if (modal) modal.classList.remove('active');
}

// Renderizar checklist do backlog
function renderBacklogChecklist(sprintId) {
    if (!state.currentProject) return;

    const backlogItems = state.issues.filter(i => 
        i.projectId === state.currentProject.id && 
        (!i.sprintId || i.sprintId === null)
    );

    const checklist = document.getElementById('backlog-items-checklist');
    if (!checklist) return;
    
    const project = state.projects.find(p => p.id === state.currentProject.id);

    if (backlogItems.length === 0) {
        checklist.innerHTML = '<p style="color: var(--text-secondary);">Não há itens disponíveis no backlog.</p>';
        return;
    }

    checklist.innerHTML = backlogItems.map(issue => {
        const issueKey = `${project.key}-${issue.number}`;
        const typeLabel = issue.type === 'epic' ? 'Épico' : issue.type === 'story' ? 'História' : issue.type === 'task' ? 'Tarefa' : 'Bug';
        
        return `
            <div class="checklist-item">
                <input type="checkbox" id="check-${issue.id}" value="${issue.id}">
                <div class="checklist-item-info">
                    <div class="checklist-item-title">
                        <span class="issue-key" style="margin-right: 8px;">${issueKey}</span>
                        ${escapeHtml(issue.title)}
                    </div>
                    <div class="checklist-item-meta">
                        ${typeLabel} • ${getStatusLabel(issue.status)} • ${getPriorityLabel(issue.priority)}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Adicionar itens à sprint
async function handleAddItemsToSprint() {
    const activeSprint = getActiveSprint();
    if (!activeSprint) {
        alert('Não há sprint ativa.');
        return;
    }

    const checkboxes = document.querySelectorAll('#backlog-items-checklist input[type="checkbox"]:checked');
    const selectedIds = Array.from(checkboxes).map(cb => cb.value);

    if (selectedIds.length === 0) {
        alert('Selecione pelo menos um item para adicionar à sprint.');
        return;
    }

    // Ordenar etapas por ordem para identificar a primeira (backlog) e segunda etapa
    const sortedStages = [...state.stages].sort((a, b) => a.order - b.order);
    if (sortedStages.length < 2) {
        alert('É necessário ter pelo menos 2 etapas configuradas no fluxo.');
        return;
    }

    const firstStage = sortedStages[0]; // Primeira etapa = Backlog
    const secondStage = sortedStages[1]; // Segunda etapa = Próxima após backlog

    // Buscar itens já na sprint para determinar a próxima ordem
    const existingSprintItems = state.issues.filter(i => i.sprintId === activeSprint.id);
    const maxOrder = existingSprintItems.length > 0 
        ? Math.max(...existingSprintItems.map(i => i.sprintOrder !== undefined ? i.sprintOrder : -1))
        : -1;
    
    const updatedIssues = [];

    selectedIds.forEach((issueId, index) => {
        const issue = state.issues.find(i => i.id === issueId);
        if (issue) {
            issue.sprintId = activeSprint.id;
            issue.sprintOrder = maxOrder + index + 1;
            // Mover para a segunda etapa (próxima após backlog)
            // Se a sprint já está ativa, as tarefas vão direto para a segunda etapa
            issue.status = secondStage.key;
            issue.updatedAt = new Date().toISOString();
            updatedIssues.push(issue);
        }
    });

    // Persistir no Supabase, se disponível
    if (typeof saveIssue === 'function' && isSupabaseAvailable() && updatedIssues.length > 0) {
        try {
            await Promise.all(updatedIssues.map(issue => saveIssue(issue)));
        } catch (error) {
            console.error('Erro ao salvar itens da sprint no Supabase:', error);
        }
    }

    saveData();
    closeAddToSprintModal();
    renderSprints();
    if (state.currentView === 'backlog') {
        renderBacklog();
    }
    if (state.currentView === 'boards') {
        renderBoard();
    }
}

// Remover item da sprint (função global)
window.removeFromSprint = function(issueId) {
    const issue = state.issues.find(i => i.id === issueId);
    if (!issue) return;

    const activeSprint = getActiveSprint();
    if (!activeSprint) return;

    // Não permitir remover itens de sprint já iniciada
    if (activeSprint.status === 'active') {
        alert('Esta sprint já foi iniciada. A inclusão ou retirada de itens deve ser autorizada pelo Líder de Implantação.');
        return;
    }

    if (!confirm('Deseja remover este item da sprint? Ele voltará para o backlog.')) {
        return;
    }

    issue.sprintId = null;
    issue.sprintOrder = undefined;
    issue.updatedAt = new Date().toISOString();
    
    // Reordenar itens restantes
    const remainingItems = state.issues
        .filter(i => i.sprintId === activeSprint.id)
        .sort((a, b) => {
            const orderA = a.sprintOrder !== undefined ? a.sprintOrder : 9999;
            const orderB = b.sprintOrder !== undefined ? b.sprintOrder : 9999;
            return orderA - orderB;
        });
    
    remainingItems.forEach((item, index) => {
        item.sprintOrder = index;
        item.updatedAt = new Date().toISOString();
    });
    
    saveData();
    renderActiveSprint(activeSprint);
    
    if (state.currentView === 'backlog') {
        renderBacklog();
    }
};

// Atualizar header do backlog
function updateBacklogHeader() {
    const addToSprintBtn = document.getElementById('add-to-sprint-btn');
    if (!addToSprintBtn) return;
    
    const activeSprint = getActiveSprint();
    // Só mostra o botão quando há sprint em Refinamento Técnico
    if (activeSprint && activeSprint.status === 'refinamento' && state.currentProject) {
        addToSprintBtn.style.display = 'inline-flex';
    } else {
        addToSprintBtn.style.display = 'none';
    }
}

// ==================== GERENCIAMENTO DE SQUADS ====================

// Abrir modal de squad (para criar ou editar)
function openSquadModal(squadId = null) {
    const modal = document.getElementById('squad-modal');
    const form = document.getElementById('squad-form');
    const modalTitle = modal.querySelector('h2');
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Armazenar ID da squad sendo editada
    form.dataset.editingSquadId = squadId || '';
    
    modal.classList.add('active');
    form.reset();
    document.getElementById('squad-members-list').innerHTML = '';
    
    if (squadId) {
        // Modo edição
        const squad = state.squads.find(s => s.id === squadId);
        if (!squad) return;
        
        modalTitle.textContent = 'Editar Squad';
        submitButton.textContent = 'Salvar Alterações';
        
        // Preencher nome da squad
        document.getElementById('squad-name').value = squad.name;
        
        // Adicionar campos de membros
        squad.members.forEach(member => {
            addMemberField();
            const fields = document.querySelectorAll('.member-field');
            const lastField = fields[fields.length - 1];
            if (lastField) {
                const memberId = lastField.dataset.memberId;
                
                // Preencher campos básicos
                lastField.querySelector('.member-name-input').value = member.name || '';
                lastField.querySelector('.member-email-input').value = member.email || '';
                lastField.querySelector('.member-contract-input').value = member.contract || '';
                
                // Disparar evento para mostrar campos condicionais
                const contractSelect = lastField.querySelector('.member-contract-input');
                if (contractSelect && member.contract) {
                    toggleContractFields(memberId, member.contract);
                }
                
                // Preencher campos específicos baseados no contrato
                if (member.contract === 'Terceirizado' && member.companyProviderId) {
                    const companyProviderSelect = lastField.querySelector('.member-company-provider-input');
                    if (companyProviderSelect) {
                        updateCompanyProviderSelect(memberId);
                        setTimeout(() => {
                            companyProviderSelect.value = member.companyProviderId;
                            updateRoleSelectForCompany(memberId, member.companyProviderId);
                            setTimeout(() => {
                                const roleSelect = lastField.querySelector('.member-role-select-company');
                                if (roleSelect) {
                                    roleSelect.value = member.role || '';
                                }
                            }, 100);
                        }, 100);
                    }
                } else if (member.contract === 'CLT' && member.prodespAreaId) {
                    const areaSelect = lastField.querySelector('.member-prodesp-area-select-input');
                    if (areaSelect) {
                        updateProdespAreaSelect(memberId);
                        setTimeout(() => {
                            areaSelect.value = member.prodespAreaId;
                            updateRoleSelectForProdespArea(memberId, member.prodespAreaId);
                            setTimeout(() => {
                                const roleSelect = lastField.querySelector('.member-role-select-prodesp');
                                if (roleSelect) {
                                    roleSelect.value = member.role || '';
                                }
                            }, 100);
                        }, 100);
                    }
                } else if (member.contract === 'Estagiário' && member.prodespArea) {
                    const areaInput = lastField.querySelector('.member-prodesp-area-text-input');
                    if (areaInput) {
                        areaInput.value = member.prodespArea;
                    }
                    const roleInput = lastField.querySelector('.member-role-text-input');
                    if (roleInput) {
                        roleInput.value = member.role || '';
                    }
                } else if (member.contract === 'PJ' && member.company) {
                    const companyInput = lastField.querySelector('.member-company-input');
                    if (companyInput) {
                        companyInput.value = member.company;
                    }
                    const roleInput = lastField.querySelector('.member-role-text-input');
                    if (roleInput) {
                        roleInput.value = member.role || '';
                    }
                } else {
                    // Para outros casos ou se não houver contrato específico
                    const roleInput = lastField.querySelector('.member-role-text-input');
                    if (roleInput) {
                        roleInput.value = member.role || '';
                    }
                }
            }
        });
    } else {
        // Modo criação
        modalTitle.textContent = 'Criar Nova Squad';
        submitButton.textContent = 'Criar Squad';
        addMemberField(); // Adicionar primeiro campo de membro
    }
}

// Fechar modal de squad
function closeSquadModal() {
    const modal = document.getElementById('squad-modal');
    const form = document.getElementById('squad-form');
    modal.classList.remove('active');
    form.dataset.editingSquadId = '';
}

// Editar squad
window.editSquad = function(squadId) {
    openSquadModal(squadId);
};

// Adicionar campo de membro
function addMemberField() {
    const membersList = document.getElementById('squad-members-list');
    if (!membersList) return;
    
    const memberId = generateId();
    const memberField = document.createElement('div');
    memberField.className = 'member-field';
    memberField.dataset.memberId = memberId;
    memberField.style.cssText = 'border: 1px solid var(--border-color); padding: 16px; margin-bottom: 16px; border-radius: 8px; background: var(--bg-secondary);';
    memberField.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h4 style="margin: 0; font-size: 14px; font-weight: 600;">Membro</h4>
            <button type="button" class="btn btn-danger btn-sm" onclick="removeMemberField('${memberId}')">
                <i class="fas fa-times"></i> Remover
            </button>
        </div>
        <div class="form-group">
            <label>Nome *</label>
            <input type="text" class="member-name-input" placeholder="Nome completo" required>
        </div>
        <div class="form-group">
            <label>Contrato *</label>
            <select class="member-contract-input" required onchange="toggleContractFields('${memberId}', this.value)">
                <option value="">Selecione...</option>
                <option value="CLT">CLT</option>
                <option value="PJ">PJ</option>
                <option value="Estagiário">Estagiário</option>
                <option value="Terceirizado">Terceirizado</option>
            </select>
        </div>
        <div class="form-group member-company-provider-group" data-member-id="${memberId}" style="display: none;">
            <label>Empresa Prestadora de Serviço *</label>
            <select class="member-company-provider-input" onchange="updateRoleSelectForCompany('${memberId}', this.value)">
                <option value="">Selecione uma empresa...</option>
            </select>
            <small>Selecione a empresa prestadora de serviço cadastrada no Financeiro</small>
        </div>
        <div class="form-group member-prodesp-area-group" data-member-id="${memberId}" style="display: none;">
            <label>Área Prodesp *</label>
            <input type="text" class="member-prodesp-area-input member-prodesp-area-text-input" placeholder="Ex: TI, RH, Financeiro">
            <select class="member-prodesp-area-input member-prodesp-area-select-input" style="display: none;" onchange="updateRoleSelectForProdespArea('${memberId}', this.value)">
                <option value="">Selecione a área...</option>
            </select>
            <small class="member-prodesp-area-text-small">Informe a área da Prodesp onde o profissional está lotado</small>
            <small class="member-prodesp-area-select-small" style="display: none;">Selecione a área cadastrada no Financeiro</small>
        </div>
        <div class="form-group member-company-group" data-member-id="${memberId}" style="display: none;">
            <label>Empresa *</label>
            <input type="text" class="member-company-input" placeholder="Nome da empresa">
            <small>Informe o nome da empresa do profissional PJ</small>
        </div>
        <div class="form-group">
            <label>Cargo *</label>
            <input type="text" class="member-role-input member-role-text-input" placeholder="Ex: Desenvolvedor" required>
            <select class="member-role-input member-role-select-input member-role-select-company" style="display: none;" required>
                <option value="">Selecione o cargo...</option>
            </select>
            <select class="member-role-input member-role-select-input member-role-select-prodesp" style="display: none;" required>
                <option value="">Selecione o cargo...</option>
            </select>
        </div>
        <div class="form-group">
            <label>E-mail *</label>
            <input type="email" class="member-email-input" placeholder="email@exemplo.com" required>
        </div>
    `;
    membersList.appendChild(memberField);
    
    // Popular select de empresas prestadoras
    updateCompanyProviderSelect(memberId);
}

// Remover campo de membro
window.removeMemberField = function(memberId) {
    const memberField = document.querySelector(`[data-member-id="${memberId}"]`);
    if (memberField) {
        memberField.remove();
    }
};

// Salvar squad
async function handleSaveSquad(e) {
    e.preventDefault();
    
    const name = document.getElementById('squad-name').value.trim();
    if (!name) {
        alert('Por favor, informe o nome da squad.');
        return;
    }
    
    // Coletar dados de todos os membros
    const memberFields = document.querySelectorAll('.member-field');
    const members = [];
    
    memberFields.forEach(field => {
        const name = field.querySelector('.member-name-input')?.value.trim();
        const contract = field.querySelector('.member-contract-input')?.value;
        const email = field.querySelector('.member-email-input')?.value.trim();
        const companyProviderId = field.querySelector('.member-company-provider-input')?.value;
        const company = field.querySelector('.member-company-input')?.value.trim();
        
        // Ler área Prodesp do input ou select dependendo do tipo de contrato
        let prodespArea = '';
        let prodespAreaId = null;
        if (contract === 'CLT') {
            const areaSelect = field.querySelector('.member-prodesp-area-select-input');
            prodespAreaId = areaSelect ? areaSelect.value : '';
            if (prodespAreaId) {
                const area = state.companies.find(c => c.id === prodespAreaId && c.isProdespArea === true);
                prodespArea = area ? area.name : '';
            }
        } else if (contract === 'Estagiário') {
            const areaInput = field.querySelector('.member-prodesp-area-text-input');
            prodespArea = areaInput ? areaInput.value.trim() : '';
        }
        
        // Ler cargo do input ou select dependendo do tipo de contrato
        let role = '';
        if (contract === 'Terceirizado') {
            const roleSelect = field.querySelector('.member-role-select-company');
            role = roleSelect ? roleSelect.value.trim() : '';
        } else if (contract === 'CLT') {
            const roleSelect = field.querySelector('.member-role-select-prodesp');
            role = roleSelect ? roleSelect.value.trim() : '';
        } else {
            const roleInput = field.querySelector('.member-role-text-input');
            role = roleInput ? roleInput.value.trim() : '';
        }
        
        // Validações básicas
        if (!name || !role || !contract || !email) {
            return; // Pula este membro se campos básicos não estiverem preenchidos
        }
        
        // Validações condicionais baseadas no tipo de contrato
        if (contract === 'Terceirizado' && !companyProviderId) {
            alert('Para profissionais terceirizados, é obrigatório selecionar uma empresa prestadora de serviço.');
            return;
        }
        
        if (contract === 'CLT' && !prodespAreaId) {
            alert('Para profissionais CLT, é obrigatório selecionar uma Área Prodesp.');
            return;
        }
        
        if (contract === 'Estagiário' && !prodespArea) {
            alert('Para profissionais Estagiários, é obrigatório informar a Área Prodesp.');
            return;
        }
        
        if (contract === 'PJ' && !company) {
            alert('Para profissionais PJ, é obrigatório informar a Empresa.');
            return;
        }
        
        const member = {
            id: generateId(),
            name: name,
            role: role,
            contract: contract,
            email: email
        };
        
        // Adicionar campos específicos baseados no tipo de contrato
        if (contract === 'Terceirizado' && companyProviderId) {
            member.companyProviderId = companyProviderId;
        } else if (contract === 'CLT' && prodespAreaId) {
            member.prodespAreaId = prodespAreaId;
            member.prodespArea = prodespArea;
        } else if (contract === 'Estagiário') {
            member.prodespArea = prodespArea;
        } else if (contract === 'PJ') {
            member.company = company;
        }
        
        members.push(member);
    });
    
    if (members.length === 0) {
        alert('Por favor, adicione pelo menos um membro completo à squad.');
        return;
    }
    
    const form = document.getElementById('squad-form');
    const editingSquadId = form.dataset.editingSquadId;
    
    let shouldCreateNewSquad = true;
    
    if (editingSquadId) {
        // Modo edição - atualizar squad existente, se ainda estiver em memória
        const squadIndex = state.squads.findIndex(s => s.id === editingSquadId);
        if (squadIndex !== -1) {
            const existingSquad = state.squads[squadIndex];
            state.squads[squadIndex] = {
                ...existingSquad,
                name: name,
                members: members
            };
            shouldCreateNewSquad = false;
        } else {
            // Se o ID de edição não existir mais, trata como criação de nova squad
            form.dataset.editingSquadId = '';
        }
    }
    
    if (shouldCreateNewSquad) {
        // Modo criação - criar nova squad
        const squad = {
            id: 'temp-' + generateId(), // ID temporário para Supabase gerar o UUID
            name: name,
            members: members,
            createdAt: new Date().toISOString()
        };
        
        state.squads.push(squad);
    }
    
    // Salvar no Supabase (se disponível) ou localStorage
    const squadToSave = state.squads.find(s => 
        shouldCreateNewSquad ? s.id.startsWith('temp-') : s.id === editingSquadId
    );
    
    if (squadToSave && typeof saveSquad === 'function') {
        try {
            const savedSquad = await saveSquad(squadToSave);
            // Atualizar com o ID real do Supabase
            if (shouldCreateNewSquad && savedSquad.id) {
                const index = state.squads.findIndex(s => s.id === squadToSave.id);
                if (index !== -1) {
                    state.squads[index] = savedSquad;
                }
            }
        } catch (error) {
            console.error('Erro ao salvar squad no Supabase:', error);
        }
    }
    
    saveData();
    closeSquadModal();
    updateSquadSelect();
    
    // Renderizar squads se estiver na view de squads
    if (state.currentView === 'squads') {
        renderSquads();
    }
}

// Atualizar select de responsável com membros da squad do projeto
function updateAssigneeSelect() {
    const assigneeSelect = document.getElementById('issue-assignee');
    const editAssigneeSelect = document.getElementById('edit-issue-assignee');
    
    if (!state.currentProject) {
        // Se não há projeto, limpar selects
        if (assigneeSelect) {
            assigneeSelect.innerHTML = '<option value="">Selecione um responsável</option>';
        }
        if (editAssigneeSelect) {
            editAssigneeSelect.innerHTML = '<option value="">Selecione um responsável</option>';
        }
        return;
    }
    
    // Verificar se o projeto tem squadId (pode ser squad_id do banco ou squadId mapeado)
    const squadId = state.currentProject.squadId || state.currentProject.squad_id;
    
    if (!squadId) {
        // Se não há squad, limpar selects
        if (assigneeSelect) {
            assigneeSelect.innerHTML = '<option value="">Nenhuma squad associada ao projeto</option>';
        }
        if (editAssigneeSelect) {
            editAssigneeSelect.innerHTML = '<option value="">Nenhuma squad associada ao projeto</option>';
        }
        return;
    }
    
    const squad = state.squads.find(s => s.id === squadId);
    if (!squad) {
        // Squad não encontrada
        if (assigneeSelect) {
            assigneeSelect.innerHTML = '<option value="">Squad não encontrada</option>';
        }
        if (editAssigneeSelect) {
            editAssigneeSelect.innerHTML = '<option value="">Squad não encontrada</option>';
        }
        return;
    }
    
    if (!squad.members || squad.members.length === 0) {
        // Squad sem membros
        if (assigneeSelect) {
            assigneeSelect.innerHTML = '<option value="">Nenhum membro cadastrado na squad</option>';
        }
        if (editAssigneeSelect) {
            editAssigneeSelect.innerHTML = '<option value="">Nenhum membro cadastrado na squad</option>';
        }
        return;
    }
    
    const options = '<option value="">Selecione um responsável</option>' +
        squad.members.map(member => {
            // Compatibilidade: member pode ser string (antigo) ou objeto (novo)
            if (typeof member === 'string') {
                return `<option value="${escapeHtml(member)}">${escapeHtml(member)}</option>`;
            } else {
                return `<option value="${escapeHtml(member.name)}">${escapeHtml(member.name)}${member.role ? ' - ' + escapeHtml(member.role) : ''}</option>`;
            }
        }).join('');
    
    if (assigneeSelect) {
        assigneeSelect.innerHTML = options;
    }
    if (editAssigneeSelect) {
        editAssigneeSelect.innerHTML = options;
    }
}

// Renderizar squads
function renderSquads() {
    const squadsList = document.getElementById('squads-list');
    if (!squadsList) return;
    
    if (state.squads.length === 0) {
        squadsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>Nenhuma squad cadastrada</h3>
                <p>Crie sua primeira squad para começar a organizar os times</p>
            </div>
        `;
        return;
    }
    
    squadsList.innerHTML = state.squads.map(squad => {
        const projectsUsingSquad = state.projects.filter(p => p.squadId === squad.id);
        
        return `
            <div class="squad-card" style="border: 1px solid var(--border-color); border-radius: 8px; padding: 20px; margin-bottom: 16px; background: var(--bg-secondary);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
                    <div>
                        <h3 style="margin: 0 0 8px 0;">${escapeHtml(squad.name)}</h3>
                        <p style="margin: 0; color: var(--text-secondary); font-size: 14px;">
                            ${squad.members.length} membro(s) • ${projectsUsingSquad.length} projeto(s) vinculado(s)
                        </p>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-primary btn-sm" onclick="editSquad('${squad.id}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteSquad('${squad.id}')">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    </div>
                </div>
                <div style="margin-top: 16px;">
                    <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">Membros:</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px;">
                        ${squad.members.map(member => {
                            let contractSpecificInfo = '';
                            
                            // Informação específica baseada no tipo de contrato
                            if (member.contract === 'Terceirizado' && member.companyProviderId) {
                                const company = state.companies.find(c => c.id === member.companyProviderId);
                                if (company) {
                                    contractSpecificInfo = `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border-color);">
                                        <div style="font-size: 11px; color: var(--primary-color); font-weight: 600;">
                                            <i class="fas fa-handshake"></i> Empresa Prestadora:
                                        </div>
                                        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                                            ${escapeHtml(company.name)} (${escapeHtml(company.contractCode)})
                                        </div>
                                    </div>`;
                                }
                            } else if (member.contract === 'CLT' && member.prodespAreaId) {
                                const area = state.companies.find(c => c.id === member.prodespAreaId && c.isProdespArea === true);
                                const areaName = area ? area.name : (member.prodespArea || 'N/A');
                                contractSpecificInfo = `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border-color);">
                                    <div style="font-size: 11px; color: var(--primary-color); font-weight: 600;">
                                        <i class="fas fa-sitemap"></i> Área Prodesp:
                                    </div>
                                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                                        ${escapeHtml(areaName)}
                                    </div>
                                </div>`;
                            } else if (member.contract === 'Estagiário' && member.prodespArea) {
                                contractSpecificInfo = `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border-color);">
                                    <div style="font-size: 11px; color: var(--primary-color); font-weight: 600;">
                                        <i class="fas fa-sitemap"></i> Área Prodesp:
                                    </div>
                                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                                        ${escapeHtml(member.prodespArea)}
                                    </div>
                                </div>`;
                            } else if (member.contract === 'PJ' && member.company) {
                                contractSpecificInfo = `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border-color);">
                                    <div style="font-size: 11px; color: var(--primary-color); font-weight: 600;">
                                        <i class="fas fa-building"></i> Empresa:
                                    </div>
                                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                                        ${escapeHtml(member.company)}
                                    </div>
                                </div>`;
                            }
                            
                            return `
                                <div style="border: 1px solid var(--border-color); border-radius: 6px; padding: 12px; background: var(--bg-primary);">
                                    <div style="font-weight: 600; margin-bottom: 4px;">${escapeHtml(member.name)}</div>
                                    <div style="font-size: 12px; color: var(--text-secondary);">
                                        <div><i class="fas fa-briefcase"></i> ${escapeHtml(member.role)}</div>
                                        <div><i class="fas fa-file-contract"></i> ${escapeHtml(member.contract)}</div>
                                        <div><i class="fas fa-envelope"></i> ${escapeHtml(member.email)}</div>
                                    </div>
                                    ${contractSpecificInfo}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Deletar squad
window.deleteSquad = async function(squadId) {
    const squad = state.squads.find(s => s.id === squadId);
    if (!squad) return;
    
    // Verificar se há projetos usando esta squad
    const projectsUsingSquad = state.projects.filter(p => p.squadId === squadId);
    if (projectsUsingSquad.length > 0) {
        if (!confirm(`Esta squad está sendo usada por ${projectsUsingSquad.length} projeto(s). Ao excluir, os projetos ficarão sem squad. Deseja continuar?`)) {
            return;
        }
        // Remover squadId dos projetos
        projectsUsingSquad.forEach(project => {
            project.squadId = null;
        });
    }
    
    if (!confirm('Tem certeza que deseja excluir esta squad?')) {
        return;
    }
    
    // Deletar do Supabase (se disponível)
    if (typeof isSupabaseAvailable === 'function' && isSupabaseAvailable()) {
        try {
            const { error } = await supabaseClient
                .from('squads')
                .delete()
                .eq('id', squadId);
            
            if (error) throw error;
            console.log('✅ Squad deletada do Supabase');
        } catch (error) {
            console.error('Erro ao deletar squad no Supabase:', error);
        }
    }
    
    state.squads = state.squads.filter(s => s.id !== squadId);
    saveData();
    renderSquads();
    updateSquadSelect();
};

// ==================== GERENCIAMENTO DE EMPRESAS PRESTADORAS ====================

// Calcular resumo financeiro
function calculateFinancialSummary() {
    let totalHours = 0;
    let totalValue = 0;
    const companyStats = {};
    
    // Inicializar estatísticas por empresa/área
    state.companies.forEach(company => {
        companyStats[company.id] = {
            hours: 0,
            value: 0,
            name: company.name
        };
    });
    
    // Percorrer todas as issues e suas atividades
    state.issues.forEach(issue => {
        if (!issue.activities || issue.activities.length === 0) return;
        if (!issue.assignee) return;
        
        const project = state.projects.find(p => p.id === issue.projectId);
        if (!project || !project.squadId) return;
        
        const squad = state.squads.find(s => s.id === project.squadId);
        if (!squad) return;
        
        const member = squad.members.find(m => m.name === issue.assignee);
        if (!member) return;
        
        let companyId = null;
        if (member.contract === 'Terceirizado' && member.companyProviderId) {
            companyId = member.companyProviderId;
        } else if (member.contract === 'CLT' && member.prodespAreaId) {
            companyId = member.prodespAreaId;
        }
        
        if (!companyId) return;
        
        // Somar horas e valores das atividades
        issue.activities.forEach(activity => {
            const hours = activity.hours || 0;
            const value = activity.value || 0;
            
            totalHours += hours;
            totalValue += value;
            
            if (companyStats[companyId]) {
                companyStats[companyId].hours += hours;
                companyStats[companyId].value += value;
            }
        });
    });
    
    return {
        totalHours,
        totalValue,
        companyStats
    };
}

// Toggle campos condicionais baseado no tipo de contrato
window.toggleContractFields = function(memberId, contractValue) {
    const companyProviderGroup = document.querySelector(`.member-company-provider-group[data-member-id="${memberId}"]`);
    const prodespAreaGroup = document.querySelector(`.member-prodesp-area-group[data-member-id="${memberId}"]`);
    const companyGroup = document.querySelector(`.member-company-group[data-member-id="${memberId}"]`);
    
    // Ocultar todos os campos primeiro
    [companyProviderGroup, prodespAreaGroup, companyGroup].forEach(group => {
        if (group) {
            group.style.display = 'none';
            const inputs = group.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.required = false;
                if (input.type !== 'hidden') input.value = '';
            });
        }
    });
    
    // Alternar campo de cargo e área baseado no contrato
    const memberField = document.querySelector(`.member-field[data-member-id="${memberId}"]`);
    if (memberField) {
        const roleTextInput = memberField.querySelector('.member-role-text-input');
        const roleSelectCompany = memberField.querySelector('.member-role-select-company');
        const roleSelectProdesp = memberField.querySelector('.member-role-select-prodesp');
        
        // Ocultar todos os campos de cargo primeiro
        if (roleTextInput) {
            roleTextInput.style.display = 'none';
            roleTextInput.required = false;
            roleTextInput.value = '';
        }
        if (roleSelectCompany) {
            roleSelectCompany.style.display = 'none';
            roleSelectCompany.required = false;
            roleSelectCompany.value = '';
            roleSelectCompany.innerHTML = '<option value="">Selecione o cargo...</option>';
        }
        if (roleSelectProdesp) {
            roleSelectProdesp.style.display = 'none';
            roleSelectProdesp.required = false;
            roleSelectProdesp.value = '';
            roleSelectProdesp.innerHTML = '<option value="">Selecione o cargo...</option>';
        }
        
        // Gerenciar campos de área Prodesp
        if (prodespAreaGroup) {
            const areaTextInput = prodespAreaGroup.querySelector('.member-prodesp-area-text-input');
            const areaSelectInput = prodespAreaGroup.querySelector('.member-prodesp-area-select-input');
            const areaTextSmall = prodespAreaGroup.querySelector('.member-prodesp-area-text-small');
            const areaSelectSmall = prodespAreaGroup.querySelector('.member-prodesp-area-select-small');
            
            if (contractValue === 'CLT') {
                // CLT: mostrar select de área
                if (areaTextInput) {
                    areaTextInput.style.display = 'none';
                    areaTextInput.required = false;
                    areaTextInput.value = '';
                }
                if (areaSelectInput) {
                    areaSelectInput.style.display = 'block';
                    areaSelectInput.required = true;
                    updateProdespAreaSelect(memberId);
                }
                if (areaTextSmall) areaTextSmall.style.display = 'none';
                if (areaSelectSmall) areaSelectSmall.style.display = 'block';
                
                // Mostrar select de cargo Prodesp
                if (roleSelectProdesp) {
                    roleSelectProdesp.style.display = 'block';
                    roleSelectProdesp.required = true;
                }
            } else if (contractValue === 'Estagiário') {
                // Estagiário: mostrar input de área
                if (areaTextInput) {
                    areaTextInput.style.display = 'block';
                    areaTextInput.required = true;
                }
                if (areaSelectInput) {
                    areaSelectInput.style.display = 'none';
                    areaSelectInput.required = false;
                    areaSelectInput.value = '';
                }
                if (areaTextSmall) areaTextSmall.style.display = 'block';
                if (areaSelectSmall) areaSelectSmall.style.display = 'none';
                
                // Mostrar input de cargo
                if (roleTextInput) {
                    roleTextInput.style.display = 'block';
                    roleTextInput.required = true;
                }
            } else {
                // Outros contratos: ocultar tudo
                if (areaTextInput) {
                    areaTextInput.style.display = 'none';
                    areaTextInput.required = false;
                    areaTextInput.value = '';
                }
                if (areaSelectInput) {
                    areaSelectInput.style.display = 'none';
                    areaSelectInput.required = false;
                    areaSelectInput.value = '';
                }
            }
        }
        
        // Gerenciar campos de cargo para Terceirizado
        if (contractValue === 'Terceirizado') {
            if (roleSelectCompany) {
                roleSelectCompany.style.display = 'block';
                roleSelectCompany.required = true;
            }
        } else if (contractValue === 'PJ') {
            if (roleTextInput) {
                roleTextInput.style.display = 'block';
                roleTextInput.required = true;
            }
        }
    }
    
    // Mostrar campo apropriado baseado no contrato
    if (contractValue === 'Terceirizado') {
        if (companyProviderGroup) {
            companyProviderGroup.style.display = 'block';
            const select = companyProviderGroup.querySelector('.member-company-provider-input');
            if (select) {
                select.required = true;
                updateCompanyProviderSelect(memberId);
            }
        }
    } else if (contractValue === 'CLT' || contractValue === 'Estagiário') {
        if (prodespAreaGroup) {
            prodespAreaGroup.style.display = 'block';
        }
    } else if (contractValue === 'PJ') {
        if (companyGroup) {
            companyGroup.style.display = 'block';
            const input = companyGroup.querySelector('.member-company-input');
            if (input) input.required = true;
        }
    }
};

// Atualizar select de empresas prestadoras
function updateCompanyProviderSelect(memberId) {
    const companyGroup = document.querySelector(`.member-company-provider-group[data-member-id="${memberId}"]`);
    if (!companyGroup) return;
    
    const select = companyGroup.querySelector('.member-company-provider-input');
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecione uma empresa...</option>' +
        state.companies.map(company => {
            const label = company.isProdespArea 
                ? `${escapeHtml(company.name)} (Área Prodesp)`
                : escapeHtml(company.name);
            return `<option value="${company.id}">${label}</option>`;
        }).join('');
}

// Atualizar select de cargo com tipos de profissionais da empresa
window.updateRoleSelectForCompany = function(memberId, companyId) {
    const memberField = document.querySelector(`.member-field[data-member-id="${memberId}"]`);
    if (!memberField) return;
    
    const roleSelectInput = memberField.querySelector('.member-role-select-company');
    if (!roleSelectInput) return;
    
    if (!companyId) {
        roleSelectInput.innerHTML = '<option value="">Selecione o cargo...</option>';
        roleSelectInput.value = '';
        return;
    }
    
    const company = state.companies.find(c => c.id === companyId);
    if (!company || !company.professionalTypes || company.professionalTypes.length === 0) {
        roleSelectInput.innerHTML = '<option value="">Nenhum tipo de profissional cadastrado</option>';
        roleSelectInput.value = '';
        return;
    }
    
    roleSelectInput.innerHTML = '<option value="">Selecione o cargo...</option>' +
        company.professionalTypes.map(type => 
            `<option value="${escapeHtml(type.name)}">${escapeHtml(type.name)}</option>`
        ).join('');
    
    roleSelectInput.value = '';
}

// Atualizar select de áreas Prodesp
function updateProdespAreaSelect(memberId) {
    const prodespAreaGroup = document.querySelector(`.member-prodesp-area-group[data-member-id="${memberId}"]`);
    if (!prodespAreaGroup) return;
    
    const select = prodespAreaGroup.querySelector('.member-prodesp-area-select-input');
    if (!select) return;
    
    // Filtrar apenas áreas Prodesp (isProdespArea === true)
    const prodespAreas = state.companies.filter(c => c.isProdespArea === true);
    
    select.innerHTML = '<option value="">Selecione a área...</option>' +
        prodespAreas.map(area => 
            `<option value="${area.id}">${escapeHtml(area.name)}</option>`
        ).join('');
}

// Atualizar select de cargo com tipos de profissionais da área Prodesp
window.updateRoleSelectForProdespArea = function(memberId, areaId) {
    const memberField = document.querySelector(`.member-field[data-member-id="${memberId}"]`);
    if (!memberField) return;
    
    const roleSelectInput = memberField.querySelector('.member-role-select-prodesp');
    if (!roleSelectInput) return;
    
    if (!areaId) {
        roleSelectInput.innerHTML = '<option value="">Selecione o cargo...</option>';
        roleSelectInput.value = '';
        return;
    }
    
    const area = state.companies.find(c => c.id === areaId && c.isProdespArea === true);
    if (!area || !area.professionalTypes || area.professionalTypes.length === 0) {
        roleSelectInput.innerHTML = '<option value="">Nenhum tipo de profissional cadastrado</option>';
        roleSelectInput.value = '';
        return;
    }
    
    roleSelectInput.innerHTML = '<option value="">Selecione o cargo...</option>' +
        area.professionalTypes.map(type => 
            `<option value="${escapeHtml(type.name)}">${escapeHtml(type.name)}</option>`
        ).join('');
    
    roleSelectInput.value = '';
}

// Toggle campos do formulário de empresa/área prodesp
window.toggleCompanyFormFields = function() {
    const isProdespArea = document.getElementById('company-is-prodesp-area').checked;
    const companyFieldsGroup = document.getElementById('company-fields-group');
    const prodespFieldsGroup = document.getElementById('prodesp-area-fields-group');
    
    if (isProdespArea) {
        // Mostrar campos de Área Prodesp
        if (companyFieldsGroup) companyFieldsGroup.style.display = 'none';
        if (prodespFieldsGroup) prodespFieldsGroup.style.display = 'block';
        
        // Limpar e tornar campos de empresa não obrigatórios
        const companyName = document.getElementById('company-name');
        const contractCode = document.getElementById('company-contract-code');
        const contractValue = document.getElementById('company-contract-value');
        if (companyName) {
            companyName.required = false;
            companyName.value = '';
        }
        if (contractCode) {
            contractCode.required = false;
            contractCode.value = '';
        }
        if (contractValue) {
            contractValue.required = false;
            contractValue.value = '';
        }
        
        // Tornar campos de área prodesp obrigatórios
        const areaName = document.getElementById('prodesp-area-name');
        const service = document.getElementById('prodesp-service');
        if (areaName) areaName.required = true;
        if (service) service.required = true;
    } else {
        // Mostrar campos de Empresa
        if (companyFieldsGroup) companyFieldsGroup.style.display = 'block';
        if (prodespFieldsGroup) prodespFieldsGroup.style.display = 'none';
        
        // Tornar campos de empresa obrigatórios
        const companyName = document.getElementById('company-name');
        const contractCode = document.getElementById('company-contract-code');
        const contractValue = document.getElementById('company-contract-value');
        if (companyName) companyName.required = true;
        if (contractCode) contractCode.required = true;
        if (contractValue) contractValue.required = true;
        
        // Limpar e tornar campos de área prodesp não obrigatórios
        const areaName = document.getElementById('prodesp-area-name');
        const service = document.getElementById('prodesp-service');
        if (areaName) {
            areaName.required = false;
            areaName.value = '';
        }
        if (service) {
            service.required = false;
            service.value = '';
        }
    }
};

// Abrir modal de empresa (para criar ou editar)
function openCompanyModal(companyId = null) {
    const modal = document.getElementById('company-modal');
    const form = document.getElementById('company-form');
    const modalTitle = modal.querySelector('h2');
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Armazenar ID da empresa sendo editada
    form.dataset.editingCompanyId = companyId || '';
    
    modal.classList.add('active');
    form.reset();
    document.getElementById('company-professionals-list').innerHTML = '';
    
    if (companyId) {
        // Modo edição
        const company = state.companies.find(c => c.id === companyId);
        if (!company) return;
        
        modalTitle.textContent = 'Editar Empresa Prestadora';
        submitButton.textContent = 'Salvar Alterações';
        
        // Preencher campos
        const isProdespArea = company.isProdespArea === true;
        document.getElementById('company-is-prodesp-area').checked = isProdespArea;
        toggleCompanyFormFields();
        
        if (isProdespArea) {
            document.getElementById('prodesp-area-name').value = company.areaName || company.name;
            document.getElementById('prodesp-service').value = company.service || company.contractCode;
        } else {
            document.getElementById('company-name').value = company.name;
            document.getElementById('company-contract-code').value = company.contractCode;
            document.getElementById('company-contract-value').value = company.contractValue;
        }
        
        document.getElementById('company-contract-start').value = company.contractStart;
        document.getElementById('company-contract-end').value = company.contractEnd;
        
        // Adicionar tipos de profissionais
        company.professionalTypes.forEach(type => {
            addProfessionalTypeField();
            const fields = document.querySelectorAll('.professional-type-field');
            const lastField = fields[fields.length - 1];
            if (lastField) {
                lastField.querySelector('.professional-type-name-input').value = type.name;
                lastField.querySelector('.professional-type-value-input').value = type.valuePerHour;
            }
        });
    } else {
        // Modo criação
        modalTitle.textContent = 'Cadastrar Empresa Prestadora';
        submitButton.textContent = 'Cadastrar Empresa';
        document.getElementById('company-is-prodesp-area').checked = false;
        toggleCompanyFormFields();
        addProfessionalTypeField(); // Adicionar primeiro campo de tipo de profissional
    }
}

// Fechar modal de empresa
function closeCompanyModal() {
    const modal = document.getElementById('company-modal');
    const form = document.getElementById('company-form');
    modal.classList.remove('active');
    form.dataset.editingCompanyId = '';
}

// Editar empresa
window.editCompany = function(companyId) {
    openCompanyModal(companyId);
};

// Adicionar campo de tipo de profissional
function addProfessionalTypeField() {
    const professionalsList = document.getElementById('company-professionals-list');
    if (!professionalsList) return;
    
    const typeId = generateId();
    const typeField = document.createElement('div');
    typeField.className = 'professional-type-field';
    typeField.dataset.typeId = typeId;
    typeField.style.cssText = 'display: flex; gap: 8px; margin-bottom: 8px; align-items: flex-end;';
    typeField.innerHTML = `
        <div class="form-group" style="flex: 1;">
            <label>Tipo de Profissional *</label>
            <input type="text" class="professional-type-name-input" placeholder="Ex: Desenvolvedor Senior" required>
        </div>
        <div class="form-group" style="flex: 1;">
            <label>Valor Hora (R$) *</label>
            <input type="number" class="professional-type-value-input" step="0.01" min="0" placeholder="0.00" required>
        </div>
        <button type="button" class="btn btn-danger btn-sm" onclick="removeProfessionalTypeField('${typeId}')">
            <i class="fas fa-times"></i>
        </button>
    `;
    professionalsList.appendChild(typeField);
}

// Remover campo de tipo de profissional
window.removeProfessionalTypeField = function(typeId) {
    const typeField = document.querySelector(`.professional-type-field[data-type-id="${typeId}"]`);
    if (typeField) {
        typeField.remove();
    }
};

// Salvar empresa
async function handleSaveCompany(e) {
    e.preventDefault();
    
    const isProdespArea = document.getElementById('company-is-prodesp-area').checked;
    const contractStart = document.getElementById('company-contract-start').value;
    const contractEnd = document.getElementById('company-contract-end').value;
    
    let name, contractCode, contractValue, areaName, service;
    
    if (isProdespArea) {
        // Validação para Área Prodesp
        areaName = document.getElementById('prodesp-area-name').value.trim();
        service = document.getElementById('prodesp-service').value.trim();
        
        if (!areaName || !service || !contractStart || !contractEnd) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
        
        name = areaName;
        contractCode = service;
        contractValue = 0; // Área Prodesp não tem valor de contrato
    } else {
        // Validação para Empresa Prestadora
        name = document.getElementById('company-name').value.trim();
        contractCode = document.getElementById('company-contract-code').value.trim();
        contractValue = parseFloat(document.getElementById('company-contract-value').value);
        
        if (!name || !contractCode || isNaN(contractValue) || contractValue <= 0 || !contractStart || !contractEnd) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
    }
    
    if (new Date(contractEnd) <= new Date(contractStart)) {
        alert('A data de término deve ser posterior à data de início.');
        return;
    }
    
    // Coletar tipos de profissionais
    const typeFields = document.querySelectorAll('.professional-type-field');
    const professionalTypes = [];
    
    typeFields.forEach(field => {
        const typeName = field.querySelector('.professional-type-name-input')?.value.trim();
        const typeValue = parseFloat(field.querySelector('.professional-type-value-input')?.value);
        
        if (typeName && !isNaN(typeValue) && typeValue > 0) {
            professionalTypes.push({
                id: generateId(),
                name: typeName,
                valuePerHour: typeValue
            });
        }
    });
    
    if (professionalTypes.length === 0) {
        alert('Por favor, adicione pelo menos um tipo de profissional com valor hora.');
        return;
    }
    
    const form = document.getElementById('company-form');
    const editingCompanyId = form.dataset.editingCompanyId;
    
    let shouldCreateNewCompany = true;
    
    if (editingCompanyId) {
        // Modo edição - atualizar empresa existente, se ainda estiver em memória
        const companyIndex = state.companies.findIndex(c => c.id === editingCompanyId);
        if (companyIndex !== -1) {
            const existingCompany = state.companies[companyIndex];
            state.companies[companyIndex] = {
                ...existingCompany,
                name: name,
                contractCode: contractCode,
                contractValue: contractValue,
                contractStart: contractStart,
                contractEnd: contractEnd,
                professionalTypes: professionalTypes,
                isProdespArea: isProdespArea
            };
            
            if (isProdespArea) {
                state.companies[companyIndex].areaName = areaName;
                state.companies[companyIndex].service = service;
            } else {
                // Remover campos de área prodesp se não for mais área
                delete state.companies[companyIndex].areaName;
                delete state.companies[companyIndex].service;
            }
            
            shouldCreateNewCompany = false;
        } else {
            // Se o ID de edição não existir mais, trata como criação de nova empresa
            form.dataset.editingCompanyId = '';
        }
    }
    
    // Preparar company para salvar (tanto criação quanto edição)
    let companyToSave = null;
    if (shouldCreateNewCompany) {
        // Será criado abaixo
    } else if (editingCompanyId) {
        companyToSave = state.companies.find(c => c.id === editingCompanyId);
    }
    
    if (shouldCreateNewCompany) {
        // Modo criação - criar nova empresa
        const company = {
            id: 'temp-' + generateId(), // ID temporário para Supabase gerar o UUID
            name: name,
            contractCode: contractCode,
            contractValue: contractValue,
            contractStart: contractStart,
            contractEnd: contractEnd,
            professionalTypes: professionalTypes,
            isProdespArea: isProdespArea,
            createdAt: new Date().toISOString()
        };
        
        if (isProdespArea) {
            company.areaName = areaName;
            company.service = service;
        }
        
        state.companies.push(company);
    }
    
    // Salvar no Supabase (se disponível) ou localStorage
    if (!companyToSave && shouldCreateNewCompany) {
        // Buscar a company que acabou de ser criada
        companyToSave = state.companies.find(c => c.id.startsWith('temp-'));
    }
    
    if (companyToSave && typeof saveCompany === 'function') {
        try {
            const savedCompany = await saveCompany(companyToSave);
            // Atualizar com o ID real do Supabase (se for criação)
            if (shouldCreateNewCompany && savedCompany.id) {
                const index = state.companies.findIndex(c => c.id === companyToSave.id);
                if (index !== -1) {
                    state.companies[index] = savedCompany;
                }
            } else if (!shouldCreateNewCompany && savedCompany.id) {
                // Atualizar company editada
                const index = state.companies.findIndex(c => c.id === editingCompanyId);
                if (index !== -1) {
                    state.companies[index] = savedCompany;
                }
            }
        } catch (error) {
            console.error('Erro ao salvar company no Supabase:', error);
        }
    }
    
    saveData();
    closeCompanyModal();
    
    // Renderizar empresas se estiver na view de financeiro
    if (state.currentView === 'financeiro') {
        renderCompanies();
    }
    
    // Atualizar todos os selects de empresas prestadoras nos formulários de squad
    document.querySelectorAll('.member-company-provider-input').forEach(select => {
        const memberId = select.closest('.member-company-provider-group')?.dataset.memberId;
        if (memberId) {
            updateCompanyProviderSelect(memberId);
        }
    });
}

// Renderizar empresas
function renderCompanies() {
    const companiesList = document.getElementById('companies-list');
    if (!companiesList) return;
    
    if (state.companies.length === 0) {
        companiesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-building"></i>
                <h3>Nenhuma empresa ou área cadastrada</h3>
                <p>Cadastre empresas prestadoras de serviço ou áreas Prodesp para controlar os custos do projeto</p>
            </div>
        `;
        return;
    }
    
    // A tela de Financeiro agora mostra apenas os dados cadastrais das empresas/áreas.
    companiesList.innerHTML = state.companies.map(company => {
        const startDate = new Date(company.contractStart).toLocaleDateString('pt-BR');
        const endDate = new Date(company.contractEnd).toLocaleDateString('pt-BR');
        const today = new Date();
        const endDateObj = new Date(company.contractEnd);
        const isActive = endDateObj >= today;
        
        // Determinar se é área prodesp ou empresa
        const isProdespArea = company.isProdespArea === true;
        
        let infoLine = '';
        if (isProdespArea) {
            infoLine = `
                <p style="margin: 0; color: var(--text-secondary); font-size: 14px;">
                    <strong>Área:</strong> ${escapeHtml(company.areaName || company.name)} | 
                    <strong>Serviço:</strong> ${escapeHtml(company.service || company.contractCode)}
                </p>
            `;
        } else {
            infoLine = `
                <p style="margin: 0; color: var(--text-secondary); font-size: 14px;">
                    <strong>Código:</strong> ${escapeHtml(company.contractCode)} | 
                    <strong>Valor:</strong> R$ ${company.contractValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
            `;
        }
        
        return `
            <div class="company-card" style="border: 1px solid var(--border-color); border-radius: 8px; padding: 20px; margin-bottom: 16px; background: var(--bg-secondary);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <h3 style="margin: 0;">${escapeHtml(company.name)}</h3>
                            ${isProdespArea ? '<span style="padding: 4px 8px; border-radius: 4px; background: #0052cc; color: white; font-size: 11px; font-weight: 600;">ÁREA PRODESP</span>' : '<span style="padding: 4px 8px; border-radius: 4px; background: #36b37e; color: white; font-size: 11px; font-weight: 600;">EMPRESA</span>'}
                        </div>
                        ${infoLine}
                        <p style="margin: 4px 0 0 0; color: var(--text-secondary); font-size: 14px;">
                            <strong>Período:</strong> ${startDate} até ${endDate}
                            <span style="margin-left: 12px; padding: 4px 8px; border-radius: 4px; background: ${isActive ? '#36b37e' : '#ff5630'}; color: white; font-size: 12px;">
                                ${isActive ? 'Ativo' : 'Encerrado'}
                            </span>
                        </p>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-primary btn-sm" onclick="editCompany('${company.id}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteCompany('${company.id}')">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    </div>
                </div>
                <div style="margin-top: 16px;">
                    <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">Tipos de Profissionais e Valores Hora:</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px;">
                        ${company.professionalTypes.map(type => `
                            <div style="border: 1px solid var(--border-color); border-radius: 6px; padding: 12px; background: var(--bg-primary);">
                                <div style="font-weight: 600; margin-bottom: 4px;">${escapeHtml(type.name)}</div>
                                <div style="font-size: 14px; color: var(--primary-color); font-weight: 600;">
                                    R$ ${type.valuePerHour.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/hora
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Deletar empresa
window.deleteCompany = async function(companyId) {
    const company = state.companies.find(c => c.id === companyId);
    if (!company) return;
    
    // Verificar se há membros terceirizados usando esta empresa
    let membersUsingCompany = 0;
    state.squads.forEach(squad => {
        squad.members.forEach(member => {
            if (member.companyProviderId === companyId) {
                membersUsingCompany++;
            }
        });
    });
    
    if (membersUsingCompany > 0) {
        if (!confirm(`Esta empresa está sendo usada por ${membersUsingCompany} profissional(is) terceirizado(s). Ao excluir, esses profissionais ficarão sem empresa prestadora. Deseja continuar?`)) {
            return;
        }
        // Remover companyProviderId dos membros
        state.squads.forEach(squad => {
            squad.members.forEach(member => {
                if (member.companyProviderId === companyId) {
                    delete member.companyProviderId;
                }
            });
        });
    }
    
    if (!confirm('Tem certeza que deseja excluir esta empresa?')) {
        return;
    }
    
    // Deletar do Supabase (se disponível)
    if (typeof isSupabaseAvailable === 'function' && isSupabaseAvailable()) {
        try {
            const { error } = await supabaseClient
                .from('companies')
                .delete()
                .eq('id', companyId);
            
            if (error) throw error;
            console.log('✅ Empresa deletada do Supabase');
        } catch (error) {
            console.error('Erro ao deletar company no Supabase:', error);
        }
    }
    
    state.companies = state.companies.filter(c => c.id !== companyId);
    saveData();
    renderCompanies();
    
    // Atualizar todos os selects de empresas prestadoras
    document.querySelectorAll('.member-company-provider-input').forEach(select => {
        const memberId = select.closest('.member-company-provider-group')?.dataset.memberId;
        if (memberId) {
            updateCompanyProviderSelect(memberId);
        }
    });
};
