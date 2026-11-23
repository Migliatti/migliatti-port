import { afterEach, describe, expect, it, vi } from "vitest";
import { aoMudarMovimentoReduzido, movimentoReduzido } from "./movimento-reduzido";

function simular(matches: boolean) {
  let ouvinte: ((e: MediaQueryListEvent) => void) | null = null;
  const consulta = {
    matches,
    addEventListener: (_: string, f: (e: MediaQueryListEvent) => void) => (ouvinte = f),
    removeEventListener: vi.fn(() => (ouvinte = null)),
  };
  vi.stubGlobal("window", { matchMedia: vi.fn(() => consulta) });
  return { consulta, emitir: (m: boolean) => ouvinte?.({ matches: m } as MediaQueryListEvent) };
}

afterEach(() => vi.unstubAllGlobals());

describe("movimento reduzido", () => {
  it("sem window (servidor) não reduz", () => {
    expect(movimentoReduzido()).toBe(false);
  });

  it("lê a preferência do sistema", () => {
    simular(true);
    expect(movimentoReduzido()).toBe(true);
    simular(false);
    expect(movimentoReduzido()).toBe(false);
  });

  it("avisa mudanças e cancela a assinatura", () => {
    const { emitir, consulta } = simular(false);
    const aviso = vi.fn();
    const cancelar = aoMudarMovimentoReduzido(aviso);
    emitir(true);
    expect(aviso).toHaveBeenCalledWith(true);
    cancelar();
    expect(consulta.removeEventListener).toHaveBeenCalled();
  });
});
