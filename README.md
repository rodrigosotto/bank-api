
# Banking API - Backend

Este projeto é uma API de administração de movimentações de saldos entre clientes, construída com Node.js, Express e MySQL. Ele permite criar contas, transferir fundos entre contas e visualizar a lista de contas e transações. Além disso, há integração com WebSockets para notificações em tempo real sobre transferências de fundos.

## Tecnologias Utilizadas

- Node.js: Ambiente de execução JavaScript.
- Express: Framework para construção de APIs em Node.js.
- MySQL: Banco de dados relacional para armazenar informações das contas e transações.
- Socket.io: Comunicação em tempo real via WebSockets para notificações.
- dotenv: Gerenciamento de variáveis de ambiente.


## Instalação e Configuração
### 1 - Clone o repositório
- git clone https://github.com/seu-usuario/banking-api.git
- cd banking-api

### 2 - Instale as dependências do projeto
- npm install

### 3 - Crie um arquivo .env na raiz do projeto com as seguintes variáveis de ambiente:
DB_HOST=localhost

DB_USER=root

DB_PASSWORD=sua_senha | vazio

DB_NAME=banking_db

PORT=3000

### 4 - IMPORTE O DUMP DO BANCO DE DADOS

### 5 - Execute o servidor:
 - npm run dev
# Melhorias Futuras

Aqui estão algumas ideias de melhorias e funcionalidades que podem ser adicionadas ao projeto:

 - Autenticação e Autorização: Adicionar autenticação via JWT para proteger os endpoints e garantir que apenas usuários autenticados possam acessar ou modificar dados.
 - Taxas de Transferência: Implementar um sistema de taxas para transações, onde uma pequena porcentagem é cobrada para cada transferência realizada.
 - Limites de Transferência: Adicionar a possibilidade de definir limites de transferência para evitar valores muito altos ou muito baixos.
 - Histórico de Atividades do Usuário: Registrar todas as ações realizadas pelos usuários, como criação de conta, transferência de fundos e consulta de dados, para maior transparência.
- Melhorias na Validação de Dados: Utilizar bibliotecas como Joi ou express-validator para garantir que os dados enviados nas requisições estejam corretos e evitar erros de entrada.
- Documentação da API com Swagger: Gerar uma documentação detalhada da API utilizando o Swagger, para facilitar o uso por outros desenvolvedores.
- Integração com Serviços Bancários Reais: Futuramente, a API pode ser integrada com serviços bancários reais para efetuar transações entre contas de bancos verdadeiros.
- Suporte a Múltiplas Moedas: Adicionar suporte para realizar transações e armazenar saldos em diferentes moedas, com conversão automática entre elas.
- Testes Automatizados: Implementar testes automatizados para garantir que as funcionalidades estejam funcionando corretamente e prevenir bugs ao adicionar novas features.
- CI/CD: Configurar pipelines de integração contínua e entrega contínua (CI/CD) para automatizar testes e deploy.
