import React from 'react';
import { Form, FormGroup, FormControl, ControlLabel, HelpBlock, Button, Col, Grid } from 'react-bootstrap';
import Host from '../models/host';
import { success, danger } from '../helpers/notifier';

class LoginForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      username: '',
      password: '',
    };

    this.pwValidationState = this.pwValidationState.bind(this);
    this.usernameValidationState = this.usernameValidationState.bind(this);
    this.inputChange = this.inputChange.bind(this);
    this.back = this.back.bind(this);
    this.login = this.login.bind(this);
  }

  pwValidationState() {
    const length = this.state.password.length;
    if (length < 6) return 'warning';
    return 'success';
  }

  usernameValidationState() {
    if (this.state.username.indexOf(' ') !== -1) return 'error';
    else if (this.state.username.length < 3) return 'warning';
    return 'success';
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
      if (err) danger(ret);
      else {
        success(ret);
        this.props.parentPage(true);
      }
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
          <FormGroup
            controlId="formUsername"
            validationState={this.usernameValidationState()}
          >
            <Col componentClass={ControlLabel} sm={2}>
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
          <FormGroup
            controlId="formPassword"
            validationState={this.pwValidationState()}
          >
            <Col componentClass={ControlLabel} sm={2}>
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
