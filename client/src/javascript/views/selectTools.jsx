import React from 'react';
import Waypoint from 'react-waypoint';
import { Nav, Navbar, NavItem, Glyphicon, Form, InputGroup, FormGroup, FormControl, Button } from 'react-bootstrap';
import { success, warning, danger } from '../helpers/notifier';

export default class SelectTools extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      fixed: false
    };

    this.tagInput = this.tagInput.bind(this);
  }

  tagInput(ev) {
    ev.preventDefault();
    const key = ev.target.metadataKey.value;
    let value = ev.target.metadataValue.value;
    if (key !== 'rating' && key !== 'tags') {
      return danger(`invalid key input: ${key}`);
    }
    if (key === 'rating') {
      value = Number(value);
      if (isNaN(value) || value > 5 || value < 0) return danger('Rating must be a number between 0 & 5');
    }
    return this.props.tagAll(key, value, (err) => {
      if (err) warning(err);
      else success('Updated metadata');
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
                <FormControl name="metadataKey" componentClass="select">
                  <option value="tags">tag</option>
                  <option value="rating">rating</option>
                </FormControl>
                {' '}
                <InputGroup>
                  <FormControl name="metadataValue" type="text" />
                  {' '}
                  <Button type="submit">
                    <Glyphicon glyph="tag" />
                  </Button>
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
  tagAll: React.PropTypes.func.isRequired
};
