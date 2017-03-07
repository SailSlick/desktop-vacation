import React from 'react';
import { Button, Grid, Row } from 'react-bootstrap';
import Host from '../models/host';
import LoginForm from './loginForm.jsx';
import CreateForm from './createForm.jsx';


const ProfileContent = ({ page, parent }) => {
  parent.state.page = 0;
  return [
    (<Grid>
      <h1>Profile</h1>
      <Row>
        <Button
          onClick={parent.loginPage}
        >Login</Button>
      </Row>
      <Row>
        <Button
          onClick={parent.logout}
        >Logout</Button>
      </Row>
      <Row>
        <Button
          onClick={parent.createPage}
        >Create Account</Button>
      </Row>
      <Row>
        <Button
          onClick={parent.deleteAccount}
        >Delete Account</Button>
      </Row>
    </Grid>),
    (<CreateForm
      onChange={parent.createPage}
    />),
    (<LoginForm
      onChange={parent.createPage}
    />)
  ][page];
};


class Profile extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      username: '',
      password: '',
      page: props.page
    };

    // Bind functions
    this.logout = this.logout.bind(this);
    this.isAuthed = this.isAuthed.bind(this);
    this.deleteAccount = this.deleteAccount.bind(this);
    this.loginPage = this.loginPage.bind(this);
    this.createPage = this.createPage.bind(this);
    this.profilePage = this.profilePage.bind(this);
  }

  profilePage() {
    // This is to show the profile details
    console.log('changing to Profile home');
    this.setState({ page: 0 });
  }

  createPage() {
    // This is to show the profile details
    console.log('changing to CreateForm');
    this.setState({ page: 1 });
  }

  loginPage() {
    // This is to show the profile details
    console.log('changing to loginForm');
    this.setState({ page: 2 });
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

  deleteAccount(password) {
    Host.deleteAccount(password, (err, ret) => {
      if (err) {
        console.error(ret);
      }
      this.setState({ username: '', password: '' });
    });
  }

  render() {
    return (
      <Grid>
        <Button
          onClick={this.profilePage}
        >Back</Button>
        <ProfileContent page={this.state.page} parent={this} />
      </Grid>
    );
  }
}

Profile.defaultProps = {
  page: 0
};

Profile.propTypes = {
  page: React.PropTypes.number.isRequired,
};

export default Profile;
