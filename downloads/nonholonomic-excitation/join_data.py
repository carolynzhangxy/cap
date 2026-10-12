from pathlib import Path
import hashlib
root=Path(__file__).resolve().parent
parts=sorted(root.glob('simulation.npz.part*'))
assert len(parts)==7, 'Download all 7 parts into this folder first.'
p=root/'simulation.npz'
with p.open('wb') as output:
    for part in parts:output.write(part.read_bytes())
assert hashlib.sha256(p.read_bytes()).hexdigest()=='7f426e91329a36c9e80721b0ffd17de2f78f81a1a2c17ab43919943a3a86f2d8', 'Checksum mismatch'
print('Restored full-rate simulation.npz; SHA-256 verified.')
