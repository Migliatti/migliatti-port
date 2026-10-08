# Azul como segundo acento e motion dinâmico

Status: aceito (spec #89)

## Contexto

O ADR 0004 deixou o dourado `#d6a85f` como cor decorativa (`--cor-decorativa`) e o azul só no buraco negro da Hero. O dono do **Portfólio** quer o redesign v2 sem dourado, com o azul como segundo acento do site e com movimento bem dinâmico e fluido.

## Decisão

1. **O dourado sai por completo.** O valor `#d6a85f` deixa de existir no código, nos testes, nas ilustrações SVG e no gerador delas. O token `--cor-decorativa` continua, agora apontando para o azul; segue só em seletores decorativos (separadores de seção, fallback de céu, constelação e corpos).
2. **Azul é o segundo acento**: `--azul` = `hsl(214 88% 68%)` (`#66a4f5`), com `--on-azul` (`#171717`) para texto sobre ele. O acento neutro do ADR 0004 (pílula invertida) continua sendo o primeiro. O azul pode aparecer em UI (foco, hover de link, itens ativos, "Ver demo"), não em texto corrido. O uso em UI entra na fatia seguinte (P2).
3. **As cores aleatórias continuam.** O sorteio de matiz por ponto (ADR 0003, emenda #56: céu da Hero, constelação e corpos da Vitrine) não muda. Muda só a cor de reserva, a que o servidor entrega e que vale sem JavaScript: antes dourada, agora azul. O buraco negro segue com cor fixa (`--cor-buraco-negro`), que já é o mesmo azul.
4. **Motion dinâmico e fluido**: botões magnéticos, saída da Hero ao rolar, entradas ao rolar mais marcadas e com escalonamento, tokens de duração e curva compartilhados entre CSS e anime.js. As regras de texto legível antes de animar (ADR 0001) continuam (opacidade inicial >= 0.7, nada esconde conteúdo), mas a duração da entrada sobe de 500 para até 800ms (`--mov-lento`). Os botões são magnéticos só com mouse e fora da versão leve (`components/animacao/Magnetico.tsx`); as listas entram escalonadas (`.escalonar`, `--mov-escalonar`) e as entradas ao rolar sobem 64px e crescem de 0.96 a 1.
5. **Sem suporte a `prefers-reduced-motion`.** Decisão do dono: o site anima sempre. Saem os blocos `prefers-reduced-motion` do CSS, o desvio do `usePecaPreguicosa.ts` e da Vitrine, e os testes que dependem disso. A versão leve para celular fraco (`aparelho.ts`) continua, porque trata desempenho e não preferência.
6. **Ilhas em todas as seções.** O conteúdo de Outros projetos, Competências, Formação, Contato e das seções do estudo de caso passa a ficar em ilhas (`.ilha`), com espaço entre elas; a seção continua no fundo plano, nada aninha ilha e a Vitrine mantém a própria moldura. Evidências do estudo de caso ficam fora das ilhas de propósito: figuras e capturas já têm moldura própria. Isso amplia o ADR 0004, que limitava as ilhas aos cartões de projeto e de cargo. Todas as seções usam o componente `Secao` e a coluna do número fica estreita (4.5rem).
7. **Hero** (decisão da fatia P3): o nome diminui, o buraco negro vai de 76% para 80% da largura e a altura da Hero cai para `min(100svh - 7rem, 44rem)`, deixando a seção 01 na dobra. O conteúdo da Hero sai ao rolar (CSS com `animation-timeline: scroll()`), com o fundo em paralaxe. O fundo só se desloca (`translateY`), sem `scale`: a moldura tem 100vw e qualquer aumento gera rolagem horizontal.

## Aplicação em fatias

- P0 (este ADR e o `CONTEXT.md`) e P1 (tokens, higiene de cor, contraste, ilustrações) tiram o dourado e criam o azul.
- O P5 removeu `prefers-reduced-motion` do código e dos testes, criou os tokens de movimento (`components/animacao/movimento.ts` e `--mov-*`/`--ease-*` em `:root`, comparados por `lib/design/movimento.test.ts`) e o movimento novo.

## O que revisa

- ADR 0004: itens 3 (dourado decorativo) e 5 (o teste que exigia o dourado no token) e a "Alternativa adiada" (trocar o dourado por cinza) perdem efeito; o item 2 (acento neutro) fica e ganha o azul ao lado.
- ADR 0003: nas emendas, "dourado" lê-se "azul" (cor de reserva e de ilustração); a emenda #57 (buraco negro "complementar ao dourado") deixa de ter o dourado como referência. A regra de respeitar `prefers-reduced-motion` é substituída pelo item 5 daqui, quando o P5 entrar.
- ADR 0001: a "desligada com `prefers-reduced-motion`" também sai no P5.

## Consequências

- `lib/design/higiene-de-cor.test.ts` passa a banir o dourado em qualquer arquivo; `lib/design/contraste.test.ts` cobre o azul sobre fundo e superfícies.
- As ilustrações dos estudos de caso (`public/ilustracoes`) passam do dourado ao azul pelo gerador `scripts/gerar-ilustracao-labreserve.mjs`.
