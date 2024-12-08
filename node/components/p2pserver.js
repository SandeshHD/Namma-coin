import WebSocket, { WebSocketServer } from 'ws';
import { BlockChain } from './blockchain.js';
export class P2PServer {
  constructor(node, port = 3006) {
    this.port = port;
    this.peers = [];
    this.node = node
    this.server = new WebSocketServer({ port: this.port });

    this.server.on('connection', (ws) => this.handleConnection(ws));

    console.log(`P2P server is running on ws://localhost:${this.port}`);
  }

  handleConnection(ws) {
    console.log('New peer connected.');
    this.peers.push({ ws });

    ws.on('message', (data) => this.handleMessage(data));

    ws.on('close', () => {
      console.log('Peer disconnected.');
      this.peers = this.peers.filter(peer => peer.ws !== ws);
    });
    ws.send(JSON.stringify({ type: 'syncBlockchain', blockchain: this.node.serializeBlockChain(), difficulty: BlockChain.difficulty, mempool: this.node.getMemPool().getMemPool() }));
  }

  handleMessage(data) {
    const message = JSON.parse(data.toString());
    console.log('Received message:')
    console.log(message)
    if(message.type === 'syncBlockchain'){
        this.node.syncBlockChain(message.blockchain,message.difficulty);
        this.node.syncMemPool(message.mempool);
    }else if (message.type === 'newBlock') {
        this.node.addBlock(message.block)
    } else if (message.type === 'newTransaction') {
      this.node.addToMempool(message.transaction,true);
    }
  }

  sendBlock(block) {
    console.log('New block added to the blockchain.');
    this.broadcastMessage({ type: 'newBlock', block });
  }

  // Add a new transaction to the mempool or process it
  sendTransaction(transaction) {
    console.log('New transaction added to the pool:', transaction);
    this.broadcastMessage({ type: 'newTransaction', transaction });
  }

  // Broadcast a message to all connected peers
  broadcastMessage(message) {
    this.peers.forEach(peer => {
      peer.ws.send(JSON.stringify(message));
    });
  }

  // Connect to another peer
  connectToPeer(peerIp, peerPort = 3006) {
        const ws = new WebSocket(`ws://${peerIp}:${peerPort}`);
    
        ws.on('open', () => {
          console.log(`Connected to peer at ws://${peerIp}:${peerPort}`);
          this.peers.push({ ws });
          ws.send(JSON.stringify({ type: 'syncBlockchain', blockchain: this.node.serializeBlockChain(), difficulty: BlockChain.difficulty, mempool: this.node.getMemPool().getMemPool() }));
        });
    
        ws.on('message', (data) => {
            this.handleMessage(data)}
        );
    
        ws.on('close', () => {
          console.log(`Disconnected from peer at ws://${peerIp}:${peerPort}`);
          this.peers = this.peers.filter(peer => peer.ws !== ws);
        });

        ws.onerror = function (error) {
            console.log(error);
          };
  }

  // Stop the P2P server
  stop() {
    this.server.close(() => {
      console.log('P2P server has been stopped.');
    });
  }
}
