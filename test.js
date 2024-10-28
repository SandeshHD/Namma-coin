// const { Level } = require('level')
import { Level } from "level"

// Create a database
const db = new Level('./db/transactions', { valueEncoding: 'json' })
// await db.put('a', 10)
// db.close();
// Add an entry with key 'a' and value 1

// Add multiple entries
// await db.batch([{ type: 'put', key: 'b', value: 1}])
// const db2 = new Level('transactions', { valueEncoding: 'json' })

// Get value of key 'a': 1
// const value = await db2.get('a')
// console.log(value)
// // Iterate entries with keys that are greater than 'a'
// for await (const [key, value] of db.iterator()) {
//   console.log(value) // 2
// }

const x = await db.get('1dd4bc37f3788f738e7002265151288ff412eab0c3a8b9b903528a0ac5159527')
console.log(x)