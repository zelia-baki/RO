from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)

GRAPH_FILE = 'graph_data.json'

# ===== ALGO DANTZIG =====
def init_dantzig(graph, start):
    lambda_values = {node: float('inf') for node in graph['sommet']}
    predecessors = {node: None for node in graph['sommet']}
    lambda_values[start] = 0
    E = [start]
    Ek_steps = {'E1': E.copy()}
    step = 1

    while len(E) < len(graph['sommet']):
        candidates = []

        for xi in E:
            min_arc = None
            min_cost = float('inf')
            for (u, v, cost) in graph['arc']:
                if u == xi and v not in E and cost < min_cost:
                    min_arc = (u, v, cost)
                    min_cost = cost

            if min_arc:
                u, v, cost = min_arc
                total = lambda_values[u] + cost
                candidates.append((total, u, v, cost))

        if not candidates:
            break

        candidates.sort()
        _, best_u, best_v, best_cost = candidates[0]

        lambda_values[best_v] = lambda_values[best_u] + best_cost
        predecessors[best_v] = best_u
        E.append(best_v)
        step += 1
        Ek_steps[f'E{step}'] = E.copy()

    return lambda_values, predecessors, Ek_steps

def get_shortest_path(predecessors, end):
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
@app.route('/save-graph', methods=['POST'])
def save_graph():
    data = request.get_json()

    # Charger le graphe existant
    if os.path.exists(GRAPH_FILE):
        with open(GRAPH_FILE, 'r') as f:
            try:
                existing_data = json.load(f)
            except json.JSONDecodeError:
                existing_data = {"nodes": [], "edges": []}
    else:
        existing_data = {"nodes": [], "edges": []}

    # Ajouter uniquement les nouveaux sommets qui n’existent pas déjà
    for node in data.get("nodes", []):
        if not any(n["id"] == node["id"] for n in existing_data["nodes"]):
            existing_data["nodes"].append(node)

    # Ajouter uniquement les nouveaux arcs qui n’existent pas déjà
    for edge in data.get("edges", []):
        if not any(e["source"] == edge["source"] and e["target"] == edge["target"] for e in existing_data["edges"]):
            existing_data["edges"].append(edge)

    # Sauvegarder
    with open(GRAPH_FILE, 'w') as f:
        json.dump(existing_data, f, indent=2)

    return jsonify({"message": "Graphe mis à jour avec succès."})

@app.route('/load-graph', methods=['GET'])
def load_graph():
    if not os.path.exists(GRAPH_FILE):
        return jsonify({"error": "Aucun fichier graphe trouvé."}), 404
    with open(GRAPH_FILE) as f:
        data = json.load(f)
    return jsonify(data)

@app.route('/dantzig/<start>', methods=['GET'])
def dantzig_lambda(start):
    graph = read_graph_from_file()
    if not graph:
        return jsonify({"error": "Fichier graphe manquant ou invalide"}), 500

    if start not in graph['sommet']:
        return jsonify({"error": f"Sommet '{start}' non trouvé"}), 404

    lambda_values, _, Ek_steps = init_dantzig(graph, start)

    sorted_lambda = {
        k: ("∞" if v == float('inf') else v)
        for k, v in sorted(lambda_values.items(), key=lambda x: x[0])
    }
    sorted_Ek = {
        k: sorted(v) for k, v in Ek_steps.items()
    }

    return jsonify({
        "lambda": sorted_lambda,
        "E": sorted_Ek
    })

@app.route('/shortest-path/<start>/<end>', methods=['GET'])
def dantzig_chemin(start, end):
    graph = read_graph_from_file()
    if not graph:
        return jsonify({"error": "Fichier graphe manquant ou invalide"}), 500

    if start not in graph['sommet'] or end not in graph['sommet']:
        return jsonify({"error": "Sommet invalide"}), 404

    lambda_values, predecessors, _ = init_dantzig(graph, start)

    if lambda_values[end] == float('inf'):
        return jsonify({"message": f"Aucun chemin trouvé de {start} à {end}"}), 404

    chemin = get_shortest_path(predecessors, end)

    return jsonify({
        "start": start,
        "end": end,
        "chemin": chemin,
        "longueur": lambda_values[end]
    })

if __name__ == '__main__':
    app.run(debug=True)
