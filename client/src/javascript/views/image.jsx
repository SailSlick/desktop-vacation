import React from 'react';
import { Modal, MenuItem, Button, Glyphicon, Image as BsImage } from 'react-bootstrap';
import Wallpaper from '../helpers/wallpaper-client';

const append_gallery_event_name = 'append_gallery';

class Image extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      expanded: false,
      deleteConfirmation: false
    };

    this.onClick = this.onClick.bind(this);
    this.setAsWallpaper = this.setAsWallpaper.bind(this);
    this.addToGallery = this.addToGallery.bind(this);
    this.expand = this.expand.bind(this);
    this.hideModals = this.hideModals.bind(this);
    this.remove = this.remove.bind(this);
    this.deleteConfirmation = this.deleteConfirmation.bind(this);
    this.confirmDelete = this.confirmDelete.bind(this);
  }

  onClick() {
    if (this.props.multiSelect) {
      this.props.onSelect(this.props.dbId);
    } else {
      this.expand();
    }
  }

  setAsWallpaper() {
    Wallpaper.set(this.props.src);
  }

  addToGallery() {
    document.dispatchEvent(new CustomEvent(
      append_gallery_event_name,
      { detail: [this.props.dbId] }
    ));
  }

  expand() {
    this.setState({ expanded: true });
  }

  hideModals() {
    this.setState({
      expanded: false,
      deleteConfirmation: false
    });
  }

  remove() {
    this.props.onRemove(this.props.dbId, false);
  }

  deleteConfirmation() {
    this.setState({ deleteConfirmation: true });
  }

  confirmDelete() {
    this.props.onRemove(this.props.dbId, true);
    this.setState({ deleteConfirmation: false });
  }

  render() {
    let classes = 'figure img-card rounded';
    if (this.props.selected) classes += ' selected';
    return (
      <figure className={classes}>
        <BsImage responsive src={this.props.src} alt="MISSING" onClick={this.onClick} />
        <figcaption className="figure-caption rounded-circle">
          ...
          <div className="dropdown-menu img-menu">
            <MenuItem onClick={this.setAsWallpaper}>
              <Glyphicon glyph="picture" />Set as Wallpaper
            </MenuItem>
            <MenuItem onClick={this.addToGallery}>
              <Glyphicon glyph="th" />Add to gallery
            </MenuItem>
            <MenuItem divider />
            <MenuItem onClick={this.remove}>
              <Glyphicon glyph="remove" />Remove
            </MenuItem>
            <MenuItem onClick={this.deleteConfirmation}>
              <Glyphicon glyph="trash" />Remove &amp; Delete
            </MenuItem>
          </div>
        </figcaption>

        <Modal className="big-modal" show={this.state.expanded} onHide={this.hideModals}>
          <Modal.Header closeButton>
            <Modal.Title>{this.props.src}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <BsImage responsive src={this.props.src} alt="MISSING" />
          </Modal.Body>
        </Modal>

        <Modal show={this.state.deleteConfirmation} onHide={this.hideModals}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Deletion</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Are you sure you want to delete <code>{this.props.src}</code>?</p>
            <BsImage className="small-preview" src={this.props.src} alt="MISSING" />
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.hideModals}>Cancel</Button>
            <Button onClick={this.confirmDelete} bsStyle="primary">Yes, I&#39;m sure</Button>
          </Modal.Footer>
        </Modal>

      </figure>
    );
  }
}

Image.propTypes = {
  dbId: React.PropTypes.number.isRequired,
  src: React.PropTypes.string.isRequired,
  onRemove: React.PropTypes.func.isRequired,
  onSelect: React.PropTypes.func,
  multiSelect: React.PropTypes.bool,
  selected: React.PropTypes.bool
};

Image.defaultProps = {
  onSelect: _ => true,
  multiSelect: false,
  selected: false
};

export default Image;
