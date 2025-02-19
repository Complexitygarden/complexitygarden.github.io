"""
Setting up the search function
"""

import nltk

def search_classes(query, network):
    """
    Filtering the classes based on the query
    """
    cc_dict = network.get_checked_classes_dict()
    all_class_list = network.get_all_class_identifiers()

    if len(query) == 0:
        return sorted([cc_dict[d] for d in all_class_list], key=lambda x: x['name'])
    
    # Filter
    results = [cc_dict[d] for d in all_class_list if query.lower() in d.lower()]

    # Sorting using Levenshtein distance
    results = sorted(results, key=lambda x: nltk.edit_distance(query, x['name']))

    return results

