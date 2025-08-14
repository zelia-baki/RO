import os
import json

GRAPH_FILE = os.path.join(os.path.dirname(__file__), '..', 'graph_data.json')


def save_graph_data(data):
    try:
        with open(GRAPH_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        print(f"Erreur sauvegarde: {e}")
        return False


def load_graph_data():
    if not os.path.exists(GRAPH_FILE):
        return None
    try:
        with open(GRAPH_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Erreur lecture: {e}")
        return None


def convert_to_dantzig_format(vis_data):
    if not vis_data:
        return None
    try:
        nodes = [n['id'] for n in vis_data.get('nodes', [])]
        arcs = []
        for e in vis_data.get('edges', []):
            src = e['source']
            tgt = e['target']
            try:
                weight = int(e.get('label', '1'))
            except:
                weight = 1
            arcs.append((src, tgt, weight))
        return {'sommet': nodes, 'arc': arcs}
    except Exception as e:
        print(f"Erreur conversion: {e}")
        return None
