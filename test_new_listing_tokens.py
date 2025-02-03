import aiohttp
import asyncio
import time

async def fetch_new_listing_tokens():
    url = "https://public-api.birdeye.so/defi/v2/tokens/new_listing"
    headers = {
        "accept": "application/json",
        "x-chain": "solana",
        "X-API-KEY": "6875bc064e0d42c3930c90fc128175ad"
    }

    tokens = []
    current_time = int(time.time())
    time_from = current_time - 86400  # 24 hours ago

    while True:
        params = {
            "time_from": time_from,
            "time_to": current_time,
            "limit": 20,
            "meme_platform_enabled": "false"
        }

        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params, headers=headers) as response:
                print(f"Status Code: {response.status}")  # Debugging

                if response.status == 200:
                    data = await response.json()
                    print("Raw API Response:", data)  # Debugging

                    new_tokens = data.get('data', {}).get('items', [])
                    if not new_tokens:
                        print("No new tokens found.")
                        break

                    tokens.extend(new_tokens)

                    # Update current_time to the oldest token's liquidityAddedAt
                    oldest_token_time = min(
                        int(time.mktime(time.strptime(token['liquidityAddedAt'], '%Y-%m-%dT%H:%M:%S')))
                        for token in new_tokens
                    )

                    if oldest_token_time <= time_from:
                        break

                    current_time = oldest_token_time
                else:
                    print(f"Failed to fetch tokens. Status code: {response.status}")
                    break

    for token in tokens:
        print(f"Token: {token.get('symbol', 'N/A')}, "
              f"Address: {token.get('address', 'N/A')}, "
              f"Liquidity Added At: {token.get('liquidityAddedAt', 'N/A')}")

if __name__ == "__main__":
    asyncio.run(fetch_new_listing_tokens()) 