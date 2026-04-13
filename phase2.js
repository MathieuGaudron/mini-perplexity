import 'dotenv/config';

async function checkMistral() {
    const debut = Date.now();

    try {
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
            },
            body: JSON.stringify({
                model: 'mistral-small-latest',
                messages: [{ role: 'user', content: 'ping' }],
                max_tokens: 5
            })
        });

        const latency = Date.now() - debut;

        if (response.ok) {
            return { provider: 'Mistral', status: 'OK', latency };
        }
        return { provider: 'Mistral', status: 'ERROR', latency, error: `HTTP ${response.status}` };
    } catch (error) {
        return { provider: 'Mistral', status: 'ERROR', latency: Date.now() - debut, error: error.message };
    }
}

const result = await checkMistral();
console.log(result);
