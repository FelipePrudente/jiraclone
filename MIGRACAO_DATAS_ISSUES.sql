-- Migração: Adicionar campos de data de início e conclusão na tabela issues
-- Execute este script no SQL Editor do Supabase se a tabela já existir

-- Adicionar coluna start_date (data de início)
ALTER TABLE issues 
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE;

-- Adicionar coluna completed_date (data de conclusão)
ALTER TABLE issues 
ADD COLUMN IF NOT EXISTS completed_date TIMESTAMP WITH TIME ZONE;

-- Comentários para documentação
COMMENT ON COLUMN issues.start_date IS 'Data em que a tarefa entrou em "Em Progresso"';
COMMENT ON COLUMN issues.completed_date IS 'Data em que a tarefa foi concluída';

