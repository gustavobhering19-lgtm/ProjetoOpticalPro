/* =========================================================
   UI — funções de interação com o DOM: erros, toast, badges,
   preenchimento de resultados.
   ========================================================= */

const LensUI = (() => {

  const fieldKeyToInputId = {
    odEsferico: "od-esferico",
    odCilindrico: "od-cilindrico",
    odEixo: "od-eixo",
    odDnp: "od-dnp",
    oeEsferico: "oe-esferico",
    oeCilindrico: "oe-cilindrico",
    oeEixo: "oe-eixo",
    oeDnp: "oe-dnp",
    diametro: "diametro",
    armacaoA: "armacao-a",
    armacaoB: "armacao-b",
    ponte: "ponte",
  };

  function clearAllErrors() {
    Object.values(fieldKeyToInputId).forEach((inputId) => {
      const input = document.getElementById(inputId);
      const errorEl = document.getElementById(`err-${inputId}`);
      if (input) input.removeAttribute("aria-invalid");
      if (errorEl) errorEl.textContent = "";
    });
  }

  function showErrors(errors) {
    clearAllErrors();
    let firstInvalidInput = null;

    Object.entries(errors).forEach(([key, message]) => {
      const inputId = fieldKeyToInputId[key];
      if (!inputId) return;

      const input = document.getElementById(inputId);
      const errorEl = document.getElementById(`err-${inputId}`);

      if (input) {
        input.setAttribute("aria-invalid", "true");
        if (!firstInvalidInput) firstInvalidInput = input;
      }
      if (errorEl) errorEl.textContent = message;
    });

    if (firstInvalidInput) {
      firstInvalidInput.focus({ preventScroll: false });
      firstInvalidInput.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  let toastTimeout = null;

  function showToast(message, type = "info") {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.remove("is-error");
    if (type === "error") toast.classList.add("is-error");

    toast.classList.add("is-visible");

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 4200);
  }

  function formatMm(value) {
    return `${value.toFixed(2)} mm`;
  }

  function badgeForThickness(centerMm, edgeMm) {
    const max = Math.max(centerMm, edgeMm);
    if (max >= 7) return { text: "Lente espessa", cls: "is-thick" };
    if (max <= 3.5) return { text: "Bem fina", cls: "is-balanced" };
    return { text: "Espessura média", cls: "" };
  }

  /**
   * Preenche um cartão de resultado (OD ou OE) com os dados calculados.
   * @param {string} eyePrefix - "od" | "oe"
   * @param {Object} result - saída de LensMath.calculateLens
   */
  function fillResultCard(eyePrefix, result) {
    document.getElementById(`${eyePrefix}-centro`).textContent = formatMm(result.centerMm);
    document.getElementById(`${eyePrefix}-borda`).textContent = formatMm(result.edgeMm);
    document.getElementById(`${eyePrefix}-poder`).textContent =
      `${result.equivalentPower >= 0 ? "+" : ""}${result.equivalentPower.toFixed(2)} D`;
    document.getElementById(`${eyePrefix}-raio`).textContent = formatMm(result.effectiveRadiusMm);

    const badge = badgeForThickness(result.centerMm, result.edgeMm);
    const badgeEl = document.getElementById(`${eyePrefix}-badge`);
    badgeEl.textContent = badge.text;
    badgeEl.className = "lens-badge" + (badge.cls ? ` ${badge.cls}` : "");

    const visualEl = document.getElementById(`${eyePrefix}-visual`);
    visualEl.innerHTML = LensVisual.renderCrossSection(result);
  }

  function showAdvisory(message) {
    const advisory = document.getElementById("advisory");
    const advisoryText = document.getElementById("advisory-text");
    if (!message) {
      advisory.hidden = true;
      return;
    }
    advisoryText.textContent = message;
    advisory.hidden = false;
  }

  function showResults() {
    document.getElementById("results-empty").hidden = true;
    document.getElementById("results-content").hidden = false;
  }

  function hideResults() {
    document.getElementById("results-empty").hidden = false;
    document.getElementById("results-content").hidden = true;
  }

  function resetForm(formEl) {
    formEl.reset();
    clearAllErrors();
    hideResults();
  }

  return {
    clearAllErrors,
    showErrors,
    showToast,
    fillResultCard,
    showAdvisory,
    showResults,
    hideResults,
    resetForm,
    formatMm,
  };
})();