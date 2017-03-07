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
          onClick={parent.createPage}
        >Create Account</Button>
      </Row>
    </Grid>),
    (<Grid>
      <Row>
        <Button
          onClick={parent.logout}
        >Logout</Button>
      </Row>
      <Row>
        <Button
          onClick={parent.deleteAccount}
        >Delete Account</Button>
      </Row>
    </Grid>),
    (<CreateForm
      onChange={parent.createPage}
      parentPage={parent.backToPage}
    />),
    (<LoginForm
      onChange={parent.createPage}
      parentPage={parent.backToPage}
    />)
  ][page];
};


class Profile extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      username: '',
      password: '',
      page: props.page,
      loggedIn: false
    };

    // Bind functions
    this.logout = this.logout.bind(this);
    this.isAuthed = this.isAuthed.bind(this);
    this.deleteAccount = this.deleteAccount.bind(this);
    this.loginPage = this.loginPage.bind(this);
    this.createPage = this.createPage.bind(this);
    this.profilePage = this.profilePage.bind(this);
    this.backToPage = this.backToPage.bind(this);
  }

  profilePage() {
    // This is to show the profile details
    console.log('changing to Profile home');
    let pageNumber = 0;
    if (this.state.loggedIn) pageNumber = 1;
    this.setState({ page: pageNumber });
  }

  backToPage(log) {
    // This is to show the profile details
    console.log('back to Profile home', log);
    let pageNumber = 0;
    if (log) pageNumber = 1;
    this.setState({ page: pageNumber, loggedIn: log });
  }

  createPage() {
    // This is to show the profile details
    console.log('changing to CreateForm');
    this.setState({ page: 2 });
  }

  loginPage() {
    // This is to show the profile details
    console.log('changing to loginForm');
    this.setState({ page: 3 });
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
      <ProfileContent page={this.state.page} parent={this} />
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
