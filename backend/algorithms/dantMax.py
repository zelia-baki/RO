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


def format_lambda_results(lambda_values, max_mode=False):
    return {
        k: ("-∞" if v == float('-inf') else v) if max_mode else ("∞" if v == float('inf') else v)
        for k, v in sorted(lambda_values.items(), key=lambda x: x[0])
    }
