import React from 'react';
import { Form, FormGroup, FormControl, ControlLabel, HelpBlock, Button, Col, Grid } from 'react-bootstrap';
import Host from '../models/host';

class LoginForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};

    this.login = this.login.bind(this);
  }

  login(event) {
    event.preventDefault();
    console.error("login event", event);
    // console.error("login details:", username, password);
    // Host.login(username, password, (err, ret) => {
    //   if (err) {
    //     console.error(ret);
    //   }
    //   this.setState({ username, password });
    // });
  }

  render() {
    return (
      <Form horizontal onSubmit={this.login}>
        <h1><ControlLabel>Login to Account</ControlLabel></h1>
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
        <Button type="submit">Login</Button>
      </Form>
    );
  }
}

export default LoginForm;
