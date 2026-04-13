import 'dotenv/config';
import express from 'express';

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

const PRICING = {
    'Mistral Small': 0.20,
    'Groq Llama 3':  0.05,
    'GPT-4o':        2.50
};

async function checkProvider(provider) {
    if (!provider.key) {
        return { provider: provider.nom, status: 'ERROR', latency: 0, error: 'Clé manquante' };
    }
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
                messages: [{ role: 'user', content: 'ping' }],
                max_tokens: 5
            })
        });
        const latency = Date.now() - debut;
        if (response.ok) return { provider: provider.nom, status: 'OK', latency };
        return { provider: provider.nom, status: 'ERROR', latency, error: `HTTP ${response.status}` };
    } catch (error) {
        return { provider: provider.nom, status: 'ERROR', latency: Date.now() - debut, error: error.message };
    }
}

async function askProvider(provider, prompt) {
    const response = await fetch(provider.url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${provider.key}`
        },
        body: JSON.stringify({
            model: provider.model,
            messages: [{ role: 'user', content: prompt }]
        })
    });
    const data = await response.json();
    if (!response.ok || !data.choices) {
        throw new Error(data.error?.message || `HTTP ${response.status}`);
    }
    return data.choices[0].message.content;
}

function estimateTokens(text) {
    return Math.ceil(text.length / 4);
}

function estimateCostData(text) {
    const tokens = estimateTokens(text);
    return Object.entries(PRICING).map(([nom, prix]) => ({
        provider: nom,
        tokens,
        estimatedCost: `${((tokens * prix) / 100_000_000).toFixed(8)}€`
    }));
}

const app = express();

app.get('/check', async (req, res) => {
    const results = await Promise.all(PROVIDERS.map(checkProvider));
    res.json(results);
});

app.get('/ask', async (req, res) => {
    const { q, provider } = req.query;
    if (!q) return res.status(400).json({ error: 'Paramètre "q" requis' });
    if (!provider) return res.status(400).json({ error: 'Paramètre "provider" requis' });

    const p = PROVIDERS.find(x => x.nom.toLowerCase() === provider.toLowerCase());
    if (!p) return res.status(404).json({ error: `Provider "${provider}" inconnu` });

    try {
        const response = await askProvider(p, q);
        res.json({ provider: p.nom, response });
    } catch (error) {
        res.status(500).json({ provider: p.nom, error: error.message });
    }
});

app.get('/cost', (req, res) => {
    const { text } = req.query;
    if (!text) return res.status(400).json({ error: 'Paramètre "text" requis' });
    res.json(estimateCostData(text));
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
    console.log(`   GET /check`);
    console.log(`   GET /ask?q=...&provider=mistral`);
    console.log(`   GET /cost?text=...`);
});
