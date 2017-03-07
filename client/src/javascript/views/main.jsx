import React from 'react';
import { ipcRenderer as ipc } from 'electron';
import { Navbar, Nav, NavItem, NavDropdown, MenuItem, Grid, Modal, Button, FormGroup } from 'react-bootstrap';
import Gallery from './gallery.jsx';
import Galleries from '../models/galleries';
import Slideshow from '../helpers/slideshow-client';
import Profile from './profile.jsx';

const BASE_GALLERY_ID = 1;

const PrimaryContent = ({ page, parent }) => {
  Galleries.get({ $gt: 0 }, (cb) => {
    if (!cb) page = 1;
  });
  return [
    (<Gallery
      dbId={parent.state.galleryId}
      onChange={parent.changeGallery}
    />),
    (<Profile
      page={0}
      onChange={parent.profileView}
    />)
  ][page];
};

class Main extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      galleryId: BASE_GALLERY_ID,
      newGalleryModal: false,
      selectGalleryModal: false,
      imageId: null,
      page: 0
    };

    this.onSelectGallery = this.onSelectGallery.bind(this);
    this.getNewGalleryName = this.getNewGalleryName.bind(this);
    this.showGallerySelector = this.showGallerySelector.bind(this);
    this.addNewGallery = this.addNewGallery.bind(this);
    this.changeGallery = this.changeGallery.bind(this);
    this.hideModals = this.hideModals.bind(this);
    this.profileView = this.profileView.bind(this);

    // Events
    document.addEventListener('append_gallery', this.showGallerySelector, false);
  }

  componentWillUnmount() {
    // Unhook all events
    document.removeEventListener('append_gallery', this.showGallerySelector, false);
  }

  onSelectGallery(galleryId) {
    this.setState({
      selectGalleryModal: false,
      imageId: null,
      page: 0
    });

    // Add pending item to gallery
    Galleries.addItem(galleryId, this.state.imageId, () => true);
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
    Galleries.add(this.newGalleryInput.value, (new_gallery) => {
      if (this.state.galleryId !== BASE_GALLERY_ID) {
        Galleries.addSubGallery(this.state.galleryId, new_gallery.$loki, () =>
          this.setState({ newGalleryModal: false, page: 0 })
        );
      } else {
        this.setState({ newGalleryModal: false, page: 0 });
      }
    });
  }

  changeGallery(galleryId) {
    // This if prevents deleted galleries/non-existent Ids
    // causing big issues
    if (galleryId) {
      this.setState({ galleryId, page: 0 });
    }
  }

  hideModals() {
    this.setState({
      newGalleryModal: false,
      selectGalleryModal: false,
      imageId: null
    });
  }

  profileView() {
    // This is to show the profile details
    this.setState({ page: 1 });
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
              <NavItem onClick={_ => this.profileView()}>Profile</NavItem>
            </Nav>
          </Navbar.Collapse>
        </Navbar>

        <Grid fluid id="main-content">
          <PrimaryContent page={this.state.page} parent={this} />
        </Grid>

        <Modal show={this.state.newGalleryModal} onHide={this.hideModals}>
          <Modal.Header closeButton>
            <Modal.Title>Adding New Gallery</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <form onSubmit={e => e.preventDefault() || this.addNewGallery()}>
              <FormGroup>
                <input
                  id="galleryName"
                  type="text"
                  placeholder="Gallery Name"
                  ref={(input) => { this.newGalleryInput = input; }}
                />
              </FormGroup>
              <Button type="submit">
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
              <Profile
                onChange={this.profileView}
              />
            </Grid>
          </Modal.Body>
        </Modal>
      </div>
    );
  }
}


PrimaryContent.PropTypes = {
  page: React.PropTypes.number.isRequired,
  parent: React.PropTypes.instanceOf(Main).isRequired
};

export default Main;
