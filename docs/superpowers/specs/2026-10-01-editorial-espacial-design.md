# Editorial espacial: design

Status: implementado (issues #35 a #41)

Origem: revisão da #11 ("Revisão final e lançamento"). Gabriel aprovou os textos, mas achou o design básico. Este spec evolui a identidade **Sinal** (`2026-09-30-identidade-visual-sinal-design.md`); não a substitui.

## Objetivo

Sair do visual "coluna única de texto": layout editorial largo, Hero em tela cheia, Vitrine espacial com anime.js e um HUD de dados, mantendo a leitura rápida de quem contrata ("quem é, o que construiu, como chamar").

## O que não muda

- Textos em `content/`, rotas, SEO, bilíngue pt/en, tema claro/escuro (`prefers-color-scheme`).
- Cores, fontes (Bricolage 800, Geist, Geist Mono) e botões em pílula do Sinal.
- Texto legível antes de qualquer animação e sem JavaScript.
- `prefers-reduced-motion: reduce` desliga o movimento; ninguém é forçado a receber animação.
- Só a **Vitrine** tem animação como **conteúdo**. O resto anima só como decoração: remover a animação não muda o significado.
- O CV público não afirma nada que o Portfólio não prove; por isso o HUD só usa dados verificáveis.

## Decisões

### 1. Limites de processamento (substitui trechos dos ADRs 0001 e 0002)

Cai: "só `transform`/`opacity`", "sem biblioteca de animação", "sem `animation-delay`", DPR 1.5 e teto de 700 traços da Vitrine.

Fica:

- Texto legível no primeiro quadro (`opacity` inicial >= 0.7, sem `visibility: hidden`). Escalonar com `animation-delay` é permitido, desde que o texto já comece legível.
- `prefers-reduced-motion: reduce`: sem animação; a Vitrine mostra SVG estático e o módulo do anime.js nunca é importado.
- Piso para celular fraco: `pointer: coarse`, `hardwareConcurrency` baixo ou `deviceMemory` baixo recebem a peça leve (menos órbitas, sem filtros). Sem medir FPS em runtime.
- Pausa fora da tela e com a aba oculta.
- Carga preguiçosa da peça (herdada do ADR 0002): nada de anime.js no bundle inicial.

### 2. anime.js

- Usado na Vitrine e em orquestrações complexas (HUD, entrada da Hero). Hover e entradas simples de seção ficam em CSS.
- v4, importando só os módulos usados, dentro do chunk da Vitrine.
- A Hero e as ilustrações dos estudos de caso podem importar um chunk próprio e pequeno; nenhum `import` estático no bundle da home.

### 3. Layout editorial

- Largura de `max-w-4xl` para ~1200px, grid assimétrico.
- Hero em `100svh`: nome gigante com a marca do acento, **Posicionamento** e dois botões. Só tipografia e fundo estrelado leve; sem foto.
- Seções numeradas (`01`, `02`...) com rótulo em Geist Mono; linhas finas no lugar de caixas.
- Projetos em destaque: cartão tipográfico grande com número, título, resumo e stack. O espaço de **Evidência** fica pronto para capturas futuras; sem imagens novas agora.
- Barra fixa fina: seletor de idioma, navegação por seção (seção atual marcada) e HUD resumido (ver 5). Em telas estreitas vira só idioma e seção atual.

### 4. Estética "terminal" (camada de acabamento)

- Rótulos e dados em Geist Mono, colchetes, prompt `>`, cursor piscando em um ponto só.
- Painéis com cantos marcados e scanlines sutis na Vitrine.
- Corpo e títulos continuam Bricolage/Geist. No tema claro o HUD usa `--accent-text` (contraste AA).
- Não é "site inteiro como terminal".

### 5. HUD de dados (só dados verificáveis)

| Origem | Dados |
|---|---|
| Ambiente do visitante (cliente) | hora local de São Paulo, viewport, tema, idioma, progresso de rolagem, coordenadas do ponteiro, seção atual |
| Site (calculados no build) | número de projetos, de projetos em destaque, de itens de stack distintos, data do build, SHA do commit |

- Nada vindo de API externa em runtime. Dados do GitHub ficam fora deste escopo.
- Barra fixa: versão resumida. Vitrine: versão densa.
- Sem JavaScript, o HUD mostra os dados do build como texto estático; os de cliente aparecem só depois da hidratação e nunca são necessários para ler a página.

### 6. Vitrine espacial

- Núcleo: sistema orbital em SVG animado com anime.js. Três corpos, um por pilar do Posicionamento (site, automação, diagnóstico); passar o mouse ou focar num corpo destaca o pilar e o texto correspondente.
- Camada de constelação: estrelas ligadas que o ponteiro "puxa" e voltam em mola.
- Fundo: estrelas em parallax por camadas.
- Moldura de HUD ao redor (item 5).
- Fallbacks: reduced-motion = SVG estático (órbitas paradas); celular fraco = menos órbitas e sem constelação nem parallax.
- O campo de fluxo em Canvas atual (`campoDeFluxo.ts`) é removido; `PecaDaVitrine.tsx` mantém o molde do ADR 0002 (IntersectionObserver, `data-estado`, import dinâmico).
- Texto da seção continua em `content/vitrine/{pt,en}.json`, renderizado no servidor. A descrição atual cita "Canvas puro, sem bibliotecas" e precisa ser reescrita (Gabriel revisa o texto novo).
- Acessível: os corpos orbitais são focáveis por teclado; o rótulo da peça descreve o conteúdo.

### 7. Animação leve fora da Vitrine

- Hero: fundo estrelado com movimento mínimo, ligado à rolagem sem custo de layout.
- Estudos de caso: as quatro ilustrações SVG (`public/ilustracoes/*`) ganham pulso/fluxo sutil. Continuam com rótulo "Ilustração" e texto alternativo; a animação não altera o que a ilustração afirma.
- Ilustração animada exige SVG inline ou `<object>` (hoje é `<img>`, que não anima por CSS externo); a escolha fica para a issue 4.

## Entrega: quatro issues, cada uma publicável sozinha, bloqueando a #11

1. **Regras e termos.** ADR 0003 (substitui as regras acima nos ADRs 0001 e 0002, com nota de "substituído em parte"), atualização do `CONTEXT.md` (Vitrine, Animação de entrada, definição de "animação decorativa", **HUD**) e testes de contraste do HUD.
2. **Layout editorial.** Largura/grid, Hero em tela cheia, seções numeradas, cartões tipográficos, barra fixa com navegação e HUD resumido.
3. **Vitrine espacial.** anime.js, órbitas, constelação, parallax, HUD denso, fallbacks, texto novo (aprovado por Gabriel).
4. **Animação leve.** Fundo da Hero e ilustrações dos estudos de caso.

Ordem: 1, 2, 3, 4. A 3 é o maior risco e fica isolada.

## Testes

Segue o molde de `tests/e2e/vitrine.spec.ts` e `tests/e2e/animacao.spec.ts`. Sem teste de pixel nem de FPS.

- Texto da Vitrine e da Hero presente no HTML do servidor e legível no primeiro quadro.
- `reducedMotion: "reduce"`: o chunk do anime.js não é baixado; `data-estado="reduzida"`; sem animações CSS.
- Emulação de `pointer: coarse`: `data-estado` indica a versão leve.
- Carga preguiçosa: o chunk só é baixado quando a seção entra na tela; marca no conteúdo do chunk, como hoje.
- Foco por teclado em cada corpo orbital e em todos os botões.
- HUD: dados de build presentes e coerentes com `content/` (nº de projetos); sem requisições a hosts externos.
- Contraste AA do HUD nos dois temas (`lib/design/contraste.test.ts`).
- 320px sem rolagem horizontal; barra fixa não cobre âncoras (`scroll-margin-top`).
- Testes existentes que dependem das regras antigas (ex.: transform/opacity, DPR) são atualizados na issue 1 ou 3, não removidos em silêncio.

## Riscos

- **Peso e desempenho no celular:** mitigado por carga preguiçosa, versão leve e pausa fora da tela. Verificar o tamanho do chunk no build e registrá-lo no ADR 0003.
- **Barra fixa em tela pequena:** mantém só idioma e seção atual.
- **Estética terminal brigando com o Sinal:** limitada à camada de acabamento (item 4).
- **Texto da Vitrine muda:** passa pela aprovação de Gabriel antes do fechamento da #11.

## Fora do escopo

Foto ou capturas novas, dados do GitHub no HUD, botão de alternar tema, novas seções ou textos além da descrição da Vitrine.
