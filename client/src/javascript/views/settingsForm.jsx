import React from 'react';
import { Form, FormGroup, FormControl, ControlLabel, HelpBlock, Button, Col, Grid } from 'react-bootstrap';
import Host from '../models/host';
import { success, danger } from '../helpers/notifier';

class SettingsForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      timer: '',
      password: '',
      password2: ''
    };

    this.pwValidationState = this.pwValidationState.bind(this);
    this.pw2ValidationState = this.pw2ValidationState.bind(this);
    this.timerValidationState = this.timerValidationState.bind(this);
    this.inputChange = this.inputChange.bind(this);
    this.back = this.back.bind(this);
    this.changeSettings = this.changeSettings.bind(this);
  }

  pwValidationState() {
    const length = this.state.password.length;
    if (length < 6) return 'warning';
    return 'success';
  }

  pw2ValidationState() {
    const length = this.state.password2.length;
    if (this.state.password2 !== this.state.password) return 'error';
    if (length < 6) return 'warning';
    return 'success';
  }

  timerValidationState() {
    if (isNaN(this.state.timer)) return 'error';
    else if (this.state.timer < 0.1) return 'warning';
    return 'success';
  }

  inputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  back() {
    this.props.parentPage(true);
  }

  changeSettings(event) {
    event.preventDefault();
    const timer = event.target.timer.value;
    const password = event.target.password.value;
    const password2 = event.target.password2.value;
    if (timer) {
      Host.getIndex(1, (doc) => {
        doc.slideshowConfig.timer = timer;
        Host.update({}, doc, (ret) => {
          if (!ret) danger('timer update failed');
          else {
            success('slideshow timer updated');
            this.props.parentPage(true);
          }
        });
      });
    }
    if (password && password2) {
      if (password !== password2) {
        danger('Passwords do not match');
      } else {
        Host.updateAccount(password, (err, ret) => {
          if (err) danger(ret);
          else {
            success(ret);
            this.props.parentPage(true);
          }
        });
      }
    }
  }

  render() {
    return (
      <Grid>
        <br />
        <Button
          onClick={this.back}
        >
          Back
        </Button>
        <Form horizontal onSubmit={this.changeSettings}>
          <h1><ControlLabel>Profile Settings</ControlLabel></h1>
          <FormGroup
            controlId="formPassword"
            validationState={this.pwValidationState()}
          >
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
              <HelpBlock>Change your password. Between 7-255 characters</HelpBlock>
            </Col>
          </FormGroup>
          <FormGroup
            controlId="formPassword2"
            validationState={this.pw2ValidationState()}
          >
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
              <HelpBlock>Double check password</HelpBlock>
            </Col>
          </FormGroup>
          <FormGroup
            controlId="formTimer"
            validationState={this.timerValidationState()}
          >
            <Col componentClass={ControlLabel} sm={2}>
              Slideshow Timer
            </Col>
            <Col lg={4} sm={10}>
              <FormControl
                name="timer"
                placeholder="Enter time"
                type="number"
                step="0.01"
                value={this.state.timer}
                onChange={this.inputChange}
              />
              <HelpBlock>Time in minutes</HelpBlock>
            </Col>
          </FormGroup>
          <Button type="submit">Make change</Button>
        </Form>
      </Grid>
    );
  }
}

SettingsForm.propTypes = {
  parentPage: React.PropTypes.func.isRequired
};

export default SettingsForm;
