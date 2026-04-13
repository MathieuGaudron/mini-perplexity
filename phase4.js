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

async function testProvider(p) {
    if (!p.key) {
        return { nom: p.nom, statut: 'MISSING' };
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
                messages: [{ role: 'user', content: 'ping' }],
                max_tokens: 1
            })
        });
        const duree = Date.now() - debut;

        if (response.ok) return { nom: p.nom, statut: 'OK', duree };
        if (response.status === 401 || response.status === 403) {
            return { nom: p.nom, statut: 'AUTH', duree, code: response.status };
        }
        return { nom: p.nom, statut: 'ERROR', duree, code: response.status };
    } catch (error) {
        return { nom: p.nom, statut: 'NETWORK', message: error.message };
    }
}

function displayResult(result) {
    const nom = result.nom.padEnd(14);
    switch (result.statut) {
        case 'OK':
            console.log(`   ✅ ${nom}${result.duree}ms`);
            break;
        case 'AUTH':
            console.log(`   ❌ ${nom}ERROR (auth ${result.code})`);
            break;
        case 'ERROR':
            console.log(`   ❌ ${nom}ERROR (HTTP ${result.code})`);
            break;
        case 'NETWORK':
            console.log(`   🌐 ${nom}ERROR réseau (${result.message})`);
            break;
        case 'MISSING':
            console.log(`   ⚠️  ${nom}clé manquante dans .env`);
            break;
    }
}

async function main() {
    console.log('🔍 Vérification des connexions API...\n');

    const results = await Promise.all(PROVIDERS.map(testProvider));
    results.forEach(displayResult);

    const actives = results.filter(r => r.statut === 'OK').length;
    console.log(`\n   ${actives}/${PROVIDERS.length} connexions actives\n`);

    if (actives === PROVIDERS.length) {
        console.log('Tout est vert. Vous êtes prêts pour la suite !');
    } else {
        console.log('Certaines connexions ont échoué. Corrige les erreurs ci-dessus.');
    }
}

main();
