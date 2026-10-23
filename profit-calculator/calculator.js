(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.TechnovaCalc = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function num(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    var arabic = "٠١٢٣٤٥٦٧٨٩";
    var text = String(value ?? "")
      .trim()
      .replace(/[٠-٩]/g, function (digit) {
        return String(arabic.indexOf(digit));
      })
      .replace(/\s/g, "");

    var hasComma = text.indexOf(",") !== -1;
    var hasDot = text.indexOf(".") !== -1;
    if (hasComma && hasDot) {
      if (text.lastIndexOf(",") > text.lastIndexOf(".")) {
        text = text.replace(/\./g, "").replace(",", ".");
      } else {
        text = text.replace(/,/g, "");
      }
    } else if (hasComma || hasDot) {
      var sep = hasComma ? "," : ".";
      var parts = text.split(sep);
      if (parts.length > 2) {
        text = parts.join("");
      } else {
        var fraction = parts[1] || "";
        var whole = parts[0];
        var thousands =
          fraction.length === 3 &&
          whole !== "" &&
          whole !== "-" &&
          whole !== "0" &&
          whole !== "-0";
        text = thousands ? whole + fraction : whole + "." + fraction;
      }
    }

    text = text.replace(/[^\d.-]/g, "");
    var parsed = parseFloat(text);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function cents(value) {
    var n = Number(value);
    if (!Number.isFinite(n)) return 0;
    var rounded = Math.round(n * 100 + Math.sign(n) * 1e-8) / 100;
    return Object.is(rounded, -0) ? 0 : rounded;
  }

  function money(value) {
    return cents(Math.max(0, num(value)));
  }

  function percent(value) {
    var n = Math.min(100, Math.max(0, num(value)));
    return Math.round(n * 100) / 100;
  }

  function includesVatOf(value) {
    if (value === true || value === "yes") return true;
    if (value === false || value === "no") return false;
    return null;
  }

  function blank(value) {
    return String(value ?? "").trim() === "";
  }

  function costsOf(pkg) {
    var productCost = money(pkg.productCost);
    var otherCost = blank(pkg.otherCost)
      ? cents(money(pkg.giftCost) + money(pkg.packagingCost))
      : money(pkg.otherCost);
    var actualShipping = money(pkg.actualShipping);
    var customerShipping = money(pkg.customerShipping);
    return {
      productCost: productCost,
      otherCost: otherCost,
      actualShipping: actualShipping,
      customerShipping: customerShipping,
      direct: cents(productCost + otherCost + actualShipping),
    };
  }

  function ratesOf(settings) {
    settings = settings || {};
    return {
      vatRate: percent(blank(settings.vat) ? settings.vatGames : settings.vat),
      cardRate: percent(settings.cardCommission),
      cardFixed: money(settings.cardFixed),
      taxRate: percent(settings.companyTax),
    };
  }

  function calculate(pkg, settings) {
    pkg = pkg || {};
    settings = settings || {};

    var price = money(pkg.price);
    var costs = costsOf(pkg);
    var rates = ratesOf(settings);
    var priceIncludesVat = includesVatOf(pkg.priceIncludesVat);
    var shippingGap = cents(costs.actualShipping - costs.customerShipping);
    var ready = priceIncludesVat !== null;

    var base = {
      ready: ready,
      priceIncludesVat: priceIncludesVat,
      vatRate: rates.vatRate,
      cardRate: rates.cardRate,
      cardFixed: rates.cardFixed,
      taxRate: rates.taxRate,
      price: price,
      customerShipping: costs.customerShipping,
      directCosts: ready ? costs.direct : null,
      shippingGap: shippingGap,
    };

    if (!ready) {
      return Object.assign(base, {
        customerPays: null,
        vat: null,
        revenueExVat: null,
        directCosts: null,
        cardFee: null,
        profitBeforeTax: null,
        companyTax: null,
        netProfit: null,
        margin: null,
      });
    }

    var vatRate = rates.vatRate;
    var cardRate = rates.cardRate;
    var cardFixed = rates.cardFixed;
    var taxRate = rates.taxRate;
    var customerShipping = costs.customerShipping;
    var directCosts = costs.direct;
    var vat = cents(priceIncludesVat ? (price * vatRate) / (100 + vatRate) : (price * vatRate) / 100);
    var customerPays = cents(priceIncludesVat ? price + customerShipping : price + vat + customerShipping);
    var revenueExVat = cents(customerPays - vat);
    var cardFee = cents(customerPays * (cardRate / 100) + cardFixed);
    var profitBeforeTax = cents(revenueExVat - directCosts - cardFee);
    var companyTax = profitBeforeTax > 0 ? cents(profitBeforeTax * (taxRate / 100)) : 0;
    var netProfit = cents(profitBeforeTax - companyTax);
    var margin = revenueExVat > 0 ? (netProfit / revenueExVat) * 100 : null;

    return Object.assign(base, {
      customerPays: customerPays,
      vat: vat,
      revenueExVat: revenueExVat,
      directCosts: directCosts,
      cardFee: cardFee,
      profitBeforeTax: profitBeforeTax,
      companyTax: companyTax,
      netProfit: netProfit,
      margin: margin,
    });
  }

  function priceForMargin(pkg, settings, targetMargin) {
    pkg = pkg || {};
    settings = settings || {};
    if (blank(targetMargin)) return { ready: false, reason: "enter" };

    var target = percent(targetMargin);
    var marginFraction = target / 100;
    if (marginFraction >= 1) return { ready: false, reason: "under-100" };

    var priceIncludesVat = includesVatOf(pkg.priceIncludesVat);
    if (priceIncludesVat === null) return { ready: false, reason: "vat-choice" };

    var rates = ratesOf(settings);
    var costs = costsOf(pkg);
    var vatFraction = rates.vatRate / 100;
    var cardFraction = rates.cardRate / 100;
    var taxFraction = rates.taxRate / 100;
    if (taxFraction >= 1 && marginFraction > 0) return { ready: false, reason: "tax" };

    var alpha = taxFraction < 1 ? marginFraction / (1 - taxFraction) : marginFraction;
    var keptShipping = costs.customerShipping * (1 - cardFraction) - costs.direct - rates.cardFixed;
    var numerator = alpha * costs.customerShipping - keptShipping;
    var denominator = priceIncludesVat
      ? (1 - alpha) / (1 + vatFraction) - cardFraction
      : 1 - alpha - cardFraction * (1 + vatFraction);

    if (!(denominator > 1e-9)) return { ready: false, reason: "impossible" };

    var raw = numerator / denominator;
    var overshot = raw < 0;
    var price = overshot ? 0 : cents(raw);
    var guard = 0;
    var quote = calculate(Object.assign({}, pkg, { price: price }), settings);
    while (
      !overshot &&
      quote.ready &&
      quote.margin !== null &&
      quote.margin + 1e-6 < target &&
      guard < 50
    ) {
      price = cents(price + 0.01);
      quote = calculate(Object.assign({}, pkg, { price: price }), settings);
      guard += 1;
    }

    return {
      ready: true,
      price: price,
      overshot: overshot,
      target: target,
      quote: quote,
    };
  }

  return { calculate: calculate, priceForMargin: priceForMargin, num: num };
});
