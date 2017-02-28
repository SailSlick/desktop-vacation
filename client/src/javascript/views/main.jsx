import React from 'react';
import { ipcRenderer as ipc } from 'electron';
import { Navbar, Nav, NavDropdown, MenuItem, Grid, Modal, Button, FormGroup, ControlLabel } from 'react-bootstrap';
import Gallery from './gallery.jsx';
import Galleries from '../models/galleries';

class Main extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      gallery: 'Sully_all',
      getNewGalleryName: false
    };

    this.getNewGalleryName = this.getNewGalleryName.bind(this);
    this.addNewGallery = this.addNewGallery.bind(this);
    this.changeGallery = this.changeGallery.bind(this);
    this.hideModals = this.hideModals.bind(this);
  }

  getNewGalleryName() {
    this.setState({ getNewGalleryName: true });
  }

  changeGallery(gallery) {
    this.setState({ gallery });
  }

  addNewGallery() {
    Galleries.add(this.newGalleryInput.value, new_gallery =>
      this.setState({
        gallery: new_gallery.name,
        getNewGalleryName: false
      })
    );
  }

  hideModals() {
    this.setState({ getNewGalleryName: false });
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
                <MenuItem onClick={_ => ipc.send('open-file-dialog')}>Add</MenuItem>
              </NavDropdown>
              <NavDropdown title="Galleries" id="galleries">
                <MenuItem onClick={_ => this.changeGallery('Sully_all')}>View</MenuItem>
                <MenuItem onClick={this.getNewGalleryName}>Add</MenuItem>
              </NavDropdown>
              <NavDropdown title="Slideshow" id="slideshow">
                <MenuItem>Add</MenuItem>
                <MenuItem>Clear</MenuItem>
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

        <Modal show={this.state.getNewGalleryName} onHide={this.hideModals}>
          <Modal.Header closeButton>
            <Modal.Title>Enter a gallery name</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <form>
              <FormGroup>
                <ControlLabel>Name</ControlLabel>
                <input
                  id="galleryName"
                  type="text"
                  placeholder="Gallery Name"
                  ref={(input) => { this.newGalleryInput = input; }}
                />
              </FormGroup>
              <Button type="button" onClick={this.addNewGallery}>
                Add
              </Button>
            </form>
          </Modal.Body>
        </Modal>
      </div>
    );
  }
}

export default Main;
