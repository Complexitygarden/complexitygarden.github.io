from __future__ import annotations
"""
Object class for complexity classes
Below is an explanation for the variables:
    - name - Name of the class
    - identifier - String identifier of the class, usually the same as name, but we only use alphanumeric characters
    - description - Description of the class
    - Information - Further information about the class
"""

try:
    from .theorem import theorem, containment_theorem
except Exception as e:
    print(f"Error importing modules: {e}")
    from theorem import theorem, containment_theorem

class complexity_class():
    def __init__(self, def_dict, identifier: str, network = None) -> None:
        self.name = def_dict['name']
        self.identifier = identifier.lower()
        #self.full_name = def_dict['full_name']
        self.latex_name = def_dict['latex_name'] if 'latex_name' in def_dict else self.name
        self.description = def_dict['description'] if 'description' in def_dict else None
        self.information = def_dict['information'] if 'information' in def_dict else None
        self.theorems: list[theorem] = []
        self.contains: list[self] = []
        self.within: list[self] = []
        self.trim_contains: list[self] = []
        self.trim_within: list[self] = []
        self.visible: bool = False
        self.network: complexity_network = network # type: ignore
        self.level: int = -1
        self.x: int = -1
        self.y: int = -1
        self.max_level: int = -1
        return
    
    def get_identifier(self):
        return self.identifier
    
    def get_name(self):
        return self.name
    
    def get_latex_name(self):
        return self.latex_name
    
    def add_theorem(self, thm: theorem):
        """
        Adding a theorem which is connected to the class
        """
        if isinstance(thm, theorem):
            self.theorems.append(thm)
        if isinstance(thm, containment_theorem):
            self.process_containment_theorem()
        return
    
    def process_containment_theorem(self):
        thm = self.theorems[-1]
        if thm.small_class == self.identifier:
            self.within.append(self.network.get_class(thm.large_class))
            self.trim_within.append(self.within[-1])
        elif thm.large_class == self.identifier:
            self.contains.append(self.network.get_class(thm.small_class))
            self.trim_contains.append(self.contains[-1])
        return
    
    def get_within(self) -> list[complexity_class]:
        return self.within
    
    def get_contains(self) -> list[complexity_class]:
        return self.contains
    
    def get_neighbors(self) -> list[complexity_class]:
        return list(set(self.get_within() + self.get_contains()))
    
    def get_trim_within(self) -> list[complexity_class]:
        return self.trim_within
    
    def get_trim_within_identifiers(self) -> list[str]:
        return [c.get_identifier() for c in self.get_trim_within()]
    
    def get_trim_contains_identifiers(self) -> list[str]:
        return [c.get_identifier() for c in self.get_trim_contains()]
    
    def get_trim_contains(self) -> list[complexity_class]:
        return self.trim_contains
    
    def get_trim_neighbors(self) -> list[complexity_class]:
        return list(set(self.get_trim_within() + self.get_trim_contains()))
    
    def has_indirect_path(self, target: complexity_class, classes_dict: dict[str, complexity_class], visited: set[str] = None, disregard: list[str] = []) -> bool:
        """
        Check if there exists a path from this complexity class to target through other nodes
        """
        if visited is None:
            visited = {self.get_identifier()}
        # Checking immediate connections excluding direct path to target
        for intermediate in self.get_trim_contains():
            # Skipping over checking itself
            intermediate_id = intermediate.get_identifier()
            if intermediate_id == target.get_identifier() or intermediate_id in disregard:
                continue
            if intermediate_id not in visited:
                visited.add(intermediate_id)
                if target in intermediate.get_trim_contains() or intermediate.has_indirect_path(target, classes_dict, visited, disregard):
                    return True
        return False
    
    def get_description(self):
        return self.description
    
    def get_information(self):
        return self.information
    
    def get_level(self):
        return self.level
    
    def get_x(self):
        return self.x
    
    def get_y(self):
        return self.y
    
    def get_max_level(self):
        return self.max_level
    
    def set_level(self, level: int):
        if not isinstance(level, int):
            raise ValueError("Level must be an integer")    
        self.level = level
        return
    
    def set_max_level(self, max_level: int):
        self.max_level = max_level
    
    def get_classes_below(self) -> list[complexity_class]:
            nodes_above = self.get_trim_within()
            return [n for n in self.get_trim_contains() if n not in nodes_above]
    
    def find_all_paths(self, target: complexity_class, visited: set[str] = None) -> list[list[complexity_class]]:
        """
        Finds all paths between this class and the target class
        - If we are at a level below the target, we only move upwards
        - If we are at the same level, then we check both upwards and downwards directions
        """
        # Initialize visited set if None
        if visited is None:
            visited = set()
        
        # Add current node to visited
        visited.add(self.get_identifier())
        
        # Base case: if we've reached the target
        if self.get_identifier() == target.get_identifier():
            return [[self]]
        
        paths = []
        
        # If we're at a lower level than target, only look at nodes above us
        if self.level < target.level:
            # Get all nodes that contain this class (nodes above)
            for higher_node in self.get_within():
                if higher_node.identifier not in visited:
                    # Recursively find paths from the higher node to target
                    sub_paths = higher_node.find_all_paths(target, visited.copy())
                    # Add current node to the beginning of each found path
                    for path in sub_paths:
                        paths.append([self] + path)
        
        return paths
    
    def build_sunburst_hierarchy(self, processed = None, only_return_data = False):
        """
        Building the hierarchy for the sunburst visualization
        """
        if processed is None:
            processed = set()

        if self.get_identifier() in processed:
            return None
        
        processed.add(self.get_identifier())

        self_data = {
            "name": self.get_identifier(),
            "label": self.get_name(),
            "level": self.get_level(),
        }
        if only_return_data:
            return self_data
        self_data["children"] = []
        for child in self.get_trim_within():
            self_data["children"].append(child.build_sunburst_hierarchy(processed, (child.get_identifier() in processed)))

        return self_data

if __name__=='__main__':
    p_class = complexity_class({
            "name": "ALL",
            "contains": ["EXP"],
            "within": [],
            "top": True,
            "description": "The class of all languages.",
            "information": "ALL is the complexity class of all languages. ",
        }, "ALL")
    print('test')