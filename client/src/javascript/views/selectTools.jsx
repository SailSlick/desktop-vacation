import React from 'react';
import Waypoint from 'react-waypoint';
import { Nav, Navbar, NavItem, Glyphicon, Form, InputGroup, FormGroup, FormControl, Button, MenuItem, DropdownButton } from 'react-bootstrap';
import { success, warning, danger } from '../helpers/notifier';

export default class SelectTools extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      fixed: false
    };

    this.tagInput = this.tagInput.bind(this);
    this.rateInput = this.rateInput.bind(this);
  }

  tagInput(ev) {
    ev.preventDefault();
    const key = ev.target.metadataKey.value;
    const value = ev.target.metadataValue.value;
    if (key !== 'add tag' && key !== 'remove tag') {
      return danger(`Invalid key input: ${key}`);
    }
    return this.props.tagAll(key, value, (err) => {
      if (err) warning(err);
      else success('Updated tags');
    });
  }

  rateInput(value) {
    return this.props.rateAll(value, (err) => {
      if (err) warning(err);
      else success('Updated tags');
    });
  }

  render() {
    if (!this.props.multiSelect) {
      return <br />;
    }
    return (
      <div>
        <Waypoint
          onEnter={() => this.setState({ fixed: false })}
          onLeave={() => this.setState({ fixed: true })}
        />
        <span
          style={{
            display: this.state.fixed ? 'block' : 'none',
            height: '72px'
          }}
        />
        <Navbar className={this.state.fixed ? 'fixed-pos' : ''}>
          <Navbar.Header>
            <Navbar.Brand>
              MultiSelect
            </Navbar.Brand>
          </Navbar.Header>
          <Nav bsStyle="pills">
            <NavItem onClick={_ => this.props.selectAll(true)}>
              <Glyphicon glyph="plus" />
              Select All
            </NavItem>
            <NavItem onClick={_ => this.props.selectAll(false)}>
              <Glyphicon glyph="minus" />
              Deselect All
            </NavItem>
            <NavItem onClick={this.props.addAllToGallery}>
              <Glyphicon glyph="th" />
              Add To Gallery
            </NavItem>
            <NavItem onClick={this.props.removeAll}>
              <Glyphicon glyph="remove" />
              Remove
            </NavItem>
          </Nav>
          <Navbar.Form pullRight>
            <Form onSubmit={this.tagInput}>
              <FormGroup>
                <InputGroup>
                  {[1, 2, 3, 4, 5].map(val => (
                    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                    <a key={val} onClick={() => this.rateInput(val)}>
                      <Glyphicon glyph={'star-empty'} />
                    </a>
                  ))}
                </InputGroup>
                <InputGroup>
                  <FormControl type="text" />
                  <DropdownButton
                    componentClass={InputGroup.Button}
                    id="input-dropdown-addon"
                    title="Add/Remove"
                  >
                    <MenuItem key="1">Add</MenuItem>
                    <MenuItem key="2">Remove</MenuItem>
                  </DropdownButton>
                </InputGroup>
              </FormGroup>
            </Form>
          </Navbar.Form>
        </Navbar>
      </div>
    );
  }
}

SelectTools.propTypes = {
  multiSelect: React.PropTypes.bool.isRequired,
  addAllToGallery: React.PropTypes.func.isRequired,
  selectAll: React.PropTypes.func.isRequired,
  removeAll: React.PropTypes.func.isRequired,
  tagAll: React.PropTypes.func.isRequired,
  rateAll: React.PropTypes.func.isRequired
};
