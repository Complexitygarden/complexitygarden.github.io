"""
Setting up the search function
"""

import nltk

def search_classes(query, cc_dict, all_class_list):
    """
    Filtering the classes based on the query
    """
    if len(query) == 0:
        return [cc_dict[d] for d in all_class_list]
    
    # Filter
    results = [cc_dict[d] for d in all_class_list if query.lower() in d.lower()]

    # Sorting using Levenshtein distance
    results = sorted(results, key=lambda x: nltk.edit_distance(query, x['name']))

    return results

