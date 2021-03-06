import React from 'react';
import Waypoint from 'react-waypoint';
import mousetrap from 'mousetrap';
import { Navbar, Form, FormControl, Button, Glyphicon } from 'react-bootstrap';

export default class FilterTools extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      fixed: false,
      tagInput: '',
      name: '',
      rating: 0,
    };

    this.filter = this.filter.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.clearFilter = this.clearFilter.bind(this);

    mousetrap.bind('shift+f', this.filter);
  }

  componentWillUnmount() {
    mousetrap.unbind('shift+f');
  }

  filter() {
    const tags = this.state.tagInput.split(',');
    const filter = {
      tags,
      name: this.state.name,
      rating: this.state.rating
    };
    this.props.changeFilter(filter);
  }

  clearFilter() {
    this.setState({
      name: '',
      tagInput: '',
      rating: 0
    });
    this.props.changeFilter({
      tags: [],
      name: '',
      rating: 0
    });
  }

  handleChange(ev) {
    this.setState({ [ev.target.name]: ev.target.value });
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
            <Form onSubmit={e => e.preventDefault()}>
              {[1, 2, 3, 4, 5].map((val) => {
                if (val === this.state.rating) {
                  // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                  return (<a
                    key={val}
                    id="deselect-star"
                    onClick={() => this.setState({ rating: 0 })}
                  >
                    <Glyphicon glyph="star" />
                  </a>);
                }
                // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                return (<a
                  key={val}
                  className="star-hover"
                  onClick={() => this.setState({ rating: val })}
                >
                  <Glyphicon glyph="star-empty" />
                  <Glyphicon glyph="star" />
                </a>);
              })}
              <FormControl
                name="tagInput"
                type="text"
                placeholder="tags"
                value={this.state.tagInput}
                onChange={this.handleChange}
              />
              <FormControl
                name="name"
                type="text"
                placeholder="name"
                value={this.state.name}
                onChange={this.handleChange}
              />
              <Button onClick={this.filter}>
                <Glyphicon glyph={'search'} />
              </Button>
              <Button onClick={this.clearFilter}>
                <Glyphicon glyph={'remove'} />
              </Button>
            </Form>
          </Navbar.Form>
        </Navbar>
      </div>
    );
  }
}

FilterTools.propTypes = {
  filterToggle: React.PropTypes.bool.isRequired,
  changeFilter: React.PropTypes.func.isRequired
};
