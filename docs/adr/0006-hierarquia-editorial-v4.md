# Hierarquia editorial das seções

Status: aceito (issue #95)

## Contexto

O item 6 do ADR 0005 ampliou as ilhas a todas as seções. A repetição da mesma superfície e da mesma largura tornou os Projetos em destaque equivalentes entre si e deu a textos curtos de Formação e Contato o peso visual de cartões completos.

## Decisão

1. **Projetos em destaque têm hierarquia.** O primeiro cartão ocupa a largura da coluna de conteúdo. Os outros dois ficam lado a lado em telas largas e empilhados no celular. O primeiro continua na ordem editorial dos dados; não há nova classificação de projetos.
2. **Competências usam três colunas** em telas largas, com uma ilha por grupo. No celular os grupos se empilham. As células usam largura mínima zero para que textos e chips não alarguem a página.
3. **Formação e Contato ficam no fundo plano.** Títulos, texto, canais de contato e o botão do CV público compõem o conteúdo diretamente, sem uma ilha envolvendo a seção.
4. **O Estudo de caso usa duas colunas** em telas largas. O cabeçalho reúne título de um lado, resumo e links do outro; as seis seções de narrativa ocupam duas colunas, evitando a faixa vazia ao lado dos textos estreitos. No celular essas colunas se empilham. Stack e seções numeradas mantêm sua ordem no HTML e suas âncoras; Evidências ocupa toda a largura e conserva a própria moldura.
5. **O ritmo das seções permanece compartilhado.** A margem, o separador, a coluna de número e o título continuam definidos por `Secao`. Grades internas usam o mesmo intervalo entre cartões e não geram rolagem horizontal em 390px.

## O que revisa

O item 6 do ADR 0005 deixa de exigir ilhas em Formação e Contato. As ilhas continuam em Projetos em destaque, Outros projetos, Experiência profissional, Competências e no conteúdo textual das seções do Estudo de caso. A Vitrine mantém sua moldura e nenhuma ilha contém outra.

## Consequências

Os testes de layout verificam a diferença de largura dos Projetos em destaque, as três colunas de Competências, o cabeçalho do Estudo de caso e a ausência de ilhas em Formação e Contato. O conteúdo e os links continuam disponíveis no HTML sem JavaScript.
