import React from 'react';
import { Button, Grid, Row } from 'react-bootstrap';
import Host from '../models/host';
import LoginForm from './loginForm.jsx';
import CreateForm from './createForm.jsx';


const ProfileContent = ({ page, parent }) => {
  if (parent.isAuthed() && page === 0) page = 1;
  return [
    (<Grid>
      <h1>Profile</h1>
      <Row>
        <Button
          onClick={_ => parent.changePage(3)}
        >Login</Button>
      </Row>
      <Row>
        <Button
          onClick={_ => parent.changePage(2)}
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
      parentPage={parent.backToPage}
    />),
    (<LoginForm
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
      page: 0,
      loggedIn: false
    };

    // Bind functions
    this.profilePage = this.profilePage.bind(this);
    this.backToPage = this.backToPage.bind(this);
    this.changePage = this.changePage.bind(this);
    this.logout = this.logout.bind(this);
    this.isAuthed = this.isAuthed.bind(this);
    this.deleteAccount = this.deleteAccount.bind(this);
  }

  profilePage() {
    // This is to show the profile details
    console.log('changing to Profile home');
    let pageNumber = 0;
    if (this.state.loggedIn) pageNumber = 1;
    this.setState({ page: pageNumber });
  }

  backToPage(loggedIn) {
    // This is to show the profile details
    console.log('back to Profile home', loggedIn);
    let pageNumber = 0;
    if (loggedIn) pageNumber = 1;
    this.setState({ page: pageNumber, loggedIn });
  }

  changePage(page) {
    console.log('changing to page:', page);
    this.setState({ page });
  }

  logout() {
    Host.logout((err, ret) => {
      if (err) {
        console.error(ret);
      }
      console.log('logout succesful');
      this.setState({ username: '', password: '', loggedIn: false, page: 0 });
    });
  }

  isAuthed() {
    return Host.isAuthed((ret) => {
      if (ret) {
        this.state.page = 1;
        this.state.loggedIn = true;
        return true;
      }
      this.state.page = 0;
      this.state.loggedIn = false;
      return false;
    });
  }

  deleteAccount(password) {
    Host.deleteAccount(password, (err, ret) => {
      if (err) {
        console.error(ret);
      }
      this.setState({ username: '', password: '', page: 0 });
    });
  }

  render() {
    return (
      <ProfileContent page={this.state.page} parent={this} />
    );
  }
}

export default Profile;
