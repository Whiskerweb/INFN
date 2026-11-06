# Démo chatbot INFN · page DMN (Snipia)

Copie de la page « Diplôme des métiers du notariat » d'infn.fr avec un assistant IA en bas à droite.
L'assistant répond uniquement à partir du texte de cette page (`corpus-dmn.md`), via OpenRouter (Claude Haiku 5.5).

- Local : `node serve.mjs` → http://127.0.0.1:4410 (clé dans `openrouter.key`, non versionné)
- Vercel : fonction `api/chat.js`, clé dans la variable d'environnement `OPENROUTER_API_KEY`
- Régénérer : `python3 extract.py` (corpus) puis `python3 build.py` (page)

Maquette de démonstration, non indexée.
