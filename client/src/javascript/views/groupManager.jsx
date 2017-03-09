import React from 'react';
import { Form, FormGroup, FormControl, ControlLabel, HelpBlock, InputGroup, Button, Grid, ListGroup, ListGroupItem, Row, Col } from 'react-bootstrap';
import Groups from '../models/groups';
import Host from '../models/host';
import { success, danger } from '../helpers/notifier';

class GroupManager extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};

    // Bind functions
    this.deleteGroup = this.deleteGroup.bind(this);
    this.leaveGroup = this.leaveGroup.bind(this);
    this.inviteUser = this.inviteUser.bind(this);
    this.removeUser = this.removeUser.bind(this);
    this.usernameValidationState = this.usernameValidationState.bind(this);
    this.inputChange = this.inputChange.bind(this);
  }

  // eslint-disable-next-line class-methods-use-this
  deleteGroup() {
    Groups.delete(this.props.mongoId, this.props.dbId, (err, msg) => {
      if (err) danger(msg);
      else success(msg);
    });
  }

  // eslint-disable-next-line class-methods-use-this
  leaveGroup() {
    Groups.leaveGroup(this.props.mongoId, (err, msg) => {
      if (err) danger(msg);
      else success(msg);
    });
  }

  // eslint-disable-next-line class-methods-use-this
  inviteUser(username) {
    Groups.inviteUser(this.props.mongoId, username, (err, msg) => {
      if (err) danger(msg);
      else success(msg);
    });
  }

  // eslint-disable-next-line class-methods-use-this
  removeUser(username) {
    Groups.removeUser(this.props.mongoId, username, (err, msg) => {
      if (err) danger(msg);
      else success(msg);
    });
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

  render() {
    console.log("here");
    const users = this.props.users.map(user =>
      <ListGroupItem>
        <InputGroup>
          <p>{user}</p>
          <InputGroup.Button
            onClick={_ => this.removeUser({ user })}
          >Remove User</InputGroup.Button>
        </InputGroup>
      </ListGroupItem>
    );
    console.log("here2");

    let management_buttons = [<Button onClick={this.leaveGroup} >Leave Group</Button>];
    console.log("here3");

    if (this.props.uid === Host.uid) {
      management_buttons = [
        (<Form horizontal onSubmit={this.inviteUser}>
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
                placeholder="Enter user to invite"
                value={this.state.username}
                onChange={this.inputChange}
              />
              <HelpBlock>No spaces allowed in username</HelpBlock>
            </Col>
          </FormGroup>
        </Form>),
        <Button onClick={this.deleteGroup} >Delete Group</Button>
      ];
    }
    console.log("here4");

    return (
      <Grid fluid>
        <h1>TESTS</h1>
        <Row>
          <Col sm={6} xs={12}>
            <h1><ControlLabel>Group Users</ControlLabel></h1>
            <p>Add remove user button</p>
            <ListGroup>
              {users}
            </ListGroup>
          </Col>

          <Col sm={6} xs={12}>
            <h1><ControlLabel>Group Management</ControlLabel></h1>
            {management_buttons}
          </Col>
        </Row>
      </Grid>
    );
  }
}

GroupManager.propTypes = {
  dbId: React.PropTypes.number.isRequired,
  mongoId: React.PropTypes.string.isRequired,
  uid: React.PropTypes.string.isRequired,
  users: React.PropTypes.arrayOf(React.PropTypes.string).isRequired
};

export default GroupManager;
