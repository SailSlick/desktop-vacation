import React from 'react';
import { ObjectId } from 'lokijs';
import { Modal, MenuItem, Image as BsImage } from 'react-bootstrap';
import Wallpaper from '../helpers/wallpaper-client';
import Galleries from '../models/galleries';
import SimpleGalleryCard from './gallerycard-simple.jsx';

class Image extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      expanded: false,
      gallerySelector: false,
      subgalleries: []
    };

    this.setAsWallpaper = this.setAsWallpaper.bind(this);
    this.showGallerySelector = this.showGallerySelector.bind(this);
    this.expand = this.expand.bind(this);
    this.hideModals = this.hideModals.bind(this);
    this.remove = this.remove.bind(this);
  }

  setAsWallpaper() {
    Wallpaper.set(this.props.src);
  }

  showGallerySelector() {
    Galleries.getSubgalleries(null, (subgalleries) => {
      console.log(subgalleries);
      this.setState({
        expanded: false,
        gallerySelector: true,
        subgalleries
      });
    });
  }

  addToGallery(name) {
    Galleries.addItem(name, this.props.src);
    return this.hideModals();
  }

  expand() {
    return this.setState({ expanded: true });
  }

  hideModals() {
    return this.setState({
      expanded: false,
      gallerySelector: false,
      subgalleries: []
    });
  }

  remove() {
    this.props.onRemove(this.props.id);
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
            <MenuItem onClick={this.showGallerySelector}>
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

        <Modal show={this.state.gallerySelector} onHide={this.hideModals}>
          <Modal.Header closeButton>
            <Modal.Title>Select a Gallery</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {this.state.subgalleries.map(gallery =>
              <SimpleGalleryCard
                key={gallery.$loki}
                name={gallery.name}
                thumbnail={gallery.thumbnail}
                onClick={_ =>
                  this.addToGallery(gallery.name)
                }
              />
            )}
          </Modal.Body>
        </Modal>
      </figure>
    );
  }
}

Image.propTypes = {
  id: React.PropTypes.number.isRequired,
  src: React.PropTypes.string.isRequired,
  onRemove: React.PropTypes.func.isRequired
};

export default Image;
