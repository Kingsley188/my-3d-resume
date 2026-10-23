"""Remove the character mesh without Blender; preserve node/animation indices."""
from pathlib import Path
import json
import struct

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / 'public/models/me.glb'
data = source.read_bytes()
magic, version, length = struct.unpack_from('<III', data)
assert magic == 0x46546C67 and version == 2 and length == len(data)
chunks = []
offset = 12
while offset < len(data):
    size, kind = struct.unpack_from('<II', data, offset)
    chunks.append((kind, data[offset + 8:offset + 8 + size]))
    offset += 8 + size
model = json.loads(chunks[0][1])
removed = {n['mesh'] for n in model['nodes'] if n.get('name') == 'man' and 'mesh' in n}
assert removed, 'Expected a mesh node named man'
for node in model['nodes']:
    if node.get('name') == 'man':
        node.pop('mesh', None)
        node.pop('skin', None)
        node.pop('weights', None)
# Keep empty transform nodes so cameras, animation targets and skin joints stay stable.
assert not any(n.get('mesh') in removed for n in model['nodes'] if 'mesh' in n)
mesh_map = {old: new for new, old in enumerate(i for i in range(len(model['meshes'])) if i not in removed)}
model['meshes'] = [mesh for i, mesh in enumerate(model['meshes']) if i not in removed]
for node in model['nodes']:
    if 'mesh' in node:
        node['mesh'] = mesh_map[node['mesh']]
encoded = json.dumps(model, ensure_ascii=False, separators=(',', ':')).encode()
encoded += b' ' * (-len(encoded) % 4)
chunks[0] = (chunks[0][0], encoded)
body = b''.join(struct.pack('<II', len(chunk), kind) + chunk for kind, chunk in chunks)
target = ROOT / 'rig/rig.glb'
target.parent.mkdir(exist_ok=True)
target.write_bytes(struct.pack('<III', magic, version, 12 + len(body)) + body)
print(f'rig/rig.glb: removed {len(removed)} character mesh; retained all node indices, cameras, animations and binary resources')
