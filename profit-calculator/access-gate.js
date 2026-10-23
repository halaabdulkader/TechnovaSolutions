(function () {
    var KEY = 'technova-pricing-code';
    var gate = document.getElementById('accessGate');
    var app = document.getElementById('calculator');
    var form = document.getElementById('accessForm');
    var input = document.getElementById('accessCode');
    var error = document.getElementById('accessError');
    if (!gate || !app || !form || !input) return;

    function codes() {
        var list = window.TechnovaAccess && window.TechnovaAccess.codes;
        return Array.isArray(list) ? list : [];
    }

    function allowed(value) {
        var code = String(value || '').trim().toLowerCase();
        if (!code) return false;
        return codes().some(function (item) {
            return String(item).trim().toLowerCase() === code;
        });
    }

    function openApp() {
        gate.hidden = true;
        app.hidden = false;
    }

    var saved = '';
    try {
        saved = localStorage.getItem(KEY) || '';
    } catch (err) {
        saved = '';
    }
    if (allowed(saved)) openApp();

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        if (!allowed(input.value)) {
            error.hidden = false;
            input.focus();
            return;
        }
        try {
            localStorage.setItem(KEY, input.value.trim());
        } catch (err) {
            /* The page still opens for this visit. */
        }
        error.hidden = true;
        openApp();
    });
})();
