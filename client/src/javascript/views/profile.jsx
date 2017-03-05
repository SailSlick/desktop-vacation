import React from 'react';
import { FormGroup, FormControl, ControlLabel, HelpBlock, Button, Col, Grid, Row } from 'react-bootstrap';
import Host from '../models/host';

function genGroup({ id, label, help, ...props }) {
  return (
    <FormGroup controlId={id}>
      <Col componentClass={ControlLabel} sm={2}>
        {label}
      </Col>
      <Col sm={10}>
        <FormControl {...props} />
      </Col>
      {help && <HelpBlock>{help}</HelpBlock>}
    </FormGroup>
  );
}

class Profile extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      username: '',
      password: '',
      loginForm: false,
      createForm: false
    };

    // Bind functions
    this.refresh = this.refresh.bind(this);
    this.login = this.login.bind(this);
  }

  componentDidMount() {
    this.refresh();
  }

  componentWillReceiveProps() {
    this.refresh();
  }

  componentWillUnmount() {
    // Unhook all events
    document.removeEventListener('gallery_updated', this.refresh, false);
  }

  usernameChange(username) {
    this.setState({ username });
  }

  passwordChange(password) {
    this.setState({ password });
  }

  login(username, password) {
    Host.login(username, password, (err, ret) => {
      if (err) {
        console.error(ret);
      }
      this.setState({ username, password });
    });
  }

  logout() {
    Host.logout((err, ret) => {
      if (err) {
        console.error(ret);
      }
      this.setState({ username: '', password: '' });
    });
  }

  isAuthed() {
    Host.isAuthed((err, ret) => {
      if (err) {
        console.error(ret);
      }
      this.setState({});
    });
  }

  createAccount(username, password) {
    Host.createAccount(username, password, (err, ret) => {
      if (err) {
        console.error(ret);
      }
      this.setState({ username, password });
    });
  }

  deleteAccount(password) {
    Host.deleteAccount(password, (err, ret) => {
      if (err) {
        console.error(ret);
      }
      this.setState({ username: '', password: '' });
    });
  }

  render() {
    if (this.state.loginForm) {
      return (
        <form horizontal>
          <ControlLabel>Login to Account</ControlLabel>
          <genGroup
            id="formUsername"
            label="Username"
            type="text"
            placeholder="Enter username"
            help="No spaces allowed in username"
            onChange={this.usernameChange}
          />
          <genGroup
            id="formPassword"
            label="Password"
            type="password"
            placeholder="Enter password"
            help="Between 7-255 chars"
            onChange={this.passwordChange}
          />
          <Button
            type="submit"
            onClick={this.login}
          >Login</Button>
        </form>
      );
    } else if (this.state.createForm) {
      return (
        <form horizontal>
          <ControlLabel>Create Account</ControlLabel>
          <genGroup
            id="formUsername"
            label="Username"
            type="text"
            placeholder="Enter username"
            help="No spaces allowed in username"
            onChange={this.usernameChange}
          />
          <genGroup
            id="formPassword"
            label="Password"
            type="password"
            placeholder="Enter password"
            help="Between 7-255 chars"
            onChange={this.passwordChange}
          />
          <genGroup
            id="formPassword2"
            label="Password2"
            type="password"
            placeholder="Enter password again"
            onChange={this.passwordChange}
          />
          <Button
            type="submit"
            onClick={this.createAccount}
          >Login</Button>
        </form>
      );
    }
    return (
      <Grid>
        <Row>
          <Button
            type="submit"
            onClick={this.setState({ loginForm: true })}
          >Login</Button>
        </Row>
        <Row>
          <Button
            type="submit"
            onClick={this.logout}
          >Logout</Button>
        </Row>
        <Row>
          <Button
            type="submit"
            onClick={this.setState({ createForm: true })}
          >Create Account</Button>
        </Row>
        <Row>
          <Button
            type="submit"
            onClick={this.deleteAccount}
          >Delete Account</Button>
        </Row>
      </Grid>
    );
  }
}

Profile.propTypes = {
  username: React.PropTypes.string.isRequired,
  password: React.PropTypes.string.isRequired,
  loginForm: React.PropTypes.bool
};

export default Profile;
