# Correções adiadas da identidade Sinal: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar os achados menores da revisão final do PR #34: barra do nome que quebra de forma estranha, hover "grudento" no toque, raio da Vitrine, cores antigas no código e testes que passariam com o código quebrado.

**Architecture:** Mudanças pequenas e independentes sobre o que já existe: um ajuste em `Hero.tsx` e no CSS da barra, uma regra `@media (hover: hover)`, dois valores em `PecaDaVitrine` e `campoDeFluxo`, e testes novos ou reforçados em `tests/e2e/identidade.spec.ts` e `lib/design/`. Nenhuma dependência nova.

**Tech Stack:** Next 16, React 19, Tailwind v4, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-30-identidade-visual-sinal-design.md` (seções "Forma", "Cor" e "Movimento"); os achados vêm da revisão final do plano `docs/superpowers/plans/2026-09-30-identidade-visual-sinal.md`.

## Global Constraints

- Sem `animation-delay`; `opacity` inicial >= 0.7; só `transform` e `opacity`; duração <= 500ms; tudo dentro de `@media (prefers-reduced-motion: no-preference)` (ADR 0001).
- Sem dependência nova no `package.json`.
- Um acento só: `#C4F25A`; como cor de texto, só `--accent-text`.
- Sem `#000000` e sem `#ffffff` em nenhum arquivo de código.
- Forma: botões e chips em pílula (`9999px`), blocos com raio 12px.
- Não alterar `content/`, rotas, textos existentes, ordem das seções nem metadados de SEO.
- Nenhum travessão longo (`—`) nem `–` em texto visível novo.

## Review Focus

1. Nome de duas palavras em 375px quebra em duas linhas e cada palavra tem a própria barra, sem barra mais larga que o texto (Task 1).
2. Toque no celular não deixa o botão levantado; o hover só existe em ponteiro com hover (Task 2).
3. Hover e clique realmente movem o botão com movimento normal e não movem com movimento reduzido (Task 2).
4. Cor pura, cor da paleta antiga ou acento usado como texto não voltam ao código (Task 3).
5. Com as fontes bloqueadas o texto continua legível, e todos os tipos de botão têm foco visível (Task 4).

---

### Task 1: Barra do acento por palavra

**Files:**
- Modify: `components/Hero.tsx`
- Modify: `app/globals.css` (regra `.marca-acento::after`)
- Test: `tests/e2e/identidade.spec.ts`

**Interfaces:**
- Consumes: classe `.marca-acento` e keyframes `marca-acento` (já existem em `app/globals.css`).
- Produces: o `h1` passa a conter um `<span class="marca-acento">` por palavra do nome, separados por espaço.

- [ ] **Step 1: Write the failing test**

Acrescentar ao final de `tests/e2e/identidade.spec.ts`:

```ts
for (const path of paths) {
  test(`em 375px cada palavra do nome tem a própria barra, numa linha só ${path}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    const trechos = await page.locator("h1 .marca-acento").evaluateAll((els) =>
      els.map((el) => {
        const css = getComputedStyle(el);
        return {
          altura: el.getBoundingClientRect().height,
          largura: el.getBoundingClientRect().width,
          linha: parseFloat(css.lineHeight),
          fonte: parseFloat(css.fontSize),
          barra: parseFloat(getComputedStyle(el, "::after").width),
        };
      }),
    );
    expect(trechos.length).toBeGreaterThan(1);
    for (const t of trechos) {
      expect(t.altura).toBeLessThanOrEqual(t.linha * 1.1);
      expect(t.barra).toBeLessThanOrEqual(t.largura + t.fonte * 0.25 + 1);
    }
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/e2e/identidade.spec.ts -g "própria barra"`
Expected: FAIL (`trechos.length` é 1, hoje há um `.marca-acento` só para o nome inteiro).

- [ ] **Step 3: Write minimal implementation**

Em `components/Hero.tsx`, acrescentar `import { Fragment } from "react";` como primeira linha e trocar

```tsx
        <span className="marca-acento">{nome}</span>
```

por

```tsx
        {nome.split(" ").map((palavra, i) => (
          <Fragment key={`${palavra}-${i}`}>
            {i > 0 && " "}
            <span className="marca-acento">{palavra}</span>
          </Fragment>
        ))}
```

Em `app/globals.css`, logo depois do bloco `.marca-acento::after { ... }`, acrescentar:

```css
/* A barra de uma palavra que não é a última cobre também o espaço depois dela. */
.marca-acento:not(:last-child)::after {
  right: -0.25em;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx playwright test tests/e2e/identidade.spec.ts tests/e2e/home.spec.ts tests/e2e/animacao.spec.ts`
Expected: PASS (o texto do `h1` continua "Gabriel Migliatti").

- [ ] **Step 5: Commit**

```bash
git add components/Hero.tsx app/globals.css tests/e2e/identidade.spec.ts
git commit -m "Barra do acento por palavra do nome"
```

---

### Task 2: Hover só com ponteiro que passa o mouse, e testes de movimento reais

**Files:**
- Modify: `app/globals.css` (bloco `no-preference`, regra `.botao:hover`)
- Test: `tests/e2e/identidade.spec.ts`

**Interfaces:**
- Consumes: classe `.botao`, `.botao-secundario` (hero "Ver projetos"), `.marca-acento::after`.
- Produces: `.botao:hover` dentro de `@media (prefers-reduced-motion: no-preference) and (hover: hover)`, definida **antes** de `.botao:active` para o clique vencer o hover.

- [ ] **Step 1: Write the failing test**

Acrescentar ao final de `tests/e2e/identidade.spec.ts`:

```ts
test.describe("movimento dos botões", () => {
  const transformar = (n: Element) => getComputedStyle(n).transform;

  test("hover eleva 3px e o clique afunda, com movimento normal", async ({
    page,
  }) => {
    await page.goto("/pt");
    const botao = page.locator("a.botao-secundario").first();
    await botao.hover();
    await expect
      .poll(() => botao.evaluate(transformar))
      .toBe("matrix(1, 0, 0, 1, 0, -3)");
    await page.mouse.down();
    await expect
      .poll(() => botao.evaluate(transformar))
      .toBe("matrix(0.97, 0, 0, 0.97, 0, 0)");
    await page.mouse.up();
  });

  test("com movimento reduzido hover e clique não movem o botão", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/pt");
    const botao = page.locator("a.botao-secundario").first();
    await botao.hover();
    expect(await botao.evaluate(transformar)).toBe("none");
    await page.mouse.down();
    expect(await botao.evaluate(transformar)).toBe("none");
    await page.mouse.up();
  });

  test("a elevação por hover só vale para ponteiro com hover", async ({
    page,
  }) => {
    await page.goto("/pt");
    const condicoes = await page.evaluate(() => {
      const achadas: string[] = [];
      const visitar = (lista: CSSRuleList, pais: string[]) => {
        for (const regra of Array.from(lista)) {
          const nova =
            regra instanceof CSSMediaRule
              ? [...pais, regra.media.mediaText]
              : pais;
          if (
            regra instanceof CSSStyleRule &&
            regra.selectorText.includes(".botao:hover")
          ) {
            achadas.push(pais.join(" | "));
          }
          if ("cssRules" in regra) {
            visitar((regra as CSSGroupingRule).cssRules, nova);
          }
        }
      };
      for (const folha of Array.from(document.styleSheets)) {
        visitar(folha.cssRules, []);
      }
      return achadas;
    });
    expect(condicoes.length).toBeGreaterThan(0);
    for (const c of condicoes) expect(c).toContain("hover: hover");
  });

  test("a barra do nome anima com movimento normal", async ({ page }) => {
    await page.goto("/pt");
    const nome = await page.evaluate(
      () =>
        getComputedStyle(document.querySelector("h1 .marca-acento")!, "::after")
          .animationName,
    );
    expect(nome).toBe("marca-acento");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/e2e/identidade.spec.ts -g "movimento dos botões"`
Expected: FAIL só em "a elevação por hover só vale para ponteiro com hover" (a condição atual não contém `hover: hover`). Os outros três já passam, e isso é esperado: são testes de proteção contra regressão; a verificação deles é o passo de mutação abaixo.

- [ ] **Step 3: Write minimal implementation**

Em `app/globals.css`, remover do bloco `@media (prefers-reduced-motion: no-preference)` a regra

```css
  .botao:hover {
    transform: translateY(-3px);
  }
```

e, imediatamente **antes** do comentário `/* Movimento da identidade ... */`, acrescentar:

```css
/* Hover só onde existe ponteiro que passa o mouse: no toque o botão não fica levantado. */
@media (prefers-reduced-motion: no-preference) and (hover: hover) {
  .botao:hover {
    transform: translateY(-3px);
  }
}
```

(`.botao:active` continua no bloco `no-preference` original, depois desta regra, então o clique vence o hover.)

- [ ] **Step 4: Run test to verify it passes, then prove the guards bite**

Run: `npx playwright test tests/e2e/identidade.spec.ts -g "movimento dos botões"`
Expected: PASS.

Mutação (desfazer depois de cada uma com `git checkout app/globals.css`):
1. Apagar a regra `.botao:active { ... }` e rodar o comando acima. Expected: FAIL em "hover eleva 3px e o clique afunda".
2. Apagar a regra `.botao:hover { ... }` e rodar. Expected: FAIL no mesmo teste.
3. Apagar só a linha `animation: marca-acento 500ms ease-out both;` e rodar. Expected: FAIL em "a barra do nome anima com movimento normal".

Depois das três, `git status` deve mostrar `app/globals.css` sem alterações além do Step 3.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css tests/e2e/identidade.spec.ts
git commit -m "Hover dos botoes so com ponteiro com hover e testes de movimento reais"
```

---

### Task 3: Raio da Vitrine, cores antigas e varredura de cores no código

**Files:**
- Modify: `components/vitrine/PecaDaVitrine.tsx:124`
- Modify: `components/vitrine/campoDeFluxo.ts:61-62`
- Create: `lib/design/higiene-de-cor.test.ts`
- Test: `tests/e2e/identidade.spec.ts`

**Interfaces:**
- Consumes: nenhuma.
- Produces: `lib/design/higiene-de-cor.test.ts`, teste de Vitest que varre `app/`, `components/` e `lib/` (exceto `*.test.ts`/`*.test.tsx`).

- [ ] **Step 1: Write the failing tests**

`lib/design/higiene-de-cor.test.ts`:

```ts
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return arquivos(caminho);
    const ehCodigo = /\.(tsx?|css)$/.test(nome);
    const ehTeste = /\.test\.tsx?$/.test(nome);
    return ehCodigo && !ehTeste ? [caminho] : [];
  });
}

const codigo = ["app", "components", "lib"]
  .flatMap(arquivos)
  .map((caminho) => ({ caminho, texto: readFileSync(caminho, "utf8") }));

function ocorrencias(regex: RegExp) {
  return codigo
    .filter(({ texto }) => regex.test(texto))
    .map(({ caminho }) => caminho);
}

describe("cores no código", () => {
  it("não usa branco nem preto puros", () => {
    expect(ocorrencias(/#(ffffff|fff|000000|000)\b/i)).toEqual([]);
  });

  it("não usa a paleta antiga", () => {
    expect(
      ocorrencias(/#(171717|0a0a0a|ededed|525252|a3a3a3)\b/i),
    ).toEqual([]);
  });

  it("não usa o acento como cor de texto", () => {
    expect(ocorrencias(/(?<![-\w])text-accent(?![-\w])/)).toEqual([]);
    expect(ocorrencias(/(?<![-\w])color:\s*var\(--accent\)/)).toEqual([]);
  });
});
```

Acrescentar ao final de `tests/e2e/identidade.spec.ts`:

```ts
test("a moldura da Vitrine usa o raio de 12px dos blocos", async ({ page }) => {
  await page.goto("/pt");
  const raio = await page
    .getByTestId("vitrine-peca")
    .evaluate((n) => getComputedStyle(n).borderTopLeftRadius);
  expect(raio).toBe("12px");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/design/higiene-de-cor.test.ts`
Expected: FAIL em "não usa branco nem preto puros" e "não usa a paleta antiga", listando `components/vitrine/campoDeFluxo.ts`. Se a lista trouxer outro arquivo, troque a cor dele pelo token equivalente (`#f3f4ef` fundo, `#11120e` texto) antes de seguir.

Run: `npx playwright test tests/e2e/identidade.spec.ts -g "raio de 12px"`
Expected: FAIL (`8px`).

- [ ] **Step 3: Write minimal implementation**

`components/vitrine/PecaDaVitrine.tsx`: na linha da moldura, trocar `rounded-lg` por `rounded-xl` (resto da `className` igual).

`components/vitrine/campoDeFluxo.ts`: trocar

```ts
      fundo: estilo.getPropertyValue("--background").trim() || "#ffffff",
      traco: estilo.getPropertyValue("--foreground").trim() || "#171717",
```

por

```ts
      fundo: estilo.getPropertyValue("--background").trim() || "#f3f4ef",
      traco: estilo.getPropertyValue("--foreground").trim() || "#11120e",
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run && npx playwright test tests/e2e/identidade.spec.ts tests/e2e/vitrine.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components lib/design tests/e2e/identidade.spec.ts
git commit -m "Raio da Vitrine, fallbacks de cor e varredura de cores no codigo"
```

---

### Task 4: Testes de robustez: fontes bloqueadas, 320px com fonte pronta e foco em todos os botões

**Files:**
- Modify: `tests/e2e/identidade.spec.ts` (teste de 320px e testes de foco)

**Interfaces:**
- Consumes: `a.botao-primario`, `a.botao-secundario` (hero) e `[data-testid="projeto-card-kepler-lab"] a.botao` (cartão).
- Produces: nenhuma interface; só testes.

- [ ] **Step 1: Write the tests**

No teste existente `em 320px o hero não gera rolagem horizontal`, acrescentar `await page.evaluate(() => document.fonts.ready);` logo depois de `await page.goto(path);`.

Substituir todo o bloco `for (const tema of ["dark", "light"] as const) { test(\`botão primário tem foco visível no tema ${tema}\` ... }` (dentro do `describe` do hero) por:

```ts
    for (const tema of ["dark", "light"] as const) {
      for (const [nome, seletor] of [
        ["primário", "a.botao-primario"],
        ["secundário", "a.botao-secundario"],
        ["do cartão", '[data-testid="projeto-card-kepler-lab"] a.botao'],
      ] as const) {
        test(`botão ${nome} tem foco visível e contrastado no tema ${tema}`, async ({
          page,
        }) => {
          await page.emulateMedia({ colorScheme: tema });
          await page.goto(path);
          const botao = page.locator(seletor).first();
          await botao.focus();
          await page.keyboard.press("Tab");
          await page.keyboard.press("Shift+Tab");
          const foco = await botao.evaluate((n) => {
            const css = getComputedStyle(n);
            return {
              estilo: css.outlineStyle,
              largura: parseFloat(css.outlineWidth),
              cor: css.outlineColor,
              texto: getComputedStyle(document.body).color,
            };
          });
          expect(foco.estilo).not.toBe("none");
          expect(foco.largura).toBeGreaterThanOrEqual(2);
          expect(foco.cor).toBe(foco.texto);
        });
      }
    }
```

Acrescentar ao final do arquivo:

```ts
for (const path of paths) {
  test(`com as fontes bloqueadas o texto continua legível ${path}`, async ({
    page,
  }) => {
    await page.route("**/*.woff2", (rota) => rota.abort());
    await page.goto(path);
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();
    await expect(h1).toHaveText("Gabriel Migliatti");
    await expect(page.getByTestId("posicionamento")).toBeVisible();
    expect(
      await h1.evaluate((n) => getComputedStyle(n).fontFamily),
    ).toContain("ui-sans-serif");
  });
}
```

- [ ] **Step 2: Run the tests**

Run: `npx playwright test tests/e2e/identidade.spec.ts`
Expected: PASS. São testes de proteção, então não falham antes; o passo 3 prova que mordem.

- [ ] **Step 3: Prove the guards bite (mutation), undoing each with `git checkout`**

1. Em `app/globals.css`, tirar `ui-sans-serif, system-ui, sans-serif` da linha `--font-display`. Rodar `npx playwright test tests/e2e/identidade.spec.ts -g "fontes bloqueadas"`. Expected: FAIL. Desfazer: `git checkout app/globals.css`.
2. Em `app/globals.css`, acrescentar `.botao-secundario:focus-visible { outline: none; }` no fim. Rodar `npx playwright test tests/e2e/identidade.spec.ts -g "botão secundário tem foco"`. Expected: FAIL. Desfazer: `git checkout app/globals.css`.
3. `git status` deve mostrar só `tests/e2e/identidade.spec.ts` modificado.

- [ ] **Step 4: Run the whole suite**

Run: `npm run typecheck && npm run lint && npm test && npm run test:e2e`
Expected: tudo PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/identidade.spec.ts
git commit -m "Testes de robustez: fontes bloqueadas, 320px com fonte pronta e foco em todos os botoes"
```
