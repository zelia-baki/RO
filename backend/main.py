"""
Serveur Flask principal pour l'application Dantzig
"""

import sys
import os
from flask import Flask, request, jsonify
from flask_cors import CORS

# Ajouter les chemins des modules
sys.path.append(os.path.join(os.path.dirname(__file__), 'utils'))
sys.path.append(os.path.join(os.path.dirname(__file__), 'algorithms'))

from graph_manager import save_graph_data, load_graph_data, convert_to_dantzig_format
from dantzig import init_dantzig, get_shortest_path, format_lambda_results

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health_check():
    """Endpoint de vérification de santé"""
    return jsonify({"status": "healthy", "message": "Server is running"})

@app.route('/save-graph', methods=['POST'])
def save_graph():
    """
    Sauvegarde le graphe complet (seulement lors d'une action explicite)
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Aucune donnée reçue"}), 400
        
        success = save_graph_data(data)
        if success:
            return jsonify({"message": "Graphe sauvegardé avec succès"})
        else:
            return jsonify({"error": "Erreur lors de la sauvegarde"}), 500
    except Exception as e:
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500

@app.route('/load-graph', methods=['GET'])
def load_graph():
    """
    Charge les données du graphe
    """
    try:
        data = load_graph_data()
        if data:
            return jsonify(data)
        else:
            return jsonify({"error": "Aucun graphe trouvé"}), 404
    except Exception as e:
        return jsonify({"error": f"Erreur lors du chargement: {str(e)}"}), 500

@app.route('/dantzig/<start>', methods=['GET'])
def dantzig_lambda(start):
    """
    Calcule les valeurs lambda avec l'algorithme de Dantzig
    """
    try:
        # Charger les données depuis le fichier
        vis_data = load_graph_data()
        if not vis_data:
            return jsonify({"error": "Aucun graphe disponible"}), 404
        
        # Convertir au format Dantzig
        graph = convert_to_dantzig_format(vis_data)
        if not graph:
            return jsonify({"error": "Format de graphe invalide"}), 400
        
        if start not in graph['sommet']:
            return jsonify({"error": f"Sommet '{start}' non trouvé"}), 404
        
        # Exécuter l'algorithme
        lambda_values, _, Ek_steps = init_dantzig(graph, start)
        
        # Formater les résultats
        formatted_lambda = format_lambda_results(lambda_values)
        sorted_Ek = {k: sorted(v) for k, v in Ek_steps.items()}
        
        return jsonify({
            "lambda": formatted_lambda,
            "E": sorted_Ek,
            "start_node": start
        })
        
    except Exception as e:
        return jsonify({"error": f"Erreur calcul Dantzig: {str(e)}"}), 500

@app.route('/shortest-path/<start>/<end>', methods=['GET'])
def dantzig_path(start, end):
    """
    Trouve le plus court chemin entre deux nœuds
    """
    try:
        # Charger les données depuis le fichier
        vis_data = load_graph_data()
        if not vis_data:
            return jsonify({"error": "Aucun graphe disponible"}), 404
        
        # Convertir au format Dantzig
        graph = convert_to_dantzig_format(vis_data)
        if not graph:
            return jsonify({"error": "Format de graphe invalide"}), 400
        
        if start not in graph['sommet'] or end not in graph['sommet']:
            return jsonify({"error": "Sommet de départ ou d'arrivée invalide"}), 404
        
        # Exécuter l'algorithme
        lambda_values, predecessors, _ = init_dantzig(graph, start)
        
        if lambda_values[end] == float('inf'):
            return jsonify({
                "message": f"Aucun chemin trouvé de {start} à {end}",
                "path_found": False
            }), 404
        
        # Reconstituer le chemin
        path = get_shortest_path(predecessors, end)
        
        return jsonify({
            "start": start,
            "end": end,
            "chemin": path,
            "longueur": lambda_values[end],
            "path_found": True
        })
        
    except Exception as e:
        return jsonify({"error": f"Erreur calcul chemin: {str(e)}"}), 500

@app.route('/update-node', methods=['POST'])
def update_node():
    """
    Met à jour un nœud spécifique (sans sauvegarder tout le graphe)
    """
    try:
        data = request.get_json()
        node_id = data.get('id')
        
        # Charger le graphe actuel
        graph_data = load_graph_data()
        
        # Trouver et mettre à jour le nœud
        for node in graph_data['nodes']:
            if node['id'] == node_id:
                node.update(data)
                break
        
        return jsonify({"message": "Nœud mis à jour temporairement"})
        
    except Exception as e:
        return jsonify({"error": f"Erreur mise à jour nœud: {str(e)}"}), 500

@app.route('/update-edge', methods=['POST'])
def update_edge():
    """
    Met à jour une arête spécifique (sans sauvegarder tout le graphe)
    """
    try:
        data = request.get_json()
        edge_id = data.get('id')
        
        # Charger le graphe actuel
        graph_data = load_graph_data()
        
        # Trouver et mettre à jour l'arête
        for edge in graph_data['edges']:
            if edge['id'] == edge_id:
                edge.update(data)
                break
        
        return jsonify({"message": "Arête mise à jour temporairement"})
        
    except Exception as e:
        return jsonify({"error": f"Erreur mise à jour arête: {str(e)}"}), 500

if __name__ == '__main__':
    print("🚀 Démarrage du serveur Dantzig...")
    app.run(debug=True, host='127.0.0.1', port=5000)
