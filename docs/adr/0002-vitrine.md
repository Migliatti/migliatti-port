# Vitrine: Canvas 2D próprio, carregado só ao chegar na seção

Status: aceito (issue #19); substituído em parte pelo ADR 0003 (issue #35)

## Contexto

A **Vitrine** é o único lugar onde a animação é o conteúdo (ver ADR 0001). A peça é mais pesada que uma Animação de entrada, mas não pode atrasar a home, esconder texto, ignorar `prefers-reduced-motion` nem travar o celular.

## Decisão

1. **Técnica**: campo de fluxo em Canvas 2D escrito à mão (`components/vitrine/campoDeFluxo.ts`), sem bibliotecas [substituído em parte pelo ADR 0003 (issue #35): anime.js v4]. Nada de WebGL/three.js: o efeito não precisa, e uma dependência nova pesaria mais que a peça inteira.
2. **Texto primeiro**: título e descrição vêm de `content/vitrine/{pt,en}.json` e são renderizados no servidor (`components/Vitrine.tsx`). Legíveis sem JavaScript e sem animação.
3. **Carga preguiçosa**: `components/vitrine/PecaDaVitrine.tsx` (único client component) observa a seção com `IntersectionObserver` e só então faz `import("./campoDeFluxo")`, que vira um chunk separado. Nenhum `import` estático desse módulo em outro lugar, senão ele volta ao bundle inicial.
4. **Movimento reduzido**: com `prefers-reduced-motion: reduce` o módulo nunca é importado; fica a imagem estática (SVG inline). A preferência é ouvida em tempo real: se mudar para `reduce`, a peça é destruída.
5. **Celular**: DPR limitado a 1.5, número de traços proporcional à área (teto de 700) [DPR e teto substituídos em parte pelo ADR 0003: versão leve], 30 quadros por segundo em aparelhos com poucos núcleos ou toque, pausa fora da tela e com a aba oculta.
6. **Estado observável**: `data-estado` em `[data-testid="vitrine-peca"]` (`aguardando`, `carregando`, `carregada`, `reduzida`). O e2e (`tests/e2e/vitrine.spec.ts`) usa o estado e o conteúdo dos chunks baixados (marca `vitrine-campo-de-fluxo`) para provar a carga preguiçosa.

## Consequências

Sem dependências novas [substituído em parte pelo ADR 0003 (issue #35): entra anime.js v4]. Uma peça futura da Vitrine segue o mesmo molde: módulo próprio importado só por `PecaDaVitrine`, estado em `data-estado` e fallback estático.
