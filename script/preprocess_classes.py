"""
This file pre-processes the classes file - the one we should work with - in order to 
"""

# Imports
try:
    from .helpers import load_json, save_json
    from .complexity_network import complexity_network
except:
    from helpers import load_json, save_json
    from complexity_network import complexity_network

import collections

def check_json_correctness(class_json_loc, theorems_json_loc):
    """
    Turning the class json into a processed version in order to perform rudimentary computation ahead of time
    """
    class_json = load_json(class_json_loc)
    if class_json is None:
        return
    
    theorems_json = load_json(theorems_json_loc)
    if theorems_json is None:
        return
    
    # Adding a list of all classes
    class_json['class_name_list'] = list_of_all_classes(class_json)

    correctness = check_formatting_of_jsons(class_json, theorems_json)
    if not correctness:
        print("Error: The class json is not correct -> Won't save the new processed version")
        return
    
    network = complexity_network()
    network.add_classes_from_dict(class_json['class_list'])
    network.add_theorems_from_dict(theorems_json['theorems'])

    check_validity_of_network(network)
    return

def check_validity_of_network(network: complexity_network):
    """
    Checking if we made a valid complexity network
    """
    # Checking which classes collapse due to containments
    collapse_classes = network.find_classes_which_collapse()
    if len(collapse_classes) > 0:
        print(f"Error: There are classes which collapse due to cyclic containments: {collapse_classes}")

    redundant_containments = network.find_redundant_containments()
    if len(redundant_containments) > 0:
        print(f"Error: There are redundant containments: {redundant_containments}")
    return

def list_of_all_classes(js: dict) -> list:
    """
    Obtaining a list of all classes so that we can search effectively
    """
    return sorted([v['name'] for v in js['class_list'].values()])

def check_formatting_of_jsons(class_json: dict, theorems_json: dict):
    """
    Checking if the class json does not have any errors
        - All classes are unique
        - All edges are listed both ways
    """
    # Uniqueness
    class_names = class_json['class_name_list']
    if len(class_names) != len(set(class_names)):
        duplicate_classes = [item for item, count in collections.Counter(class_names).items() if count > 1]
        print(f"Error: There are duplicate classes: {duplicate_classes}")
        return False
    
    # Checking if all theorems have valid classes
    if not check_theorem_format(theorems_json, class_names):
        return False

    print("No issues found")
    return True 

def check_theorem_format(theorems: dict, class_list: list):
    """
    Checking if each theorem contains a valid class
    """
    for theorem in theorems['theorems']:
        keys = []
        if theorem['type'] == 'equality':
            keys = ['a', 'b']
        elif theorem['type'] == 'containment':
            keys = ['small', 'large']
        for key in keys:
            if key not in theorem:
                print(f"Error: Theorem {theorem} is missing a key {key}")
                return False
            if theorem[key] not in class_list:
                print(f"Error: Theorem {theorem} has invalid classes")
                return False
    return True

if __name__=='__main__':
    json_loc = './classes.json'
    theorem_json_loc = './theorems.json'
    check_json_correctness(json_loc, theorem_json_loc)