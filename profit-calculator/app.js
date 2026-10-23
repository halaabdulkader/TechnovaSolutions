(function () {
  var SETTINGS_KEY = "technova-profit-settings";
  var PACKAGES_KEY = "technova-profit-packages";

  var settingFields = ["vatGames", "vatStationery", "cardCommission", "cardFixed", "companyTax"];
  var packageFields = [
    "name",
    "price",
    "productCost",
    "giftCost",
    "packagingCost",
    "actualShipping",
    "customerShipping",
  ];

  var activeId = null;

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      /* Private mode or a full store. The page still calculates. */
    }
  }

  function blank(value) {
    return String(value ?? "").trim() === "";
  }

  function formatMoney(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
    return (
      Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + " TL"
    );
  }

  function formatPercent(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
    return (
      Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }) + "%"
    );
  }

  function formatRate(value) {
    return (
      Number(value).toLocaleString("en-US", {
        maximumFractionDigits: 2,
      }) + "%"
    );
  }

  function enteredRate(raw, parsed) {
    return blank(raw) ? null : formatRate(parsed);
  }

  function readSettings() {
    var settings = {};
    settingFields.forEach(function (id) {
      settings[id] = document.getElementById(id).value;
    });
    return settings;
  }

  function readPackage() {
    var pkg = {};
    packageFields.forEach(function (id) {
      pkg[id] = document.getElementById(id).value;
    });
    var type = document.querySelector('input[name="productType"]:checked');
    var vat = document.querySelector('input[name="priceIncludesVat"]:checked');
    pkg.productType = type ? type.value : "";
    pkg.priceIncludesVat = vat ? vat.value === "yes" : null;
    return pkg;
  }

  function writeSettings(settings) {
    settings = settings || {};
    settingFields.forEach(function (id) {
      document.getElementById(id).value = settings[id] != null ? settings[id] : "";
    });
  }

  function writePackage(pkg) {
    pkg = pkg || {};
    packageFields.forEach(function (id) {
      document.getElementById(id).value = pkg[id] != null ? pkg[id] : "";
    });
    document.querySelectorAll('input[name="productType"]').forEach(function (input) {
      input.checked = input.value === pkg.productType;
    });
    document.querySelectorAll('input[name="priceIncludesVat"]').forEach(function (input) {
      if (pkg.priceIncludesVat === true) input.checked = input.value === "yes";
      else if (pkg.priceIncludesVat === false) input.checked = input.value === "no";
      else input.checked = false;
    });
  }

  function setText(id, text) {
    document.getElementById(id).textContent = text;
  }

  function vatFormula(result, settings) {
    var scope = " Shipping the customer pays is not taxed.";
    if (!result.ready) {
      return (
        "If the price includes VAT: package price × VAT rate / (100 + VAT rate). If it does not: package price × VAT rate / 100." +
        scope
      );
    }
    var rate =
      result.productType === "stationery"
        ? enteredRate(settings.vatStationery, result.vatStationery)
        : enteredRate(settings.vatGames, result.vatGames);
    var rateText = rate || "VAT rate";
    var rateNumber = rate ? rate.replace("%", "") : "VAT rate";
    var kind = result.productType === "stationery" ? "stationery" : "games";
    if (result.priceIncludesVat) {
      return (
        "Pulled out of the package price at the " +
        kind +
        " rate: package price × " +
        rateText +
        " / (100 + " +
        rateNumber +
        ")." +
        scope
      );
    }
    return (
      "Added on top of the package price at the " +
      kind +
      " rate: package price × " +
      rateText +
      " / 100." +
      scope
    );
  }

  function cardFormula(settings, result) {
    var rate = enteredRate(settings.cardCommission, result.cardRate);
    var fee = blank(settings.cardFixed) ? null : formatMoney(result.cardFixed);
    if (!rate && !fee) return "Amount the customer pays × commission rate + fixed fee.";
    return (
      "Amount the customer pays × " + (rate || "commission rate") + " + " + (fee || "fixed fee") + "."
    );
  }

  function taxFormula(settings, result) {
    var rate = enteredRate(settings.companyTax, result.taxRate);
    var tail = ", only when the profit is positive. A loss has zero tax.";
    if (!rate) return "Profit before tax × tax rate" + tail;
    return "Profit before tax × " + rate + tail;
  }

  function customerPaysFormula(result) {
    if (!result.ready) return "Package price + customer shipping, with VAT added when the price excludes it.";
    if (result.priceIncludesVat) return "Package price + customer shipping.";
    return "Package price + VAT + customer shipping.";
  }

  function render() {
    var settings = readSettings();
    var pkg = readPackage();
    var result = TechnovaCalc.calculate(pkg, settings);
    var ready = result.ready;
    var loss = ready && result.netProfit < 0;

    document.querySelectorAll("[data-rate]").forEach(function (field) {
      field.dataset.active = String(field.dataset.rate === result.productType);
    });

    setText("cardPrice", ready ? formatMoney(result.price) : "—");
    setText("cardShipping", ready ? formatMoney(result.customerShipping) : "—");
    setText("cardTotal", ready ? formatMoney(result.customerPays) : "—");
    setText("cardTotalHow", customerPaysFormula(result));
    setText("cardCosts", ready ? formatMoney(result.directCosts) : "—");
    setText("vatHow", vatFormula(result, settings));
    setText("vatValue", ready ? formatMoney(result.vat) : "—");
    setText("revenueValue", ready ? formatMoney(result.revenueExVat) : "—");
    setText("cardFeeHow", cardFormula(settings, result));
    setText("cardFeeValue", ready ? formatMoney(result.cardFee) : "—");
    setText("beforeTaxValue", ready ? formatMoney(result.profitBeforeTax) : "—");
    setText("taxHow", taxFormula(settings, result));
    setText("taxValue", ready ? formatMoney(result.companyTax) : "—");
    setText("netValue", ready ? formatMoney(result.netProfit) : "—");
    setText("marginValue", ready ? formatPercent(result.margin) : "—");

    document.getElementById("results").classList.toggle("is-waiting", !ready);
    document.getElementById("netCell").classList.toggle("loss", loss);
    document.getElementById("marginCell").classList.toggle(
      "loss",
      ready && result.margin !== null && result.margin < 0
    );
    document.getElementById("beforeTaxRow").classList.toggle("loss", ready && result.profitBeforeTax < 0);

    var name = pkg.name.trim();
    setText(
      "packageCaption",
      ready ? name || "Untitled package" : "Choose a product type and whether the price includes VAT."
    );

    var summary;
    if (!ready) {
      summary = "Net profit and margin appear once the package can be calculated.";
    } else if (result.margin === null && loss) {
      summary =
        "This package loses " +
        formatMoney(Math.abs(result.netProfit)) +
        ". Margin needs revenue excluding VAT.";
    } else if (result.margin === null) {
      summary = "Margin needs revenue excluding VAT.";
    } else if (loss) {
      summary =
        "This package loses " +
        formatMoney(Math.abs(result.netProfit)) +
        ". Margin is " +
        formatPercent(result.margin) +
        ".";
    } else {
      summary =
        "Net profit is " + formatMoney(result.netProfit) + ". Margin is " + formatPercent(result.margin) + ".";
    }
    var summaryEl = document.getElementById("summary");
    summaryEl.textContent = summary;
    summaryEl.classList.toggle("loss", loss);

    var gapText = "Shipping you cover: " + formatMoney(result.shippingGap) + ".";
    var showGap = result.shippingGap > 0;
    document.getElementById("shippingNote").hidden = !showGap;
    document.getElementById("shippingCover").hidden = !showGap;
    if (showGap) {
      setText("shippingNote", gapText);
      setText("shippingCover", gapText);
    }

    writeJson(SETTINGS_KEY, settings);
    renderSaved(settings);
  }

  function labeledStat(label, value, isLoss) {
    var span = document.createElement("span");
    var caption = document.createElement("small");
    caption.textContent = label;
    var amount = document.createElement("b");
    amount.textContent = value;
    if (isLoss) amount.className = "loss";
    span.append(caption, amount);
    return span;
  }

  function renderSaved(settings) {
    var packages = readJson(PACKAGES_KEY, []);
    if (!Array.isArray(packages)) packages = [];
    var section = document.getElementById("savedSection");
    var list = document.getElementById("savedList");
    list.replaceChildren();
    section.hidden = packages.length === 0;

    packages.forEach(function (item) {
      var pkg = item.pkg || {};
      var result = TechnovaCalc.calculate(pkg, settings || readSettings());
      var row = document.createElement("div");
      row.className = "saved-row";
      if (item.id === activeId) row.classList.add("is-open");

      var label = (pkg.name && String(pkg.name).trim()) || "Untitled package";
      var open = document.createElement("button");
      open.type = "button";
      open.className = "open name-cell";
      var title = document.createElement("strong");
      title.textContent = label;
      open.appendChild(title);
      open.setAttribute("aria-label", "Open " + label);
      open.addEventListener("click", function () {
        activeId = item.id;
        writePackage(pkg);
        setStatus("");
        render();
        var entry = document.getElementById("package-entry");
        var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        entry.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      });

      var price = labeledStat("Price", result.ready ? formatMoney(result.price) : "—", false);
      var net = labeledStat(
        "Net profit",
        result.ready ? formatMoney(result.netProfit) : "—",
        result.ready && result.netProfit < 0
      );
      var margin = labeledStat(
        "Margin",
        result.ready ? formatPercent(result.margin) : "—",
        result.ready && result.margin !== null && result.margin < 0
      );

      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "danger";
      remove.textContent = "Remove";
      remove.setAttribute("aria-label", "Remove " + label);
      remove.addEventListener("click", function () {
        var next = readJson(PACKAGES_KEY, []).filter(function (saved) {
          return saved.id !== item.id;
        });
        writeJson(PACKAGES_KEY, next);
        if (activeId === item.id) activeId = null;
        renderSaved(readSettings());
      });

      row.append(open, price, net, margin, remove);
      list.appendChild(row);
    });
  }

  function setStatus(text, kind) {
    var el = document.getElementById("formStatus");
    el.textContent = text;
    el.classList.toggle("is-saved", kind === "saved");
  }

  function packageIsEmpty(pkg) {
    return packageFields.every(function (id) {
      return blank(pkg[id]);
    });
  }

  writeSettings(readJson(SETTINGS_KEY, {}));
  writePackage({});

  document.querySelectorAll(".calc-wrap input").forEach(function (input) {
    function onEdit() {
      if (
        input.name === "productType" ||
        input.name === "priceIncludesVat" ||
        packageFields.indexOf(input.id) !== -1
      ) {
        activeId = null;
      }
      setStatus("");
      render();
    }
    input.addEventListener("input", onEdit);
    input.addEventListener("change", onEdit);
  });

  document.getElementById("packageForm").addEventListener("submit", function (event) {
    event.preventDefault();
  });

  document.getElementById("savePackage").addEventListener("click", function () {
    var pkg = readPackage();
    if (!pkg.productType) {
      setStatus("Choose Games or Stationery before saving.");
      return;
    }
    if (pkg.priceIncludesVat === null) {
      setStatus("Say whether the price includes VAT before saving.");
      return;
    }
    if (packageIsEmpty(pkg)) {
      setStatus("Enter a package name or price before saving.");
      return;
    }
    var packages = readJson(PACKAGES_KEY, []);
    if (!Array.isArray(packages)) packages = [];
    var id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    packages.unshift({ id: id, pkg: pkg });
    writeJson(PACKAGES_KEY, packages.slice(0, 30));
    activeId = id;
    setStatus("Saved on this device.", "saved");
    render();
  });

  document.getElementById("clearPackage").addEventListener("click", function () {
    activeId = null;
    writePackage({});
    setStatus("");
    render();
  });

  render();
})();
