import React from 'react';
import { Modal, MenuItem, Image as BsImage } from 'react-bootstrap';
import Wallpaper from '../helpers/wallpaper-client';

const append_gallery_event_name = 'append_gallery';

class Image extends React.Component {
  constructor(props) {
    super(props);

    this.state = { expanded: false };

    this.setAsWallpaper = this.setAsWallpaper.bind(this);
    this.addToGallery = this.addToGallery.bind(this);
    this.expand = this.expand.bind(this);
    this.hideModals = this.hideModals.bind(this);
    this.remove = this.remove.bind(this);
  }

  setAsWallpaper() {
    Wallpaper.set(this.props.src);
  }

  addToGallery() {
    document.dispatchEvent(new CustomEvent(
      append_gallery_event_name,
      { detail: this.props.dbId }
    ));
  }

  expand() {
    return this.setState({ expanded: true });
  }

  hideModals() {
    return this.setState({ expanded: false });
  }

  remove() {
    this.props.onRemove(this.props.dbId);
  }

  render() {
    return (
      <figure className="figure img-card rounded">
        <BsImage responsive src={this.props.src} alt="MISSING" onClick={this.expand} />
        <figcaption className="figure-caption rounded-circle">
          ...
          <div className="dropdown-menu img-menu">
            <MenuItem onClick={this.setAsWallpaper}>
              Set as Wallpaper
            </MenuItem>
            <MenuItem onClick={this.addToGallery}>
              Add to gallery
            </MenuItem>
            <MenuItem divider />
            <MenuItem onClick={this.remove}>
              Remove
            </MenuItem>
          </div>
        </figcaption>

        <Modal show={this.state.expanded} onHide={this.hideModals}>
          <Modal.Header closeButton>
            <Modal.Title>{this.props.src}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <BsImage responsive src={this.props.src} alt="MISSING" />
          </Modal.Body>
        </Modal>

      </figure>
    );
  }
}

Image.propTypes = {
  dbId: React.PropTypes.number.isRequired,
  src: React.PropTypes.string.isRequired,
  onRemove: React.PropTypes.func.isRequired
};

export default Image;
