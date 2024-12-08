# Namma Coin - Cryptocurrency from scratch

## Overview
"Namma Coin" is a cryptocurrency built from scratch using Node.js, adhering to the foundational principles described in the Bitcoin whitepaper. It implements decentralized, secure, and transparent blockchain technology, featuring features such as proof-of-work, transaction validation, and a UTXO-based system. Designed with scalability and efficiency in mind, Namma-coin is a step toward exploring the potential of blockchain in custom applications and ecosystems.
## Prerequisites

Make sure you have the following installed on your system:

1. **Node.js** (version >= 14.x)
   - Download and install Node.js from [https://nodejs.org/](https://nodejs.org/).
2. **npm** (Node Package Manager, comes with Node.js)
   - Verify installation:
     ```bash
     node -v
     npm -v
     ```

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

2. Start the application in production mode:
   ```bash
   npm start
   ```

3. By default, the application runs on port `3000`. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

   If a different port is used, update the URL accordingly.

## Configuration

You can configure the application using environment variables. Create a `.env` file in the root directory with the following content:

```env
PORT=3000
```


## Folder Structure

Here is a typical folder structure for the application:
- **node**:  
    - **components**: Contains core modules for the blockchain system.
        - `block.js`: Manages individual block logic.
        - `blockchain.js`: Handles the blockchain structure and its operations.
        - `mempool.js`: Manages pending transactions.
        - `merkle.js`: Implements Merkle tree logic.
        - `p2pserver.js`: Manages peer-to-peer communication.
        - `storageEngine.js`: Provides storage backend for the blockchain.
        - `wallet.js`: Manages wallet operations and keys.
    - **wallets**: Stores wallet files.
    - `node.js`: Manages blockchain node modules and operations
- `.gitignore`: Specifies files and directories to ignore in version control.
- `Dockerfile`: Configuration for building a Docker image for the application.
- `index.js`: Main entry point for the application.
- `package.json`: Lists dependencies and project metadata.
- `README.md`: Documentation for the application.

## License

GPL. See the `LICENSE` file for more details.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

---

Happy Coding!

