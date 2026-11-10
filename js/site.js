/* ============================================================
   LES PRIX : à modifier ici, et nulle part ailleurs.
   Exemple : vsl: "≈ 2 200 €" (le signe ≈ veut dire « environ »)
   ============================================================ */
var PRIX = {
  vsl: "≈ 2 000 €",            // Une pièce : une VSL
  emails: "≈ 1 000 €",         // Une pièce : une séquence d'emails
  ads: "≈ 500 à 750 €",        // Une pièce : une publicité
  maisonSimple: "≈ 3 500 €",   // Un tunnel de vente complet (media buying, 10 ads, VSL, séquence d'emails)
  maisonAiles: "Sur devis"   // Un tunnel complexe
};

(function () {
  // Prix
  document.querySelectorAll("[data-prix]").forEach(function (el) {
    var v = PRIX[el.getAttribute("data-prix")];
    if (v) el.textContent = v;
  });

  // Typographie française : espaces insécables avant ? ! : ; » € % et après «
  window.typoFr = function (racine) {
    var marcheur = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode && n.parentNode.nodeName;
        return p === "SCRIPT" || p === "STYLE" ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    var n;
    while ((n = marcheur.nextNode())) {
      var t = n.nodeValue.replace(/ ([?!:;»€%])/g, " $1").replace(/« /g, "« ");
      if (t !== n.nodeValue) n.nodeValue = t;
    }
  };
  window.typoFr(document.body);

  // La maison du hero
  var dessin = document.getElementById("hero-dessin");
  if (dessin && window.MaisonIso) {
    dessin.innerHTML = window.MaisonIso({ trace: true, complet: true });
  }

  // Barre de progression de lecture
  var barre = document.querySelector(".progression span");
  var enAttente = false;
  function progression() {
    enAttente = false;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    barre.style.transform = "scaleX(" + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ")";
  }
  window.addEventListener("scroll", function () {
    if (!enAttente) { enAttente = true; requestAnimationFrame(progression); }
  }, { passive: true });
  progression();

  // Apparitions au défilement, compteurs
  function compter(el) {
    var fin = parseFloat(el.getAttribute("data-compte"));
    var dec = +el.getAttribute("data-dec") || 0;
    var debut = null;
    function fmt(v) {
      return v.toFixed(dec).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
    }
    function pas(t) {
      if (debut === null) debut = t;
      var p = Math.min(1, (t - debut) / 1300);
      el.textContent = fmt(fin * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(pas);
    }
    requestAnimationFrame(pas);
  }
  var calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll(".stagger").forEach(function (g) {
    Array.prototype.forEach.call(g.children, function (c, i) { c.style.setProperty("--i", i); });
  });
  var blocs = document.querySelectorAll(".tete, .feuille-in > *:not(.tete):not(.stagger), .feuille-in > .col > *, .hero-dessin");
  if ("IntersectionObserver" in window) {
    var voir = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("vu");
        voir.unobserve(e.target);
        if (!calme) e.target.querySelectorAll("[data-compte]").forEach(compter);
        if (e.target.matches && e.target.matches("[data-compte]") && !calme) compter(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    blocs.forEach(function (b) { b.classList.add("reveal"); voir.observe(b); });
    document.querySelectorAll(".stagger").forEach(function (g) { voir.observe(g); });
  } else {
    document.querySelectorAll(".stagger").forEach(function (g) { g.classList.add("vu"); });
  }

  // Bandeau défilant : on double la liste pour une boucle sans couture
  var defile = document.querySelector(".defile");
  if (defile && !calme) {
    var piste = defile.querySelector(".defile-piste");
    var items = Array.prototype.slice.call(piste.children);
    for (var k = 0; k < 3; k++) {
      items.forEach(function (li) {
        var c = li.cloneNode(true);
        c.setAttribute("aria-hidden", "true");
        piste.appendChild(c);
      });
    }
    defile.classList.add("anime");
  }

  // Un lien vers #tarifs ou vers une fiche ouvre la fiche visée
  function ouvrirCible() {
    var cible = location.hash && document.querySelector(location.hash);
    if (cible && cible.tagName === "DETAILS") cible.open = true;
  }
  window.addEventListener("hashchange", ouvrirCible);
  ouvrirCible();

  // Bouton « Copier mon adresse email »
  document.querySelectorAll("[data-copier]").forEach(function (b) {
    var texte = b.textContent;
    b.addEventListener("click", function () {
      var valeur = b.getAttribute("data-copier");
      function fait() { b.textContent = "Adresse copiée ✓"; setTimeout(function () { b.textContent = texte; }, 2200); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(valeur).then(fait, function () { window.location.href = "mailto:" + valeur; });
      } else {
        window.location.href = "mailto:" + valeur;
      }
    });
  });
})();
