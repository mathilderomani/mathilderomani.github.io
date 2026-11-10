/* Le simulateur : ce que le tunnel du visiteur lui fait perdre chaque mois.
   1. L'activité (infopreneur, e-commerce, SaaS) règle les libellés, les repères et l'exemple.
   2. Les chiffres du visiteur décrivent son tunnel : visiteurs, étape 1, étape 2, panier, budget pub.
   3. Le scénario choisit le bas, le milieu ou le haut des fourchettes publiées.
   Aucun prix ici : savoir quoi réparer, c'est le travail de l'audit.
   Deux freins pour ne jamais promettre 100 % :
   - plus un taux est déjà bon, plus le gain est petit ;
   - chaque étape a un plafond, au-delà duquel on ne compte plus aucun gain.
   Rien n'est envoyé nulle part : tout se calcule dans le navigateur. */
(function () {
  var racine = document.getElementById("simulateur");
  if (!racine) return;

  // ---------- Données ----------
  var PROFILS = {
    info: {
      aide: "Tu vends une formation, un coaching ou un accompagnement en ligne.",
      defaut: { visiteurs: 2000, etape1: 20, etape2: 2, panier: 297, pub: 500 },
      "l-visiteurs": "Visiteurs sur ta page d'inscription, par mois",
      "l-etape1": "Sur 100 visiteurs, combien laissent leur email (%)",
      "r-etape1": "Repère : une landing page convertit 6,6 % des visiteurs en médiane (Unbounce, 2024).",
      "l-etape2": "Sur 100 inscrits, combien achètent (%)",
      "r-etape2": "Si tu ne sais pas, garde 2 % : c'est courant.",
      "l-panier": "Prix de ton offre (en €)",
      "n-visiteurs": "visiteurs", "n-prospects": "inscrits", "n-clients": "clients",
      "k-clients": "Clients par mois",
      "v-etape1": "Plus de visiteurs laissent leur email",
      "v-etape2": "Plus d'inscrits achètent",
      "v-panier": "Chaque vente rapporte un peu plus",
      repere1: 6.6, nomRepere1: "la médiane des landing pages",
      etape1: { mult: { prudent: 1.3, realiste: 1.5, ambitieux: 2 }, plafond: 0.5 },
      etape2: { type: "mult", mult: { prudent: 1.51, realiste: 2, ambitieux: 3 }, plafond: 0.25 }
    },
    ecom: {
      aide: "Tu vends des produits sur ta boutique en ligne.",
      defaut: { visiteurs: 5000, etape1: 6, etape2: 30, panier: 55, pub: 1000 },
      "l-visiteurs": "Visiteurs sur ta boutique, par mois",
      "l-etape1": "Sur 100 visiteurs, combien ajoutent au panier (%)",
      "r-etape1": "Repère : le taux d'achat moyen d'une boutique Shopify est de 1,4 % de tous les visiteurs (Littledata).",
      "l-etape2": "Sur 100 paniers, combien vont jusqu'au paiement (%)",
      "r-etape2": "Repère : 70,22 % des paniers sont abandonnés, donc environ 30 % vont au bout (Baymard, 2025).",
      "l-panier": "Panier moyen (en €)",
      "n-visiteurs": "visiteurs", "n-prospects": "paniers", "n-clients": "commandes",
      "k-clients": "Commandes par mois",
      "v-etape1": "Plus de visiteurs ajoutent au panier",
      "v-etape2": "Plus de paniers vont au bout",
      "v-panier": "Le panier moyen monte",
      repere2: 30, nomRepere2: "la moyenne des boutiques en ligne",
      etape1: { mult: { prudent: 1.3, realiste: 1.5, ambitieux: 2 }, plafond: 0.2 },
      // Part des paniers abandonnés que les relances récupèrent (Klaviyo : 3,33 % en moyenne, 7,69 % pour le top 10 %)
      etape2: { type: "relance", taux: { prudent: 0.0333, realiste: 0.05, ambitieux: 0.0769 }, plafond: 0.8 }
    },
    saas: {
      aide: "Tu vends un logiciel par abonnement.",
      defaut: { visiteurs: 3000, etape1: 4, etape2: 15, panier: 600, pub: 800 },
      "l-visiteurs": "Visiteurs sur ta page d'accueil, par mois",
      "l-etape1": "Sur 100 visiteurs, combien démarrent un essai ou réservent une démo (%)",
      "r-etape1": "Repère : une landing page SaaS convertit 3,8 % des visiteurs en médiane (Unbounce, 2024).",
      "l-etape2": "Sur 100 essais, combien deviennent clients (%)",
      "r-etape2": "Pas de repère public fiable ici : prends tes propres chiffres.",
      "l-panier": "Ce que rapporte un client sur 12 mois (en €)",
      "n-visiteurs": "visiteurs", "n-prospects": "essais", "n-clients": "clients",
      "k-clients": "Nouveaux clients par mois",
      "v-etape1": "Plus de visiteurs démarrent un essai",
      "v-etape2": "Plus d'essais deviennent clients",
      "v-panier": "Chaque client rapporte un peu plus",
      repere1: 3.8, nomRepere1: "la médiane des landing pages SaaS",
      etape1: { mult: { prudent: 1.3, realiste: 1.5, ambitieux: 2 }, plafond: 0.2 },
      etape2: { type: "mult", mult: { prudent: 1.2, realiste: 1.35, ambitieux: 1.5 }, plafond: 0.4 }
    }
  };
  // L'offre au moment de l'achat (systeme.io, via la leçon de Théo)
  var PANIER = { prudent: 1.2, realiste: 1.3, ambitieux: 1.4 };
  var AIDE_SCENARIO = {
    prudent: "Le bas des fourchettes publiées. Le cas où tout ne se passe pas comme prévu.",
    realiste: "Le milieu des fourchettes publiées.",
    ambitieux: "Le haut des fourchettes publiées, celui des meilleurs tunnels."
  };

  var profil = "info", scenario = "realiste";
  var NOMS = ["visiteurs", "etape1", "etape2", "panier", "pub"];
  var champs = {}, curseurs = {};
  NOMS.forEach(function (n) {
    champs[n] = racine.querySelector('[data-champ="' + n + '"]');
    curseurs[n] = racine.querySelector('[data-curseur="' + n + '"]');
  });

  // ---------- Outils ----------
  var nf0 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
  var nf1 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
  function eur(v) { return nf0.format(Math.round(v)) + " €"; }
  function nb(v) { return nf0.format(Math.round(v)); }
  function nbc(v) { return v < 10 ? nf1.format(v) : nf0.format(Math.round(v)); }
  function pct(v) { return nf1.format(v * 100) + " %"; }
  function ecrire(nom, texte) {
    racine.querySelectorAll('[data-sortie="' + nom + '"]').forEach(function (el) { el.textContent = texte; });
  }
  function lire(nom) {
    var c = champs[nom];
    var v = parseFloat(String(c.value).replace(",", "."));
    if (isNaN(v)) v = parseFloat(curseurs[nom].value);
    return Math.min(parseFloat(c.max), Math.max(parseFloat(c.min), v));
  }

  // Les deux freins : le gain diminue quand le taux est déjà bon, et s'arrête au plafond.
  function ameliorer(taux, mult, plafond) {
    if (taux >= plafond) return taux;
    var effet = (mult - 1) * (1 - taux / plafond);
    return Math.min(plafond, taux * (1 + effet));
  }

  // ---------- Le calcul ----------
  function simuler(d) {
    var P = PROFILS[profil];
    var v = d.visiteurs, r1 = d.etape1 / 100, r2 = d.etape2 / 100, p = d.panier;
    var r1b = ameliorer(r1, P.etape1.mult[scenario], P.etape1.plafond);
    var r2b;
    if (P.etape2.type === "relance") {
      r2b = r2 >= P.etape2.plafond ? r2 : Math.min(P.etape2.plafond, r2 + (1 - r2) * P.etape2.taux[scenario]);
    } else {
      r2b = ameliorer(r2, P.etape2.mult[scenario], P.etape2.plafond);
    }
    var p2 = p * PANIER[scenario];
    var prospects = v * r1, clients = prospects * r2;
    var clients2 = v * r1b * r2b;
    return {
      r1: r1, r2: r2, r1b: r1b, r2b: r2b, p: p, p2: p2,
      prospects: prospects, clients: clients, ca: clients * p,
      clients2: clients2, ca2: clients2 * p2
    };
  }

  // ---------- Les pertes cumulées sur 12 mois ----------
  function dessinerCourbe(perteMois) {
    var svg = racine.querySelector("[data-courbe]");
    if (!svg) return;
    var W = Math.round(Math.max(300, Math.min(600, svg.getBoundingClientRect().width || 600)));
    var H = W < 420 ? 200 : 220, g = 24, dr = 40, h = 30, b = 34;
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    var max = Math.max(perteMois * 12, 1);
    function x(m) { return g + (W - g - dr) * m / 12; }
    function y(val) { return h + (H - h - b) * (1 - val / max); }
    var larg = Math.max(6, (W - g - dr) / 12 * 0.55);
    var s = '<line x1="' + g + '" x2="' + (W - dr + 10) + '" y1="' + y(0) + '" y2="' + y(0) + '" stroke="#B8934A" stroke-width="1"/>';
    for (var m = 1; m <= 12; m++) {
      var val = perteMois * m;
      s += '<rect x="' + (x(m) - larg / 2).toFixed(1) + '" y="' + y(val).toFixed(1) + '" width="' + larg.toFixed(1) + '" height="' + Math.max(0, y(0) - y(val)).toFixed(1) + '" rx="3" fill="' + (m === 12 ? "#9C4A32" : "rgba(156,74,50,.28)") + '"/>';
    }
    (W < 420 ? [1, 6, 12] : [1, 3, 6, 9, 12]).forEach(function (m) {
      s += '<text x="' + x(m) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="13" fill="#6B6459">' + m + " mois</text>";
    });
    s += '<text x="' + (x(12) + larg / 2) + '" y="' + (y(perteMois * 12) - 10) + '" text-anchor="end" font-size="14" font-weight="700" fill="#9C4A32">-' + eur(perteMois * 12) + "</text>";
    svg.innerHTML = s;
  }

  // ---------- Mise à jour de l'affichage ----------
  function calculer() {
    var P = PROFILS[profil];
    var d = {};
    NOMS.forEach(function (n) { d[n] = lire(n); });
    var r = simuler(d);
    var perte = Math.max(0, r.ca2 - r.ca);

    // Le tunnel d'aujourd'hui
    ecrire("f-visiteurs", nb(d.visiteurs));
    ecrire("f-prospects", nb(r.prospects));
    ecrire("f-clients", nbc(r.clients));
    ecrire("auj", eur(r.ca));
    var fuite = "";
    if (P.repere1 && d.etape1 < P.repere1) fuite = " Ta première étape est sous " + P.nomRepere1 + " (" + nf1.format(P.repere1) + " %) : c'est sans doute là que tu perds le plus.";
    else if (P.repere2 && d.etape2 < P.repere2) fuite = " Tes paniers vont moins souvent au bout que " + P.nomRepere2 + " (" + P.repere2 + " %) : c'est sans doute là que tu perds le plus.";
    ecrire("perte", "Chaque mois, " + nb(d.visiteurs - r.clients) + " personnes sur " + nb(d.visiteurs) + " repartent sans acheter." + fuite);

    // Les trois leviers, avant et après
    ecrire("e1-avant", pct(r.r1)); ecrire("e1-apres", pct(r.r1b));
    ecrire("e2-avant", pct(r.r2)); ecrire("e2-apres", pct(r.r2b));
    ecrire("p-avant", eur(r.p)); ecrire("p-apres", eur(r.p2));

    // Le résultat
    ecrire("gain-mois", "-" + eur(perte));
    ecrire("gain-an", eur(perte * 12));
    ecrire("avec", eur(r.ca2));
    ecrire("jour", "Chaque jour sans rien changer, c'est environ " + eur(perte / 30) + " qui partent ailleurs.");
    var maxCA = Math.max(r.ca, r.ca2, 1);
    racine.querySelector('[data-barre="avant"]').style.width = (100 * r.ca / maxCA) + "%";
    racine.querySelector('[data-barre="apres"]').style.width = (100 * r.ca2 / maxCA) + "%";

    ecrire("k-clients", nbc(r.clients) + " → " + nbc(r.clients2));
    ecrire("k-taux", pct(r.clients / d.visiteurs) + " → " + pct(r.clients2 / d.visiteurs));
    var avecPub = d.pub > 0;
    racine.querySelectorAll("[data-si-pub]").forEach(function (el) { el.hidden = !avecPub; });
    if (avecPub) {
      ecrire("k-cac", (r.clients > 0 ? eur(d.pub / r.clients) : "∞") + " → " + (r.clients2 > 0 ? eur(d.pub / r.clients2) : "∞"));
      ecrire("k-roas", nf1.format(r.ca / d.pub) + " € → " + nf1.format(r.ca2 / d.pub) + " €");
    }
    dessinerCourbe(perte);

    ecrire("reco", perte > 0
      ? "Sur un an, ça fait " + eur(perte * 12) + " qui partent ailleurs. Et tu ne sais pas encore à quel endroit."
      : "Tes taux sont déjà au plafond de ce que je compte. L'audit te dira s'il reste quelque chose à gagner.");

    if (window.typoFr) window.typoFr(racine);
  }

  // ---------- Changer d'activité ----------
  function appliquerProfil(nom) {
    profil = nom;
    var P = PROFILS[nom];
    racine.querySelectorAll("[data-texte]").forEach(function (el) {
      var cle = el.getAttribute("data-texte");
      if (cle === "profil-aide") el.textContent = P.aide;
      else if (P[cle]) el.textContent = P[cle];
    });
    NOMS.forEach(function (n) {
      champs[n].value = P.defaut[n];
      curseurs[n].value = P.defaut[n];
    });
    racine.querySelectorAll("[data-profil]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-profil") === nom ? "true" : "false");
    });
    racine.querySelectorAll("[data-profils]").forEach(function (li) {
      var concerne = li.getAttribute("data-profils").split(" ").indexOf(nom) > -1;
      li.classList.toggle("simx-stat-active", concerne);
      li.hidden = !concerne;
    });
    calculer();
  }

  // ---------- Écouteurs ----------
  NOMS.forEach(function (n) {
    curseurs[n].addEventListener("input", function () { champs[n].value = curseurs[n].value; calculer(); });
    champs[n].addEventListener("input", function () {
      var v = parseFloat(String(champs[n].value).replace(",", "."));
      if (!isNaN(v)) curseurs[n].value = v;
      calculer();
    });
    champs[n].addEventListener("blur", function () { var v = lire(n); champs[n].value = v; curseurs[n].value = v; calculer(); });
  });

  racine.querySelectorAll("[data-profil]").forEach(function (b) {
    b.addEventListener("click", function () {
      var nom = b.getAttribute("data-profil");
      appliquerProfil(nom);
      if (window.choisirProfil) window.choisirProfil(nom, true);
    });
  });
  racine.querySelectorAll("[data-scenario]").forEach(function (b) {
    b.addEventListener("click", function () {
      scenario = b.getAttribute("data-scenario");
      racine.querySelectorAll("[data-scenario]").forEach(function (x) {
        x.setAttribute("aria-pressed", x === b ? "true" : "false");
      });
      var aide = racine.querySelector('[data-texte="scenario-aide"]');
      if (aide) aide.textContent = AIDE_SCENARIO[scenario];
      calculer();
    });
  });

  // Le lien « Comment tu calcules ? » ouvre l'explication
  var calcul = document.getElementById("simx-calcul");
  racine.querySelectorAll('a[href="#simx-calcul"]').forEach(function (a) {
    a.addEventListener("click", function () { if (calcul) calcul.open = true; });
  });

  // Le choix « Tu vends » du haut de page (js/profil.js) règle aussi le simulateur
  window.simulateurProfil = appliquerProfil;
  appliquerProfil("info");
  var largeurCourbe = 0;
  window.addEventListener("resize", function () {
    var svg = racine.querySelector("[data-courbe]");
    var l = svg ? Math.round(svg.getBoundingClientRect().width) : 0;
    if (l && l !== largeurCourbe) { largeurCourbe = l; calculer(); }
  });
})();
