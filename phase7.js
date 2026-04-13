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

const TEMPERATURES = [0, 0.5, 1];

async function callProvider(provider, prompt, temperature) {
    const temp = provider.nom === 'HuggingFace' && temperature === 0 ? 0.01 : temperature;

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
                temperature: temp
            })
        });

        const data = await response.json();

        if (!response.ok || !data.choices) {
            return {
                provider: provider.nom,
                temperature,
                content: null,
                error: data.error?.message || `HTTP ${response.status}`
            };
        }

        return {
            provider: provider.nom,
            temperature,
            content: data.choices[0].message.content
        };
    } catch (error) {
        return {
            provider: provider.nom,
            temperature,
            content: null,
            error: error.message
        };
    }
}

async function main() {
    const prompt = "Explique ce qu'est un cookie HTTP en une phrase.";

    const combinations = PROVIDERS.flatMap(p =>
        TEMPERATURES.map(t => ({ provider: p, temperature: t }))
    );

    const results = await Promise.all(
        combinations.map(({ provider, temperature }) =>
            callProvider(provider, prompt, temperature)
        )
    );

    for (const r of results) {
        const nom = r.provider.padEnd(12);
        const temp = `temp ${r.temperature.toFixed(1)}`;
        const contenu = r.error ? `ERROR: ${r.error}` : r.content.replace(/\s+/g, ' ').trim();
        console.log(`${nom} | ${temp} | ${contenu}`);
    }
}

main();
