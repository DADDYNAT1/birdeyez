document.addEventListener('DOMContentLoaded', () => {
    const tokenList = document.getElementById('token-list');

    fetch('tokens.json')
        .then(response => response.json())
        .then(tokens => {
            tokens.forEach((token, index) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div>
                        <span>${index + 1}. <strong>${token.name} (${token.symbol})</strong></span>
                        <span>${token.address}</span>
                    </div>
                    <div>
                        <span>$${token.price.toFixed(2)}</span>
                        <span>24h Volume: $${token.v24hUSD.toFixed(2)}</span>
                        <span>Market Cap: $${token.mc.toFixed(2)}</span>
                    </div>
                `;
                tokenList.appendChild(li);
            });
        })
        .catch(error => console.error('Error fetching tokens:', error));
}); 