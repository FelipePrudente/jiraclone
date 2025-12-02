// Configuração do Supabase
// IMPORTANTE: Substitua as credenciais abaixo pelas suas credenciais do Supabase

const SUPABASE_CONFIG = {
    url: 'https://curbnoczpztbomtgexnh.supabase.co', // Exemplo: 'https://xxxxx.supabase.co'
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1cmJub2N6cHp0Ym9tdGdleG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2OTIyMDQsImV4cCI6MjA4MDI2ODIwNH0.BkHLffDi3lU9hRsljxCXFc1iTdLF_kt356NaS6cbJbs'  // Exemplo: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};

// Verificar se as credenciais foram configuradas
if (SUPABASE_CONFIG.url && SUPABASE_CONFIG.url !== 'SUA_PROJECT_URL_AQUI' && 
    SUPABASE_CONFIG.anonKey && SUPABASE_CONFIG.anonKey !== 'SUA_ANON_KEY_AQUI') {
    console.log('✅ Credenciais do Supabase configuradas');
} else {
    console.warn('⚠️ ATENÇÃO: Configure suas credenciais do Supabase no arquivo supabase-config.js');
}

