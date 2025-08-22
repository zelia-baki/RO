from flask import Flask, request, jsonify
from flask_cors import CORS
import sys, os

# Ajouter chemins vers les modules
sys.path.append(os.path.join(os.path.dirname(__file__), 'utils'))
sys.path.append(os.path.join(os.path.dirname(__file__), 'algorithms'))

from graph_manager import save_graph_data, load_graph_data, convert_to_dantzig_format
from dantMin import init_dantzig_min, init_dantzig_min_detailed, get_shortest_path, format_lambda_results as format_lambda_min
from dantMax import init_dantzig_max, init_dantzig_max_detailed, get_longest_path, format_lambda_results as format_lambda_max

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


@app.route('/dantzig-min-detailed/<start>', methods=['GET'])
def dantzig_min_detailed_route(start):
    """Route pour obtenir les calculs étape par étape de l'algorithme de Dantzig minimal"""
    try:
        graph = convert_to_dantzig_format(load_graph_data())
        if not graph or start not in graph['sommet']:
            return jsonify({"error": "Sommet invalide"}), 400
        
        lambda_values, predecessors, detailed_steps = init_dantzig_min_detailed(graph, start)
        
        # Calculer les chemins vers tous les sommets accessibles
        paths = {}
        for node in graph['sommet']:
            if lambda_values[node] != float('inf'):
                paths[node] = get_shortest_path(predecessors, node)
        
        # Trouver le chemin minimal principal (vers le dernier sommet accessible)
        accessible_nodes = [node for node in graph['sommet'] if lambda_values[node] != float('inf')]
        if len(accessible_nodes) > 1:
            # Prendre le dernier nœud accessible (excluant le nœud de départ)
            end_node = accessible_nodes[-1] if accessible_nodes[-1] != start else accessible_nodes[-2]
            main_path = get_shortest_path(predecessors, end_node)
            main_path_length = lambda_values[end_node] if lambda_values[end_node] != float('inf') else "∞"
        else:
            main_path = [start]
            main_path_length = 0
        
        return jsonify({
            "start_node": start,
            "final_lambda": format_lambda_min(lambda_values),
            "detailed_steps": detailed_steps,
            "total_steps": len(detailed_steps),
            "paths": paths,
            "main_path": main_path,
            "main_path_length": main_path_length,
            "predecessors": predecessors,
            "graph_info": {
                "nodes": graph['sommet'],
                "edges": graph['arc']
            }
        })
        
    except Exception as e:
        return jsonify({"error": f"Erreur calcul détaillé: {str(e)}"}), 500


@app.route('/dantzig-max-detailed/<start>', methods=['GET'])
def dantzig_max_detailed_route(start):
    """Route pour obtenir les calculs étape par étape de l'algorithme de Dantzig maximal"""
    try:
        graph = convert_to_dantzig_format(load_graph_data())
        if not graph or start not in graph['sommet']:
            return jsonify({"error": "Sommet invalide"}), 400
        
        lambda_values, predecessors, detailed_steps = init_dantzig_max_detailed(graph, start)
        
        # Calculer les chemins vers tous les sommets accessibles
        paths = {}
        for node in graph['sommet']:
            if lambda_values[node] != float('-inf'):
                paths[node] = get_longest_path(predecessors, node)
        
        # Trouver le chemin maximal principal (vers le nœud avec la plus grande valeur lambda)
        accessible_nodes = [node for node in graph['sommet'] if lambda_values[node] != float('-inf') and node != start]
        if accessible_nodes:
            # Prendre le nœud avec la plus grande valeur lambda (excluant explicitement le nœud de départ)
            best_node = max(accessible_nodes, key=lambda n: lambda_values[n])
            main_path = get_longest_path(predecessors, best_node)
            main_path_length = lambda_values[best_node] if lambda_values[best_node] != float('-inf') else "-∞"
        else:
            main_path = [start]
            main_path_length = 0
        
        # Convertir les étapes détaillées au format attendu par le frontend
        formatted_steps = []
        for step in detailed_steps:
            formatted_step = {
                "step": step['step'],
                "title": step['step_name'],
                "description": step['description'],
                "lambda": step['lambda_values'],
                "candidates": [],
                "selected_arcs": [],
                "calculations": []
            }
            
            # Ajouter les candidats s'ils existent
            if 'candidates' in step and step['candidates']:
                formatted_step['candidates'] = [f"({c['from_node']}, {c['to_node']})" for c in step['candidates']]
            
            # Ajouter les arcs sélectionnés s'ils existent
            if 'highlight_edges' in step and step['highlight_edges']:
                formatted_step['selected_arcs'] = [f"({u}, {v})" for u, v in step['highlight_edges']]
            
            # Ajouter les calculs s'ils existent
            if 'calculations' in step and step['calculations']:
                formatted_step['calculations'] = [calc['lambda_calculation'] for calc in step['calculations']]
            
            formatted_steps.append(formatted_step)
        
        return jsonify({
            "start_node": start,
            "final_lambda": format_lambda_max(lambda_values, max_mode=True),
            "steps": formatted_steps,
            "total_steps": len(formatted_steps),
            "paths": paths,
            "main_path": main_path,
            "main_path_length": main_path_length,
            "predecessors": predecessors,
            "graph_info": {
                "nodes": graph['sommet'],
                "edges": graph['arc']
            }
        })
        
    except Exception as e:
        return jsonify({"error": f"Erreur calcul détaillé maximal: {str(e)}"}), 500


if __name__ == '__main__':
    print("🚀 Serveur Dantzig démarré")
    app.run(debug=True, host="127.0.0.1", port=5000)
