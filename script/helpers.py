"""
Various simple functions which aren't directly related to the processing of complexity classes
"""

# Imports
import json

def load_json(json_loc: str):
    try:
        with open(json_loc, 'r') as file:
            class_json = json.load(file)
    except:
        print(f'Could not load the json at: {json_loc}')
        return None
    return class_json

def save_json(json_loc: str, json_object: dict):
    try:
        with open(json_loc, 'w') as file:
            json.dump(json_object, file)
    except:
        print(f'Could not save the json at: {json_loc}')
        return False
    return True

