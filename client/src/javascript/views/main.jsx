import React from 'react';
import { Navbar, Nav, NavDropdown, MenuItem } from 'react-bootstrap';
import Gallery from './gallery';
import Images from '../models/images';

class Main extends React.Component {
  // addGallery() {
  //   this.setState({
  //     mainContent: this.state.mainContent,
  //     hoverContent: (<AddGalleryForm />)
  //   });
  // }
  getInitialState() {
    return {
      gallery: 'Sully_all'
    };
  }

  handleSelect(evt, key) {
    return {
      1.1: this.showImages,
      1.2: Images.add,
      2.1: this.showGalleries,
      // 2.2: this.addGallery
    }[key]();
  }

  changeGallery(name) {
    this.setState({
      gallery: name
    });
  }

  render() {
    return (
      <div>
        <Navbar inverse collapseOnSelect>
          <Navbar.Header>
            <Navbar.Brand>
              Desktop Vacation
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

        <main id="main-content" className="container-fluid">
          <Gallery
            name={this.state.gallery}
            onChange={this.changeGallery}
          />
        </main>
      </div>
    );
  }
}

export default Main;
