import 'dotenv/config'; 

async function testConnection() {
    const apiKey = process.env.MISTRAL_API_KEY;

    if (!apiKey) {
        console.error("❌ Erreur : La clé API n'est pas trouvée dans le .env");
        return;
    }

    console.log("✅ Clé API détectée, tentative d'appel...");

    try {
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'mistral-small-latest',
                messages: [
                    { role: 'user', content: 'Bonjour ! Es-tu prêt pour notre TD ?' }
                ]
            })
        });

        const data = await response.json();
        console.log("Réponse de l'IA :", data.choices[0].message.content);
        
    } catch (error) {
        console.error("❌ Erreur lors de l'appel :", error);
    }
}

testConnection();