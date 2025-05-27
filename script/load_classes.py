"""
Script for loading all complexity class information
- Essentially the door between flask and our processing
"""

# Imports
try:
    from .helpers import load_json
    from .complexity_network import complexity_network
except Exception as e:
    print(f"Error importing modules: {e}")
    from helpers import load_json
    from complexity_network import complexity_network


def create_class_network(class_json_loc, theorem_json_loc):
    class_json = load_json(class_json_loc)
    theorem_json = load_json(theorem_json_loc)
    if class_json is None or theorem_json is None:
        print(f"Error loading {class_json_loc} or {theorem_json_loc}")
        return None
    network = complexity_network()
    network.add_classes_from_dict(class_json['class_list'])
    network.add_theorems_from_dict(theorem_json['theorems'])
    return network

def list_all_classes(class_json_loc):
    class_json = load_json(class_json_loc)
    if class_json is None:
        return [], {}
    return class_json['class_name_list'], class_json['class_list']