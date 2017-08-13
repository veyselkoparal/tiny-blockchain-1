const express = require('express')
const bodyParser = require('body-parser')
const app = express()
app.use(bodyParser.json())
const crypto = require('crypto')
const getHash = (s) => crypto.createHash('sha256').update(s).digest('hex')

class Block {
  constructor (index, timestamp, data, previousHash) {
    this.index = index
    this.timestamp = new Date()
    this.data = data
    this.previousHash = previousHash
    this.hash = this.generateHash()
  }

  generateHash() {
    const { index, timestamp, data, previousHash } = this
    return getHash(`${index}${timestamp}${data}${previousHash}`)
  }
}

const createGenesisBlock = () => new Block(
  0,
  new Date(),
  {
    proofOfWork: 9,
    transactions: null
  },
  '0'
)

const minerAddress = 'q3nf394hjg-random-miner-address-34nf3i4nflkn3oi'

const createNextBlock = (previousBlock, data = null) => {
  const index = previousBlock.index + 1
  const previousHash = previousBlock.hash
  return new Block(index, data, previousHash)
}

let blockchain = []
blockchain.push(createGenesisBlock())

let ourTransactions = []
const peerNodes = []
let mining = true

app.post('/transaction', (req, res) => {
  const nt = req.body
  ourTransactions.push(JSON.parse(nt))
  console.log(`
    New transaction:
    FROM: ${nt.from}
    TO: ${nt.to}
    AMOUNT: ${nt.amount}
    Submission successful
  `)
})

app.get('/mine', (req, res) => {
  const lastBlock = blockchain[blockchain.length - 1]
  const lastProof = lastBlock.data.proofOfWork
  const proof = proofOfWork(lastProof)

  ourTransactions.push({
    from: 'network',
    to: minerAddress,
    amount: 1
  })

  const newBlockData = {
    proofOfWork: proof,
    transactions: ourTransactions
  }

  const newBlockIndex = lastBlock.index + 1
  const lastBlockHash = lastBlock.hash
  const newBlockTimestamp = new Date()

  ourTransactions = []

  const minedBlock = new Block(newBlockIndex, newBlockData, lastBlockHash)

  res.json({
    index: newBlockIndex,
    timestamp: newBlockTimestamp,
    data: newBlockData,
    hash: lastBlockHash
  })
})

const consensus = () => {
  let otherChains = findNewChains()
  let longestChain = blockchain
  otherChains.forEach((chain) => {
    if (longestChain.length < chain.length) {
      longestChain = chain
    }
  })
  blockchain = longestChain
}

const proofOfWork = (lastProof) => {
  let incrementor = lastProof + 1
  while (!(incrementor % 9 === 0 && incrementor % lastProof === 0)) {
    incrementor += 1
  }
  return incrementor
}