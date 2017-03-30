import React from 'react';
import { clipboard } from 'electron';
import { Modal, MenuItem, Button, Glyphicon, Image as BsImage } from 'react-bootstrap';
import Images from '../models/images';
import Wallpaper from '../helpers/wallpaper-client';
import Sync from '../helpers/sync';
import { success, danger } from '../helpers/notifier';

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
    this.upload = this.upload.bind(this);
    this.deleteConfirmation = this.deleteConfirmation.bind(this);
    this.confirmDelete = this.confirmDelete.bind(this);
    this.share = this.share.bind(this);
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

  upload() {
    this.props.onUpload(this.props.dbId);
  }

  share() {
    if (!this.props.remoteId) {
      return danger('You need to sync an image to share it!');
    } else if (this.props.url) {
      success('Image link copied to clipboard!');
      return clipboard.writeText(this.props.url);
    }
    return Sync.shareImage(this.props.remoteId, (err, url) => {
      if (err) return danger(err);
      return Images.update(
        this.props.dbId,
        { sharedUrl: url },
        () => {
          success('Image link copied to clipboard!');
          clipboard.writeText(url);
        }
      );
    });
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
              <Glyphicon glyph="picture" />
              Set as Wallpaper
            </MenuItem>
            <MenuItem onClick={this.addToGallery}>
              <Glyphicon glyph="th" />
              Add to gallery
            </MenuItem>
            <MenuItem onClick={this.upload}>
              <Glyphicon glyph="upload" />
              Sync
            </MenuItem>
            <MenuItem onClick={this.share}>
              <Glyphicon glyph="share" />
              Share
            </MenuItem>
            <MenuItem divider />
            <MenuItem onClick={this.remove}>
              <Glyphicon glyph="remove" />
              Remove
            </MenuItem>
            <MenuItem onClick={this.deleteConfirmation}>
              <Glyphicon glyph="trash" />
              Remove &amp; Delete
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
  onUpload: React.PropTypes.func.isRequired,
  onRemove: React.PropTypes.func.isRequired,
  onSelect: React.PropTypes.func,
  url: React.PropTypes.string,
  remoteId: React.PropTypes.string,
  multiSelect: React.PropTypes.bool,
  selected: React.PropTypes.bool
};

Image.defaultProps = {
  onSelect: _ => true,
  multiSelect: false,
  selected: false,
  url: null,
  remoteId: null
};

export default Image;
