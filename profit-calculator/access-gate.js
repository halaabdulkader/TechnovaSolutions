(function () {
    var KEY = 'technova-pricing-code';
    var gate = document.getElementById('accessGate');
    var app = document.getElementById('calculator');
    var form = document.getElementById('accessForm');
    var input = document.getElementById('accessCode');
    var error = document.getElementById('accessError');
    var expired = document.getElementById('accessExpired');
    if (!gate || !app || !form || !input) return;

    function list() {
        var codes = window.TechnovaAccess && window.TechnovaAccess.codes;
        return Array.isArray(codes) ? codes : [];
    }

    function find(value) {
        var code = String(value || '').trim().toLowerCase();
        if (!code) return null;
        var found = null;
        list().some(function (item) {
            var entry = typeof item === 'string' ? { code: item } : item;
            if (!entry || String(entry.code || '').trim().toLowerCase() !== code) return false;
            found = entry;
            return true;
        });
        return found;
    }

    function live(entry) {
        if (!entry || !entry.expires) return false;
        var end = Date.parse(String(entry.expires) + 'T23:59:59');
        return !Number.isNaN(end) && end >= Date.now();
    }

    function forget() {
        try {
            localStorage.removeItem(KEY);
        } catch (err) {
            /* Nothing stored to clear. */
        }
    }

    function show(which) {
        if (error) error.hidden = which !== 'bad';
        if (expired) expired.hidden = which !== 'expired';
    }

    function lock() {
        app.hidden = true;
        gate.hidden = false;
    }

    function openApp() {
        show('');
        gate.hidden = true;
        app.hidden = false;
    }

    var saved = '';
    try {
        saved = localStorage.getItem(KEY) || '';
    } catch (err) {
        saved = '';
    }
    var savedEntry = find(saved);
    if (savedEntry && live(savedEntry)) openApp();
    else {
        lock();
        if (savedEntry) {
            forget();
            show('expired');
        }
    }

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        var entry = find(input.value);
        if (!entry) {
            lock();
            show('bad');
            input.focus();
            return;
        }
        if (!live(entry)) {
            lock();
            forget();
            show('expired');
            input.focus();
            return;
        }
        try {
            localStorage.setItem(KEY, input.value.trim());
        } catch (err) {
            /* The page still opens for this visit. */
        }
        openApp();
    });
})();
