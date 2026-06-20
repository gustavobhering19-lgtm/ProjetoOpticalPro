/* =========================================================
   VALIDATION — regras de validação dos campos da receita
   Módulo isolado: não conhece o DOM além de receber valores
   e retornar { valid, errors }.
   ========================================================= */

const LensValidation = (() => {

  const RULES = {
    esferico: { min: -30, max: 30, required: true, label: "Grau esférico" },
    cilindrico: { min: -10, max: 10, required: false, label: "Grau cilíndrico" },
    eixo: { min: 0, max: 180, required: false, label: "Eixo" },
    dnp: { min: 18, max: 40, required: true, label: "DNP/DP" },
    diametro: { min: 40, max: 80, required: true, label: "Diâmetro da lente" },
    armacaoA: { min: 30, max: 70, required: true, label: "Horizontal (A)" },
    armacaoB: { min: 20, max: 60, required: true, label: "Altura (B)" },
    ponte: { min: 10, max: 30, required: true, label: "Ponte (DBL)" },
  };

  function isBlank(value) {
    return value === null || value === undefined || String(value).trim() === "";
  }

  /**
   * Valida um único campo numérico contra suas regras.
   * @returns {string|null} mensagem de erro ou null se válido
   */
  function validateNumberField(key, rawValue) {
    const rule = RULES[key];
    if (!rule) return null;

    if (isBlank(rawValue)) {
      return rule.required ? `Informe o campo "${rule.label}".` : null;
    }

    const value = Number(rawValue);

    if (Number.isNaN(value)) {
      return `"${rule.label}" deve ser um número válido.`;
    }

    if (value < rule.min || value > rule.max) {
      return `"${rule.label}" deve estar entre ${rule.min} e ${rule.max}.`;
    }

    return null;
  }

  /**
   * Valida o eixo: só é obrigatório se houver grau cilíndrico informado.
   */
  function validateAxis(eixoRaw, cilindricoRaw) {
    const hasCylinder = !isBlank(cilindricoRaw) && Number(cilindricoRaw) !== 0;

    if (isBlank(eixoRaw)) {
      return hasCylinder ? "Informe o eixo quando houver grau cilíndrico." : null;
    }

    const value = Number(eixoRaw);
    if (Number.isNaN(value)) return "Eixo deve ser um número.";
    if (value < 0 || value > 180) return "Eixo deve estar entre 0° e 180°.";
    return null;
  }

  /**
   * Valida o formulário inteiro recebido como objeto plano.
   * @param {Object} data - valores brutos dos campos
   * @returns {{ valid: boolean, errors: Object<string,string> }}
   */
  function validateForm(data) {
    const errors = {};

    // OD
    let err = validateNumberField("esferico", data.odEsferico);
    if (err) errors.odEsferico = err;

    err = validateNumberField("cilindrico", data.odCilindrico);
    if (err) errors.odCilindrico = err;

    err = validateAxis(data.odEixo, data.odCilindrico);
    if (err) errors.odEixo = err;

    err = validateNumberField("dnp", data.odDnp);
    if (err) errors.odDnp = err;

    // OE
    err = validateNumberField("esferico", data.oeEsferico);
    if (err) errors.oeEsferico = err;

    err = validateNumberField("cilindrico", data.oeCilindrico);
    if (err) errors.oeCilindrico = err;

    err = validateAxis(data.oeEixo, data.oeCilindrico);
    if (err) errors.oeEixo = err;

    err = validateNumberField("dnp", data.oeDnp);
    if (err) errors.oeDnp = err;

    // Lente
    err = validateNumberField("diametro", data.diametro);
    if (err) errors.diametro = err;

    // Armação
    err = validateNumberField("armacaoA", data.armacaoA);
    if (err) errors.armacaoA = err;

    err = validateNumberField("armacaoB", data.armacaoB);
    if (err) errors.armacaoB = err;

    err = validateNumberField("ponte", data.ponte);
    if (err) errors.ponte = err;

    // Regra cruzada: diâmetro da lente deve comportar a maior medida da armação
    if (!errors.diametro && !errors.armacaoA) {
      const diametro = Number(data.diametro);
      const maiorEixoArmacao = Math.max(Number(data.armacaoA), Number(data.armacaoB || 0));
      if (diametro < maiorEixoArmacao) {
        errors.diametro = `O diâmetro (${diametro}mm) é menor que a maior medida da armação (${maiorEixoArmacao}mm).`;
      }
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }

  return { validateForm, validateNumberField, RULES };
})();