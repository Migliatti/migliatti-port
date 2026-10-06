import { ImageResponse } from "next/og";

export const tamanhoDaImagem = { width: 1200, height: 630 };

/** Imagem de compartilhamento (Open Graph) com o título da página. */
export function imagemDeCompartilhamento(titulo: string, subtitulo: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 24,
          padding: 80,
          background: "#171717",
          color: "#f0f0f0",
        }}
      >
        <div
          style={{
            width: 120,
            height: 10,
            borderRadius: 9999,
            background: "#e6e6e6",
          }}
        />
        <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>
          {titulo}
        </div>
        <div style={{ fontSize: 32, color: "#a6a6a6", lineHeight: 1.3 }}>
          {subtitulo}
        </div>
      </div>
    ),
    tamanhoDaImagem,
  );
}
