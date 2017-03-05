import React from 'react';
import { FormGroup, FormControl, ControlLabel, HelpBlock, Button } from 'react-bootstrap';
import Host from '../models/host';

class Profile extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      username: '',
      password: ''
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
    });
  }

  logout() {
    Host.logout((err, ret) => {
      if (err) {
        console.error(ret);
      }
    });
  }

  isAuthed() {
    Host.isAuthed((err, ret) => {
      if (err) {
        console.error(ret);
      }
    });
  }

  createAccount(username, password) {
    Host.createAccount(username, password, (err, ret) => {
      if (err) {
        console.error(ret);
      }
    });
  }

  deleteAccount(password) {
    Host.deleteAccount(password, (err, ret) => {
      if (err) {
        console.error(ret);
      }
    });
  }

  render() {
    function genGroup({ id, label, help, ...props }) {
      return (
        <FormGroup controlId={id}>
          <ControlLabel>{label}</ControlLabel>
          <FormControl {...props} />
          {help && <HelpBlock>{help}</HelpBlock>}
        </FormGroup>
      );
    }
    return (
      <form>
        <ControlLabel>Login to Account</ControlLabel>
        <genGroup
          id="formUsername"
          label="Username"
          type="text"
          placeholder="Enter username"
          help="No spaces allowed in username"
        />
        <genGroup
          id="formPassword"
          label="Password"
          type="password"
          placeholder="Enter password"
          help="Between 7-255 chars"
        />
        <Button type="submit">Login</Button>
      </form>
    );
  }
}
export default Profile;
