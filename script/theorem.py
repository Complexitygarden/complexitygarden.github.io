"""
Defining the class for theorems
"""

VALID_THEOREMS = [
    "containment"
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
    

