/* Questionnaires du brief. Modifiez librement les questions, les options et les règles de vigilance. */
(function () {
  "use strict";
window.BRIEF_WORDS = ["Proche","Fiable","Moderne","Chaleureuse","Experte","Engagée","Dynamique","Rassurante","Innovante","Accessible","Solide","Créative","Discrète","Ambitieuse","Militante","Ludique"];

var IDENT_STEPS = [
    {t:"La structure", f:[
      {k:"nom", s:"Structure", type:"text", l:"Nom de la structure", ph:"Association Les Tilleuls", req:true},
      {k:"secteur", s:"Secteur", type:"text", l:"Secteur d'activité", ph:"Aide à domicile, culture, sport…"},
      {k:"diff", s:"Ce qui nous distingue", type:"area", l:"En une phrase : que faites-vous mieux ou autrement que les autres ?", ph:"Nous construisons avec chaque famille un accompagnement qui évolue.", req:true}
    ]},
    {t:"Le projet", f:[
      {k:"type", s:"Besoin", type:"one", l:"De quoi avez-vous besoin ?", o:["Créer une identité","Faire évoluer l'existante","Refondre complètement","Décliner sur de nouveaux supports"], req:true},
      {k:"curseur", s:"Ampleur", type:"range", l:"Ampleur du changement souhaité", min:1, max:10, v:5, a:"Personne ne doit le remarquer", b:"On doit sentir un vrai renouveau"},
      {k:"pourquoi", s:"Pourquoi maintenant", type:"area", l:"Pourquoi maintenant ?", ph:"Fusion, nouveau service, identité vieillissante…"}
    ]},
    {t:"Les publics", f:[
      {k:"publics", s:"Publics prioritaires", type:"rank", l:"Choisissez vos 3 publics prioritaires, dans l'ordre", o:["Clients ou usagers","Familles et proches","Prescripteurs et partenaires","Financeurs et institutions","Candidats et salariés","Bénévoles","Grand public","Presse"], max:3, req:true},
      {k:"question", s:"Question clé du public n°1", type:"area", l:"Quelle est la vraie question de votre public n°1 ?", ph:"Puis-je vous faire confiance avec mon proche ?"}
    ]},
    {t:"La personnalité", f:[
      {k:"axes", s:"Personnalité", type:"scales", l:"Placez chaque curseur là où votre marque doit être demain", o:[["Classique","Audacieuse"],["Sobre","Expressive"],["Institutionnelle","Proche"],["Sérieuse","Ludique"],["Locale","Nationale"]]},
      {k:"auj", s:"Aujourd'hui", type:"words", l:"3 mots qui vous décrivent aujourd'hui", max:3},
      {k:"dem", s:"Demain", type:"words", l:"3 mots qu'on doit associer à vous demain", max:3, req:true}
    ]},
    {t:"L'héritage", f:[
      {k:"garder", s:"Intouchable", type:"multi", l:"Ce qui est intouchable", o:["Le nom","Le logo","Les couleurs","La typographie","Le slogan","Rien, tout est ouvert"]},
      {k:"attache", s:"Attachement des équipes", type:"one", l:"Vos équipes sont-elles attachées à l'identité actuelle ?", o:["Très attachées","Un peu","Pas du tout","Je ne sais pas"]},
      {k:"droits", s:"Droits sur le logo", type:"one", l:"Êtes-vous propriétaire des droits sur votre logo actuel ?", o:["Oui, cession écrite","Non","Je ne sais pas","Pas de logo actuel"]}
    ]},
    {t:"Les usages", f:[
      {k:"supports", s:"Supports", type:"multi", l:"Où la marque doit-elle vivre ?", o:["Réseaux sociaux","Site internet","Signalétique","Véhicules","Imprimés","Documents internes","Application ou favicon","Tenues","Goodies","Événements"], req:true},
      {k:"tech", s:"Contraintes", type:"multi", l:"Contraintes particulières", o:["Impression noir et blanc","Très petites tailles","Public âgé ou malvoyant","Broderie ou gravure","Plusieurs services à distinguer","Co-marquage avec un partenaire"]},
      {k:"gal", s:"Problèmes actuels", type:"area", l:"Où votre identité actuelle vous pose-t-elle problème ?", ph:"Le logo est trop large pour les bannières…"}
    ]},
    {t:"Les inspirations", f:[
      {k:"aime", s:"Marques admirées", type:"area", l:"Des marques que vous admirez, tous secteurs confondus, et pourquoi", ph:"Decathlon : tout est cohérent, du magasin à l'appli."},
      {k:"conc", s:"Concurrents", type:"area", l:"Vos concurrents ou voisins visuels", ph:"Les autres associations du territoire…"},
      {k:"eviter", s:"À éviter", type:"area", l:"Ce que vous ne voulez surtout pas", ph:"Une maison avec un cœur, du clipart…"}
    ]},
    {t:"Les moyens", f:[
      {k:"budget", s:"Budget", type:"one", l:"Budget envisagé", o:["Moins de 2 000 €","2 000 à 5 000 €","5 000 à 15 000 €","Plus de 15 000 €","À définir"]},
      {k:"delai", s:"Délai", type:"one", l:"Délai souhaité", o:["Moins d'un mois","1 à 3 mois","3 à 6 mois","Pas d'urgence"]},
      {k:"valid", s:"Validation", type:"text", l:"Qui valide au final ?", ph:"Bureau, conseil d'administration…", req:true}
    ]}
  ];

var identVig = function (st) {
    const v = [], t = st.tech, c = st.curseur;
    if (st.droits === "Non" || st.droits === "Je ne sais pas") v.push("Vérifier la propriété des droits sur le logo avant tout travail.");
    if (c >= 8 && st.attache === "Très attachées") v.push("Ambition forte mais équipes attachées : prévoir une vraie pédagogie du changement.");
    if (c >= 8 && st.budget === "Moins de 2 000 €") v.push("Ambition élevée pour le budget : prioriser les supports et phaser le déploiement.");
    if (t.includes("Public âgé ou malvoyant")) v.push("Accessibilité : contrastes d'au moins 4,5, typographie très lisible, tailles généreuses.");
    if (t.includes("Co-marquage avec un partenaire")) v.push("Prévoir une version endossée du logo et des règles de co-marquage.");
    if (t.includes("Plusieurs services à distinguer")) v.push("Construire un système de déclinaison des services sans morceler la marque.");
    if (t.includes("Impression noir et blanc") || t.includes("Broderie ou gravure")) v.push("Le logo doit fonctionner en une seule couleur dès la première esquisse.");
    if (st.garder.includes("Le logo") && c >= 7) v.push("Le logo est déclaré intouchable mais l'ambition est forte : clarifier ce point en premier.");
    if (st.garder.includes("Rien, tout est ouvert") && st.garder.length > 1) v.push("Réponses contradictoires sur ce qui est intouchable : à clarifier.");
    if (st.delai === "Moins d'un mois" && c >= 7) v.push("Délai très court pour une refonte : envisager un déploiement en deux temps.");
    return v;
  };

var BUDGET = ["Moins de 2 000 €", "2 000 à 5 000 €", "5 000 à 15 000 €", "Plus de 15 000 €", "À définir"];
var DELAI = ["Moins d'un mois", "1 à 3 mois", "3 à 6 mois", "Pas d'urgence", "Je ne sais pas"];
var PUB = ["Clients ou usagers", "Familles et proches", "Prescripteurs et partenaires", "Financeurs et institutions", "Candidats et salariés", "Bénévoles", "Grand public", "Presse"];
var n = function (a) { return (a || []).length; };
// « Je ne sais pas » / « À définir » : un point de vigilance plutôt qu'un blocage.
var moyens = function (s, v) {
  if (s.budget === BUDGET[4] && s.delai === DELAI[4]) v.push("Ni budget ni délai définis : prévoir un échange de cadrage avant de chiffrer.");
  else if (s.budget === BUDGET[4]) v.push("Budget à définir : prévoir un cadrage avant tout devis.");
  else if (s.delai === DELAI[4]) v.push("Délai inconnu : fixer au moins une échéance de validation.");
};

var COMM_STEPS = [
  {t:"Le contexte", f:[
    {k:"nom", s:"Structure", type:"text", l:"Nom de la structure ou du service", ph:"Association Les Tilleuls", req:true},
    {k:"secteur", s:"Secteur", type:"text", l:"Secteur d'activité", ph:"Aide à domicile, culture, sport…"},
    {k:"obj", s:"Point de départ", type:"area", l:"Qu'est-ce qui déclenche ce besoin de communiquer ?", ph:"Nouveau service, baisse de fréquentation, changement de direction…", req:true}
  ]},
  {t:"Les objectifs", f:[
    {k:"objectifs", s:"Objectifs", type:"multi", l:"Que voulez-vous obtenir ? (3 maximum)", o:["Faire connaître","Recruter (clients, bénévoles, salariés)","Fidéliser","Changer l'image ou la perception","Informer sur un service ou un changement","Rassurer ou gérer une situation sensible","Collecter des fonds ou des financements"], max:3, req:true},
    {k:"succes", s:"Critère de réussite", type:"area", l:"À quoi verra-t-on que c'est réussi ? Donnez un chiffre si possible.", ph:"+30 % de visites sur le site, 20 nouveaux bénévoles…", req:true}
  ]},
  {t:"Les publics et le message", f:[
    {k:"publics", s:"Publics prioritaires", type:"rank", l:"Choisissez vos 3 publics prioritaires, dans l'ordre", o:PUB, max:3, req:true},
    {k:"avant", s:"Aujourd'hui, il pense", type:"area", l:"Aujourd'hui, votre public n°1 pense ou ressent…", ph:"« C'est pour les autres, ce n'est pas pour moi. »"},
    {k:"apres", s:"Demain, il doit", type:"area", l:"Demain, il doit penser ou faire…", ph:"Pousser la porte et demander un rendez-vous."},
    {k:"message", s:"Message à retenir", type:"area", l:"Le message à retenir, en une phrase", ph:"Ici, chaque famille est accompagnée par la même personne.", req:true},
    {k:"preuves", s:"Preuves", type:"area", l:"Les preuves : chiffres, témoignages, labels, résultats", ph:"15 ans d'existence, 320 familles accompagnées…"}
  ]},
  {t:"Le ton", f:[
    {k:"tonalite", s:"Tonalité", type:"scales", l:"Placez chaque curseur là où votre voix doit se situer", o:[["Institutionnel","Proche"],["Sérieux","Ludique"],["Sobre","Enthousiaste"],["Expert","Pédagogue"]]},
    {k:"ton", s:"Ton en 3 mots", type:"words", l:"3 mots pour décrire le ton de vos messages", max:3, req:true},
    {k:"interdits", s:"À éviter", type:"area", l:"Sujets, mots ou images à éviter", ph:"Jargon administratif, humour sur le handicap…"}
  ]},
  {t:"Les canaux", f:[
    {k:"canaux", s:"Canaux", type:"multi", l:"Par où passeront vos messages ?", o:["Réseaux sociaux","Site internet","Newsletter ou e-mailing","Presse et relations médias","Affichage ou imprimés","Événements","Vidéo","Courriers et appels directs"], req:true},
    {k:"existant", s:"Existant", type:"area", l:"Ce qui existe déjà (comptes, site, listes de contacts) : ce qui marche, ce qui ne marche pas", ph:"Page Facebook active, site vieillissant, 400 contacts e-mail…"},
    {k:"deja", s:"Actions passées", type:"area", l:"Ce qui a déjà été fait, et ce qu'on en a appris", ph:"Une campagne d'affichage en 2024 : peu de retours. Les témoignages vidéo ont bien marché."},
    {k:"ressources", s:"Production", type:"one", l:"Qui produira les contenus ?", o:["En interne","Prestataire externe","Mixte","À définir"]}
  ]},
  {t:"Moyens et calendrier", f:[
    {k:"budget", s:"Budget", type:"one", l:"Budget envisagé", o:BUDGET},
    {k:"delai", s:"Délai", type:"one", l:"Délai souhaité", o:DELAI},
    {k:"echeance", s:"Dates clés", type:"text", l:"Dates clés ou échéances fixes", ph:"Assemblée générale le 12 mars, rentrée de septembre…"},
    {k:"oblig", s:"Obligations", type:"area", l:"Obligations à respecter (mentions légales, charte d'un financeur, accessibilité, RGPD)", ph:"Logo du financeur obligatoire, mention « avec le soutien de »…"},
    {k:"valid", s:"Validation", type:"text", l:"Qui valide au final ?", ph:"Direction, bureau…", req:true},
    {k:"autre", s:"Autre", type:"area", l:"Autre chose à nous dire ?", ph:"Tout ce qui vous semble utile pour bien comprendre le projet."}
  ]}
];

var MKT_STEPS = [
  {t:"L'offre", f:[
    {k:"nom", s:"Structure", type:"text", l:"Nom de la structure ou de l'offre", ph:"Atelier Mosaïque", req:true},
    {k:"secteur", s:"Secteur", type:"text", l:"Secteur d'activité", ph:"Services, commerce, formation…"},
    {k:"offre", s:"Offre", type:"area", l:"Ce que vous proposez et le problème que cela résout", ph:"Des ateliers créatifs pour les entreprises qui veulent renforcer leurs équipes.", req:true},
    {k:"prix", s:"Prix", type:"text", l:"Prix ou fourchette de prix", ph:"Atelier de 2 h : 450 € HT pour 12 personnes"},
    {k:"diff", s:"Ce qui nous distingue", type:"area", l:"Ce qui vous distingue de la concurrence", ph:"Nous venons sur site, avec le matériel.", req:true}
  ]},
  {t:"Les objectifs", f:[
    {k:"mkobj", s:"Objectif principal", type:"one", l:"Votre objectif principal", o:["Gagner de nouveaux clients","Augmenter le panier ou la fréquence d'achat","Lancer une nouvelle offre","Entrer sur un nouveau marché","Fidéliser et limiter les départs","Améliorer la notoriété"], req:true},
    {k:"kpi", s:"Objectif chiffré", type:"area", l:"Objectif chiffré et horizon", ph:"30 demandes de devis par mois d'ici 6 mois", req:true}
  ]},
  {t:"La cible", f:[
    {k:"publics", s:"Cibles prioritaires", type:"rank", l:"Vos 3 cibles prioritaires, dans l'ordre", o:["Particuliers","Familles","Entreprises (TPE et PME)","Grands comptes","Collectivités et institutions","Associations","Prescripteurs et partenaires","Jeunes de moins de 25 ans"], max:3, req:true},
    {k:"persona", s:"Client idéal", type:"area", l:"Décrivez votre client idéal : qui est-il, quel besoin, dans quelle situation achète-t-il ?", ph:"Une responsable RH de PME de 20 à 80 salariés, qui cherche une activité d'équipe…", req:true},
    {k:"freins", s:"Freins", type:"area", l:"Ce qui l'empêche d'acheter aujourd'hui", ph:"Le prix, le manque de temps, le doute sur le résultat…"}
  ]},
  {t:"Le marché", f:[
    {k:"conc", s:"Concurrents", type:"area", l:"Vos principaux concurrents, et ce qu'ils font mieux que vous", ph:"Les grandes enseignes : prix et notoriété."},
    {k:"pos", s:"Positionnement", type:"one", l:"Le positionnement visé", o:["Prix accessible","Qualité et expertise","Proximité et service","Innovation","Engagement et valeurs","Je ne sais pas"]},
    {k:"saison", s:"Temps forts", type:"text", l:"Temps forts de l'année (saisonnalité)", ph:"Pic en septembre et en janvier, creux en été"}
  ]},
  {t:"Les leviers", f:[
    {k:"leviers", s:"Leviers", type:"multi", l:"Quels leviers envisagez-vous ?", o:["Site et référencement naturel","Publicité en ligne","Réseaux sociaux","E-mailing ou newsletter","Partenariats et prescripteurs","Salons et événements","Prospection directe","Imprimés et affichage"], req:true},
    {k:"existant", s:"Existant", type:"area", l:"Ce qui est déjà en place et ce que cela rapporte", ph:"Site à 500 visites par mois, 2 demandes par mois…"},
    {k:"suivi", s:"Suivi des résultats", type:"one", l:"Comment suivez-vous les résultats aujourd'hui ?", o:["Rien de précis","Tableur ou suivi manuel","Outil d'analyse ou CRM","Je ne sais pas"]}
  ]},
  {t:"Les moyens", f:[
    {k:"budget", s:"Budget", type:"one", l:"Budget envisagé", o:BUDGET},
    {k:"delai", s:"Délai", type:"one", l:"Délai souhaité pour les premiers résultats", o:DELAI},
    {k:"ressources", s:"Exécution", type:"one", l:"Qui exécute les actions ?", o:["En interne","Prestataire externe","Mixte","À définir"]},
    {k:"valid", s:"Validation", type:"text", l:"Qui valide au final ?", ph:"Direction, associés…", req:true},
    {k:"autre", s:"Autre", type:"area", l:"Autre chose à nous dire ?", ph:"Tout ce qui vous semble utile pour bien comprendre le projet."}
  ]}
];

var INT_STEPS = [
  {t:"La demande", f:[
    {k:"nom", s:"Demandeur", type:"text", l:"Qui demande ? (nom et service)", ph:"Camille Martin, service Accueil", req:true},
    {k:"livrable", s:"Livrables", type:"multi", l:"De quoi avez-vous besoin ?", o:["Visuel ou affiche","Document (plaquette, rapport)","Présentation","Contenu pour les réseaux","Article ou actualité du site","Vidéo","E-mailing","Autre"], req:true},
    {k:"demande", s:"Demande", type:"area", l:"Décrivez ce dont vous avez besoin", ph:"Une affiche A3 pour la journée portes ouvertes du 14 juin.", req:true},
    {k:"usage", s:"Usage", type:"one", l:"Où sera-t-il utilisé ?", o:["Impression","Écran ou web","Réseaux sociaux","Plusieurs usages"], req:true}
  ]},
  {t:"Le contexte", f:[
    {k:"cible", s:"Destinataires", type:"area", l:"Pour qui est-ce destiné ?", ph:"Les familles du quartier, les partenaires locaux…", req:true},
    {k:"message", s:"Message attendu", type:"area", l:"Quel message ou quelle action attendez-vous du public ?", ph:"Venir à la journée portes ouvertes.", req:true},
    {k:"fournis", s:"Éléments fournis", type:"area", l:"Éléments déjà disponibles (textes, photos, logos, charte graphique)", ph:"Texte validé, 3 photos, logo en PNG…"},
    {k:"lien", s:"Lien", type:"text", l:"Lien vers les éléments déjà disponibles (Drive, SharePoint)", ph:"https://…"},
    {k:"ancien", s:"Version précédente", type:"one", l:"Existe-t-il une version précédente à reprendre ?", o:["Oui","Non","Je ne sais pas"]}
  ]},
  {t:"Délai et validation", f:[
    {k:"delai", s:"Délai", type:"one", l:"Délai souhaité", o:["Urgent (sous 48 h)","Sous une semaine","Sous un mois","Pas de date"], req:true},
    {k:"echeance", s:"Date butoir", type:"text", l:"Date butoir exacte, si elle existe", ph:"14 juin"},
    {k:"valid", s:"Validation", type:"text", l:"Qui valide ?", ph:"Responsable de service…", req:true},
    {k:"autre", s:"Autre", type:"area", l:"Autre chose à nous dire ?", ph:"Tout ce qui vous semble utile pour bien comprendre le projet."}
  ]}
];

window.BRIEF_TEMPLATES = {
  identite: {id:"identite", c:{tint:"#FCE3D2", deep:"#B4491A"}, t:"Identité visuelle", d:"Créer, faire évoluer ou décliner un logo et une identité de marque.", min:10, steps:IDENT_STEPS, n:"type", p:"publics", lead:"diff", vig:identVig},
  communication: {id:"communication", c:{tint:"#DCDCFB", deep:"#3D3BF3"}, t:"Plan de communication", d:"Définir objectifs, publics, message, ton et canaux d'une action de communication.", min:10, steps:COMM_STEPS, n:"objectifs", p:"publics", lead:"obj",
    vig:function (s) {
      var v = [];
      if (n(s.objectifs) >= 3) v.push("Trois objectifs choisis : désigner un objectif principal, sinon le message se dilue.");
      if (!/\d/.test(s.succes || "")) v.push("Le critère de réussite ne contient aucun chiffre : fixer au moins un indicateur mesurable.");
      if (n(s.canaux) >= 5 && s.budget === BUDGET[0]) v.push("Beaucoup de canaux pour un petit budget : en prioriser deux ou trois.");
      if (s.ressources === "En interne" && n(s.canaux) >= 4) v.push("Production entièrement interne sur 4 canaux ou plus : vérifier le temps disponible.");
      if (s.delai === DELAI[0] && n(s.canaux) >= 3) v.push("Délai court pour plusieurs canaux : envisager un lancement en deux temps.");
      if (!(s.avant || "").trim() || !(s.apres || "").trim()) v.push("Le « de… à… » du public n°1 n'est pas renseigné : sans lui, le message manque de cap.");
      if ((s.objectifs || []).indexOf("Collecter des fonds ou des financements") >= 0 && !(s.oblig || "").trim()) v.push("Financements en jeu : vérifier les obligations de communication des financeurs.");
      moyens(s, v);
      return v;
    }},
  marketing: {id:"marketing", c:{tint:"#C4EDE5", deep:"#0F766E"}, t:"Stratégie marketing", d:"Cadrer offre, cible, positionnement et leviers pour une action commerciale.", min:10, steps:MKT_STEPS, n:"mkobj", p:"publics", lead:"offre",
    vig:function (s) {
      var v = [];
      if (!/\d/.test(s.kpi || "")) v.push("L'objectif n'est pas chiffré : sans chiffre, impossible de mesurer le résultat.");
      if (n(s.leviers) >= 5 && s.budget === BUDGET[0]) v.push("Beaucoup de leviers pour un petit budget : concentrer l'effort sur deux ou trois.");
      if (s.mkobj === "Entrer sur un nouveau marché" && s.budget === BUDGET[0]) v.push("Entrer sur un nouveau marché avec moins de 2 000 € : ambition à revoir ou à phaser.");
      if ((s.persona || "").trim().length < 40) v.push("Client idéal décrit très brièvement : le préciser pour guider les messages et les canaux.");
      if (s.suivi === "Rien de précis" && /\d/.test(s.kpi || "")) v.push("Objectif chiffré mais aucun suivi en place : installer la mesure dès le départ.");
      if (s.ressources === "En interne" && n(s.leviers) >= 4) v.push("Exécution entièrement interne sur 4 leviers ou plus : vérifier le temps disponible.");
      moyens(s, v);
      return v;
    }},
  interne: {id:"interne", c:{tint:"#FFB3AD", deep:"#B8325A"}, t:"Demande interne", d:"Formulaire rapide pour demander un visuel, un document ou un contenu.", min:3, steps:INT_STEPS, n:"livrable", p:"cible", lead:"demande",
    vig:function (s) {
      var v = [];
      if (s.delai === "Urgent (sous 48 h)" && n(s.livrable) >= 2) v.push("Délai de 48 h pour plusieurs livrables : en prioriser un.");
      if (!(s.fournis || "").trim()) v.push("Aucun élément fourni : prévoir le temps de collecte des textes et visuels.");
      if (s.usage === "Plusieurs usages" && n(s.livrable) === 1) v.push("Plusieurs usages pour un seul livrable : préciser les formats nécessaires.");
      if (s.ancien === "Oui" && !(s.lien || "").trim()) v.push("Version précédente à reprendre mais aucun lien fourni : transmettre le fichier source.");
      if (s.ancien === "Je ne sais pas") v.push("Version précédente incertaine : la retrouver avant de tout recréer.");
      return v;
    }}
};
})();
