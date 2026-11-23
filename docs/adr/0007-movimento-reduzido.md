# Movimento reduzido

Status: aceito; substitui a parte "o site anima sempre" dos ADRs 0001 e 0005

## Contexto

O ADR 0005 (item 5) removeu `prefers-reduced-motion` por decisão do dono: o site animava sempre. Uma auditoria de design apontou isso como o maior risco de acessibilidade: entradas que deslocam 24 a 48px, saída da Hero e fundo em paralaxe ligados à rolagem, órbitas e constelação em loop e um céu que cintila. Quem pede movimento reduzido no sistema tem o pedido ignorado.

## Decisão

1. **Com `prefers-reduced-motion: reduce`, a entrada vira um fade curto.** `animacao-entrada`, `animacao-titulo`, `animacao-ao-rolar` e as âncoras do menu usam `entrada-reduzida`: só `opacity` (0.7 a 1, `--mov-rapido`), sem `translate` e sem escalonar. O texto continua legível desde o primeiro quadro (regra 1 do ADR 0001).
2. **O que é contínuo ou ligado a rolagem e ponteiro fica parado.** A saída da Hero e o traço do separador (`animation-timeline`) e o cursor do HUD ficam sem animação. As peças em JavaScript (céu, buraco negro, grade de fundo, Vitrine, constelação, pulso das ilustrações) desenham o quadro de repouso: o céu com as estrelas fixas, o buraco negro na pose final, as órbitas nos ângulos iniciais, a constelação sem mola nem parallax, a grade sem parallax e a ilustração sem decoração. Nenhum laço, nenhum ouvinte de rolagem ou de ponteiro.
3. **Feedback de estado continua.** Hover, foco, o menu abrindo e o destaque de pilar na Vitrine (CSS) seguem como estão: respondem a uma ação do leitor, não são decoração.
4. **Uma checagem só.** `components/animacao/movimento-reduzido.ts` exporta `movimentoReduzido()` e `aoMudarMovimentoReduzido()`. `usePecaPreguicosa` assina a mudança: ao alternar a preferência, a peça é destruída e refeita sob a nova regra. A Vitrine passou a usar o mesmo hook.
5. **O resto do ADR 0005 fica**: `aparelho.ts` (versão leve para celular fraco) trata desempenho, não preferência, e continua independente. Os dois somam: um celular fraco com movimento reduzido recebe a versão leve parada.

## O que revisa

- ADR 0001: a regra 2 ("toda animação respeita `prefers-reduced-motion`") volta, na forma do item 1 (fade em vez de elemento parado).
- ADR 0005: o item 5 ("sem suporte a `prefers-reduced-motion`") deixa de valer. Os tokens de movimento e o resto do motion dinâmico seguem.
- `CONTEXT.md` (Vitrine e Animação decorativa) passa a citar este ADR.

## Consequências

- Teste unitário de `movimento-reduzido.ts` e e2e com `reducedMotion: "reduce"` em `tests/e2e/movimento-reduzido.spec.ts`.
- Novas animações precisam trazer a versão reduzida no mesmo bloco ao fim de `app/globals.css` ou, em JavaScript, consultar `movimentoReduzido()`.
