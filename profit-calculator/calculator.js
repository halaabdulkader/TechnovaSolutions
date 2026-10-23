(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.AcbakCalc = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function num(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    const arabic = "٠١٢٣٤٥٦٧٨٩";
    let text = String(value ?? "").trim();
    text = text.replace(/[٠-٩]/g, function (digit) {
      return String(arabic.indexOf(digit));
    });
    text = text.replace(/\s/g, "").replace(/[,\u060c]/g, ".");
    text = text.replace(/[^\d.-]/g, "");
    const parsed = parseFloat(text);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function money(value) {
    return Math.max(0, num(value));
  }

  function percent(value) {
    return Math.min(100, Math.max(0, num(value)));
  }

  function calculate(pkg, settings) {
    const price = money(pkg.price);
    const productCost = money(pkg.productCost);
    const giftCost = money(pkg.giftCost);
    const packagingCost = money(pkg.packagingCost);
    const actualShipping = money(pkg.actualShipping);
    const customerShipping = money(pkg.customerShipping);
    const includesKdv = Boolean(pkg.priceIncludesKdv);
    const productType = pkg.productType === "stationery" ? "stationery" : "games";

    const kdvRate = percent(productType === "games" ? settings.kdvGames : settings.kdvStationery);
    const iyzicoRate = percent(settings.iyzicoRate);
    const iyzicoFixed = money(settings.iyzicoFixed);
    const taxRate = percent(settings.companyTax);

    const kdv = includesKdv ? price * (kdvRate / (100 + kdvRate)) : price * (kdvRate / 100);
    const customerTotal = includesKdv ? price + customerShipping : price + kdv + customerShipping;
    const revenueExKdv = customerTotal - kdv;
    const directCosts = productCost + giftCost + packagingCost + actualShipping;
    const commission = customerTotal * (iyzicoRate / 100) + iyzicoFixed;
    const profitBeforeTax = revenueExKdv - directCosts - commission;
    const companyTax = profitBeforeTax > 0 ? profitBeforeTax * (taxRate / 100) : 0;
    const netProfit = profitBeforeTax - companyTax;
    const margin = revenueExKdv > 0 ? (netProfit / revenueExKdv) * 100 : null;
    const shippingGap = actualShipping - customerShipping;

    return {
      productType,
      kdvRate,
      iyzicoRate,
      iyzicoFixed,
      taxRate,
      includesKdv,
      price,
      customerShipping,
      customerTotal,
      kdv,
      revenueExKdv,
      directCosts,
      commission,
      profitBeforeTax,
      companyTax,
      netProfit,
      margin,
      shippingGap,
    };
  }

  return { calculate, num };
});
