// Serviço de integração com Supabase
// Este arquivo contém todas as funções para interagir com o banco de dados

let supabaseClient = null;

// Inicializar cliente Supabase
function initSupabase() {
    if (typeof supabase === 'undefined') {
        console.error('❌ Biblioteca do Supabase não foi carregada. Verifique se o script está incluído no HTML.');
        return null;
    }

    if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
        console.warn('⚠️ Credenciais do Supabase não configuradas. Usando localStorage como fallback.');
        return null;
    }

    try {
        supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        console.log('✅ Supabase inicializado com sucesso');
        return supabaseClient;
    } catch (error) {
        console.error('❌ Erro ao inicializar Supabase:', error);
        return null;
    }
}

// Verificar se Supabase está disponível
function isSupabaseAvailable() {
    return supabaseClient !== null;
}

// ==================== SQUADS ====================

async function loadSquads() {
    if (!isSupabaseAvailable()) {
        return loadFromLocalStorage('jira-squads', []);
    }

    try {
        const { data, error } = await supabaseClient
            .from('squads')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Erro ao carregar squads:', error);
        return loadFromLocalStorage('jira-squads', []);
    }
}

async function saveSquad(squad) {
    if (!isSupabaseAvailable()) {
        return saveToLocalStorage('jira-squads', squad);
    }

    try {
        if (squad.id && squad.id.startsWith('temp-')) {
            // Nova squad
            const { data, error } = await supabaseClient
                .from('squads')
                .insert([{
                    name: squad.name,
                    members: squad.members
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } else {
            // Atualizar squad existente
            const { data, error } = await supabaseClient
                .from('squads')
                .update({
                    name: squad.name,
                    members: squad.members
                })
                .eq('id', squad.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        }
    } catch (error) {
        console.error('Erro ao salvar squad:', error);
        return saveToLocalStorage('jira-squads', squad);
    }
}

async function deleteSquad(squadId) {
    if (!isSupabaseAvailable()) {
        return deleteFromLocalStorage('jira-squads', squadId);
    }

    try {
        const { error } = await supabaseClient
            .from('squads')
            .delete()
            .eq('id', squadId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Erro ao deletar squad:', error);
        return false;
    }
}

// ==================== PROJECTS ====================

async function loadProjects() {
    if (!isSupabaseAvailable()) {
        return loadFromLocalStorage('jira-projects', []);
    }

    try {
        const { data, error } = await supabaseClient
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(mapProjectFromDB);
    } catch (error) {
        console.error('Erro ao carregar projetos:', error);
        return loadFromLocalStorage('jira-projects', []);
    }
}

function mapProjectFromDB(data) {
    return {
        id: data.id,
        name: data.name,
        key: data.key,
        description: data.description,
        squadId: data.squad_id,
        createdAt: data.created_at
    };
}

async function saveProject(project) {
    if (!isSupabaseAvailable()) {
        return saveToLocalStorage('jira-projects', project);
    }

    try {
        if (project.id && project.id.startsWith('temp-')) {
            // Novo projeto
            const { data, error } = await supabaseClient
                .from('projects')
                .insert([{
                    name: project.name,
                    key: project.key,
                    description: project.description,
                    squad_id: project.squadId
                }])
                .select()
                .single();

            if (error) throw error;
            return { ...data, squadId: data.squad_id };
        } else {
            // Atualizar projeto existente
            const { data, error } = await supabaseClient
                .from('projects')
                .update({
                    name: project.name,
                    key: project.key,
                    description: project.description,
                    squad_id: project.squadId
                })
                .eq('id', project.id)
                .select()
                .single();

            if (error) throw error;
            return { ...data, squadId: data.squad_id };
        }
    } catch (error) {
        console.error('Erro ao salvar projeto:', error);
        return saveToLocalStorage('jira-projects', project);
    }
}

async function deleteProject(projectId) {
    if (!isSupabaseAvailable()) {
        return deleteFromLocalStorage('jira-projects', projectId);
    }

    try {
        const { error } = await supabaseClient
            .from('projects')
            .delete()
            .eq('id', projectId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Erro ao deletar projeto:', error);
        return false;
    }
}

// Excluir sprint
async function deleteSprintById(sprintId) {
    if (!isSupabaseAvailable()) {
        return deleteFromLocalStorage('jira-sprints', sprintId);
    }

    try {
        const { error } = await supabaseClient
            .from('sprints')
            .delete()
            .eq('id', sprintId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Erro ao deletar sprint:', error);
        return false;
    }
}

// ==================== STAGES ====================

async function loadStages(projectId = null) {
    if (!isSupabaseAvailable()) {
        return loadFromLocalStorage('jira-stages', []);
    }

    try {
        let query = supabaseClient
            .from('stages')
            .select('*');

        if (projectId) {
            query = query.eq('project_id', projectId);
        }

        const { data, error } = await query.order('order', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Erro ao carregar stages:', error);
        return loadFromLocalStorage('jira-stages', []);
    }
}

async function saveStage(stage, projectId = null) {
    if (!isSupabaseAvailable()) {
        return saveToLocalStorage('jira-stages', stage);
    }

    try {
        const stageData = {
            id: stage.id,
            name: stage.name,
            key: stage.key,
            color: stage.color,
            order: stage.order || 0,
            project_id: projectId
        };

        const { data, error } = await supabaseClient
            .from('stages')
            .upsert(stageData, { onConflict: 'id' })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao salvar stage:', error);
        return saveToLocalStorage('jira-stages', stage);
    }
}

// ==================== SPRINTS ====================

async function loadSprints(projectId = null) {
    if (!isSupabaseAvailable()) {
        return loadFromLocalStorage('jira-sprints', []);
    }

    try {
        let query = supabaseClient
            .from('sprints')
            .select('*');

        if (projectId) {
            query = query.eq('project_id', projectId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        // Garantir que os campos sejam convertidos para o formato esperado no app
        return (data || []).map(mapSprintFromDB);
    } catch (error) {
        console.error('Erro ao carregar sprints:', error);
        return loadFromLocalStorage('jira-sprints', []);
    }
}

async function saveSprint(sprint) {
    if (!isSupabaseAvailable()) {
        return saveToLocalStorage('jira-sprints', sprint);
    }

    try {
        const sprintData = {
            project_id: sprint.projectId,
            name: sprint.name,
            weeks: sprint.weeks,
            goal: sprint.goal,
            start_date: sprint.startDate,
            end_date: sprint.endDate,
            status: sprint.status || 'planned'
        };

        if (sprint.id && !sprint.id.startsWith('temp-')) {
            // Atualizar
            const { data, error } = await supabaseClient
                .from('sprints')
                .update(sprintData)
                .eq('id', sprint.id)
                .select()
                .single();

            if (error) throw error;
            return mapSprintFromDB(data);
        } else {
            // Inserir
            const { data, error } = await supabaseClient
                .from('sprints')
                .insert([sprintData])
                .select()
                .single();

            if (error) throw error;
            return mapSprintFromDB(data);
        }
    } catch (error) {
        console.error('Erro ao salvar sprint:', error);
        return saveToLocalStorage('jira-sprints', sprint);
    }
}

function mapSprintFromDB(data) {
    return {
        id: data.id,
        projectId: data.project_id,
        name: data.name,
        weeks: data.weeks,
        goal: data.goal,
        startDate: data.start_date,
        endDate: data.end_date,
        status: data.status,
        createdAt: data.created_at
    };
}

// ==================== ISSUES ====================

async function loadIssues(projectId = null) {
    if (!isSupabaseAvailable()) {
        return loadFromLocalStorage('jira-issues', []);
    }

    try {
        let query = supabaseClient
            .from('issues')
            .select('*');

        if (projectId) {
            query = query.eq('project_id', projectId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(mapIssueFromDB);
    } catch (error) {
        console.error('Erro ao carregar issues:', error);
        return loadFromLocalStorage('jira-issues', []);
    }
}

async function saveIssue(issue) {
    if (!isSupabaseAvailable()) {
        return saveToLocalStorage('jira-issues', issue);
    }

    try {
        const issueData = {
            project_id: issue.projectId,
            number: issue.number,
            title: issue.title,
            description: issue.description,
            type: issue.type,
            priority: issue.priority,
            status: issue.status,
            assignee: issue.assignee,
            parent_id: issue.parentId,
            story_points: issue.storyPoints,
            sprint_id: issue.sprintId,
            sprint_order: issue.sprintOrder,
            attachments: issue.attachments || [],
            activities: issue.activities || [],
            start_date: issue.startDate || null,
            completed_date: issue.completedDate || null
        };

        if (issue.id && !issue.id.startsWith('temp-')) {
            // Atualizar
            issueData.updated_at = new Date().toISOString();
            const { data, error } = await supabaseClient
                .from('issues')
                .update(issueData)
                .eq('id', issue.id)
                .select()
                .single();

            if (error) throw error;
            return mapIssueFromDB(data);
        } else {
            // Inserir
            const { data, error } = await supabaseClient
                .from('issues')
                .insert([issueData])
                .select()
                .single();

            if (error) throw error;
            return mapIssueFromDB(data);
        }
    } catch (error) {
        console.error('Erro ao salvar issue:', error);
        return saveToLocalStorage('jira-issues', issue);
    }
}

async function deleteIssue(issueId) {
    if (!isSupabaseAvailable()) {
        return deleteFromLocalStorage('jira-issues', issueId);
    }

    try {
        const { error } = await supabaseClient
            .from('issues')
            .delete()
            .eq('id', issueId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Erro ao deletar issue:', error);
        return false;
    }
}

function mapIssueFromDB(data) {
    return {
        id: data.id,
        projectId: data.project_id,
        number: data.number,
        title: data.title,
        description: data.description,
        type: data.type,
        priority: data.priority,
        status: data.status,
        assignee: data.assignee,
        parentId: data.parent_id,
        storyPoints: data.story_points,
        sprintId: data.sprint_id,
        sprintOrder: data.sprint_order,
        attachments: data.attachments || [],
        activities: data.activities || [],
        startDate: data.start_date || null,
        completedDate: data.completed_date || null,
        createdAt: data.created_at,
        updatedAt: data.updated_at
    };
}

// ==================== COMPANIES ====================

async function loadCompanies() {
    if (!isSupabaseAvailable()) {
        return loadFromLocalStorage('jira-companies', []);
    }

    try {
        const { data, error } = await supabaseClient
            .from('companies')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(mapCompanyFromDB);
    } catch (error) {
        console.error('Erro ao carregar companies:', error);
        return loadFromLocalStorage('jira-companies', []);
    }
}

async function saveCompany(company) {
    if (!isSupabaseAvailable()) {
        return saveToLocalStorage('jira-companies', company);
    }

    try {
        const companyData = {
            name: company.name,
            contract_code: company.contractCode,
            contract_value: company.contractValue,
            contract_start: company.contractStart,
            contract_end: company.contractEnd,
            is_prodesp_area: company.isProdespArea || false,
            area_name: company.areaName,
            service: company.service,
            professional_types: company.professionalTypes || []
        };

        if (company.id && !company.id.startsWith('temp-')) {
            // Atualizar
            const { data, error } = await supabaseClient
                .from('companies')
                .update(companyData)
                .eq('id', company.id)
                .select()
                .single();

            if (error) throw error;
            return mapCompanyFromDB(data);
        } else {
            // Inserir
            const { data, error } = await supabaseClient
                .from('companies')
                .insert([companyData])
                .select()
                .single();

            if (error) throw error;
            return mapCompanyFromDB(data);
        }
    } catch (error) {
        console.error('Erro ao salvar company:', error);
        return saveToLocalStorage('jira-companies', company);
    }
}

async function deleteCompany(companyId) {
    if (!isSupabaseAvailable()) {
        return deleteFromLocalStorage('jira-companies', companyId);
    }

    try {
        const { error } = await supabaseClient
            .from('companies')
            .delete()
            .eq('id', companyId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Erro ao deletar company:', error);
        return false;
    }
}

function mapCompanyFromDB(data) {
    return {
        id: data.id,
        name: data.name,
        contractCode: data.contract_code,
        contractValue: parseFloat(data.contract_value) || 0,
        contractStart: data.contract_start,
        contractEnd: data.contract_end,
        isProdespArea: data.is_prodesp_area || false,
        areaName: data.area_name,
        service: data.service,
        professionalTypes: data.professional_types || [],
        createdAt: data.created_at
    };
}

// ==================== FUNÇÕES AUXILIARES (LocalStorage Fallback) ====================

function loadFromLocalStorage(key, defaultValue = []) {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : defaultValue;
    } catch (error) {
        console.error(`Erro ao carregar ${key} do localStorage:`, error);
        return defaultValue;
    }
}

function saveToLocalStorage(key, item) {
    try {
        const all = loadFromLocalStorage(key, []);
        const index = all.findIndex(i => i.id === item.id);
        
        if (index >= 0) {
            all[index] = item;
        } else {
            all.push(item);
        }
        
        localStorage.setItem(key, JSON.stringify(all));
        return item;
    } catch (error) {
        console.error(`Erro ao salvar ${key} no localStorage:`, error);
        return item;
    }
}

function deleteFromLocalStorage(key, itemId) {
    try {
        const all = loadFromLocalStorage(key, []);
        const filtered = all.filter(i => i.id !== itemId);
        localStorage.setItem(key, JSON.stringify(filtered));
        return true;
    } catch (error) {
        console.error(`Erro ao deletar ${key} do localStorage:`, error);
        return false;
    }
}

