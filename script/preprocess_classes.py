"""
This file pre-processes the classes file - the one we should work with - in order to 
"""

# Imports
try:
    from .helpers import load_json, save_json
except:
    from helpers import load_json, save_json

def process_class_json(class_json_loc, process_json_loc):
    """
    Turning the class json into a processed version in order to perform rudimentary computation ahead of time
    """
    class_json = load_json(class_json_loc)
    if class_json is None:
        return
    
    # Adding a list of all classes
    class_json['class_name_list'] = list_of_all_classes(class_json)


    # Saving the processed json
    save_json(process_json_loc, class_json)
    return

def list_of_all_classes(js: dict) -> list:
    """
    Obtaining a list of all classes so that we can search effectively
    """
    return [v['name'] for v in js['class_list'].values()]

if __name__=='__main__':
    json_loc = './classes.json'
    proc_json_loc = './proc_classes.json'
    process_class_json(json_loc, proc_json_loc)