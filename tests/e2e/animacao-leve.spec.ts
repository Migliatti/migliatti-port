import { expect, test, type Locator, type Page } from "@playwright/test";

// Animação leve (issue #41): fundo estrelado da Hero e pulso das ilustrações
// dos estudos de caso. Regras em docs/adr/0003-editorial-espacial-animejs.md.
//
// Marcas gravadas pelos módulos animados; os nomes dos chunks têm hash, então
// cada chunk é achado pelo conteúdo (como em vitrine.spec.ts).
const MARCA_DO_CEU = "ceu-estrelado"; // components/hero/ceu.ts
const MARCA_DO_PULSO = "ilustracao-pulso"; // components/ilustracao/pulso.ts
const MARCA_DA_PECA = "vitrine-orbitas"; // components/vitrine/orbitas.ts

/** Guarda o corpo de todo chunk JS baixado pela página. */
function registrarChunks(page: Page) {
  const corpos: Promise<string>[] = [];
  page.on("response", (resposta) => {
    const url = resposta.url();
    if (url.includes("/_next/static/chunks/") && /\.js(\?|$)/.test(url)) {
      corpos.push(resposta.text().catch(() => ""));
    }
  });
  return {
    async baixado(marca: string) {
      const textos = await Promise.all(corpos);
      return textos.some((t) => t.includes(marca));
    },
  };
}

/** Aparelho "forte": a versão depende só do que o teste emula. */
async function aparelhoForte(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 16 });
    Object.defineProperty(navigator, "deviceMemory", { get: () => 16 });
  });
}

/** Simula a aba oculta (ou visível de novo). */
async function abaOculta(page: Page, oculta: boolean) {
  await page.evaluate((valor) => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => valor });
    document.dispatchEvent(new Event("visibilitychange"));
  }, oculta);
}

/** Textos do desenho, para conferir que a animação não muda o que ele afirma. */
async function textosDoDesenho(imagem: Locator) {
  return imagem.evaluate((svg) =>
    [...svg.querySelectorAll("text")].map((t) => t.textContent ?? ""),
  );
}

for (const path of ["/pt", "/en"]) {
  test.describe(`céu da Hero ${path}`, () => {
    test("chega num chunk próprio, atrás do texto, sem a Vitrine nem o pulso", async ({
      page,
    }) => {
      await aparelhoForte(page);
      const chunks = registrarChunks(page);
      await page.goto(path);

      // O texto da Hero já está no HTML e legível, sem esperar o céu.
      const h1 = page.locator("h1");
      await expect(h1).toBeVisible();
      await expect(page.getByTestId("posicionamento")).toBeVisible();

      const ceu = page.getByTestId("hero-ceu");
      await expect(ceu).toHaveAttribute("aria-hidden", "true");
      await expect(ceu).toHaveCSS("pointer-events", "none");
      await expect(ceu).toHaveAttribute("data-estado", "carregada");
      await expect(ceu).toHaveAttribute("data-ceu", MARCA_DO_CEU);
      await expect(ceu).toHaveAttribute("data-versao", "completa");
      await expect(ceu.locator("canvas")).toHaveCount(2);

      // O céu fica atrás: o centro do nome e os botões continuam acertáveis.
      const acerto = await page.evaluate(() => {
        const alvos = [
          document.querySelector("h1")!,
          ...document.querySelectorAll(".hero a.botao"),
        ];
        return alvos.map((el) => {
          const r = el.getBoundingClientRect();
          const achado = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
          return achado !== null && el.contains(achado);
        });
      });
      expect(acerto.every(Boolean)).toBe(true);

      // A home baixou o céu, mas nem o pulso das ilustrações nem a peça da
      // Vitrine (que ainda está fora da tela).
      await page.waitForLoadState("networkidle");
      expect(await chunks.baixado(MARCA_DO_CEU)).toBe(true);
      expect(await chunks.baixado(MARCA_DO_PULSO)).toBe(false);
      expect(await chunks.baixado(MARCA_DA_PECA)).toBe(false);
    });

    test("acompanha a rolagem só com transform e pausa com a aba oculta", async ({
      page,
    }) => {
      await aparelhoForte(page);
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(path);
      const ceu = page.getByTestId("hero-ceu");
      await expect(ceu).toHaveAttribute("data-estado", "carregada");
      const camada = ceu.locator("canvas").last();

      const deslocamento = () =>
        camada.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m42);
      expect(await deslocamento()).toBe(0);

      await page.mouse.wheel(0, 300);
      await expect.poll(deslocamento).toBeGreaterThan(0);
      // A camada desce menos do que a página sobe (parallax).
      expect(await deslocamento()).toBeLessThan(300);

      // Cintilar: só opacidade, e pausa com a aba oculta.
      const rodando = () =>
        camada.evaluate((el) => el.getAnimations().some((a) => a.playState === "running"));
      await expect.poll(rodando).toBe(true);
      await abaOculta(page, true);
      await expect.poll(rodando).toBe(false);
      await abaOculta(page, false);
      await expect.poll(rodando).toBe(true);
    });

    test("com movimento reduzido o céu fica vazio e o chunk nunca é baixado", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const chunks = registrarChunks(page);
      await page.goto(path);
      await page.waitForLoadState("networkidle");

      await expect(page.locator("h1")).toBeVisible();
      const ceu = page.getByTestId("hero-ceu");
      await expect(ceu).toHaveAttribute("data-estado", "reduzida");
      await expect(ceu.locator("canvas")).toHaveCount(0);
      // A saída da Hero ao rolar (ADR 0005) é uma animação de rolagem do próprio
      // CSS, fora do que este teste mede: só conta as animações de tempo.
      expect(
        await ceu.evaluate(
          (el) =>
            el
              .getAnimations({ subtree: true })
              .filter((a) => a.timeline instanceof DocumentTimeline).length,
        ),
      ).toBe(0);
      expect(await chunks.baixado(MARCA_DO_CEU)).toBe(false);
    });
  });

  test.describe(`céu da Hero ${path} em celular (pointer: coarse)`, () => {
    test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

    test("mostra a versão leve: uma camada, sem cintilar", async ({ page }) => {
      await aparelhoForte(page);
      await page.goto(path);
      const ceu = page.getByTestId("hero-ceu");
      await expect(ceu).toHaveAttribute("data-estado", "carregada");
      await expect(ceu).toHaveAttribute("data-versao", "leve");
      await expect(ceu.locator("canvas")).toHaveCount(1);
      expect(
        await ceu.locator("canvas").evaluate((el) => el.getAnimations().length),
      ).toBe(0);
    });
  });
}

/** As quatro ilustrações, por estudo de caso. */
const estudos = [
  { id: "grimoire", ilustracoes: 2, setasContinuas: [0, 4] },
  { id: "labreserve", ilustracoes: 2, setasContinuas: [3, 8] },
] as const;

for (const lang of ["pt", "en"]) {
  for (const estudo of estudos) {
    const caminho = `/${lang}/projetos/${estudo.id}`;

    test.describe(`ilustrações ${caminho}`, () => {
      test("pulsam ao entrar na tela, com rótulo, texto alternativo e o mesmo desenho", async ({
        page,
      }) => {
        await aparelhoForte(page);
        const chunks = registrarChunks(page);
        await page.goto(caminho);

        const figuras = page.getByTestId("evidencia-ilustracao");
        await expect(figuras).toHaveCount(estudo.ilustracoes);

        let i = 0;
        for (const figura of await figuras.all()) {
          const moldura = figura.getByTestId("ilustracao");
          const imagem = figura.getByRole("img");
          const textosAntes = await textosDoDesenho(imagem);

          await figura.scrollIntoViewIfNeeded();
          await expect(moldura).toHaveAttribute("data-estado", "carregada");
          await expect(moldura).toHaveAttribute("data-pulso", MARCA_DO_PULSO);
          await expect(moldura).toHaveAttribute("data-versao", "completa");

          // Rótulo e nome acessível continuam lá.
          await expect(figura.getByTestId("rotulo-ilustracao")).toBeVisible();
          expect((await imagem.getAttribute("aria-label"))?.trim()).toBeTruthy();
          await expect(imagem).toBeVisible();

          // A animação não muda o que a ilustração afirma: mesmos textos e
          // as setas tracejadas continuam tracejadas.
          expect(await textosDoDesenho(imagem)).toEqual(textosAntes);
          for (const tracejada of await imagem
            .locator('[data-conector="tracejado"]')
            .all()) {
            expect(
              await tracejada.evaluate((el) => getComputedStyle(el).strokeDasharray),
            ).not.toBe("none");
          }

          // Halo nas caixas e luz em cada seta contínua.
          const halos = imagem.locator("[data-pulso-halo]");
          expect(await halos.count()).toBe(await imagem.locator("[data-no]").count());
          await expect(imagem.locator("[data-pulso-cometa]")).toHaveCount(
            estudo.setasContinuas[i],
          );

          // Está de fato animando: a opacidade dos halos muda com o tempo.
          const retrato = () =>
            halos.evaluateAll((els) => els.map((el) => getComputedStyle(el).opacity).join(","));
          const antes = await retrato();
          await expect.poll(retrato).not.toBe(antes);
          i++;
        }

        await page.waitForLoadState("networkidle");
        expect(await chunks.baixado(MARCA_DO_PULSO)).toBe(true);
        // O estudo de caso não tem Hero: o céu não é baixado aqui.
        expect(await chunks.baixado(MARCA_DO_CEU)).toBe(false);
      });

      test("pausam com a aba oculta", async ({ page }) => {
        await aparelhoForte(page);
        await page.goto(caminho);
        const figura = page.getByTestId("evidencia-ilustracao").first();
        await figura.scrollIntoViewIfNeeded();
        const moldura = figura.getByTestId("ilustracao");
        await expect(moldura).toHaveAttribute("data-estado", "carregada");

        const retrato = () =>
          moldura.evaluate((el) =>
            [...el.querySelectorAll("[data-pulso-halo]")]
              .map((h) => getComputedStyle(h).opacity)
              .join(","),
          );
        await abaOculta(page, true);
        const parado = await retrato();
        await page.waitForTimeout(400);
        expect(await retrato()).toBe(parado);
        await abaOculta(page, false);
        await expect.poll(retrato).not.toBe(parado);
      });

      test("com movimento reduzido ficam paradas e o chunk nunca é baixado", async ({
        page,
      }) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        const chunks = registrarChunks(page);
        await page.goto(caminho);

        const figuras = page.getByTestId("evidencia-ilustracao");
        await expect(figuras).toHaveCount(estudo.ilustracoes);
        for (const figura of await figuras.all()) {
          await figura.scrollIntoViewIfNeeded();
          const moldura = figura.getByTestId("ilustracao");
          await expect(moldura).toHaveAttribute("data-estado", "reduzida");
          await expect(figura.getByTestId("rotulo-ilustracao")).toBeVisible();
          const imagem = figura.getByRole("img");
          await expect(imagem).toBeVisible();
          expect((await imagem.getAttribute("aria-label"))?.trim()).toBeTruthy();
          await expect(moldura.locator("[data-pulso-halo], [data-pulso-cometa]")).toHaveCount(0);
          expect(
            await moldura.evaluate((el) => el.getAnimations({ subtree: true }).length),
          ).toBe(0);
        }
        await page.waitForLoadState("networkidle");
        expect(await chunks.baixado(MARCA_DO_PULSO)).toBe(false);
      });
    });

    test.describe(`ilustrações ${caminho} em celular (pointer: coarse)`, () => {
      test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

      test("mostram a versão leve: halo nas caixas, sem luz nas setas", async ({ page }) => {
        await aparelhoForte(page);
        await page.goto(caminho);
        for (const figura of await page.getByTestId("evidencia-ilustracao").all()) {
          await figura.scrollIntoViewIfNeeded();
          const moldura = figura.getByTestId("ilustracao");
          await expect(moldura).toHaveAttribute("data-estado", "carregada");
          await expect(moldura).toHaveAttribute("data-versao", "leve");
          expect(await moldura.locator("[data-pulso-halo]").count()).toBeGreaterThan(0);
          await expect(moldura.locator("[data-pulso-cometa]")).toHaveCount(0);
        }
      });
    });
  }
}

test.describe("ilustrações sem JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  for (const estudo of estudos) {
    test(`${estudo.id}: desenho parado, com rótulo e texto alternativo`, async ({ page }) => {
      await page.goto(`/pt/projetos/${estudo.id}`);
      const figuras = page.getByTestId("evidencia-ilustracao");
      await expect(figuras).toHaveCount(estudo.ilustracoes);
      for (const figura of await figuras.all()) {
        await expect(figura.getByTestId("rotulo-ilustracao")).toHaveText("Ilustração");
        const imagem = figura.getByRole("img");
        await expect(imagem).toBeVisible();
        expect((await imagem.getAttribute("aria-label"))?.trim()).toBeTruthy();
        expect(await imagem.locator("text").count()).toBeGreaterThan(0);
      }
    });
  }
});
