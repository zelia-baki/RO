def init_dantzig_min(graph, start):
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


def format_lambda_results(lambda_values):
    return {
        k: ("∞" if v == float('inf') else v)
        for k, v in sorted(lambda_values.items(), key=lambda x: x[0])
    }
