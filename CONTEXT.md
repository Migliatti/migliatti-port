# Portfólio

Site pessoal de Gabriel Migliatti Parizi para conseguir vaga (estágio ou júnior) e também projetos freelance. O leitor é quem contrata, seja recrutador ou cliente: precisa entender rápido quem ele é, o que já construiu e como chamá-lo. O nível (estágio, júnior) aparece só no **CV público**, não no **Posicionamento**.

## Language

**Portfólio**:
O site inteiro, publicado em português e inglês, cujo objetivo é gerar contato de recrutadores.
_Avoid_: Página, landing

**Posicionamento**:
A frase que diz quem Gabriel é profissionalmente: "Desenvolvedor full-stack que usa IA para entregar sites, automações e diagnósticos". Não traz nível; o desenvolvimento é o substantivo e a IA é o diferencial.
_Avoid_: Slogan, bio

**Projeto em destaque**:
Projeto com página própria de estudo de caso. São três: `kepler-lab`, `labreserve` e `grimoire`.
_Avoid_: Projeto principal, featured

**Outro projeto**:
Projeto listado com uma linha e link, sem estudo de caso: `rubicon-archive`, `sciencily`, `relogio-do-lead` (automação em n8n, pouco desenvolvida) e o site da ONG "Mãos que Transformam".
_Avoid_: Projeto secundário

**Estudo de caso**:
Página de um projeto em destaque que conta o problema, as decisões, a stack, o resultado, o aprendizado e como a IA foi usada (harness, `CONTEXT.md`, ADRs, testes), com links para os arquivos reais do repositório.
_Avoid_: Detalhe do projeto, case

**Demo**:
Versão do projeto publicada online e navegável. Só `kepler-lab` e `rubicon-archive` têm.
_Avoid_: Preview, deploy

**Evidência**:
O que substitui o demo quando não há um: capturas de tela, GIF, ilustração, trecho de código, resultado de testes e link do repositório. Captura e GIF mostram só o projeto rodando de verdade; diagrama ou imagem feita para o site é **ilustração** e aparece com esse rótulo visível e texto alternativo. Trecho de código e resultado de testes vêm do repositório real, sem alteração.
_Avoid_: Prova, screenshot

**CV público**:
PDF baixável pelo site, sem telefone e com cidade só como "São Paulo, SP". Deriva do **Portfólio**: nunca afirma algo que o Portfólio não prova. Usa o mesmo **Posicionamento** e é o único lugar onde aparece o nível (estágio, júnior).
_Avoid_: Currículo completo, CV atual

**Vitrine**:
Seção com uma peça de animação de assinatura, desenvolvida com IA. Mostra o que Gabriel entrega em site; não é projeto nem estudo de caso. Só a Vitrine tem animação como conteúdo. O resto do site tem apenas **Animação decorativa**, e nenhuma esconde texto: o conteúdo já está legível antes de animar. Toda animação respeita `prefers-reduced-motion` e tem versão leve para celular fraco. A peça usa anime.js e só carrega quando a seção entra na tela; regras em `docs/adr/0003-editorial-espacial-animejs.md` (que substitui em parte `docs/adr/0002-vitrine.md`).
_Avoid_: Demo (já significa projeto publicado), Galeria

**Animação decorativa**:
Animação cuja remoção não muda o significado do conteúdo. É tudo o que fica fora da **Vitrine**. Nunca esconde texto; segue as regras do ADR 0003.
_Avoid_: Efeito

**HUD**:
Painel de dados só verificáveis. Cliente: hora local de São Paulo, viewport, tema, idioma, progresso de rolagem, ponteiro e seção atual. Build: número de projetos, destaque, stack distinta, data do build e SHA. Sem API externa em runtime. Sem JavaScript mostra os dados de build como texto estático. Barra fixa resumida; na Vitrine, versão densa.
_Avoid_: Dashboard, métricas

**Animação de entrada**:
Animação curta (até ~500ms, em CSS) aplicada com a classe `animacao-entrada`. Texto legível desde o primeiro quadro, desligada com `prefers-reduced-motion`. Regra em `docs/adr/0001-animacao-de-entrada.md`, revista em parte por `docs/adr/0003-editorial-espacial-animejs.md`.
_Avoid_: Efeito, transição de página

**Experiência profissional**:
Seção curta com os cargos de Speedpro/Trio Engenharia e Aloha011, focada em automação e diagnóstico.
_Avoid_: Trabalhos, histórico

**Canal de contato**:
Forma de falar com Gabriel exposta no site: e-mail, LinkedIn e GitHub. Não há formulário nem telefone.
_Avoid_: Formulário de contato
