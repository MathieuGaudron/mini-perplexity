import 'dotenv/config';

const PROVIDERS = [
    {
        nom: 'Mistral',
        url: 'https://api.mistral.ai/v1/chat/completions',
        key: process.env.MISTRAL_API_KEY,
        model: 'mistral-small-latest'
    },
    {
        nom: 'Groq',
        url: 'https://api.groq.com/openai/v1/chat/completions',
        key: process.env.GROQ_API_KEY,
        model: 'llama-3.3-70b-versatile'
    },
    {
        nom: 'HuggingFace',
        url: 'https://router.huggingface.co/v1/chat/completions',
        key: process.env.HF_API_KEY,
        model: 'meta-llama/Llama-3.1-8B-Instruct'
    }
];

const PROMPTS = [
    { type: 'traduction', text: "Traduis en anglais : « Le chat dort sur le canapé. » Réponds uniquement avec la traduction." },
    { type: 'résumé',     text: "Résume en UNE phrase : Node.js est un environnement d'exécution JavaScript côté serveur, basé sur le moteur V8 de Chrome, qui permet d'exécuter du JS en dehors d'un navigateur et repose sur un modèle événementiel non bloquant." },
    { type: 'code',       text: "Écris une fonction JavaScript `reverseString(str)` qui retourne la chaîne inversée. Réponds uniquement avec le code." },
    { type: 'créatif',    text: "Donne UNE métaphore originale (une phrase) pour expliquer ce qu'est un LLM à un enfant de 10 ans." },
    { type: 'factuel',    text: "Qui a inventé l'architecture Transformer en 2017 ? Réponds en une phrase." }
];

async function callProvider(provider, prompt) {
    const debut = Date.now();

    try {
        const response = await fetch(provider.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${provider.key}`
            },
            body: JSON.stringify({
                model: provider.model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3
            })
        });

        const data = await response.json();
        const latency = Date.now() - debut;

        if (!response.ok || !data.choices) {
            return {
                provider: provider.nom,
                content: null,
                latency,
                error: data.error?.message || `HTTP ${response.status}`
            };
        }

        return {
            provider: provider.nom,
            content: data.choices[0].message.content,
            latency
        };
    } catch (error) {
        return {
            provider: provider.nom,
            content: null,
            latency: Date.now() - debut,
            error: error.message
        };
    }
}

function cellule(r) {
    if (r.error) return `❌ ${r.error}`;
    return r.content.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
}

async function main() {
    const taches = PROMPTS.flatMap(p =>
        PROVIDERS.map(provider => ({ type: p.type, provider, text: p.text }))
    );

    const resultats = await Promise.all(
        taches.map(t => callProvider(t.provider, t.text).then(r => ({ ...r, type: t.type })))
    );

    console.log(`\n| Type       | ${PROVIDERS.map(p => p.nom).join(' | ')} |`);
    console.log(`|${'-'.repeat(12)}|${PROVIDERS.map(() => '-'.repeat(50)).join('|')}|`);

    for (const prompt of PROMPTS) {
        const ligne = PROVIDERS.map(p => {
            const r = resultats.find(r => r.type === prompt.type && r.provider === p.nom);
            return cellule(r);
        });
        console.log(`| ${prompt.type.padEnd(10)} | ${ligne.join(' | ')} |`);
    }

    console.log('\n--- Latences ---');
    for (const prompt of PROMPTS) {
        const latences = PROVIDERS.map(p => {
            const r = resultats.find(r => r.type === prompt.type && r.provider === p.nom);
            return `${p.nom}: ${r.latency}ms`;
        });
        console.log(`${prompt.type.padEnd(10)} → ${latences.join(' | ')}`);
    }
}

main();
