# 🐇 RabbitMQ Resiliency Challenge

Este repositório simula um **teste técnico para desenvolvedores Backend Sênior**, focado em arquitetura assíncrona, desacoplamento de serviços e resiliência de dados usando RabbitMQ e Node.js.

## 📜 Contexto do Desafio
A empresa fictícia **"LogiTech Solutions"** possui uma API crítica de geração de relatórios fiscais. Atualmente, o processamento é síncrono: o cliente pede o relatório e a requisição fica pendurada por 10 a 20 segundos até o PDF ser gerado. Isso está causando *timeouts* no gateway e travando o banco de dados.

**Sua missão:** Refatorar esse fluxo para uma arquitetura assíncrona baseada em eventos, garantindo que nenhum pedido de relatório seja perdido, mesmo que o serviço de geração falhe temporariamente.

---

## 🎯 Requisitos Técnicos

### 1. Infraestrutura (Docker)
- Deve-se utilizar **Docker Compose** para subir o RabbitMQ.
- A instância do RabbitMQ deve ter o **Management Plugin** habilitado (acesso à UI na porta 15672).
- Usuário e senha padrão devem ser configurados explicitamente via variáveis de ambiente.

### 2. Producer API (O "Vendedor")
Criar uma API simples (Node.js) com um endpoint `POST /reports`:
- Recebe um payload JSON (ex: `{ "userId": "123", "type": "pdf" }`).
- **Não processa o relatório**. Apenas valida os dados, publica uma mensagem na fila `reports_queue` e retorna status `202 Accepted` com um ID de protocolo.
- A mensagem deve ser persistente (durável).

### 3. Worker Consumer (O "Operário")
Criar um script separado (Worker) que roda em *background*:
- Conecta no RabbitMQ e consome a `reports_queue`.
- **Simulação de Trabalho:** Adicionar um delay artificial de 2 segundos (ex: `setTimeout`) para simular a geração do PDF.
- **Simulação de Caos:** O worker deve ter uma chance de 20% de falhar aleatoriamente (lançar erro) antes de confirmar o processamento.

### 4. Resiliência e DLQ (O Diferencial de Sênior)
Implementar uma estratégia de **Dead Letter Queue (DLQ)** para mensagens envenenadas:
- Se o worker falhar ao processar uma mensagem, ela deve retornar à fila (NACK) ou ser rejeitada.
- Configure o RabbitMQ (via policies ou argumentos da fila) para que, após **3 tentativas falhas** de processamento, a mensagem seja movida automaticamente para uma fila chamada `reports_dlq`.
- **Dica:** Estude sobre `x-dead-letter-exchange` e `x-delivery-limit` (ou controle de tentativas manual no header da mensagem).

---

## 🛠️ Stack Sugerida
- **Runtime:** Node.js (TypeScript é encorajado).
- **Driver AMQP:** `amqplib` (padrão de mercado).
- **Containerização:** Docker & Docker Compose.

## 📦 Estrutura do Projeto
Sugestão de organização para o desafio:

```
rabbitmq-resiliency-challenge/
├── docker-compose.yml      # Definição do RabbitMQ
├── src/
│   ├── producer/           # API (Express/Fastify/Hono)
│   │   └── server.ts
│   ├── worker/             # Consumidor da fila
│   │   └── index.ts
│   └── lib/                # Configurações do RabbitMQ (connection)
│       └── queue.ts
├── package.json
└── README.md
```

## 🚀 Como Rodar

1. **Instale as dependências:**
   ```
   npm install
   ```

2. **Suba o RabbitMQ:**
   ```
   docker compose up -d
   ```

3. **Inicie o Worker (Consumer):**
   ```
   npm run start:worker
   ```

4. **Em outro terminal, inicie a API (Producer):**
   ```
   npm run start:api
   ```

---

## 🧪 Critérios de Aceite
- [ ] O RabbitMQ sobe com um comando.
- [ ] A API responde rápido mesmo sob carga.
- [ ] O Worker processa as mensagens uma a uma (prefetch count configurado).
- [ ] Mensagens que falham repetidamente aparecem na fila `reports_dlq` na interface administrativa do RabbitMQ.