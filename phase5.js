import 'dotenv/config';

const VERBOSE = process.argv.includes('--verbose');
let PROMPT = "ping";
if (VERBOSE) {
    PROMPT = "Donne-moi la capitale de la France en un mot.";
}

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

async function checkProvider(p) {
    if (!p.key) {
        return { provider: p.nom, status: 'ERROR', latency: 0, error: 'Clé manquante' };
    }

    const debut = Date.now();
    try {
        const response = await fetch(p.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${p.key}`
            },
            body: JSON.stringify({
                model: p.model,
                messages: [{ role: 'user', content: PROMPT }],
                max_tokens: VERBOSE ? 20 : 5
            })
        });
        const latency = Date.now() - debut;
        const data = await response.json();

        if (!response.ok || !data.choices) {
            return { provider: p.nom, status: 'ERROR', latency, error: `HTTP ${response.status}` };
        }

        const result = { provider: p.nom, status: 'OK', latency };
        if (VERBOSE) result.reponse = data.choices[0].message.content.trim();
        return result;
    } catch (error) {
        return { provider: p.nom, status: 'ERROR', latency: Date.now() - debut, error: error.message };
    }
}

async function checkPinecone() {
    if (!process.env.PINECONE_API_KEY) {
        return { provider: 'Pinecone', status: 'ERROR', latency: 0, error: 'Clé manquante' };
    }

    const debut = Date.now();
    try {
        const response = await fetch('https://api.pinecone.io/indexes', {
            method: 'GET',
            headers: {
                'Api-Key': process.env.PINECONE_API_KEY,
                'X-Pinecone-API-Version': '2024-07'
            }
        });
        const latency = Date.now() - debut;

        if (response.ok) return { provider: 'Pinecone', status: 'OK', latency };
        return { provider: 'Pinecone', status: 'ERROR', latency, error: `HTTP ${response.status}` };
    } catch (error) {
        return { provider: 'Pinecone', status: 'ERROR', latency: Date.now() - debut, error: error.message };
    }
}

async function listMistralModels() {
    try {
        const response = await fetch('https://api.mistral.ai/v1/models', {
            headers: { 'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}` }
        });
        const data = await response.json();

        console.log('\n📋 Modèles Mistral disponibles :');
        for (const m of data.data) {
            console.log(`   - ${m.id}`);
        }
    } catch (error) {
        console.error('❌ Erreur listMistralModels :', error.message);
    }
}

function displayResult(r) {
    const nom = r.provider.padEnd(14);
    if (r.status === 'OK') {
        const suffix = r.reponse ? `  → "${r.reponse}"` : '';
        console.log(`   ✅ ${nom}${r.latency}ms${suffix}`);
    } else {
        console.log(`   ❌ ${nom}ERROR (${r.error})`);
    }
}

async function main() {
    console.log('🔍 Vérification des connexions API...\n');

    const results = await Promise.all([
        ...PROVIDERS.map(checkProvider),
        checkPinecone()
    ]);

    results.forEach(displayResult);

    const actives = results.filter(r => r.status === 'OK').length;
    console.log(`\n   ${actives}/${results.length} connexions actives`);

    if (VERBOSE) {
        await listMistralModels();
    }
}

main();
