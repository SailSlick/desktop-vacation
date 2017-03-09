import React from 'react';
import { Form, FormGroup, FormControl, ControlLabel, HelpBlock, Button, Grid,
ListGroup, ListGroupItem, Row, Col } from 'react-bootstrap';
import Groups from '../models/groups';
import { success, danger } from '../helpers/notifier';

class GroupManager extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};

    // Bind functions
    this.refresh = this.refresh.bind(this);
    this.deleteGroup = this.deleteGroup.bind(this);
    this.leaveGroup = this.leaveGroup.bind(this);
    this.inviteUser = this.inviteUser.bind(this);
    this.removeUser = this.removeUser.bind(this);
    this.usernameValidationState = this.usernameValidationState.bind(this);
    this.inputChange = this.inputChange.bind(this);
  }

  // eslint-disable-next-line class-methods-use-this
  deleteGroup(mongoId, id) {
    Groups.delete(mongoId, id, (err, msg) => {
      if (err) danger(msg);
      else {
        success(msg);
      }
    });
  }

  // eslint-disable-next-line class-methods-use-this
  leaveGroup(mongoId, id) {
    Groups.delete(mongoId, id, (err, msg) => {
      if (err) danger(msg);
      else {
        success(msg);
      }
    });
  }

  // eslint-disable-next-line class-methods-use-this
  inviteUser(mongoId, id) {
    Groups.delete(mongoId, id, (err, msg) => {
      if (err) danger(msg);
      else {
        success(msg);
      }
    });
  }

  // eslint-disable-next-line class-methods-use-this
  removeUser(mongoId, id) {
    Groups.delete(mongoId, id, (err, msg) => {
      if (err) danger(msg);
      else {
        success(msg);
      }
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
    return (
      <Grid fluid>
        <Row>
          <Col sm={6} xs={12}>
            <h1><ControlLabel>Group Users</ControlLabel></h1>
            <p>Add remove user button</p>
            <ListGroup>
              <ListGroupItem>User 1</ListGroupItem>
              <ListGroupItem>User 2</ListGroupItem>
              <ListGroupItem>...</ListGroupItem>
            </ListGroup>
          </Col>
          <Col sm={6} xs={12}>
            <h1><ControlLabel>Group Management</ControlLabel></h1>
            <Form horizontal onSubmit={this.inviteUser}>
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
            </Form>
            <Button
              onClick={this.deleteGroup}
            >Delete Group</Button>

            <p>needs check to see if you are owner</p>
            <Button
              onClick={this.leaveGroup}
            >Leave Group</Button>
          </Col>
        </Row>
      </Grid>
    );
  }
}

export default GroupManager;
