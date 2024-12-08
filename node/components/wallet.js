
import crypto from 'crypto'
import fs from 'node:fs'
import sizeof from "object-sizeof"
export class Wallet{
    wallets;
    constructor(){
        this.wallets = this.getAllWallets();
        if(this.wallets.length === 0){
          this.addWallet();
          this.wallets = this.getAllWallets();
        }
        
    }

    getAllWallets(){
        const wallets = []
        fs.readdirSync('node/wallets').forEach(file=>{
            try {
                const data = fs.readFileSync(`node/wallets/${file}`);
                wallets.push(JSON.parse(data.toString()));
            } catch (err) {
                console.error(err)
                return [];
            }
        })
        return wallets;
    }

    getWallet(walletId){
      try {
          const data = fs.readFileSync(`node/wallets/${walletId}.json`);
          return JSON.parse(data.toString());
      } catch (err) {
          console.error(err)
          return false;
      }
    }

    getAllPublicKeys(){
      const wallets = []
        fs.readdirSync('node/wallets').forEach(file=>{
            try {
                const data = fs.readFileSync(`node/wallets/${file}`);
                wallets.push(JSON.parse(data.toString())['publicKey']);
            } catch (err) {
                console.error(err)
                return [];
            }
        })
        return wallets;
    }

    addWallet(){
      const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
          modulusLength: 2048,
          namedCurve: 'sect233k1',
          publicKeyEncoding: {
              type: 'spki',
              format: 'der'
          },
          privateKeyEncoding: {
              type: 'pkcs8',
              format: 'der'
          }
      });    
  
      const keys = {
          privateKey:privateKey.toString('hex'),
          publicKey:publicKey.toString('hex')
      };
  
      try {
          const length = fs.readdirSync('node/wallets').length
          fs.writeFileSync(`node/wallets/${length+1}.json`, JSON.stringify(keys));
          this.getAllWallets();
      } catch (err) {
          console.error(err)
          return false
      }
      return true;
  }

  async #getUTXOs(publicKey){
    // const utxos = [
    //   {
    //     "time": 1728909222560,
    //     "inputs": [
    //       {
    //         "scriptSig": "MD4CHSkg7dHx/bp3Qa87WtBz2TPHlWnoUtKR9O7VBT/XAh1oFzyh0YcTzgLjXrVInqxpY+L3nP/4Gzgmy5JI0w== 3052301006072a8648ce3d020106052b8104001a033e000400eb5dcb091fef97ec0e30d2ddeb69186c4a9c6e9e9f13331c226abca9be0048a8b9df98a42821b5c0d50967be0b41a8045c9729ee01f75b1537985a",
    //         "prev_out": {
    //           "hash": "b657e22827039461a9493ede7bdf55b01579254c1630b0bfc9185ec564fc05ab",
    //           "n": 1
    //         }
    //       },
    //       {
    //         "scriptSig": "MD4CHVbI1ZiQaCJoWkvwk6yJPltrV/WhpCFNcPe3qYf4Ah0lZIAzqwKmafC4qPyxeSuiXMPEhstslget21AzDQ== 3052301006072a8648ce3d020106052b8104001a033e000400eb5dcb091fef97ec0e30d2ddeb69186c4a9c6e9e9f13331c226abca9be0048a8b9df98a42821b5c0d50967be0b41a8045c9729ee01f75b1537985a",
    //         "prev_out": {
    //           "hash": "secondHash22827039461a9493ede7bdf55b01579254c1630b0bfc9185ec564fc05ab",
    //           "n": 0
    //         }
    //       }
    //     ],
    //     "outputs": [
    //       {
    //         "value": 10,
    //         "addr": "8we9djfksjfksdjfdkfjlk"
    //       },
    //       {
    //         "value": 24.95,
    //         "addr": "3052301006072a8648ce3d020106052b8104001a033e000400ac198bc72bd452e0f03bf930b470cb2a19ee43458cf4d0bb269623b75601ff91b76008cc59fff43f15c93eaea23b09e172be9af32403b6b3d7587b"
    //       }
    //     ],
    //     "size": 1023,
    //     "hash": "2acc3267eee996c66ec27e6ced4f20c18feca555175be1c1dab396c92d9f508e"
    //   },
    //   {
    //     "time": 1728909222560,
    //     "inputs": [
    //       {
    //         "scriptSig": "MD4CHSkg7dHx/bp3Qa87WtBz2TPHlWnoUtKR9O7VBT/XAh1oFzyh0YcTzgLjXrVInqxpY+L3nP/4Gzgmy5JI0w== 3052301006072a8648ce3d020106052b8104001a033e000400ac198bc72bd452e0f03bf930b470cb2a19ee43458cf4d0bb269623b75601ff91b76008cc59fff43f15c93eaea23b09e172be9af32403b6b3d7587b",
    //         "prev_out": {
    //           "hash": "b657e22827039461a9493ede7bdf55b01579254c1630b0bfc9185ec564fc05ab",
    //           "n": 1
    //         }
    //       },
    //       {
    //         "scriptSig": "MD4CHVbI1ZiQaCJoWkvwk6yJPltrV/WhpCFNcPe3qYf4Ah0lZIAzqwKmafC4qPyxeSuiXMPEhstslget21AzDQ== 3052301006072a8648ce3d020106052b8104001a033e000400ac198bc72bd452e0f03bf930b470cb2a19ee43458cf4d0bb269623b75601ff91b76008cc59fff43f15c93eaea23b09e172be9af32403b6b3d7587b",
    //         "prev_out": {
    //           "hash": "secondHash22827039461a9493ede7bdf55b01579254c1630b0bfc9185ec564fc05ab",
    //           "n": 0
    //         }
    //       }
    //     ],
    //     "outputs": [
    //       {
    //         "value": 10,
    //         "addr": "8we9djfksjfksdjfdkfjlk"
    //       },
    //       {
    //         "value": 21,
    //         "addr": "3052301006072a8648ce3d020106052b8104001a033e000400ac198bc72bd452e0f03bf930b470cb2a19ee43458cf4d0bb269623b75601ff91b76008cc59fff43f15c93eaea23b09e172be9af32403b6b3d7587b"
    //       }
    //     ],
    //     "size": 1023,
    //     "hash": "2acc3267eee996c66ec27e6ced4f20c18feca555175be1c1dab396c92d9f508f"
    //   },
    //   {
    //     "time": 1728909222560,
    //     "inputs": [
    //       {
    //         "scriptSig": "MD4CHSkg7dHx/bp3Qa87WtBz2TPHlWnoUtKR9O7VBT/XAh1oFzyh0YcTzgLjXrVInqxpY+L3nP/4Gzgmy5JI0w== 3052301006072a8648ce3d020106052b8104001a033e000400ac198bc72bd452e0f03bf930b470cb2a19ee43458cf4d0bb269623b75601ff91b76008cc59fff43f15c93eaea23b09e172be9af32403b6b3d7587b",
    //         "prev_out": {
    //           "hash": "b657e22827039461a9493ede7bdf55b01579254c1630b0bfc9185ec564fc05ab",
    //           "n": 1
    //         }
    //       },
    //       {
    //         "scriptSig": "MD4CHVbI1ZiQaCJoWkvwk6yJPltrV/WhpCFNcPe3qYf4Ah0lZIAzqwKmafC4qPyxeSuiXMPEhstslget21AzDQ== 3052301006072a8648ce3d020106052b8104001a033e000400ac198bc72bd452e0f03bf930b470cb2a19ee43458cf4d0bb269623b75601ff91b76008cc59fff43f15c93eaea23b09e172be9af32403b6b3d7587b",
    //         "prev_out": {
    //           "hash": "secondHash22827039461a9493ede7bdf55b01579254c1630b0bfc9185ec564fc05ab",
    //           "n": 0
    //         }
    //       }
    //     ],
    //     "outputs": [
    //       {
    //         "value": 15,
    //         "addr": "3052301006072a8648ce3d020106052b8104001a033e000400ac198bc72bd452e0f03bf930b470cb2a19ee43458cf4d0bb269623b75601ff91b76008cc59fff43f15c93eaea23b09e172be9af32403b6b3d7587b"
    //       },
    //       {
    //         "value": 10,
    //         "addr": "8we9djfksjfksdjfdkfjlk"
    //       },
    //     ],
    //     "size": 1023,
    //     "hash": "2acc3267eee996c66ec27e6ced4f20c18feca555175be1c1dab396c92d9f508g"
    //   }
    // ]
    try{
      const response = await fetch(`http://localhost:3005/api/utxo/${publicKey}`)
      return response.json();
    }catch(err){
      console.log(err)
    }
    return []
  }

  async sendMoney(transaction,walletId){
    const {privateKey,publicKey} = this.wallets[walletId-1];
    const utxos = await this.#getUTXOs(publicKey);
    const selectedOutputs = this.#getOutputs(utxos,publicKey).flat();
    const {selectedUTXOs,totalSelected,change} = this.#selectUTXOs(selectedOutputs,transaction.amount)
    if(totalSelected == 0)
        return false;
    // console.log(selectedUTXOs,totalSelected,change)
    const inputs = this.#getInputs(selectedUTXOs,privateKey,publicKey);
    const newTxn = {
      time:Date.now(),
      inputs,
      outputs:[
          {
              "value": transaction.amount,
              "addr": transaction.address,
          },
      ]
    }
    newTxn['size'] = sizeof(newTxn);
    let fees = change - (newTxn['size']*0.00005);
    if(fees>0){
      newTxn['outputs'].push({
        "value":  fees,
        "addr": publicKey
      })
    }
    newTxn['hash'] = crypto.createHash('sha256').update(JSON.stringify(newTxn)).digest('hex');
    return newTxn;
  }

  #selectUTXOs(utxos, target) {
    let bestUTXOs = [];
    let minChange = Infinity;
    let bestSum = 0;

    utxos.sort((a, b) => a.value - b.value);
    function findBestCombination(currentUTXOs, currentSum, index) {
        if (currentSum >= target) {
            let change = currentSum - target;
            if (change < minChange) {
                minChange = change;
                bestUTXOs = [...currentUTXOs];
                bestSum = currentSum;
            }
            return;
        }

        for (let i = index; i < utxos.length; i++) {
            currentUTXOs.push(utxos[i]);
            findBestCombination(currentUTXOs, currentSum + utxos[i].value, i + 1);
            currentUTXOs.pop();
        }
    }

    findBestCombination([], 0, 0);

    return {
        selectedUTXOs: bestUTXOs,
        totalSelected: bestSum,
        change: minChange
    };
  }

  #getOutputs(utxos,publicKey){
    return utxos.map(utxo=>{
      return this.#getOutput(utxo,publicKey)
    })
  }

  #getOutput(utxo,addr){
    let outputs = []
    utxo.outputs.forEach((output,index) => {
      if(output.addr === addr)
        outputs.push({ ...output,hash: utxo.hash,n:index })
    })
    return outputs
  }

  #getInputs(outputs,privateKey,publicKey){
    return outputs.map(output=>{
      const sign = crypto.createSign('SHA256').update(JSON.stringify(output)).end();
        const digitalSignature = sign.sign({
            key: Buffer.from(privateKey, 'hex'),
            format: 'der',
            type: 'pkcs8'
          },'base64');
        return {
            scriptSig: digitalSignature+' '+publicKey,
            prev_out: {
                hash: output.hash,
                n: output.n
            }
        }
    })
  }
}