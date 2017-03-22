import React from 'react';
import { each } from 'async';
import { AlertList } from 'react-bs-notifier';
import { ipcRenderer as ipc } from 'electron';
import { Navbar, Nav, NavItem, NavDropdown, MenuItem, Grid, Modal, Button, FormGroup, FormControl, ListGroup, ListGroupItem, InputGroup } from 'react-bootstrap';
import Gallery from './gallery.jsx';
import Galleries from '../models/galleries';
import Host from '../models/host';
import Slideshow from '../helpers/slideshow-client';
import Profile from './profile.jsx';
import Group from './group.jsx';
import Groups from '../models/groups';
import { success, danger } from '../helpers/notifier';

const BASE_GALLERY_ID = 1;
const BASE_GROUP_ID = '1';

const PrimaryContent = ({ page, parent }) => {
  Galleries.get(BASE_GALLERY_ID, (gallery) => {
    if (!gallery) page = 2;
  });
  return [
    (<Gallery
      dbId={parent.state.galleryId}
      onChange={parent.changeGallery}
      multiSelect={parent.state.multiSelect}
    />),
    (<Group
      dbId={parent.state.groupId}
      onChange={parent.changeGroup}
      multiSelect={parent.state.multiSelect}
    />),
    (<Profile
      onChange={parent.profileView}
    />)
  ][page];
};

const InvitesContent = ({ parent }) => {
  let invites_react = [];
  invites_react = parent.state.invites.map(invite =>
    <ListGroupItem>
      <InputGroup>
        <p>{invite.groupname}</p>
        <Button
          onClick={_ => parent.joinGroup(invite.gid, invite.groupname)}
        >Join</Button>
        <Button
          onClick={_ => parent.refuseInvite(invite.gid, invite.groupname)}
        >Refuse</Button>
      </InputGroup>
    </ListGroupItem>
  );
  return (
    <Grid fluid>
      <Button onClick={parent.inviteRefresh}>Refresh</Button>
      <ListGroup>
        {invites_react.map(invite => invite || null)}
      </ListGroup>
    </Grid>
  );
};

class Main extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      galleryId: BASE_GALLERY_ID,
      groupId: BASE_GROUP_ID,
      newGalleryModal: false,
      selectGalleryModal: false,
      newGroupModal: false,
      page: 0,
      imageSelection: null,
      multiSelect: false,
      alerts: [],
      galleryname: '',
      groupUsersModal: false,
      invitesModal: false,
      invites: []
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
    this.getNewGroupName = this.getNewGroupName.bind(this);
    this.addNewGroup = this.addNewGroup.bind(this);
    this.changeGroup = this.changeGroup.bind(this);
    this.inputChange = this.inputChange.bind(this);
    this.getInvitesModal = this.getInvitesModal.bind(this);
    this.joinGroup = this.joinGroup.bind(this);
    this.refuseInvite = this.refuseInvite.bind(this);
    this.inviteRefresh = this.inviteRefresh.bind(this);

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
    this.setState({ galleryname: '', newGalleryModal: true });
  }

  getNewGroupName() {
    this.setState({ galleryname: '', newGroupModal: true });
  }

  getInvitesModal() {
    this.setState({ invitesModal: true });
  }

  showGallerySelector(evt) {
    this.setState({
      selectGalleryModal: true,
      imageSelection: evt.detail
    });
  }

  addNewGallery(event, cb) {
    event.preventDefault();
    const galleryname = event.target.galleryname.value;
    return Galleries.add(galleryname, (new_gallery, err_msg) => {
      this.setState({ newGalleryModal: false, page: 0 });
      if (err_msg) {
        danger(err_msg);
        return cb(err_msg);
      }
      if (this.state.galleryId === BASE_GALLERY_ID) {
        success(`Gallery ${galleryname} added`);
        this.state.galleryname = '';
        if (typeof cb === 'function') return cb();
        return null;
      }
      return Galleries.addSubGallery(
        this.state.galleryId, new_gallery.$loki,
        (updated_gallery, sub_err_msg) => {
          if (sub_err_msg) return danger(sub_err_msg);
          this.state.galleryname = '';
          success(`Gallery ${galleryname} added`);
          if (typeof cb === 'function') return cb();
          return null;
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
      newGroupModal: false,
      selectGalleryModal: false,
      imageSelection: null,
      multiSelect: false,
      invitesModal: false
    });
  }

  toggleSelectMode() {
    this.setState({
      multiSelect: !this.state.multiSelect
    });
  }

  gallerynameValidationState() {
    const galname = this.state.galleryname;
    if (galname.trim() === '') return 'error';
    else if (galname.length < 3) return 'warning';
    return 'success';
  }

  addNewGroup(event) {
    event.preventDefault();
    const galleryname = event.target.galleryname.value;

    Groups.create(galleryname, (err, msg) => {
      if (err) {
        danger(msg);
      } else {
        success(msg);
        this.setState({ newGroupModal: false });
      }
    });
  }

  changeGroup(groupId) {
    // This if prevents deleted galleries/non-existent Ids
    // causing big issues
    if (groupId) {
      this.setState({
        groupId,
        imageSelection: null,
        multiSelect: false,
        page: 1
      });
    }
  }

  inputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  joinGroup(gid, groupname) {
    Groups.join(gid, groupname, (err, msg) => {
      if (err) {
        danger(msg);
      } else {
        success(msg);
        this.setState({ invitesModal: true });
        this.inviteRefresh();
      }
    });
  }

  refuseInvite(gid, groupname) {
    Groups.refuse(gid, groupname, (err, msg) => {
      if (err) {
        danger(msg);
      } else {
        success(msg);
        this.setState({ invitesModal: true });
        this.inviteRefresh();
      }
    });
  }

  inviteRefresh() {
    if (Host.isAuthed()) {
      // gotta show all invites with accept or deny button
      Groups.getAllInvites((err, msg, data) => {
        success('Invites refreshed');
        this.setState({ invites: data });
      });
    } else {
      danger('Not logged in');
    }
  }

  profileView() {
    // This is to show the profile details
    this.setState({ page: 2 });
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
              <NavDropdown title="Groups" id="groups">
                <MenuItem onClick={_ => this.changeGroup(BASE_GROUP_ID)}>View</MenuItem>
                <MenuItem onClick={this.getNewGroupName}>Add</MenuItem>
                <MenuItem onClick={this.getInvitesModal}>Invites</MenuItem>
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
            <form onSubmit={this.addNewGallery}>
              <FormGroup
                validationState={this.gallerynameValidationState()}
              >
                <FormControl
                  id="galleryName"
                  name="galleryname"
                  type="text"
                  placeholder="Gallery Name"
                  value={this.state.galleryname}
                  onChange={this.inputChange}
                />
              </FormGroup>
              <Button type="submit">
                Add
              </Button>
            </form>
          </Modal.Body>
        </Modal>

        <Modal show={this.state.newGroupModal} onHide={this.hideModals}>
          <Modal.Header closeButton>
            <Modal.Title>Adding New Group</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <form onSubmit={this.addNewGroup}>
              <FormGroup
                validationState={this.gallerynameValidationState()}
              >
                <FormControl
                  id="galleryName"
                  name="galleryname"
                  type="text"
                  placeholder="Group Name"
                  value={this.state.galleryname}
                  onChange={this.inputChange}
                />
              </FormGroup>
              <Button type="submit">
                Add
              </Button>
            </form>
          </Modal.Body>
        </Modal>

        <Modal show={this.state.invitesModal} onHide={this.hideModals}>
          <Modal.Header closeButton>
            <Modal.Title>Invites</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <InvitesContent parent={this} />
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

InvitesContent.PropTypes = {
  parent: React.PropTypes.instanceOf(Main).isRequired
};

export default Main;
