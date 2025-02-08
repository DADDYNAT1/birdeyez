document.getElementById('btn-5m').addEventListener('click', () => fetchTokens('m5'));
document.getElementById('btn-1h').addEventListener('click', () => fetchTokens('h1'));
document.getElementById('btn-6h').addEventListener('click', () => fetchTokens('h6'));
document.getElementById('btn-24h').addEventListener('click', () => fetchTokens('h24'));

async function fetchTokens(timeInterval) {
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

    // Fetch holder counts and blockchain data for all tokens in parallel
    const tokensWithAdditionalData = await fetchAllAdditionalData(sortedTokens);

    // Render the sorted tokens
    tokensWithAdditionalData.forEach((token, index) => {
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

        // Log the blockchain data for debugging
        console.log(`Token: ${token.name} (${token.symbol})`);
        console.log(`Bundled Supply: ${token.bundledSupply}%`);
        console.log(`Top 20 Holders: ${token.topHolders}%`);
        console.log(`Dev Holdings: ${token.devHoldings}%`);

        // Create the token element HTML
        tokenElement.innerHTML = `
            <div class="token-header">
                <img src="${img.src}" alt="${token.name} logo" class="token-logo">
                <div class="token-links">
                    ${twitterLink ? `<a href="${twitterLink}" target="_blank" title="Twitter">X</a>` : ''}
                    ${telegramLink ? `<a href="${telegramLink}" target="_blank" title="Telegram">TG</a>` : ''}
                    ${websiteLink ? `<a href="${websiteLink}" target="_blank" title="Website">Website</a>` : ''}
                </div>
            </div>
            <div class="token-info">
                <strong>${index + 1}. ${token.name} (${token.symbol})</strong><br>
                Address: ${token.address}<br>
                MC: $${token.marketCap.toLocaleString()}<br>
                ${token.holderCount !== null ? `Holders: ${token.holderCount.toLocaleString()}<br>` : ''}
                ${token.bundledSupply !== null ? `Bundled Supply: ${token.bundledSupply.toFixed(2)}%<br>` : ''}
                ${token.topHolders !== null ? `Top 20 Holders: ${token.topHolders.toFixed(2)}%<br>` : ''}
                ${token.devHoldings !== null ? `Dev Holdings: ${token.devHoldings.toFixed(2)}%<br>` : ''}
            </div>
            <div class="token-price">
                <div class="volume">Volume: $${volume}</div>
                <div class="price-change ${priceChange >= 0 ? 'positive' : ''}">Price Change: ${priceChange}%</div>
            </div>
        `;

        // Append the token element to the list
        tokenList.appendChild(tokenElement);
    });
}

// Function to fetch holder counts and blockchain data for all tokens in parallel
async function fetchAllAdditionalData(tokens) {
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            'x-chain': 'solana',
            'X-API-KEY': '33bf8fbb826945009f23366649945abc' // Replace with your BirdEye API key
        }
    };

    // Create an array of promises to fetch holder counts and blockchain data
    const additionalDataPromises = tokens.map(async (token) => {
        try {
            // Fetch holder count from BirdEye API
            const holderResponse = await fetch(`https://public-api.birdeye.so/defi/token_overview?address=${token.address}`, options);
            const holderData = await holderResponse.json();
            if (holderData.success && holderData.data) {
                token.holderCount = holderData.data.holder; // Add holder count to the token object
            } else {
                token.holderCount = null; // Set holder count to null if no data is found
            }

            // Fetch blockchain data (bundled supply, top holders, dev holdings)
            const blockchainData = await fetchBlockchainData(token.address);
            token.bundledSupply = blockchainData.bundledSupply;
            token.topHolders = blockchainData.topHolders;
            token.devHoldings = blockchainData.devHoldings;
        } catch (error) {
            console.error(`Failed to fetch additional data for token ${token.address}:`, error);
            token.holderCount = null; // Set holder count to null if the request fails
            token.bundledSupply = null; // Set bundled supply to null if the request fails
            token.topHolders = null; // Set top holders to null if the request fails
            token.devHoldings = null; // Set dev holdings to null if the request fails
        }
        return token;
    });

    // Wait for all promises to resolve
    return await Promise.all(additionalDataPromises);
}

// Function to fetch blockchain data (bundled supply, top holders, dev holdings)
async function fetchBlockchainData(tokenAddress) {
    const rpcEndpoint = 'https://solana-mainnet.core.chainstack.com/55a33aac970c1baabb5b84fecd188af7'; // Your Chainstack RPC endpoint
    const apiKey = '8Y4p613v.YaNhzpL9eJtdQK6LjzQkfpeYfvJEzhTL'; // Replace with your Chainstack API key

    try {
        console.log(`Fetching blockchain data for token: ${tokenAddress}`);

        // Fetch bundled supply
        const bundledSupply = await fetchBundledSupply(tokenAddress, rpcEndpoint, apiKey);
        console.log(`Bundled Supply: ${bundledSupply}%`);

        // Fetch top holders
        const topHolders = await fetchTopHolders(tokenAddress, rpcEndpoint, apiKey);
        console.log(`Top 20 Holders: ${topHolders}%`);

        // Fetch dev holdings
        const devHoldings = await fetchDevHoldings(tokenAddress, rpcEndpoint, apiKey);
        console.log(`Dev Holdings: ${devHoldings}%`);

        return {
            bundledSupply,
            topHolders,
            devHoldings
        };
    } catch (error) {
        console.error(`Failed to fetch blockchain data for token ${tokenAddress}:`, error);
        return {
            bundledSupply: null,
            topHolders: null,
            devHoldings: null
        };
    }
}

// Function to fetch bundled supply
async function fetchBundledSupply(tokenAddress, rpcEndpoint, apiKey) {
    try {
        console.log(`Fetching creation transaction for token: ${tokenAddress}`);
        const creationTx = await fetchCreationTransaction(tokenAddress, rpcEndpoint, apiKey);
        console.log(`Creation Transaction:`, creationTx);

        console.log(`Analyzing initial buys for token: ${tokenAddress}`);
        const bundledWallets = await analyzeInitialBuys(creationTx, rpcEndpoint, apiKey);
        console.log(`Bundled Wallets:`, bundledWallets);

        console.log(`Fetching total supply for token: ${tokenAddress}`);
        const totalSupply = await fetchTotalSupply(tokenAddress, rpcEndpoint, apiKey);
        console.log(`Total Supply: ${totalSupply}`);

        let bundledSupply = 0;
        for (const wallet of bundledWallets) {
            console.log(`Fetching balance for wallet: ${wallet}`);
            const balance = await fetchWalletBalance(tokenAddress, wallet, rpcEndpoint, apiKey);
            console.log(`Balance: ${balance}`);
            bundledSupply += balance;
        }

        const bundledSupplyPercentage = (bundledSupply / totalSupply) * 100;
        console.log(`Bundled Supply Percentage: ${bundledSupplyPercentage}%`);
        return bundledSupplyPercentage;
    } catch (error) {
        console.error(`Failed to fetch bundled supply for token ${tokenAddress}:`, error);
        return null;
    }
}

// Function to fetch top holders
async function fetchTopHolders(tokenAddress, rpcEndpoint, apiKey) {
    try {
        console.log(`Fetching top holders for token: ${tokenAddress}`);
        const response = await fetch(rpcEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'getTokenLargestAccounts',
                params: [tokenAddress]
            })
        });

        const data = await response.json();
        console.log(`Top Holders Data:`, data);

        const topHolders = data.result.value.slice(0, 20); // Get the top 20 holders
        console.log(`Top 20 Holders:`, topHolders);

        const totalSupply = await fetchTotalSupply(tokenAddress, rpcEndpoint, apiKey);
        console.log(`Total Supply: ${totalSupply}`);

        let topHoldersSupply = 0;
        for (const holder of topHolders) {
            topHoldersSupply += holder.amount;
        }

        const topHoldersPercentage = (topHoldersSupply / totalSupply) * 100;
        console.log(`Top 20 Holders Percentage: ${topHoldersPercentage}%`);
        return topHoldersPercentage;
    } catch (error) {
        console.error(`Failed to fetch top holders for token ${tokenAddress}:`, error);
        return null;
    }
}

// Function to fetch dev holdings
async function fetchDevHoldings(tokenAddress, rpcEndpoint, apiKey) {
    try {
        console.log(`Fetching dev holdings for token: ${tokenAddress}`);
        const creationTx = await fetchCreationTransaction(tokenAddress, rpcEndpoint, apiKey);
        console.log(`Creation Transaction:`, creationTx);

        const devWallet = creationTx.transaction.message.accountKeys[0]; // Assumes the first account is the creator
        console.log(`Dev Wallet: ${devWallet}`);

        const devBalance = await fetchWalletBalance(tokenAddress, devWallet, rpcEndpoint, apiKey);
        console.log(`Dev Balance: ${devBalance}`);

        const totalSupply = await fetchTotalSupply(tokenAddress, rpcEndpoint, apiKey);
        console.log(`Total Supply: ${totalSupply}`);

        const devHoldingsPercentage = (devBalance / totalSupply) * 100;
        console.log(`Dev Holdings Percentage: ${devHoldingsPercentage}%`);
        return devHoldingsPercentage;
    } catch (error) {
        console.error(`Failed to fetch dev holdings for token ${tokenAddress}:`, error);
        return null;
    }
}

// Helper function to fetch the token's creation transaction
async function fetchCreationTransaction(tokenAddress, rpcEndpoint, apiKey) {
    const response = await fetch(rpcEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getConfirmedSignaturesForAddress2',
            params: [tokenAddress, { limit: 1 }] // Fetch the first transaction
        })
    });

    const data = await response.json();
    return data.result[0];
}

// Helper function to analyze initial buys in the same slot
async function analyzeInitialBuys(creationTx, rpcEndpoint, apiKey) {
    const slot = creationTx.slot;
    const response = await fetch(rpcEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getConfirmedSignaturesForAddress2',
            params: [creationTx.account, { limit: 10, before: creationTx.signature }] // Fetch transactions before the creation tx
        })
    });

    const data = await response.json();
    const bundledWallets = [];

    for (const tx of data.result) {
        if (tx.slot === slot) {
            bundledWallets.push(tx.accountKeys[0]); // Add the wallet address
        }
    }

    return bundledWallets;
}

// Helper function to fetch the total supply of a token
async function fetchTotalSupply(tokenAddress, rpcEndpoint, apiKey) {
    const response = await fetch(rpcEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getTokenSupply',
            params: [tokenAddress]
        })
    });

    const data = await response.json();
    return data.result.value.amount;
}

// Helper function to fetch a wallet's balance for a specific token
async function fetchWalletBalance(tokenAddress, walletAddress, rpcEndpoint, apiKey) {
    const response = await fetch(rpcEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getTokenAccountBalance',
            params: [walletAddress]
        })
    });

    const data = await response.json();
    return data.result.value.amount;
}

// Fetch tokens on page load (default to 24h interval)
fetchTokens('h24');