const PRICING = {
    'Mistral Small': 0.20,
    'Groq Llama 3':  0.05,
    'GPT-4o':        2.50
};

function estimateTokens(text) {
    return Math.ceil(text.length / 4);
}

function estimateCost(text) {
    const tokens = estimateTokens(text);

    console.log(`Texte : ${text.length} caractères → ~${tokens} tokens\n`);
    console.log('Provider'.padEnd(16) + 'Coût estimé (input)'.padEnd(23) + 'Pour 1000 requêtes');
    console.log('----------'.padEnd(16) + '-------------------'.padEnd(23) + '------------------');

    for (const nom in PRICING) {
        const cout = (tokens * PRICING[nom]) / 100_000_000;
        const cout1000 = cout * 1000;
        console.log(
            nom.padEnd(16) +
            `${cout.toFixed(8)}€`.padEnd(23) +
            `${cout1000.toFixed(5)}€`
        );
    }
}

estimateCost('a'.repeat(240));
