import React, {Component }from "react";
import {
    Button,
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    CardText,
    Row,
    Col,
} from "reactstrap";
import '../../assets/css/black-dashboard-react.css';
import InputField from "../components/inputField";
import Caver from 'caver-js'

const networkLinks ={
    "testnet" : {
        "rpc": "https://public-node-api.klaytnapi.com/v1/baobab",
        "finder": "https://baobab.klaytnfinder.io/tx/"
    },
    "mainnet": {
        "rpc": "https://public-node-api.klaytnapi.com/v1/cypress", 
        "finder": "https://www.klaytnfinder.io/tx/"
    },
}
let caver;

class SendAndSignTx extends Component {
    constructor(props){
        super(props);
        this.state = {
            error: null,
            success: null,
            sender:"",
            recipient: "",
            amount: 0,
            buttonDisabled: false,
            rawTransaction: null,
            keystoreList: [{keystore: ""}],
            passwordList: [{password: ""}],
            decryptMessageList: [{msg: ""}],
            privateKeyList: [{key: ""}],
            network: "mainnet"
        }
    }

    componentDidMount(){
        caver = new Caver(new Caver.providers.HttpProvider(networkLinks[this.state.network]["rpc"]))
    }

    handleNetworkChange = (e)=>{
        caver = new Caver(new Caver.providers.HttpProvider(networkLinks[e.target.value]["rpc"]))
        this.setState({
            network: e.target.value
        })
    }

    handleKeystoreChange = (e, index) => {
        if (e.target.files.length > 0)
        {
            const {name} = e.target;
            const list = [...this.state.keystoreList];
            const fileReader = new FileReader();
            fileReader.readAsText(e.target.files[0], "UTF-8")
            fileReader.onload =  (event) =>{
                list[index][name]= JSON.parse(event.target.result)
                this.setState({
                    keystoreList: list
                })
            };
        }
    }
    
    handlePasswordChange = (e, index)=>{
        const {name, value} = e.target;
        const list = [...this.state.passwordList];
        list[index][name]= value;
        this.setState({
            passwordList:list
        })
    }
    
    onFileAndPasswordUpload = (e, index)=>{
        //decrypt and add priv key to PrivKey list
        const {keystoreList, passwordList, privateKeyList, decryptMessageList} = this.state
        try {
            if (keystoreList[index].keystore != "")
            {
                const keyring = caver.wallet.keyring.decrypt(keystoreList[index].keystore, passwordList[index].password)
                const list = [...privateKeyList];
                list[index]["key"] = keyring.key.privateKey;
            
                const decryptMsgList = [...decryptMessageList];
                decryptMsgList[index]["msg"] = "Decryption succeeds!"; 

                this.setState({
                    privateKeyList: list,
                    decryptMessageList: decryptMsgList
                })
            }
        } catch (e) {
            console.log(e)
            const decryptMsgList = [...decryptMessageList];
            decryptMsgList[index]["msg"] = e.toString(); 
            this.setState({
                decryptMessageList: decryptMsgList,
            })
        }
    }

    handleKeystoreRemove = (index) => {
        const {keystoreList, passwordList, privateKeyList, decryptMessageList} = this.state

        const list =[...keystoreList]
        list.splice(index, 1);
    
        const pwList = [...passwordList]
        pwList.splice(index, 1);
    
        const privKeyList = [...privateKeyList]
        privKeyList.splice(index, 1);
    
        const decryptMsgList = [...decryptMessageList]
        decryptMsgList.splice(index, 1);

        this.setState({
            keystoreList: list,
            passwordList: pwList,
            privateKeyList: privKeyList,
            decryptMessageList: decryptMsgList
        })
    }
      
    handleKeystoreAdd = ()=>{
        this.setState(state => {
            const keystoreList = [...state.keystoreList, {keystore: ""}]
            const passwordList = [...state.passwordList, {password: ""}]
            const privateKeyList = [...state.privateKeyList, {key: ""}]
            const decryptMessageList = [...state.decryptMessageList, {msg: ""}]

            return{
                keystoreList, 
                passwordList,
                privateKeyList,
                decryptMessageList
            };
        })
    }

    handleInputChange = (e) => {
        const { name, value } = e.target;
        this.setState({
            [name]: value,
            error: null,
            success: null,
        })
    }

    onSendTxButtonClick = async(e) =>{
        try{
            this.setState({
                buttonDisabled: true,
                error: null, 
                success: null,
            })
            const vtReceipt = await caver.rpc.klay.sendRawTransaction(this.state.rawTransaction)
            console.log(`Receipt of value transfer transaction after account update => `)
            console.log(vtReceipt)
            this.setState({
                success: vtReceipt.transactionHash,
                buttonDisabled: false,
            })
        } catch(e){
            this.setState({
                error: e.toString(),
                buttonDisabled: false,
            })
        }
     }

    onSignTxButtonClick = async(e) =>{
        // Sign transaction with provided keys 
        try{
            const {sender, recipient, amount} = this.state
            this.setState({
                buttonDisabled: true,
                error: null, 
                success: null,
            })
            let newKeys = []
            for (const element of this.state.privateKeyList)
            {
                newKeys.push(element.key)
            }
            
            const newKeyring = caver.wallet.keyring.createWithMultipleKey(sender, newKeys)
            if (caver.wallet.isExisted(sender)){
                caver.wallet.updateKeyring(newKeyring)
            }
            else{
                caver.wallet.add(newKeyring) // caver wallet add keyring if keyring hasn't been updated. 
            }

            const vt = caver.transaction.valueTransfer.create({
                from: sender,
                to: recipient,
                value: amount,
                gas: 100000,
            })
            let signed = await caver.wallet.sign(sender, vt)
            this.setState({
                rawTransaction: signed.getRawTransaction(),
                success: signed.getTransactionHash(),
                buttonDisabled: false
            })
        } catch(e){
            this.setState({
                buttonDisabled:false ,
                error: e.toString()
            })
        }
  }
  

    render(){
        const {error, network, buttonDisabled, success, sender, recipient, amount, keystoreList, passwordList, decryptMessageList} = this.state
        return (
            <div>
                <Card>
                    <CardHeader>
                        <h3 className="title">Transaction Information</h3>
                        <Row>
                            <Col md="4">
                                <select onChange={(e)=>this.handleNetworkChange(e)} className="form-control">
                                    <option value="mainnet"> Mainnet</option>
                                    <option value="testnet"> Testnet</option>
                                </select>
                            </Col>
                        </Row>
                    </CardHeader>
                    <CardBody>
                        <Row>
                            <Col md="8">
                                <InputField
                                type="text"
                                value={sender}
                                placeholder="Sender Address"
                                label="Sender"
                                name="sender"
                                onChange={this.handleInputChange}
                                />
                            </Col>
                        </Row>
                        <Row>
                            <Col md="8">
                                <InputField
                                type="text"
                                value={recipient}
                                placeholder="Recipient Address"
                                label="Recipient"
                                name="recipient"
                                onChange={this.handleInputChange}
                            />
                            </Col>
                        </Row>
                        <Row>
                            <Col md="4">
                                <InputField
                                type="number"
                                value={amount}
                                placeholder="Amount(KLAY)"
                                label="Amount"
                                name="amount"
                                unit="KLAY"
                                onChange={this.handleInputChange}
                                />
                            </Col>
                        </Row>
                    </CardBody>
                    <CardFooter>
                        <Col md="8">
                            <Row>
                                <Button disabled={buttonDisabled} onClick={this.onSignTxButtonClick}>Sign Transaction</Button> 
                                <Button disabled={buttonDisabled} onClick={this.onSendTxButtonClick}>Send Transaction</Button>
                            </Row>
                            <Row>
                                <CardText style={{display : error!=null? "inline":"none", backgroundColor:"black"}}>
                                    {error}
                                </CardText>
                                <CardText style={{display: success!= null ? "inline":"none"}}>
                                    Transaction Hash: <a href={networkLinks[network]["finder"]+success}>{success}</a> 
                                </CardText>
                            </Row>
                        </Col>
                    </CardFooter>
                </Card>
                <Card>
                    <CardHeader>
                    <h3 className="title">Upload Keystore files</h3>
                    {keystoreList.length < 10 && (
                        <Button
                        type="button"
                        onClick={this.handleKeystoreAdd}
                        >
                        Add a Keystore and Password
                        </Button>
                    )}              
                    </CardHeader>
                    <CardBody>
                    {keystoreList.map((_, index) => (
                        <div>
                            <Row>
                                <Col md="8">
                                    <InputField
                                        name="keystore"
                                        type="file"
                                        id="Keystore"
                                        label="Keystore"
                                        placeholder="Keystore File"
                                        accept=".json"
                                        onChange={(e) => this.handleKeystoreChange(e, index)}
                                    />
                                </Col>
                            </Row>
                            <Row>
                                <Col md="8">
                                    <InputField
                                        type="password"
                                        name="password"
                                        placeholder="Password"
                                        label="Password"
                                        onChange={(e)=> this.handlePasswordChange(e, index)}
                                        value={passwordList[index].password}
                                    />
                                </Col>
                            </Row>
                            <Row>
                                <Col md="8">
                                    <Button onClick={(e)=> this.onFileAndPasswordUpload(e,index)}>Upload</Button>
                                    <Button onClick={() => this.handleKeystoreRemove(index)}>Remove</Button>
                                </Col>
                            </Row>
                            <Row>
                                <Col md="8">
                                    <CardText style={{color:"#c221a9"}}>
                                        {decryptMessageList[index]["msg"]}
                                    </CardText>
                                </Col>
                            </Row>
                        </div>
                    ))}
                    </CardBody>
                </Card>
            </div>
        )
    }
}

export default SendAndSignTx