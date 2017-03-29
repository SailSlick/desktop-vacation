import React from 'react';
import Waypoint from 'react-waypoint';
import { Nav, Navbar, NavItem, Glyphicon } from 'react-bootstrap';

export default class SelectTools extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      fixed: false
    };
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
              Tools
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
        </Navbar>
      </div>
    );
  }
}

SelectTools.propTypes = {
  multiSelect: React.PropTypes.bool.isRequired,
  addAllToGallery: React.PropTypes.func.isRequired,
  selectAll: React.PropTypes.func.isRequired,
  removeAll: React.PropTypes.func.isRequired
};
