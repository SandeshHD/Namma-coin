import crypto from 'node:crypto'
export class MerkleTree {
  constructor(leaves) {
    this.leaves = leaves.map(data => this.hash(data));
    this.tree = [this.leaves];
    this.buildTree();
  }

  hash(data) {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  buildTree() {
    let currentLayer = this.leaves;

    while (currentLayer.length > 1) {
      const nextLayer = [];
      for (let i = 0; i < currentLayer.length; i += 2) {
        const left = currentLayer[i];
        const right = currentLayer[i + 1] ? currentLayer[i + 1] : left;
        nextLayer.push(this.hash(left + right));
      }
      this.tree.push(nextLayer);
      currentLayer = nextLayer;
    }
  }

  getRoot() {
    return this.tree[this.tree.length - 1][0];
  }

  getTree() {
    return this.tree;
  }

  getProof(leafIndex) {
    let proof = [];
    let index = leafIndex;
    for (let i = 0; i < this.tree.length - 1; i++) {
      const layer = this.tree[i];
      const pairIndex = (index % 2 === 0) ? index + 1 : index - 1;
      if (pairIndex < layer.length) {
        proof.push({ 
          data: layer[pairIndex], 
          position: (index % 2 === 0) ? 'right' : 'left' 
        });
      }
      index = Math.floor(index / 2);
    }
    return proof;
  }

  verifyProof(leaf, proof, root) {
    let hash = this.hash(leaf);

    proof?.forEach(node => {
      if (node.position === 'right') {
        hash = this.hash(hash + node.data);
      } else {
        hash = this.hash(node.data + hash);
      }
    });

    return hash === root;
  }
}

// // Example usage:
// const data = ['a', 'b', 'c', 'd']; // Replace with your actual transaction data
// const merkleTree = new MerkleTree(data);

// console.log('Merkle Root:', merkleTree.getRoot());
// console.log('Merkle Tree:', merkleTree.getTree());

// // Getting proof for a specific leaf (e.g., 'b', index 1)
// const proof = merkleTree.getProof('b'); // Proof for 'b'
// console.log('Proof for b:', proof);

// // Verify the proof for 'b'
// const leaf = 'b';
// const isValid = merkleTree.verifyProof(leaf, proof, merkleTree.getRoot());
// console.log('Is Valid Proof for b:', isValid);