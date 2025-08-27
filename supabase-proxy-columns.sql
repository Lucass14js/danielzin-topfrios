-- Adicionar colunas de proxy na tabela instances
ALTER TABLE instances 
ADD COLUMN proxy_host VARCHAR(255),
ADD COLUMN proxy_port VARCHAR(10),
ADD COLUMN proxy_username VARCHAR(255),
ADD COLUMN proxy_password VARCHAR(255);

-- Comentários para documentação
COMMENT ON COLUMN instances.proxy_host IS 'Host do servidor proxy (ex: p.webshare.io)';
COMMENT ON COLUMN instances.proxy_port IS 'Porta do servidor proxy (ex: 80)';
COMMENT ON COLUMN instances.proxy_username IS 'Usuário para autenticação no proxy';
COMMENT ON COLUMN instances.proxy_password IS 'Senha para autenticação no proxy';
