import 'dotenv/config';
import fs from 'fs';

async function demanderIAAvecDocument(nom, url, key, model, contenuDoc, question) {
    const debut = Date.now();

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: `Tu es un expert. Voici un document pour t'aider à répondre : \n\n ${contenuDoc}`
                    },
                    {
                        role: 'user',
                        content: `En te basant UNIQUEMENT sur le document fourni, réponds à ceci : ${question}`
                    }
                ],
                temperature: 0.1
            })
        });

        const data = await response.json();
        const duree = (Date.now() - debut) / 1000;

        console.log(`\n--- ${nom} (${model}) ---`);
        console.log(`⏱️ Temps : ${duree}s`);
        if (!data.choices) {
            console.log(`⚠️ Réponse brute :`, JSON.stringify(data, null, 2));
            return;
        }
        console.log(`🤖 Réponse : ${data.choices[0].message.content}`);
    } catch (error) {
        console.error(`❌ Erreur ${nom}:`, error.message);
    }
}

async function comparer(cheminFichier, question) {
    console.log(`\n--- 📂 Lecture du document : ${cheminFichier} ---`);

    let contenuDoc;
    try {
        contenuDoc = fs.readFileSync(cheminFichier, 'utf8');
    } catch (error) {
        console.error("❌ Erreur lecture fichier :", error.message);
        console.log("Conseil : Crée un fichier 'info.txt' avec du texte dedans pour tester !");
        return;
    }

    await demanderIAAvecDocument(
        "MISTRAL",
        "https://api.mistral.ai/v1/chat/completions",
        process.env.MISTRAL_API_KEY,
        "mistral-small-latest",
        contenuDoc,
        question
    );

    await demanderIAAvecDocument(
        "GROQ",
        "https://api.groq.com/openai/v1/chat/completions",
        process.env.GROQ_API_KEY,
        "llama-3.3-70b-versatile",
        contenuDoc,
        question
    );

    await demanderIAAvecDocument(
        "HUGGING FACE",
        "https://router.huggingface.co/v1/chat/completions",
        process.env.HF_API_KEY,
        "meta-llama/Llama-3.1-8B-Instruct",
        contenuDoc,
        question
    );
}

comparer('info.txt', "Fais-moi un résumé de ce document.");
