/* La visite interactive de la maison (A.01).
   Les réponses restent dans la page : rien n'est envoyé nulle part. */
(function () {
  var racine = document.getElementById("visite");
  if (!racine) return;

  var NOMS = [
    "la façade (ta pub ou ton contenu)",
    "l'entrée (ta landing page)",
    "le couloir (tes emails)",
    "le salon (ta page de vente ou ta VSL)",
    "les fondations"
  ];
  var SIGNES = { oui: "✓", non: "×", nsp: "?" };
  var TOTAL = 5;
  var FORMULAIRE = racine.getAttribute("data-formulaire");

  var panneaux = racine.querySelectorAll(".panneau[data-panneau]");
  var bilan = racine.querySelector(".panneau-bilan");
  var bilanTexte = racine.querySelector(".bilan-texte");
  var plan = racine.querySelector(".plan");
  var volume = racine.querySelector(".volume");
  var nav = racine.querySelector(".visite-nav");
  var btnPrec = nav.querySelector("[data-nav='prec']");
  var btnSuiv = nav.querySelector("[data-nav='suiv']");
  var compteur = nav.querySelector(".nav-compteur");
  var vues = racine.querySelector(".visite-vues");

  var courant = 0;
  var reponses = [null, null, null, null, null];
  var minuterie = null;

  volume.innerHTML = window.MaisonIso({ interactif: true });
  racine.querySelector(".bilan-dessin").innerHTML = window.MaisonIso({ complet: true });
  vues.hidden = false;
  nav.hidden = false;

  function liste(indices) {
    var source = window.NOMS_PIECES || NOMS;
    var noms = indices.map(function (i) { return source[i]; });
    if (noms.length < 2) return noms.join("");
    return noms.slice(0, -1).join(", ") + " et " + noms[noms.length - 1];
  }
  function indicesDe(valeur) {
    var out = [];
    reponses.forEach(function (r, i) { if (r === valeur) out.push(i); });
    return out;
  }

  function ecrireBilan() {
    var oui = indicesDe("oui"), non = indicesDe("non"), nsp = indicesDe("nsp"), vide = indicesDe(null);
    var lignes = [];
    if (vide.length === TOTAL) {
      lignes.push("Tu n'as répondu à aucune pièce. Reviens en arrière : ça prend trente secondes.");
    } else {
      if (non.length) {
        lignes.push("Il manque " + liste(non) + ". L'audit te dit si ça te coûte des ventes, ou si tu peux t'en passer.");
      }
      if (nsp.length) {
        lignes.push("Tu ne sais pas pour " + liste(nsp) +
          ". C'est déjà une réponse : ce que tu ne mesures pas, tu ne peux pas le réparer.");
      }
      if (oui.length === TOTAL) {
        lignes.push("Toutes les pièces sont là. Reste à savoir si chaque porte s'ouvre vraiment. C'est exactement ce que l'audit vérifie.");
      }
      if (vide.length) {
        lignes.push("Tu n'as pas répondu pour toutes les pièces. Tu peux revenir en arrière à tout moment.");
      }
    }
    lignes.push("L'audit te dit quelle pièce reprendre en premier. Gratuitement.");

    bilanTexte.textContent = "";
    var p = document.createElement("p");
    var fort = document.createElement("strong");
    fort.textContent = oui.length + (oui.length > 1 ? " pièces" : " pièce") + " en place sur 5.";
    p.appendChild(fort);
    bilanTexte.appendChild(p);
    lignes.forEach(function (l) {
      var el = document.createElement("p");
      el.textContent = l;
      bilanTexte.appendChild(el);
    });
    var a = document.createElement("a");
    a.className = "btn";
    a.href = FORMULAIRE;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = "Demander mon audit gratuit";
    bilanTexte.appendChild(a);
    if (window.typoFr) window.typoFr(bilanTexte);
  }

  function peindre() {
    var fin = courant === TOTAL;
    racine.querySelectorAll("[data-piece]").forEach(function (el) {
      var i = +el.getAttribute("data-piece");
      var r = reponses[i];
      el.classList.toggle("actif", i === courant);
      el.classList.toggle("passe", i < courant && i < 4);
      el.classList.toggle("r-oui", r === "oui");
      el.classList.toggle("r-non", r === "non");
      el.classList.toggle("r-nsp", r === "nsp");
      if (el.classList.contains("piece")) {
        if (i === courant) el.setAttribute("aria-current", "true"); else el.removeAttribute("aria-current");
        var etat = el.querySelector(".p-etat");
        if (etat) etat.textContent = r ? ", " + { oui: "en place", non: "pas encore", nsp: "je ne sais pas" }[r] : "";
      }
      var signe = el.querySelector(".mk text");
      if (signe) signe.textContent = r ? SIGNES[r] : "";
    });
    panneaux.forEach(function (p, i) { p.classList.toggle("actif", i === courant); });
    bilan.classList.toggle("actif", fin);
    bilan.hidden = !fin;
    if (fin) ecrireBilan();

    btnPrec.disabled = courant === 0;
    btnSuiv.textContent = fin ? "Recommencer la visite" : (courant === TOTAL - 1 ? "Voir ma maison" : "Pièce suivante");
    compteur.textContent = fin ? "Ta maison" : "Pièce " + (courant + 1) + " sur " + TOTAL;
  }

  function aller(i, avecFocus) {
    clearTimeout(minuterie);
    courant = Math.max(0, Math.min(TOTAL, i));
    peindre();
    if (avecFocus) {
      var cible = (courant === TOTAL ? bilan : panneaux[courant]).querySelector("h3");
      if (cible) cible.focus({ preventScroll: true });
    }
  }

  function recommencer() {
    reponses = [null, null, null, null, null];
    racine.querySelectorAll(".rep").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
    aller(0, true);
  }

  // Réponses
  racine.addEventListener("click", function (e) {
    var rep = e.target.closest(".rep");
    if (rep) {
      var panneau = rep.closest(".panneau");
      var i = +panneau.getAttribute("data-panneau");
      reponses[i] = rep.getAttribute("data-rep");
      panneau.querySelectorAll(".rep").forEach(function (b) {
        b.setAttribute("aria-pressed", b === rep ? "true" : "false");
      });
      peindre();
      clearTimeout(minuterie);
      minuterie = setTimeout(function () { aller(i + 1, true); }, 350);
      return;
    }
    var piece = e.target.closest("[data-piece]");
    if (piece && (plan.contains(piece) || volume.contains(piece))) {
      e.preventDefault();
      aller(+piece.getAttribute("data-piece"), false);
    }
  });
  volume.addEventListener("keydown", function (e) {
    var carte = e.target.closest(".carte");
    if (carte && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      aller(+carte.getAttribute("data-piece"), false);
    }
  });

  btnPrec.addEventListener("click", function () { aller(courant - 1, true); });
  btnSuiv.addEventListener("click", function () {
    if (courant === TOTAL) recommencer(); else aller(courant + 1, true);
  });

  // Vue en plan / vue en volume
  vues.addEventListener("click", function (e) {
    var b = e.target.closest(".vue-btn");
    if (!b) return;
    var enVolume = b.getAttribute("data-vue") === "volume";
    plan.hidden = enVolume;
    volume.hidden = !enVolume;
    vues.querySelectorAll(".vue-btn").forEach(function (x) {
      x.setAttribute("aria-pressed", x === b ? "true" : "false");
    });
  });

  // Le choix du profil (js/profil.js) change le nom des pièces : on repeint
  window.visiteRafraichir = peindre;
  peindre();
})();
