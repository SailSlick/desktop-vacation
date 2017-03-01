import React from 'react';
import { ipcRenderer as ipc } from 'electron';
import { Navbar, Nav, NavDropdown, MenuItem, Grid, Modal, Button, FormGroup, ControlLabel } from 'react-bootstrap';
import Gallery from './gallery.jsx';
import Galleries from '../models/galleries';

const BASE_GALLERY = 'Sully_all';

class Main extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      gallery: BASE_GALLERY,
      newGalleryModal: false,
      selectGalleryModal: false,
      imageId: null
    };

    this.onSelectGallery = this.onSelectGallery.bind(this);
    this.getNewGalleryName = this.getNewGalleryName.bind(this);
    this.showGallerySelector = this.showGallerySelector.bind(this);
    this.addNewGallery = this.addNewGallery.bind(this);
    this.changeGallery = this.changeGallery.bind(this);
    this.hideModals = this.hideModals.bind(this);

    // Events
    document.addEventListener('append_gallery', this.showGallerySelector, false);
  }

  componentWillUnmount() {
    // Unhook all events
    document.removeEventListener('append_gallery', this.showGallerySelector, false);
  }

  onSelectGallery(gallery) {
    this.setState({
      selectGalleryModal: false,
      imageId: null
    });

    // Add pending item to gallery
    Galleries.addItem(gallery, this.state.imageId);
  }

  getNewGalleryName() {
    this.setState({ newGalleryModal: true });
  }

  showGallerySelector(evt) {
    this.setState({
      selectGalleryModal: true,
      imageId: evt.detail
    });
  }

  addNewGallery() {
    Galleries.add(this.newGalleryInput.value, () =>
      this.setState({ newGalleryModal: false })
    );
  }

  changeGallery(gallery) {
    this.setState({ gallery });
  }

  hideModals() {
    this.setState({
      newGalleryModal: false,
      selectGalleryModal: false,
      imageId: null
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
                <MenuItem onClick={_ => ipc.send('open-file-dialog')}>Add</MenuItem>
              </NavDropdown>
              <NavDropdown title="Galleries" id="galleries">
                <MenuItem onClick={_ => this.changeGallery(BASE_GALLERY)}>View</MenuItem>
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

        <Modal show={this.state.newGalleryModal} onHide={this.hideModals}>
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

        <Modal show={this.state.selectGalleryModal} onHide={this.hideModals}>
          <Modal.Header closeButton>
            <Modal.Title>Select a Gallery</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Grid fluid>
              <Gallery
                simple
                name={BASE_GALLERY}
                onChange={this.onSelectGallery}
              />
            </Grid>
          </Modal.Body>
        </Modal>
      </div>
    );
  }
}

export default Main;
