document.getElementById('btn-5m').addEventListener('click', () => fetchTokens('m5'));
document.getElementById('btn-1h').addEventListener('click', () => fetchTokens('h1'));
document.getElementById('btn-6h').addEventListener('click', () => fetchTokens('h6'));
document.getElementById('btn-24h').addEventListener('click', () => fetchTokens('h24'));

async function fetchTokens(timeInterval) {
    try {
        const response = await fetch(`http://localhost:5001/tokens?interval=${timeInterval}`);
        const tokens = await response.json();
        const tokenList = document.getElementById('token-list');
        tokenList.innerHTML = ''; // Clear existing tokens

        // Sort tokens by volume for the selected time interval (descending order)
        const sortedTokens = tokens.sort((a, b) => {
            const volumeA = a.volume && a.volume[timeInterval] !== undefined ? a.volume[timeInterval] : 0;
            const volumeB = b.volume && b.volume[timeInterval] !== undefined ? b.volume[timeInterval] : 0;
            return volumeB - volumeA; // Sort from highest to lowest volume
        });

        // Render the sorted tokens
        sortedTokens.forEach((token, index) => {
            const tokenElement = document.createElement('div');
            tokenElement.className = 'token';

            // Use the logoURI from the token data
            const logoUrl = token.logoURI || 'placeholder.png'; // Fallback to placeholder if logoURI is missing
            const img = new Image();
            img.src = logoUrl;
            img.onerror = () => img.src = 'placeholder.png'; // Use a placeholder image if logo fails to load

            // Extract volume and price change for the given time interval
            const volume = token.volume && token.volume[timeInterval] !== undefined ? token.volume[timeInterval].toLocaleString() : 'Data not available';
            const priceChange = token.priceChange && token.priceChange[timeInterval] !== undefined ? token.priceChange[timeInterval] : 'Data not available';

            // Extract social links (Twitter, Telegram) and website
            const socials = token.info?.socials || [];
            const websites = token.info?.websites || [];

            const twitterLink = socials.find(social => social.type === 'twitter')?.url || '';
            const telegramLink = socials.find(social => social.type === 'telegram')?.url || '';
            const websiteLink = websites.find(website => website.label === 'Website')?.url || '';

            // Create the token element HTML
            tokenElement.innerHTML = `
                <div class="token-header">
                    <img src="${img.src}" alt="${token.name} logo" class="token-logo">
                    <div class="token-links">
                        ${twitterLink ? `<a href="${twitterLink}" target="_blank" title="Twitter">X</a>` : ''}
                        ${telegramLink ? `<a href="${telegramLink}" target="_blank" title="Telegram">TG</a>` : ''}
                        ${websiteLink ? `<a href="${websiteLink}" target="_blank" title="Website">🌐</a>` : ''}
                    </div>
                </div>
                <div class="token-info">
                    <strong>${index + 1}. ${token.name} (${token.symbol})</strong><br>
                    Address: ${token.address}<br>
                    MC: $${token.marketCap.toLocaleString()}
                </div>
                <div class="token-price">
                    Volume: $${volume}<br>
                    Price Change: ${priceChange}%
                </div>
            `;

            // Append the token element to the list
            tokenList.appendChild(tokenElement);
        });
    } catch (error) {
        console.error('Error fetching tokens:', error);
    }
}

// Fetch tokens on page load (default to 24h interval)
fetchTokens('h24');

// Refresh tokens every 30 seconds
setInterval(() => fetchTokens('h24'), 30000); // 30000 milliseconds = 30 seconds