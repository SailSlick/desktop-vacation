import React from 'react';
import { Form, FormGroup, FormControl, ControlLabel, HelpBlock, InputGroup, Button, Grid, ListGroup, ListGroupItem, Row, Col } from 'react-bootstrap';
import Groups from '../models/groups';
import Host from '../models/host';
import { success, danger } from '../helpers/notifier';

class GroupManager extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      username: ''
    };

    // Bind functions
    this.deleteGroup = this.deleteGroup.bind(this);
    this.leaveGroup = this.leaveGroup.bind(this);
    this.inviteUser = this.inviteUser.bind(this);
    this.removeUser = this.removeUser.bind(this);
    this.usernameValidationState = this.usernameValidationState.bind(this);
    this.inputChange = this.inputChange.bind(this);
  }

  deleteGroup() {
    Groups.delete(this.props.mongoId, this.props.dbId, (err, msg) => {
      if (err) danger(msg);
      success(msg);
      this.props.onRemove('1');
    });
  }

  leaveGroup() {
    Groups.leaveGroup(this.props.mongoId, (err, msg) => {
      if (err) danger(msg);
      else success(msg);
    });
  }

  inviteUser(event) {
    event.preventDefault();
    const username = event.target.username.value;
    return Groups.inviteUser(this.props.mongoId, username, (err, msg) => {
      if (err) return danger(msg);
      return success(msg);
    });
  }

  removeUser(username) {
    return Groups.removeUser(this.props.mongoId, username, (err, msg) => {
      if (err) return danger(msg);
      return success(msg);
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

    let management_buttons = [<Button onClick={this.leaveGroup} >Leave Group</Button>];

    if (this.props.uid === Host.uid) {
      management_buttons = [
        (<Form horizontal onSubmit={this.inviteUser}>
          <FormGroup
            controlId="formUsername"
            validationState={this.usernameValidationState()}
          >
            <Col componentClass={ControlLabel} sm={3}>
              Username
            </Col>
            <Col sm={6}>
              <FormControl
                name="username"
                type="text"
                placeholder="User to invite"
                value={this.state.username}
                onChange={this.inputChange}
              />
            </Col>
            <Col sm={2}>
              <Button type="submit">Invite</Button>
            </Col>
          </FormGroup>
          <HelpBlock>No spaces allowed in username</HelpBlock>
        </Form>),
        <Button onClick={this.deleteGroup}>Delete Group</Button>
      ];
    }

    return (
      <Grid fluid>
        <Row>
          <Col sm={5} xs={12}>
            <h3><ControlLabel>Group Users</ControlLabel></h3>
            <ListGroup>
              {users}
            </ListGroup>
          </Col>

          <Col sm={7} xs={12}>
            <h3><ControlLabel>Group Management</ControlLabel></h3>
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
  users: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
  onRemove: React.PropTypes.func.isRequired
};

export default GroupManager;
