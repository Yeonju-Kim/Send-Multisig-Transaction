import React, {useState}from "react";
import InputField from "./components/inputField";
import './App.css';
import caver from "./klaytn/caver";

function App() {
  const [keystoreList, setKeystoreList] = useState([{keystore: ""}]);
  const [passwordList, setPasswordList] = useState([{password: ""}]);
  const [privateKeyList, setPrivateKeyList] = useState([{key: ""}]); 
  const [inputValue, setInputValue] = useState({ sender: "", recipient: "", amount: "" });
  const { sender, recipient, amount } = inputValue;
  let signed = null; 
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputValue((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const onSendTxButtonClick = async(e) =>{
    const vtReceipt = await caver.rpc.klay.sendRawTransaction(signed.getRawTransaction())
    console.log(`Receipt of value transfer transaction after account update => `)
    console.log(vtReceipt)
  }

  const onSignTxButtonClick = async(e) =>{
    let newKeys = []
    for (const element of privateKeyList)
    {
      newKeys.push(element.key)
    }
    
    const newKeyring = caver.wallet.keyring.createWithMultipleKey(sender, newKeys)
    caver.wallet.add(newKeyring) // caver wallet add keyring if keyring hasn't been updated. 

    const vt = caver.transaction.valueTransfer.create({
      from: sender,
      to: recipient,
      value: amount,
      gas: 100000,
    })
    signed = await caver.wallet.sign(sender, vt)
    console.log(signed.getRawTransaction())
  }
  
  const handleKeystoreChange = (e, index) => {
    const {name} = e.target;
    const list = [...keystoreList];
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files[0], "UTF-8")
    fileReader.onload = function (event) {
      list[index][name]= JSON.parse(event.target.result)
      setKeystoreList(list);
    };
  } 

  const handlePasswordChange = (e, index)=>{
    const {name, value} = e.target;
    const list = [...passwordList];
    list[index][name]= value;
    setPasswordList(list);
  }

  const onFileAndPasswordUpload = (e, index)=>{
    //decrypt 
    const keyring = caver.wallet.keyring.decrypt(keystoreList[index].keystore, passwordList[index].password)
    const list = [...privateKeyList];
    list[index]["key"] = keyring.key.privateKey;
    setPrivateKeyList(list)
  }

  const handleKeystoreremove = (index) => {
    const list =[...keystoreList]
    list.splice(index, 1);
    setKeystoreList(list);

    const pwList = [...passwordList]
    pwList.splice(index, 1);
    setPasswordList(pwList)

    const privKeyList = [...privateKeyList]
    privKeyList.splice(index, 1);
    setPrivateKeyList(privKeyList);
  }
  
  const handleKeystoreAdd = ()=>{
    setKeystoreList([...keystoreList, {keystore: ""}]);
    setPasswordList([...passwordList, {password: ""}]);
    setPrivateKeyList([...privateKeyList, {key: ""}])
  }

  return (
    <div>
      <div className="form-field">
        <label htmlFor="service">Keystore(s)</label>
        {keystoreList.map((_, index) => (
          <div key={index} className="services">
            <div className="first-division">
              <InputField
                name="keystore"
                type="file"
                id="keystore"
                label="keystore"
                placeholder="Keystore File"
                accept=".json"
                onChange={(e) => handleKeystoreChange(e, index)}
                required
              />
              <InputField
                type="password"
                name="password"
                placeholder="Password"
                label="password"
                onChange={(e)=> handlePasswordChange(e, index)}
                value={passwordList[index].password}
              />
              <button className="add-btn" onClick={(e)=> onFileAndPasswordUpload(e,index)}>Upload</button>
              {keystoreList.length !== 1 && (
                <button
                  type="button"
                  onClick={() => handleKeystoreremove(index)}
                  className="remove-btn"
                >
                <span>Remove</span>
                </button>
              )}
              {keystoreList.length - 1 === index && keystoreList.length < 10 && (
                <button
                  type="button"
                  onClick={handleKeystoreAdd}
                  className="add-btn"
                >
                  <span>Add a Keystore and Password</span>
                </button>
              )}
            </div>
          </div>
        ))}
        <InputField
          type="text"
          value={sender}
          placeholder="Sender Address"
          label="sender"
          name="sender"
          onChange={handleInputChange}
        />
        <InputField
          type="text"
          value={recipient}
          placeholder="Recipient Address"
          label="recipient"
          name="recipient"
          onChange={handleInputChange}
        />
        <InputField
          type="text"
          value={amount}
          placeholder="Amount(KLAY)"
          label="amount"
          name="amount"
          onChange={handleInputChange}
        />
      </div>
      <div>
        <button onClick={onSignTxButtonClick}>Sign Transaction</button> 
        <button onClick={onSendTxButtonClick}>Send Transaction</button>
      </div>

    </div>
  ) 
}

export default App;