#!/usr/bin/env python
# coding: utf-8

# In[10]:


import streamlit as st
import re



# Directed acyclic graph of complexity classes
graph = {
    'ALL': ['EXP', 'Ppoly'],
    'AM': ['SZK', 'MA'],
    'BPP': ['P'],
    'BQP': ['BPP'],
    'coNP': ['P'],
    'EXP': ['PSPACE'],
    'L': ['AC0'],
    'MA': ['BPP', 'NP'],
    'NC': ['L'],
    'NP': ['P'],
    'P': ['NC'],
    'PH': ['AM', 'coNP'],
    'PP': ['BQP', 'MA', 'coNP'],
    'Ppoly': ['BPP'],
    'PSPACE': ['P#P'],
    'P#P': ['PH', 'PP']    
}

# Dictionary to store the messages for each class
messages = {('P', 'NP'): 'There exists an oracle w.r.t which P is not equal to NP',
            ('NP','P'): 'There exists an oracle w.r.t which P is not equal to NP',
           ('PH','NP'): 'There exists an oracle w.r.t which PH is not equal to NP',
            ('NP','PH'): 'There exists an oracle w.r.t which PH is not equal to NP',
           ('PH','P'): 'There exists an oracle w.r.t which PH is not equal to P',
            ('P','PH'): 'There exists an oracle w.r.t which PH is not equal to P',
           ('BQP', 'PH'): 'There exists an oracle w.r.t which BQP is not equal to PH',
            ('PH','BQP'): 'There exists an oracle w.r.t which BQP is not equal to PH',
           ('BQP','QCMA'): 'There exists an oracle w.r.t which BQP is equal to QCMA',
            ('QCMA','BQP'): 'There exists an oracle w.r.t which BQP is equal to QCMA',
           ('BQP','BPP'): 'There exists an oracle w.r.t which BPP is not equal to BQP',
            ('BPP','BQP'): 'There exists an oracle w.r.t which BPP is not equal to BQP',
           ('NP','BQP'): 'There exists an oracle w.r.t which NP is not equal to BQP',
            ('BQP','NP'): 'There exists an oracle w.r.t which NP is not equal to BQP',
           ('PPAD','BQP'): 'There exists an oracle relative to which PPAD is not contained in BQP',
            ('BQP','PPAD'):'There exists an oracle relative to which PPAD is not contained in BQP',
           ('PPP','PPAD'): 'There exists an oracle relative to which PPP is not contained in PPAD',
            ('PPAD','PPP'):'There exists an oracle relative to which PPP is not contained in PPAD'}

# Function to perform a depth-first search
def dfs(graph, start, target, visited=None, path=None):
    if visited is None:
        visited = set()
    if path is None:
        path = []
    path = path + [start]
    if start == target:
        return path
    if start not in graph:
        return None
    for node in graph[start]:
        if node not in visited:
            newpath = dfs(graph, node, target, visited, path)
            if newpath:
                return newpath

# Function to find the shortest path between two classes
def shortest_path(graph, messages, start, target):
    # Find the shortest path using DFS
    path = dfs(graph, start, target)
    # If no path exists, try swapping the start and target classes
    if path is None:
        path = dfs(graph, target, start)
        start, target = target, start
    # If a path still doesn't exist, return an error message
    if path is None:
        return f"No known relation exists between {start} and {target}"
    path = path[::-1]
    # Print the messages associated with each edge in the shortest path
    distance = len(path)-1 
    output = f"{target} is in {start}: {'⊆'.join(path)} \n"
    for i in range(distance):
        edge = (path[i], path[i+1])
        if edge in messages:
            output += f"\n {edge[0]} -> {edge[1]}: {messages[edge]}\n"
    return output

# Streamlit app
st.title("Complexity Class Graph")
start_class = st.selectbox("Select start class", options=list(graph.keys()))
target_class = st.selectbox("Select target class", options=list(graph.keys()))
output = shortest_path(graph, messages, start_class, target_class)

# Print the output with a hyperlink to a Google Form
google_form_link = "https://docs.google.com/forms/d/e/1FAIpQLSfdJ4vR0gppBi1_TAnrezB0W_xUZpdk3w8yfrHOm4s63y-gXg/viewform?usp=sf_link"
output_with_link = f"{output}\n\n[Click here to suggest corrections.]({google_form_link})"
st.markdown(output_with_link, unsafe_allow_html=True)

import sqlite3
from datetime import datetime

# Connect to the SQLite database #display it in frontend
conn = sqlite3.connect('search_history.db')
c = conn.cursor()

# Create the search history table if it doesn't exist
c.execute('''CREATE TABLE IF NOT EXISTS search_history
             (id INTEGER PRIMARY KEY AUTOINCREMENT,
             search_term TEXT,
             timestamp TEXT)''')
conn.commit()

# Function to fetch and store search history
@st.cache(allow_output_mutation=True)
def update_search_history(search_term):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    c.execute("INSERT INTO search_history (search_term, timestamp) VALUES (?, ?)", (search_term, timestamp))
    conn.commit()
    c.execute("SELECT * FROM search_history")
    search_history = c.fetchall()
    return search_history

# Streamlit app
def main():
    st.title("Search History")
    
    # Search input
    search_term = st.text_input("Enter a search term:")
    
    # Update search history and display
    if st.button("Search"):
        search_history = update_search_history(search_term)
        st.table(search_history)


# In[ ]:





# In[ ]:




