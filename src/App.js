import React, {useState}from "react";
import '../assets/css/black-dashboard-react.css';
// reactstrap components
import {
  Row,
  Col
} from "reactstrap";
import SendAndSignTx from "./components/signAndSendTx";

function App() {
  return (
    <div>
      <div className="content">
        <Row>
          <Col md="2"/>
          <Col md="8">
            <SendAndSignTx/> 
          </Col>
        </Row>
      </div>
    </div>
  ) 
}

export default App;