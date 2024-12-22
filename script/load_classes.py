"""
Script for loading all complexity class information
- Essentially the door between flask and our processing
"""

# Imports
try:
    from .helpers import load_json
    from .class_network import create_trimmed_class_network
except:
    from helpers import load_json
    from class_network import create_trimmed_class_network


def list_all_classes(class_json_loc):
    class_json = load_json(class_json_loc)
    if class_json is None:
        return [], {}
    return class_json['class_name_list'], class_json['class_list']

def create_class_network(select_class: list, class_dict: dict):
    return create_trimmed_class_network(select_class, class_dict)