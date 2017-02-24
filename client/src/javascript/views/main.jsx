import React from 'react';
import { Navbar, Nav, NavDropdown, MenuItem } from 'react-bootstrap';
import Images from './images';
import Galleries from './galleries';

const navBar = (
  <Navbar inverse collapseOnSelect>
    <Navbar.Header>
      <Navbar.Brand>
        <a href="#">Desktop Vacation</a>
      </Navbar.Brand>
      <Navbar.Toggle />
    </Navbar.Header>
    <Navbar.Collapse>
      <Nav>
        <NavDropdown title="Images">
          <MenuItem eventKey={1.1}>View</MenuItem>
          <MenuItem eventKey={1.2}>Add</MenuItem>
        </NavDropdown>
        <NavDropdown title="Galleries">
          <MenuItem eventKey={2.1}>View</MenuItem>
          <MenuItem eventKey={2.2}>Add</MenuItem>
        </NavDropdown>
        <NavDropdown title="Slideshow">
          <MenuItem eventKey={3.1}>Add</MenuItem>
          <MenuItem eventKey={3.2}>Clear</MenuItem>
        </NavDropdown>
      </Nav>
    </Navbar.Collapse>
  </Navbar>
);

const mainFooter = (
  <script type='text/javascript' src='app.js'></script>
)

class Main extends React.Component {
  showImages() {
    this.setState({
      mainContent: (<Images />),
      hoverContent: null
    });
  }

  showGalleries() {
    this.setState({
      mainContent: (<Galleries />),
      hoverContent: null
    });
  }

  addGallery() {
    this.setState({
      mainContent: this.state.mainContent,
      hoverContent: (<AddGalleryForm />)
    });
  }

  handleSelect(evt, key) {
    return {
      1.1: this.showImages,
      1.2: Images.add,
      2.1: this.showGalleries,
      2.2: this.addGallery
    }[key]();
  }

  render() {
    return mainBody;
  }
}

export default Main;
