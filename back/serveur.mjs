import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3000;
const OPENAI_API_KEY = '';

// Middleware pour gérer les requêtes POST (form data)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Activer CORS pour toutes les requêtes
app.use(cors());

// Structure de stockage de l'historique
const conversationHistories = {};

// Route pour récupérer l'input sur "/json" et générer un JSON
app.post('/json', async (req, res) => {
  const searchInput = req.body.jsonSearch;
  const sessionId = req.body.sessionId || 'default'; // Utiliser un ID de session ou une valeur par défaut
  console.log(`[LOG] Input reçu : ${searchInput}`);

  // Initialiser l'historique si la session n'existe pas
  if (!conversationHistories[sessionId]) {
    conversationHistories[sessionId] = [];
  }

  // Ajouter le nouveau message de l'utilisateur à l'historique
  conversationHistories[sessionId].push({ role: 'user', content: searchInput });

  try {
    // Vérifier si le token est valide avant de faire une requête
    if (!OPENAI_API_KEY || OPENAI_API_KEY.trim() === '') {
      throw new Error('Token API manquant ou invalide. Veuillez vérifier votre clé API.');
    }

    // Faire une requête à l'API de ChatGPT (URL officielle OpenAI) pour générer un JSON
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          ...conversationHistories[sessionId],
          {
            role: 'user',
            content: `
              Nom : Générateur JSON

              Description : Répond en JSON pur avec triple vérification des données et inclusion des sources.

              Contexte :
              Ce GPT est conçu pour répondre à toutes les requêtes utilisateur en générant des réponses au format JSON pur, avec les clés toujours en français. 
              Il doit suivre une structure logique et cohérente pour s'assurer que chaque donnée est exacte et validée. Voici le processus de fonctionnement :

              Identification du sujet : Le GPT commence par déterminer la catégorie du sujet demandé (par exemple, film, produit, objet céleste, événement historique, etc.).

              Recherche d'informations :
              
              En l'absence d'API, tu dois utiliser les outils disponibles, comme le navigateur intégré, pour rechercher des informations à partir de sources fiables en ligne.
              tu ne doit pas inventer de contenu ou extrapoler à partir de données limitées. 
              Obligatoire : Si une information est incertaine ou impossible à trouver, le GPT doit indiquer que l'information est indisponible.
              Tu dois prendre un maximum d'information,
              obligatoire: si c'est des aliments, mettre les valeurs nutritionnelles et tous les infos pertinentes que tu trouves tu peut aller sur FooDB éventuellement 
              obligatoire: si c'est une entreprise, mettre le nombre de salariés et tous les infos pertinentes que tu trouves
              obligatoire:si c'est un produit électronique , ca fiche technique et tous les infos pertinentes que tu trouves
              et ceci pour tous les sujet tu cherche les infos les plus pertinentes et le json doit être conséquent en taille d'information !
              obligatoire : minimum 30 entrées 
              Vérification des données :

              Chaque donnée récupérée doit être validée à trois niveaux :
              Exactitude par rapport à la source d'origine.
              Cohérence avec le reste des données récupérées.
              Obligatoire: inclusion des sources spécifiques et vérifiables dans le JSON !
              obligatoire: une clé dans le json contenant le pourcentage de confiance aux infos récupérées !!
              obligatoire: les sources des infos url des sites ! 
              obligatoire: une photo de wikipedia du sujet si il s'y trouve!

              Génération du JSON :

              Une fois les données obtenues, elles sont structurées sous forme de JSON pur avec des clés en français.
              Le JSON doit être clair, concis et organisé en sections logiques pour faciliter la lecture.

              Triple vérification :

              Avant de retourner le JSON, le GPT doit vérifier une dernière fois que toutes les informations sont exactes et correctement formatées.
              Réponses :

              Toutes les réponses doivent être strictement au format JSON, sans aucune exception.
              Si une réponse en texte est générée par erreur, le GPT doit automatiquement régénérer la réponse sous forme de JSON.

              voici le mot : ${searchInput} merci` },
        ],
        max_tokens: 150
      })
    });

    // Vérifier si la réponse est correcte
    if (!response.ok) {
      const errorText = `Erreur lors de la requête : ${response.status} - ${response.statusText}`;
      console.error(`[ERREUR] ${errorText}`);
      throw new Error(errorText);
    }

    const gptData = await response.json();
    const jsonContent = gptData.choices[0].message.content.trim();

    console.log('[LOG] Réponse de GPT (JSON) :', jsonContent);

    // Ajouter la réponse du modèle à l'historique
    conversationHistories[sessionId].push({ role: 'assistant', content: jsonContent });

    // Envoyer le JSON au client
    res.status(200).json({ json: jsonContent });

  } catch (error) {
    console.error('[ERREUR] Erreur lors de la requête vers GPT:', error);
    res.status(500).json({ message: 'Erreur lors de la requête vers GPT', error: error.message });
  }
});

// Route pour générer le HTML des cartes Bootstrap à partir du JSON
app.post('/generate-html', async (req, res) => {
  const jsonContent = req.body.json;
  console.log('[LOG] JSON reçu pour génération de HTML :', jsonContent);

  try {
    // Vérifier si le token est valide avant de faire une requête
    if (!OPENAI_API_KEY || OPENAI_API_KEY.trim() === '') {
      throw new Error('Token API manquant ou invalide. Veuillez vérifier votre clé API.');
    }

    const responseForCards = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `
            Tu vas recevoir un fichier JSON contenant diverses informations. 
            Ta tâche est de :

            Analyser les données JSON :

            Parcours le fichier JSON pour identifier les informations principales que l'on souhaite représenter.
            Par exemple, les objets peuvent contenir des informations comme : le titre, la description, une image, des détails, etc.

            Créer des cartes Bootstrap à partir de ces données :

            Générez le code HTML nécessaire pour créer des cartes Bootstrap.
            Utilise Bootstrap 5 (ou une version spécifique de Bootstrap, par exemple Bootstrap 4 si nécessaire).
            Chaque objet JSON doit être représenté par une carte individuelle.

            Pour chaque carte, utilise les éléments suivants si disponibles dans le JSON :
            Titre : Utilise la valeur d'une clé appropriée comme titre de la carte.
            Image : S'il y a un lien vers une image, ajoute cette image en utilisant la balise <img> avec la classe Bootstrap card-img-top.
            Description : Utilise une clé appropriée comme le texte de la description de la carte, placé dans une <div> avec la classe card-body.
            Détails supplémentaires : Si des informations supplémentaires sont disponibles, ajoute-les dans la carte dans une section distincte (par exemple, une liste ou un paragraphe).

            Format des cartes Bootstrap :

            Chaque carte doit être contenue dans une <div> avec les classes card et mb-4 (ou toute autre classe Bootstrap pour la mise en page).
            Place toutes les cartes générées dans un conteneur Bootstrap (<div class="container">) pour une mise en page uniforme.
            Assure-toi d'utiliser une grille Bootstrap (<div class="row">) pour positionner les cartes de manière réactive, chaque carte occupant une colonne (col-sm-12 col-md-6 col-lg-4 par exemple).

            Autres détails :

            Le JSON doit être utilisé de manière efficace : ne pas ignorer les champs présents. Si certains champs sont optionnels (comme une image ou une date), gère-les de manière conditionnelle.
            Génère strictement le code HTML nécessaire pour les cartes, sans explication supplémentaire.
            obligatoire un lien ou des liens clickable des sources pour verification !! 
            obligatoire: tu dois ecrire tous le contenu du json 
            obligatoire : des liens vers les sources 

            voici un exemple de card :
            <div class="card" style="width: 18rem;">
            <div class="card-body"> <---- Obligatoire:la  div contenant le titre en background black color white
            <h5 class="card-title">le sujet</h5>
            <p class="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
            </div>
            <img src="(ici l image)" class="card-img-top" alt="...">
              <ul class="list-group list-group-flush">
                <li class="list-group-item">An item</li>
                <li class="list-group-item">A second item</li>
                <li class="list-group-item">A third item</li>
                obligatoire : ajouté tous les elements du JSONs dans les infos 
                ....
              </ul>
              <div class="card-body">
                <a href="#" class="card-link">Card link</a>
                <a href="#" class="card-link">Another link</a>
                ....
              </div>
            </div>
            Voici les données JSON : ${jsonContent} 
            obligatoire :tu dois juste renvoyer du html et bootstrap pur juste la card sans le body. la carte dois toujour avoir le meme format , n'oublie pas les liens vers les sources` }],
        max_tokens: 500
      })
    });

    // Vérifier si la réponse est correcte pour la requête des cartes
    if (!responseForCards.ok) {
      const errorText = `Erreur lors de la requête pour les cartes : ${responseForCards.status} - ${responseForCards.statusText}`;
      console.error(`[ERREUR] ${errorText}`);
      throw new Error(errorText);
    }

    const cardData = await responseForCards.json();
    const htmlContent = cardData.choices[0].message.content.trim();

    console.log('[LOG] Réponse de GPT (HTML des cartes) :', htmlContent);

    // Envoyer le HTML au client
    res.status(200).json({ html: htmlContent });

  } catch (error) {
    console.error('[ERREUR] Erreur lors de la requête vers GPT:', error);
    res.status(500).json({ message: 'Erreur lors de la requête vers GPT', error: error.message });
  }
});

// Lancer le serveur
app.listen(PORT, () => {
  console.log(`[LOG] Serveur en cours d'exécution sur http://localhost:${PORT}`);
});