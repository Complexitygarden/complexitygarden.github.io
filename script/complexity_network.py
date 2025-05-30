"""
Defining the class for the entire complexity network
 - Trimmed network = The network which is displayed on the screen
"""

# Imports
try:
    from .complexity_class import complexity_class
    from .theorem import theorem, containment_theorem, equality_theorem, group_equality_theorems
    from .theorem import VALID_THEOREMS
except Exception as e:
    print(f"Error importing modules: {e}")
    from complexity_class import complexity_class
    from theorem import theorem, containment_theorem, equality_theorem, group_equality_theorems
    from theorem import VALID_THEOREMS
import json
import copy
import math

class complexity_network():
    def __init__(self) -> None:
        self.classes: list[complexity_class] = []
        self.classes_identifiers: list[str] = []
        self.classes_dict: dict[str, complexity_class] = {}
        self.theorems: list[theorem] = []
        self.trimmed_network = []
        self.visualized_trimmed_network = {} # These are the values which are showcased
        self.max_avg_level = -1
        self.min_level = -1
        self.max_max_level = -1
        self.update_location = True
        self.set_root_and_top_nodes()
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
    
    def get_class(self, class_name: str, raise_error: bool = True):
        if class_name not in self.classes_dict:
            if raise_error:
                raise ValueError(f"Class {class_name} not found in the network")
            else:
                return None
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
            elif thm_dict['type'] == 'equality':
                thm = equality_theorem(thm_dict)
            if thm.is_valid():
                self.add_theorem(thm)

        # Plan: Checking if two inclusions imply an equality
        self.process_equality_theorems()
        return
    
    def process_equality_theorems(self):
        """
        Processing the equality theorems
        """
        equality_theorems = []
        for thm in self.theorems:
            if isinstance(thm, equality_theorem):
                equality_theorems.append(thm)

        groupped_equality_theorems, main_classes = group_equality_theorems(equality_theorems, self.classes_dict)
        
        # Setting the main classes
        for main_class, class_list in zip(main_classes, groupped_equality_theorems):
            self.classes_dict[main_class].is_main_class = True
            for class_name in class_list:
                self.classes_dict[class_name].main_class = main_class
                self.classes_dict[class_name].equals = [c for c in class_list if c != class_name]
            self.classes_dict[main_class].move_connections_to_main_class()



    def new_trimmed_network(self, class_list: list[str]):
        """
        Creating a new trimmed network - we only keep the classes in class_list
        """
        self.delete_old_trimmed_network()
        #print(f"Class list: {class_list}")
        class_list = self.process_trimmed_class_list(class_list)
        #print(f"Class list: {class_list}")
        # Deleting the old network

        """
        We will update the class_list so that we only keep the main classes and to each main class, we add which classes
        that are in class_list it is equal to (for the visualisation).

        When we delete a class, then we will delete the class from the class_list and update the main classes
        """


        self.trimmed_network = copy.deepcopy(class_list)

        # Basic cases
        if len(class_list) == 0:
            return
        # elif len(class_list) == 1:
        #     self.classes_dict[class_list[0]].visible = True
        # elif len(class_list) == len(self.classes):
        #     for c in self.classes:
        #         c.visible = True
        #         c.trim_contains = c.contains.copy()
        #         c.trim_within = c.within.copy()

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
            neighbors = list(set(current_class.get_trim_neighbors_objects()))
            neighbor_names = [n.get_identifier() for n in neighbors]
            for neighbor in neighbor_names:
                # Adding unprocessed neighbors
                if not processed_vertex[neighbor]:
                    node_queue.append(neighbor)
            if not tagged_vertex[current_class_identifier]:
            #     current_class.visible = True
            # else:
                self.turn_vertex_into_edge(current_class)

        # Dropping direct edges
        pairs_to_delete = []
        for source in [self.classes_dict[c] for c in class_list]:
            for target in source.get_trim_contains_objects():
                ##print(f'Checking: {source.name} - {target.name}')
                if source.has_indirect_path(target, self.classes_dict):
                    pairs_to_delete.append((source, target))

        for pair in pairs_to_delete:
            pair[0].trim_contains.remove(pair[1].get_identifier())
            pair[1].trim_within.remove(pair[0].get_identifier())

        self.set_root_and_top_nodes()

        self.set_visible_classes()
        return

    def set_root_and_top_nodes(self):
        """
        Setting the root and top nodes
        """
        self.root_nodes = []
        self.top_nodes = []
        if len(self.trimmed_network) == 0:
            return
        self.root_nodes = [self.classes_dict[c].get_identifier() for c in self.trimmed_network if len(self.classes_dict[c].get_trim_within_objects()) == 0]
        self.top_nodes = [self.classes_dict[c].get_identifier() for c in self.trimmed_network if len(self.classes_dict[c].get_trim_contains_objects()) == 0]
        return
    
    def set_visible_classes(self):
        """
        Setting the visible classes based on the trimmed network
        """
        vis_classes = self.get_visualized_classes()
        for c in vis_classes:
            self.classes_dict[c].visible = True
        return

    def process_trimmed_class_list(self, class_list: list[str]):
        """
        Processing the trimmed class list
        - Essentially, replacing the classes with their main classes
        TO DO: Add ordering based on how important the class is
        """
        if len(class_list) == 0:
            return []
        class_list = [c.lower() for c in class_list]
        graph_class_list = [] # The classes we are visualising
        vis_dict = {}

        for class_name in class_list:
            main_class = (self.get_class(class_name)).get_main_class()
            graph_class_list.append(main_class)
            if main_class in vis_dict:
                vis_dict[main_class].append(class_name)
            else:
                vis_dict[main_class] = [class_name]
        graph_class_list = list(set(graph_class_list)) # Dropping repeats
        self.visualized_trimmed_network = vis_dict
        #print(self.visualized_trimmed_network)

        # Setting the trim_main_class for the classes which are the main class
        for main_class in vis_dict.keys():
            if main_class not in vis_dict[main_class]:
                self.classes_dict[main_class].trim_main_class = vis_dict[main_class][0]
            else:
                self.classes_dict[main_class].trim_main_class = None
        return graph_class_list

    def turn_vertex_into_edge(self, vertex: complexity_class):
        within_classes = vertex.get_trim_within_objects()
        contained_classes = vertex.get_trim_contains_objects()

        for contained in contained_classes:
            for within in within_classes:
                if within.get_identifier() != contained.get_identifier():
                    if contained not in within.get_trim_contains_objects():
                        within.trim_contains.append(contained.get_identifier())
                    if within not in contained.get_trim_within_objects():
                        contained.trim_within.append(within.get_identifier())
        for contained in contained_classes:
            if vertex in contained.get_trim_within_objects():
                contained.trim_within.remove(vertex.get_identifier())
        for within in within_classes:
            if vertex in within.get_trim_contains_objects():
                within.trim_contains.remove(vertex.get_identifier())

        # Clear the vertex's relationships
        vertex.trim_contains = []
        vertex.trim_within = []
        return
            

    def delete_old_trimmed_network(self):
        """
        Resetting all values as if there wasn't any trimmed network
        """
        self.trimmed_network = []
        self.visualized_trimmed_network = {}
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
            print(f"{c.get_identifier()}: Contains: {c.get_trim_contains_identifiers()}, Within: {c.get_trim_within_identifiers()}, Level: {c.level}")
        return
    
    def add_class_to_trimmed_network(self, class_identifier: str):
        """
        TO DO: Improve this a little bit, I'm just lazy atm
        """
        class_identifier = class_identifier.lower()
        if class_identifier not in self.classes_dict:
            raise ValueError(f"Class {class_identifier} not found in the network")
        trimmed_network = list(set(self.get_visualized_classes() + [class_identifier]))
        # self.trimmed_network.append(class_identifier)
        self.classes_dict[class_identifier].visible = True
        self.new_trimmed_network(trimmed_network)
        return
    
    def get_visualized_classes(self) -> list:
        return [c for cl in self.visualized_trimmed_network.values() for c in cl]
    
    def remove_class_from_trimmed_network(self, class_identifier: str):
        """
        Removing a class from the trimmed network
        David note: This can be made more efficient by not recalculating the entire network
        """
        class_identifier = class_identifier.lower()
        if class_identifier not in self.classes_dict:
            raise ValueError(f"Class {class_identifier} not found in the network")
        vis_classes = self.get_visualized_classes()
        if class_identifier in vis_classes:
            vis_classes.remove(class_identifier)
            self.classes_dict[class_identifier].visible = False
            self.new_trimmed_network(vis_classes)
            self.update_location = False
        return
    
    def get_trimmed_network_json(self):
        network_dict = {"nodes": [], "links": []}
        if len(self.trimmed_network) == 0:
            return network_dict
        """
        Updating locations - only if requested, otherwise we don't, but enable updating it next time
        TO DO: Update the names so that only those selected ones are shown, not the main ones
        """
        if self.update_location:
            self.set_positions()
        else:
            self.update_location = True
        vis_classes = self.get_visualized_classes()
        for c in self.trimmed_network:
            class_obj, equal_classes = self.classes_dict[c], []
            class_name, class_latex_name, class_label = c, class_obj.get_latex_name(), class_obj.get_name()
            #print(self.visualized_trimmed_network)

            # Setting the equal classes
            if not((len(self.visualized_trimmed_network[c]) == 1) and (c in vis_classes)):
                equal_classes = [{'name': c_name, 'latex_name': self.classes_dict[c_name].get_latex_name(), 'label': self.classes_dict[c_name].get_name()} for c_name in self.visualized_trimmed_network[c] if c_name != c]
            # The case when the main class is not in the trimmed network
            if not class_obj.is_trimmed_main_class():
                class_name = equal_classes[0]['name']
                class_latex_name = equal_classes[0]['latex_name']
                class_label = equal_classes[0]['label']
                equal_classes.pop(0)
            network_dict["nodes"].append({
                "name": class_name,
                "label": class_label,
                "savedX": class_obj.get_x()/1000,
                "savedY": class_obj.get_y()/1000,
                "level": class_obj.get_level(),
                "latex_name": class_latex_name,
                "equal_classes": equal_classes
            })
            for cont in class_obj.get_trim_within_objects():
                network_dict["links"].append({
                    "source": class_name,
                    "target": cont.get_link_identifier()
                })
        network_dict["root_nodes"] = self.root_nodes
        network_dict["top_nodes"] = self.top_nodes
        network_dict["maxLevel"] = self.max_avg_level
        return network_dict
    
    def get_trimmed_sunburst_json(self):
        """
        Creates a JSON structure where each class spans across its levels.
        """
        if len(self.trimmed_network) == 0:
            return {"success": True, "data": {"name": "root", "children": []}}
        
        self.set_levels()

        # Calculate the level range for each class
        class_ranges = {}
        for class_name in self.trimmed_network:
            class_obj = self.classes_dict[class_name]

            # Find the highest level (classes that contain this one)
            max_level = class_obj.get_max_level()
            #print(f"Max level: {class_name}: {max_level}")
            
            # Find the lowest level (classes this one contains)
            min_level = [contained.get_max_level() + 1 for contained in class_obj.get_trim_contains_objects()] + [max_level]
            min_level = min(min_level)
            #print(f"Min level: {class_name}: {min_level}")
            
            class_ranges[class_name] = {
                "min_level": min_level,
                "max_level": max_level,
                "span": max_level - min_level + 1
            }

        # Create nodes that span their full range
        nodes = []
        for class_name, range_info in class_ranges.items():
            class_obj = self.classes_dict[class_name]
            nodes.append({
                "name": class_obj.get_identifier(),
                "label": class_obj.get_name(),
                "level_start": range_info["min_level"],
                "level_end": range_info["max_level"],
                "contains": [c.get_identifier() for c in class_obj.get_trim_contains_objects()],
                "within": [c.get_identifier() for c in class_obj.get_trim_within_objects()]
            })
            nodes[-1]["contains_level"] = {c: self.classes_dict[c].get_max_level() for c in nodes[-1]["contains"]}
            nodes[-1]["within_level"] = {c: self.classes_dict[c].get_max_level() for c in nodes[-1]["within"]}

        return {"success": True, "data": {
            "name": "root",
            "children": nodes,
            "max_level": max(r["max_level"] for r in class_ranges.values()) if class_ranges else 0
        }}

    def get_checked_classes_dict(self):
        return {
            k: {
                'name': v.get_name(),
                'value': v.visible,
                'latex_name': v.get_latex_name()
            } for k, v in self.classes_dict.items()
        }
    
    def get_trimmed_network(self):
        return self.trimmed_network.copy()
    
    def set_levels(self):
        """
        Setting the levels of the classes
        - Calculates levels based on both top-down and bottom-up traversal
        - Final level is the average of both approaches
        - Root nodes (top) have highest level numbers
        - Leaf nodes (bottom) have level 0
        """
        if len(self.trimmed_network) == 0:
            return

        # Reset all levels to -1
        for c in self.classes:
            c.set_level(-1)

        # Find root nodes (no nodes contain them) and leaf nodes (they don't contain any nodes)
        root_nodes = []
        leaf_nodes = []
        for class_name in self.trimmed_network:
            class_obj = self.classes_dict[class_name]
            if not any(within.visible for within in class_obj.get_trim_within_objects()):
                root_nodes.append(class_name)
            if not any(contains.visible for contains in class_obj.get_trim_contains_objects()):
                leaf_nodes.append(class_name)
        
        # Calculate minimum levels (from bottom up)
        min_levels = {}
        for leaf in leaf_nodes:
            min_levels[leaf] = 0
        
        # Process queue for bottom-up
        queue = leaf_nodes.copy()
        while queue:
            current = queue.pop(0)
            current_level = min_levels[current]
            current_obj = self.classes_dict[current]
            
            for source in current_obj.get_trim_within_objects():
                source_name = source.get_identifier()
                if source_name not in min_levels or min_levels[source_name] < current_level + 1:
                    min_levels[source_name] = current_level + 1
                    queue.append(source_name)

        # Calculate maximum levels (from top down)
        max_levels = {}
        max_level = max(min_levels.values()) if min_levels else 0
        for root in root_nodes:
            max_levels[root] = max_level
        
        # Process queue for top-down
        queue = root_nodes.copy()
        while queue:
            current = queue.pop(0)
            current_level = max_levels[current]
            current_obj = self.classes_dict[current]
            
            for target in current_obj.get_trim_contains_objects():
                target_name = target.get_identifier()
                if target_name not in max_levels or max_levels[target_name] > current_level - 1:
                    max_levels[target_name] = current_level - 1
                    queue.append(target_name)

        # Set each node's level to the average of its min and max levels
        self.max_avg_level, self.max_max_level = 0, 0
        levels = {}
        for class_name in self.trimmed_network:
            class_obj = self.classes_dict[class_name]
            min_level = min_levels.get(class_name, 0)
            max_level = max_levels.get(class_name, max_level)
            avg_level = math.ceil((min_level + max_level) / 2)
            class_obj.set_max_level(max_level)
            class_obj.set_level(avg_level)
            if avg_level not in levels:
                levels[avg_level] = []
            levels[avg_level].append(class_obj)
            self.max_avg_level = max(self.max_avg_level, avg_level)
            self.max_max_level = max(self.max_max_level, max_level)

        self.min_level = 0

        # Setting the mid_levels - only for classes which are not in the trimmed network
        for level in sorted(levels.keys()):
            for class_obj in levels[level]:
                for class_within in class_obj.get_trim_within_objects():
                    if class_within.get_level() == -1:
                        class_obj.level = level

    def set_positions(self):
        """
        Setting the levels and positions of the classes
        - The level is calculated as the average of:
          1. Distance from top (nodes with no containers)
          2. Distance from bottom (nodes that don't contain anything)
        - X positions are calculated to minimize edge crossings using barycenter method
        """
        if len(self.trimmed_network) == 0:
            return
        self.set_levels()

        # Get visible nodes and their levels
        nodes_per_level = {}
        max_level = 0
        for class_id in self.trimmed_network:
            class_obj = self.classes_dict[class_id]
            level = class_obj.get_level()
            if level not in nodes_per_level:
                nodes_per_level[level] = []
            nodes_per_level[level].append(class_obj)
            max_level = max(max_level, level)

        # Sort levels from top to bottom
        sorted_levels = sorted(nodes_per_level.keys())
        width = 1000
        height = 1000

        # First pass: top to bottom
        for i in range(len(sorted_levels)):
            current_level = sorted_levels[i]
            current_nodes = nodes_per_level[current_level]
            
            if i == 0:
                # For the first level, just space nodes evenly
                for idx, node in enumerate(current_nodes):
                    node.x = width * (idx + 1) / (len(current_nodes) + 1)
            else:
                # Calculate barycenter for each node
                node_positions = []
                for node in current_nodes:
                    connected_nodes = node.get_classes_below()
                    if connected_nodes:
                        barycenter = sum(n.x for n in connected_nodes) / len(connected_nodes)
                    else:
                        # If no connections, place based on position in list
                        barycenter = width * (len(node_positions) + 1) / (len(current_nodes) + 1)
                    node_positions.append((node, barycenter))
                
                # Sort nodes by their barycenter
                node_positions.sort(key=lambda x: x[1])
                
                # Assign x positions while maintaining minimum spacing
                min_spacing = width / (len(current_nodes) + 1)
                for idx, (node, _) in enumerate(node_positions):
                    node.x = min_spacing * (idx + 1)

            sorted_nodes = sorted(current_nodes, key=lambda x: x.x)
            # for node in sorted_nodes:
            #     #print(f"{node.get_identifier()}: {node.x}")

        # # Second pass: bottom to top (averaging with first pass positions)
        for i in range(len(sorted_levels) - 1, -1, -1):
            current_level = sorted_levels[i]
            current_nodes = nodes_per_level[current_level]
            
            if i == len(sorted_levels) - 1:
                continue  # Skip bottom level as it's already positioned
            
            next_level = sorted_levels[i+1]
            next_nodes = nodes_per_level[next_level]
            
            # Calculate and average with bottom-up barycenter
            for node in current_nodes:
                connected_nodes = [n for n in next_nodes if (n in node.get_trim_contains_objects() or node in n.get_trim_within_objects())]
                if connected_nodes:
                    bottom_up_barycenter = sum(n.x for n in connected_nodes) / len(connected_nodes)
                    # Average with current position
                    node.x = (node.x + bottom_up_barycenter) / 2

        # Set y positions based on levels
        for level, nodes in nodes_per_level.items():
            level_spacing = height*(0.5)
            y_pos = (max_level - level) * level_spacing + level_spacing/2
            # randomize_level: bool = len(nodes) > 1
            for node in nodes:
                node.y = y_pos
                node.x = node.x * 2
                # Idea - randomizing the nodes to avoid having all edges overlay since way may often have the same edges go over each other
                # if randomize_level:
                    # node.x = node.x * (1 + random.random()/10)

    def expand_edge(self, source_class: str, target_class: str):
        """
        Expanding an edge between two classes
        """
        source_class = source_class.lower()
        target_class = target_class.lower()
        
        # Checking if the classes and edges exist
        if source_class not in self.classes_dict or target_class not in self.classes_dict:
            raise ValueError(f"Class {source_class} or {target_class} not found in the network")
        else:
            source_class_obj = self.classes_dict[source_class]
            target_class_obj = self.classes_dict[target_class]
        if target_class not in source_class_obj.get_trim_within_identifiers():
            raise ValueError(f"Edge {source_class} -> {target_class} not found in the network")
        
        if target_class_obj in source_class_obj.get_within_objects():
            #print(f"Edge {source_class} -> {target_class} already exists")
            return False, []
        
        # Finding all paths between the two classes
        paths = self.find_all_paths(source_class_obj, target_class_obj)

        # Add all of these nodes to the trimmed network
        new_classes = list(set([p.get_identifier() for path in paths for p in path if p.get_identifier() not in self.trimmed_network]))
        self.new_trimmed_network(self.trimmed_network + new_classes)
        return True, [c.upper() for c in new_classes]
        
    def find_all_paths(self, source_class_obj: complexity_class, target_class_obj: complexity_class):
        """
        Finding all paths between two classes
        """
        paths = source_class_obj.find_all_paths(target_class_obj)
        # for path in paths:
        #     #print(" -- ".join([p.get_identifier() for p in path]))
        return paths
    
    def expand_node(self, class_name: str):
        """
        Expanding a node
        """
        class_name = class_name.lower()
        if class_name not in self.classes_dict:
            raise ValueError(f"Class {class_name} not found in the network")
        class_obj = self.classes_dict[class_name]
        neighbors = [c.get_identifier() for c in class_obj.get_neighbors_objects()]
        connected_classes = [c for c in neighbors if c not in self.trimmed_network]
        equal_classes = [c.get_identifier() for c in class_obj.get_equal_classes() if c.get_identifier() not in self.trimmed_network]
        if len(connected_classes) == 0 and len(equal_classes) == 0:
            #print(f"No new classes to add from {class_name}")
            return False, []
        self.new_trimmed_network(self.trimmed_network + connected_classes + equal_classes)
        return True, [c.upper() for c in connected_classes]

    def get_direct_paths(self, class_name: str):
        """
        Checking if there are indirect paths that go through this class

        Essentially, we want to ensure that when we delete a class, other classes which are connected through this class remain connected
        """
        class_name = class_name.lower()
        if class_name not in self.classes_dict:
            raise ValueError(f"Class {class_name} not found in the network")
        class_obj = self.classes_dict[class_name]

        direct_paths = []
        for c_top in class_obj.get_trim_within_objects():
            for c_bottom in class_obj.get_trim_contains_objects():
                if c_top.get_identifier() == class_name or c_bottom.get_identifier() == class_name or c_top.get_identifier() == c_bottom.get_identifier():
                    # print(f"These classes are the same: {c_top.get_identifier()} and {c_bottom.get_identifier()}")
                    continue
                if c_top.has_indirect_path(c_bottom, self.classes_dict, disregard=[class_obj.get_identifier()]):
                    # print(f"Indirect path found between {c_top.get_identifier()} and {c_bottom.get_identifier()}")
                    continue
                else:
                    direct_paths.append([c_bottom.get_identifier(), c_top.get_identifier()])
        #print(f"Direct paths: {direct_paths}")
        return direct_paths
    
    def find_cycles(self):
        """
        Checking for cycles -> Which mean that two classes are equal.
        Returns a list of pairs of class identifiers that form cycles (are equal).
        TO DO: Make this more efficient and find the actual cycle via indirect paths
        """
        cycles = []
        
        # Checking for cycles by checking when there is an indirect path going down by using a class above.
        for class_id in self.classes_identifiers:
            class_obj = self.classes_dict[class_id]
            for target in class_obj.get_contains_objects():
                # Check direct connections
                if target.get_identifier() in class_obj.get_within_identifiers():
                    cycles.append((class_id, target.get_identifier()))
                # Checking for indirect paths
                else:
                    if target.has_indirect_path(class_obj, self.classes_dict, disregard=[class_id]):
                        a,b = class_id, target.get_identifier()
                        if a>b: a,b = b,a
                        cycles.append((a,b))
        # Ordering the connected classes
        cycles = sorted(cycles, key=lambda x: x[0])
        return cycles
    
    def find_classes_which_collapse(self):
        """
        Given the current state of the network, we want to find which classes collapse onto each other based on the containments
        """
        equal_classes = []
        cycles = self.find_cycles()
        for cycle in cycles:
            found_other_classes = False
            for ec in equal_classes:
                if any(c in cycle for c in ec):
                    found_other_classes = True
                    ec.add(cycle[0])
                    ec.add(cycle[1])
                    break
            if not found_other_classes:
                equal_classes.append(set([c for c in cycle]))
        return equal_classes
    
    def find_redundant_containments(self):
        """
        Finding redundant containments - ones where we have a direct and indirect containment
        """
        redundant_containments = []
        old_trimmed_network = self.get_visualized_classes()
        self.new_trimmed_network(self.get_all_class_identifiers())
        for class_obj in self.classes_dict.values():
            trim_contains = class_obj.get_trim_contains_identifiers()
            for c_top in class_obj.get_contains_identifiers():
                if c_top not in trim_contains:
                    redundant_containments.append((c_top, class_obj.get_identifier()))
        self.new_trimmed_network(old_trimmed_network)
        return redundant_containments


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
    network.set_positions()
    network.print_trimmed_network()
    #print("\n\n New network")
    network.new_trimmed_network(['BQP', 'NP', 'P', 'PP', 'PDQP', 'BPP', 'SZK', 'all'])
    network.set_positions()
    network.print_trimmed_network()
    #print("test")
    
