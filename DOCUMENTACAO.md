# Custo por KM — Documentação Técnica e Design System

> **Projeto:** Custo por KM — Comparador de combustível
> **Tipo:** Aplicação web estática (PWA), sem build e sem dependências
> **Idioma:** pt-BR
> **Documento gerado em:** 23/10/2026
> **Versão do app:** `1.1.0` — inclui verificação e aplicação de atualizações
> **Base de código:** commit `e40c319` + fluxo de atualização (23/10/2026)
> **Escopo deste documento:** visão geral, escopo funcional, regras de negócio, stack, arquitetura, cores, tipografia, layout, componentes, acessibilidade, PWA, atualizações e guia de manutenção.

---

## Sumário

1. [Visão geral](#1-visão-geral)
2. [Escopo funcional](#2-escopo-funcional)
3. [Regras de negócio e fórmulas](#3-regras-de-negócio-e-fórmulas)
4. [Stack tecnológica](#4-stack-tecnológica)
5. [Arquitetura](#5-arquitetura)
6. [Cores](#6-cores)
7. [Tipografia](#7-tipografia)
8. [Layout, espaçamento e formas](#8-layout-espaçamento-e-formas)
9. [Componentes](#9-componentes)
10. [Acessibilidade](#10-acessibilidade)
11. [SEO e PWA](#11-seo-e-pwa)
12. [Guia de manutenção](#12-guia-de-manutenção)
13. [Fora de escopo e evoluções sugeridas](#13-fora-de-escopo-e-evoluções-sugeridas)

---

## 1. Visão geral

**Custo por KM** é uma calculadora comparativa que responde a uma pergunta prática: *quanto custa rodar cada quilômetro com etanol, gasolina ou carro elétrico?*

O usuário informa o deslocamento diário e, opcionalmente, ajusta preços, consumo do veículo e dias de uso por semana. O app calcula o custo por quilômetro de cada energia, ordena da opção mais econômica para a menos econômica e projeta o gasto por dia, semana, mês e ano. Também gera análises automáticas de paridade etanol × gasolina e de economia do elétrico frente à gasolina.

### Princípios do produto

| Princípio | Como aparece no produto |
|---|---|
| Resposta imediata | O cálculo é recalculado a cada digitação, sem botão "Calcular" |
| Mobile-first | Layout de coluna única até 820px, diálogo em tela cheia abaixo de 600px |
| Transparência | "Detalhes do cálculo" mostra as premissas e a memória de cálculo |
| Baixo atrito | Valores padrão já preenchidos; apenas a distância diária é obrigatória |
| Offline e instalável | Service Worker com cache e manifest para instalação como app |
| Privacidade | Nenhum dado sai do navegador; tudo fica em `localStorage` |

### Público-alvo

Motoristas que comparam etanol e gasolina, donos de veículos híbridos/elétricos e pessoas que querem estimar o impacto do deslocamento no orçamento. Não é uma ferramenta contábil: a estimativa considera **apenas o custo da energia**.

### Estado atual

Protótipo funcional completo, com identidade visual fechada, tema claro/escuro, 12 moedas, PWA offline e acessibilidade básica implementada. Não há backend, autenticação, testes automatizados ou pipeline de build.

---

## 2. Escopo funcional

### 2.1 Entrada de dados

| Recurso | Comportamento | Referência |
|---|---|---|
| Deslocamento diário | Campo único em `km/dia`, aceita decimais com máscara | `index.html:96-104`, `app.js:259-264` |
| Preços | Etanol (por L), gasolina (por L) e energia (por kWh), com símbolo da moeda | `index.html:170-199` |
| Consumo | Etanol, gasolina e elétrico, com seletor de unidade por combustível | `index.html:203-238` |
| Unidades | `km/L` ↔ `L/100 km` e `km/kWh` ↔ `kWh/100 km` | `app.js:58-68`, `app.js:305-323` |
| Dias por semana | 1 a 7 dias; padrão 5 (seg–sex) | `index.html:242-262` |
| Moeda | 12 moedas, com locale e formatação correspondentes | `app.js:9-22` |
| Filtro de combustíveis | Liga/desliga etanol, gasolina e elétrico na comparação | `index.html:129-142` |

### 2.2 Saídas e análises

| Recurso | Comportamento |
|---|---|
| Ranking | Cards ordenados do menor para o maior custo por km |
| Vencedor | Badge "Mais econômico"; empate técnico com tolerância de 0,1% |
| Comparação | Percentual acima do melhor custo ("vs. melhor") ou "quase igual" abaixo de 0,5% |
| Barra proporcional | Largura relativa ao maior custo entre os resultados válidos (mínimo 6%) |
| Métricas | Custo por dia, semana (com nº de dias), mês e ano |
| Paridade etanol × gasolina | Preço de equilíbrio do etanol, razão atual e limite em barra visual |
| Elétrico × gasolina | Percentual do custo do elétrico e diferença em R$ a cada 100 km |
| Estados vazios | Mensagens orientando ativar combustíveis ou preencher dados |
| Detalhes do cálculo | Bloco `<details>` com as análises e o disclaimer |

### 2.3 Preferências e persistência

| Recurso | Comportamento |
|---|---|
| Tema | Claro, escuro ou automático (segue `prefers-color-scheme`) |
| Persistência | Estado salvo em `localStorage` com debounce de 250 ms |
| Restauração | "Restaurar" volta aos valores de fábrica e exibe toast |
| Moeda | Ao trocar, reformata os campos e símbolos sem perder os valores |
| Diálogo de configurações | Alterações só são aplicadas ao clicar em "Concluir"; fechar/cancelar descarta |
| Atualização | Checagem ao abrir/retomar, banner "Atualizar agora" e verificação manual com versão exibida |

### 2.4 Fora do escopo atual

- Backend, banco de dados, login ou sincronização entre dispositivos.
- Consulta automática de preços de combustível (API externa).
- Cálculo de manutenção, seguro, impostos, pedágio, depreciação, financiamento ou aluguel.
- Múltiplos veículos, histórico de abastecimentos ou relatórios exportáveis.
- Gráficos além das barras proporcionais e da barra de paridade.
- Internacionalização da interface (textos fixos em pt-BR; apenas moeda/números são localizados).
- Build, bundler, framework, testes automatizados e CI/CD.

---

## 3. Regras de negócio e fórmulas

### 3.1 Custo por quilômetro

Implementado em `computeCostPerKm` (`app.js:466-471`).

| Unidade de consumo | Fórmula |
|---|---|
| `km/L` | `custoPorKm = preçoPorLitro ÷ consumoKmPorLitro` |
| `L/100 km` | `custoPorKm = (consumoL100km ÷ 100) × preçoPorLitro` |
| `km/kWh` | `custoPorKm = preçoPorKWh ÷ consumoKmPorKWh` |
| `kWh/100 km` | `custoPorKm = (consumoKWh100km ÷ 100) × preçoPorKWh` |

Conversão de unidade ao trocar o seletor (`app.js:305-323`):

```
novoConsumo = 100 ÷ consumoAtual
```

A conversão só ocorre quando o valor é finito e maior que zero. A troca é aplicada no rascunho do diálogo e só é persistida ao concluir.

### 3.2 Projeções de gasto

Constantes em `app.js:55-56`:

```js
const WEEKS_PER_YEAR = 52;
const WEEKS_PER_MONTH = WEEKS_PER_YEAR / 12; // 4,333... semanas
```

| Período | Fórmula |
|---|---|
| Por dia | `custoPorKm × distânciaDiária` |
| Por semana | `custoPorKm × distânciaDiária × diasPorSemana` |
| Por mês | `custoPorKm × distânciaDiária × diasPorSemana × 52/12` |
| Por ano | `custoPorKm × distânciaDiária × diasPorSemana × 52` |

Consequências: o mês é aproximado por **21,67 dias** quando `diasPorSemana = 5`, e o ano tem **260 dias de uso**. A interface deixa isso explícito em `index.html:262` e `app.js:685-692`.

### 3.3 Validação e estados

- Um combustível é **válido** quando preço > 0 e consumo > 0 e ambos são numéricos (`app.js:499`).
- Distância vazia ou inválida é tratada como `0`: os custos por km aparecem, mas as projeções mostram `—` (`app.js:489-492`).
- Combustíveis desativados não entram no ranking nem nas análises.
- Se todos forem desativados, aparece "Ative ao menos um combustível para comparar." e os detalhes são ocultados (`app.js:521-527`).
- Resultados inválidos vão para o fim da lista, sem barra e com "Dados incompletos".

### 3.4 Critérios de comparação

| Regra | Implementação |
|---|---|
| Vencedor | Menor custo entre os válidos; tolerância `max(melhor × 0,001, 1e-9)` (`app.js:538-539`) |
| Delta | `((custo − melhor) ÷ melhor) × 100`, nunca negativo na exibição (`app.js:540`) |
| "Quase igual" | Delta < 0,5% (`app.js:570`) |
| Largura da barra | `max(6, custo ÷ maiorCusto × 100)%` (`app.js:559`) |
| Ordenação | Válidos por custo crescente; inválidos ao final (`app.js:551-556`) |

### 3.5 Paridade etanol × gasolina

Exibida apenas quando ambos são válidos e estão ativos (`app.js:619-647`).

```
razãoEtanol (%) = (kmPorLitroEtanol ÷ kmPorLitroGasolina) × 100
preçoDeEquilíbrio = preçoGasolina × (kmPorLitroEtanol ÷ kmPorLitroGasolina)
etanolVale = preçoEtanol ≤ preçoDeEquilíbrio
razãoAtual (%) = (preçoEtanol ÷ preçoGasolina) × 100
```

A barra mostra a razão atual preenchida até 100% e um marcador no limite de paridade. Quando o etanol está acima do limite, o preenchimento muda para a cor da gasolina (`.parity-fill.over`).

### 3.6 Elétrico × gasolina

Exibida quando ambos são válidos e ativos (`app.js:649-664`).

```
percentual = (custoPorKmElétrico ÷ custoPorKmGasolina) × 100
diferençaPor100km = |custo100kmGasolina − custo100kmElétrico|
```

### 3.7 Valores padrão

Definidos em `app.js:24-53` e refletidos no HTML.

| Campo | Valor padrão |
|---|---|
| Preço do etanol | `3,59` por litro |
| Preço da gasolina | `6,09` por litro |
| Preço da energia | `0,91` por kWh |
| Consumo com etanol | `11,00 km/L` |
| Consumo com gasolina | `14,00 km/L` |
| Consumo elétrico | `7,45 km/kWh` |
| Distância diária | vazio (usuário informa) |
| Dias por semana | `5` (seg–sex) |
| Moeda | `BRL` |
| Tema | automático (sistema) |
| Combustíveis ativos | todos |

### 3.8 Análise e formatação numérica

- `Intl.NumberFormat` decide separadores e símbolo conforme a moeda (`app.js:406-420`, `app.js:746-778`).
- Campos mascarados guardam apenas dígitos e são formatados com 2 casas (`app.js:325-369`).
- Custo por km usa 3 casas; valores por período usam 2 casas e, acima de 1.000, 0 casas; acima de 1.000.000, notação compacta (`app.js:766-796`).
- Entrada aceita vírgula ou ponto, com heurística para separador de milhar (`app.js:422-464`).

---

## 4. Stack tecnológica

### 4.1 Visão geral

| Camada | Tecnologia | Observações |
|---|---|---|
| Markup | HTML5 semântico | Um único `index.html`; `lang="pt-BR"`; sem templates |
| Estilo | CSS3 puro | Custom properties, `color-mix()`, `:has()`, `clamp()`, grid/flex |
| Comportamento | JavaScript vanilla (ES2020+) | IIFE com `"use strict"`; nenhum framework |
| Persistência | Web Storage API | Chave `custo-por-km:v1` |
| Offline | Service Worker | Cache próprio `custo-por-km-v11` |
| Instalação | Web App Manifest | `display: standalone` |
| Tipografia | Fontes do sistema | Nenhuma webfont baixada |
| Ícones | SVG inline + PNG | SVG para UI; PNG para instalação |
| Build | Nenhum | Arquivos servidos como estão |

### 4.2 APIs de plataforma utilizadas

| API | Uso |
|---|---|
| `Intl.NumberFormat` | Moeda, números, notação compacta, separadores |
| `localStorage` | Preferências, valores, unidades e filtros |
| `matchMedia` | Tema automático e `prefers-reduced-motion` (CSS) |
| `<dialog>` + `showModal()` | Diálogo de configurações com fallback via atributo `open` |
| `Service Worker` + Cache API | Funcionamento offline e atualização em segundo plano |
| `navigator.serviceWorker` | Registro do SW (ignorado em `file://`) |
| CSS `color-mix()` | Misturas de borda/fundo derivadas dos tokens |
| CSS `:has()` | Estado visual dos filtros de combustível |
| `env(safe-area-inset-*)` | Respeito a notch e barra inferior no mobile |

### 4.3 Compatibilidade

Requer navegador moderno com suporte a `color-mix()`, `:has()`, `<dialog>` e `dvh` (Chrome/Edge 111+, Safari 16.4+, Firefox 121+). Em navegadores antigos, o layout funciona, mas cores derivadas e estados de filtro podem degradar. O SW não é registrado quando a página é aberta via `file://` (`app.js:908-947`).

### 4.4 Como executar

```bash
# na raiz do projeto
python -m http.server 8080
# abrir http://localhost:8080
```

Também funciona abrindo `index.html` diretamente, exceto recursos de PWA (Service Worker e instalação).

---

## 5. Arquitetura

### 5.1 Estrutura de arquivos

```
appCombustivel/
├── index.html                 # Estrutura, metadados, SVG inline e diálogo
├── manifest.webmanifest       # Metadados de instalação (PWA)
├── sw.js                      # Service Worker (precache + runtime cache)
├── vercel.json                # Headers de cache para sw.js e assets
├── DOCUMENTACAO.md            # Este documento
└── assets/
    ├── styles.css             # Design system completo (1.425 linhas)
    ├── app.js                 # Estado, cálculo, renderização, persistência e update (1.052 linhas)
    ├── icon.svg               # Ícone vetorial
    ├── icon-180.png           # Apple touch icon
    ├── icon-192.png           # Ícone PWA
    ├── icon-512.png           # Ícone PWA
    └── icon-maskable-512.png  # Ícone maskable
```

### 5.2 Fluxo de dados

```
Usuário digita
      │
      ▼
handleFormChange / handleSettingsDraftChange
      │
      ▼
collectValues() + collectUnits()  ──►  state (memória)
      │                                   │
      ▼                                   ▼
render()                            scheduleSave() (250 ms)
      │                                   │
      ├─► renderCards()                   ▼
      └─► renderInsights()          localStorage["custo-por-km:v1"]
```

Na inicialização, `loadState()` lê o `localStorage`, valida cada campo e `syncForm()` repopula os inputs antes do primeiro `render()` (`app.js:153-167`).

### 5.3 Estado da aplicação

```js
{
  currency: "BRL",                 // uma das 12 chaves de CURRENCIES
  theme: "light" | "dark" | null,  // null = seguir o sistema
  values: {
    ethanolPrice: "3,59",
    gasolinePrice: "6,09",
    electricPrice: "0,91",
    ethanolConsumption: "11,00",
    gasolineConsumption: "14,00",
    electricConsumption: "7,45",
    dailyDistance: "",
    daysPerWeek: "5"
  },
  units: {
    ethanol: "km/L",
    gasoline: "km/L",
    electric: "km/kWh"
  },
  enabledFuels: {
    ethanol: true,
    gasoline: true,
    electric: true
  }
}
```

Regras de restauração (`app.js:842-882`):

- Chaves desconhecidas são ignoradas.
- `daysPerWeek` precisa casar com `^[1-7]$`, senão volta a `"5"`.
- Unidades precisam pertencer à lista válida de cada combustível.
- JSON inválido ou indisponível retorna o estado padrão sem quebrar a aplicação.

### 5.4 Service Worker

| Aspecto | Implementação |
|---|---|
| Nome do cache | `custo-por-km-v11` (`sw.js:1`) |
| Precache | `./`, HTML, CSS, JS, ícones e manifest (`sw.js:2-12`), buscados com `cache: "reload"` |
| Instalação | `cache.addAll` + `skipWaiting()` |
| Ativação | Remove caches antigos + `clients.claim()` + broadcast `SW_ACTIVATED` |
| Mensagens | `SKIP_WAITING` e `GET_VERSION` (`sw.js:35-46`) |
| Navegação | Network-first; salva cópia de `./index.html`; fallback para o cache |
| Assets | Cache-first com revalidação em segundo plano (stale-while-revalidate) |
| Escopo | Somente `GET` e mesma origem |

> Ao publicar mudanças em CSS/JS/HTML, **incremente `CACHE`** (ex.: `v11`); caso contrário, usuários recorrentes podem continuar vendo a versão antiga.

### 5.5 Organização do JavaScript

| Bloco | Linhas | Responsabilidade |
|---|---|---|
| Constantes e configuração | 4–102 | Versão, chave de storage, moedas, defaults, unidades, combustíveis, ícones |
| Cache de elementos | 104–138 | Referências DOM por `getElementById` |
| Inicialização | 153–165 | Bind, versão, sync, tema, render, registro do SW |
| Eventos | 169–303 | Formulário, filtros, diálogo, moeda, tema, reset, máscara, update |
| Estado e unidades | 305–404 | Rascunho, parsing, máscara, coleta e sincronização |
| Cálculo e render | 466–683 | Fórmulas, cards, insights |
| Diálogo | 685–744 | Abrir, cancelar, concluir, resumos |
| Formatação | 746–823 | Moeda, número, compacto, clamp |
| Tema e persistência | 825–906 | Aplicação de tema, load/save, toast |
| Atualização | 908–1051 | Registro do SW, checagem, banner, reload e versão |

---

## 6. Cores

Todas as cores são tokens em `:root` (tema claro) e sobrescritas em `html[data-theme="dark"]` (`assets/styles.css:1-50`). Componentes nunca devem usar hex direto; use as variáveis.

### 6.1 Tokens base — tema claro

| Token | Hex | Uso |
|---|---|---|
| `--bg` | `#f2f6f1` | Fundo geral, topbar, tema do navegador |
| `--bg-2` | `#e9f1ea` | Fim do gradiente de fundo |
| `--surface` | `#ffffff` | Painéis, cards, diálogo, inputs em foco |
| `--surface-2` | `#f5f9f5` | Ícones, barras de fundo, chips neutros |
| `--text` | `#132019` | Texto principal, toast invertido |
| `--muted` | `#5b6c61` | Labels, textos secundários, ícones |
| `--faint` | `#7d8d83` | Legendas, hints, placeholders, notas |
| `--border` | `#dfe8e0` | Bordas e divisores |
| `--border-strong` | `#cbd9ce` | Hover de bordas |
| `--input` | `#f6f9f6` | Fundo de campos |
| `--shadow` | `0 24px 50px -32px rgba(19,45,30,.4), 0 2px 10px rgba(19,45,30,.04)` | Sombra de painel |
| `--ring` | `rgba(38,146,95,.22)` | Anel de foco |

### 6.2 Tokens base — tema escuro

| Token | Hex / valor | Uso |
|---|---|---|
| `--bg` | `#0b1310` | Fundo geral |
| `--bg-2` | `#0f1b16` | Fim do gradiente |
| `--surface` | `#121e19` | Painéis e cards |
| `--surface-2` | `#16251f` | Superfícies de apoio |
| `--text` | `#edf5f0` | Texto principal |
| `--muted` | `#9fb3a8` | Texto secundário |
| `--faint` | `#7b9186` | Legendas e hints |
| `--border` | `#23352c` | Bordas |
| `--border-strong` | `#2f473a` | Hover de bordas |
| `--input` | `#0f1a15` | Fundo de campos |
| `--shadow` | `0 30px 70px -36px rgba(0,0,0,.85), 0 2px 12px rgba(0,0,0,.2)` | Sombra de painel |
| `--ring` | `rgba(109,164,255,.28)` | Anel de foco |

### 6.3 Cores semânticas por combustível

| Combustível | Token | Claro | Claro (soft) | Escuro | Escuro (soft) |
|---|---|---|---|---|---|
| Etanol | `--ethanol` / `--ethanol-soft` | `#26925f` | `#e2f4ea` | `#43d18d` | `rgba(67,209,141,.12)` |
| Gasolina | `--gasoline` / `--gasoline-soft` | `#c88213` | `#fbefd6` | `#f0b24b` | `rgba(240,178,75,.12)` |
| Elétrico | `--electric` / `--electric-soft` | `#2f74d9` | `#e4eefc` | `#6da4ff` | `rgba(109,164,255,.12)` |

Cada card e toggle recebe `data-fuel` e deriva `--fuel` / `--fuel-soft` (`styles.css:771-783`), permitindo que o mesmo componente mude de cor sem duplicação.

### 6.4 Cores de status

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `--good` | `#1f8a54` | `#4ad191` | Status favorável ("Etanol vale a pena", "Elétrico mais barato") |
| `--warn` | `#b57112` | `#f0b24b` | Status desfavorável |

### 6.5 Gradientes

| Onde | Gradiente |
|---|---|
| Fundo da página | 2 radiais sobre `linear-gradient(180deg, var(--bg), var(--bg-2))`: verde `rgba(46,160,102,.16)` no topo esquerdo e azul `rgba(47,116,217,.12)` no topo direito (`styles.css:66-69`) |
| Marca e CTA principal | `linear-gradient(145deg, #34d399, #0f766e)` (`styles.css:173`, `styles.css:721`) |
| Barra de resultado | `linear-gradient(90deg, color-mix(in srgb, var(--fuel) 60%, white), var(--fuel))`; no escuro, mistura com `#0b1310` |
| Barra de paridade | Verde do etanol; quando acima do limite, âmbar da gasolina |

### 6.6 Regras de uso

- Contraste de texto: `--text` sobre `--surface` e `--muted`/`--faint` apenas em textos auxiliares.
- Nunca usar as cores de combustível como fundo de texto longo; elas aparecem em ícones, barras, bordas e chips.
- Sombras são sempre derivadas de verde escuro (claro) ou preto (escuro), nunca de cinza neutro.
- O `<meta name="theme-color">` acompanha o tema: `#f2f6f1` no claro e `#0b1310` no escuro (`index.html:22`, `app.js:831-833`).

---

## 7. Tipografia

### 7.1 Família e base

```css
font-family: "Inter", "SF Pro Text", "Segoe UI", system-ui, -apple-system, sans-serif;
font-size: 16px;
line-height: 1.5;
-webkit-font-smoothing: antialiased;
text-rendering: optimizeLegibility;
```

Definido em `styles.css:72-76`. **Nenhuma webfont é carregada**: a interface usa Inter se instalada e, caso contrário, a fonte nativa do sistema (SF Pro no Apple, Segoe UI no Windows, Roboto no Android). `font-synthesis: none` evita negritos/itálicos sintéticos.

### 7.2 Pesos

| Peso | Uso típico |
|---|---|
| 600 | Subtítulos, legendas, textos de apoio |
| 650 | Unidade do custo |
| 700 | Labels, valores de input, botões de texto |
| 750 | Métricas, textos de destaque em insights |
| 800 | Títulos de seção, marca, CTA |
| 850 | Custo por km, badges, kicker, títulos do diálogo |

> Pesos 650/750/850 pressupõem fonte variável. Sem ela, o navegador arredonda para o peso disponível mais próximo.

### 7.3 Escala tipográfica

| Tamanho | Token implícito / uso | Onde |
|---|---|---|
| `0.5rem` | Sufixo "vs. melhor" | `.delta small` |
| `0.56rem` | Badge de status dos insights | `.status` |
| `0.58rem` | Badge "Mais econômico" | `.badge` |
| `0.6rem` | Rótulos de métricas, kicker do diálogo | `.metrics dt`, `.settings-kicker` |
| `0.64rem` | Legenda da barra de paridade | `.parity-legend` |
| `0.68rem` | Subtítulo da marca, consumo do card, delta, notas | `.brand-text span`, `.fuel-sub`, `.disclaimer` |
| `0.7rem` | Nota de dias por semana | `.settings-note` |
| `0.72rem` | Unidade "/km" | `.cost-unit` |
| `0.74rem` | Seletor de unidade | `.input-wrap.split select` |
| `0.75rem` | Botão "Restaurar" | `.text-btn` |
| `0.76rem` | Labels, filtros, hints | `.field label`, `.fuel-toggle`, `.settings-hint` |
| `0.78rem` | Texto de insights, toast | `.insight p`, `.toast` |
| `0.8rem` | Skip link, resumo do `<details>` | `.skip-link`, `.calc-details summary` |
| `0.82rem` | Estado vazio, métricas | `.result-empty`, `.metrics dd` |
| `0.83rem` | Título do CTA de configurações | `.settings-cta-copy strong` |
| `0.84rem` | Título de insight | `.insight-head h3` |
| `0.85rem` | Prefixo de moeda, aviso de noscript | `.affix`, `.noscript` |
| `0.88rem` | Botão principal; marca em telas ≤360px | `.primary-btn` |
| `0.92rem` | Nome do combustível | `.fuel-name h3` |
| `0.95rem` | Título de seção do diálogo | `.settings-section h3` |
| `0.98rem` | Nome da marca | `.brand-text strong` |
| `1rem` | Título dos resultados | `.results-head h2` |
| `1.02rem` | Valor de input e select | `.input-wrap input` |
| `1.05rem` | Título do painel | `.panel-head h2` |
| `1.15rem` | Título do diálogo | `.settings-head h2` |
| `clamp(1.5rem, 5vw, 1.85rem)` | Custo por km (destaque) | `.cost-value` |

### 7.4 Tracking (letter-spacing)

| Valor | Uso |
|---|---|
| `-0.045em` | Custo por km |
| `-0.03em` | Marca e título do diálogo |
| `-0.025em` | Título do painel |
| `-0.02em` | Título de resultados e seções |
| `-0.015em` | Nome do combustível, CTA |
| `-0.01em` | Métricas e botão principal |
| `+0.02em` | Subtítulo da marca |
| `+0.03em` | Seletor de moeda |
| `+0.055em` | "vs. melhor" (uppercase) |
| `+0.06em` | Status (uppercase) |
| `+0.07em` | Badge e rótulos de métricas (uppercase) |
| `+0.12em` | Kicker do diálogo (uppercase) |

### 7.5 Números

- Valores monetários e métricas usam `font-variant-numeric: tabular-nums` para evitar deslocamento durante o recálculo (`styles.css:415`, `styles.css:915`, `styles.css:970`).
- Custo por km: 3 casas decimais; projeções: 2 casas (ou 0 acima de 1.000).
- A formatação sempre passa por `Intl.NumberFormat` com o locale da moeda escolhida.

---

## 8. Layout, espaçamento e formas

### 8.1 Dimensões

| Token / medida | Valor | Uso |
|---|---|---|
| `--radius` | `26px` | Painéis e diálogo |
| `--shell` | `1180px` | Largura máxima do contêiner |
| Conteúdo | `820px` | Coluna central de formulário + resultados |
| Gutter mobile | `100% - 1.5rem` | Margem lateral mínima de 0.75rem |
| Gutter ≥700px | `100% - 2.5rem` | Margem lateral de 1.25rem |
| Altura de input | `52px` | Campos de texto |
| Botões de ícone | `40px` (36px ≤360px) | Topbar |
| Botão principal | `min-height: 48px` | "Concluir" |
| Diálogo | `min(560px, 100vw - 2rem)` | Desktop; tela cheia ≤600px |

### 8.2 Escala de espaçamento

A base é 4px; os valores em `rem` mais usados são: `0.2`, `0.25`, `0.3`, `0.35`, `0.4`, `0.45`, `0.5`, `0.55`, `0.6`, `0.65`, `0.7`, `0.75`, `0.8`, `0.9`, `0.95`, `1`, `1.15`, `1.2`, `1.3`, `1.35`, `1.4`, `1.5`, `1.8`.

| Contexto | Espaçamento |
|---|---|
| Padding do painel | `clamp(1.05rem, 3.6vw, 1.8rem)` |
| Gap entre cards | `0.65rem` |
| Gap entre campos | `0.7rem` |
| Padding interno do card | `0.95rem 1rem 0.85rem` (1rem 1.1rem em ≥1180px) |
| Padding do diálogo | `1.3rem` no corpo; `1.15rem 1.3rem 1rem` no cabeçalho |
| Separadores | `1.3rem` a `1.5rem` na vertical, linha tracejada |

### 8.3 Raios

| Raio | Aplicação |
|---|---|
| `999px` | Pills: moeda, botões de ícone, filtros, badges, toast |
| `26px` | Painéis, diálogo |
| `20px` | Cards, insights, `<details>`, estado vazio |
| `14px` | Inputs, botão principal |
| `13px` | Marca (logo) |
| `12px` | Ícone de combustível, skip link |
| `11px` | Ícone do CTA, marca em telas pequenas |
| `9px` | Ícone de insight |

### 8.4 Breakpoints

| Largura | Mudança |
|---|---|
| ≤360px | Topbar compacta, marca e botões menores, oculta espaçamentos maiores |
| ≤420px | Oculta o subtítulo "etanol · gasolina · elétrico" |
| ≥520px | Métricas em 4 colunas |
| ≥540px | Preços em 3 colunas |
| ≤600px | Diálogo em tela cheia (`100dvh`, sem borda/raio) |
| ≥700px | Gutter maior e gap de preços |
| ≥960px | Mais respiro vertical na topbar |
| ≥1180px | Padding maior nos cards |
| `prefers-reduced-motion` | Animações e transições reduzidas a ~0ms |
| `prefers-color-scheme` | Tema automático quando não há escolha manual |

### 8.5 Camadas (z-index)

| Camada | z-index | Elemento |
|---|---|---|
| Topbar | 40 | Header sticky |
| Toast | 90 | Aviso flutuante |
| Skip link | 100 | Acesso rápido |
| Diálogo | nativo (top layer) | `<dialog>` modal |

### 8.6 Movimento

- Entrada dos blocos: `rise` com 14px de deslocamento, 0.55s, `cubic-bezier(0.2, 0.8, 0.2, 1)` e atraso de 60/120ms.
- Barras: largura animada em 0.5–0.55s.
- Hover/active: 0.15s; ícones encolhem para 94% no `:active`.
- Tudo é neutralizado em `prefers-reduced-motion: reduce` (`styles.css:1413-1424`).

---

## 9. Componentes

| Componente | Classes principais | Comportamento |
|---|---|---|
| Topbar | `.topbar`, `.topbar-inner` | Sticky, fundo translúcido com `backdrop-filter`, borda inferior |
| Marca | `.brand`, `.brand-mark`, `.brand-text` | Ícone de raio em gradiente + nome e subtítulo |
| Seletor de moeda | `.currency-control` | Pill com globo, `<select>` nativo e chevron |
| Botão de tema | `.icon-btn` | Alterna claro/escuro; ícones sol/lua via CSS |
| Painel | `.panel`, `.form-panel` | Superfície com borda, raio 26px e sombra |
| Campo | `.field`, `.input-wrap`, `.affix`, `.suffix` | Input com prefixo/sufixo, foco com anel verde |
| Campo dividido | `.input-wrap.split` | Input de consumo + `<select>` de unidade |
| CTA de configurações | `.settings-cta` | Linha divisória tracejada, ícone, resumo e seta |
| Filtros | `.fuel-filter`, `.fuel-toggle` | Checkboxes estilizados; cor derivada de `data-fuel` |
| Card de resultado | `.result-card`, `.is-winner` | Barra lateral colorida, badge/delta, custo, barra e métricas |
| Métricas | `.metrics` | `<dl>` em 2 colunas (4 em ≥520px) |
| Insight | `.insight`, `.status`, `.parity-bar` | Análise textual + status + barra de paridade |
| Detalhes | `.calc-details` | `<details>` nativo com chevron animado |
| Diálogo | `.settings-dialog` | `<dialog>` modal, cabeçalho/corpo/rodapé fixos |
| Toast | `.toast` | Feedback temporário de 2,2s, `aria-live="polite"` |
| Estado vazio | `.result-empty` | Borda tracejada e mensagem centralizada |
| Skip link | `.skip-link` | Visível apenas no foco |
| Rodapé | `.app-footer`, `.app-version` | Versão do app e botão "Verificar atualização" no fim da página |

### 9.1 Estados interativos

| Estado | Tratamento |
|---|---|
| Hover | Bordas mudam para `--border-strong`; CTA ganha cor de etanol no título |
| Foco | `:focus-visible` com contorno de 2px em `--electric`; campos usam anel `--ring` |
| Ativo | `scale(0.94)` em botões de ícone; `0.99` no botão principal |
| Selecionado | Filtro usa `:has(input:checked)` + `--fuel-soft` |
| Erro/indisponível | Sem estado de erro formal; campos inválidos resultam em `—` |
| Vencedor | Borda e sombra na cor do combustível + badge |
| Desabilitado | Apenas via `hidden` no bloco de detalhes (sem botões desabilitados) |

---

## 10. Acessibilidade

| Recurso | Implementação |
|---|---|
| Idioma | `<html lang="pt-BR">` |
| Skip link | "Ir para o cálculo" como primeiro elemento focável |
| Título acessível | `<h1 class="sr-only">` descrevendo o comparador |
| Labels | Todo input tem `<label>` visível ou `.sr-only` |
| Agrupamento | Filtros em `role="group"` com `aria-label` |
| Diálogo | `<dialog aria-labelledby="settingsTitle">`, fechamento por Esc e clique no backdrop |
| Feedback | Toast com `role="status"` e `aria-live="polite"` |
| Atualização | Banner com `role="status"`, texto e botões nomeados; dispensa com "Agora não" |
| Ícones | `aria-hidden="true"` quando decorativos |
| Foco | `:focus-visible` global; anel de foco em campos e selects |
| Movimento | Respeito a `prefers-reduced-motion` |
| Área segura | Uso de `env(safe-area-inset-*)` no rodapé do diálogo e no toast |
| Toque | Alvos principais com 40–52px de altura |
| Contraste | Texto principal forte; textos auxiliares em `--muted`/`--faint` (revisar contraste de `--faint` sobre `--surface` se necessário) |

Pontos de atenção para auditoria futura: contraste de `--faint` em textos pequenos, tamanho mínimo de 15px nos checkboxes (atualmente 15×15px, com label clicável) e ausência de mensagens de erro explícitas para valores inválidos.

---

## 11. SEO e PWA

### 11.1 Metadados (`index.html:3-30`)

| Tag | Conteúdo |
|---|---|
| `title` | Custo por KM · Etanol, gasolina e elétrico |
| `meta description` | Comparação de custo por km entre etanol, gasolina e elétrico |
| `viewport` | `width=device-width, initial-scale=1, viewport-fit=cover` |
| `theme-color` | `#f2f6f1` (atualizado dinamicamente para `#0b1310` no escuro) |
| `color-scheme` | `light dark` |
| Apple | `apple-mobile-web-app-capable`, status bar `default`, título "Custo por KM" |
| Ícones | SVG, Apple touch 180px |
| Manifest | `manifest.webmanifest` |

### 11.2 Manifest

| Campo | Valor |
|---|---|
| `name` | Custo por KM — Comparador de combustível |
| `short_name` | Custo por KM |
| `lang` / `dir` | `pt-BR` / `ltr` |
| `start_url` / `scope` | `./` |
| `display` | `standalone` |
| `orientation` | `any` |
| `background_color` / `theme_color` | `#f2f6f1` |
| `categories` | `utilities`, `finance`, `travel` |
| Ícones | SVG any, 192, 512 e maskable 512 |

### 11.3 Estratégia offline

O app funciona offline após a primeira visita: HTML, CSS, JS, manifest e ícones são pré-cacheados na instalação. Navegações tentam a rede e caem para o `index.html` em cache; assets usam o cache imediatamente e se atualizam em segundo plano. Não há página de fallback offline dedicada além do próprio app.

### 11.4 Publicação

Por ser estático, pode ser publicado em GitHub Pages, Netlify, Vercel, Cloudflare Pages ou qualquer servidor de arquivos. Requisitos:

1. Servir via HTTPS (obrigatório para Service Worker fora de `localhost`).
2. Manter `sw.js` e `manifest.webmanifest` na raiz do escopo.
3. Incrementar a versão do cache a cada release.
4. Atualizar `start_url`/`scope` apenas se o app deixar de ser servido na raiz.

### 11.5 Atualização do app

O app verifica ativamente se existe uma versão nova e oferece a atualização ao usuário.

| Item | Implementação |
|---|---|
| Registro | `register("./sw.js", { updateViaCache: "none" })` |
| Gatilhos | `load`, `visibilitychange` (visível), `pageshow` (bfcache), `online`, intervalo de 30 min e botão manual |
| Throttle | 60 s entre checagens automáticas |
| Detecção | `registration.update()` + evento `updatefound` + `controllerchange` |
| Aviso | Banner fixo "Nova versão disponível" com "Atualizar agora" e "Agora não" |
| Aplicação | Recarrega a página; se houver worker em `waiting`, envia `SKIP_WAITING` e recarrega após 3 s |
| Primeira instalação | `hadController = false` evita reload no `clients.claim()` inicial |
| Versão visível | `APP_VERSION` no rodapé da página principal + checagem manual com feedback em toast |
| Cache HTTP | `vercel.json` força `no-cache` em `sw.js` e `index.html` |
| Migração | Quem já tinha o app instalado recebe a versão nova em até duas aberturas |

Fluxo resumido:

```
abertura/retomada
      │
      ▼
checkForUpdate() ──► registration.update()
      │                     │
      │                     ├─ sem mudança ──► toast "versão atual" (se manual)
      │                     └─ updatefound ──► novo SW instala
      ▼
controllerchange ──► banner "Nova versão disponível"
      │
      ▼
"Atualizar agora" ──► location.reload() ──► APP_VERSION nova em execução
```

> Ao publicar, altere **sempre** `CACHE` em `sw.js` e `APP_VERSION` em `app.js`. O `CACHE` dispara a atualização; o `APP_VERSION` informa o usuário.

---

## 12. Guia de manutenção

| Quero alterar… | Onde editar |
|---|---|
| Paleta clara | `assets/styles.css:1-26` (`:root`) |
| Paleta escura | `assets/styles.css:28-50` |
| Fonte ou tamanho base | `assets/styles.css:72-77` |
| Cor/efeito da marca | `assets/styles.css:166-176` |
| Raio dos painéis | `assets/styles.css:23` (`--radius`) |
| Largura máxima | `assets/styles.css:24` (`--shell`) e `.layout` em `294-301` |
| Layout responsivo | Media queries em `assets/styles.css:1305-1424` |
| Cores de combustível | `assets/styles.css:14-19`, `41-46` e mapeamento em `771-783` |
| Valores padrão (inputs) | `assets/app.js:24-53` e atributos `value` no `index.html` |
| Moedas disponíveis | `assets/app.js:9-22` + `<select id="currency">` no HTML |
| Unidades de consumo | `assets/app.js:58-68` + `<select>` correspondentes |
| Fórmulas de custo | `assets/app.js:466-471` |
| Projeções de período | `assets/app.js:55-56` e `510-513` |
| Textos de insights | `assets/app.js:613-683` |
| Chave de persistência | `assets/app.js:4` (migração exige tratar a chave antiga) |
| Versão exibida | `assets/app.js:5` e `index.html:158` |
| Checagem de atualização | `assets/app.js:989-1051` (gatilhos em `908-947`) |
| Banner e reload | `assets/app.js:959-987` e `index.html:279-290` |
| Headers de cache | `vercel.json` |
| Versão do cache offline | `sw.js:1` (incrementar sempre) |
| Lista de assets offline | `sw.js:2-12` |
| Metadados de instalação | `manifest.webmanifest` |
| Tema do navegador | `index.html:22` e `assets/app.js:831-833` |

### Checklist de release

- [ ] Testar cálculo com `km/L`, `L/100 km`, `km/kWh` e `kWh/100 km`.
- [ ] Verificar temas claro e escuro, incluindo troca automática do sistema.
- [ ] Testar troca de moeda (BRL, USD, EUR) e reformatação dos campos.
- [ ] Validar persistência após recarregar e o botão "Restaurar".
- [ ] Testar diálogo em desktop e em viewport ≤600px (tela cheia + safe area).
- [ ] Confirmar que filtros desativados saem do ranking e dos insights.
- [ ] Rodar Lighthouse (Performance/Acessibilidade/PWA) em HTTPS.
- [ ] Alterar `CACHE` no `sw.js` e `APP_VERSION` no `app.js` juntos.
- [ ] Testar o banner de atualização com o app instalado (Android e iOS) e a checagem manual.
- [ ] Confirmar que `sw.js` e `index.html` chegam com `Cache-Control: no-cache` na Vercel.
- [ ] Incrementar `CACHE` no `sw.js` e confirmar atualização em aba anônima.
- [ ] Atualizar este documento se tokens, fórmulas ou defaults mudarem.

---

## 13. Fora de escopo e evoluções sugeridas

Itens abaixo **não estão implementados**; servem como backlog.

| Evolução | Impacto | Observação |
|---|---|---|
| API de preços (ANP ou similar) | Alto | Exigiria backend/proxy por CORS e tratamento de indisponibilidade |
| Múltiplos veículos | Médio | Estado passaria a ser uma lista com veículo ativo |
| Histórico de cálculos | Médio | `localStorage` com versão e limite de registros |
| Exportar PDF/CSV | Baixo | Pode ser feito no cliente, sem servidor |
| Comparação com GNV/híbrido | Médio | Reaproveita o modelo de `FUELS` |
| i18n da interface | Alto | Extrair strings para dicionário e ajustar `lang` |
| Testes automatizados | Médio | Fórmulas puras são facilmente testáveis |
| Página offline dedicada | Baixo | Adicionar ao precache e ao fallback do SW |
| PWA screenshots/atalhos | Baixo | Enriquecer o manifest |

---

### Referências internas

- Estrutura e conteúdo: `index.html`
- Design system: `assets/styles.css`
- Lógica: `assets/app.js`
- Offline: `sw.js`
- Instalação: `manifest.webmanifest`

> Este documento descreve o código na data indicada no topo. Ao alterar tokens, fórmulas ou defaults, atualize as seções correspondentes e a versão do cache do Service Worker.
