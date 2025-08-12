"""
Module de gestion des données de graphe avec persistance JSON
"""

import json
import os
from datetime import datetime
import uuid

GRAPH_FILE = 'graph_data.json'

def load_full_history():
    """
    Charge l'historique complet depuis le fichier JSON
    """
    try:
        if not os.path.exists(GRAPH_FILE):
            return initialize_history_file()
            
        with open(GRAPH_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # Assurer la compatibilité avec l'ancien format
            if 'history' not in data:
                return migrate_to_history_format(data)
            return data
    except Exception as e:
        print(f"Erreur lors du chargement de l'historique: {e}")
        return initialize_history_file()

def save_full_history(history_data):
    """
    Sauvegarde l'historique complet dans le fichier JSON
    """
    try:
        with open(GRAPH_FILE, 'w', encoding='utf-8') as f:
            json.dump(history_data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Erreur lors de la sauvegarde de l'historique: {e}")
        return False

def add_graph_version(graph_data, action_type="manual_save", description=""):
    """
    Ajoute une nouvelle version du graphe à l'historique
    """
    try:
        # Charger l'historique existant
        full_data = load_full_history()
        
        # Créer une nouvelle entrée d'historique
        version_entry = {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.now().isoformat(),
            "action_type": action_type,
            "description": description,
            "graph_data": {
                "nodes": graph_data.get('nodes', []),
                "edges": graph_data.get('edges', [])
            }
        }
        
        # Ajouter à l'historique
        full_data['history'].append(version_entry)
        full_data['current_version'] = version_entry['id']
        full_data['last_updated'] = datetime.now().isoformat()
        
        # Limiter l'historique à 50 versions pour éviter des fichiers trop gros
        if len(full_data['history']) > 50:
            full_data['history'] = full_data['history'][-50:]
        
        # Sauvegarder
        return save_full_history(full_data)
        
    except Exception as e:
        print(f"Erreur lors de l'ajout à l'historique: {e}")
        return False

def save_graph_data(graph_data, action_type="manual_save", description=""):
    """
    Sauvegarde les données du graphe avec historique
    """
    return add_graph_version(graph_data, action_type, description)

def add_node_to_history(node_data):
    """
    Ajoute un nœud et sauvegarde dans l'historique
    """
    current_graph = get_current_graph()
    current_graph['nodes'].append(node_data)
    return add_graph_version(
        current_graph, 
        "add_node", 
        f"Ajout du nœud {node_data.get('id', 'unknown')}"
    )

def add_edge_to_history(edge_data):
    """
    Ajoute une arête et sauvegarde dans l'historique
    """
    current_graph = get_current_graph()
    current_graph['edges'].append(edge_data)
    return add_graph_version(
        current_graph, 
        "add_edge", 
        f"Ajout de l'arête {edge_data.get('source', '')} → {edge_data.get('target', '')}"
    )

def update_node_in_history(node_id, node_data):
    """
    Met à jour un nœud et sauvegarde dans l'historique
    """
    current_graph = get_current_graph()
    for i, node in enumerate(current_graph['nodes']):
        if node['id'] == node_id:
            current_graph['nodes'][i] = {**node, **node_data}
            break
    return add_graph_version(
        current_graph, 
        "update_node", 
        f"Mise à jour du nœud {node_id}"
    )

def update_edge_in_history(edge_id, edge_data):
    """
    Met à jour une arête et sauvegarde dans l'historique
    """
    current_graph = get_current_graph()
    for i, edge in enumerate(current_graph['edges']):
        if edge['id'] == edge_id:
            current_graph['edges'][i] = {**edge, **edge_data}
            break
    return add_graph_version(
        current_graph, 
        "update_edge", 
        f"Mise à jour de l'arête {edge_id}"
    )

def load_graph_data():
    """
    Charge les données du graphe depuis le fichier JSON
    """
    try:
        if not os.path.exists(GRAPH_FILE):
            return get_default_graph()
            
        with open(GRAPH_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data
    except Exception as e:
        print(f"Erreur lors du chargement: {e}")
        return get_default_graph()

def convert_to_dantzig_format(vis_data):
    """
    Convertit les données du format vis.js/React Flow vers le format requis par Dantzig
    """
    if not vis_data or 'nodes' not in vis_data or 'edges' not in vis_data:
        return None
    
    # Extraction des nœuds
    nodes = [node['id'] for node in vis_data['nodes']]
    
    # Extraction et conversion des arêtes
    arcs = []
    for edge in vis_data['edges']:
        try:
            source = edge['source']
            target = edge['target']
            # Utiliser le label comme poids, défaut à 1
            weight = int(edge.get('label', '1')) if edge.get('label') else 1
            arcs.append((source, target, weight))
        except (ValueError, KeyError) as e:
            print(f"Erreur conversion arête {edge}: {e}")
            continue
    
    return {
        'sommet': nodes,
        'arc': arcs
    }

def get_default_graph():
    """
    Retourne un graphe par défaut
    """
    return {
        'nodes': [
            {'id': 'x1'}, {'id': 'x2'}, {'id': 'x3'}, {'id': 'x4'},
            {'id': 'x5'}, {'id': 'x6'}, {'id': 'x7'}, {'id': 'x8'},
            {'id': 'x9'}, {'id': 'x10'}, {'id': 'x11'}, {'id': 'x12'},
            {'id': 'x13'}, {'id': 'x14'}, {'id': 'x15'}, {'id': 'x16'}
        ],
        'edges': [
            {'id': 'e1', 'source': 'x1', 'target': 'x2', 'label': '10'},
            {'id': 'e2', 'source': 'x2', 'target': 'x3', 'label': '15'},
            {'id': 'e3', 'source': 'x2', 'target': 'x4', 'label': '8'},
            {'id': 'e4', 'source': 'x3', 'target': 'x6', 'label': '1'},
            {'id': 'e5', 'source': 'x4', 'target': 'x5', 'label': '6'},
            {'id': 'e6', 'source': 'x4', 'target': 'x6', 'label': '5'},
            {'id': 'e7', 'source': 'x5', 'target': 'x9', 'label': '1'},
            {'id': 'e8', 'source': 'x6', 'target': 'x7', 'label': '4'},
            {'id': 'e9', 'source': 'x7', 'target': 'x8', 'label': '1'},
            {'id': 'e10', 'source': 'x8', 'target': 'x9', 'label': '3'},
            {'id': 'e11', 'source': 'x8', 'target': 'x12', 'label': '7'},
            {'id': 'e12', 'source': 'x9', 'target': 'x10', 'label': '6'},
            {'id': 'e13', 'source': 'x10', 'target': 'x12', 'label': '7'},
            {'id': 'e14', 'source': 'x7', 'target': 'x11', 'label': '8'},
            {'id': 'e15', 'source': 'x11', 'target': 'x13', 'label': '2'},
            {'id': 'e16', 'source': 'x12', 'target': 'x15', 'label': '9'},
            {'id': 'e17', 'source': 'x13', 'target': 'x14', 'label': '4'},
            {'id': 'e18', 'source': 'x14', 'target': 'x15', 'label': '5'},
            {'id': 'e19', 'source': 'x15', 'target': 'x16', 'label': '6'}
        ]
    }
