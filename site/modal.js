/* MADA — Rendez-vous modal
 * ================================================================
 * EmailJS setup — fill in your credentials (see .env.example):
 *   1. Create a free account at https://emailjs.com
 *   2. Create a Service (Gmail / SMTP / etc.)
 *   3. Create a Template with these variables:
 *        {{from_name}}  {{phone}}   {{from_email}}
 *        {{company}}    {{message}} {{date}}
 *      Subject: Nouvelle demande de rendez-vous — {{from_name}}
 *   4. Copy your Public Key from Account → API Keys
 * ================================================================ */
(function () {
  'use strict';

  /* ─── Config ────────────────────────────────────────────────────── */
  var CONTACT_EMAIL = 'marketingw2026@gmail.com';    /* Destination — also set in your EmailJS template */
  var EMAILJS_KEY   = 'YOUR_PUBLIC_KEY';    /* Replace with your EmailJS public key            */
  var EMAILJS_SVC   = 'YOUR_SERVICE_ID';    /* e.g. 'service_abc1234'                          */
  var EMAILJS_TPL   = 'YOUR_TEMPLATE_ID';   /* e.g. 'template_xyz9876'                         */

  /* ─── EmailJS boot ──────────────────────────────────────────────── */
  if (window.emailjs && EMAILJS_KEY !== 'YOUR_PUBLIC_KEY') {
    emailjs.init({ publicKey: EMAILJS_KEY });
  }

  /* ─── DOM refs ──────────────────────────────────────────────────── */
  var overlay    = document.getElementById('modalOverlay');
  var form       = document.getElementById('appointmentForm');
  var closeBtn   = document.getElementById('modalClose');
  var submitBtn  = document.getElementById('submitBtn');
  var submitText = document.getElementById('submitText');
  var submitLoad = document.getElementById('submitLoader');
  var toastWrap  = document.getElementById('toastContainer');
  var descField  = document.getElementById('fieldDescription');
  var charHint   = document.getElementById('charHint');
  if (!overlay || !form) return;

  /* ─── Open / close modal ────────────────────────────────────────── */
  function openModal() {
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(function () {
      var first = form.querySelector('.form-input');
      if (first) first.focus();
    }, 300);
  }

  function closeModal() {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(resetForm, 360);
  }

  /* Bind every "Prendre un rendez-vous" CTA + footer link */
  Array.prototype.slice.call(
    document.querySelectorAll('a[href="#contact"].btn, .footer-col a[href="#contact"]')
  ).forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      openModal();
    });
  });

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeModal();
  });

  /* ─── Character counter (description) ──────────────────────────── */
  if (descField && charHint) {
    descField.addEventListener('input', function () {
      var len = descField.value.length;
      charHint.textContent = len < 20 ? len + ' / 20 min.' : len + ' car.';
      charHint.className = 'char-hint' + (len >= 20 ? ' ok' : '');
    });
  }

  /* ─── Validation helpers ────────────────────────────────────────── */
  function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }
  function isValidPhone(v) { return /^[+\d\s\-().]{8,20}$/.test(v.trim()); }

  function setError(inputId, errorId, msg) {
    var inp = document.getElementById(inputId);
    var err = document.getElementById(errorId);
    if (!inp || !err) return;
    err.textContent = msg;
    inp.classList.toggle('has-error', !!msg);
  }

  function clearErrors() {
    ['fieldName', 'fieldPhone', 'fieldEmail', 'fieldDescription'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.remove('has-error');
    });
    ['errorName', 'errorPhone', 'errorEmail', 'errorDescription'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = '';
    });
  }

  function validate() {
    clearErrors();
    var ok   = true;
    var name = (document.getElementById('fieldName')        || {}).value || '';
    var tel  = (document.getElementById('fieldPhone')       || {}).value || '';
    var mail = (document.getElementById('fieldEmail')       || {}).value || '';
    var desc = (document.getElementById('fieldDescription') || {}).value || '';

    if (!name.trim() || name.trim().length < 2) {
      setError('fieldName', 'errorName', 'Le nom doit contenir au moins 2 caractères.');
      ok = false;
    }
    if (!tel.trim() || !isValidPhone(tel)) {
      setError('fieldPhone', 'errorPhone', 'Numéro de téléphone invalide.');
      ok = false;
    }
    if (mail.trim() && !isValidEmail(mail)) {
      setError('fieldEmail', 'errorEmail', 'Adresse e-mail invalide.');
      ok = false;
    }
    if (!desc.trim() || desc.trim().length < 20) {
      setError('fieldDescription', 'errorDescription', 'La description doit contenir au moins 20 caractères.');
      ok = false;
    }
    return ok;
  }

  /* Inline blur validation */
  function onBlur(inputId, errorId, check) {
    var el = document.getElementById(inputId);
    if (el) el.addEventListener('blur', function () { check(el.value); });
  }
  onBlur('fieldName', 'errorName', function (v) {
    setError('fieldName', 'errorName', (!v.trim() || v.trim().length < 2) ? 'Le nom doit contenir au moins 2 caractères.' : '');
  });
  onBlur('fieldPhone', 'errorPhone', function (v) {
    setError('fieldPhone', 'errorPhone', (!v.trim() || !isValidPhone(v)) ? 'Numéro de téléphone invalide.' : '');
  });
  onBlur('fieldEmail', 'errorEmail', function (v) {
    setError('fieldEmail', 'errorEmail', (v.trim() && !isValidEmail(v)) ? 'Adresse e-mail invalide.' : '');
  });
  onBlur('fieldDescription', 'errorDescription', function (v) {
    setError('fieldDescription', 'errorDescription', (!v.trim() || v.trim().length < 20) ? 'La description doit contenir au moins 20 caractères.' : '');
  });

  /* ─── Loading state ─────────────────────────────────────────────── */
  function setLoading(on) {
    submitBtn.disabled = on;
    if (submitText) submitText.textContent = on ? 'Envoi en cours…' : 'Envoyer ma demande';
    if (submitLoad) submitLoad.hidden = !on;
  }

  /* ─── Toast notifications ───────────────────────────────────────── */
  var ICON_OK  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  var ICON_ERR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';

  function showToast(type, title, body) {
    var t = document.createElement('div');
    t.className = 'toast toast--' + type;
    t.setAttribute('role', 'status');
    t.innerHTML =
      '<div class="toast-icon">' + (type === 'success' ? ICON_OK : ICON_ERR) + '</div>' +
      '<div class="toast-body"><strong>' + title + '</strong><span>' + body + '</span></div>';
    toastWrap.appendChild(t);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { t.classList.add('is-visible'); });
    });
    setTimeout(function () {
      t.classList.remove('is-visible');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 420);
    }, 6500);
  }

  /* ─── Reset form ────────────────────────────────────────────────── */
  function resetForm() {
    form.reset();
    clearErrors();
    if (charHint) { charHint.textContent = '0 / 20 min.'; charHint.className = 'char-hint'; }
    setLoading(false);
  }

  /* ─── Submit ────────────────────────────────────────────────────── */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) {
      var firstErr = form.querySelector('.has-error');
      if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setLoading(true);

    var now = new Date();
    var dateStr = now.toLocaleDateString('fr-FR', {
      weekday: 'long', year: 'numeric', month: 'long',
      day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    var params = {
      to_email:   CONTACT_EMAIL,
      from_name:  document.getElementById('fieldName').value.trim(),
      phone:      document.getElementById('fieldPhone').value.trim(),
      from_email: document.getElementById('fieldEmail').value.trim() || 'Non renseigné',
      company:    document.getElementById('fieldCompany').value.trim() || 'Non renseignée',
      message:    document.getElementById('fieldDescription').value.trim(),
      date:       dateStr
    };

    /* Dev/unconfigured fallback — lets you test the UI without EmailJS */
    if (!window.emailjs || EMAILJS_KEY === 'YOUR_PUBLIC_KEY') {
      console.log('[MADA] EmailJS not configured — see site/modal.js. Params:', params);
      showToast('success', 'Demande envoyée !', 'Nous vous contacterons très prochainement.');
      setLoading(false);
      setTimeout(closeModal, 2800);
      return;
    }

    emailjs.send(EMAILJS_SVC, EMAILJS_TPL, params)
      .then(function () {
        showToast('success', 'Demande envoyée !', 'Nous vous contacterons très prochainement.');
        setLoading(false);
        setTimeout(closeModal, 2800);
      })
      .catch(function (err) {
        console.error('[MADA] EmailJS error:', err);
        showToast('error', "Erreur d'envoi", 'Une erreur est survenue. Réessayez ou écrivez-nous directement.');
        setLoading(false);
      });
  });
})();
