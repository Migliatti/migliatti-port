# Identidade visual "Sinal": design

Status: rascunho para revisão

## Objetivo

O site hoje usa o visual padrão do Next (branco e preto, fonte de sistema) e parece genérico. O objetivo é dar identidade ao **Portfólio**, com um visual ousado e com movimento, sem perder a leitura rápida que quem contrata precisa ter ("quem é, o que já construiu, como chamar").

Direção escolhida: **Sinal** (grafite-esverdeado, acento verde-limão, tipografia grande e pesada), entre três opções mostradas em mockup.

## Restrições herdadas

- `CONTEXT.md`: animação como conteúdo só na **Vitrine**; resto do site anima sem atrasar ou esconder texto; `prefers-reduced-motion` desliga tudo; leve no celular.
- `docs/adr/0001-animacao-de-entrada.md`: `opacity` inicial >= 0.7, sem `animation-delay`, sem esperar JS para mostrar texto, só `transform` e `opacity`, sem biblioteca de animação, cobertura e2e.
- `docs/adr/0002-vitrine.md`: a peça da Vitrine não muda.
- Bilíngue (pt/en), tema claro e escuro, SEO e rotas inalterados.

## Sistema visual

### Cor (um acento só)

| Token | Escuro | Claro |
|---|---|---|
| `--background` | `#0E0F0C` | `#F3F4EF` |
| `--foreground` | `#ECEDE6` | `#11120E` |
| `--muted` | `#A9ABA0` | `#4B4E43` |
| `--accent` (fundo de botão, marca-texto) | `#C4F25A` | `#C4F25A` |
| `--on-accent` (texto sobre o acento) | `#0E0F0C` | `#11120E` |
| `--accent-text` (acento usado como cor de texto) | `#C4F25A` | `#3F5A00` |

- Sem preto ou branco puros.
- O limão não tem contraste como texto sobre fundo claro, por isso no tema claro ele só aparece como preenchimento, com `--on-accent` por cima. Como cor de texto usa `--accent-text`.
- O tema segue `prefers-color-scheme`, como hoje. Sem botão de alternância neste escopo.
- Todos os pares texto/fundo devem passar WCAG AA (4.5:1 corpo, 3:1 texto grande); valores finais a confirmar na implementação.

### Tipografia

Carregada com `next/font` (sem `<link>`), exposta como variáveis CSS:

- Títulos: Bricolage Grotesque, peso 800.
- Corpo: Geist.
- Rótulos pequenos (nomes de projeto, stack): Geist Mono.

Sem serifa, sem Inter.

### Forma

- Botões e chips: pílula (raio total).
- Blocos: um único raio, 12px.
- Cartões só onde houver hierarquia real; o resto usa espaço e linhas.

### Hero

- Título de até 2 linhas, uma palavra-chave no acento (marca-texto).
- Subtítulo: o **Posicionamento** oficial, vindo de `content/home`, sem alteração de texto.
- Um botão primário (contato, preenchido com o acento) e um secundário (projetos, contorno).
- Sem faixa decorativa, sem selo de versão, sem indicador de rolagem.

## Movimento

Sem dependência nova. CSS (`transform` e `opacity`) e, onde preciso, um pequeno componente cliente com `IntersectionObserver`.

| Movimento | Para que serve |
|---|---|
| Título do hero entra com as palavras juntas, variando distância e duração (sem `animation-delay`) | hierarquia |
| Seções revelam ao entrar na tela (mantém o comportamento das issues #17 e #20) | narrativa |
| Botões sobem no hover e afundam no clique | feedback |
| Marca-texto do acento "desenha" sob a palavra-chave | hierarquia |

Regras do ADR 0001 seguem valendo. Este trabalho **estende** o ADR com os novos movimentos, sem contradizê-lo: o escalonamento por atraso que foi cogitado no mockup fica de fora por violar a regra 1.

## Escopo

Muda:

- `app/globals.css` (tokens, tipografia, animações)
- `app/[lang]/layout.tsx` (fontes)
- `app/[lang]/page.tsx` (hero)
- `components/`: `ProjetoCard`, `OutrosProjetos`, `Curriculo`, `Contato`, `LanguageSelector`, `Vitrine` (só paleta e tipografia)
- `app/[lang]/projetos/[id]/page.tsx` (estudo de caso)
- `app/[lang]/opengraph-image.tsx` e `app/[lang]/projetos/[id]/opengraph-image.tsx` (paleta)
- `docs/adr/0001-animacao-de-entrada.md` (extensão com o novo vocabulário de movimento)

Não muda: `content/`, rotas, textos, ordem das seções, metadados de SEO, peça da Vitrine.

## Verificação

- `npm run typecheck`, `npm run lint`, `npm test` e `npm run test:e2e` passando.
- e2e novo para cada animação nova, no molde de `tests/e2e/animacao.spec.ts`: texto visível no primeiro quadro e `animationName: none` com `reducedMotion: "reduce"`.
- Conferência manual nos temas claro e escuro, em celular e desktop.
- Contraste AA nos dois temas.
- Auditoria final com a skill `web-design-guidelines`.

## Fora de escopo

- Reescrita de conteúdo ou mudança de estrutura de seções.
- Botão de alternância de tema.
- Biblioteca de animação (Motion, GSAP).
- Novas imagens ou ilustrações.
