import React from 'react';
import { Form, FormGroup, FormControl, ControlLabel, HelpBlock, Button, Col, Grid } from 'react-bootstrap';
import Host from '../models/host';

class LoginForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      username: '',
      password: '',
    };

    this.inputChange = this.inputChange.bind(this);
    this.back = this.back.bind(this);
    this.login = this.login.bind(this);
  }

  inputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  back() {
    this.props.parentPage(false);
  }

  login(event) {
    event.preventDefault();
    const username = event.target.username.value;
    const password = event.target.password.value;
    Host.login(username, password, (err, ret) => {
      if (err) {
        console.error('Login error', err, ret);
        return;
      }
      console.log(ret);
      this.props.parentPage(true);
    });
  }

  render() {
    return (
      <Grid>
        <Button
          onClick={this.back}
        >Back</Button>
        <Form horizontal onSubmit={this.login}>
          <h1><ControlLabel>Login to Account</ControlLabel></h1>
          <FormGroup controlId="formUsername">
            <Col componentClass={ControlLabel} sm={1}>
              Username
            </Col>
            <Col sm={10}>
              <FormControl
                name="username"
                type="text"
                placeholder="Enter username"
                value={this.state.username}
                onChange={this.inputChange}
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
                name="password"
                type="password"
                value={this.state.password}
                onChange={this.inputChange}
              />
              <HelpBlock>Between 7-255 chars</HelpBlock>
            </Col>
          </FormGroup>
          <Button type="submit">Login</Button>
        </Form>
      </Grid>
    );
  }
}

LoginForm.propTypes = {
  parentPage: React.PropTypes.func.isRequired
};

export default LoginForm;
