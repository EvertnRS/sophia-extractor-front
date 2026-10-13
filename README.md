# SophIA – Frontend

Interface web do **SophIA**: o usuário envia uma ficha médica neonatal em PDF, o sistema extrai os dados automaticamente, a pessoa **revisa e corrige** os campos, **salva** o registro e, por fim, pode calcular uma **predição** a partir dele.

Este repositório contém **somente o frontend**. Ele conversa com um backend (API) que fica em outro repositório — mas também pode rodar **sem backend**, em um modo de demonstração com usuários e dados sintéticos (veja a [seção 4](#4-como-rodar-o-projeto-passo-a-passo)).

> **Não conhece frontend?** Leia este documento na ordem. Há um [glossário](#10-glossário-de-termos-de-frontend) no final com os termos que aparecem por aqui.

---

## Sumário

1. [Visão geral do que o sistema faz](#1-visão-geral-do-que-o-sistema-faz)
2. [Tecnologias usadas](#2-tecnologias-usadas)
3. [Pré-requisitos](#3-pré-requisitos)
4. [Como rodar o projeto (passo a passo)](#4-como-rodar-o-projeto-passo-a-passo)
5. [Backend: de onde vêm os dados](#5-backend-de-onde-vêm-os-dados)
6. [Páginas do sistema](#6-páginas-do-sistema)
7. [Estrutura de pastas](#7-estrutura-de-pastas)
8. [Como o código funciona (conceitos do projeto)](#8-como-o-código-funciona-conceitos-do-projeto)
9. [Guia de tarefas comuns](#9-guia-de-tarefas-comuns)
10. [Glossário de termos de frontend](#10-glossário-de-termos-de-frontend)
11. [Problemas comuns](#11-problemas-comuns)

---

## 1. Visão geral do que o sistema faz

```
 1. Upload do PDF  ──►  2. Extração (backend)  ──►  3. Revisão dos campos
        (Home)            acompanha o progresso         (modal de resultado)
                                                              │
                                                              ▼
                       5. Predição  ◄──  4. Salvar o registro revisado
                        (/predicao)             (DNV é obrigatório)
```

- **DNV** (Declaração de Nascido Vivo) é o identificador de cada registro. Sem o campo `dnv` preenchido não é possível salvar.
- A **predição** é sempre calculada sobre o dado **já salvo e revisado**, nunca sobre o dado bruto extraído do PDF.
- Cada campo extraído mostra um **selo de confiança** (alta / média / baixa / sem avaliação) e as **páginas do PDF** de onde veio.
- Existem dois perfis: **usuário comum** (vê apenas os próprios registros) e **admin** (também gerencia usuários).

---

## 2. Tecnologias usadas

| Tecnologia | Para que serve |
| --- | --- |
| [React 19](https://react.dev) | Biblioteca para construir a interface em "componentes" |
| [TypeScript](https://www.typescriptlang.org) | JavaScript com tipos (avisa erros antes de rodar) |
| [Vite](https://vite.dev) | Ferramenta que roda o projeto em desenvolvimento e gera o build final |
| [Tailwind CSS 4](https://tailwindcss.com) | Estilização por classes direto no HTML (ex.: `bg-cream`, `text-ink`) |
| [React Router 7](https://reactrouter.com) | Troca de páginas sem recarregar o navegador |
| [Axios](https://axios-http.com) | Faz as chamadas HTTP para o backend |
| [lucide-react](https://lucide.dev) | Ícones |
| ESLint | Aponta problemas de código/estilo |

---

## 3. Pré-requisitos

Instale antes de começar:

- **Node.js** — versão **22.12 ou superior** (exigência do Vite 8 e do MSW 3). [Baixar aqui](https://nodejs.org). O npm já vem junto.
- **Git**.
- Um editor de código. Recomendado: [VS Code](https://code.visualstudio.com).
- O **backend rodando** — **somente se for usar o modo completo** (veja a [seção 5](#5-backend-de-onde-vêm-os-dados)). No modo demonstração (`npm run dev:mock`) ele não é necessário.

Para conferir se o Node está instalado, abra o terminal e rode:

```bash
node -v
npm -v
```

---

## 4. Como rodar o projeto (passo a passo)

Há **duas formas** de rodar o frontend:

| | **Modo demonstração (mock)** | **Modo completo** |
| --- | --- | --- |
| Comando | `npm run dev:mock` | `npm run dev` |
| Precisa do backend? | **Não** | Sim |
| Dados | Sintéticos (inventados), guardados no navegador | Reais, vindos do backend |
| Login | Usuários de teste (tabela abaixo) | Usuários cadastrados no backend |
| Use quando | Quer mexer na interface sem depender do backend | Quer testar a integração de verdade |

### 4.1 Instalação (igual nos dois modos)

```bash
# 1. Clone o repositório e entre na pasta
git clone <URL-DO-REPOSITORIO>
cd frontend

# 2. Instale as dependências (só precisa na primeira vez, ou quando o package.json mudar)
npm install
```

### 4.2 Modo demonstração — sem backend

```bash
npm run dev:mock
```

Abra o endereço que aparecer no terminal (normalmente `http://localhost:5173/`). No console do navegador (`F12`) você verá a mensagem `[MSW] Mocking enabled.`, indicando que o backend falso está ligado.

**Usuários de teste:**

| Perfil | E-mail | Senha | O que vê |
| --- | --- | --- | --- |
| Administrador | `admin@sophia.test` | `admin123` | Todos os registros e a tela de usuários |
| Usuário comum | `user@sophia.test` | `user123` | Somente os próprios registros |
| Inativo | `inativo@sophia.test` | `inativo123` | Não consegue entrar (serve para testar a mensagem de usuário inativo) |

**O que dá para fazer (tudo funciona de verdade, só que com dados falsos):**

- Enviar **qualquer PDF**: a extração leva ~10 segundos, com barra de progresso, e devolve uma ficha sintética com selos de confiança e painel de qualidade.
- Revisar, editar e **salvar** o registro; ver a lista de "Extrações salvas".
- **Calcular a predição** do registro salvo.
- Como admin: criar, editar, desativar e reativar usuários. Os registros de exemplo incluem o DNV `99000000001` em dois usuários diferentes, para testar o caso de "DNV com mais de um dono".

**Pontos de atenção:**

- O PDF **não é lido**: cada envio recebe uma ficha de exemplo (há 3 perfis de recém-nascido que se alternam), com um DNV novo.
- A predição usa uma **fórmula inventada**, sem relação com o modelo real. O próprio resultado traz o aviso de dado sintético.
- Tudo que você cria (registros, usuários, predições) fica salvo no **`localStorage` do seu navegador** e sobrevive a recarregar a página. Para **voltar ao estado inicial**, abra o console (`F12`) e rode `resetMockDb()`, ou limpe os dados do site.
- O mock **nunca vai para o build de produção**: `npm run build` gera o site sem nenhum código de mock.

### 4.3 Modo completo — com backend

```bash
# 1. Suba o backend (veja a seção 5)

# 2. (Opcional) Configure o endereço do backend — veja abaixo
#    Se o backend estiver em http://localhost:8000, pode pular este passo.

# 3. Inicie o servidor de desenvolvimento
npm run dev
```

O terminal vai mostrar algo como:

```
  ➜  Local:   http://localhost:5173/
```

Abra esse endereço no navegador. Pronto: ao salvar qualquer arquivo no editor, a página atualiza sozinha (isso se chama *hot reload*).

#### Configurando o endereço do backend

Por padrão, o frontend chama o backend em `http://localhost:8000`. Se o seu backend estiver em outro endereço, crie um arquivo chamado **`.env.local`** na raiz do projeto (ao lado do `package.json`) com:

```env
VITE_API_BASE_URL=http://endereco-do-seu-backend:porta
```

Depois, **pare o servidor (`Ctrl + C`) e rode `npm run dev` de novo** — o Vite só lê o `.env` ao iniciar.

> Arquivos `*.local` já estão no `.gitignore`, então esse arquivo não vai para o repositório. Não coloque senhas nem segredos nele: tudo que começa com `VITE_` fica visível no navegador.

### 4.4 Comandos disponíveis

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Roda o projeto **com o backend** (modo completo) |
| `npm run dev:mock` | Roda o projeto **sem backend**, com dados sintéticos (modo demonstração) |
| `npm run build` | Confere os tipos (`tsc`) e gera a versão final otimizada na pasta `dist/` |
| `npm run preview` | Serve a pasta `dist/` localmente para testar o build |
| `npm run lint` | Roda o ESLint e lista problemas de código |

> **Dica:** antes de abrir um Pull Request, rode `npm run lint` e `npm run build`. Se ambos passarem sem erros, é um bom sinal.

---

## 5. Backend: de onde vêm os dados

O frontend não guarda dados nem processa PDFs: tudo isso é feito pelo backend. *(Esta seção vale para o modo completo; no modo demonstração um backend falso responde no lugar — veja a [seção 8.6](#86-como-o-modo-demonstração-mock-funciona).)*

- Repositório do backend: `<!-- TODO: colar o link do repositório do backend -->`
- As instruções para subir o backend estão no README dele.

**Login para testar:** `<!-- TODO: informar como obter um usuário (ex.: quem cria, ou credenciais de desenvolvimento) -->`

### Principais endpoints usados pelo frontend

Todos os arquivos que falam com o backend ficam em `src/api/`.

| Arquivo | O que faz | Endpoints |
| --- | --- | --- |
| `auth.ts` | Login e dados do usuário logado | `POST /auth/login`, `GET /auth/me` |
| `users.ts` | Gestão de usuários (admin) | `/auth/users` (GET, POST, PATCH, DELETE) |
| `extraction.ts` | Enviar PDF, acompanhar progresso, obter resultado | `/api/extractions...` |
| `structuredData.ts` | Salvar/listar/editar registros revisados | `/create`, `/`, `/update/{dnv}`, `/{dnv}` |
| `prediction.ts` | Calcular e consultar a predição | `/api/predictions/{dnv}` |

---

## 6. Páginas do sistema

| Rota (URL) | Arquivo | Quem acessa | O que tem |
| --- | --- | --- | --- |
| `/login` | `src/pages/Login.tsx` | Todos | Tela de login |
| `/` | `src/pages/Home.tsx` | Logado | Upload do PDF, acompanhamento da extração e modal de revisão |
| `/predicao` | `src/pages/Prediction.tsx` | Logado | Lista de registros salvos e cálculo da predição |
| `/admin/usuarios` | `src/pages/Users.tsx` | **Somente admin** | Criar, editar, ativar e desativar usuários |
| qualquer outra | — | — | Redireciona para `/` |

As rotas são declaradas em `src/App.tsx`. Usuário não logado é enviado para `/login`; usuário que não é admin e tenta abrir `/admin/usuarios` volta para `/`.

---

## 7. Estrutura de pastas

```
frontend/
├── index.html              # Página HTML única; o React "entra" na <div id="root">
├── package.json            # Dependências e comandos (npm run ...)
├── .env.mock               # Liga o modo demonstração (lido por npm run dev:mock)
├── vite.config.ts          # Configuração do Vite (plugins React e Tailwind)
├── tsconfig*.json          # Configuração do TypeScript
├── eslint.config.js        # Regras do ESLint
├── public/                 # Arquivos estáticos servidos como estão (logo, ilustração)
│   └── mockServiceWorker.js    # Gerado pelo MSW para o modo demonstração (não editar à mão)
└── src/
    ├── main.tsx            # Ponto de entrada: monta o <App /> na página
    ├── App.tsx             # Define as rotas (qual URL abre qual página)
    ├── index.css           # Estilos globais + paleta de cores e fontes (tema Tailwind)
    ├── App.css             # Sobra do template do Vite; não é importado por nenhum arquivo
    │
    ├── pages/              # Uma "tela" inteira por arquivo (ligada a uma rota)
    │   ├── Login.tsx
    │   ├── Home.tsx
    │   ├── Prediction.tsx
    │   └── Users.tsx
    │
    ├── components/         # Peças reutilizáveis de interface
    │   ├── Appheader.tsx       # Cabeçalho/navegação (lista de links em NAV_ITEMS)
    │   ├── UploadCard.tsx      # Upload do PDF e acompanhamento do progresso
    │   ├── ResultModal.tsx     # Janela de revisão/edição/salvamento dos campos
    │   ├── EditableField.tsx   # Um campo editável (rótulo, valor, páginas, confiança)
    │   ├── Confidencebadge.tsx # Selo de confiança (alta/média/baixa)
    │   ├── QualityPanel.tsx    # Resumo de qualidade do documento
    │   ├── PredictionPanel.tsx # Calcula e mostra a predição de um registro
    │   ├── ProgressBar.tsx
    │   ├── Userformmodal.tsx   # Formulário de criar/editar usuário
    │   ├── ProtectedRoute.tsx  # Barra acesso de quem não está logado
    │   ├── AdminRoute.tsx      # Barra acesso de quem não é admin
    │   ├── FullScreenMessage.tsx
    │   └── LoginIllustration.tsx
    │
    ├── api/                # Tudo que conversa com o backend (veja seção 5)
    │   ├── api.ts              # Cliente Axios único + token + tratamento de sessão expirada
    │   ├── authStorage.ts      # Guarda/lê o token de login no navegador
    │   └── auth.ts, users.ts, extraction.ts, structuredData.ts, prediction.ts
    │
    ├── mocks/              # Backend falso do modo demonstração (MSW)
    │   ├── config.ts           # Prefixo das rotas falsas (/mock-api)
    │   ├── seed.ts             # Usuários, registros e campos SINTÉTICOS
    │   ├── db.ts               # "Banco" em memória, salvo no localStorage
    │   ├── handlers.ts         # Um handler por endpoint do backend (login, extração, ...)
    │   └── browser.ts          # Liga o MSW no navegador
    │
    ├── context/            # Estado global de autenticação
    │   ├── AuthProvider.tsx    # Quem está logado? Faz login/logout
    │   ├── authContextValue.ts # Formato dos dados compartilhados
    │   └── useAuth.ts          # Atalho para ler esses dados em qualquer componente
    │
    ├── data/               # Textos e regras de apresentação (sem chamadas à API)
    │   ├── fieldLabels.ts       # Nome legível de cada campo (ex.: tp_parto → "Tipo de parto")
    │   ├── fieldDescriptions.ts # Explicação de como cada campo é extraído
    │   └── confidence.ts        # Regras dos selos de confiança
    │
    ├── utils/              # Funções auxiliares pequenas (formatDate, flattenJson)
    ├── types/              # Tipos TypeScript compartilhados
    └── assets/             # Imagens importadas pelo código
```

---

## 8. Como o código funciona (conceitos do projeto)

### 8.1 Tudo é componente

Cada pedaço da tela é uma função que devolve "HTML" (chamado JSX). Páginas (`pages/`) montam a tela juntando componentes (`components/`). Exemplo, a Home inteira:

```tsx
export default function Home() {
  return (
    <div className="min-h-screen bg-cream">
      <AppHeader />
      <main>
        <h1>Extração de Dados</h1>
        <UploadCard />
      </main>
    </div>
  );
}
```

### 8.2 Autenticação

1. Na tela de login, o `AuthProvider` chama `POST /auth/login` e recebe um **token**.
2. O token é salvo no navegador (`localStorage`, chave `sophia:access_token`, em `api/authStorage.ts`).
3. Todo pedido ao backend leva o token automaticamente (o *interceptor* em `api/api.ts` adiciona `Authorization: Bearer ...`).
4. Se o backend responder **401 ou 403** (token expirou ou usuário foi desativado), o `api.ts` dispara o evento `auth:logout` e o `AuthProvider` desloga a pessoa.
5. Ao abrir o site, se já existe token, o `AuthProvider` valida ele em `GET /auth/me` antes de liberar as páginas.

Em qualquer componente, para saber quem está logado:

```tsx
const { user, status, logout } = useAuth();
// status: "loading" | "authenticated" | "anonymous"
// user.role === "admin" para checar se é admin
```

### 8.3 Confiança dos campos

O backend informa, para cada campo extraído, uma **faixa de confiança** (`alta`, `media`, `baixa`) e as páginas do PDF de origem. As regras de como isso é exibido estão em `src/data/confidence.ts`. Regras importantes que **não devem ser quebradas**:

- A **faixa** é o dado que importa; o número ("índice") **não é calibrado** e nunca deve ser mostrado como porcentagem.
- Campo **sem faixa** é cinza ("sem avaliação"), nunca verde.
- Faixa **alta** significa "sinal de leitura forte", **não** garante que o valor está correto — por isso o aviso sempre fica visível no painel.
- Campo sem informação de fonte (registro antigo) simplesmente **não ganha selo**.

### 8.4 Registros de vários usuários

Um mesmo DNV pode existir para usuários diferentes. Usuário comum só enxerga o próprio. O **admin** pode ver todos e, quando houver DNV repetido, o frontend envia `?owner_id=` para indicar de qual dono é o registro (campo `owner_id` nos tipos).

### 8.5 Estilo e cores (Tailwind)

As cores e fontes do projeto estão no topo de `src/index.css`, dentro de `@theme { ... }`. Cada cor vira classes utilitárias automaticamente:

| Variável | Classes geradas (exemplos) | Uso |
| --- | --- | --- |
| `--color-cream` | `bg-cream` | Fundo das páginas |
| `--color-ink` | `text-ink` | Títulos e texto forte |
| `--color-espresso` | `bg-espresso` | Botões principais |
| `--color-salmon` | `bg-salmon` | Botões/selos secundários |
| `--color-blush` | `border-blush` | Bordas suaves |

Use sempre essas classes em vez de cores soltas como `bg-[#4A3534]`.

### 8.6 Como o modo demonstração (mock) funciona

O modo mock usa o [MSW (Mock Service Worker)](https://mswjs.io), que intercepta as chamadas HTTP **dentro do navegador** e responde com dados falsos. O restante do código (páginas, componentes, `src/api/`) é **o mesmo** nos dois modos: ele nem sabe que está falando com um backend falso.

```
npm run dev:mock
   └─ Vite lê o .env.mock  →  VITE_USE_MOCK=true
        ├─ main.tsx liga o MSW antes de desenhar o app
        └─ api/api.ts passa a usar o endereço /mock-api (em vez de VITE_API_BASE_URL)

Componente ──► src/api/*.ts ──► Axios ──► /mock-api/... ──► MSW (handlers.ts) ──► dados do db.ts
```

Pontos importantes:

- Os handlers em `src/mocks/handlers.ts` imitam o backend real: mesmos endpoints, mesmos formatos de resposta e mesmos códigos HTTP (401, 403, 404, 409...). Por isso as telas se comportam igual nos dois modos, inclusive nos casos de erro.
- Os dados sintéticos ficam em `src/mocks/seed.ts`. **Nenhum dado de paciente real** deve ser colocado ali.
- Os dados criados durante o uso ficam no `localStorage` (chave `sophia:mock:db:v1`), separados do token de login e do restante do app.
- Se o contrato do backend mudar (campo novo, endpoint novo), o mock **não acompanha sozinho**: é preciso atualizar `handlers.ts` e/ou `seed.ts`.

---

---

## 9. Problemas comuns

| Sintoma | Provável causa / solução |
| --- | --- |
| `npm: command not found` | Node.js não instalado. Veja [Pré-requisitos](#3-pré-requisitos). |
| Erro estranho ao rodar `npm install` ou `npm run dev` | Versão do Node antiga. Atualize e rode `npm install` de novo. |
| Tela de login dá erro / "Network Error" (modo completo) | Backend desligado ou endereço errado. Confira o backend e o `VITE_API_BASE_URL`. |
| Rodei `npm run dev:mock` mas a tela fala com o backend / não vejo `[MSW] Mocking enabled.` | Você rodou `npm run dev` por engano, ou o service worker não registrou. Pare o servidor, rode `npm run dev:mock` e recarregue com `Ctrl + Shift + R`. |
| No modo mock, o login diz "e-mail ou senha inválidos" | Use os usuários da [tabela do modo demonstração](#42-modo-demonstração--sem-backend). Se mexeu nos dados e se perdeu, rode `resetMockDb()` no console. |
| No modo mock, os dados estão "estranhos" ou desatualizados após eu alterar o `seed.ts` | O banco falso salvo no navegador tem prioridade. Rode `resetMockDb()` no console do navegador. |
| Mudei o `.env.local` e nada mudou | Pare o servidor (`Ctrl + C`) e rode `npm run dev` novamente. |
| Erro de **CORS** no console do navegador | O backend precisa autorizar a origem do frontend (ex.: `http://localhost:5173`). Isso se configura no backend. |
| Sou jogado de volta para o login sozinho | O token expirou ou o usuário foi desativado (resposta 401/403). Entre de novo. |
| `/admin/usuarios` redireciona para a Home | O usuário logado não tem perfil `admin`. |
| Não consigo salvar um registro | O campo `dnv` é obrigatório. |
| Predição diz "Salve os dados revisados antes" | A predição só funciona para registros já salvos. |
| Mensagem de DNV com "mais de um usuário" | Só ocorre para admin: abra o registro pela lista de extrações salvas para escolher o dono. |
| Página em branco após uma alteração | Abra o console do navegador (`F12`) e veja o erro; costuma ser um erro de digitação no código. |