/* Le simulateur complet.
   1. L'activité (infopreneur, e-commerce, SaaS) règle les libellés, les repères et les valeurs d'exemple.
   2. Les chiffres du visiteur décrivent son tunnel : visiteurs, étape 1, étape 2, panier, budget pub.
   3. Les pièces cochées viennent de la grille de tarifs (objet PRIX dans js/site.js).
   4. Le scénario choisit le bas, le milieu ou le haut des fourchettes.
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
      "d-vsl": "Ta vidéo de vente : plus d'inscrits passent à l'achat.",
      "d-emails": "Une vraie série de bienvenue : tes inscrits deviennent clients.",
      "d-landing": "Plus de visiteurs laissent leur email.",
      repere1: 6.6, nomRepere1: "la médiane des landing pages",
      emails: { type: "mult", prudent: 1.51, realiste: 2, ambitieux: 3 }
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
      "d-vsl": "Une vidéo qui montre ton produit : plus de paniers vont au bout.",
      "d-emails": "Les relances de panier abandonné : une partie des paniers perdus revient.",
      "d-landing": "Une page produit qui donne envie : plus de visiteurs ajoutent au panier.",
      repere2: 30, nomRepere2: "la moyenne des boutiques en ligne",
      // part des paniers abandonnés récupérés par les relances (Klaviyo : 3,33 % en moyenne, 7,69 % pour le top 10 %)
      emails: { type: "relance", prudent: 0.0333, realiste: 0.05, ambitieux: 0.0769 }
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
      "d-vsl": "Une vidéo de démonstration : plus d'essais deviennent clients.",
      "d-emails": "Les emails pendant l'essai : plus d'essais deviennent clients.",
      "d-landing": "Plus de visiteurs démarrent un essai.",
      repere1: 3.8, nomRepere1: "la médiane des landing pages SaaS",
      emails: { type: "mult", prudent: 1.2, realiste: 1.35, ambitieux: 1.5 }
    }
  };

  // Effet de chaque pièce, par scénario
  var EFFETS = {
    landing: { prudent: 1.3, realiste: 1.5, ambitieux: 2 },     // Leadpages, via la leçon de Théo
    vsl:     { prudent: 1.15, realiste: 1.3, ambitieux: 1.5 },  // hypothèse prudente
    ads:     { prudent: 1.1, realiste: 1.2, ambitieux: 1.35 },  // hypothèse prudente, à budget égal
    bump:    { prudent: 1.2, realiste: 1.3, ambitieux: 1.4 }    // systeme.io, via la leçon de Théo
  };
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
  var cases = {};
  racine.querySelectorAll("[data-piece]").forEach(function (c) { cases[c.getAttribute("data-piece")] = c; });
  var choixNbAds = racine.querySelector("[data-nb-ads]");

  // ---------- Outils ----------
  var nf0 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
  var nf1 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
  function eur(v) { return nf0.format(Math.round(v)) + " €"; }
  function nb(v) { return nf0.format(Math.round(v)); }
  function nbc(v) { return v < 10 ? nf1.format(v) : nf0.format(Math.round(v)); }
  function ecrire(nom, texte) {
    racine.querySelectorAll('[data-sortie="' + nom + '"]').forEach(function (el) { el.textContent = texte; });
  }
  function prixListe(cle, defaut) {
    var brut = window.PRIX && window.PRIX[cle];
    var nums = brut ? String(brut).replace(/\s/g, "").match(/\d+/g) : null;
    return nums ? nums.map(Number) : defaut;
  }
  function lire(nom) {
    var c = champs[nom];
    var v = parseFloat(String(c.value).replace(",", "."));
    if (isNaN(v)) v = parseFloat(curseurs[nom].value);
    return Math.min(parseFloat(c.max), Math.max(parseFloat(c.min), v));
  }
  function joursPour(cout, gainMois) {
    return gainMois > 0 ? Math.ceil(cout / (gainMois / 30)) : Infinity;
  }
  function delai(j) {
    if (!isFinite(j)) return "jamais avec ces chiffres";
    if (j <= 60) return j + " jours";
    return nf1.format(j / 30) + " mois";
  }

  // ---------- Le calcul ----------
  // pieces : { landing, vsl, emails, ads, bump } (booléens) ; nbAds : nombre de publicités
  function simuler(d, pieces, nbAds) {
    var P = PROFILS[profil];
    var v = d.visiteurs, r1 = d.etape1 / 100, r2 = d.etape2 / 100, p = d.panier;

    var v2 = v, r1b = r1, r2b = r2, p2 = p;
    if (pieces.ads && d.pub > 0) {
      var effet = EFFETS.ads[scenario] - 1;
      v2 = v * (1 + effet * Math.min(nbAds, 5) / 5);
    }
    if (pieces.landing) r1b = Math.min(r1 * EFFETS.landing[scenario], 0.9);
    if (pieces.vsl) r2b = r2b * EFFETS.vsl[scenario];
    if (pieces.emails) {
      if (P.emails.type === "mult") r2b = r2b * P.emails[scenario];
      else r2b = r2b + (1 - Math.min(r2b, 1)) * P.emails[scenario];
    }
    r2b = Math.min(r2b, 0.9);
    if (pieces.bump) p2 = p * EFFETS.bump[scenario];

    var prospects = v * r1, clients = prospects * r2;
    var prospects2 = v2 * r1b, clients2 = prospects2 * r2b;
    return {
      prospects: prospects, clients: clients, ca: clients * p,
      prospects2: prospects2, clients2: clients2, ca2: clients2 * p2
    };
  }

  function lireDonnees() {
    var d = {};
    NOMS.forEach(function (n) { d[n] = lire(n); });
    return d;
  }

  function piecesCochees() {
    var complet = cases.complet.checked;
    return {
      complet: complet,
      vsl: complet || cases.vsl.checked,
      emails: complet || cases.emails.checked,
      ads: complet || cases.ads.checked,
      landing: cases.landing.checked,
      bump: cases.bump.checked,
      nbAds: complet ? 10 : parseInt(choixNbAds.value, 10) || 1
    };
  }

  // Prix connus des pièces cochées (fourchette basse et haute)
  function cout(pc) {
    var vsl = prixListe("vsl", [2000])[0], emails = prixListe("emails", [1000])[0];
    var ads = prixListe("ads", [500, 750]), tunnel = prixListe("maisonSimple", [3500])[0];
    var bas = 0, haut = 0;
    if (pc.complet) { bas += tunnel; haut += tunnel; }
    else {
      if (pc.vsl) { bas += vsl; haut += vsl; }
      if (pc.emails) { bas += emails; haut += emails; }
      if (pc.ads) { bas += ads[0] * pc.nbAds; haut += (ads[1] || ads[0]) * pc.nbAds; }
    }
    return { bas: bas, haut: haut, devis: pc.landing || pc.bump };
  }

  // ---------- La courbe sur 12 mois ----------
  function dessinerCourbe(gainMois, prix) {
    var svg = racine.querySelector("[data-courbe]");
    if (!svg) return;
    var W = Math.round(Math.max(300, Math.min(600, svg.getBoundingClientRect().width || 600)));
    var H = W < 420 ? 200 : 220, g = 24, dr = 40, h = 18, b = 34;
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    var pts = [];
    for (var m = 0; m <= 12; m++) pts.push(gainMois * m - prix);
    var min = Math.min(0, pts[0]), max = Math.max(0, pts[12]);
    if (max === min) max = min + 1;
    function x(m) { return g + (W - g - dr) * m / 12; }
    function y(val) { return h + (H - h - b) * (1 - (val - min) / (max - min)); }
    var ligne = pts.map(function (val, m) { return (m ? "L" : "M") + x(m).toFixed(1) + " " + y(val).toFixed(1); }).join(" ");
    var aire = ligne + " L" + x(12) + " " + y(0) + " L" + x(0) + " " + y(0) + " Z";
    var s = "";
    s += '<line x1="' + g + '" x2="' + (W - dr) + '" y1="' + y(0) + '" y2="' + y(0) + '" stroke="#B8934A" stroke-width="1"/>';
    s += '<path d="' + aire + '" fill="rgba(31,78,140,.10)"/>';
    s += '<path d="' + ligne + '" fill="none" stroke="#1F4E8C" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>';
    [0, 3, 6, 9, 12].forEach(function (m) {
      s += '<text x="' + x(m) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="13" fill="#6B6459">' + (m === 0 ? "Départ" : m + " mois") + "</text>";
    });
    if (prix > 0 && gainMois > 0) {
      var mR = prix / gainMois;
      if (mR <= 12) {
        s += '<circle cx="' + x(mR) + '" cy="' + y(0) + '" r="6" fill="#FBF8F2" stroke="#B8934A" stroke-width="2.5"/>';
        var aGauche = x(mR) - g > 90;
        s += '<text x="' + (x(mR) + (aGauche ? -10 : 10)) + '" y="' + (y(0) - 10) + '" text-anchor="' + (aGauche ? "end" : "start") + '" font-size="13" font-weight="600" fill="#1A1A1A">Remboursé</text>';
      }
    }
    s += '<circle cx="' + x(12) + '" cy="' + y(pts[12]) + '" r="5" fill="#1F4E8C"/>';
    s += '<text x="' + (x(12) - 10) + '" y="' + (y(pts[12]) + 24) + '" text-anchor="end" font-size="14" font-weight="700" fill="#1F4E8C">' + (pts[12] >= 0 ? "+" : "") + eur(pts[12]) + "</text>";
    svg.innerHTML = s;
    var legende = racine.querySelector("[data-legende-courbe]");
    if (legende) legende.textContent = prix > 0
      ? "Ton gain cumulé sur 12 mois, prix des pièces déduit (" + eur(prix) + ")"
      : "Ton gain cumulé sur 12 mois";
  }

  // ---------- Mise à jour de l'affichage ----------
  function calculer() {
    var P = PROFILS[profil];
    var d = lireDonnees();
    var pc = piecesCochees();
    var r = simuler(d, pc, pc.nbAds);
    var gain = Math.max(0, r.ca2 - r.ca);
    var prix = cout(pc);

    // Le tunnel d'aujourd'hui
    ecrire("f-visiteurs", nb(d.visiteurs));
    ecrire("f-prospects", nb(r.prospects));
    ecrire("f-clients", nbc(r.clients));
    ecrire("auj", eur(r.ca));
    var perdus = d.visiteurs - r.clients;
    var fuite = "";
    if (P.repere1 && d.etape1 < P.repere1) fuite = " Ta première étape est sous " + P.nomRepere1 + " (" + nf1.format(P.repere1) + " %) : c'est là que tu perds le plus.";
    else if (P.repere2 && d.etape2 < P.repere2) fuite = " Tes paniers vont moins souvent au bout que " + P.nomRepere2 + " (" + P.repere2 + " %) : c'est là que tu perds le plus.";
    ecrire("perte", "Chaque mois, " + nb(perdus) + " personnes sur " + nb(d.visiteurs) + " repartent sans acheter." + fuite);

    // Le résultat
    ecrire("gain-mois", "+" + eur(gain));
    ecrire("gain-an", eur(gain * 12));
    ecrire("avec", eur(r.ca2));
    ecrire("jour", gain > 0 ? "Chaque jour sans rien changer, c'est environ " + eur(gain / 30) + " qui partent ailleurs." : "Coche au moins une pièce pour voir ce qu'elle te rapporterait.");
    var maxCA = Math.max(r.ca, r.ca2, 1);
    racine.querySelector('[data-barre="avant"]').style.width = (100 * r.ca / maxCA) + "%";
    racine.querySelector('[data-barre="apres"]').style.width = (100 * r.ca2 / maxCA) + "%";

    ecrire("k-clients", nbc(r.clients) + " → " + nbc(r.clients2));
    var avecPub = d.pub > 0;
    racine.querySelectorAll("[data-si-pub]").forEach(function (el) { el.hidden = !avecPub; });
    if (avecPub) {
      ecrire("k-cac", (r.clients > 0 ? eur(d.pub / r.clients) : "∞") + " → " + (r.clients2 > 0 ? eur(d.pub / r.clients2) : "∞"));
      ecrire("k-roas", nf1.format(r.ca / d.pub) + " € → " + nf1.format(r.ca2 / d.pub) + " €");
    }

    var prixTexte = prix.haut === 0 ? (prix.devis ? "Sur devis" : "0 €")
      : (prix.bas === prix.haut ? eur(prix.haut) : eur(prix.bas) + " à " + eur(prix.haut)) + (prix.devis ? " + devis" : "");
    ecrire("k-cout", prixTexte);
    if (prix.haut > 0) {
      ecrire("k-rembourse", delai(joursPour(prix.haut, gain)));
      ecrire("k-roi", gain > 0 ? nf1.format(gain * 12 / prix.haut) + " fois le prix" : "Rien");
    } else {
      ecrire("k-rembourse", prix.devis ? "Après devis" : "Rien à payer");
      ecrire("k-roi", prix.devis && gain > 0 ? eur(gain * 12) : "Rien");
    }
    dessinerCourbe(gain, prix.haut);

    // La pièce la plus rentable avec ces chiffres
    var candidats = [
      { nom: "la séquence d'emails", pieces: { emails: true }, prix: prixListe("emails", [1000])[0] },
      { nom: "la VSL", pieces: { vsl: true }, prix: prixListe("vsl", [2000])[0] },
      { nom: "le tunnel complet", pieces: { vsl: true, emails: true, ads: true }, nbAds: 10, prix: prixListe("maisonSimple", [3500])[0] }
    ];
    if (d.pub > 0) {
      var a = prixListe("ads", [500, 750]);
      candidats.push({ nom: "trois publicités", pieces: { ads: true }, nbAds: 3, prix: 3 * (a[1] || a[0]) });
    }
    var meilleur = null;
    candidats.forEach(function (c) {
      var s = simuler(d, c.pieces, c.nbAds || 1);
      c.jours = joursPour(c.prix, s.ca2 - s.ca);
      if (!meilleur || c.jours < meilleur.jours) meilleur = c;
    });
    var reco = "";
    if (prix.haut === 0 && prix.devis && gain > 0) {
      reco = "Ces pièces se chiffrent après l'audit. Pour être remboursées en 3 mois, elles devraient coûter moins de " + eur(gain * 3) + ".";
    } else if (meilleur && isFinite(meilleur.jours)) {
      reco = "Avec tes chiffres, la pièce qui se rembourse le plus vite : " + meilleur.nom + ", en " + delai(meilleur.jours) + ".";
      if (meilleur.jours > 365) reco = "Avec ces chiffres, aucune pièce ne se rembourse en moins d'un an. Le plus gros levier, c'est d'abord de faire venir du monde. L'audit te dit par où commencer.";
    }
    if (pc.ads && d.pub === 0) reco += " Les publicités n'ont d'effet ici que si tu as un budget pub : mets-le à l'étape 2.";
    ecrire("reco", reco.trim());

    // Le tunnel complet face aux mêmes pièces achetées une par une
    var eco = "";
    if (pc.complet) {
      var ads = prixListe("ads", [500, 750]);
      var base = prixListe("vsl", [2000])[0] + prixListe("emails", [1000])[0];
      var bas = base + 10 * ads[0], haut = base + 10 * (ads[1] || ads[0]);
      eco = "À la pièce, la VSL, les emails et 10 publicités coûteraient de " + eur(bas) + " à " + eur(haut) + ", sans la gestion de tes pubs. En tunnel complet : " + eur(prixListe("maisonSimple", [3500])[0]) + ".";
    }
    ecrire("eco", eco);

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
      li.classList.toggle("simx-stat-active", li.getAttribute("data-profils").split(" ").indexOf(nom) > -1);
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

  // Le tunnel complet contient déjà la VSL, les emails et les publicités
  function synchroComplet() {
    var c = cases.complet.checked;
    ["vsl", "emails", "ads"].forEach(function (k) {
      cases[k].disabled = c;
      if (c) cases[k].checked = true;
      cases[k].closest(".simx-piece").classList.toggle("simx-inclus", c);
    });
    choixNbAds.disabled = c;
  }
  cases.complet.addEventListener("change", function () {
    if (!cases.complet.checked) ["vsl", "emails", "ads"].forEach(function (k) { cases[k].checked = false; });
    synchroComplet();
    calculer();
  });
  ["vsl", "emails", "ads", "landing", "bump"].forEach(function (k) { cases[k].addEventListener("change", calculer); });
  choixNbAds.addEventListener("change", calculer);

  racine.querySelectorAll("[data-profil]").forEach(function (b) {
    b.addEventListener("click", function () { appliquerProfil(b.getAttribute("data-profil")); });
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

  // Prix des publicités affiché depuis la grille de tarifs
  var a = prixListe("ads", [500, 750]);
  ecrire("prix-ads", (a[1] ? nb(a[0]) + " à " + eur(a[1]) : eur(a[0])) + " l'une");

  synchroComplet();
  appliquerProfil("info");
  var largeurCourbe = 0;
  window.addEventListener("resize", function () {
    var svg = racine.querySelector("[data-courbe]");
    var l = svg ? Math.round(svg.getBoundingClientRect().width) : 0;
    if (l && l !== largeurCourbe) { largeurCourbe = l; calculer(); }
  });
})();
