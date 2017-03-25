import React from 'react';
import { Button, Grid, Row } from 'react-bootstrap';
import Host from '../models/host';
import LoginForm from './loginForm.jsx';
import CreateForm from './createForm.jsx';
import SettingsForm from './settingsForm.jsx';
import { success, danger } from '../helpers/notifier';


const ProfileContent = ({ page, parent }) =>
  [
    (<Grid>
      <h1>Hi {parent.state.username}</h1>
      <h1>Profile</h1>
      <Row>
        <Button onClick={_ => parent.changePage(3)}>Login</Button>
      </Row>
      <br />
      <Row>
        <Button onClick={_ => parent.changePage(2)}>Create Account</Button>
      </Row>
    </Grid>),
    (<Grid>
      <h1>Hi, {parent.state.username}</h1>
      <Row>
        <Button onClick={parent.logout}>Logout</Button>
      </Row>
      <br />
      <Row>
        <Button onClick={parent.deleteAccount}>Delete Account</Button>
      </Row>
      <br />
      <Row>
        <Button onClick={_ => parent.changePage(4)}>Change Settings</Button>
      </Row>
    </Grid>),
    (<CreateForm
      parentPage={parent.backToPage}
    />),
    (<LoginForm
      parentPage={parent.backToPage}
    />),
    (<SettingsForm
      parentPage={parent.backToPage}
    />)
  ][page];


class Profile extends React.Component {
  constructor(props) {
    super(props);
    const isAuthed = Host.isAuthed();

    this.state = {
      username: 'please make an account',
      page: isAuthed ? 1 : 0,
      loggedIn: false
    };

    // Bind functions
    this.backToPage = this.backToPage.bind(this);
    this.changePage = this.changePage.bind(this);
    this.logout = this.logout.bind(this);
    this.deleteAccount = this.deleteAccount.bind(this);
  }

  componentDidMount() {
    Host.get({ $gt: 0 }, (doc) => {
      if (doc) this.setState({ username: doc.username });
    });
  }

  backToPage(loggedIn) {
    // This is to show the profile details
    console.log('back to Profile home', loggedIn);
    if (loggedIn) {
      this.props.accountCreated();
      Host.get({ $gt: 0 }, (doc) => {
        if (doc) this.setState({ page: 1, username: doc.username });
      });
      return;
    }
    this.setState({ page: 0, loggedIn });
  }

  changePage(page) {
    console.log('changing to page:', page);
    // Return to login page if..
    // - You're not logged in
    // - You're not trying to log in
    if (!Host.isAuthed() && page !== 2 && page !== 3) {
      this.setState({ page: 0 });
    } else {
      this.setState({ page });
    }
  }

  logout() {
    Host.logout((err, ret) => {
      if (err) danger(ret);
      else {
        success(ret);
        this.setState({ username: 'please make an account', loggedIn: false, page: 0 });
      }
    });
  }

  deleteAccount() {
    Host.deleteAccount((err, ret) => {
      if (err) danger(ret);
      else {
        success(ret);
        this.setState({ username: 'please make an account', page: 0 });
      }
    });
  }

  render() {
    return (
      <ProfileContent page={this.state.page} parent={this} />
    );
  }
}

Profile.propTypes = {
  accountCreated: React.PropTypes.func.isRequired
};

export default Profile;
