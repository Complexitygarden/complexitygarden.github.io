"""
Script which creates a network of complexity classes
"""

import copy

def create_trimmed_class_network(cl: list, cd: dict):
    """
    Creating a network of classes where we only want to keep the classes in cl

    The algorithm works as follows:
    - Create a FIFO list l
    - Add a tagged vertex to l
    - For each vertex v in l:
        - Go through the neighbors n of v:
            - If n wasn't processed, add it to l
                - Otherwise, skip
        - If v is NOT in cl
            - For all edges in and edges out, turn them into one edge (assuming it is not the same node)
    """
    trimmed_network = trim_network(cl, cd)
    return network_dict(trimmed_network)

def trim_network(cl: list, cd: dict):
    """
    Dropping the unnecessary classes and their connections
    """
    # If no classes are selected, we don't get anything
    if len(cl) == 0:
        return None
    elif len(cl) == 1:
        # One node -> return the single node
        val = cl[0]
        out_dict = {val: copy.deepcopy(cd)[val]}
        out_dict[val]['contains'], out_dict[val]['within'] = [], []
        return out_dict
    
    node_queue, vertex_tag, cdc, processed_vertex = preprocessing_for_trim(cl, cd)

    # Dropping the classes -> turning them into edges
    while len(node_queue)!=0:
        cur_ver = node_queue.pop(0)
        processed_vertex[cur_ver] = True
        if cur_ver not in cdc:
            continue
        # Iterating through all neighbors
        for neighbor in list(set(cdc[cur_ver]['contains'] + cdc[cur_ver]['within'])):
            # Adding unprocessed neighbors
            if not processed_vertex[neighbor]:
                node_queue.append(neighbor)
        if not vertex_tag[cur_ver]:
            cdc = turn_vertex_into_edge(cur_ver, cdc)

    """
    Dropping direct edges
    - Essentially, if there are two paths (or more) between two nodes, and one of them is direct (i.e. straight from one to the other),
    while others are indirect (it passes through other nodes), we drop the direct edge.
    """
    for source in cdc.keys():
        for target in cdc[source]['contains'].copy():
            # Check if there's an indirect path from source to target
            if has_indirect_path(source, target, cdc):
                # Remove direct edge
                cdc[source]['contains'].remove(target)
                cdc[target]['within'].remove(source)
    return cdc

def preprocessing_for_trim(cl: list, cd: dict):
    """
    Preparring the starting variables
    """
    # Processed nodes
    node_queue = [cl[0]]
    # Dictionary on whether a vertex is in the list
    tagged_vertex = {k:False for k in cd.keys()}
    for tv in cl: tagged_vertex[tv] = True
    # Dictionary of processed vertices
    processed_vertex = {k:False for k in cd.keys()}
    # Copy of the original dictionary
    cdc = copy.deepcopy(cd)
    return node_queue, tagged_vertex, cdc, processed_vertex

def turn_vertex_into_edge(vertex, cd: dict):
    for cont in cd[vertex]['contains']:
        for within in cd[vertex]['within']:
            if cont != within:
                if cont not in cd[within]['contains']:
                    cd[within]['contains'].append(cont)
                if within not in cd[cont]['within']:
                    cd[cont]['within'].append(within)
    for cont in cd[vertex]['contains']: 
        if vertex in cd[cont]['within']: cd[cont]['within'].remove(vertex)
    for within in cd[vertex]['within']: 
        if vertex in cd[within]['contains']: cd[within]['contains'].remove(vertex)
    if vertex in cd: del cd[vertex]
    return cd

def network_dict(d: dict):
    output_dict = {"nodes": [],
                "links":[]}
    # No selected nodes
    if d is None:
        return output_dict
    for k,v in d.items():
        output_dict["nodes"].append(
            {"name": k,
             "label": v["name"],
             "group": "A"}
        )
        for goal in v["contains"]:
            output_dict["links"].append({
                "source": goal,
                "target": k,
                "type": "A"
            })
    return output_dict

def has_indirect_path(source: str, target: str, cd: dict, visited: set = None) -> bool:
    """
    Check if there exists a path from source to target through other nodes
    """
    if visited is None:
        visited = {source}
    # Check immediate connections excluding direct path to target
    for intermediate in cd[source]['contains']:
        if intermediate == target:
            continue
        if intermediate not in visited:
            visited.add(intermediate)
            if target in cd[intermediate]['contains'] or has_indirect_path(intermediate, target, cd, visited):
                return True
    return False

if __name__=='__main__':
    try:
        from .helpers import load_json
    except:
        from helpers import load_json
    
    js = load_json('./classes.json')
    print(create_trimmed_class_network(['BQP', 'NP', 'P'], js['class_list']))
