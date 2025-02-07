from flask import Flask, jsonify, request
import json
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS

@app.route('/tokens', methods=['GET'])
def get_tokens():
    # Load and return all token data from the enhanced JSON file
    with open('bird_token_monitor/src/api/top100tokens_enhanced.json', 'r') as file:
        tokens = json.load(file)
    return jsonify(tokens)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True) 