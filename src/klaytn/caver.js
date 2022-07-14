import Caver from 'caver-js'

const caver = new Caver(new Caver.providers.HttpProvider('https://public-node-api.klaytnapi.com/v1/baobab'))

export default caver
