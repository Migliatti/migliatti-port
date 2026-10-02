"use client";

import { useEffect } from "react";
import { aplicarCorDaVisita } from "./cor-da-visita";

/**
 * Sorteia a cor decorativa da visita depois da hidratação. Não renderiza
 * nada: o HTML do servidor segue dourado, sem divergência de hidratação.
 */
export function CorDaVisita() {
  useEffect(() => aplicarCorDaVisita(), []);
  return null;
}
