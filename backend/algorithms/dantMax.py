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


def init_dantzig_max_detailed(graph, start):
    """Version détaillée de l'algorithme maximal conforme au format du fichier PDF"""
    lambda_values = {node: float('-inf') for node in graph['sommet']}
    predecessors = {node: None for node in graph['sommet']}
    lambda_values[start] = 0
    E = [start]
    
    detailed_steps = []
    step_number = 1
    
    # Étape initiale (Étape 0)
    detailed_steps.append({
        'step': 0,
        'step_name': 'Initialisation',
        'description': f'Initialisation: Poser λ({start}) = 0, E₁ = {{{start}}}',
        'E_current': E.copy(),
        'lambda_values': {k: ("-∞" if v == float('-inf') else v) for k, v in lambda_values.items()},
        'action': 'Initialisation',
        'candidates': [],
        'selected': None,
        'calculations': [],
        'highlight_nodes': [start],
        'highlight_edges': []
    })

    while len(E) < len(graph['sommet']):
        candidates = []
        calculations = []
        all_candidates_details = []

        # Phase 1: Pour chaque sommet marqué xi ∈ E, trouver xi* ∉ E avec coût maximal
        for xi in E:
            max_arc = None
            max_cost = float('-inf')
            node_arcs = []
            
            for (u, v, cost) in graph['arc']:
                if u == xi and v not in E:
                    node_arcs.append((v, cost))
                    if cost > max_cost:
                        max_arc = (u, v, cost)
                        max_cost = cost

            if max_arc:
                u, v, cost = max_arc
                total = lambda_values[u] + cost
                candidates.append((total, u, v, cost))
                
                # Détails pour l'affichage
                calculation_text = f"De {u}: max{{arcs sortants vers non-marqués}} = {v} (coût {cost})"
                lambda_calc = f"λ({v}) = λ({u}) + {cost} = {lambda_values[u]} + {cost} = {total}"
                
                calculations.append({
                    'from_node': u,
                    'available_targets': node_arcs,
                    'selected_target': v,
                    'edge_cost': cost,
                    'calculation_text': calculation_text,
                    'lambda_calculation': lambda_calc
                })
                
                all_candidates_details.append({
                    'from_node': u,
                    'to_node': v,
                    'edge_cost': cost,
                    'lambda_from': lambda_values[u],
                    'total_cost': total,
                    'calculation': lambda_calc
                })

        if not candidates:
            detailed_steps.append({
                'step': step_number,
                'step_name': 'Terminaison',
                'description': 'Aucun arc sortant disponible - Algorithme terminé',
                'E_current': E.copy(),
                'lambda_values': {k: ("-∞" if v == float('-inf') else v) for k, v in lambda_values.items()},
                'action': 'Terminaison',
                'candidates': [],
                'selected': None,
                'calculations': [],
                'highlight_nodes': E.copy(),
                'highlight_edges': []
            })
            break

        # Phase 2: Sélectionner le candidat avec λ maximal
        candidates.sort(reverse=True)
        max_total, best_u, best_v, best_cost = candidates[0]
        
        # Avant la mise à jour des valeurs
        step_before_update = {
            'step': step_number,
            'step_name': f'Étape {step_number}a - Calculs',
            'description': f'Calculer λ pour tous les candidats depuis E{step_number}',
            'E_current': E.copy(),
            'lambda_values': {k: ("-∞" if v == float('-inf') else v) for k, v in lambda_values.items()},
            'action': 'Calcul des candidats',
            'candidates': all_candidates_details,
            'selected': None,
            'calculations': calculations,
            'highlight_nodes': E.copy(),
            'highlight_edges': [],
            'reasoning': f'Comparer les valeurs λ calculées'
        }
        detailed_steps.append(step_before_update)
        
        # Mettre à jour les valeurs
        lambda_values[best_v] = max_total
        predecessors[best_v] = best_u
        E.append(best_v)
        step_number += 1
        
        # Après la mise à jour
        selected_detail = next(c for c in all_candidates_details 
                             if c['from_node'] == best_u and c['to_node'] == best_v)
        
        step_after_update = {
            'step': step_number - 0.5,  # Étape intermédiaire
            'step_name': f'Étape {step_number - 1}b - Sélection',
            'description': f'Sélectionner le maximum: λ({best_v}) = {max_total}, E{step_number} = {{", ".join(E)}}',
            'E_current': E.copy(),
            'lambda_values': {k: ("-∞" if v == float('-inf') else v) for k, v in lambda_values.items()},
            'action': f'Marquage de {best_v}',
            'candidates': all_candidates_details,
            'selected': selected_detail,
            'calculations': calculations,
            'highlight_nodes': E.copy(),
            'highlight_edges': [(best_u, best_v)],
            'reasoning': f'max{{", ".join([str(c["total_cost"]) for c in all_candidates_details])}} = {max_total}'
        }
        detailed_steps.append(step_after_update)

    return lambda_values, predecessors, detailed_steps


def format_lambda_results(lambda_values, max_mode=False):
    return {
        k: ("-∞" if v == float('-inf') else v) if max_mode else ("∞" if v == float('inf') else v)
        for k, v in sorted(lambda_values.items(), key=lambda x: x[0])
    }
