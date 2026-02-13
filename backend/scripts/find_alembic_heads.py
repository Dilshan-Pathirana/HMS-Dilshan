
import os
import ast
import glob

def get_revision_info(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        try:
            tree = ast.parse(f.read())
        except Exception:
            return None, None
            
        revision = None
        down_revision = None
        
        for node in tree.body:
            if isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Name):
                        if target.id == 'revision':
                            if isinstance(node.value, ast.Constant):
                                revision = node.value.value
                        elif target.id == 'down_revision':
                            if isinstance(node.value, ast.Constant):
                                down_revision = node.value.value
                            elif isinstance(node.value, ast.Tuple):
                                down_revision = [elt.value for elt in node.value.elts]
                                
        return revision, down_revision

def find_heads(versions_dir):
    revisions = {}
    down_revisions = set()
    
    files = glob.glob(os.path.join(versions_dir, "*.py"))
    
    for f in files:
        rev, down = get_revision_info(f)
        if rev:
            revisions[rev] = os.path.basename(f)
            if down:
                if isinstance(down, list):
                    for d in down:
                        down_revisions.add(d)
                else:
                    down_revisions.add(down)
                    
    heads = []
    for rev in revisions:
        if rev not in down_revisions:
            heads.append((rev, revisions[rev]))
            
    return heads

if __name__ == "__main__":
    versions_dir = r"d:\HMS - TEST\HMS-Dilshan\backend\alembic\versions"
    heads = find_heads(versions_dir)
    print("Found heads:")
    for rev, filename in heads:
        print(f"Revision: {rev}, File: {filename}")
