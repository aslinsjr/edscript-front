# Sportlyzer — Frontend

Plataforma de análise esportiva com IA que oferece análises em tempo real, previsões, odds, escalações e estatísticas de partidas em mais de 25 modalidades esportivas.

## Funcionalidades

- Acompanhamento de partidas ao vivo com placares em tempo real
- Análise e previsões de partidas com Inteligência Artificial
- Odds e recomendações de apostas
- Escalações e estatísticas das equipes
- Filtros por liga e modo de visualização (ao vivo / próximas / encerradas)
- Chatbot de IA integrado para perguntas sobre esportes
- Suporte a temas claro/escuro
- Design responsivo para mobile
- Preferências personalizadas por usuário (esportes favoritos, nível de conhecimento)

## Tecnologias

- [React 18](https://react.dev/) com Vite
- [React Router DOM v6](https://reactrouter.com/)
- Deploy via [Vercel](https://vercel.com/)

## Pré-requisitos

- Node.js 18+
- npm

## Como rodar

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

O app estará disponível em `http://localhost:5173`.

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o build de produção na pasta `dist/` |
| `npm run preview` | Serve o build de produção localmente |

## Estrutura de rotas

| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/` | `Home` | Página inicial com chatbot de IA |
| `/sport/:slug` | `LeaguePage` | Seleção de liga para um esporte |
| `/sport/:slug/events` | `SportPage` | Lista de eventos com filtros |

## API

O frontend consome a API hospedada em `https://edscript-api.vercel.app`.

Principais endpoints utilizados:

| Endpoint | Descrição |
|----------|-----------|
| `GET /api/events/inplay` | Partidas ao vivo |
| `GET /api/events/upcoming` | Próximas partidas |
| `GET /api/events/ended` | Partidas encerradas |
| `GET /api/event/odds` | Odds de uma partida |
| `GET /api/event/lineup` | Escalações |
| `GET /api/event/stats_trend` | Tendências e estatísticas |
| `GET /api/statistics/forecast` | Previsões de resultado |
| `POST /api/chat` | Mensagem para o chatbot de IA |
| `POST /api/analysis/event` | Análise de IA para uma partida |

## Esportes suportados

Futebol, Tênis, Basquete, Hóquei no Gelo, Futebol Americano, Handebol, Vôlei, Tênis de Mesa, Futsal, Rugby, Boxe, MMA/UFC, Cricket, Baseball, Snooker, Darts, Badminton, Vôlei de Praia, Corrida de Cavalos e mais.

## Deploy

O projeto está configurado para deploy automático na Vercel. O arquivo `vercel.json` garante o roteamento correto para SPA (Single Page Application).
