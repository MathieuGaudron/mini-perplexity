import 'dotenv/config';

async function demanderIA(nom, url, key, model, prompt) {
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
                messages: [{ role: 'user', content: prompt }]
            })
        });

        const data = await response.json();
        const fin = Date.now();
        const duree = (fin - debut) / 1000;

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

async function comparer() {
    const question = "Explique le concept de 'streaming' en IA en une phrase.";

    await demanderIA(
        "MISTRAL", 
        "https://api.mistral.ai/v1/chat/completions", 
        process.env.MISTRAL_API_KEY, 
        "mistral-small-latest", 
        question
    );

    await demanderIA(
        "GROQ", 
        "https://api.groq.com/openai/v1/chat/completions", 
        process.env.GROQ_API_KEY, 
        "llama-3.3-70b-versatile", 
        question
    );

    await demanderIA(
        "HUGGING FACE",
        "https://router.huggingface.co/v1/chat/completions",
        process.env.HF_API_KEY,
        "meta-llama/Llama-3.1-8B-Instruct",
        question
    );
}

comparer();