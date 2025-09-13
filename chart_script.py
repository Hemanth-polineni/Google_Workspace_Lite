import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np

# Define architecture layers with components
layers_data = [
    {"name": "Client Apps", "components": ["Web Browser", "Mobile App", "Desktop App"], "color": "#1FB8CD"},
    {"name": "Load Balancer", "components": ["NGINX/AWS ALB"], "color": "#DB4545"},
    {"name": "WebSocket Srvs", "components": ["Socket.io Srv1", "Socket.io Srv2", "Socket.io SrvN"], "color": "#2E8B57"},
    {"name": "App Servers", "components": ["Node.js+Exp 1", "Node.js+Exp 2", "Node.js+Exp N"], "color": "#5D878F"},
    {"name": "Redis Cache", "components": ["Redis Cluster"], "color": "#D2BA4C"},
    {"name": "Database", "components": ["MongoDB", "PostgreSQL"], "color": "#B4413C"},
    {"name": "File Storage", "components": ["AWS S3"], "color": "#964325"}
]

fig = go.Figure()

# Create layered architecture using horizontal bars
y_positions = list(range(len(layers_data)))
y_positions.reverse()  # Top to bottom

# Add layer backgrounds as horizontal bars
for i, layer in enumerate(layers_data):
    y_pos = y_positions[i]
    
    # Add background bar for the layer
    fig.add_trace(go.Bar(
        x=[10],
        y=[layer["name"]],
        orientation='h',
        marker=dict(color=layer["color"], opacity=0.3),
        showlegend=False,
        hoverinfo='skip'
    ))
    
    # Add components as individual bars within the layer
    num_components = len(layer["components"])
    component_width = 8 / max(num_components, 1)
    
    for j, component in enumerate(layer["components"]):
        x_offset = 1 + (j * component_width) + (component_width / 2)
        
        fig.add_trace(go.Bar(
            x=[component_width * 0.8],
            y=[layer["name"]],
            orientation='h',
            base=[x_offset - (component_width * 0.4)],
            marker=dict(color=layer["color"], opacity=0.8),
            text=[component],
            textposition='inside',
            textfont=dict(color='white', size=10),
            showlegend=False,
            hovertemplate=f'{component}<extra></extra>'
        ))

# Add flow arrows using scatter plot with custom markers
flow_connections = [
    ("Client Apps", "Load Balancer", "HTTPS/WSS", 9.5),
    ("Load Balancer", "WebSocket Srvs", "WSS", 9.5),
    ("WebSocket Srvs", "App Servers", "HTTP/RPC", 9.5),
    ("App Servers", "Redis Cache", "Redis Proto", 9.5),
    ("App Servers", "Database", "TCP/SQL", 7.5),
    ("App Servers", "File Storage", "HTTPS", 5.5)
]

layer_names = [layer["name"] for layer in layers_data]

for from_layer, to_layer, protocol, x_pos in flow_connections:
    if from_layer in layer_names and to_layer in layer_names:
        from_idx = layer_names.index(from_layer)
        to_idx = layer_names.index(to_layer)
        
        # Add arrow using scatter plot
        fig.add_trace(go.Scatter(
            x=[x_pos, x_pos],
            y=[from_layer, to_layer],
            mode='lines+markers',
            line=dict(color='black', width=2),
            marker=dict(
                symbol=['circle', 'triangle-down'],
                size=[4, 8],
                color='black'
            ),
            showlegend=False,
            hovertemplate=f'{protocol}<extra></extra>'
        ))

# Add protocol labels
protocol_labels = ["HTTPS/WSS", "WSS", "HTTP/RPC", "Redis Proto", "TCP/SQL", "HTTPS"]
x_label_pos = [9.7, 9.7, 9.7, 9.7, 7.7, 5.7]
y_label_pos = ["Load Balancer", "WebSocket Srvs", "App Servers", "Redis Cache", "Database", "File Storage"]

for i, (protocol, x_pos, y_pos) in enumerate(zip(protocol_labels, x_label_pos, y_label_pos)):
    fig.add_trace(go.Scatter(
        x=[x_pos],
        y=[y_pos],
        mode='text',
        text=[protocol],
        textfont=dict(size=9, color='black'),
        showlegend=False,
        hoverinfo='skip'
    ))

# Update layout
fig.update_layout(
    title='Collab Doc Platform Architecture',
    xaxis=dict(
        range=[0, 11],
        showgrid=False,
        showticklabels=False,
        zeroline=False
    ),
    yaxis=dict(
        categoryorder='array',
        categoryarray=layer_names,
        showgrid=False,
        tickfont=dict(size=12)
    ),
    barmode='overlay',
    showlegend=False,
    plot_bgcolor='white',
    paper_bgcolor='white'
)

# Save the chart
fig.write_image("architecture_diagram.png")