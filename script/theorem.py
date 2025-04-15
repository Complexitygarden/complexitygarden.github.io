"""
Defining the class for theorems
"""

VALID_THEOREMS = [
    "containment", # One class is contained in another
    "equality" # Two classes are equal
]

class theorem():
    def __init__(self, def_dict: dict) -> None:
        if def_dict['type'] not in VALID_THEOREMS:
            raise ValueError(f"Invalid theorem type: {def_dict['type']}")
        self.type = def_dict['type']
        self.info_dict = def_dict
        self.set_classes()
        return

    def get_classes(self):
        return self.classes

    def set_classes(self):
        raise NotImplementedError("The function \'set_classes\' is not implemented for theorem")
    
    def is_valid(self):
        raise NotImplementedError("The function \'is_valid\' is not implemented for theorem")

"""
Containment theorem
    - Simply saying that one class is contained in another
"""
class containment_theorem(theorem):
    def __init__(self, def_dict: dict) -> None:
        self.small_class = def_dict['small'].lower()
        self.large_class = def_dict['large'].lower()
        super().__init__(def_dict)
        return
    
    def set_classes(self):
        self.classes = [self.small_class, self.large_class]

    def is_valid(self):
        return self.small_class != self.large_class
    
"""
Equality theorem
    - Declaring two classes as equal
    - In the backend, we choose one main class - all the other classes follow suit and they remember which class is the main one
"""
class equality_theorem(theorem):
    def __init__(self, def_dict: dict) -> None:
        self.a = def_dict['a'].lower()
        self.b = def_dict['b'].lower()
        super().__init__(def_dict)
        return
    
    def set_classes(self):
        self.classes = [self.a, self.b]

    def is_valid(self):
        return self.a != self.b


def group_equality_theorems(equality_theorems: list[equality_theorem], class_dict: dict):
    """
    Grouping the equality theorems and setting the main class
    """
    # Grouping classes
    class_groups, class_group_list = {}, {}
    for thm in equality_theorems:
        class_list = thm.classes
        selected_classes = [class_groups[c] for c in class_list if c in class_groups]
        if len(selected_classes) == 0:
            class_group_list[class_list[0]] = class_list
            for c in class_list: class_groups[c] = class_list[0]
        else:
            main_class = class_groups[selected_classes[0]]
            if len(selected_classes) == 2:
                other_class = class_groups[selected_classes[1]]
                if main_class != other_class:
                    for c in class_group_list[other_class]:
                        class_groups[c] = main_class
                    class_group_list[main_class] = list(set(class_group_list[main_class] + class_group_list[other_class]))
                    del class_group_list[other_class]
            else:
                new_label = [c for c in class_list if c not in selected_classes][0]
                class_groups[new_label] = main_class
                class_group_list[main_class] = list(set(class_group_list[main_class] + [new_label]))
    out_list = list(class_group_list.values())
    main_classes = select_main_class(out_list, class_dict)
    return out_list, main_classes

def select_main_class(class_groups: dict, class_dict: dict):
    """
    Selecting the main class for each equality theorem
     - We do so based on the number of connections, followed by reverse alphabetical order
    """
    main_classes = []
    for class_group in class_groups:
        class_group = sorted(class_group)
        class_group = sorted(class_group, key=lambda x: (len(class_dict[x].get_neighbors_identifiers()), x), reverse=True)
        main_classes.append(class_group[0])
    return main_classes
