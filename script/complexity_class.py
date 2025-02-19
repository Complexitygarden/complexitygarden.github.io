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
        self.description = def_dict['description'] if 'description' in def_dict else None
        self.information = def_dict['information'] if 'information' in def_dict else None
        self.theorems: list[theorem] = []
        self.contains: list[self] = []
        self.within: list[self] = []
        self.trim_contains: list[self] = []
        self.trim_within: list[self] = []
        self.visible: bool = False
        self.network: complexity_network = network # type: ignore
        return
    
    def get_identifier(self):
        return self.identifier
    
    def get_name(self):
        return self.name
    
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
    
    def has_indirect_path(self, target: complexity_class, classes_dict: dict[str, complexity_class], visited: set[str] = None) -> bool:
        """
        Check if there exists a path from this complexity class to target through other nodes
        """
        if visited is None:
            visited = {self.get_identifier()}
        # Checking immediate connections excluding direct path to target
        for intermediate in self.get_trim_contains():
            # Skipping over checking itself
            intermediate_id = intermediate.get_identifier()
            if intermediate_id == target.get_identifier():
                continue
            if intermediate_id not in visited:
                visited.add(intermediate_id)
                if target in intermediate.get_trim_contains() or intermediate.has_indirect_path(target, classes_dict, visited):
                    return True
        
        return False
    
    def get_description(self):
        return self.description
    
    def get_information(self):
        return self.information
            
            

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