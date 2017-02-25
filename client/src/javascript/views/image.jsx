import React from 'react';
import { ObjectId } from 'lokijs';
import { Button, Modal } from 'react-bootstrap';
import Wallpaper from '../helpers/wallpaper-client';
import Images from '../models/images';
import Galleries from '../models/galleries';
import SimpleGalleryCard from './gallerycard-simple';

class Image extends React.Component {
  getInitialState() {
    return {
      expanded: false,
      gallerySelector: false,
      subgalleries: []
    };
  }

  setAsWallpaper() {
    Wallpaper.set(this.props.src);
  }

  showGallerySelector() {
    Galleries.getSubgalleries(null, subgalleries =>
      this.setState({
        expanded: false,
        gallerySelector: true,
        subgalleries
      })
    );
  }

  addToGallery(name) {
    Galleries.add(name, this.props.src);
    return this.collapse();
  }

  expand() {
    return this.setState({
      expanded: true,
      gallerySelector: false,
      subgalleries: []
    });
  }

  collapse() {
    return this.setState(this.getInitialState());
  }

  remove() {
    Images.remove(this.props.src);
    this.props.onRemove();
  }

  render() {
    return (
      <figure className="figure img-card rounded" data-id={this.props.id}>
        <img className="img-fluid" src={this.props.src} alt="MISSING" onClick={this.expand} />
        <figcaption className="figure-caption rounded-circle">
          ...
          <div className="dropdown-menu img-menu">
            <button
              className="dropdown-item btn-img-setwp"
              type="button"
              onClick={this.setAsWallpaper}
            >
              Set as Wallpaper
            </button>
            <button
              className="dropdown-item btn-img-addtogallery"
              type="button"
              onClick={this.showGallerySelector}
            >
              Add to gallery
            </button>
            <button
              className="dropdown-item btn-img-remove"
              type="button"
              onClick={this.remove}
            >
              Remove
            </button>
          </div>
        </figcaption>

        <Modal show={this.state.expanded} onHide={this.collapse}>
          <Modal.Header closeButton>
            <Modal.Title>{this.props.src}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h1>HELLO</h1>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.collapse}>Close</Button>
          </Modal.Footer>
        </Modal>

        <Modal show={this.state.gallerySelector} onHide={this.collapse}>
          <Modal.Header closeButton>
            <Modal.Title>Select a Gallery</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {this.state.subgalleries.map(gallery =>
              <SimpleGalleryCard
                onClick={_ =>
                  this.addToGallery(gallery.name)
                }
              />
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.collapse}>Close</Button>
          </Modal.Footer>
        </Modal>
      </figure>
    );
  }
}

Image.propTypes = {
  id: React.PropTypes.objectOf(ObjectId).isRequired,
  src: React.PropTypes.string.isRequired,
  onRemove: React.PropTypes.func.isRequired
};

export default { Image };
