# Identidade visual "Sinal" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar o visual padrão do Next por uma identidade própria (grafite-esverdeado, acento verde-limão, tipografia grande) com movimento, sem quebrar as regras de animação do site.

**Architecture:** Tudo nasce de tokens CSS em `app/globals.css` (cores, fontes, classes `.botao`/`.chip`, animações) consumidos pelos componentes existentes. As fontes vêm de `next/font/google` como variáveis CSS. O hero vira um componente `Hero` de servidor. Nenhuma dependência nova, nenhum componente cliente novo.

**Tech Stack:** Next 16 (App Router), React 19, Tailwind v4, `next/font/google` (Bricolage Grotesque, Geist, Geist Mono), Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-30-identidade-visual-sinal-design.md`

## Global Constraints

- Sem `animation-delay`; `opacity` inicial de qualquer animação >= 0.7; só `transform` e `opacity` (ADR 0001).
- Toda animação e transição dentro de `@media (prefers-reduced-motion: no-preference)`.
- Sem biblioteca de animação, sem dependência nova no `package.json`.
- Um acento só: `#C4F25A`. Acento como cor de **texto** só via `--accent-text`; nunca `text-accent`.
- Sem `#000000` e sem `#ffffff` nos tokens.
- Fontes: Bricolage Grotesque (títulos), Geist (corpo), Geist Mono (rótulos). Sem serifa, sem Inter.
- Forma: botões e chips em pílula (`9999px`), blocos com raio 12px.
- Não alterar `content/`, rotas, textos existentes, ordem das seções, metadados de SEO nem a peça da Vitrine (ADR 0002).
- Nenhum travessão longo (`—`) nem `–` em texto visível novo.
- Contraste WCAG AA nos dois temas (4.5:1 corpo, 3:1 texto grande).
- Tema segue `prefers-color-scheme`; sem botão de alternância.

## Review Focus

1. Movimento reduzido: título, marca do acento e elevação dos botões ficam parados (testes nas Tasks 3 e 4).
2. Tema claro: o limão sobre fundo claro é ilegível como texto, então nenhum texto pode usar o acento direto (teste de contraste na Task 1, varredura `text-accent` na Task 5).
3. Tela de 320px: o nome grande quebra de linha sem rolagem horizontal, em pt e en (Task 4).
4. Fonte que não carrega: o texto continua legível com a pilha de reserva (`system-ui`) (Task 2).
5. Foco de teclado visível nos novos botões, nos dois temas (Task 4).

---

### Task 1: Tokens de cor e teste de contraste

**Files:**
- Create: `lib/design/contraste.ts`
- Create: `lib/design/contraste.test.ts`
- Modify: `app/globals.css:1-33`

**Interfaces:**
- Produces: `razaoDeContraste(a: string, b: string): number` (hex `#RRGGBB`); tokens CSS `--background`, `--foreground`, `--muted`, `--accent`, `--on-accent`, `--accent-text` (claro em `:root`, escuro em `@media (prefers-color-scheme: dark)`); utilitários Tailwind `bg-accent`, `text-on-accent`, `text-accent-text`.

- [ ] **Step 1: Write the failing test**

`lib/design/contraste.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { razaoDeContraste } from "./contraste";

const css = readFileSync("app/globals.css", "utf8");

function tokens(bloco: string) {
  const out: Record<string, string> = {};
  for (const m of bloco.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    out[m[1]] = m[2];
  }
  return out;
}

const claro = tokens(css.match(/:root\s*{([^}]*)}/)![1]);
const escuro = tokens(
  css.match(/prefers-color-scheme:\s*dark\)\s*{\s*:root\s*{([^}]*)}/)![1],
);

describe("razaoDeContraste", () => {
  it("preto sobre branco é 21", () => {
    expect(razaoDeContraste("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });
});

for (const [nome, t] of [
  ["claro", claro],
  ["escuro", escuro],
] as const) {
  describe(`contraste no tema ${nome}`, () => {
    it("define todos os tokens", () => {
      for (const k of [
        "background",
        "foreground",
        "muted",
        "accent",
        "on-accent",
        "accent-text",
      ]) {
        expect(t[k], k).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    });
    it("texto principal e de apoio passam AA sobre o fundo", () => {
      expect(razaoDeContraste(t.foreground, t.background)).toBeGreaterThanOrEqual(7);
      expect(razaoDeContraste(t.muted, t.background)).toBeGreaterThanOrEqual(4.5);
    });
    it("acento como texto passa AA sobre o fundo", () => {
      expect(razaoDeContraste(t["accent-text"], t.background)).toBeGreaterThanOrEqual(4.5);
    });
    it("texto sobre o acento passa AA", () => {
      expect(razaoDeContraste(t["on-accent"], t.accent)).toBeGreaterThanOrEqual(4.5);
    });
    it("não usa preto nem branco puros", () => {
      for (const v of Object.values(t)) {
        expect(v.toLowerCase()).not.toBe("#000000");
        expect(v.toLowerCase()).not.toBe("#ffffff");
      }
    });
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/design/contraste.test.ts`
Expected: FAIL (`./contraste` não existe).

- [ ] **Step 3: Write minimal implementation**

`lib/design/contraste.ts`:

```ts
function canal(v: number) {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminancia(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return (
    0.2126 * canal((n >> 16) & 255) +
    0.7152 * canal((n >> 8) & 255) +
    0.0722 * canal(n & 255)
  );
}

/** Razão de contraste WCAG entre duas cores `#RRGGBB`. */
export function razaoDeContraste(a: string, b: string) {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
}
```

Em `app/globals.css`, substituir as linhas 1 a 25 (do `@import` até o fim do bloco `@media (prefers-color-scheme: dark)`) por:

```css
@import "tailwindcss";

:root {
  --background: #f3f4ef;
  --foreground: #11120e;
  --muted: #4b4e43;
  --accent: #c4f25a;
  --on-accent: #11120e;
  --accent-text: #3f5a00;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-muted: var(--muted);
  --color-accent: var(--accent);
  --color-on-accent: var(--on-accent);
  --color-accent-text: var(--accent-text);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0e0f0c;
    --foreground: #ecede6;
    --muted: #a9aba0;
    --accent: #c4f25a;
    --on-accent: #0e0f0c;
    --accent-text: #c4f25a;
  }
}
```

(O bloco `body { ... }` e tudo abaixo ficam como estão por enquanto.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/design/contraste.test.ts`
Expected: PASS. Se algum par falhar, ajuste o hex do token (mantendo a família de cor) até passar e registre o valor final no spec.

- [ ] **Step 5: Commit**

```bash
git add lib/design app/globals.css
git commit -m "Tokens de cor Sinal e teste de contraste"
```

---

### Task 2: Fontes e tipografia base

**Files:**
- Modify: `app/[lang]/layout.tsx:1-8,43`
- Modify: `app/globals.css` (bloco `@theme inline` e `body`)
- Create: `tests/e2e/identidade.spec.ts`

**Interfaces:**
- Consumes: tokens da Task 1.
- Produces: variáveis `--fonte-titulo`, `--fonte-corpo`, `--fonte-mono` no `<html>`; utilitários Tailwind `font-sans`, `font-mono` e `font-display`; h1/h2/h3 na fonte de títulos.

- [ ] **Step 1: Write the failing test**

`tests/e2e/identidade.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

const paths = ["/pt", "/en"];

for (const path of paths) {
  test.describe(`identidade visual ${path}`, () => {
    test("títulos em Bricolage, corpo em Geist, com fonte de reserva", async ({
      page,
    }) => {
      await page.goto(path);
      const h1 = await page
        .locator("h1")
        .first()
        .evaluate((n) => getComputedStyle(n).fontFamily);
      const corpo = await page.evaluate(
        () => getComputedStyle(document.body).fontFamily,
      );
      expect(h1).toContain("Bricolage");
      expect(corpo).toContain("Geist");
      expect(corpo).toContain("system-ui");
    });

    test("paleta Sinal nos dois temas", async ({ page }) => {
      await page.emulateMedia({ colorScheme: "dark" });
      await page.goto(path);
      expect(
        await page.evaluate(() => getComputedStyle(document.body).backgroundColor),
      ).toBe("rgb(14, 15, 12)");

      await page.emulateMedia({ colorScheme: "light" });
      expect(
        await page.evaluate(() => getComputedStyle(document.body).backgroundColor),
      ).toBe("rgb(243, 244, 239)");
    });
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/e2e/identidade.spec.ts`
Expected: FAIL (fonte ainda é a de sistema).

- [ ] **Step 3: Write minimal implementation**

Em `app/[lang]/layout.tsx`, adicionar ao topo, depois dos imports existentes e antes de `import "../globals.css";`:

```tsx
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
```

e logo depois de `import "../globals.css";`:

```tsx
const fonteTitulo = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--fonte-titulo",
  display: "swap",
});
const fonteCorpo = Geist({
  subsets: ["latin"],
  variable: "--fonte-corpo",
  display: "swap",
});
const fonteMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--fonte-mono",
  display: "swap",
});
```

Trocar `<html lang={dict.htmlLang}>` por:

```tsx
<html
  lang={dict.htmlLang}
  className={`${fonteTitulo.variable} ${fonteCorpo.variable} ${fonteMono.variable}`}
>
```

Em `app/globals.css`, dentro do `@theme inline { ... }` acrescentar:

```css
  --font-sans: var(--fonte-corpo), ui-sans-serif, system-ui, sans-serif;
  --font-display: var(--fonte-titulo), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--fonte-mono), ui-monospace, monospace;
```

Substituir o bloco `body { ... }` por:

```css
body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
}

@layer base {
  h1,
  h2,
  h3 {
    font-family: var(--font-display);
    letter-spacing: -0.02em;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx playwright test tests/e2e/identidade.spec.ts`
Expected: PASS. Se o build falhar por não baixar as fontes (sem rede), pare e avise: a alternativa é `next/font/local` com os arquivos baixados para `app/fonts/`, o que muda este passo.

- [ ] **Step 5: Commit**

```bash
git add app tests/e2e/identidade.spec.ts
git commit -m "Fontes Bricolage, Geist e Geist Mono via next/font"
```

---

### Task 3: Botões, chips e vocabulário de movimento

**Files:**
- Modify: `app/globals.css` (acrescentar ao final)
- Modify: `docs/adr/0001-animacao-de-entrada.md`
- Modify: `tests/e2e/identidade.spec.ts`

**Interfaces:**
- Consumes: tokens da Task 1, `--font-mono` da Task 2.
- Produces: classes `.botao`, `.botao-primario`, `.botao-secundario`, `.chip`, `.animacao-titulo`, `.marca-acento` (o `::after` desenha o marca-texto).

- [ ] **Step 1: Write the failing test**

Acrescentar ao final de `tests/e2e/identidade.spec.ts`:

```ts
test.describe("controles e movimento (página de teste na home)", () => {
  test("botão eleva no hover com movimento normal e fica parado com movimento reduzido", async ({
    page,
  }) => {
    await page.goto("/pt");
    const botao = page.locator(".botao").first();
    await expect(botao).toBeVisible();
    expect(
      await botao.evaluate((n) => getComputedStyle(n).transitionDuration),
    ).not.toBe("0s");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    const parado = page.locator(".botao").first();
    expect(
      await parado.evaluate((n) => getComputedStyle(n).transitionDuration),
    ).toBe("0s");
  });
});
```

(Este teste depende de existir um `.botao` na home; ele só passa depois da Task 4, que é onde o hero usa a classe. Nesta task ele deve falhar por não achar `.botao`.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/e2e/identidade.spec.ts -g "botão eleva"`
Expected: FAIL (nenhum `.botao`).

- [ ] **Step 3: Write minimal implementation**

Acrescentar ao final de `app/globals.css`:

```css
/* Controles da identidade Sinal: pílula, um acento só. */
.botao {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  padding: 0.7rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
}

.botao-primario {
  background: var(--accent);
  color: var(--on-accent);
}

.botao-secundario {
  border: 1px solid var(--foreground);
  color: var(--foreground);
}

.chip {
  display: inline-block;
  border: 1px solid color-mix(in srgb, var(--foreground) 25%, transparent);
  border-radius: 9999px;
  padding: 0.2rem 0.65rem;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 0.75rem;
}

/* Marca do acento sob o nome: barra decorativa, nunca fundo de texto. */
.marca-acento {
  position: relative;
  display: inline-block;
}

.marca-acento::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -0.06em;
  height: 0.1em;
  border-radius: 9999px;
  background: var(--accent);
  transform-origin: left;
}

/*
 * Movimento da identidade (estende docs/adr/0001-animacao-de-entrada.md):
 * mesmas regras, sem atraso, opacity inicial >= 0.7, só transform e opacity.
 */
@media (prefers-reduced-motion: no-preference) {
  .botao {
    transition: transform 250ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  .botao:hover {
    transform: translateY(-3px);
  }

  .botao:active {
    transform: scale(0.97);
  }

  .animacao-titulo {
    animation: animacao-titulo 600ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .marca-acento::after {
    animation: marca-acento 700ms ease-out both;
  }
}

@keyframes animacao-titulo {
  from {
    opacity: 0.7;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes marca-acento {
  from {
    transform: scaleX(0.15);
  }
  to {
    transform: scaleX(1);
  }
}
```

Em `docs/adr/0001-animacao-de-entrada.md`, acrescentar ao final:

```md

## Extensão: identidade visual Sinal

Novos movimentos, todos sob as regras acima (sem atraso, `opacity` inicial >= 0.7, só `transform` e `opacity`, dentro de `no-preference`):

- `animacao-titulo`: título do hero sobe 24px em 600ms.
- `marca-acento`: barra do acento sob o nome cresce de `scaleX(0.15)` a 1 em 700ms (decorativa, não cobre texto).
- `.botao`: sobe 3px no hover e afunda (`scale(0.97)`) no clique, com `transition` de 250ms.

O escalonamento por `animation-delay` (palavras entrando em sequência) foi descartado por violar a regra 1.
```

- [ ] **Step 4: Run test to verify it still fails for the right reason, then move on**

Run: `npx playwright test tests/e2e/identidade.spec.ts -g "botão eleva"`
Expected: ainda FAIL (nenhum `.botao` na home). Isso é esperado; passa na Task 4. Rode `npx vitest run` para garantir que nada mais quebrou.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css docs/adr/0001-animacao-de-entrada.md tests/e2e/identidade.spec.ts
git commit -m "Botoes, chips e vocabulario de movimento da identidade"
```

---

### Task 4: Hero

**Files:**
- Create: `components/Hero.tsx`
- Modify: `app/[lang]/page.tsx:20-32`
- Modify: `lib/dictionary.ts` (tipo `Dictionary` e os dois idiomas)
- Modify: `tests/e2e/identidade.spec.ts`

**Interfaces:**
- Consumes: classes `.botao*`, `.animacao-titulo`, `.marca-acento`, `.animacao-entrada` (Task 3); `obterTextosHome(lang)` (`nome`, `posicionamento`).
- Produces: `Hero({ lang, nome, posicionamento })`, que devolve um fragmento com `h1`, `p[data-testid="posicionamento"]` e a linha de CTAs, para que esses nós continuem filhos diretos de `main`. `dict.falarComigo` e `dict.verProjetos`.

- [ ] **Step 1: Write the failing test**

Acrescentar ao final de `tests/e2e/identidade.spec.ts`:

```ts
for (const path of paths) {
  test.describe(`hero ${path}`, () => {
    test("título anima legível, sem atraso, e para com movimento reduzido", async ({
      page,
    }) => {
      await page.goto(path);
      const h1 = page.locator("h1").first();
      await expect(h1).toBeVisible();
      const inicio = await h1.evaluate((node) => {
        const anim = node
          .getAnimations()
          .find((a) => (a as CSSAnimation).animationName === "animacao-titulo");
        if (!anim) return null;
        anim.pause();
        anim.currentTime = 0;
        const css = getComputedStyle(node);
        return {
          opacity: Number(css.opacity),
          visibility: css.visibility,
          delay: css.animationDelay,
        };
      });
      if (inicio) {
        expect(inicio.opacity).toBeGreaterThanOrEqual(0.7);
        expect(inicio.visibility).toBe("visible");
        expect(inicio.delay).toBe("0s");
      }
      expect(
        await h1.evaluate((n) => getComputedStyle(n).animationName),
      ).toBe("animacao-titulo");

      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.reload();
      const parado = page.locator("h1").first();
      expect(
        await parado.evaluate((n) => getComputedStyle(n).animationName),
      ).toBe("none");
      expect(
        await parado.evaluate(
          (n) => getComputedStyle(n.querySelector(".marca-acento")!, "::after").animationName,
        ),
      ).toBe("none");
    });

    test("CTAs levam ao contato e aos projetos", async ({ page }) => {
      await page.goto(path);
      const primario = page.locator("a.botao-primario").first();
      const secundario = page.locator("a.botao-secundario").first();
      await expect(primario).toHaveAttribute("href", "#contato");
      await expect(secundario).toHaveAttribute("href", "#destaques");
      await expect(primario).not.toBeEmpty();
      await expect(secundario).not.toBeEmpty();
    });

    test("em 320px o hero não gera rolagem horizontal", async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 700 });
      await page.goto(path);
      const estoura = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(estoura).toBe(false);
    });

    for (const tema of ["dark", "light"] as const) {
      test(`botão primário tem foco visível no tema ${tema}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: tema });
        await page.goto(path);
        const primario = page.locator("a.botao-primario").first();
        await primario.focus();
        await page.keyboard.press("Tab");
        await page.keyboard.press("Shift+Tab");
        const foco = await primario.evaluate((n) => {
          const css = getComputedStyle(n);
          return { estilo: css.outlineStyle, largura: css.outlineWidth };
        });
        expect(foco.estilo).not.toBe("none");
        expect(foco.largura).not.toBe("0px");
      });
    }
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/e2e/identidade.spec.ts`
Expected: FAIL nos testes do hero e no "botão eleva" da Task 3.

- [ ] **Step 3: Write minimal implementation**

Em `lib/dictionary.ts`:
- No tipo `Dictionary`, logo após `verDemo: string;`, acrescentar:

```ts
  /** Rótulos dos botões do hero. */
  falarComigo: string;
  verProjetos: string;
```

- No objeto `pt`, logo após a linha `verDemo: "Ver demo",`, acrescentar:

```ts
    falarComigo: "Falar comigo",
    verProjetos: "Ver projetos",
```

- No objeto `en`, logo após a linha `verDemo: ...` desse idioma, acrescentar:

```ts
    falarComigo: "Talk to me",
    verProjetos: "See projects",
```

`components/Hero.tsx`:

```tsx
import { getDictionary, type Locale } from "@/lib/dictionary";

type Props = {
  lang: Locale;
  nome: string;
  posicionamento: string;
};

/**
 * Hero: nome em destaque, Posicionamento e dois botões. Devolve um
 * fragmento para que o título e o Posicionamento sigam filhos diretos de
 * `main`. O texto já nasce legível; ver ADR 0001.
 */
export function Hero({ lang, nome, posicionamento }: Props) {
  const dict = getDictionary(lang);

  return (
    <>
      <h1 className="animacao-titulo text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl">
        <span className="marca-acento">{nome}</span>
      </h1>
      <p
        data-testid="posicionamento"
        className="animacao-entrada max-w-2xl text-lg text-muted sm:text-2xl"
      >
        {posicionamento}
      </p>
      <div className="mt-2 flex flex-wrap gap-3">
        <a href="#contato" className="botao botao-primario">
          {dict.falarComigo}
        </a>
        <a href="#destaques" className="botao botao-secundario">
          {dict.verProjetos}
        </a>
      </div>
    </>
  );
}
```

Em `app/[lang]/page.tsx`:
- Adicionar `import { Hero } from "@/components/Hero";` junto dos demais imports de `@/components`.
- Trocar o container externo `className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-8"` por `className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-8"`.
- Substituir o `<h1 ...>...</h1>` e o `<p data-testid="posicionamento" ...>...</p>` por:

```tsx
        <Hero
          lang={lang}
          nome={textos.nome}
          posicionamento={textos.posicionamento}
        />
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx playwright test tests/e2e/identidade.spec.ts tests/e2e/animacao.spec.ts tests/e2e/home.spec.ts`
Expected: PASS. Se o teste de 320px falhar, reduza o corpo do h1 para `text-4xl` abaixo de `sm`.

- [ ] **Step 5: Commit**

```bash
git add components/Hero.tsx app lib/dictionary.ts tests/e2e/identidade.spec.ts
git commit -m "Hero com nome em destaque, marca do acento e dois botoes"
```

---

### Task 5: Demais seções, estudo de caso, Vitrine e imagem de compartilhamento

**Files:**
- Modify: `components/ProjetoCard.tsx:15-50`
- Modify: `components/OutrosProjetos.tsx:30-36`
- Modify: `components/LanguageSelector.tsx:38-40`
- Modify: `components/Contato.tsx:51-56`
- Modify: `components/Curriculo.tsx` (item de competência)
- Modify: `app/[lang]/projetos/[id]/page.tsx` (h1 e chips de stack)
- Modify: `components/vitrine/campoDeFluxo.ts:63`
- Modify: `lib/seo/imagem.tsx`
- Modify: `tests/e2e/identidade.spec.ts`

**Interfaces:**
- Consumes: `.botao`, `.botao-secundario`, `.botao-primario`, `.chip` (Task 3); token `--accent-text` (Task 1).
- Produces: nenhuma interface nova.

- [ ] **Step 1: Write the failing test**

Acrescentar ao final de `tests/e2e/identidade.spec.ts`:

```ts
for (const path of paths) {
  test.describe(`demais seções ${path}`, () => {
    test("cartões de destaque e competências usam chips e botão da identidade", async ({
      page,
    }) => {
      await page.goto(path);
      const card = page.getByTestId("projeto-card-kepler-lab");
      await expect(card.locator(".chip").first()).toBeVisible();
      await expect(card.locator("a.botao").first()).toBeVisible();
      await expect(
        page.getByTestId("grupo-de-competencias").first().locator(".chip").first(),
      ).toBeVisible();
    });

    test("botão do CV público usa o acento", async ({ page }) => {
      await page.goto(path);
      const cv = page.getByTestId("contato").locator("a.botao-primario");
      await expect(cv).toBeVisible();
    });

    test("seletor de idioma marca o idioma atual com o acento", async ({ page }) => {
      await page.goto(path);
      const atual = page.locator('nav a[aria-current="page"]').first();
      expect(
        await atual.evaluate((n) => getComputedStyle(n).backgroundColor),
      ).toBe("rgb(196, 242, 90)");
    });
  });
}

test("estudo de caso usa a fonte de títulos e chips na stack", async ({ page }) => {
  await page.goto("/pt/projetos/kepler-lab");
  const h1 = await page
    .locator("h1")
    .first()
    .evaluate((n) => getComputedStyle(n).fontFamily);
  expect(h1).toContain("Bricolage");
  await expect(page.locator("main .chip").first()).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/e2e/identidade.spec.ts -g "demais seções|estudo de caso"`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

`components/ProjetoCard.tsx`:
- `className="flex flex-col gap-3 rounded-lg border border-muted/40 p-5"` passa a `className="flex flex-col gap-3 rounded-xl border border-foreground/20 p-5"`.
- `<ul className="flex flex-wrap gap-2 text-sm text-muted">` passa a `<ul className="flex flex-wrap gap-2">` e `<li key={item} className="rounded border border-muted/40 px-2 py-0.5">` passa a `<li key={item} className="chip">`.
- `<div className="flex flex-wrap gap-4 text-sm">` passa a `<div className="flex flex-wrap items-center gap-4 text-sm">`.
- No `<Link ...>` do estudo de caso, `className="font-semibold underline underline-offset-4"` passa a `className="botao botao-secundario"`.

`components/OutrosProjetos.tsx`: no selo de desenvolvimento, `className="ml-2 rounded border border-current px-1.5 py-0.5 text-xs text-muted"` passa a `className="chip ml-2"`.

`components/LanguageSelector.tsx`: no ramo atual do `className`, trocar `"font-semibold underline underline-offset-4"` por `"rounded-full bg-accent px-3 py-1 font-medium text-on-accent"` e `"text-muted hover:text-foreground"` por `"px-3 py-1 text-muted hover:text-foreground"`.

`components/Contato.tsx`: no link do CV, `className="inline-block rounded-md bg-foreground px-4 py-2 font-medium text-background hover:opacity-90"` passa a `className="botao botao-primario"`.

`components/Curriculo.tsx`: no item de competência, `className="rounded border border-current px-2 py-0.5 text-sm text-muted"` passa a `className="chip"`.

`app/[lang]/projetos/[id]/page.tsx`:
- `<h1 className="text-4xl font-bold tracking-tight">` passa a `<h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">`.
- Na seção Stack, `<li key={item} className="rounded border border-muted/40 px-2 py-0.5">` passa a `<li key={item} className="chip">` e o `<ul className="flex flex-wrap gap-2 text-sm">` passa a `<ul className="flex flex-wrap gap-2">`.

`components/vitrine/campoDeFluxo.ts` linha 63: trocar

```ts
      destaque: estilo.getPropertyValue("--muted").trim() || "#525252",
```

por

```ts
      destaque: estilo.getPropertyValue("--accent-text").trim() || "#3f5a00",
```

`lib/seo/imagem.tsx`: no `style` do contêiner externo trocar `background: "#0a0a0a"` por `background: "#0e0f0c"` e `color: "#ededed"` por `color: "#ecede6"`; no subtítulo trocar `color: "#a3a3a3"` por `color: "#a9aba0"`; e, antes do título (primeiro filho do contêiner), inserir:

```tsx
        <div
          style={{
            width: 120,
            height: 10,
            borderRadius: 9999,
            background: "#c4f25a",
          }}
        />
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx playwright test tests/e2e/identidade.spec.ts`
Expected: PASS.

Varredura do acento como texto (deve retornar vazio):

Run: `grep -rn "text-accent\b" app components`
Expected: nenhuma linha (só `text-accent-text` é permitido).

- [ ] **Step 5: Commit**

```bash
git add components app lib/seo tests/e2e/identidade.spec.ts
git commit -m "Aplica a identidade Sinal nas demais secoes e no estudo de caso"
```

---

### Task 6: Verificação final e auditoria

**Files:**
- Nenhum arquivo novo. Correções vindas da auditoria entram como commits adicionais.

**Interfaces:**
- Consumes: tudo acima.

- [ ] **Step 1: Suíte completa**

Run: `npm run typecheck && npm run lint && npm test && npm run test:e2e`
Expected: tudo PASS. Falhas em e2e antigos que dependiam de classes Tailwind trocadas se corrigem ajustando o seletor do teste para `data-testid` ou papel ARIA, sem mudar o comportamento testado.

- [ ] **Step 2: Conferência visual**

Run: `npm run dev`, abrir `http://localhost:3000/pt` e `/en` e conferir: tema escuro e claro (emulação no DevTools), largura de celular (375px) e desktop, movimento reduzido ligado e desligado, estudo de caso `/pt/projetos/kepler-lab`, Vitrine carregando com o traço na nova cor.

- [ ] **Step 3: Auditoria com a skill `web-design-guidelines`**

Invocar a skill `web-design-guidelines` sobre `app/` e `components/` e corrigir os achados de acessibilidade e UX que a mudança introduziu (foco, contraste, tamanho de alvo, semântica). Achados anteriores à mudança viram issue, não entram aqui.

- [ ] **Step 4: Commit das correções da auditoria (se houver)**

```bash
git add -A
git commit -m "Correcoes da auditoria de design"
```
