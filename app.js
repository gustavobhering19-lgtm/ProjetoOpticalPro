/* =========================================================
   APP — ponto de entrada: liga eventos do formulário aos
   módulos de validação, cálculo e UI.
   ========================================================= */

(() => {
  "use strict";

  const form = document.getElementById("lens-form");
  const clearBtn = document.getElementById("btn-clear");

  function readFormData() {
    const v = (id) => document.getElementById(id).value;

    return {
      odEsferico: v("od-esferico"),
      odCilindrico: v("od-cilindrico"),
      odEixo: v("od-eixo"),
      odDnp: v("od-dnp"),

      oeEsferico: v("oe-esferico"),
      oeCilindrico: v("oe-cilindrico"),
      oeEixo: v("oe-eixo"),
      oeDnp: v("oe-dnp"),

      indice: v("indice"),
      diametro: v("diametro"),
      tipoLente: v("tipo-lente"),

      armacaoA: v("armacao-a"),
      armacaoB: v("armacao-b"),
      ponte: v("ponte"),
      tipoArmacao: v("tipo-armacao"),
    };
  }

  function buildAdvisoryMessage(odResult, oeResult, indice) {
    const maxThickness = Math.max(odResult.centerMm, odResult.edgeMm, oeResult.centerMm, oeResult.edgeMm);

    if (maxThickness >= 8 && Number(indice) < 1.67) {
      return "A espessura estimada está alta. Considere um índice de refração maior (1.67 ou 1.74) ou uma armação com aro menor para reduzir o volume da lente.";
    }
    if (maxThickness >= 8) {
      return "Mesmo com alto índice, a espessura segue elevada. Avalie uma armação mais compacta ou lentes asféricas para reduzir o volume final.";
    }
    return null;
  }

  function handleSubmit(event) {
    event.preventDefault();

    const data = readFormData();
    const { valid, errors } = LensValidation.validateForm(data);

    if (!valid) {
      LensUI.showErrors(errors);
      LensUI.showToast("Há campos para corrigir antes de calcular.", "error");
      LensUI.hideResults();
      return;
    }

    LensUI.clearAllErrors();

    const index = Number(data.indice);
    const diametroLente = Number(data.diametro);
    const frame = {
      armacaoA: Number(data.armacaoA),
      armacaoB: Number(data.armacaoB),
      ponte: Number(data.ponte),
      diametroLente,
    };

    const odResult = LensMath.calculateLens({
      esferico: Number(data.odEsferico),
      cilindrico: Number(data.odCilindrico || 0),
      index,
      frame: { ...frame, dnp: Number(data.odDnp) },
      lensType: data.tipoLente,
      frameType: data.tipoArmacao,
    });

    const oeResult = LensMath.calculateLens({
      esferico: Number(data.oeEsferico),
      cilindrico: Number(data.oeCilindrico || 0),
      index,
      frame: { ...frame, dnp: Number(data.oeDnp) },
      lensType: data.tipoLente,
      frameType: data.tipoArmacao,
    });

    LensUI.fillResultCard("od", odResult);
    LensUI.fillResultCard("oe", oeResult);
    LensUI.showAdvisory(buildAdvisoryMessage(odResult, oeResult, data.indice));
    LensUI.showResults();

    LensUI.showToast("Cálculo concluído com sucesso.");
  }

  function handleClear() {
    LensUI.resetForm(form);
    LensUI.showToast("Campos limpos. Pronto para um novo cálculo.");
    const firstInput = document.getElementById("od-esferico");
    if (firstInput) firstInput.focus();
  }

  // --- Validação em tempo real ao sair do campo (blur) ---
  function attachLiveValidation() {
    const numericIds = [
      "od-esferico", "od-cilindrico", "od-eixo", "od-dnp",
      "oe-esferico", "oe-cilindrico", "oe-eixo", "oe-dnp",
      "diametro", "armacao-a", "armacao-b", "ponte",
    ];

    numericIds.forEach((id) => {
      const input = document.getElementById(id);
      if (!input) return;
      input.addEventListener("blur", () => {
        if (input.value.trim() === "") return;
        input.removeAttribute("aria-invalid");
        const errorEl = document.getElementById(`err-${id}`);
        if (errorEl) errorEl.textContent = "";
      });
    });
  }

  form.addEventListener("submit", handleSubmit);
  clearBtn.addEventListener("click", handleClear);
  attachLiveValidation();
})();