import React from 'react';
import { Form, FormGroup, FormControl, ControlLabel, HelpBlock, Button, Col, Grid } from 'react-bootstrap';
import Host from '../models/host';

class CreateForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      username: '',
      password: '',
      password2: '',
      equal: true
    };

    this.inputChange = this.inputChange.bind(this);
    this.back = this.back.bind(this);
    this.createAccount = this.createAccount.bind(this);
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
      this.setState({ equal: false });
      return;
    }
    Host.createAccount(username, password, (err, ret) => {
      if (err) {
        console.error('Create Account error', err, ret);
        return;
      }
      console.log('ret:', ret);
      this.props.parentPage(true);
    });
  }
  render() {
    return (
      <Grid>
        <Button
          onClick={this.back}
        >Back</Button>
        <Form horizontal onSubmit={this.createAccount}>
          <h1><ControlLabel>Create Account</ControlLabel></h1>
          <FormGroup controlId="formUsername">
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
          <FormGroup controlId="formPassword">
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
          <FormGroup controlId="formPassword2">
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
