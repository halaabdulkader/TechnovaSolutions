(function () {
  var SETTINGS_KEY = "acbak-settings";
  var DRAFT_KEY = "acbak-draft";
  var PACKAGES_KEY = "acbak-packages";

  var defaultSettings = {
    kdvGames: "20",
    kdvStationery: "20",
    iyzicoRate: "4.29",
    iyzicoFixed: "0.25",
    companyTax: "25",
  };

  var examplePackage = {
    name: "باقة صلصال 1+2",
    productType: "games",
    price: "650",
    productCost: "114",
    giftCost: "35",
    packagingCost: "20",
    actualShipping: "170",
    customerShipping: "120",
    priceIncludesKdv: true,
  };

  var settingFields = ["kdvGames", "kdvStationery", "iyzicoRate", "iyzicoFixed", "companyTax"];
  var packageFields = [
    "name",
    "price",
    "productCost",
    "giftCost",
    "packagingCost",
    "actualShipping",
    "customerShipping",
  ];

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function ltr(text) {
    return "\u200E" + text;
  }

  function formatMoney(value) {
    var rounded = Math.round((value + Number.EPSILON) * 100) / 100;
    var whole = Math.abs(rounded - Math.round(rounded)) < 0.001;
    var text = Math.abs(rounded).toLocaleString("en-US", {
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: 2,
    });
    return (rounded < 0 ? "−" : "") + "TL " + text;
  }

  function formatPercent(value) {
    if (value === null) return "—";
    var rounded = Math.round(value * 10) / 10;
    return rounded.toLocaleString("en-US", { maximumFractionDigits: 1 }) + "%";
  }

  function formatRate(value) {
    var rounded = Math.round(value * 100) / 100;
    return rounded.toLocaleString("en-US", { maximumFractionDigits: 2 }) + "%";
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
    pkg.productType = document.querySelector('input[name="productType"]:checked').value;
    pkg.priceIncludesKdv = document.querySelector('input[name="priceIncludesKdv"]:checked').value === "yes";
    return pkg;
  }

  function writeSettings(settings) {
    settingFields.forEach(function (id) {
      document.getElementById(id).value = settings[id] != null ? settings[id] : defaultSettings[id];
    });
  }

  function writePackage(pkg) {
    packageFields.forEach(function (id) {
      document.getElementById(id).value = pkg[id] != null ? pkg[id] : "";
    });
    var type = pkg.productType === "stationery" ? "stationery" : "games";
    document.querySelector('input[name="productType"][value="' + type + '"]').checked = true;
    var includes = pkg.priceIncludesKdv === false ? "no" : "yes";
    document.querySelector('input[name="priceIncludesKdv"][value="' + includes + '"]').checked = true;
  }

  function setText(id, text) {
    document.getElementById(id).textContent = text;
  }

  function markSigned(id, value) {
    document.getElementById(id).closest(".result, .metric, .answer-cell").classList.toggle("loss", value < 0);
  }

  function render() {
    var settings = readSettings();
    var pkg = readPackage();
    var result = AcbakCalc.calculate(pkg, settings);
    var typeLabel = result.productType === "games" ? "ألعاب" : "قرطاسية";

    document.querySelectorAll("[data-rate]").forEach(function (field) {
      field.dataset.active = String(field.dataset.rate === result.productType);
    });

    setText("cardPrice", formatMoney(result.price));
    setText("cardShipping", formatMoney(result.customerShipping));
    setText("cardTotal", formatMoney(result.customerTotal));
    setText("cardCosts", formatMoney(result.directCosts));
    setText("kdvValue", formatMoney(result.kdv));
    setText(
      "kdvHow",
      result.includesKdv
        ? "مستخرجة من سعر الباقة الشامل بنسبة " + ltr(formatRate(result.kdvRate)) + " (" + typeLabel + ")"
        : "مضافة فوق سعر الباقة بنسبة " + ltr(formatRate(result.kdvRate)) + " (" + typeLabel + ")"
    );
    setText("revenueValue", formatMoney(result.revenueExKdv));
    setText("commissionValue", formatMoney(result.commission));
    setText("beforeTaxValue", formatMoney(result.profitBeforeTax));
    setText("taxValue", formatMoney(result.companyTax));
    setText("netValue", formatMoney(result.netProfit));
    setText("marginValue", formatPercent(result.margin));
    markSigned("beforeTaxValue", result.profitBeforeTax);
    markSigned("netValue", result.netProfit);
    markSigned("marginValue", result.margin === null ? 0 : result.margin);

    var name = pkg.name.trim() || "باقة بدون اسم";
    setText("packageCaption", name);

    var shippingNote = document.getElementById("shippingNote");
    if (result.shippingGap > 0.004) {
      shippingNote.hidden = false;
      shippingNote.textContent = "فرق الشحن على حسابك: " + ltr(formatMoney(result.shippingGap));
    } else if (result.shippingGap < -0.004) {
      shippingNote.hidden = false;
      shippingNote.textContent = "الشحن الذي يدفعه الزبون يزيد الإيراد بمقدار " + ltr(formatMoney(-result.shippingGap));
    } else {
      shippingNote.hidden = true;
      shippingNote.textContent = "";
    }

    var summary;
    if (result.margin === null) {
      summary = "أدخل سعر الباقة ليظهر الهامش.";
    } else if (result.netProfit < 0) {
      summary =
        "هذه الباقة خاسرة بعد العمولة. العجز " +
        ltr(formatMoney(result.netProfit)) +
        "، والهامش " +
        ltr(formatPercent(result.margin)) +
        ".";
    } else {
      summary =
        "بعد العمولة والضريبة التقديرية، صافي هذه الباقة " +
        ltr(formatMoney(result.netProfit)) +
        "، وهامشها " +
        ltr(formatPercent(result.margin)) +
        ".";
    }
    setText("summary", summary);

    writeJson(SETTINGS_KEY, settings);
    writeJson(DRAFT_KEY, pkg);
    renderSaved();
  }

  function labeledStat(label, value) {
    var span = document.createElement("span");
    var caption = document.createElement("small");
    caption.textContent = label;
    var amount = document.createElement("b");
    amount.dir = "ltr";
    amount.textContent = value;
    span.append(caption, amount);
    return span;
  }

  function renderSaved() {
    var packages = readJson(PACKAGES_KEY, []);
    var section = document.getElementById("savedSection");
    var list = document.getElementById("savedList");
    list.replaceChildren();
    section.hidden = packages.length === 0;

    packages.forEach(function (item) {
      var result = AcbakCalc.calculate(item.pkg, readSettings());
      var row = document.createElement("div");
      row.className = "saved-row";

      var open = document.createElement("button");
      open.type = "button";
      open.className = "open name-cell";
      var title = document.createElement("strong");
      title.textContent = item.pkg.name || "باقة بدون اسم";
      open.appendChild(title);
      open.addEventListener("click", function () {
        writePackage(item.pkg);
        render();
      });

      var price = labeledStat("السعر", formatMoney(result.price));
      var net = labeledStat("الصافي", formatMoney(result.netProfit));
      var margin = labeledStat("الهامش", formatPercent(result.margin));
      if (result.netProfit < 0) net.querySelector("b").style.color = "var(--loss)";

      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "danger";
      remove.textContent = "حذف";
      remove.addEventListener("click", function () {
        var next = readJson(PACKAGES_KEY, []).filter(function (saved) {
          return saved.id !== item.id;
        });
        writeJson(PACKAGES_KEY, next);
        renderSaved();
      });

      row.append(open, price, net, margin, remove);
      list.appendChild(row);
    });
  }

  writeSettings(Object.assign({}, defaultSettings, readJson(SETTINGS_KEY, {})));
  writePackage(Object.assign({}, examplePackage, readJson(DRAFT_KEY, {})));

  document.querySelectorAll("input").forEach(function (input) {
    input.addEventListener("input", render);
    input.addEventListener("change", render);
  });

  document.getElementById("savePackage").addEventListener("click", function () {
    var pkg = readPackage();
    var result = AcbakCalc.calculate(pkg, readSettings());
    var packages = readJson(PACKAGES_KEY, []);
    packages.unshift({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      pkg: pkg,
      result: result,
    });
    writeJson(PACKAGES_KEY, packages.slice(0, 30));
    renderSaved();
  });

  document.getElementById("resetExample").addEventListener("click", function () {
    writePackage(examplePackage);
    render();
  });

  render();
})();
