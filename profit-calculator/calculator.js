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

  function calculate(pkg, settings) {
    pkg = pkg || {};
    settings = settings || {};

    var price = money(pkg.price);
    var productCost = money(pkg.productCost);
    var giftCost = money(pkg.giftCost);
    var packagingCost = money(pkg.packagingCost);
    var actualShipping = money(pkg.actualShipping);
    var customerShipping = money(pkg.customerShipping);
    var productType =
      pkg.productType === "stationery" ? "stationery" : pkg.productType === "games" ? "games" : "";
    var priceIncludesVat = includesVatOf(pkg.priceIncludesVat);

    var vatGames = percent(settings.vatGames);
    var vatStationery = percent(settings.vatStationery);
    var vatRate = productType === "stationery" ? vatStationery : vatGames;
    var cardRate = percent(settings.cardCommission);
    var cardFixed = money(settings.cardFixed);
    var taxRate = percent(settings.companyTax);
    var shippingGap = cents(actualShipping - customerShipping);
    var ready = productType !== "" && priceIncludesVat !== null;

    var base = {
      ready: ready,
      productType: productType,
      priceIncludesVat: priceIncludesVat,
      vatGames: vatGames,
      vatStationery: vatStationery,
      vatRate: vatRate,
      cardRate: cardRate,
      cardFixed: cardFixed,
      taxRate: taxRate,
      price: price,
      customerShipping: customerShipping,
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

    var vat = cents(priceIncludesVat ? (price * vatRate) / (100 + vatRate) : (price * vatRate) / 100);
    var customerPays = cents(priceIncludesVat ? price + customerShipping : price + vat + customerShipping);
    var revenueExVat = cents(customerPays - vat);
    var directCosts = cents(productCost + giftCost + packagingCost + actualShipping);
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

  return { calculate: calculate, num: num };
});
