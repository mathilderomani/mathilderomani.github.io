/* Le choix « Tu vends : une formation · des produits · un logiciel ».
   Il adapte la maison (étiquettes, panneaux, jardin), règle le simulateur
   sur la même activité, et ne garde que les statistiques qui la concernent.
   Les textes « formation » sont ceux écrits dans la page : on les relit au chargement.
   Le choix est retenu dans le navigateur du visiteur, rien n'est envoyé. */
(function () {
  var boutons = document.querySelectorAll("[data-choix-profil]");
  if (!boutons.length) return;

  var TEXTES = {
    ecom: {
      sub0: "Pub ou contenu",
      sub1: "Accueil et popup",
      sub2: "Tes relances",
      sub3: "Ta page produit",
      sub4: "Marque, promesse, avis",
      em0: "c'est ce qui te fait connaître.",
      desc0: "C'est ce qu'il voit de loin, en passant. Une pub Instagram ou TikTok, la vidéo d'un vrai client, un influenceur qui montre ton produit. Son seul travail : lui donner envie de cliquer. Pas de tout lui raconter.",
      q0: "Toi, tu fais déjà venir du monde, avec de la pub, des influenceurs ou ton contenu ?",
      em1: "c'est ta page d'accueil.",
      desc1: "Il arrive sur ta boutique. En quelques secondes, il doit comprendre ce que tu vends et pourquoi c'est pour lui. Une petite fenêtre lui propose -10 % sur sa première commande contre son email. Sans elle, il repart sans que tu saches qui il était.",
      q1: "Toi, tu as un popup qui récupère l'email de tes visiteurs ?",
      em2: "ce sont tes relances.",
      desc2: "Il a mis un produit dans son panier, puis il est parti. Un email ou un SMS le lui rappelle. D'autres souhaitent la bienvenue aux nouveaux inscrits, ou remercient après l'achat et demandent un avis. Ce sont les pièces qui manquent le plus souvent.",
      q2: "Toi, tu as une relance automatique quand quelqu'un abandonne son panier ?",
      em3: "c'est là qu'il décide.",
      desc3: "C'est ta page produit. La photo, le bénéfice dans le titre, les avis de tes clients, les réponses à ses doutes, et le bouton « Ajouter au panier ». C'est là que tout se joue.",
      q3: "Toi, tes pages produit disent ce que ton client y gagne, avec des avis bien visibles ?",
      em4: "personne ne les voit.",
      desc4: "Ton identité de marque. Ce que ton produit change dans la vie de ton client. Et les preuves que d'autres l'ont déjà adopté. Si les fondations penchent, toutes les pièces penchent, même les plus jolies.",
      q4: "Toi, tu sais dire en une phrase pourquoi on devrait acheter chez toi, et pas chez le voisin ?",
      j0: "Tes articles de blog, pour Google",
      j1: "Tes textes Black Friday et fêtes",
      j2: "Tes scripts pour influenceurs",
      j3: "Tes publirédactionnels",
      noms: ["la façade (ta pub ou ton contenu)", "l'entrée (ta page d'accueil et ton popup)", "le couloir (tes relances)", "le salon (ta page produit)", "les fondations"]
    },
    saas: {
      sub0: "Pub ou contenu",
      sub1: "Page d'accueil",
      sub2: "Tes emails",
      sub3: "Essai ou démo",
      sub4: "Promesse, peurs levées",
      em0: "c'est ce qui te fait connaître.",
      desc0: "C'est ce qu'il voit de loin. Une pub Google, LinkedIn ou Instagram, la vidéo d'un utilisateur, ou ton contenu. Son seul travail : nommer un problème qu'il reconnaît, pour qu'il ait envie de cliquer.",
      q0: "Toi, tu fais déjà venir du monde, avec de la pub ou avec ton contenu ?",
      em1: "c'est ta page d'accueil.",
      desc1: "Il arrive sur ton site. En cinq secondes, il doit comprendre ce que fait ton logiciel, pour qui, et sur quel bouton cliquer. Si ta pub parle d'un problème, ta page doit reprendre exactement les mêmes mots.",
      q1: "Toi, ta page d'accueil dit en une phrase ce que ton logiciel fait gagner ?",
      em2: "ce sont tes emails pendant l'essai.",
      desc2: "Il a créé son compte. Tes emails lui apprennent à se servir du logiciel, l'aident quand il bloque, et lui donnent envie de payer juste avant la fin de l'essai. Ce sont les emails les plus lus de tout ton tunnel.",
      q2: "Toi, tu envoies des emails automatiques pendant l'essai gratuit ?",
      em3: "c'est là qu'il décide.",
      desc3: "C'est ton essai gratuit, ta démo ou ta page de tarifs. Il crée son compte, ou il réserve un rendez-vous. Il doit savoir exactement ce qu'il obtient, combien ça coûte, et qu'il peut arrêter quand il veut.",
      q3: "Toi, tu as un essai gratuit ou une démo facile à demander, avec des tarifs clairs ?",
      em4: "personne ne les voit.",
      desc4: "Le temps que ton logiciel fait gagner. Et les peurs à lever : « c'est compliqué à installer », « mon équipe ne va pas s'y mettre », « et si ça ne rapporte rien ». Si les fondations penchent, toutes les pièces penchent.",
      q4: "Toi, tu sais dire en une phrase ce que ton logiciel fait gagner, et à qui ?",
      j0: "Tes emails aux clients abonnés",
      j1: "Tes études de cas clients",
      j2: "Ta fiche App Store",
      j3: "Tes notifications push",
      noms: ["la façade (ta pub ou ton contenu)", "l'entrée (ta page d'accueil)", "le couloir (tes emails d'essai)", "le salon (ton essai gratuit ou ta démo)", "les fondations"]
    }
  };

  // Les textes « formation » sont ceux de la page
  var info = { noms: ["la façade (ta pub ou ton contenu)", "l'entrée (ta landing page)", "le couloir (tes emails)", "le salon (ta page de vente ou ta VSL)", "les fondations"] };
  document.querySelectorAll("[data-p]").forEach(function (el) { info[el.getAttribute("data-p")] = el.textContent; });
  TEXTES.info = info;

  var actuel = null;
  var PHRASES = {
    info: "Tu vends une formation ou un accompagnement.",
    ecom: "Tu vends des produits.",
    saas: "Tu vends un logiciel ou une application."
  };

  function choisir(nom, depuisSimulateur) {
    if (!TEXTES[nom]) nom = "info";
    var T = TEXTES[nom];
    boutons.forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-choix-profil") === nom ? "true" : "false");
    });
    document.querySelectorAll("[data-p]").forEach(function (el) {
      var cle = el.getAttribute("data-p");
      if (T[cle]) el.textContent = T[cle];
    });
    window.NOMS_PIECES = T.noms;
    if (window.visiteRafraichir) window.visiteRafraichir();
    if (!depuisSimulateur && window.simulateurProfil) window.simulateurProfil(nom);
    document.documentElement.setAttribute("data-profil", nom);
    actuel = nom;
    peindreMode();
    if (window.typoFr) window.typoFr(document.body);
  }
  window.choisirProfil = function (nom, depuisSimulateur) {
    choisir(nom, depuisSimulateur);
    memoriser(mode === "fixe" ? nom : "curieux");
  };

  // Mode « libre » : le visiteur voit les trois profils et peut passer de l'un à l'autre.
  // Mode « fixe » : il a dit ce qu'il vend, le site ne lui parle que de ça.
  var mode = "libre";
  function peindreMode() {
    var fixe = mode === "fixe";
    document.documentElement.setAttribute("data-mode", mode);
    document.querySelectorAll("[data-profil-libre]").forEach(function (el) { el.hidden = fixe; });
    document.querySelectorAll("[data-profil-fixe]").forEach(function (el) {
      el.hidden = !fixe;
      if (!fixe) return;
      el.textContent = "";
      el.appendChild(document.createTextNode(PHRASES[actuel] + " "));
      var lien = document.createElement("button");
      lien.type = "button";
      lien.className = "profil-changer";
      lien.textContent = "Changer";
      lien.addEventListener("click", ouvrirAccueil);
      el.appendChild(lien);
    });
    document.querySelectorAll(".simx-stats-liste li").forEach(function (li) {
      li.hidden = li.getAttribute("data-profils").split(" ").indexOf(actuel) < 0;
    });
  }

  function memoriser(valeur) {
    try { localStorage.setItem("profil", valeur); } catch (e) {}
  }

  boutons.forEach(function (b) {
    b.addEventListener("click", function () { window.choisirProfil(b.getAttribute("data-choix-profil")); });
  });

  // ---------- La question d'accueil ----------
  var accueil = document.getElementById("accueil");
  var dernierFocus = null;
  function ouvrirAccueil() {
    if (!accueil) return;
    dernierFocus = document.activeElement;
    accueil.hidden = false;
    document.documentElement.classList.add("accueil-ouvert");
    requestAnimationFrame(function () { accueil.classList.add("visible"); });
    var premier = accueil.querySelector("[data-accueil]");
    if (premier) premier.focus({ preventScroll: true });
  }
  function fermerAccueil() {
    accueil.classList.remove("visible");
    document.documentElement.classList.remove("accueil-ouvert");
    setTimeout(function () { accueil.hidden = true; }, 250);
    if (dernierFocus && dernierFocus.focus) dernierFocus.focus({ preventScroll: true });
  }
  function repondre(valeur) {
    if (valeur === "curieux" || valeur === "passer") {
      mode = "libre";
      choisir(actuel && valeur === "passer" ? actuel : "info");
      memoriser(valeur === "passer" ? "passer" : "curieux");
    } else {
      mode = "fixe";
      choisir(valeur);
      memoriser(valeur);
    }
    fermerAccueil();
  }
  if (accueil) {
    accueil.addEventListener("click", function (e) {
      var b = e.target.closest("[data-accueil]");
      if (b) repondre(b.getAttribute("data-accueil"));
    });
    accueil.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { repondre("passer"); return; }
      if (e.key !== "Tab") return;
      var focusables = accueil.querySelectorAll("button");
      var premier = focusables[0], dernier = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === premier) { e.preventDefault(); dernier.focus(); }
      else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier.focus(); }
    });
  }

  // ---------- Au chargement ----------
  var memo = null;
  try { memo = localStorage.getItem("profil"); } catch (e) {}
  if (memo && TEXTES[memo]) { mode = "fixe"; choisir(memo); }
  else {
    mode = "libre";
    choisir("info");
    if (!memo) ouvrirAccueil();
  }
})();
