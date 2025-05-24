from flask import Flask, jsonify
from flask_cors import CORS


app = Flask(__name__)
CORS(app)  # Ajoute cette ligne juste après avoir créé app

# Graphe orienté pondéré
graph = {
    'sommet': ['x1', 'x2', 'x3', 'x4', 'x5', 'x6', 'x7', 'x8', 'x9', 'x10', 'x11', 'x12', 'x13', 'x14', 'x15', 'x16'],
    'arc': [
        ('x1', 'x2', 10),
        ('x2', 'x3', 15),
        ('x2', 'x4', 8),
        ('x3', 'x6', 1),
        ('x4', 'x5', 6),
        ('x4', 'x6', 5),
        ('x5', 'x9', 1),
        ('x6', 'x7', 4),
        ('x7', 'x8', 1),
        ('x8', 'x9', 3),
        ('x8', 'x12', 7),
        ('x9', 'x10', 6),
        ('x10', 'x12', 7),
        ('x7', 'x11', 8),
        ('x11', 'x13', 2),
        ('x12', 'x15', 9),
        ('x13', 'x14', 4),
        ('x14', 'x15', 5),
        ('x15', 'x16', 6)
    ]
}

# Dantzig séquentiel (minimisation conforme au PDF)
def init_dantzig(graph, start):
    lambda_values = {node: float('inf') for node in graph['sommet']}
    predecessors = {node: None for node in graph['sommet']}
    lambda_values[start] = 0

    E = [start]
    Ek_steps = {'E1': E.copy()}
    step = 1

    while len(E) < len(graph['sommet']):
        candidates = []

        # Étape 1 : pour chaque sommet marqué xi ∈ E, chercher le xi* ∉ E avec v(xi, xi*) minimal
        for xi in E:
            min_arc = None
            min_cost = float('inf')
            for (u, v, cost) in graph['arc']:
                if u == xi and v not in E:
                    if cost < min_cost:
                        min_cost = cost
                        min_arc = (u, v, cost)

            if min_arc:
                u, v, cost = min_arc
                total = lambda_values[u] + cost
                candidates.append((total, u, v, cost))

        if not candidates:
            break  # Plus de sommets accessibles

        # Étape 2 : sélectionner (u, v) tel que λ(u) + v(u,v) est minimal
        candidates.sort()
        _, best_u, best_v, best_cost = candidates[0]

        lambda_values[best_v] = lambda_values[best_u] + best_cost
        predecessors[best_v] = best_u
        E.append(best_v)

        step += 1
        Ek_steps[f'E{step}'] = E.copy()

        print(f"Étape {step - 1} : v({best_u}, {best_v}) → λ({best_v}) = λ({best_u}) + {best_cost} = {lambda_values[best_v]}")
        print(f"E{step} = {{ {', '.join(E)} }}")

    return lambda_values, predecessors, Ek_steps

# Reconstruction du plus court chemin
def get_shortest_path(predecessors, end):
    path = []
    while end:
        path.insert(0, end)
        end = predecessors[end]
    return path

# Route pour les voisins d’un sommet
@app.route('/neighbors/<node>')
def neighbors(node):
    voisins = [dest for (src, dest, _) in graph['arc'] if src == node]
    return jsonify({node: voisins})

# Route pour afficher les lambdas et les ensembles Ek
@app.route('/lambda/<start>')
def lambda_route(start):
    if start not in graph['sommet']:
        return jsonify({"error": f"Sommet '{start}' non trouvé"}), 404

    lambda_values, _, Ek_steps = init_dantzig(graph, start)

    # Trier λ(xi) par ordre (x1, x2, ..., x16)
    sorted_lambda = {k: ("∞" if v == float('inf') else v) for k, v in sorted(lambda_values.items(), key=lambda x: int(x[0][1:]))}

    # Trier les Ek et leurs contenus
    sorted_Ek = {k: sorted(v, key=lambda x: int(x[1:])) for k, v in sorted(Ek_steps.items(), key=lambda x: int(x[0][1:]))}

    return jsonify({
        "lambda": sorted_lambda,
        "E": sorted_Ek
    })

# Route pour le plus court chemin entre deux sommets
@app.route('/shortest-path/<start>/<end>')
def shortest_path(start, end):
    if start not in graph['sommet'] or end not in graph['sommet']:
        return jsonify({"error": "Sommet invalide"}), 404

    lambda_values, predecessors, _ = init_dantzig(graph, start)

    if lambda_values[end] == float('inf'):
        return jsonify({
            "message": f"Aucun chemin trouvé de {start} à {end}"
        }), 404

    path = get_shortest_path(predecessors, end)

    return jsonify({
        "start": start,
        "end": end,
        "chemin": path,
        "longueur": lambda_values[end]
    })

if __name__ == '__main__':
    app.run(debug=True)
