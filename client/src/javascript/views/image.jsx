import React from 'react';
import { Modal, MenuItem, Glyphicon, Image as BsImage } from 'react-bootstrap';
import Wallpaper from '../helpers/wallpaper-client';

const append_gallery_event_name = 'append_gallery';

class Image extends React.Component {
  constructor(props) {
    super(props);

    this.state = { expanded: false };

    this.onClick = this.onClick.bind(this);
    this.setAsWallpaper = this.setAsWallpaper.bind(this);
    this.addToGallery = this.addToGallery.bind(this);
    this.expand = this.expand.bind(this);
    this.hideModals = this.hideModals.bind(this);
    this.remove = this.remove.bind(this);
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
    return this.setState({ expanded: true });
  }

  hideModals() {
    return this.setState({ expanded: false });
  }

  remove() {
    this.props.onRemove(this.props.dbId);
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
