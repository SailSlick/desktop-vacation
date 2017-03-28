import React from 'react';
import Waypoint from 'react-waypoint';
import { Nav, Navbar, NavItem, Glyphicon, Form, FormGroup, FormControl, Button } from 'react-bootstrap';

export default class SelectTools extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      fixed: false
    };
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.multiSelect && this.props.multiSelect) {
      this.props.clearFilter(false);
    }
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
          <Navbar.Collapse>
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
              <NavItem onClick={this.props.clearFilter}>
                <Glyphicon glyph="remove" />
                Clear Filter
              </NavItem>
            </Nav>
            <Navbar.Form pullLeft>
              <Form onSubmit={this.props.changeFilter}>
                <FormGroup>
                  <FormControl name="filterValue" type="text" placeholder="Filter gallery" />
                  <FormControl name="filterKey" componentClass="select">
                    <option value="name">name</option>
                    <option value="tag">tag</option>
                    <option value="rating">rating</option>
                  </FormControl>
                </FormGroup>
                <Button type="submit">Filter</Button>
              </Form>
            </Navbar.Form>
          </Navbar.Collapse>
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
  changeFilter: React.PropTypes.func.isRequired,
  clearFilter: React.PropTypes.func.isRequired
};
