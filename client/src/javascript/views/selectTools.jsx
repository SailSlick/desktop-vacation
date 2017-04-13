import React from 'react';
import Waypoint from 'react-waypoint';
import { Nav, Navbar, NavItem, Glyphicon, Form, InputGroup, FormGroup, FormControl, MenuItem, DropdownButton } from 'react-bootstrap';
import { success, warning, danger } from '../helpers/notifier';

export default class SelectTools extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      fixed: false,
      tag: ''
    };

    this.tagInput = this.tagInput.bind(this);
    this.rateInput = this.rateInput.bind(this);
    this.handleTagChange = this.handleTagChange.bind(this);
  }

  handleTagChange(e) {
    this.setState({ tag: e.target.value });
  }

  tagInput(op) {
    if (op !== 'add' && op !== 'remove') {
      return danger(`Invalid key input: ${op}`);
    }
    return this.props.tagAll(op, this.state.tag, (err) => {
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
            <NavItem onClick={this.props.syncAll}>
              <Glyphicon glyph="upload" />
              Sync
            </NavItem>
            <NavItem onClick={this.props.addAllToGallery}>
              <Glyphicon glyph="th" />
              Add To ...
            </NavItem>
            <NavItem onClick={this.props.removeAll}>
              <Glyphicon glyph="remove" />
              Remove
            </NavItem>
          </Nav>
          <Navbar.Form pullRight>
            <Form onSubmit={e => e.preventDefault()}>
              <FormGroup>
                <InputGroup>
                  {[1, 2, 3, 4, 5].map(val => (
                    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                    <a key={val} id={`star-${val}`} onClick={() => this.rateInput(val)}>
                      <Glyphicon glyph={'star-empty'} />
                      <Glyphicon glyph={'star'} />
                    </a>
                  ))}
                </InputGroup>
                <InputGroup>
                  <FormControl
                    type="text"
                    placeholder="tag"
                    value={this.state.tag}
                    onChange={this.handleTagChange}
                  />
                  <DropdownButton
                    componentClass={InputGroup.Button}
                    id="input-dropdown-addon"
                    title="Tag"
                  >
                    <MenuItem key="1" onSelect={() => this.tagInput('add')}>Add</MenuItem>
                    <MenuItem key="2" onSelect={() => this.tagInput('remove')}>Remove</MenuItem>
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
  syncAll: React.PropTypes.func.isRequired,
  tagAll: React.PropTypes.func.isRequired,
  rateAll: React.PropTypes.func.isRequired
};
