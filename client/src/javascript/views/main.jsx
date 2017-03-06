import React from 'react';
import { each } from 'async';
import { ipcRenderer as ipc } from 'electron';
import { Navbar, Nav, NavItem, NavDropdown, MenuItem, Grid, Modal, Button, FormGroup } from 'react-bootstrap';
import Gallery from './gallery.jsx';
import Galleries from '../models/galleries';
import Slideshow from '../helpers/slideshow-client';

const BASE_GALLERY_ID = 1;

class Main extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      galleryId: BASE_GALLERY_ID,
      newGalleryModal: false,
      selectGalleryModal: false,
      imageSelection: null,
      multiSelect: false
    };

    this.onSelectGallery = this.onSelectGallery.bind(this);
    this.getNewGalleryName = this.getNewGalleryName.bind(this);
    this.showGallerySelector = this.showGallerySelector.bind(this);
    this.addNewGallery = this.addNewGallery.bind(this);
    this.changeGallery = this.changeGallery.bind(this);
    this.hideModals = this.hideModals.bind(this);
    this.toggleSelectMode = this.toggleSelectMode.bind(this);

    // Events
    document.addEventListener('append_gallery', this.showGallerySelector, false);
  }

  componentWillUnmount() {
    // Unhook all events
    document.removeEventListener('append_gallery', this.showGallerySelector, false);
  }

  onSelectGallery(galleryId) {
    // Add pending items to gallery
    Galleries.disableSaving();
    each(this.state.imageSelection, (imageId, next) =>
      Galleries.addItem(galleryId, imageId, next),
    () =>
      Galleries.enableSaving()
    );

    this.setState({
      selectGalleryModal: false,
      imageSelection: null,
      multiSelect: false
    });
  }

  getNewGalleryName() {
    this.setState({ newGalleryModal: true });
  }

  showGallerySelector(evt) {
    this.setState({
      selectGalleryModal: true,
      imageSelection: evt.detail
    });
  }

  addNewGallery() {
    Galleries.add(this.newGalleryInput.value, (new_gallery) => {
      if (this.state.galleryId !== BASE_GALLERY_ID) {
        Galleries.addSubGallery(this.state.galleryId, new_gallery.$loki, () =>
          this.setState({ newGalleryModal: false })
        );
      } else {
        this.setState({ newGalleryModal: false });
      }
    });
  }

  changeGallery(galleryId) {
    // This if prevents deleted galleries/non-existent Ids
    // causing big issues
    if (galleryId) {
      this.setState({
        galleryId,
        imageSelection: null,
        multiSelect: false
      });
    }
  }

  hideModals() {
    this.setState({
      newGalleryModal: false,
      selectGalleryModal: false,
      imageSelection: null,
      multiSelect: false
    });
  }

  toggleSelectMode() {
    this.setState({
      multiSelect: !this.state.multiSelect
    });
  }

  render() {
    return (
      <div>
        <Navbar inverse collapseOnSelect>
          <Navbar.Header>
            <Navbar.Brand onClick={_ => this.changeGallery(BASE_GALLERY_ID)}>
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
                <MenuItem onClick={_ => this.changeGallery(BASE_GALLERY_ID)}>View</MenuItem>
                <MenuItem onClick={this.getNewGalleryName}>Add</MenuItem>
              </NavDropdown>
              <NavDropdown title="Slideshow" id="slideshow">
                <MenuItem onClick={_ => Slideshow.set(this.state.galleryId)}>
                  Use Current Gallery
                </MenuItem>
                <MenuItem onClick={_ => Slideshow.clear()}>Clear</MenuItem>
              </NavDropdown>
              <NavItem onClick={this.toggleSelectMode}>Select</NavItem>
            </Nav>
          </Navbar.Collapse>
        </Navbar>

        <Grid fluid id="main-content">
          <Gallery
            dbId={this.state.galleryId}
            onChange={this.changeGallery}
            multiSelect={this.state.multiSelect}
          />
        </Grid>

        <Modal show={this.state.newGalleryModal} onHide={this.hideModals}>
          <Modal.Header closeButton>
            <Modal.Title>Adding New Gallery</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <form>
              <FormGroup>
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
                dbId={BASE_GALLERY_ID}
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
