# Identidade grafite com ilhas

Status: aceito (spec #81, issues #82 a #86 entregues); revisto em parte pelo ADR 0005 (o dourado decorativo sai; o azul é o segundo acento)

## Contexto

O **Portfólio** tinha um tema escuro e dourado (issue #54), com o dourado em links, botões e bordas, e a direção "editorial espacial" do ADR 0003. Gabriel quer a mesma identidade do seu projeto yasb-graphite-islands: base grafite neutra, grupos de conteúdo em "ilhas" elevadas, destaque por pílula invertida e cor reservada para sinal.

## Decisão

1. **Tema único escuro grafite**, sem alternância (a issue #54 continua valendo nisso). Tokens em `app/globals.css`: base `#171717`; superfícies `#242424` e `#2c2c2c`; borda de luz `#3a3a3a`; detalhe `#333333`; sombra de borda `#111111`; hover `#363636`; texto `#f0f0f0` e `#a6a6a6`; estados verde `#9ccc9c`, âmbar `#e0c07a` e vermelho `#e08080`.
2. **Acento neutro**: `accent` é a pílula invertida (`#e6e6e6`) com `on-accent` `#171717`; `accent-text` é o texto neutro. O sublinhado de links usa cinza neutro. Links e botões se destacam por forma e inversão, não por cor.
3. **Dourado decorativo**: `#d6a85f` deixa de ser o acento e passa a ser o valor próprio do token `--cor-decorativa`, o único lugar do código com essa cor. Só pinta animações decorativas (céu, constelação, corpos da Vitrine, separadores de seção); nunca texto, link, botão ou borda de UI. O azul do buraco negro e seu núcleo claro ficam como estão, e os módulos que sorteiam matiz (ADR 0003, emenda #56) não mudam.
4. **Âmbar** só em sinais pontuais, nunca decoração.
5. **Testes**: `lib/design/contraste.test.ts` cobre cada par texto/fundo (>= 4.5 para texto, >= 3 para componentes) sobre fundo e as duas superfícies. `lib/design/higiene-de-cor.test.ts` deixa de banir `#171717` (agora é a base), continua banindo branco e preto puros, as paletas antigas (inclusive a escura e dourada da issue #54) e exige que o dourado apareça só no token decorativo, que por sua vez só é usado por seletores decorativos.
6. **Imagem de compartilhamento** (`lib/seo/imagem.tsx`) usa a nova paleta, com a barra em `#e6e6e6`.

## O que revisa

- ADR 0003: nas emendas, "dourado" e `--accent` como cor padrão decorativa passam a ser `--cor-decorativa`; o buraco negro continua complementar ao dourado (azul). As demais regras de animação seguem.
- Issue #54: sai a paleta dourada de UI; fica o tema único escuro.

## Alternativa adiada

Trocar o dourado decorativo por cinza claro, deixando o site sem nenhuma cor fora de sinal. Fica em aberto e é revisável depois, sem mudar a UI, porque a cor vive num único token.

## Consequências

- As fatias da spec #81 foram entregues: tokens e ADR (#82, commit `5b7ac66`), remoção do Sciencily (#83, `a622df7`), barra flutuante (#84), cartões como ilhas (#85) e Vitrine sobre o grafite (#86, `d529b6c`). Entraram na `main` pelos PRs #87 e #88.
- A spec #89, entregue pelo PR #90, revisou a #81 conforme o ADR 0005: azul substitui o dourado, inclusive nas ilustrações SVG dos estudos de caso; âncora ativa azul; ilhas nas demais seções; animação sempre ativa; menu hambúrguer no celular substitui a barra em duas linhas. Ao verificar a #81, essas decisões posteriores prevalecem.
- Fontes mantidas; revisão em outra rodada.
