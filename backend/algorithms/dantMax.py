from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)

GRAPH_FILE = 'graph_data.json'

# ===== ALGO DANTZIG MAXIMALE =====
def init_dantzig_max(graph, start):
    lambda_values = {node: float('-inf') for node in graph['sommet']}
    predecessors = {node: None for node in graph['sommet']}
    lambda_values[start] = 0
    E = [start]
    Ek_steps = {'E1': E.copy()}
    step = 1

    while len(E) < len(graph['sommet']):
        candidates = []

        for xi in E:
            max_arc = None
            max_cost = float('-inf')
            for (u, v, cost) in graph['arc']:
                if u == xi and v not in E and cost > max_cost:
                    max_arc = (u, v, cost)
                    max_cost = cost

            if max_arc:
                u, v, cost = max_arc
                total = lambda_values[u] + cost
                candidates.append((total, u, v, cost))

        if not candidates:
            break

        # Choisir le chemin avec le plus grand coût total
        candidates.sort(reverse=True)
        _, best_u, best_v, best_cost = candidates[0]

        lambda_values[best_v] = lambda_values[best_u] + best_cost
        predecessors[best_v] = best_u
        E.append(best_v)
        step += 1
        Ek_steps[f'E{step}'] = E.copy()

    return lambda_values, predecessors, Ek_steps

def get_longest_path(predecessors, end):
    path = []
    while end:
        path.insert(0, end)
        end = predecessors[end]
    return path

# ===== LECTURE FICHIER JSON =====
def read_graph_from_file():
    if not os.path.exists(GRAPH_FILE):
        return None

    with open(GRAPH_FILE) as f:
        data = json.load(f)

    nodes = [n['id'] for n in data.get('nodes', [])]
    arcs = []

    for e in data.get('edges', []):
        src = e['source']
        tgt = e['target']
        try:
            weight = int(e.get('label', '1'))
        except:
            weight = 1
        arcs.append((src, tgt, weight))

    return {
        'sommet': nodes,
        'arc': arcs
    }

# ===== ROUTES FLASK =====
@app.route('/dantzig-max/<start>', methods=['GET'])
def dantzig_lambda_max(start):
    graph = read_graph_from_file()
    if not graph:
        return jsonify({"error": "Fichier graphe manquant ou invalide"}), 500

    if start not in graph['sommet']:
        return jsonify({"error": f"Sommet '{start}' non trouvé"}), 404

    lambda_values, _, Ek_steps = init_dantzig_max(graph, start)

    sorted_lambda = {
        k: ("-∞" if v == float('-inf') else v)
        for k, v in sorted(lambda_values.items(), key=lambda x: x[0])
    }
    sorted_Ek = {
        k: sorted(v) for k, v in Ek_steps.items()
    }

    return jsonify({
        "lambda": sorted_lambda,
        "E": sorted_Ek
    })

@app.route('/longest-path/<start>/<end>', methods=['GET'])
def dantzig_chemin_max(start, end):
    graph = read_graph_from_file()
    if not graph:
        return jsonify({"error": "Fichier graphe manquant ou invalide"}), 500

    if start not in graph['sommet'] or end not in graph['sommet']:
        return jsonify({"error": "Sommet invalide"}), 404

    lambda_values, predecessors, _ = init_dantzig_max(graph, start)

    if lambda_values[end] == float('-inf'):
        return jsonify({"message": f"Aucun chemin trouvé de {start} à {end}"}), 404

    chemin = get_longest_path(predecessors, end)

    return jsonify({
        "start": start,
        "end": end,
        "chemin": chemin,
        "longueur": lambda_values[end]
    })

if __name__ == '__main__':
    app.run(debug=True)
