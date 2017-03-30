import React from 'react';
import { Form, FormGroup, FormControl, ControlLabel, HelpBlock, Button, Col, Grid } from 'react-bootstrap';
import Host from '../models/host';
import { success, danger } from '../helpers/notifier';

const sync_root_event = new Event('sync_root');

class CreateForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      username: '',
      password: '',
      password2: ''
    };

    this.pwValidationState = this.pwValidationState.bind(this);
    this.pw2ValidationState = this.pw2ValidationState.bind(this);
    this.usernameValidationState = this.usernameValidationState.bind(this);
    this.inputChange = this.inputChange.bind(this);
    this.back = this.back.bind(this);
    this.createAccount = this.createAccount.bind(this);
  }

  pwValidationState() {
    const length = this.state.password.length;
    if (length < 6) return 'warning';
    return 'success';
  }

  pw2ValidationState() {
    const length = this.state.password2.length;
    if (this.state.password2 !== this.state.password) return 'error';
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

  createAccount(event) {
    event.preventDefault();
    const username = event.target.username.value;
    const password = event.target.password.value;
    const password2 = event.target.password2.value;
    if (password !== password2) {
      danger('Passwords do not match');
      return;
    }
    Host.createAccount(username, password, (err, ret) => {
      if (err) danger(ret);
      else {
        success(ret);
        this.props.parentPage(true);
        document.dispatchEvent(sync_root_event);
      }
    });
  }
  render() {
    return (
      <Grid>
        <br />
        <Button onClick={this.back}>Back</Button>
        <Form horizontal onSubmit={this.createAccount}>
          <h1><ControlLabel>Create Account</ControlLabel></h1>
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
          <FormGroup
            controlId="formPassword2"
            validationState={this.pw2ValidationState()}
          >
            <Col componentClass={ControlLabel} sm={2}>
              Password Check
            </Col>
            <Col sm={10}>
              <FormControl
                name="password2"
                type="password"
                value={this.state.password2}
                onChange={this.inputChange}
              />
              <HelpBlock>Between 7-255 chars</HelpBlock>
            </Col>
          </FormGroup>
          <Button type="submit">Create</Button>
        </Form>
      </Grid>
    );
  }
}

CreateForm.propTypes = {
  parentPage: React.PropTypes.func.isRequired
};

export default CreateForm;
