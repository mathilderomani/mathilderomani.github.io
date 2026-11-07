/* Le simulateur : ce que le visiteur fait aujourd'hui, et ce qu'il ferait
   avec un tunnel bien construit. Trois leviers, trois scénarios sourcés.
   Les prix viennent de l'objet PRIX (js/site.js). Rien n'est envoyé nulle part. */
(function () {
  var racine = document.getElementById("simulateur");
  if (!racine) return;

  // Multiplicateurs par scénario, pris dans les fourchettes publiées
  var SCENARIOS = {
    prudent:   { monde: 1.3, achat: 1.51, panier: 1.2 },
    realiste:  { monde: 1.5, achat: 2,    panier: 1.3 },
    ambitieux: { monde: 2,   achat: 3,    panier: 1.4 }
  };

  var champs = {
    entrees: racine.querySelector('[data-champ="entrees"]'),
    taux: racine.querySelector('[data-champ="taux"]'),
    panier: racine.querySelector('[data-champ="panier"]')
  };
  var curseurs = {
    entrees: racine.querySelector('[data-curseur="entrees"]'),
    taux: racine.querySelector('[data-curseur="taux"]'),
    panier: racine.querySelector('[data-curseur="panier"]')
  };
  var scenario = "realiste";

  var euros = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
  function eur(v) { return euros.format(Math.round(v)) + " €"; }
  function prixDe(cle, defaut) {
    var brut = window.PRIX && window.PRIX[cle];
    var n = brut ? parseInt(String(brut).replace(/[^\d]/g, ""), 10) : NaN;
    return isNaN(n) ? defaut : n;
  }
  function ecrire(nom, texte) {
    racine.querySelectorAll('[data-sortie="' + nom + '"]').forEach(function (el) { el.textContent = texte; });
  }
  function lire(nom) {
    var v = parseFloat(String(champs[nom].value).replace(",", "."));
    var min = parseFloat(champs[nom].min), max = parseFloat(champs[nom].max);
    if (isNaN(v)) v = parseFloat(curseurs[nom].value);
    return Math.min(max, Math.max(min, v));
  }

  function calculer() {
    var s = SCENARIOS[scenario];
    var e = lire("entrees"), t = lire("taux") / 100, p = lire("panier");
    var auj = e * t * p;
    var e2 = e * s.monde, t2 = Math.min(t * s.achat, 1), p2 = p * s.panier;
    var avec = e2 * t2 * p2;
    var gainMois = Math.max(0, avec - auj);

    ecrire("auj", eur(auj));
    ecrire("avec", eur(avec));
    ecrire("gain-mois", "+" + eur(gainMois));
    ecrire("gain-an", eur(gainMois * 12));
    ecrire("entrees-avant", euros.format(Math.round(e)));
    ecrire("entrees-apres", euros.format(Math.round(e2)));
    ecrire("taux-avant", (t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 }) + " %");
    ecrire("taux-apres", (t2 * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 }) + " %");
    ecrire("panier-avant", eur(p));
    ecrire("panier-apres", eur(p2));
    ecrire("x-monde", "×" + String(s.monde).replace(".", ","));
    ecrire("x-achat", "×" + String(s.achat).replace(".", ","));
    ecrire("x-panier", "+" + Math.round((s.panier - 1) * 100) + " %");

    // En combien de jours la mission est remboursée
    var tunnel = prixDe("maisonSimple", 3500), piece = prixDe("emails", 1000);
    var jours = gainMois > 0 ? Math.ceil(tunnel / (gainMois / 30)) : Infinity;
    var joursPiece = gainMois > 0 ? Math.ceil(piece / (gainMois / 30)) : Infinity;
    var rembourse = racine.querySelector(".sim-rembourse");
    if (jours <= 180) {
      rembourse.textContent = "Un tunnel complet à " + eur(tunnel) + " serait remboursé en " + jours + " jours. Et après, tout ce qu'il rapporte est pour toi.";
    } else if (joursPiece <= 365) {
      rembourse.textContent = "Avec ces chiffres, commence par une seule pièce : une séquence d'emails à " + eur(piece) + " serait remboursée en " + joursPiece + " jours.";
    } else {
      rembourse.textContent = "Avec ces chiffres, le plus gros levier est d'abord de faire venir du monde. L'audit te dit par où commencer.";
    }
  }

  ["entrees", "taux", "panier"].forEach(function (nom) {
    curseurs[nom].addEventListener("input", function () { champs[nom].value = curseurs[nom].value; calculer(); });
    champs[nom].addEventListener("input", function () {
      var v = parseFloat(String(champs[nom].value).replace(",", "."));
      if (!isNaN(v)) curseurs[nom].value = v;
      calculer();
    });
    champs[nom].addEventListener("blur", function () { champs[nom].value = lire(nom); curseurs[nom].value = lire(nom); calculer(); });
  });

  racine.querySelectorAll(".sim-scenario").forEach(function (b) {
    b.addEventListener("click", function () {
      scenario = b.getAttribute("data-scenario");
      racine.querySelectorAll(".sim-scenario").forEach(function (x) {
        x.setAttribute("aria-pressed", x === b ? "true" : "false");
      });
      calculer();
    });
  });

  calculer();
})();
