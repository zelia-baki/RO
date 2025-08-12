"""
Module pour l'algorithme de Dantzig (plus courts chemins)
"""

def init_dantzig(graph, start):
    """
    Implémentation de l'algorithme de Dantzig pour trouver les plus courts chemins
    
    Args:
        graph: Dictionnaire avec 'sommet' (liste des nœuds) et 'arc' (liste des arêtes)
        start: Nœud de départ
        
    Returns:
        tuple: (lambda_values, predecessors, Ek_steps)
    """
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
                if u == xi and v not in E and cost < min_cost:
                    min_arc = (u, v, cost)
                    min_cost = cost
            
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
    
    return lambda_values, predecessors, Ek_steps


def get_shortest_path(predecessors, end):
    """
    Reconstitue le plus court chemin à partir des prédécesseurs
    
    Args:
        predecessors: Dictionnaire des prédécesseurs
        end: Nœud de destination
        
    Returns:
        list: Chemin du début à la fin
    """
    path = []
    current = end
    while current:
        path.insert(0, current)
        current = predecessors[current]
    return path


def format_lambda_results(lambda_values):
    """
    Formate les résultats lambda pour l'affichage
    
    Args:
        lambda_values: Dictionnaire des valeurs lambda
        
    Returns:
        dict: Lambda formatées avec ∞ pour les valeurs infinies
    """
    return {
        k: ("∞" if v == float('inf') else v)
        for k, v in sorted(lambda_values.items(), key=lambda x: x[0])
    }
