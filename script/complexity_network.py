"""
Defining the class for the entire complexity network
 - Trimmed network = The network which is displayed on the screen
"""

# Imports
try:
    from .complexity_class import complexity_class
    from .theorem import theorem, containment_theorem
    from .theorem import VALID_THEOREMS
except Exception as e:
    print(f"Error importing modules: {e}")
    from complexity_class import complexity_class
    from theorem import theorem, containment_theorem
    from theorem import VALID_THEOREMS
import json
import copy

class complexity_network():
    def __init__(self) -> None:
        self.classes: list[complexity_class] = []
        self.classes_identifiers: list[str] = []
        self.classes_dict: dict[str, complexity_class] = {}
        self.theorems: list[theorem] = []
        self.trimmed_network = []
        return
    
    def add_class(self, class_def: dict, class_name: str):
        """
        Adding a class to the network
        """
        new_class = complexity_class(class_def, class_name, self)
        self.classes.append(new_class)
        self.classes_dict[new_class.get_identifier()] = new_class
        self.classes_identifiers.append(new_class.get_identifier())
        return
    
    def add_classes_from_dict(self, class_dict: dict):
        """
        Adding classes from a dictionary
        """
        for class_name, class_def in class_dict.items():
            self.add_class(class_def, class_name)
        return
    
    def get_class(self, class_name: str):
        if class_name not in self.classes_dict:
            raise ValueError(f"Class {class_name} not found in the network")
        return self.classes_dict[class_name]
    
    def get_all_class_identifiers(self):
        return self.classes_identifiers.copy()

    def add_theorem(self, thm: theorem):
        """
        Adding a theorem to its associated classes
        """
        self.theorems.append(thm)
        affected_classes = thm.get_classes()
        for class_name in affected_classes:
            self.classes_dict[class_name].add_theorem(thm)
        return
    
    def add_theorems_from_dict(self, thm_dicts: dict):
        """
        Adding a theorem from a dictionary
        """
        for thm_dict in thm_dicts:
            if thm_dict['type'] not in VALID_THEOREMS:
                raise ValueError(f"Invalid theorem type: {thm_dict['type']}")
            elif thm_dict['type'] == 'containment':
                thm = containment_theorem(thm_dict)
            self.add_theorem(thm)
        return

    def new_trimmed_network(self, class_list: list[str]):
        """
        Creating a new trimmed network - we only keep the classes in class_list
        """
        class_list = [c.lower() for c in class_list]
        # Deleting the old network
        self.delete_old_trimmed_network()

        self.trimmed_network = copy.deepcopy(class_list)

        # Basic cases
        if len(class_list) == 0:
            return
        elif len(class_list) == 1:
            self.classes_dict[class_list[0]].visible = True
        elif len(class_list) == len(self.classes):
            for c in self.classes:
                c.visible = True
                c.trim_contains = c.contains.copy()
                c.trim_within = c.within.copy()

        node_queue, tagged_vertex, processed_vertex = variables_for_processing(class_list, self.classes_dict)

        # Processing all nodes
        while len(node_queue)!=0:
            current_class_identifier = node_queue.pop(0)
            current_class = self.classes_dict[current_class_identifier]
            processed_vertex[current_class_identifier] = True
            # Any class which is not selected is ignored
            if current_class_identifier not in self.classes_dict:
                continue
            # Iterating through all neighbors
            neighbors = list(set(current_class.get_trim_neighbors()))
            neighbor_names = [n.get_identifier() for n in neighbors]
            for neighbor in neighbor_names:
                # Adding unprocessed neighbors
                if not processed_vertex[neighbor]:
                    node_queue.append(neighbor)
            if tagged_vertex[current_class_identifier]:
                current_class.visible = True
            else:
                self.turn_vertex_into_edge(current_class)

        # Dropping direct edges
        for source in [self.classes_dict[c] for c in class_list]:
            for target in source.get_trim_contains():
                if source.has_indirect_path(target, self.classes_dict):
                    source.trim_contains.remove(target)
                    target.trim_within.remove(source)


    def turn_vertex_into_edge(self, vertex: complexity_class):
        within_classes = vertex.get_trim_within()
        contained_classes = vertex.get_trim_contains()

        for container in within_classes:
            for contained in contained_classes:
                if container.get_identifier() != contained.get_identifier():
                    if contained not in container.get_trim_contains():
                        container.trim_contains.append(contained)
                    if container not in contained.get_trim_within():
                        contained.trim_within.append(container)

        # Remove the vertex from all neighbor relationships
        for cont in vertex.get_trim_contains():
            if vertex in cont.get_trim_within():
                cont.trim_within.remove(vertex)
        for within in vertex.get_trim_within():
            if vertex in within.get_trim_contains():
                within.trim_contains.remove(vertex)

        # Clear the vertex's relationships
        vertex.trim_contains = []
        vertex.trim_within = []
        return
            

    def delete_old_trimmed_network(self):
        """
        Resetting all values as if there wasn't any trimmed network
        """
        self.trimmed_network = []
        for c in self.classes:
            c.visible = False
            c.trim_contains = c.contains.copy()
            c.trim_within = c.within.copy()
        return
    
    def print_trimmed_network(self):
        """
        Printing the trimmed network
        """
        for c in [self.classes_dict[c] for c in self.trimmed_network]:
            print(f"{c.get_identifier()}: Contains: {c.get_trim_contains_identifiers()}, Within: {c.get_trim_within_identifiers()}")
        return
    
    def add_class_to_trimmed_network(self, class_identifier: str):
        class_identifier = class_identifier.lower()
        if class_identifier not in self.classes_dict:
            raise ValueError(f"Class {class_identifier} not found in the network")
        self.trimmed_network.append(class_identifier)
        self.classes_dict[class_identifier].visible = True
        self.new_trimmed_network(self.trimmed_network)
        return
    
    def remove_class_from_trimmed_network(self, class_identifier: str):
        class_identifier = class_identifier.lower()
        if class_identifier not in self.classes_dict:
            raise ValueError(f"Class {class_identifier} not found in the network")
        if class_identifier in self.trimmed_network:
            self.trimmed_network.remove(class_identifier)
            self.classes_dict[class_identifier].visible = False
            self.new_trimmed_network(self.trimmed_network)
        return
    
    def get_trimmed_network_json(self):
        network_dict = {"nodes": [], "links": []}
        if len(self.trimmed_network) == 0:
            return network_dict
        for c in self.trimmed_network:
            class_obj = self.classes_dict[c]
            network_dict["nodes"].append({"name": c, "label": class_obj.get_name(), "group": "A"})
            for cont in class_obj.get_trim_within():
                network_dict["links"].append({"source": c, "target": cont.get_identifier(), "type": "A"})
        return network_dict
    
    def get_checked_classes_dict(self):
        return {k:{'name':v.get_name(), 'value':v.visible} for k,v in self.classes_dict.items()}
    
    def get_trimmed_network(self):
        return self.trimmed_network.copy()
    
def variables_for_processing(trim_class_list: list, classes_dict: dict):
    node_queue = [trim_class_list[0]]
    tagged_vertex = {k:False for k in classes_dict.keys()}
    for tv in trim_class_list: tagged_vertex[tv] = True
    processed_vertex = {k:False for k in classes_dict.keys()}
    return node_queue, tagged_vertex, processed_vertex

if __name__ == "__main__":
    classes_dict = json.load(open('./classes.json'))['class_list']
    theorems_dict = json.load(open('./theorems.json'))['theorems']
    network = complexity_network()
    network.add_classes_from_dict(classes_dict)
    network.add_theorems_from_dict(theorems_dict)
    network.new_trimmed_network([c.get_identifier() for c in network.classes])
    network.print_trimmed_network()
    print("\n\n New network")
    network.new_trimmed_network(['BQP', 'NP', 'P', 'PP', 'PDQP', 'BPP', 'SZK', 'all'])
    network.print_trimmed_network()
    print("test")
    
