/* =========================================================
   LENS VISUAL — desenha o corte transversal da lente em SVG,
   proporcional à relação real centro/borda calculada.
   ========================================================= */

const LensVisual = (() => {

  /**
   * Gera o markup SVG do corte transversal de uma lente.
   * @param {Object} result - saída de LensMath.calculateLens
   * @returns {string} SVG markup
   */
  function renderCrossSection(result) {
    const { centerMm, edgeMm, dominant } = result;

    const W = 140;
    const H = 90;
    const midY = H / 2;

    // Escala visual: amplifica a diferença para ficar perceptível,
    // mas mantém um piso/teto razoável de desenho.
    const maxThicknessPx = 30;
    const maxVal = Math.max(centerMm, edgeMm, 1);
    const scale = maxThicknessPx / maxVal;

    const centerHalf = Math.max(centerMm * scale, 3) / 2;
    const edgeHalf = Math.max(edgeMm * scale, 3) / 2;

    const lensLeft = 30;
    const lensRight = W - 30;

    const topCenter = midY - centerHalf;
    const topEdge = midY - edgeHalf;
    const botCenter = midY + centerHalf;
    const botEdge = midY + edgeHalf;

    const pathTop = `M ${lensLeft} ${topEdge} Q ${W / 2} ${topCenter} ${lensRight} ${topEdge}`;
    const pathBot = `L ${lensRight} ${botEdge} Q ${W / 2} ${botCenter} ${lensLeft} ${botEdge} Z`;

    const fillColor = dominant === "center" ? "var(--gold-100)" : "var(--navy-100)";
    const strokeColor = dominant === "center" ? "var(--gold-600)" : "var(--navy-700)";

    return `
      <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Corte transversal estimado da lente">
        <path class="lens-path" d="${pathTop} ${pathBot}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.6" stroke-linejoin="round" />
        <line x1="${lensLeft}" y1="${midY}" x2="${lensRight}" y2="${midY}" stroke="${strokeColor}" stroke-width="0.6" stroke-dasharray="2 3" opacity="0.5"/>
        <text x="${W / 2}" y="${topCenter - 6}" text-anchor="middle" font-size="7" font-family="var(--font-mono)" fill="${strokeColor}" opacity="0.75">centro</text>
        <text x="${lensLeft - 4}" y="${midY + 2}" text-anchor="end" font-size="7" font-family="var(--font-mono)" fill="${strokeColor}" opacity="0.75">borda</text>
      </svg>
    `;
  }

  return { renderCrossSection };
})();