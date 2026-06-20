/* =========================================================
   LENS MATH — cálculo de espessura de lentes oftálmicas
   ---------------------------------------------------------
   Modelo: aproximação de lente fina via sagita (flecha).

     Poder equivalente (esférico-cilíndrico, "vertex power"):
       F_eq = esferico + (cilindrico / 2)        [regra do equivalente esférico]

     Raio de curvatura da superfície (lensmaker simplificado):
       R (mm) = ((n - 1) / |F|) * 1000

     Sagita (flecha) no semidiâmetro efetivo r:
       s = R - sqrt(R² - r²)         (forma exata)

     Lente negativa (miopia):  borda > centro  → borda = centro + s
     Lente positiva (hiperm.): centro > borda  → centro = borda + s

   Espessura mínima de segurança (centro para lente negativa,
   borda para lente positiva) segue prática usual de laboratório:
   1.0mm para visão simples, 1.2mm/1.4mm para multifocal/bifocal
   (maior espessura friccional necessária no bisel).
   ========================================================= */

const LensMath = (() => {

  const MIN_SAFE_THICKNESS = {
    simples: 1.0,
    bifocal: 1.2,
    multifocal: 1.4,
  };

  // Espessura mínima de borda por tipo de armação (folga de bisel/aro)
  const FRAME_EDGE_MARGIN = {
    fechado: 0,
    nylon: 0.3,   // fio precisa de sulco, exige mais borda
    "tres-pecas": 0.2,
  };

  /**
   * Poder equivalente esférico, usado para decidir se a lente é
   * predominantemente positiva ou negativa.
   */
  function equivalentSpherical(esferico, cilindrico) {
    return esferico + (cilindrico || 0) / 2;
  }

  /**
   * Estima o semidiâmetro efetivo (ED/2, "effective diameter") da
   * lente, isto é, a distância do centro óptico até o ponto mais
   * distante do contorno do aro — o ponto que define a borda mais
   * espessa (lente negativa) ou mais fina (lente positiva).
   *
   * O contorno do aro é aproximado por uma elipse de semi-eixos
   * A/2 (horizontal) e B/2 (vertical), prática padrão em laboratórios
   * para formatos de aro genéricos. O centro óptico é deslocado
   * horizontalmente em relação ao centro geométrico do aro pela
   * diferença entre a DNP do paciente e a metade da distância entre
   * lentes (ponte/2 + A/2) — a descentração.
   *
   * A distância máxima entre o centro deslocado e a elipse é obtida
   * por varredura angular (suficientemente precisa para fins de
   * estimativa de espessura e barata em desempenho: 180 iterações).
   *
   * Por segurança, o raio nunca excede o semidiâmetro do diâmetro
   * de lente bruto informado pelo usuário (não há como o aro exigir
   * mais material do que a lente bruta comporta).
   */
  function effectiveRadius({ armacaoA, armacaoB, ponte, dnp, diametroLente }) {
    const a = armacaoA / 2;
    const b = armacaoB / 2;

    const frameCenterFromNose = ponte / 2 + armacaoA / 2;
    const decentration = frameCenterFromNose - dnp;

    let maxDist = 0;
    for (let deg = 0; deg < 360; deg += 2) {
      const t = (deg * Math.PI) / 180;
      const x = a * Math.cos(t);
      const y = b * Math.sin(t);
      const dist = Math.sqrt((x - decentration) ** 2 + y ** 2);
      if (dist > maxDist) maxDist = dist;
    }

    if (diametroLente) {
      maxDist = Math.min(maxDist, diametroLente / 2);
    }

    return maxDist;
  }

  /**
   * Raio de curvatura da superfície em mm, a partir do poder e índice.
   */
  function curvatureRadius(power, index) {
    if (power === 0) return Infinity;
    return ((index - 1) / Math.abs(power)) * 1000;
  }

  /**
   * Sagita (flecha) em mm para um raio de curvatura R e semidiâmetro r.
   * Usa a forma exata; satura para situações fisicamente extremas.
   */
  function sagitta(R, r) {
    if (!Number.isFinite(R)) return 0;
    if (R <= r) {
      // Curvatura fisicamente impossível para esse raio — situação
      // extrema (grau muito alto + lente muito grande). Satura.
      return r * 0.9;
    }
    return R - Math.sqrt(R ** 2 - r ** 2);
  }

  /**
   * Calcula a espessura de centro e borda para um olho.
   *
   * @param {Object} params
   * @param {number} params.esferico
   * @param {number} params.cilindrico
   * @param {number} params.index - índice de refração (1.49 .. 1.74)
   * @param {Object} params.frame - { armacaoA, armacaoB, ponte, dnp, diametroLente }
   * @param {string} params.lensType - 'simples' | 'bifocal' | 'multifocal'
   * @param {string} params.frameType - 'fechado' | 'nylon' | 'tres-pecas'
   * @returns {Object} resultado detalhado do cálculo
   */
  function calculateLens({ esferico, cilindrico, index, frame, lensType, frameType }) {
    const eqPower = equivalentSpherical(esferico, cilindrico);
    const r = effectiveRadius(frame);
    const R = curvatureRadius(eqPower, index);
    const s = sagitta(R, r);

    const minThickness = MIN_SAFE_THICKNESS[lensType] ?? MIN_SAFE_THICKNESS.simples;
    const edgeMargin = FRAME_EDGE_MARGIN[frameType] ?? 0;

    let centerMm, edgeMm, dominant;

    if (eqPower < 0) {
      // Lente negativa: define-se a espessura de centro mínima de
      // segurança, a borda cresce pela sagita.
      dominant = "edge";
      centerMm = minThickness;
      edgeMm = centerMm + s + edgeMargin;
    } else if (eqPower > 0) {
      // Lente positiva: define-se a espessura de borda mínima
      // (incluindo folga de aro), o centro cresce pela sagita.
      dominant = "center";
      edgeMm = minThickness + edgeMargin;
      centerMm = edgeMm + s;
    } else {
      // Plano: espessura uniforme mínima
      dominant = "uniform";
      centerMm = minThickness;
      edgeMm = minThickness + edgeMargin;
    }

    return {
      equivalentPower: eqPower,
      effectiveRadiusMm: r,
      curvatureRadiusMm: R,
      sagittaMm: s,
      centerMm,
      edgeMm,
      dominant, // 'center' | 'edge' | 'uniform'
    };
  }

  return { calculateLens, equivalentSpherical, effectiveRadius, curvatureRadius, sagitta };
})();