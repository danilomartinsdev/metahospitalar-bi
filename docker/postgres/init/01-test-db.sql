-- Banco separado para os testes de integração (nunca rodar testes no banco de dev).
CREATE DATABASE metabi_test;
REVOKE ALL ON DATABASE metabi_test FROM PUBLIC;
