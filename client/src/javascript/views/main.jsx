import React from 'react';
import { each } from 'async';
import { AlertList } from 'react-bs-notifier';
import { ipcRenderer as ipc } from 'electron';
import { Navbar, Nav, NavItem, NavDropdown, MenuItem, Grid, Modal, Button, FormGroup } from 'react-bootstrap';
import Gallery from './gallery.jsx';
import Galleries from '../models/galleries';
import Slideshow from '../helpers/slideshow-client';
import Profile from './profile.jsx';
import { success, danger } from '../helpers/notifier';

const BASE_GALLERY_ID = 1;

const PrimaryContent = ({ page, parent }) => {
  Galleries.get({ $gt: 0 }, (cb) => {
    if (!cb) page = 1;
  });
  return [
    (<Gallery
      dbId={parent.state.galleryId}
      onChange={parent.changeGallery}
      multiSelect={parent.state.multiSelect}
    />),
    (<Profile
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
      page: 0,
      imageSelection: null,
      multiSelect: false,
      alerts: []
    };

    this.onSelectGallery = this.onSelectGallery.bind(this);
    this.getNewGalleryName = this.getNewGalleryName.bind(this);
    this.showGallerySelector = this.showGallerySelector.bind(this);
    this.addNewGallery = this.addNewGallery.bind(this);
    this.changeGallery = this.changeGallery.bind(this);
    this.hideModals = this.hideModals.bind(this);
    this.profileView = this.profileView.bind(this);
    this.showAlert = this.showAlert.bind(this);
    this.dismissAlert = this.dismissAlert.bind(this);
    this.toggleSelectMode = this.toggleSelectMode.bind(this);

    // Events
    document.addEventListener('append_gallery', this.showGallerySelector, false);
    document.addEventListener('notify', this.showAlert, false);
  }

  componentWillUnmount() {
    // Unhook all events
    document.removeEventListener('append_gallery', this.showGallerySelector, false);
    document.removeEventListener('notify', this.showAlert, false);
  }

  onSelectGallery(galleryId) {
    // Add pending items to gallery
    Galleries.should_save = false;
    const num_items = this.state.imageSelection.length;
    each(this.state.imageSelection, (imageId, next) =>
      Galleries.addItem(galleryId, imageId, (new_gal, err_msg) => next(err_msg)),
    (err_msg) => {
      Galleries.should_save = true;
      if (err_msg) danger(err_msg);
      else if (num_items === 1) success('Image added');
      else success(`${num_items} images added`);
    });

    this.setState({
      selectGalleryModal: false,
      page: 0,
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

  addNewGallery(cb) {
    Galleries.add(this.newGalleryInput.value, (new_gallery, err_msg) => {
      this.setState({ newGalleryModal: false, page: 0 });
      if (err_msg) {
        danger(err_msg);
        return cb(err_msg);
      }
      if (this.state.galleryId === BASE_GALLERY_ID) {
        success(`Gallery ${this.newGalleryInput.value} added`);
        if (typeof cb === 'function') return cb();
        return null;
      }
      return Galleries.addSubGallery(
        this.state.galleryId, new_gallery.$loki,
        (updated_gallery, sub_err_msg) => {
          if (sub_err_msg) danger(sub_err_msg);
          else success(`Gallery ${this.newGalleryInput.value} added`);
          if (typeof cb === 'function') cb();
        }
      );
    });
  }

  changeGallery(galleryId) {
    // This if prevents deleted galleries/non-existent Ids
    // causing big issues
    if (galleryId) {
      this.setState({
        galleryId,
        imageSelection: null,
        multiSelect: false,
        page: 0
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

  profileView() {
    // This is to show the profile details
    this.setState({ page: 1 });
  }

  showAlert(event) {
    const details = event.detail;
    this.state.alerts.push({
      id: (new Date()).getTime(),
      type: details.type,
      message: details.message,
      headline: details.headline
    });
    this.setState({ alerts: this.state.alerts });
  }

  dismissAlert(alert) {
    const idx = this.state.alerts.indexOf(alert);
    if (idx + 1) {
      this.state.alerts.splice(idx, 1);
      this.setState({ alerts: this.state.alerts });
    }
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
              <NavItem onClick={this.toggleSelectMode}>Select</NavItem>
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

        <AlertList
          alerts={this.state.alerts}
          timeout={4000}
          onDismiss={this.dismissAlert}
        />
      </div>
    );
  }
}

PrimaryContent.PropTypes = {
  page: React.PropTypes.number.isRequired,
  parent: React.PropTypes.instanceOf(Main).isRequired
};

export default Main;
