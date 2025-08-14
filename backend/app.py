from flask import Flask, request, jsonify
from flask_cors import CORS
import sys, os

# Ajouter chemins vers les modules
sys.path.append(os.path.join(os.path.dirname(__file__), 'utils'))
sys.path.append(os.path.join(os.path.dirname(__file__), 'algorithms'))

from graph_manager import save_graph_data, load_graph_data, convert_to_dantzig_format
from dantMin import init_dantzig_min, get_shortest_path, format_lambda_results as format_lambda_min
from dantMax import init_dantzig_max, get_longest_path, format_lambda_results as format_lambda_max

app = Flask(__name__)
CORS(app)


@app.route('/save-graph', methods=['POST'])
def save_graph():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Aucune donnée reçue"}), 400
    if save_graph_data(data):
        return jsonify({"message": "Graphe sauvegardé"})
    return jsonify({"error": "Erreur sauvegarde"}), 500


@app.route('/load-graph', methods=['GET'])
def load_graph():
    data = load_graph_data()
    if data:
        return jsonify(data)
    return jsonify({"error": "Aucun graphe trouvé"}), 404


@app.route('/dantzig-min/<start>', methods=['GET'])
def dantzig_min_route(start):
    graph = convert_to_dantzig_format(load_graph_data())
    if not graph or start not in graph['sommet']:
        return jsonify({"error": "Sommet invalide"}), 400
    lambda_values, _, Ek_steps = init_dantzig_min(graph, start)
    return jsonify({
        "lambda": format_lambda_min(lambda_values),
        "E": {k: sorted(v) for k, v in Ek_steps.items()}
    })


@app.route('/dantzig-max/<start>', methods=['GET'])
def dantzig_max_route(start):
    graph = convert_to_dantzig_format(load_graph_data())
    if not graph or start not in graph['sommet']:
        return jsonify({"error": "Sommet invalide"}), 400
    lambda_values, _, Ek_steps = init_dantzig_max(graph, start)
    return jsonify({
        "lambda": format_lambda_max(lambda_values, max_mode=True),
        "E": {k: sorted(v) for k, v in Ek_steps.items()}
    })


@app.route('/shortest-path/<start>/<end>', methods=['GET'])
def shortest_path(start, end):
    graph = convert_to_dantzig_format(load_graph_data())
    if not graph or start not in graph['sommet'] or end not in graph['sommet']:
        return jsonify({"error": "Sommet invalide"}), 400
    lambda_values, predecessors, _ = init_dantzig_min(graph, start)
    return jsonify({
        "chemin": get_shortest_path(predecessors, end),
        "longueur": lambda_values[end]
    })


@app.route('/longest-path/<start>/<end>', methods=['GET'])
def longest_path(start, end):
    graph = convert_to_dantzig_format(load_graph_data())
    if not graph or start not in graph['sommet'] or end not in graph['sommet']:
        return jsonify({"error": "Sommet invalide"}), 400
    lambda_values, predecessors, _ = init_dantzig_max(graph, start)
    return jsonify({
        "chemin": get_longest_path(predecessors, end),
        "longueur": lambda_values[end]
    })


if __name__ == '__main__':
    print("🚀 Serveur Dantzig démarré")
    app.run(debug=True, host="127.0.0.1", port=5000)
