import { describe, expect, it } from "vitest";
import { corDoMatiz, LUMINOSIDADE, SATURACAO, sortearMatiz } from "./cor-da-visita";

describe("cor da visita", () => {
  it("sorteia matizes inteiros de 0 a 359", () => {
    expect(sortearMatiz(() => 0)).toBe(0);
    expect(sortearMatiz(() => 0.5)).toBe(180);
    expect(sortearMatiz(() => 0.999999)).toBe(359);
    expect(sortearMatiz(() => 1)).toBe(359);
  });

  it("usa saturação e luminosidade fixas", () => {
    expect(corDoMatiz(200)).toBe(`hsl(200 ${SATURACAO}% ${LUMINOSIDADE}%)`);
  });
});
