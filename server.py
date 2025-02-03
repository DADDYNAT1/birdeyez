from flask import Flask, jsonify
import json

app = Flask(__name__)

@app.route('/tokens', methods=['GET'])
def get_tokens():
    # Load token data from a file or directly from birdeye_client.py
    with open('tokens.json', 'r') as file:
        tokens = json.load(file)
    return jsonify(tokens)

if __name__ == '__main__':
    app.run(debug=True) 