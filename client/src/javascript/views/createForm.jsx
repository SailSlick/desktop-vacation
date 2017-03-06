import React from 'react';
import { Form, FormGroup, FormControl, ControlLabel, HelpBlock, Button, Col } from 'react-bootstrap';
import Host from '../models/host';

class CreateForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
    this.createAccount = this.createAccount.bind(this);
  }

  createAccount(event) {
    console.error("createevent", event);
    event.preventDefault();
    console.error("event", event);
    // const username = event.target.
    // const password = event.target.
    // const password2 = event.target.
    // console.error("createAccount details:", username, password, password2);
    // Host.createAccount(username, password, (err, ret) => {
    //   if (err) {
    //     console.error(ret);
    //   }
    //   this.setState({ username, password });
    // });
  }
  render() {
    return (
      <Form horizontal onSubmit={this.createAccount}>
        <h1><ControlLabel>Create Account</ControlLabel></h1>
        <FormGroup controlId="formUsername">
          <Col componentClass={ControlLabel} sm={1}>
            Username
          </Col>
          <Col sm={10}>
            <FormControl
              type="text"
              placeholder="Enter username"
            />
            <HelpBlock>No spaces allowed in username</HelpBlock>
          </Col>
        </FormGroup>
        <FormGroup controlId="formPassword">
          <Col componentClass={ControlLabel} sm={1}>
            Password
          </Col>
          <Col sm={10}>
            <FormControl
              type="password"
            />
            <HelpBlock>Between 7-255 chars</HelpBlock>
          </Col>
        </FormGroup>
        <FormGroup controlId="formPassword2">
          <Col componentClass={ControlLabel} sm={1}>
            Password Check
          </Col>
          <Col sm={10}>
            <FormControl
              type="password"
            />
            <HelpBlock>Between 7-255 chars</HelpBlock>
          </Col>
        </FormGroup>
        <Button type="submit">Login</Button>
      </Form>
    );
  }
}

export default CreateForm;
