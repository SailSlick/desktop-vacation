import React from 'react';
import Waypoint from 'react-waypoint';
import { Navbar, Form, FormGroup, InputGroup, FormControl, Button, Glyphicon } from 'react-bootstrap';

export default class SelectTools extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
    };
  }

  render() {
    if (!this.props.filterToggle) {
      return null;
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
              Filter
            </Navbar.Brand>
          </Navbar.Header>
          <Navbar.Form pullRight>
            <Form onSubmit={this.props.changeFilter}>
              <FormGroup>
                <FormControl name="filterKey" componentClass="select">
                  <option value="name">name</option>
                  <option value="tag">tag</option>
                  <option value="rating">rating</option>
                </FormControl>
                {' '}
                <InputGroup>
                  <FormControl name="filterValue" type="text" placeholder="Filter view" />
                  <InputGroup.Button>
                    <Button type="submit">
                      <Glyphicon glyph={'search'} />
                    </Button>
                  </InputGroup.Button>
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
  filterToggle: React.PropTypes.bool.isRequired,
  changeFilter: React.PropTypes.func.isRequired
};
