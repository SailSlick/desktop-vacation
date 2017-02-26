import React from 'react';
import { ipcRenderer as ipc } from 'electron';
import { Navbar, Nav, NavDropdown, MenuItem, Grid } from 'react-bootstrap';
import Gallery from './gallery.jsx';

class Main extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      gallery: 'Sully_all'
    };

    this.handleSelect = this.handleSelect.bind(this);
    this.changeGallery = this.changeGallery.bind(this);
  }

  // addGallery() {
  //   this.setState({
  //     mainContent: this.state.mainContent,
  //     hoverContent: (<AddGalleryForm />)
  //   });
  // }

  handleSelect(key) {
    return {
      1.1: this.showImages,
      1.2: _ => ipc.send('open-file-dialog'),
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
            <Nav onSelect={this.handleSelect}>
              <NavDropdown title="Images" id="images">
                <MenuItem eventKey={1.1}>View</MenuItem>
                <MenuItem eventKey={1.2}>Add</MenuItem>
              </NavDropdown>
              <NavDropdown title="Galleries" id="galleries">
                <MenuItem eventKey={2.1}>View</MenuItem>
                <MenuItem eventKey={2.2}>Add</MenuItem>
              </NavDropdown>
              <NavDropdown title="Slideshow" id="slideshow">
                <MenuItem eventKey={3.1}>Add</MenuItem>
                <MenuItem eventKey={3.2}>Clear</MenuItem>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Navbar>

        <Grid fluid id="main-content">
          <Gallery
            name={this.state.gallery}
            onChange={this.changeGallery}
          />
        </Grid>
      </div>
    );
  }
}

export default Main;
