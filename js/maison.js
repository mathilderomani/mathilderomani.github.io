/* La maison en volume (vue isométrique), dessinée en SVG.
   Utilisée dans le hero, dans la visite (vue en volume) et dans le résultat.
   MaisonIso({ trace, complet, interactif }) renvoie le code SVG. */
(function () {
  var C = 0.866, S = 0.5;
  var H = 52;   // hauteur des murs
  var F = 30;   // hauteur des fondations
  var PORTE = [64, 96, 36]; // y de début, y de fin, hauteur
  var AXE = 80; // ligne de circulation, au milieu des portes

  var PIECES = [
    { nom: "la façade", ico: "ico-pub", x0: -120, x1: 0, y0: 0, y1: 160 },
    { nom: "l'entrée", ico: "ico-form", x0: 0, x1: 120, y0: 0, y1: 160 },
    { nom: "le couloir", ico: "ico-mail", x0: 120, x1: 280, y0: 46, y1: 114 },
    { nom: "le salon", ico: "ico-vente", x0: 280, x1: 440, y0: 0, y1: 160 },
    { nom: "les fondations", ico: "ico-fondations" }
  ];

  function P(x, y, z) {
    return [((x + y) * C).toFixed(1), ((y - x) * S - (z || 0)).toFixed(1)];
  }
  function forme(cls, pts, d) {
    var s = pts.map(function (p) { return P(p[0], p[1], p[2]).join(","); }).join(" L");
    return '<path class="' + cls + ' t" pathLength="1" style="--d:' + d + '" d="M' + s + ' Z"/>';
  }
  function trait(cls, a, b, d) {
    var p = P(a[0], a[1], a[2]), q = P(b[0], b[1], b[2]);
    return '<line class="' + cls + ' f" style="--d:' + d + '" x1="' + p[0] + '" y1="' + p[1] + '" x2="' + q[0] + '" y2="' + q[1] + '"/>';
  }
  function cloison(x, d) {
    return forme("mur", [
      [x, 0, 0], [x, PORTE[0], 0], [x, PORTE[0], PORTE[2]], [x, PORTE[1], PORTE[2]], [x, PORTE[1], 0],
      [x, 160, 0], [x, 160, H], [x, 0, H]
    ], d);
  }
  function chemin(r, d) {
    var cx = (r.x0 + r.x1) / 2;
    return trait("ch a", [r.x0 === -120 ? -104 : r.x0, AXE, 0], [cx, AXE, 0], d) +
           trait("ch b", [cx, AXE, 0], [r.x1, AXE, 0], d);
  }
  function carte(i, base, versLeBas, interactif, d) {
    var bx = +base[0], by = +base[1];
    var top = versLeBas ? by + 16 : by - 50;
    var attrs = interactif
      ? ' tabindex="0" role="button" aria-label="Pièce ' + (i + 1) + ", " + PIECES[i].nom + '"'
      : "";
    return '<g class="carte f" data-piece="' + i + '" style="--d:' + d + '"' + attrs + ">" +
      '<line class="pin" x1="' + bx + '" y1="' + by + '" x2="' + bx + '" y2="' + (versLeBas ? top : top + 32) + '"/>' +
      '<rect x="' + (bx - 22) + '" y="' + top + '" width="44" height="32" rx="2"/>' +
      '<use href="#' + PIECES[i].ico + '" x="' + (bx - 16) + '" y="' + (top + 5) + '" width="32" height="22"/>' +
      '<g class="mk"><circle cx="' + (bx + 22) + '" cy="' + top + '" r="8.5"/>' +
      '<text x="' + (bx + 22) + '" y="' + (top + 4) + '"></text></g>' +
      "</g>";
  }

  window.MaisonIso = function (o) {
    o = o || {};
    var cls = "iso" + (o.trace ? " trace" : "") + (o.complet ? " complet" : "") + (o.interactif ? " interactif" : "");
    var h = '<svg class="' + cls + '" viewBox="-114 -284 644 440" xmlns="http://www.w3.org/2000/svg"' +
      (o.interactif ? ' role="group" aria-label="La maison en volume"' : ' aria-hidden="true"') + ">";
    var i, x, r;

    // Les fondations : la dalle, puis la face avant hachurée
    h += '<g data-piece="4">';
    h += forme("dalle", [[0, 0, 0], [440, 0, 0], [440, 160, 0], [0, 160, 0]], 0);
    h += forme("fond-face", [[0, 160, 0], [440, 160, 0], [440, 160, -F], [0, 160, -F]], 1);
    for (x = 12; x < 440; x += 16) {
      h += trait("hach", [x, 160, 0], [Math.max(x - 12, 0), 160, -F], 4);
    }
    h += "</g>";

    // Les pièces, de la plus lointaine à la plus proche
    for (i = 3; i >= 1; i--) {
      r = PIECES[i];
      h += '<g data-piece="' + i + '">';
      h += forme("sol", [[r.x0, r.y0, 0], [r.x1, r.y0, 0], [r.x1, r.y1, 0], [r.x0, r.y1, 0]], 2 + i);
      h += chemin(r, 14);
      h += forme("mur", [[r.x0, r.y0, 0], [r.x1, r.y0, 0], [r.x1, r.y0, H], [r.x0, r.y0, H]], 8 + i);
      if (i === 3) {
        h += forme("mur", [[r.x1, 0, 0], [r.x1, 160, 0], [r.x1, 160, H], [r.x1, 0, H]], 8 + i);
      }
      h += cloison(r.x0, 8 + i);
      h += "</g>";
    }

    // La façade : la zone extérieure, en pointillés
    r = PIECES[0];
    h += '<g data-piece="0">';
    h += '<path class="terrain f" style="--d:2" d="M' +
      [[r.x0, 0], [r.x1, 0], [r.x1, 160], [r.x0, 160]].map(function (p) { return P(p[0], p[1]).join(","); }).join(" L") + ' Z"/>';
    h += chemin(r, 14);
    h += "</g>";

    // Les cartes : une mini-illustration par pièce
    for (i = 3; i >= 0; i--) {
      r = PIECES[i];
      h += carte(i, P((r.x0 + r.x1) / 2, AXE, 0), false, o.interactif, 15 + i);
    }
    h += carte(4, P(240, 160, -F), true, o.interactif, 20);

    return h + "</svg>";
  };
})();
