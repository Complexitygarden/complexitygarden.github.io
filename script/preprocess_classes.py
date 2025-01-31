"""
This file pre-processes the classes file - the one we should work with - in order to 
"""

# Imports
try:
    from .helpers import load_json, save_json
except:
    from helpers import load_json, save_json

import collections

def process_class_json(class_json_loc, process_json_loc):
    """
    Turning the class json into a processed version in order to perform rudimentary computation ahead of time
    """
    class_json = load_json(class_json_loc)
    if class_json is None:
        return
    
    # Adding a list of all classes
    class_json['class_name_list'] = list_of_all_classes(class_json)

    correctness = check_correctness_of_class_json(class_json)
    if not correctness:
        print("Error: The class json is not correct -> Won't save the new processed version")
        return

    # Saving the processed json
    save_json(process_json_loc, class_json)
    return

def list_of_all_classes(js: dict) -> list:
    """
    Obtaining a list of all classes so that we can search effectively
    """
    return sorted([v['name'] for v in js['class_list'].values()])

def check_correctness_of_class_json(class_json: dict):
    """
    Checking if the class json does not have any errors
        - All classes are unique
        - All edges are listed both ways
    """
    # Uniqueness
    class_names = [v['name'] for v in class_json['class_list'].values()]
    if len(class_names) != len(set(class_names)):
        duplicate_classes = [item for item, count in collections.Counter(class_names).items() if count > 1]
        print(f"Error: There are duplicate classes: {duplicate_classes}")
        return False
    
    # Checking if all edges are listed both ways
    point_one_way_edges = []
    pont_nowhere_edges = []
    for class_name in class_names:
        for inside_class in (class_json['class_list'][class_name]['contains'] + class_json['class_list'][class_name]['within']):
            if inside_class not in class_names:
                pont_nowhere_edges.append(f"{class_name} -> {inside_class}")
            else:
                if inside_class in class_json['class_list'][class_name]['contains'] and not class_name in class_json['class_list'][inside_class]['within']:
                    point_one_way_edges.append(f"{class_name} -> {inside_class} (contains)")
                if inside_class in class_json['class_list'][class_name]['within'] and not class_name in class_json['class_list'][inside_class]['contains']:
                    point_one_way_edges.append(f"{class_name} -> {inside_class} (within)")
    if len(point_one_way_edges) > 0 or len(pont_nowhere_edges) > 0:
        if len(point_one_way_edges) > 0: print(f"Error: There are edges which are not listed both ways: {point_one_way_edges}")
        if len(pont_nowhere_edges) > 0: print(f"Error: There are edges which don't point to a class: {pont_nowhere_edges}")
        return False
    return True 

if __name__=='__main__':
    json_loc = './classes.json'
    proc_json_loc = './proc_classes.json'
    process_class_json(json_loc, proc_json_loc)